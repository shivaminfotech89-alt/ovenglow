import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, explainAuthError } from './staffAuth';
import { Result } from '../types';

/**
 * Customer accounts.
 *
 * What this replaces: a box that asked for a mobile number, believed whatever
 * was typed, wrote it to localStorage and displayed "Verified Customer" above
 * it. Nothing was verified and nothing was proved -- which is why a customer's
 * order history could not be shown on that basis. Anyone who knew a phone
 * number would have been handed that person's name, address and every order
 * they had ever placed.
 *
 * Signing in with Google or with an email and password is proof, and it is
 * proof the security rules can check, because Firebase puts the user's id in
 * the token the rules read. `orders` carries `customerUid`, and the rule that
 * lets a customer list their own orders compares the two. So the history is
 * real, it follows the account to a new phone, and it cannot be opened by
 * typing someone else's number.
 *
 * Staff use the same Firebase Auth instance -- there is one signed-in user per
 * browser, not two. Being signed in grants nothing by itself: staff powers come
 * from a `staff/{uid}` record or one of the two owner addresses, and a customer
 * has neither.
 */

/**
 * Keep the session across closing the tab, closing the browser, and restarting
 * the phone.
 *
 * `browserLocalPersistence` is already Firebase's default, so this is not a
 * fix -- it is a statement, because "stay signed in" is a requirement here
 * rather than a default worth inheriting silently. It also fails loudly in the
 * one place the default would fail quietly: a browser with IndexedDB blocked,
 * where the session would last only until the tab closed.
 */
let persistenceReady: Promise<void> | null = null;

function ensurePersistence(): Promise<void> {
  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence).catch((e) => {
      // Private windows and some in-app browsers block the storage this needs.
      // Sign-in still works for as long as the tab is open, which is better
      // than refusing to let someone order.
      console.warn('Could not make the sign-in persistent:', e);
    });
  }
  return persistenceReady;
}

/** Sign in with Google. The quickest route, and it needs no new password. */
export async function customerSignInWithGoogle(): Promise<Result> {
  await ensurePersistence();
  const provider = new GoogleAuthProvider();
  // Not `select_account` here, unlike staff. A shop laptop may have somebody
  // else's Google account signed in and an admin needs to choose; a customer on
  // their own phone has one account and being asked to pick it every time is
  // friction with nothing behind it.
  try {
    await signInWithPopup(auth, provider);
    return { success: true, message: 'Signed in.' };
  } catch (e) {
    return { success: false, message: explainAuthError(e) };
  }
}

export async function customerSignInWithEmail(email: string, password: string): Promise<Result> {
  await ensurePersistence();
  try {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    return { success: true, message: 'Signed in.' };
  } catch (e) {
    return { success: false, message: explainAuthError(e) };
  }
}

/**
 * Create an account with an email and a password.
 *
 * The name goes on the Firebase profile as well as into the customer's
 * Firestore record, so that the greeting works on the very first render --
 * before the Firestore document has arrived, and even if writing it fails.
 */
export async function customerRegister(
  name: string,
  email: string,
  password: string,
): Promise<Result> {
  await ensurePersistence();
  try {
    const created = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );
    const display = name.trim();
    if (display) await updateProfile(created.user, { displayName: display });
    return { success: true, message: 'Account created.' };
  } catch (e) {
    return { success: false, message: explainAuthError(e) };
  }
}

export async function customerSignOut(): Promise<void> {
  await signOut(auth);
}

export async function customerResetPassword(email: string): Promise<Result> {
  const address = email.trim().toLowerCase();
  if (!address) return { success: false, message: 'Enter your email address first.' };
  try {
    await sendPasswordResetEmail(auth, address);
  } catch (e) {
    // Usually "no such account". Saying so would turn this form into a way of
    // testing which of your customers' addresses are registered.
    console.error('Customer password reset failed:', e);
  }
  return {
    success: true,
    message: `If an account exists for ${address}, a reset link is on its way. Check spam too.`,
  };
}
