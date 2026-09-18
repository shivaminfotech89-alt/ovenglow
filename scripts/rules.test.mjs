/**
 * What firestore.rules actually allows, checked against the real rules engine.
 *
 * Security rules are the only thing standing between a published project id and
 * every customer's address, and they are easy to get subtly wrong in a way that
 * nothing in the app will ever reveal — an over-permissive rule shows no
 * symptom at all. So each one is asserted here, from the outside, as a stranger
 * and as staff.
 *
 * Run with the Firestore emulator up:
 *
 *   npx firebase emulators:exec --only firestore "node scripts/rules.test.mjs"
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const OWNER = 'shivaminfotech89@gmail.com';

const env = await initializeTestEnvironment({
  projectId: 'ovenglow-rules-test',
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
});

/** A visitor who has never signed in: the shop's front door. */
const stranger = env.unauthenticatedContext().firestore();

/** Someone signed in who does not work here — a customer with an account. */
const outsider = env.authenticatedContext('outsider-uid', {
  email: 'someone@example.com',
  email_verified: true,
}).firestore();

/** An owner, verified, before any staff record exists. */
const owner = env.authenticatedContext('owner-uid', {
  email: OWNER,
  email_verified: true,
}).firestore();

/** An owner who has not clicked the verification link yet. */
const unverifiedOwner = env.authenticatedContext('unverified-uid', {
  email: OWNER,
  email_verified: false,
}).firestore();

