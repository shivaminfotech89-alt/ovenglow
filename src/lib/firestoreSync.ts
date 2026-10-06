import { useEffect, useState } from 'react';
import {
  DocumentData,
  QuerySnapshot,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Live collections.
 *
 * The shop used to keep everything in localStorage, which meant each browser
 * held its own private copy of the world: a customer's order was written to
 * the customer's phone and the admin, on a different device, never saw it.
 * That is the bug this module exists to end.
 *
 * Everything here reads through `onSnapshot` rather than a one-off fetch, so a
 * change made on any device lands on every other within a second or so. It is
 * also why no optimistic-update code is needed: the SDK applies a local write
 * to its own cache immediately and fires the listener before the server has
 * answered, so the admin's screen updates on the keystroke and then reconciles.
 */

/** A stored record. Firestore's document id is the record's `id`. */
export interface Identified {
  id: string;
}

export interface CollectionState<T> {
  items: T[];
  /** False until the first snapshot arrives, so the UI can tell empty from loading. */
  ready: boolean;
  /** Non-empty when the listener was refused or dropped. */
  error: string;
}

function describe(e: unknown, what: string): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'permission-denied') {
    return `Not allowed to read ${what}. Sign in again, or check the Firestore rules.`;
  }
  if (code === 'unavailable') {
    return `Cannot reach the database. ${what} may be out of date until the connection returns.`;
  }
  return `Could not load ${what}.`;
}

/**
 * Subscribe to a collection for as long as the component is mounted.
 *
 * `enabled` exists for collections a signed-out visitor is not allowed to read.
 * Subscribing anyway would work -- the listener would simply be refused -- but
 * it would put a permission error in the console on every page load of the
 * public shop, which trains everyone to ignore console errors.
 */
export function useLiveCollection<T extends Identified>(
  name: string,
  enabled = true,
): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({ items: [], ready: false, error: '' });

  useEffect(() => {
    if (!enabled) {
      setState({ items: [], ready: true, error: '' });
      return;
    }

    setState((prev) => ({ ...prev, ready: false, error: '' }));

    const stop = onSnapshot(
      collection(db, name),
      (snap: QuerySnapshot<DocumentData>) => {
        setState({
          items: snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })),
          ready: true,
          error: '',
        });
      },
      (e) => {
        console.error(`Live ${name} failed:`, e);
        setState({ items: [], ready: true, error: describe(e, name) });
      },
    );

    return stop;
  }, [name, enabled]);

  return state;
}

/**
 * Subscribe to the documents in a collection where one field equals a value.
 *
 * Used for a customer's own orders. It matters that the filter is here and not
 * applied after the fact: `orders` may not be listed by a customer at all, and
 * the security rule that lets them read their own
 * (`resource.data.customerUid == request.auth.uid`) only passes if the query
 * itself carries that constraint. Fetching the collection and filtering in
 * JavaScript would be refused outright -- which is the behaviour you want, and
 * the reason the filter belongs in the query.
 *
 * No `orderBy`: pairing a filter with a sort on a different field needs a
 * composite index, which has to be deployed before it works. A customer has a
 * handful of orders, so they are sorted in the component instead.
 */
export function useLiveWhere<T extends Identified>(
  name: string,
  field: string,
  value: string,
  enabled = true,
): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({ items: [], ready: false, error: '' });

  useEffect(() => {
    if (!enabled || !value) {
      setState({ items: [], ready: true, error: '' });
      return;
    }

    setState((prev) => ({ ...prev, ready: false, error: '' }));

    const stop = onSnapshot(
      query(collection(db, name), where(field, '==', value)),
      (snap: QuerySnapshot<DocumentData>) => {
        setState({
          items: snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })),
          ready: true,
          error: '',
        });
      },
      (e) => {
        console.error(`Live ${name} where ${field} failed:`, e);
        setState({ items: [], ready: true, error: describe(e, name) });
      },
    );

    return stop;
  }, [name, field, value, enabled]);

  return state;
}

