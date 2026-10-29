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

// WhatsApp lives in the corner now, not in the hero. The hero's job is to send
// someone into the catalogue, and a second call to action of equal weight was
// taking that traffic somewhere else on the first screen.
const heroCta = await shopper.page.evaluate(() => {
  const hero = document.querySelector('h1')?.closest('div');
  return [...(hero?.querySelectorAll('a, button') ?? [])]
    .filter((el) => el.offsetWidth || el.offsetHeight)
    .map((el) => (el.textContent || '').trim());
});
check(
  'the hero no longer sends people to WhatsApp instead of the menu',
  !heroCta.some((t) => /whatsapp/i.test(t)),
  `hero buttons: ${JSON.stringify(heroCta)}`,
);

check(
  'the WhatsApp mark floats over the shop',
  await shopper.page.locator('#btn-whatsapp-float').isVisible(),
);

// And stays there, which is the point of moving it: a question occurs to
// someone halfway down the catalogue, not in the hero.
for (const tab of ['Signature', 'Track']) {
  await shopper.page.locator('button:visible', { hasText: new RegExp(`^${tab}`) }).first().click();
  await shopper.page.waitForTimeout(700);
  check(
    `the WhatsApp mark is still there on ${tab}`,
    await shopper.page.locator('#btn-whatsapp-float').isVisible(),
  );
}

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

/* ------------------------------------------------- ranges, added by the shop */

/**
 * The shop adds a range of its own, and it reaches the product form.
 *
 * The nine ranges were nine lines in `src/types.ts`, so a tenth meant a
 * developer. These three checks are the whole promise of moving them into the
 * database: the shop can add one, the product form offers it immediately, and
 * the ranges that shipped with the shop seeded themselves rather than
 * disappearing when the hardcoded list did.
 */
await admin.page.locator('button:visible', { hasText: /^Categories$/ }).first().click();
await admin.page.waitForTimeout(1500);
check(
  'the ranges the shop opened with are listed',
  await admin.page.evaluate(() => /premium chocolate/i.test(document.body.innerText)),
);

await admin.page.locator('#btn-add-category').click();
await admin.page.waitForTimeout(600);
await admin.page.fill('#category-label', 'Festive Hampers');
// The address is shown while typing, because it is permanent.
check(
  'the address it will get is shown before it is created',
  await admin.page.evaluate(() => /festive-hampers/.test(document.body.innerText)),
);
await admin.page.locator('#btn-save-category').click();
await admin.page.waitForTimeout(2500);
check(
  'the shop can add a range of its own',
  await admin.page.evaluate(() => /Festive Hampers/.test(document.body.innerText)),
);
await admin.page.screenshot({ path: `${SHOTS}/e2e-admin-categories.png` });

/**
 * Deleting is refused while products are in the range.
 *
 * Nothing cascades: the products would keep an address the menu no longer has
 * and quietly stop appearing on the shop front. "Premium Chocolate" holds the
 * seeded catalogue, so its delete button must be unavailable while
 * "Festive Hampers", which is empty, can go.
 */
const deleteState = await admin.page.evaluate(() => {
  const rows = [...document.querySelectorAll('tbody tr')];
  const read = (name) => {
    const row = rows.find((r) => r.textContent?.includes(name));
    const btn = row?.querySelector('button[aria-label^="Delete"]');
    return btn ? btn.disabled : null;
  };
  return { inUse: read('Premium Chocolate'), empty: read('Festive Hampers') };
});
check(
  'a range with products in it cannot be deleted',
  deleteState.inUse === true,
  JSON.stringify(deleteState),
);
check(
  'an empty range can be',
  deleteState.empty === false,
  JSON.stringify(deleteState),
);

/* ---------------------------------------------- hero slides, from the admin */

/**
 * The shop writes a slide and it reaches the shop front.
 *
 * The hero was code, then code plus coupons. This is the whole of what the shop
 * asked for: add a slide, give it lines and a number, and have it show.
 */