/** An order manager: works orders, must not touch prices or settings. */
const manager = env.authenticatedContext('manager-uid', {
  email: 'manager@example.com',
  email_verified: true,
}).firestore();

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ok    ${name}`);
    passed += 1;
  } catch (e) {
    console.log(`  FAIL  ${name}\n        ${e.message.split('\n')[0]}`);
    failed += 1;
  }
}

function section(title) {
  console.log(`\n${title}`);
}

/* Seed the documents the rules read, with the rules switched off. */
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'products/p1'), { name: 'Brownie', price: 250, isPublished: true });
  await setDoc(doc(db, 'settings/store'), { storeName: 'Ovenglow Delights' });
  await setDoc(doc(db, 'staff/manager-uid'), {
    email: 'manager@example.com',
    role: 'order_manager',
    isActive: true,
  });
  await setDoc(doc(db, 'staff/suspended-uid'), {
    email: 'gone@example.com',
    role: 'admin',
    isActive: false,
  });
  await setDoc(doc(db, 'orders/secret-order-id'), {
    orderNumber: 'OG-20260918-001',
    customer: { name: 'A Customer', phone: '9876543210', address: '12 Some Road' },
    items: [],
    totalAmount: 750,
    stage: 'awaiting_payment',
    paymentStatus: 'pending',
  });
  await setDoc(doc(db, 'orderLookup/hash-of-number-and-phone'), { orderId: 'secret-order-id' });
  await setDoc(doc(db, 'customers/c1'), { phone: '9876543210', name: 'A Customer' });
});

section('A stranger, not signed in');
await check('can read the catalogue', () =>
  assertSucceeds(getDoc(doc(stranger, 'products/p1'))));
await check('can read the shop settings', () =>
  assertSucceeds(getDoc(doc(stranger, 'settings/store'))));
await check('CANNOT change a price', () =>
  assertFails(updateDoc(doc(stranger, 'products/p1'), { price: 1 })));
await check('CANNOT add a product', () =>
  assertFails(setDoc(doc(stranger, 'products/p2'), { name: 'Free cake', price: 0 })));
await check('CANNOT change the shop settings', () =>
  assertFails(updateDoc(doc(stranger, 'settings/store'), { upiId: 'attacker@upi' })));
await check('can place an order', () =>
  assertSucceeds(
    addDoc(collection(stranger, 'orders'), {
      orderNumber: 'OG-20260918-002',
      customer: { name: 'B', phone: '9', address: 'x' },
      items: [],
      totalAmount: 500,
      stage: 'inquiry_received',
      paymentStatus: 'pending',
    }),
  ));
await check('CANNOT place an order already marked paid', () =>
  assertFails(
    addDoc(collection(stranger, 'orders'), {
      orderNumber: 'OG-20260918-003',
      customer: { name: 'B', phone: '9', address: 'x' },
      items: [],
      totalAmount: 500,
      stage: 'paid',
      paymentStatus: 'paid',
    }),
  ));
await check('CANNOT list every order', () =>
  assertFails(getDocs(collection(stranger, 'orders'))));
await check('CANNOT list the customer base', () =>
  assertFails(getDocs(collection(stranger, 'customers'))));
await check('CANNOT read a customer record', () =>
  assertFails(getDoc(doc(stranger, 'customers/c1'))));
await check('CANNOT search order numbers', () =>
  assertFails(getDocs(collection(stranger, 'orderLookup'))));
await check('can read one order by its unguessable id', () =>
  assertSucceeds(getDoc(doc(stranger, 'orders/secret-order-id'))));
await check('can look an order up with number AND phone', () =>
  assertSucceeds(getDoc(doc(stranger, 'orderLookup/hash-of-number-and-phone'))));
await check('can submit a UPI reference on their own order', () =>
  assertSucceeds(
    updateDoc(doc(stranger, 'orders/secret-order-id'), {
      upiReference: '123456789012',
      stage: 'payment_verification_pending',
      stageHistory: [],
      updatedAt: 'now',
    }),
  ));
await check('CANNOT mark their own order delivered', () =>
  assertFails(
    updateDoc(doc(stranger, 'orders/secret-order-id'), { stage: 'delivered' })));
await check('CANNOT change what an order cost', () =>
  assertFails(
    updateDoc(doc(stranger, 'orders/secret-order-id'), { totalAmount: 1 })));
await check('CANNOT delete an order', () =>
  assertFails(deleteDoc(doc(stranger, 'orders/secret-order-id'))));
await check('CANNOT read the staff list', () =>
  assertFails(getDocs(collection(stranger, 'staff'))));
await check('CANNOT invent a collection', () =>
  assertFails(setDoc(doc(stranger, 'anything/else'), { x: 1 })));

section('Signed in, but does not work here');
await check('CANNOT change a price', () =>
  assertFails(updateDoc(doc(outsider, 'products/p1'), { price: 1 })));
await check('CANNOT list orders', () =>
  assertFails(getDocs(collection(outsider, 'orders'))));
await check('CANNOT read customers', () =>
  assertFails(getDoc(doc(outsider, 'customers/c1'))));
await check('CANNOT make themselves staff', () =>
  assertFails(
    setDoc(doc(outsider, 'staff/outsider-uid'), {
      email: 'someone@example.com',
      role: 'super_admin',
      isActive: true,
    })));
await check('CANNOT reactivate a suspended account', () =>
  assertFails(updateDoc(doc(outsider, 'staff/suspended-uid'), { isActive: true })));

section('An owner signing in for the first time');
await check('can create their own staff record', () =>
  assertSucceeds(
    setDoc(doc(owner, 'staff/owner-uid'), {
      email: OWNER,
      name: 'Owner',
      role: 'super_admin',
      isActive: true,
    })));
// An owner is a permanent super admin, so adding colleagues is the point of
// the collection rather than something to guard against. What must not happen
// is somebody who is NOT an owner writing here, which the outsider cases above
// and the unverified case below both cover.
await check('can add a colleague', () =>
  assertSucceeds(
    setDoc(doc(owner, 'staff/a-colleague'), {
      email: 'baker@example.com',
      role: 'order_manager',
      isActive: true,
    })));
await check('can edit the catalogue', () =>
  assertSucceeds(updateDoc(doc(owner, 'products/p1'), { price: 260 })));
await check('can change the shop settings', () =>
  assertSucceeds(updateDoc(doc(owner, 'settings/store'), { upiId: 'ovenglow@upi' })));
await check('can list every order', () =>
  assertSucceeds(getDocs(collection(owner, 'orders'))));

section('An owner who has not verified their email');
await check('CANNOT bootstrap themselves', () =>
  assertFails(
    setDoc(doc(unverifiedOwner, 'staff/unverified-uid'), {
      email: OWNER,
      role: 'super_admin',
      isActive: true,
    })));
await check('CANNOT edit the catalogue', () =>
  assertFails(updateDoc(doc(unverifiedOwner, 'products/p1'), { price: 1 })));

section('An order manager');
await check('can list orders', () =>
  assertSucceeds(getDocs(collection(manager, 'orders'))));
await check('can move an order along', () =>
  assertSucceeds(
    updateDoc(doc(manager, 'orders/secret-order-id'), {
      stage: 'baking',
      orderNumber: 'OG-20260918-001',
      totalAmount: 750,
    })));
await check('can read customers', () =>
  assertSucceeds(getDoc(doc(manager, 'customers/c1'))));
await check('CANNOT change a price', () =>
  assertFails(updateDoc(doc(manager, 'products/p1'), { price: 1 })));
await check('CANNOT change the shop settings', () =>
  assertFails(updateDoc(doc(manager, 'settings/store'), { gstPercent: 0 })));
await check('CANNOT promote themselves', () =>
  assertFails(updateDoc(doc(manager, 'staff/manager-uid'), { role: 'super_admin' })));
await check('CANNOT rewrite what an order cost', () =>
  assertFails(
    updateDoc(doc(manager, 'orders/secret-order-id'), {
      orderNumber: 'OG-20260918-001',
      totalAmount: 1,
    })));

await env.cleanup();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
