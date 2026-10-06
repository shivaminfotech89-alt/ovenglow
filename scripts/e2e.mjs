/**
 * The bug this whole change exists to fix, proved fixed.
 *
 * Before Firestore, an order placed on a customer's phone was written to that
 * phone's localStorage and nowhere else. The shop, on a different device, saw
 * nothing. That was demonstrated in an earlier session with exactly this setup:
 * two browser contexts, the customer in one and the admin in the other, and the
 * admin's order count stayed at zero.
 *
 * So the test is the same shape, and the assertion is inverted.
 *
 * Runs against the emulator, not the live project, so it never books a real
 * order. Start it with:
 *
 *   firebase emulators:exec --only firestore,auth "node scripts/e2e.mjs"
 *
 * with a dev server on 5199 built with VITE_USE_EMULATOR=1.
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';

/** Mirrors orderLookupKey() in src/lib/orderLookup.ts. */
function lookupKey(orderNumber, phone) {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return createHash('sha256').update(`${orderNumber.trim().toUpperCase()}|${digits}`).digest('hex');
}

const BASE = 'http://127.0.0.1:5199/';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OWNER = { email: 'shivaminfotech89@gmail.com', password: 'test-password-123' };
const PROJECT = 'ovenglowdelights-9423a';
const SHOTS = process.env.SHOT_DIR ?? '/tmp';

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok    ${name}`);
    passed += 1;
  } else {
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`);
    failed += 1;
  }
}

/** Create and verify the owner's login directly against the Auth emulator. */
async function seedOwner() {
  const key = 'fake-api-key';
  const signUp = await fetch(
    `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...OWNER, returnSecureToken: true }),
    },
  ).then((r) => r.json());

  if (!signUp.idToken) throw new Error(`Could not create the owner: ${JSON.stringify(signUp)}`);

  // The rules require a verified address before an owner counts as staff.
  // `accounts:update` with an idToken silently ignores emailVerified -- it
  // returned false and every later assertion failed for the right reason, which
  // cost a debugging round. The emulator's project-scoped admin endpoint is the
  // one that actually sets it.
  const updated = await fetch(
    `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ localId: signUp.localId, emailVerified: true }),
    },
  ).then((r) => r.json());

  if (updated.emailVerified !== true) {
    throw new Error(`Could not verify the owner: ${JSON.stringify(updated)}`);
  }
}

const REST = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;

/** Write a document straight to the emulator, bypassing the rules. */
async function seedDoc(path, fields) {
  const res = await fetch(`${REST}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`seedDoc ${path}: ${await res.text()}`);
}

/**
 * Place an order the way a customer's browser does: unauthenticated, straight
 * at the database. No owner token, so the `create` rule has to allow it on its
 * own merits.
 */
async function placeOrderAsStranger(orderNumber) {
  const str = (stringValue) => ({ stringValue });
  const res = await fetch(`${REST}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        orderNumber: str(orderNumber),
        customer: {
          mapValue: {
            fields: {
              name: str('Test Customer'),
              phone: str('9812345678'),
              address: str('4 Test Road'),
              city: str('Ahmedabad'),
              state: str('Gujarat'),
              pincode: str('380054'),
              enableWhatsAppUpdates: { booleanValue: true },
            },
          },
        },
        items: { arrayValue: { values: [] } },
        itemTotal: { integerValue: '500' },
        discount: { integerValue: '0' },
        couponCode: { nullValue: null },
        deliveryFee: { integerValue: '0' },
        tax: { integerValue: '25' },
        totalAmount: { integerValue: '500' },
        paymentMethod: str('UPI'),
        payment: { mapValue: { fields: { method: str('UPI') } } },
        stage: str('inquiry_received'),
        createdAt: str(new Date().toISOString()),
        updatedAt: str(new Date().toISOString()),
        estimatedDeliveryTime: str('30 - 45 Minutes'),
        deliveryOtp: str('123456'),
        deliveryPartner: {
          mapValue: {
            fields: { name: str('Ovenglow Delivery'), phone: str('9824704877'), vehicleNumber: str('Own rider') },
          },
        },
        stageHistory: { arrayValue: { values: [] } },
      },
    }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

