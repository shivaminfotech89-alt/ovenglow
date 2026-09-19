import React, { useMemo, useState } from 'react';
import { Copy, Check, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupees } from '../lib/pricing';
import { buildUpiLink, buildUpiQrSvg, canAcceptUpi } from '../lib/upi';

interface UpiPayPanelProps {
  amount: number;
  /** The order number, so the shop can match the payment to the order. */
  reference: string;
  className?: string;
}

/**
 * How a customer pays in advance.
 *
 * The shop takes payment up front, and before this the whole instruction was
 * "here is our UPI id" -- leaving the customer to open their payment app, type
 * an id by hand, type the amount by hand, and remember to mention the order
 * number. Three chances to get it wrong, and the shop reconciling by eye
 * afterwards.
 *
 * The QR carries all three. Scanning opens their app with the shop, the exact
 * amount and the order number already filled in.
 *
 * Both routes are offered, because they are used in different rooms. Someone at
 * a laptop scans the code with their phone. Someone already on their phone
 * cannot scan their own screen, so they get a button that opens their payment
 * app directly, and the id to copy if that fails.
 *
 * Nothing here asserts a payment happened. The customer still submits their UPI
 * reference and the shop still checks it against the bank before the order
 * moves on -- a screenshot is not money received.
 */
export const UpiPayPanel: React.FC<UpiPayPanelProps> = ({ amount, reference, className = '' }) => {
  const { storeSettings, getWhatsAppSupportLink } = useStore();
  const [copied, setCopied] = useState(false);

  const ready = canAcceptUpi(storeSettings);

  const link = useMemo(
    () =>
      ready
        ? buildUpiLink({
            payeeVpa: storeSettings.upiId,
            payeeName: storeSettings.upiAccountName || storeSettings.storeName,
            amount,
            note: reference,
          })
        : '',
    [ready, storeSettings.upiId, storeSettings.upiAccountName, storeSettings.storeName, amount, reference],
  );

  // Regenerating on every render would redraw the code on each keystroke in the
  // reference box below it.
  const qrSvg = useMemo(() => (link ? buildUpiQrSvg(link, 200) : ''), [link]);

  /**
   * Nothing to show until the shop has set a UPI id.
   *
   * Rendering a dead QR, or a "Pay to:" with a blank beside it, would look like
   * the shop had lost the customer's money somewhere. WhatsApp is the honest
   * fallback: a human sends the details.
   */
  if (!ready) {
    return (
      <div className={`rounded-xl border border-amber-300 bg-white px-3 py-2.5 ${className}`}>
        <p className="text-[11px] leading-relaxed text-amber-900">
          We will send payment details on WhatsApp.{' '}
          <a
            href={getWhatsAppSupportLink(`Payment for ${reference}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            Message us
          </a>{' '}
          if you would like them now.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-amber-300 bg-white p-3 sm:p-4 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="mx-auto shrink-0 sm:mx-0">
          {/* Generated here from a URL this code built, never from anything a
              customer typed, so there is nothing to sanitise. */}
          <div
            className="overflow-hidden rounded-lg border border-[#E8DFD8] bg-white p-1.5"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.12em] text-[#8C766B]">
              Scan to pay
            </span>
            <span className="block font-serif text-xl font-bold tabular-nums text-[#241510]">
              {formatRupees(amount)}
            </span>
            <span className="mt-0.5 block text-[11px] text-[#6B574E]">
              to {storeSettings.upiAccountName || storeSettings.storeName} · {reference}
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-[#6B574E]">
            Any UPI app — GPay, PhonePe, Paytm or your bank&rsquo;s. The amount and order
            number are already in the code.
          </p>

          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            {/* Useful only on the device that has the payment apps, and
                pointless on a desktop where the QR is the answer. */}
            <a
              href={link}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#241510] px-4 text-xs font-semibold text-white hover:bg-[#3D2317] sm:hidden"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Open my payment app
            </a>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(storeSettings.upiId);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Clipboard is blocked outside a secure context and in some
                  // in-app browsers; the id is on screen to read either way.
                }
              }}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#E8DFD8] px-3 font-mono text-[11px] text-[#241510] transition-colors hover:border-[#8C766B]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#8C766B]" /> {storeSettings.upiId}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
