/// <reference types="vite/client" />

/**
 * The environment variables this app reads.
 *
 * Declaring them gives `import.meta.env.VITE_FIREBASE_API_KEY` a type instead
 * of an error, and this list doubles as the record of what can be set in
 * Vercel. Every one is optional: `src/lib/firebase.ts` falls back to the
 * production project so a deploy cannot break by forgetting one.
 */
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  /** '1' points the app at the local Firebase emulators instead of the project. */
  readonly VITE_USE_EMULATOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