const browser = await chromium.launch({ executablePath: CHROME });

async function openContext(label) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' && !t.includes('ERR_CERT') && !t.includes('analytics')) errors.push(t);
  });
  page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));
  // Not `networkidle`: a live Firestore listener holds its connection open for
  // as long as the page is up, so the network is never idle by design.
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  return { ctx, page, errors, label };
}

await seedOwner();

/* ---------------------------------------------- the shop, as an admin sees it */

// The storefront must not advertise the admin at all: no Staff button in the
// navigation, none in the phone's tab bar, none in the footer.
const shopper = await openContext('shopper');
const advertised = await shopper.page.evaluate(() => {
  const words = /staff|admin|console|sign\s*in to the console/i;
  return [...document.querySelectorAll('button, a')]
    .filter((el) => (el.offsetWidth || el.offsetHeight) && words.test(el.textContent || ''))
    .map((el) => (el.textContent || '').trim().slice(0, 40));
});
check(
  'the storefront shows no way into the admin',
  advertised.length === 0,
  `found: ${JSON.stringify(advertised)}`,
);
await shopper.page.screenshot({ path: `${SHOTS}/e2e-shopfront.png` });
await shopper.ctx.close();

// ...but the address still opens it.
const admin = await openContext('admin');
await admin.page.goto(`${BASE}#staff`, { waitUntil: 'domcontentloaded' });
await admin.page.waitForTimeout(1800);
check(
  'the /#staff address opens the sign-in screen',
  await admin.page.evaluate(() => /staff sign in/i.test(document.body.innerText)),
);

check(
  'the login screen asks for a password',
  await admin.page.locator('input[type=password]').isVisible(),
);

const loginCard = await admin.page.evaluate(() => {
  const heading = [...document.querySelectorAll('h2')].find((h) =>
    /sign in/i.test(h.textContent ?? ''),
  );
  return heading?.closest('div')?.parentElement?.innerText ?? '';
});
check(
  'the login screen no longer lists staff accounts',
  !/@/.test(loginCard),
  loginCard.slice(0, 160),
);

await admin.page.fill('input[type=email]', OWNER.email);
await admin.page.fill('input[type=password]', OWNER.password);
await admin.page.click('button[type=submit]');
await admin.page.waitForTimeout(4000);

const signedIn = await admin.page.evaluate(() => document.body.innerText.includes('Dashboard'));
check('the owner reaches the console with the right password', signedIn);

// The seed runs once an editor is signed in, so the catalogue should fill.
// Counted in the database rather than scraped off the dashboard, which reports
// several different numbers and would make this assertion about wording.
await admin.page.waitForTimeout(5000);
const seeded = await fetch(`${REST}/products?pageSize=100`, {
  headers: { Authorization: 'Bearer owner' },
}).then((r) => r.json());
const seededCount = seeded.documents?.length ?? 0;
check('the catalogue seeded itself on first sign-in', seededCount > 0, `saw ${seededCount}`);

// Publish one product so a customer has something to buy.
await admin.page.locator('button:visible', { hasText: /Products/ }).first().click();
await admin.page.waitForTimeout(1500);
await admin.page.screenshot({ path: `${SHOTS}/e2e-admin-products.png` });

/* ------------------------------------------- a customer, in a different browser */