await admin.page.locator('button:visible', { hasText: /^Hero Slides$/ }).first().click();
await admin.page.waitForTimeout(1500);
await admin.page.locator('#btn-add-hero-slide').click();
await admin.page.waitForTimeout(600);
await admin.page.fill('#hero-title', 'Written in the console');
await admin.page.fill('#hero-subtitle', 'A second line, in gold.');
await admin.page.fill('#hero-body', 'And a third, for the detail.');
await admin.page.fill('#hero-offer', 'Two for one on brownies');
await admin.page.fill('#hero-number', '1');
await admin.page.locator('#btn-save-hero-slide').click();
await admin.page.waitForTimeout(2500);
check(
  'a slide written in the console is listed',
  await admin.page.evaluate(() => /Written in the console/.test(document.body.innerText)),
);

/*
 * Push the slide the shop opened with out of first place by typing a number at
 * it. The shop asked for numbers rather than dragging, so the number field in
 * the row is the thing that has to work -- not only the one in the form.
 */
await admin.page
  .locator('input[aria-label="Slide number for Festive boxes, ready to gift"]')
  .fill('5');
await admin.page.waitForTimeout(1800);
await admin.page.screenshot({ path: `${SHOTS}/e2e-admin-hero-slides.png` });

// And the product form offers it without a reload.
await admin.page.locator('button:visible', { hasText: /Products/ }).first().click();
await admin.page.waitForTimeout(1500);
check(
  'a new range reaches the product form',
  await admin.page.evaluate(() =>
    [...document.querySelectorAll('select option')].some((o) =>
      /Festive Hampers/.test(o.textContent ?? ''),
    ),
  ),
);

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
  // Also the showcase item, so the hero's second button has somewhere to go.
  isSignature: { booleanValue: true },
  stockCount: { integerValue: '10' },
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
await seedDoc('coupons/e2e-deal', {
  code: { stringValue: 'E2EDEAL' },
  name: { stringValue: 'End to end deal' },
  discountType: { stringValue: 'percentage' },
  discountValue: { integerValue: '15' },
  minPurchase: { integerValue: '0' },
  expiresAt: { nullValue: null },
  isActive: { booleanValue: true },
  createdAt: { stringValue: '2026-01-01T00:00:00.000Z' },
  timesUsed: { integerValue: '0' },
});

// An offer slide, with a photograph: the amount is read from the coupon, not
// from the slide.
await seedDoc('banners/e2e-hero-offer', {
  slot: { stringValue: 'hero' },
  title: { stringValue: 'Boxes for the season' },
  subtitle: { stringValue: 'Chocolate and cookies, boxed.' },
  body: { stringValue: 'Made to order in small batches.' },
  buttonText: { stringValue: 'Shop the offer' },
  couponCode: { stringValue: 'E2EDEAL' },
  /*
   * An inline picture, so the assertion is about the slide painting what it
   * was given rather than about a network fetch succeeding.
   *
   * SVG rather than a base64 GIF, and deliberately: it contains brackets. An
   * unquoted CSS `url(...)` may not, so this is the fixture that catches the
   * bug the first version shipped with -- the picture never appeared, and
   * nothing was logged. A base64 GIF has no brackets and passed either way.
   */
  image: {
    stringValue:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">' +
          '<rect width="8" height="8" fill="rgb(200,140,70)"/></svg>',
      ),
  },
  linkedCategory: { stringValue: 'premium-chocolate' },
  isActive: { booleanValue: true },
  sortOrder: { integerValue: '3' },
});

// And one with no offer at all, which is an ordinary slide now.
await seedDoc('banners/e2e-hero-empty', {
  slot: { stringValue: 'hero' },
  title: { stringValue: 'Nothing on offer here' },
  subtitle: { stringValue: 'Just a line about the bakery.' },
  buttonText: { stringValue: 'See the menu' },
  image: { stringValue: '' },
  linkedCategory: { stringValue: 'premium-chocolate' },
  isActive: { booleanValue: true },
  sortOrder: { integerValue: '4' },
});

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
  rating: { integerValue: '5' },
  reviewCount: { integerValue: '1' },
  weightGrams: { integerValue: '200' },
  shelfLife: { stringValue: '3 days' },
  layers: { arrayValue: { values: [] } },
  flavorNotes: { arrayValue: { values: [] } },
});

