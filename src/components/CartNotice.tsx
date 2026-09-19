import React, { useEffect, useState } from 'react';
import { Check, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

/**
 * A brief confirmation that something went in the bag.
 *
 * Adding an item used to throw the bag drawer open over the whole screen. It
 * confirmed the add, but it also ended the shopping trip: the catalogue was
 * covered, and the quantity stepper the card turns into -- the way someone adds
 * three of something -- was behind the drawer.
 *
 * This says the same thing in a strip that does not take the page away, and
 * offers the bag to anyone who actually wanted it. It sits above the phone's
 * tab bar rather than under it.
 */
export const CartNotice: React.FC = () => {
  const { cartNotice, dismissCartNotice, setIsCartOpen, cart } = useStore();
  const [visible, setVisible] = useState(false);

  // Keyed on `at` so adding the same product twice re-shows it rather than
  // leaving the first notice to expire on the old timer.
  useEffect(() => {
    if (!cartNotice) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      dismissCartNotice();
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [cartNotice?.at, cartNotice, dismissCartNotice]);

  if (!cartNotice) return null;

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 z-40 flex justify-center px-4 transition-all duration-200 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
      style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-[#E8DFD8] bg-white py-2 pl-3 pr-2 shadow-lg">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Check className="h-3.5 w-3.5" />
        </span>

        <span className="min-w-0 flex-1 text-xs leading-tight">
          <span className="block truncate font-medium text-[#241510]">{cartNotice.name}</span>
          <span className="block text-[11px] text-[#8C766B]">
            Added · keep shopping, or check out
          </span>
        </span>

        <button
          type="button"
          onClick={() => {
            dismissCartNotice();
            setIsCartOpen(true);
          }}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#241510] px-3.5 text-[11px] font-semibold text-white hover:bg-[#3D2317]"
        >
          <ShoppingBag className="h-3.5 w-3.5 text-[#E5A93C]" />
          Bag
          <span className="rounded-full bg-white/20 px-1.5 tabular-nums">{count}</span>
        </button>

        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismissCartNotice}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8C766B] hover:text-[#241510]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
