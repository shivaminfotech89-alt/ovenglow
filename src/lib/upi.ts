import qrcode from 'qrcode-generator';
import { StoreSettings } from '../types';

/**
 * UPI payment links and the QR codes that carry them.
 *
 * A UPI QR is not a picture of a bank account -- it is a `upi://pay` URL
 * encoded as a QR. Every Indian payment app reads the same format, so one code
 * works in GPay, PhonePe, Paytm and a bank's own app alike.
 *
 * The point of generating it per order rather than printing one code and taping
 * it up: the amount and the order number travel inside the link. The customer
 * scans, their app opens already showing ₹850 to Ovenglow Delights with the
 * order number in the note, and they press send. Nothing is typed, so nothing
 * is typed wrong -- and the shop can match the payment to the order afterwards,
 * which is the part a static code makes guesswork.
 *
 * Spec: NPCI's UPI Linking Specification.
 */

export interface UpiRequest {
  /** The shop's UPI id, e.g. ovenglow@okhdfcbank. */
  payeeVpa: string;
  payeeName: string;
  amount: number;
  /** Shown as the payment note; the order number, so the shop can match it. */
  note?: string;
}

/** True when the shop has filled in enough for a customer to pay by UPI. */
export function canAcceptUpi(settings: StoreSettings): boolean {
  return isPlausibleVpa(settings.upiId);
}

/**
 * A light sanity check on a UPI id: `something@handle`.
 *
 * Deliberately not strict. Handles multiply every year -- @okaxis, @ybl,
 * @paytm, @fbl and dozens more -- and a rule tight enough to reject a typo
 * would eventually reject a real, new one. This catches an empty box or an
 * email-shaped mistake and leaves the rest to the payment app, which is the
 * only thing that can truly say whether an id exists.
 */
export function isPlausibleVpa(value: string | undefined): boolean {
  const vpa = (value ?? '').trim();
  return /^[a-zA-Z0-9._-]{2,}@[a-zA-Z][a-zA-Z0-9.]{1,}$/.test(vpa);
}

/**
 * Build the `upi://pay` link.
 *
 * Amounts are fixed to two decimals because some apps reject `am=850` while
 * accepting `am=850.00`, and a customer meeting a silent failure at the moment
 * of paying will simply not pay.
 */
export function buildUpiLink({ payeeVpa, payeeName, amount, note }: UpiRequest): string {
  const params = new URLSearchParams({
    pa: payeeVpa.trim(),
    pn: payeeName.trim(),
    am: Math.max(0, amount).toFixed(2),
    cu: 'INR',
  });
  if (note) params.set('tn', note.trim().slice(0, 50));

  // Two corrections to what URLSearchParams produces, both about what payment
  // apps actually accept rather than what the URL spec permits:
  //
  //   '+' for a space is legal in a query string, and some UPI apps render it
  //   literally as "Ovenglow+Delights" on the confirmation screen.
  //
  //   '@' is a legal query character that does not need escaping, and every
  //   published UPI example writes the id plainly. %40 is correct by the spec
  //   and still the sort of thing an older app's hand-rolled parser mishandles;
  //   there is nothing to gain by escaping it.
  return `upi://pay?${params.toString().replace(/\+/g, '%20').replace(/%40/g, '@')}`;
}

/**
 * The link as an SVG QR code.
 *
 * SVG rather than a canvas or a PNG: it stays sharp on any screen at any size,
 * costs a couple of kilobytes, and needs no ref or layout pass to draw. Error
 * correction is M -- roughly 15% of the code can be obscured and still scan,
 * which is the usual choice for a code shown on a screen and covers a fingerprint
 * or a glare spot on a phone.
 *
 * Returns an `<svg>` string. Safe to inject: every byte of it is generated
 * here from a URL this code built, never from anything a customer typed.
 */
export function buildUpiQrSvg(link: string, sizePx = 220): string {
  // Type 0 lets the library pick the smallest version that fits the data.
  const qr = qrcode(0, 'M');
  qr.addData(link);
  qr.make();

  const modules = qr.getModuleCount();
  const cells: string[] = [];
  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (qr.isDark(row, col)) cells.push(`M${col} ${row}h1v1h-1z`);
    }
  }

  // A quiet zone of 4 modules is part of the spec, not padding: scanners use it
  // to find the code's edges, and without it many simply will not read.
  const quiet = 4;
  const extent = modules + quiet * 2;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${extent} ${extent}"`,
    ` width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges" role="img"`,
    ` aria-label="UPI payment QR code">`,
    `<rect width="${extent}" height="${extent}" fill="#ffffff"/>`,
    `<g transform="translate(${quiet} ${quiet})" fill="#241510">`,
    `<path d="${cells.join('')}"/>`,
    `</g></svg>`,
  ].join('');
}
