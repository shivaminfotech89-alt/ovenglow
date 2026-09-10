/**
 * Order and OTP generation.
 *
 * The previous scheme was `OG-` plus four random digits, which collides at
 * roughly a 50% chance by the 110th order. Order numbers are now date-scoped
 * with a sequence, so they are unique by construction and readable on a packing
 * slip; the caller passes the orders already in the system.
 */

import { Order } from '../types';

export function generateOrderNumber(existing: Order[]): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const prefix = `OG-${stamp}-`;

  const todaysHighest = existing
    .filter((o) => o.orderNumber.startsWith(prefix))
    .reduce((max, o) => {
      const seq = Number.parseInt(o.orderNumber.slice(prefix.length), 10);
      return Number.isFinite(seq) && seq > max ? seq : max;
    }, 0);

  return `${prefix}${String(todaysHighest + 1).padStart(3, '0')}`;
}

/**
 * A 6-digit handover PIN from the platform CSPRNG.
 * Six digits rather than four, because the previous 4-digit space was small
 * enough to guess by hand at the door.
 */
export function generateDeliveryOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

export function generateId(prefix: string): string {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return `${prefix}-${Date.now().toString(36)}-${buf[0].toString(36)}${buf[1].toString(36)}`;
}
