/**
 * Finding your own order without being able to find anyone else's.
 *
 * Order numbers are printed on the confirmation and run in sequence --
 * OG-20260918-001, -002, -003. That is good for talking to a customer on
 * WhatsApp and terrible as a secret: anyone who has ordered once can count
 * upwards and read every other order placed that day, each carrying a name, a
 * phone number and a home address.
 *
 * So the order number alone opens nothing. Every order lives at a random
 * Firestore document id that is never displayed, and the only way to discover
 * that id is `orderLookup/{key}`, where the key is a SHA-256 of the order
 * number AND the phone number the order was placed with. Both, or neither.
 *
 * What this does and does not buy:
 *
 *   It stops enumeration, which is the attack that scales. Someone who already
 *   knows a specific customer's phone number and order number can read that
 *   customer's order -- but they knew the phone number, so the address is the
 *   only thing they gain, and they had to be targeting that person already.
 *
 *   It is not a password. The hash is unsalted, so it cannot resist someone who
 *   already has the full list of order numbers and a list of candidate phone
 *   numbers to test against it. Salting would mean storing a per-order secret
 *   the customer would then have to be given, which is the tracking-link design
 *   instead of this one.
 */

/**
 * Reduce a typed phone number to the ten digits that identify it.
 *
 * The same customer will write 98247 04877, +91 9824704877 and 09824704877 on
 * different days and mean the same phone. Since this feeds a hash, where one
 * different character produces a completely different key, normalising is what
 * makes a lookup work at all.
 */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // Indian mobile numbers are ten digits; 91 and a leading 0 are prefixes.
  return digits.slice(-10);
}

/** True once a phone number has enough digits to identify an order. */
export function isUsablePhone(raw: string): boolean {
  return normalisePhone(raw).length === 10;
}

/**
 * The document id under `orderLookup` for an order number and phone number.
 *
 * Both sides are normalised first so that the key computed at checkout and the
 * key computed on the tracking page agree: order numbers upper-cased, phone
 * numbers reduced to their last ten digits.
 */
export async function orderLookupKey(orderNumber: string, phone: string): Promise<string> {
  const material = `${orderNumber.trim().toUpperCase()}|${normalisePhone(phone)}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