// The seeded catalogue is deliberately unpriced and unpublished, so it is
// invisible to a shopper by design -- `isBuyable` needs a price and a publish.
// Putting one product on sale is what makes the shop front testable.
await seedDoc('products/e2e-brownie', {
  sku: { stringValue: 'E2E-1' },
  name: { stringValue: 'Test Fudgy Brownie' },
  tagline: { stringValue: 'For the test' },
  description: { stringValue: 'A brownie that exists to be bought.' },
  price: { integerValue: '250' },
  originalPrice: { integerValue: '250' },
  category: { stringValue: 'brownie-indulgence' },
  image: { stringValue: '' },
  secondaryImages: { arrayValue: { values: [] } },
  isPublished: { booleanValue: true },
  stockCount: { integerValue: '10' },
  isVeg: { booleanValue: true },
  rating: { integerValue: '5' },
  reviewCount: { integerValue: '1' },
  weightGrams: { integerValue: '200' },
  shelfLife: { stringValue: '3 days' },
  layers: { arrayValue: { values: [] } },
  flavorNotes: { arrayValue: { values: [] } },
});

const customer = await openContext('customer');
await customer.page.waitForTimeout(3000);

const customerSeesProduct = await customer.page.evaluate(() =>
  document.body.innerText.includes('Test Fudgy Brownie'),
);
check(
  "a product published by the shop appears in a customer's browser",
  customerSeesProduct,
  'the customer never saw it',
);

await customer.page.screenshot({ path: `${SHOTS}/e2e-customer-shop.png` });

/* --------------------------------- the bug this whole change exists to fix -- */

// Placed by someone not signed in, as a customer at checkout is.
const orderNumber = `OG-TEST-${Date.now().toString().slice(-6)}`;
const placed = await placeOrderAsStranger(orderNumber);
check('a stranger can place an order', placed.ok, `${placed.status} ${placed.body.slice(0, 160)}`);

// The admin is a different browser that nobody touched. Before Firestore its
// order count stayed at zero forever; the listener should now bring it in with
// no reload.
await admin.page.locator('button:visible', { hasText: /^Orders$/ }).first().click();
await admin.page.waitForTimeout(4000);
const adminSeesOrder = await admin.page.evaluate(
  (n) => document.body.innerText.includes(n),
  orderNumber,
);
check(
  "an order placed elsewhere reaches the admin's screen live",
  adminSeesOrder,
  'the admin never saw it',
);
await admin.page.screenshot({ path: `${SHOTS}/e2e-admin-orders.png` });

/* ------------------------------------- paying in advance, as a customer does */

// The shop's UPI id is what turns the payment panel on. Seeded rather than
// typed through Settings so this test is about the customer's side.
await seedDoc('settings/store', {
  storeName: { stringValue: 'Ovenglow Delights' },
  upiId: { stringValue: 'ovenglowdelights@okhdfcbank' },
  upiAccountName: { stringValue: 'Ovenglow Delights' },
  paymentInstructions: { stringValue: 'Scan, pay, then send us the reference.' },
  whatsappNumber: { stringValue: '9824704877' },
  city: { stringValue: 'Ahmedabad' },
});

const payNumber = `OG-PAY-${Date.now().toString().slice(-6)}`;
const payPhone = '9812345678';

// Placed the way a customer places one. Creating it directly at
// awaiting_payment is refused by the rules -- every order must start at
// inquiry_received -- which is correct, and cost this test a round when it
// tried to shortcut. Staff move it on, so the move is made with staff
// authority.
const placedForPay = await placeOrderAsStranger(payNumber);
check('the order for payment was accepted', placedForPay.ok, placedForPay.body.slice(0, 160));
const payOrderId = JSON.parse(placedForPay.body).name.split('/').pop();
await fetch(`${REST}/orders/${payOrderId}?updateMask.fieldPaths=stage`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
  body: JSON.stringify({ fields: { stage: { stringValue: 'awaiting_payment' } } }),
});
await seedDoc(`orderLookup/${lookupKey(payNumber, payPhone)}`, {
  orderId: { stringValue: payOrderId },
});

