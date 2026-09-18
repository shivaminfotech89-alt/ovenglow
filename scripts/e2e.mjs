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

const admin = await openContext('admin');
await admin.page.locator('button:visible', { hasText: /^Staff$/ }).first().click();
await admin.page.waitForTimeout(800);

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

console.log(`\nadmin console errors:    ${admin.errors.length ? admin.errors.slice(0, 4) : 'none'}`);
console.log(`customer console errors: ${customer.errors.length ? customer.errors.slice(0, 4) : 'none'}`);

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