await seedDoc('products/e2e-second-range', {
  sku: { stringValue: 'E2E-CAKE' },
  name: { stringValue: 'Checkout Test Cake' },
  tagline: { stringValue: 'In a different range' },
  description: { stringValue: 'Exists so Everything has two sections.' },
  price: { integerValue: '600' },
  originalPrice: { integerValue: '700' },
  category: { stringValue: 'celebration-cakes' },
  image: { stringValue: '' },
  secondaryImages: { arrayValue: { values: [] } },
  isPublished: { booleanValue: true },
  stockCount: { integerValue: '4' },
  rating: { integerValue: '5' },
  reviewCount: { integerValue: '3' },
  weightGrams: { integerValue: '500' },
  shelfLife: { stringValue: '2 days' },
  layers: { arrayValue: { values: [] } },
  flavorNotes: { arrayValue: { values: [] } },
});

const buyer = await openContext('buyer');
await buyer.page.waitForTimeout(2500);

/* ------------------------------------------ the hero, and the brand lockup */

/**
 * The signature range is offered from the first screen.
 *
 * It used to be a full-width banner below the five promises -- past the fold,
 * and past the point where someone scrolling the menu would still notice it.
 * The showcase is the shop's best argument, so it moved up beside "See the
 * menu", and the banner went. Both halves are asserted, because moving
 * something and forgetting to remove the original is the usual way this goes
 * wrong.
 */
check(
  'the hero offers the signature range',
  await buyer.page.locator('#btn-hero-signature').isVisible(),
);

/* ------------------------------------------------- the hero, as a carousel */

/**
 * Every hero slide is the shop's own.
 *
 * The `banners` collection and its admin screen existed from the start and
 * nothing on the storefront read them, so a running discount lived in the
 * announcement bar and nowhere else. Then the hero opened with a slide written
 * in the code and showed the shop's only after it.
 *
 * Now the shop writes all of them, and the built-in slide stands in only when
 * there are none. These check what can go wrong with that: a slide reaches the
 * shop front at all, one carrying a coupon quotes that coupon's real value, one
 * carrying no offer still shows (it used to be dropped), and the photograph
 * actually gets painted.
 */
const dots = buyer.page.locator('#hero-showcase-banner [role=tablist] button');
check('the hero is a carousel', (await dots.count()) >= 2, `${await dots.count()} slides`);

/**
 * Slide number 1 is the slide shown first.
 *
 * The shop asked for numbers rather than dragging, so the number has to be the
 * thing that decides. The console slide above was given 1 while the seeded ones
 * hold 2 and 3.
 */
check(
  'the slide numbered 1 is the one shown first',
  (await buyer.page.locator('#hero-showcase-banner h1:visible').innerText()).includes(
    'Written in the console',
  ),
  await buyer.page.locator('#hero-showcase-banner h1:visible').innerText(),
);

check(
  "the shop's own slide replaces the built-in one",
  !(await buyer.page.evaluate(() => document.body.innerText)).includes(
    'Artisanal Premium Chocolates',
  ),
  'the code\u2019s slide is still showing even though the shop has written its own',
);

// Every slide in turn, rather than a fixed position: the catalogue seed adds
// its own slides on first sign-in and the order between two that share a number
// is nobody's to promise.
let quoted = '';
let plain = '';
for (let i = 0; i < (await dots.count()); i += 1) {
  await dots.nth(i).click();
  await buyer.page.waitForTimeout(600);
  const text = await buyer.page.evaluate(
    () => document.querySelector('#hero-showcase-banner')?.innerText ?? '',
  );
  if (/E2EDEAL/.test(text)) quoted = text;
  if (/Nothing on offer here/.test(text)) plain = text;
}
check(
  'an offer slide quotes the discount and the code',
  /15% off/.test(quoted) && /E2EDEAL/.test(quoted),
  quoted ? quoted.replace(/\s+/g, ' ').slice(0, 160) : 'no slide quoted the seeded coupon',
);
check(
  'a slide with no offer is shown too, not dropped',
  plain.length > 0,
  'the hero still refuses a slide that is only a picture and a line',
);
await buyer.page.screenshot({ path: `${SHOTS}/e2e-hero-offer.png` });