const tracker = await openContext('tracker');
await tracker.page.locator('button:visible', { hasText: /^Track/ }).first().click();
await tracker.page.waitForTimeout(900);
await tracker.page.fill('input[aria-label="Order number"]', payNumber);
await tracker.page.fill('input[aria-label="Mobile number"]', payPhone);
await tracker.page.click('form button[type=submit]');
await tracker.page.waitForTimeout(3500);

check(
  'an order is found with its number AND phone',
  await tracker.page.evaluate((n) => document.body.innerText.includes(n), payNumber),
);

const qr = await tracker.page.evaluate(() => {
  const svg = document.querySelector('svg[aria-label="UPI payment QR code"]');
  return svg ? svg.outerHTML : null;
});
check('a UPI QR is shown for the amount owed', !!qr);
if (qr) {
  await tracker.page
    .locator('svg[aria-label="UPI payment QR code"]')
    .screenshot({ path: `${SHOTS}/e2e-upi-qr.png` });
}
await tracker.page.screenshot({ path: `${SHOTS}/e2e-tracking-pay.png` });

// The wrong phone number must find nothing, which is the whole point of
// asking for it: order numbers run in sequence and would otherwise be a key.
await tracker.page.fill('input[aria-label="Mobile number"]', '9000000000');
await tracker.page.click('form button[type=submit]');
await tracker.page.waitForTimeout(2500);
check(
  'the wrong phone number finds nothing',
  await tracker.page.evaluate(() => /no order matches/i.test(document.body.innerText)),
);

/* ------------------------------------- checkout, driven the way a customer does */

// Every order in this file until now was written straight to the database,
// which is why a crash in the checkout screen itself went unnoticed: a hook
// declared below `if (!isOpen) return null` changed the hook count when the
// modal opened, and pressing "Proceed to checkout" blanked the whole page.
// Nothing short of clicking the real buttons would have found it.
await seedDoc('products/e2e-checkout', {
  sku: { stringValue: 'E2E-CO' },
  name: { stringValue: 'Checkout Test Brownie' },
  tagline: { stringValue: 'For the test' },
  description: { stringValue: 'Exists to be bought.' },
  price: { integerValue: '250' },
  originalPrice: { integerValue: '250' },
  category: { stringValue: 'brownie-indulgence' },
  image: { stringValue: '' },
  secondaryImages: { arrayValue: { values: [] } },
  isPublished: { booleanValue: true },
  stockCount: { integerValue: '10' },
  isVeg: { booleanValue: true },
  rating: { integerValue: '5' },
  reviewCount: { integerValue: '1' },
  weightGrams: { integerValue: '200' },
  shelfLife: { stringValue: '3 days' },
  layers: { arrayValue: { values: [] } },
  flavorNotes: { arrayValue: { values: [] } },
});

const buyer = await openContext('buyer');
await buyer.page.waitForTimeout(2500);

await buyer.page.locator('#btn-add-product-e2e-checkout').click();
await buyer.page.waitForTimeout(900);

// Adding must not take the screen away: the catalogue stays, and the card's
// own stepper is what lets someone add a second and a third.
check(
  'adding to the bag does not hijack the page',
  await buyer.page.evaluate(() => !document.querySelector('#cart-drawer-overlay')),
);
check(
  'the card turns into a quantity stepper',
  await buyer.page.locator('button[aria-label="Increase quantity"]').first().isVisible(),
);

await buyer.page.locator('button[aria-label="Increase quantity"]').first().click();
await buyer.page.waitForTimeout(600);
check(
  'a second of the same item can be added without opening the bag',
  await buyer.page.evaluate(() => !document.querySelector('#cart-drawer-overlay')),
);

await buyer.page.locator('#nav-btn-open-cart').click();
await buyer.page.waitForTimeout(900);
await buyer.page.locator('#btn-cart-proceed-checkout').click();
await buyer.page.waitForTimeout(1200);

check(
  'proceeding to checkout opens the form instead of crashing',
  await buyer.page.evaluate(() => document.body.innerText.trim().length > 0),
  'the page went blank',
);
await buyer.page.screenshot({ path: `${SHOTS}/e2e-checkout-form.png` });

