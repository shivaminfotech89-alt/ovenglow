import { initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { USING_EMULATOR, app } from './firebase';
import { Result } from '../types';

/**
 * Staff sign-in.
 *
 * What this replaces: a login screen that listed every staff email as a
 * clickable button and let anyone who clicked one become a Super Admin, with
 * the "session" kept in localStorage where it could be edited by hand. Roles
 * hid buttons and nothing more.
 *
 * Now a password is required, Firebase holds the session, and the role is read
 * from `staff/{uid}` in Firestore -- the same document the security rules read,
 * so the admin UI and the database agree about who someone is. Editing
 * localStorage no longer achieves anything: the rules ask Firebase who you are,
 * not the browser.
 */
export const auth: Auth = getAuth(app);

if (USING_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

export type { User };

/**
 * Why a sign-in did not work, in words a shopkeeper can act on.
 *
 * Firebase deliberately returns `invalid-credential` for both a wrong password
 * and an unknown address, so that a stranger cannot use the login screen to
 * discover which addresses have accounts. That is worth keeping, so the message
 * stays deliberately vague about which half was wrong.
 */
export function explainAuthError(e: unknown): string {
  return explain(e);
}

function explain(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password do not match an account.';
    case 'auth/invalid-email':
      return 'That does not look like an email address.';
    case 'auth/user-disabled':
      return 'That account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check the connection and try again.';
    case 'auth/email-already-in-use':
      return 'Someone already has an account with that email.';
    case 'auth/weak-password':
      return 'Use a password of at least six characters.';
    case 'auth/operation-not-allowed':
      return 'That sign-in method is switched off in the Firebase console (Authentication → Sign-in method).';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google window closed before sign-in finished.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google window. Allow pop-ups for this site, or sign in with your email and password instead.';
    case 'auth/unauthorized-domain':
      return 'This web address is not on the Firebase authorised list (Authentication → Settings → Authorised domains).';
    case 'auth/account-exists-with-different-credential':
      return 'That address already has a password login here. Sign in with your email and password.';
    default:
      return 'Could not sign in. Please try again.';
  }
}

export async function signInStaff(email: string, password: string): Promise<Result> {
  try {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    return { success: true, message: 'Signed in.' };
  } catch (e) {
    return { success: false, message: explain(e) };
  }
}

/**
 * Sign in with Google.
 *
 * Useful here beyond convenience: a Google account arrives with
 * `email_verified` already true, and the security rules only grant the two
 * owner addresses their Super Admin powers once the address is verified. An
 * account typed into the Firebase console by hand starts unverified and has to
 * go through a confirmation email first; signing in with the Google account
 * that owns the same address skips that entirely.
 *
 * Enabling Google does mean anyone with a Gmail address can now reach Firebase
 * Auth and be "signed in". That grants nothing on its own -- every rule asks
 * for an owner address or a `staff/{uid}` record, and a stranger has neither.
 */
export async function signInWithGoogle(): Promise<Result> {
  const provider = new GoogleAuthProvider();
  // Always ask which account, rather than silently reusing whichever Google
  // account the browser happens to be signed into. A shop laptop may well have
  // a personal account signed in already.
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
    return { success: true, message: 'Signed in.' };
  } catch (e) {
    return { success: false, message: explain(e) };
  }
}

export async function signOutStaff(): Promise<void> {
  await signOut(auth);
}

export async function resetStaffPassword(email: string): Promise<Result> {
  const address = email.trim().toLowerCase();
  if (!address) return { success: false, message: 'Enter your email address first.' };
  try {
    await sendPasswordResetEmail(auth, address);
  } catch (e) {
    // A failure here is usually "no such account", and saying so would turn the
    // reset form into a way of testing which addresses exist.
    console.error('Password reset failed:', e);
  }
  return {
    success: true,
    message: `If an account exists for ${address}, a reset link is on its way. Check spam too.`,
  };
}

/**
 * Ask Firebase to email a verification link to whoever is signed in.
 *
 * The two owner addresses get their powers from the security rules only once
 * `email_verified` is true on the token, and an account created by hand in the
 * Firebase console starts unverified. This is what gets them over that step.
 */
export async function sendVerification(): Promise<Result> {
  const user = auth.currentUser;
  if (!user) return { success: false, message: 'Sign in first.' };
  if (user.emailVerified) return { success: true, message: 'This address is already verified.' };
  try {
    await sendEmailVerification(user);
    return {
      success: true,
      message: `Verification link sent to ${user.email}. Click it, then sign in again.`,
    };
  } catch (e) {
    return { success: false, message: explain(e) };
  }
}

/**
 * Pick up a verification that was completed in another tab.
 *
 * `emailVerified` is baked into the ID token, so clicking the link does not
 * change what this tab believes. Reloading the user and forcing a token refresh
 * is what makes the rules start honouring it without a sign out and back in.
 */
export async function refreshVerification(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  if (auth.currentUser?.emailVerified) {
    await auth.currentUser.getIdToken(true);
    return true;
  }
  return false;
}

export function watchStaffAuth(handler: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, handler);
}

/**
 * Create a login for a colleague without signing the current admin out.
 *
 * `createUserWithEmailAndPassword` signs in as whoever it just created, which
 * on a normal Auth instance would throw the admin out of their own console
 * mid-task. Running it on a second, throwaway Firebase app gives it its own
 * session to hijack, leaving the real one untouched. This is the standard way
 * to do it without a server.
 *
 * The caller still has to write `staff/{uid}`; an auth account by itself grants
 * nothing, because every rule reads the Firestore record.
 */
export async function createStaffLogin(
  email: string,
  password: string,
): Promise<Result & { uid?: string }> {
  const secondary = initializeApp(app.options, `staff-creator-${Date.now()}`);
  const secondaryAuth = getAuth(secondary);
  try {
    const created = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim().toLowerCase(),
      password,
    );
    await sendEmailVerification(created.user).catch(() => {
      /* The account works without it; only owners need a verified address. */
    });
    return { success: true, message: 'Login created.', uid: created.user.uid };
  } catch (e) {
    return { success: false, message: explain(e) };
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }
}