/**
 * The photograph is painted.
 *
 * A slide's picture was stored, shown in the admin, and ignored by the shop
 * front for as long as the carousel existed. Asserting the element carries a
 * background image is the difference between "the field saves" and "the field
 * does something".
 */
const photoPainted = await buyer.page.evaluate(() => {
  const panel = document.querySelector('#hero-showcase-banner');
  return [...(panel?.querySelectorAll('div') ?? [])].some((el) =>
    /url\(/.test(getComputedStyle(el).backgroundImage),
  );
});
check('a slide with a photo paints it behind the words', photoPainted);

await dots.nth(0).click();
await buyer.page.waitForTimeout(600);

/* ------------------------------------------------------ one kitchen, no choice */

/**
 * The shop is entirely vegetarian, so the "Eggless only" filter excluded
 * nothing and the per-product tick asked a question with one answer. Both are
 * gone; the claim is made once, as a fact about the shop.
 */
check(
  'there is no filter for something every item already is',
  !/eggless only/i.test(await buyer.page.evaluate(() => document.body.innerText)),
);
check(
  'the shop says it is vegetarian without being asked',
  /100% vegetarian/i.test(await buyer.page.evaluate(() => document.body.innerText)),
);

/* ------------------------------------------------- the catalogue, in ranges */

/**
 * "Everything" is cut into named ranges, and the name stays put.
 *
 * It used to be one unbroken grid of thirty-nine cards with nothing to say
 * where one range ended and the next began.
 *
 * The sticky half is worth asserting rather than eyeballing: `overflow: hidden`
 * on an ancestor silently turns `position: sticky` into `position: static`,
 * which is exactly what `<main>` was doing. Nothing errors, nothing logs -- the
 * heading just scrolls away.
 */
const ranges = buyer.page.locator('#product-catalog-grid [id^="range-"]');
check(
  'the catalogue is cut into named ranges',
  (await ranges.count()) >= 2,
  `${await ranges.count()} ranges`,
);

const headerH = await buyer.page.evaluate(
  () => document.querySelector('header')?.getBoundingClientRect().height ?? 0,
);
const rangeTop = await ranges
  .nth(1)
  .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
await buyer.page.evaluate((y) => window.scrollTo(0, y + 320), rangeTop);
await buyer.page.waitForTimeout(500);
const pinned = (await ranges.nth(1).boundingBox())?.y ?? -1;
check(
  'a range name stays under the header while you scroll it',
  Math.abs(pinned - (headerH + 4)) < 10,
  `heading at ${pinned.toFixed(0)}, header ends at ${headerH.toFixed(0)}`,
);
await buyer.page.screenshot({ path: `${SHOTS}/e2e-catalogue-ranges.png` });

/* ------------------------------------------------------- a quieter header */

/**
 * The header carries the brand, the search and the way to the bag -- and
 * nothing else.
 *
 * It used to open with a dark strip restating the free-delivery threshold and
 * whichever coupon was running, on every screen of the site. Both now live on
 * the hero's offer slides, where the shop writes them and a coupon's value is
 * quoted from the coupon table rather than retyped.
 *
 * Beside the logo sat "Set your area", which stored an area that was printed
 * back on the product page and used for nothing else. Whether the shop reaches
 * an address is decided at checkout against Admin -> Settings, which is
 * asserted separately by the order that goes through below.
 */
const headerText = await buyer.page.evaluate(
  () => document.querySelector('header')?.innerText ?? '',
);
check('the header does not ask for an area', !/set your area/i.test(headerText), headerText);
check(
  'the header does not restate the offer on every screen',
  !/free delivery on orders over/i.test(headerText),
  headerText,
);

check(
  'nothing scrolls sideways',
  !(await buyer.page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )),
);

await buyer.page.evaluate(() => window.scrollTo(0, 0));
await buyer.page.waitForTimeout(400);
check(
  'the signature range is offered once, not twice',
  (await buyer.page.evaluate(
    () => (document.body.innerText.match(/Our Most Craved Creations/g) ?? []).length,
  )) === 1,
);