/**
 * The rest of a real checkout.
 *
 * The form used to be filled positionally and then abandoned, because the
 * inputs carried no ids -- "Test Buyer" went into the search box in the header
 * and the phone field was never found at all. Nothing ever pressed "Place
 * order", and so nothing ever noticed that pressing it failed every time:
 * `stripForFirestore` did not recurse into arrays, `items[0].customMessage` is
 * undefined on any item without a gift message, and Firestore rejects
 * undefined. Every order on the live site was lost at the last step.
 */
await buyer.page.fill('#checkout-name', 'Test Buyer');
await buyer.page.fill('#checkout-phone', '9812345678');
await buyer.page.fill('#checkout-address', '4 Test Road');
await buyer.page.fill('#checkout-pincode', '380054');
await buyer.page.screenshot({ path: `${SHOTS}/e2e-checkout-filled.png` });

await buyer.page.locator('#btn-checkout-continue').click();
await buyer.page.waitForTimeout(900);
check(
  'the payment step offers a way to pay',
  await buyer.page.locator('#btn-place-order').isVisible(),
);

await buyer.page.locator('#btn-place-order').click();
await buyer.page.waitForTimeout(4000);
await buyer.page.screenshot({ path: `${SHOTS}/e2e-order-placed.png` });

const placedText = await buyer.page.evaluate(() => document.body.innerText);
const placedNumber = (placedText.match(/OG-\d{8}-\d+/) ?? [])[0];
check(
  'the order is actually placed',
  Boolean(placedNumber),
  `no order number on the confirmation. Page said: ${placedText.slice(0, 200)}`,
);

const storedOrders = await fetch(`${REST}/orders`, {
  headers: { Authorization: 'Bearer owner' },
}).then((r) => r.json());
check(
  'the order reached the database',
  (storedOrders.documents ?? []).some(
    (d) => d.fields?.orderNumber?.stringValue === placedNumber,
  ),
  'the confirmation screen showed a number for an order that was never written',
);

// And a stranger on another device can find it with the two things they have.
if (placedNumber) {
  const finder = await openContext('finder');
  await finder.page.locator('button:visible', { hasText: /^Track/ }).first().click();
  await finder.page.waitForTimeout(800);
  await finder.page.fill('input[aria-label="Order number"]', placedNumber);
  await finder.page.fill('input[aria-label="Mobile number"]', '9812345678');
  await finder.page.click('form button[type=submit]');
  await finder.page.waitForTimeout(3000);
  check(
    'a real order can be tracked with its number and phone',
    await finder.page.evaluate((n) => document.body.innerText.includes(n), placedNumber),
    'the lookup document was never written, so the order cannot be found',
  );
  await finder.page.screenshot({ path: `${SHOTS}/e2e-track-real-order.png` });
  await finder.ctx.close();
}

/* -------------------------------------------- a customer with an account */

/**
 * The requirement in the shop's own words: stay signed in, and after signing
 * out and back in, the order history is still there.
 *
 * Both halves are checked against the real thing. Staying signed in is a page
 * reload, not a mocked call; the history is a Firestore query the security
 * rules allow only where the order's `customerUid` matches the token -- so if
 * the stamp or the rule were wrong, the list would come back empty here.
 */
const MEMBER = { email: `member${Date.now()}@example.com`, password: 'member-pass-123' };
const member = await openContext('member');
await member.page.waitForTimeout(2000);

await member.page.locator('#nav-btn-customer-account').click();
await member.page.waitForTimeout(600);
await member.page.locator('button', { hasText: 'Create an account' }).click();
await member.page.fill('#customer-name', 'Member Buyer');
await member.page.fill('#customer-email', MEMBER.email);
await member.page.fill('#customer-password', MEMBER.password);
await member.page.locator('#btn-customer-email-submit').click();
await member.page.waitForTimeout(3000);
await member.page.screenshot({ path: `${SHOTS}/e2e-member-registered.png` });