/** Subscribe to one document, falling back to `whenMissing` until it exists. */
export function useLiveDoc<T>(
  path: string,
  id: string,
  whenMissing: T,
  enabled = true,
): { value: T; ready: boolean; error: string } {
  const [state, setState] = useState({ value: whenMissing, ready: false, error: '' });

  useEffect(() => {
    if (!enabled || !id) {
      setState({ value: whenMissing, ready: true, error: '' });
      return;
    }

    const stop = onSnapshot(
      doc(db, path, id),
      (snap) => {
        setState({
          // Merged rather than replaced: a settings document written before a
          // field existed should not leave that field undefined everywhere.
          // Spreading a null fallback is a no-op, which is what lets this be
          // used for "the document, or null".
          value: snap.exists()
            ? ({ ...(whenMissing as object), ...(snap.data() as object) } as T)
            : whenMissing,
          ready: true,
          error: '',
        });
      },
      (e) => {
        console.error(`Live ${path}/${id} failed:`, e);
        setState({ value: whenMissing, ready: true, error: describe(e, path) });
      },
    );

    return stop;
    // `whenMissing` is a module-level constant at every call site; including it
    // would resubscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, id, enabled]);

  return state;
}

/* ------------------------------------------------------------------ writes -- */

/**
 * Write one record, creating or replacing it.
 *
 * `id` is stripped before writing. Firestore already knows a document's id from
 * its path, and storing it again gives two places for it to disagree.
 */
export async function putRecord<T extends Identified>(name: string, record: T): Promise<void> {
  const { id, ...rest } = record;
  await setDoc(doc(db, name, id), stripUndefined(rest));
}

/** Merge a partial change into one record. */
export async function patchRecord(
  name: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, name, id), stripUndefined(updates), { merge: true });
}

export async function removeRecord(name: string, id: string): Promise<void> {
  await deleteDoc(doc(db, name, id));
}

/**
 * Apply many writes as one request.
 *
 * Used by the bulk actions in the admin and by the first-run seed. Firestore
 * caps a batch at 500 operations, so the work is chunked rather than left to
 * fail at 501 -- the catalogue alone is 39 products today and the shop will add
 * more.
 */
export async function putMany<T extends Identified>(name: string, records: T[]): Promise<void> {
  for (let i = 0; i < records.length; i += 450) {
    const batch = writeBatch(db);
    for (const record of records.slice(i, i + 450)) {
      const { id, ...rest } = record;
      batch.set(doc(db, name, id), stripUndefined(rest));
    }
    await batch.commit();
  }
}

export async function patchMany(
  name: string,
  ids: string[],
  updates: Record<string, unknown>,
): Promise<void> {
  const clean = stripUndefined(updates);
  for (let i = 0; i < ids.length; i += 450) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + 450)) {
      batch.set(doc(db, name, id), clean, { merge: true });
    }
    await batch.commit();
  }
}

export async function removeMany(name: string, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 450) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + 450)) batch.delete(doc(db, name, id));
    await batch.commit();
  }
}

/**
 * Drop keys whose value is `undefined`.
 *
 * Firestore rejects `undefined` outright, and the optional fields on Product
 * and PaymentRecord -- hindiSubname, cacaoPercentage, verifiedBy -- are
 * `undefined` most of the time. Without this, saving an ordinary product throws
 * "Unsupported field value: undefined".
 *
 * Nested objects are cleaned too, because PaymentRecord arrives inside an
 * order rather than at the top level -- and so are objects inside arrays. That
 * last part was missing, on the reasoning that a hole in an array is data
 * rather than an absent field. True of an array of numbers; the arrays here are
 * lists of objects with optional fields, and leaving them alone was enough to
 * make every order write throw.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry)) as unknown as T;
  }
  if (value && typeof value === 'object' && (value as object).constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[key] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}