// The brand name had nothing behind it: a maroon badge and a brown wordmark on
// plain white, reading as two unrelated things side by side.
check(
  'the brand name sits on a background of its own',
  await buyer.page.evaluate(() => {
    const el = document.getElementById('ovenglow-brand-logo');
    if (!el) return false;
    const style = getComputedStyle(el);
    const painted =
      style.backgroundImage !== 'none' ||
      !/rgba\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor);
    return painted && style.borderTopWidth !== '0px';
  }),
);

/**
 * The mark is served from the bundle, not from its fixed public path.
 *
 * `/logo-mark.png` never changes, so redrawing the artwork behind it changed no
 * URL, and browsers kept showing the old mark after the new one had shipped and
 * deployed -- the fix reported as "still not updated". Importing it gives it a
 * content hash, so new artwork is a new URL. If that resolution is ever undone,
 * the src goes back to the bare path and this goes red.
 */
check(
  'the brand mark is served from the bundle, so new artwork is a new URL',
  await buyer.page.evaluate(() => {
    const src = document.querySelector('#ovenglow-brand-logo img')?.getAttribute('src') ?? '';
    return src.length > 0 && !/^\/logo(-mark)?\.png$/.test(src);
  }),
  await buyer.page.evaluate(
    () => document.querySelector('#ovenglow-brand-logo img')?.getAttribute('src') ?? 'no image',
  ),
);

await buyer.page.locator('#btn-hero-signature').click();
await buyer.page.waitForTimeout(1200);
check(
  'and it opens the signature page',
  await buyer.page.evaluate(() => /our most craved creations/i.test(document.body.innerText)),
);
await buyer.page.screenshot({ path: `${SHOTS}/e2e-signature-from-hero.png` });
await buyer.page.locator('#nav-btn-shop').click();
await buyer.page.waitForTimeout(1200);

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

/* --------------------------------------- the shop with no ranges to show */

/**
 * A shop with stock in it never looks shut, whatever happened to its ranges.
 *
 * The catalogue is grouped by the `categories` collection, and the first
 * version of that grouping rendered the section list regardless of whether
 * there were any sections -- so a range list that failed to load, or products
 * all filed under hidden or deleted ranges, left every product on the shop
 * front behind a blank space. Three products in the database, nothing on the
 * page, and no "the menu is being set up" either.
 *
 * Emptying the collection here is the cheap half of that: it proves the page
 * falls back to one plain grid. (The other half -- a read refused outright,
 * which is what a missing Firestore rule does -- was reproduced by running this
 * shop against rules with no `categories` block: zero products before the fix,
 * all of them after.)
 */
const allRanges = await fetch(`${REST}/categories`, {
  headers: { Authorization: 'Bearer owner' },
}).then((r) => r.json());
await Promise.all(
  (allRanges.documents ?? []).map((d) =>
    fetch(`${REST}/categories/${d.name.split('/').pop()}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer owner' },
    }),
  ),
);

const rangeless = await openContext('rangeless');
await rangeless.page.waitForTimeout(2500);
const stillSelling = await rangeless.page
  .locator('#product-catalog-grid [id^="btn-add-product-"]')
  .count();
check(
  'a shop with no ranges still shows what it sells',
  stillSelling > 0,
  `${stillSelling} products on the page with the range list emptied`,
);
await rangeless.page.screenshot({ path: `${SHOTS}/e2e-no-ranges.png` });
await rangeless.ctx.close();

console.log(`\nbuyer console errors:    ${buyer.errors.length ? buyer.errors.slice(0, 4) : 'none'}`);
console.log(`member console errors:   ${member.errors.length ? member.errors.slice(0, 4) : 'none'}`);

console.log(`\nadmin console errors:    ${admin.errors.length ? admin.errors.slice(0, 4) : 'none'}`);
console.log(`customer console errors: ${customer.errors.length ? customer.errors.slice(0, 4) : 'none'}`);
console.log(`tracker console errors:  ${tracker.errors.length ? tracker.errors.slice(0, 4) : 'none'}`);

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