check(
  'creating an account signs the customer in',
  await member.page.evaluate(() => /member/i.test(document.body.innerText)),
  (await member.page.evaluate(() => document.body.innerText)).slice(0, 220),
);

// Stay signed in: a reload is the cheapest honest test of persistence.
await member.page.reload({ waitUntil: 'domcontentloaded' });
await member.page.waitForTimeout(2500);
check(
  'the customer is still signed in after a reload',
  await member.page.evaluate(() => /member/i.test(document.body.innerText)),
  'the session did not survive a page load',
);

await member.page.locator('#btn-add-product-e2e-checkout').click();
await member.page.waitForTimeout(700);
await member.page.locator('#nav-btn-open-cart').click();
await member.page.waitForTimeout(700);
await member.page.locator('#btn-cart-proceed-checkout').click();
await member.page.waitForTimeout(900);
await member.page.fill('#checkout-name', 'Member Buyer');
await member.page.fill('#checkout-phone', '9700000001');
await member.page.fill('#checkout-address', '9 Member Lane');
await member.page.fill('#checkout-pincode', '380054');
await member.page.locator('#btn-checkout-continue').click();
await member.page.waitForTimeout(900);
await member.page.locator('#btn-place-order').click();
await member.page.waitForTimeout(4500);

const memberNumber = (
  (await member.page.evaluate(() => document.body.innerText)).match(/OG-\d{8}-\d+/) ?? []
)[0];
check('a signed-in customer can order', Boolean(memberNumber));

// The confirmation screen is still up and covering the page; its own button is
// how a customer leaves it, so it is how the test leaves it too.
await member.page.locator('#btn-track-my-order').click();
await member.page.waitForTimeout(2500);
await member.page.screenshot({ path: `${SHOTS}/e2e-member-orders.png` });
check(
  'their order is listed on their account without typing anything',
  await member.page.evaluate(
    () => /your orders/i.test(document.body.innerText),
  ),
);

// Sign out, sign back in: the part the shop asked for by name.
await member.page.locator('#nav-btn-customer-account').click();
await member.page.waitForTimeout(700);
await member.page.locator('button', { hasText: 'Sign out' }).click();
await member.page.waitForTimeout(2500);
check(
  'signing out really signs the customer out',
  await member.page.evaluate(() => !/member buyer/i.test(document.body.innerText)),
  (await member.page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 400),
);
await member.page.screenshot({ path: `${SHOTS}/e2e-member-signed-out.png` });

// The account panel stays open after signing out, showing the sign-in form, so
// there is nothing to reopen -- just sign back in where we are.
await member.page.fill('#customer-email', MEMBER.email);
await member.page.fill('#customer-password', MEMBER.password);
await member.page.locator('#btn-customer-email-submit').click();
await member.page.waitForTimeout(3500);

await member.page.locator('button:visible', { hasText: /^Track/ }).first().click();
await member.page.waitForTimeout(3000);
await member.page.screenshot({ path: `${SHOTS}/e2e-member-history.png` });
check(
  'after signing out and back in, the order history is still there',
  memberNumber
    ? await member.page.evaluate((n) => document.body.innerText.includes(n), memberNumber)
    : false,
  'the account came back empty, which is the whole thing the shop asked for',
);

console.log(`\nbuyer console errors:    ${buyer.errors.length ? buyer.errors.slice(0, 4) : 'none'}`);
console.log(`member console errors:   ${member.errors.length ? member.errors.slice(0, 4) : 'none'}`);

console.log(`\nadmin console errors:    ${admin.errors.length ? admin.errors.slice(0, 4) : 'none'}`);
console.log(`customer console errors: ${customer.errors.length ? customer.errors.slice(0, 4) : 'none'}`);
console.log(`tracker console errors:  ${tracker.errors.length ? tracker.errors.slice(0, 4) : 'none'}`);

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
