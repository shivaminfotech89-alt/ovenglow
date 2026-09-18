# Firebase setup

What the shop runs on, and what to click if any of it ever needs doing again.

## What lives where

| | Where it lives | Who can read it | Who can change it |
|---|---|---|---|
| Menu, banners, coupons | Firestore | anyone | signed-in staff |
| Shop settings, UPI id | Firestore | anyone | Super Admin |
| Orders | Firestore | staff, or whoever holds the order's private id | staff |
| Who works here | Firestore + Firebase Auth | signed-in staff | Super Admin |
| Your shopping bag | your own browser | you | you |

The bag stays in the browser on purpose. A half-filled bag belongs to the phone
it was filled on; everything the shop and its customers have to agree about is
in the database.

## The project

- Project: `ovenglowdelights-9423a`
- Region: `asia-south1` (Mumbai) — **permanent, cannot be changed**
- Config: `src/lib/firebase.ts`

That config is committed, and that is not a mistake. Every value in it is sent
to every visitor's browser inside the JavaScript bundle, because that is the
only way the browser can talk to Firebase at all. Anyone can read them off the
live site with View Source. What keeps strangers out is `firestore.rules`, not
secrecy.

**The one Firebase file that is a real secret** is a service account JSON — it
contains a `private_key`. Nothing here uses one. Never commit one, and never
paste one into a chat.

## Setting it up from scratch

1. **Firestore Database → Create database.** Location `asia-south1`, production
   mode. The location cannot be changed afterwards.
2. **Firestore Database → Rules.** Paste all of `firestore.rules`, Publish.
3. **Authentication → Sign-in method → Email/Password.** Enable the first
   toggle. (Leave "Email link" off.)
4. **Authentication → Users → Add user.** Use an address listed in
   `PERMANENT_SUPER_ADMINS` in `src/lib/permissions.ts`, and set a password.
5. Sign in at the shop's **Staff** tab. The first time, it will ask you to
   confirm your email — see below.
6. The catalogue, coupons, banners and default settings upload themselves the
   first time a Super Admin signs in to an empty database.

### Why it asks you to confirm your email

The two owner addresses in `PERMANENT_SUPER_ADMINS` are Super Admins no matter
what the database says. That has to be true, or the first sign-in could never
write the first staff record — creating one requires already being staff.

Because those addresses are powerful, the rules only honour them once Firebase
has confirmed the address belongs to you. An account created by hand in the
console starts unconfirmed, so the first sign-in shows a screen with a "send the
link again" button. It is a one-time step.

**If the email never arrives**, there is a way round it. In the console:

1. Authentication → Users → copy your **User UID**.
2. Firestore Database → Data → Start collection `staff`.
3. Document ID: paste that UID. Fields:
   - `email` (string) — your address
   - `name` (string) — your name
   - `role` (string) — `super_admin`
   - `isActive` (boolean) — `true`
   - `addedAt` (string) — today's date

A staff record works whether or not the address is confirmed, so this gets you
in either way.

## Adding staff

Admin → Staff. Fill in the name, email, role and a starting password; the app
creates the Firebase login and the staff record together. Tell them the password
and ask them to change it with "Forgotten your password?" on the sign-in screen.

Removing someone deletes their staff record. Their Firebase login still exists
and can still be signed in to — it simply grants nothing, because every rule
reads the staff record. To kill the login itself, disable the user in
Authentication → Users.

## Order tracking

Customers track an order with **the order number and the phone number they
ordered with**. Both are required.

Order numbers run in sequence — `OG-20260918-001`, `-002` — so a page that
opened an order from its number alone would let anyone read every customer's
name, phone and address by counting upwards. Instead each order sits at a random
document id that is never shown, and the only route to it is a SHA-256 of the
number and the phone together (`src/lib/orderLookup.ts`).

## Changing the rules

Edit `firestore.rules`, then:

```sh
npm run rules:test     # 40 assertions against the real rules engine
npm run rules:deploy   # needs `npx firebase login` first
```

Or paste the file into the console's Rules tab and Publish.

**Run the tests.** An over-permissive rule has no symptom — the app works
perfectly and the door is open. That is exactly how a `paymentStatus` field the
`Order` type never had sat in these rules while every test passed: the fixtures
had been written alongside the rules instead of taken from the type.

## Working against a throwaway database

```sh
npx firebase emulators:start --only firestore,auth      # terminal 1
VITE_USE_EMULATOR=1 npm run dev                         # terminal 2
```

Nothing touches the live shop. The end-to-end test uses this:

```sh
npm i -D playwright                                     # not a dependency
VITE_USE_EMULATOR=1 npx vite --port 5199 --host 127.0.0.1 &
npx firebase emulators:exec --only firestore,auth \
  --project ovenglowdelights-9423a "node scripts/e2e.mjs"
```

It opens two browsers — one shop, one admin — and checks that an order placed by
someone who is not signed in appears on the admin's screen without a reload.
That is the bug the whole migration exists to fix, so it is worth keeping
honest.

## Vercel

Nothing to configure; the committed config is used. To point a deploy at a
different Firebase project, set `VITE_FIREBASE_API_KEY`,
`VITE_FIREBASE_PROJECT_ID` and the rest (listed in `src/vite-env.d.ts`).

Never set `VITE_USE_EMULATOR` there. It would point the live shop at a database
that does not exist.
