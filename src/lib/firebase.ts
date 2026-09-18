import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

/**
 * The Firebase connection.
 *
 * ## Why this config is committed rather than hidden
 *
 * A Firebase web config is not a credential. Every one of these values is
 * shipped to every visitor's browser inside the JavaScript bundle -- that is
 * how the SDK is designed to work, and there is no way to use Firebase from a
 * browser without publishing them. Anyone can read them off the live site with
 * View Source.
 *
 * What stops a stranger writing to the database is `firestore.rules`, not the
 * secrecy of this file. If the rules are wrong, hiding the config changes
 * nothing; if the rules are right, publishing it costs nothing.
 *
 * The one Firebase file that IS a secret is a service account JSON (it contains
 * a `private_key`). Nothing in this app uses one, and none should ever be
 * committed here.
 *
 * ## Overriding it
 *
 * Every value can be replaced by an environment variable, so a second Firebase
 * project -- a staging copy, say -- can be pointed at without editing code. Set
 * them in Vercel as VITE_FIREBASE_API_KEY and so on. Unset variables fall back
 * to the production project below, which is what keeps a deploy from breaking
 * the moment someone forgets to configure one.
 */
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAt62YD9pVsarFfUECeeuKIbT7kvGvk-AY',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'ovenglowdelights-9423a.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'ovenglowdelights-9423a',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'ovenglowdelights-9423a.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1022823252168',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:1022823252168:web:f85d58d8952787b738a5fd',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-2B3V28FY9Z',
};

export const app: FirebaseApp = initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);

/** Useful in error messages, so a misconfigured deploy says which project it reached. */
export const PROJECT_ID = firebaseConfig.projectId;

/**
 * Google Analytics, loaded only if the browser will have it.
 *
 * `getAnalytics()` throws outright where IndexedDB is unavailable -- Safari
 * private browsing, some embedded webviews, any browser with storage blocked --
 * and it is the first thing the Firebase console's snippet tells you to call.
 * Called eagerly at module scope, as that snippet does, a blocked browser would
 * take the whole shop down before it rendered a single product.
 *
 * So it is imported dynamically, after `isSupported()` agrees, and its failure
 * is swallowed: nobody's cake order should depend on a pageview being counted.
 */
export function startAnalytics(): void {
  if (typeof window === 'undefined') return;

  void import('firebase/analytics')
    .then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) getAnalytics(app);
    })
    .catch(() => {
      /* Analytics is optional; the shop works without it. */
    });
}
