import React from 'react';

/**
 * The green mark, as India's Food Safety and Standards rules draw it: a filled
 * green circle inside a green square outline.
 *
 * It used to hang off a per-product `isVeg` flag, which implied the shop
 * sometimes sells something else and left a customer to check each card. It
 * does not. The whole kitchen is vegetarian and eggless, so this is a fact
 * about the shop rather than a property of a cake, and it is stated as one.
 *
 * Kept on the cards and in the bag all the same. People scan for this symbol
 * rather than read a sentence about it, and a card without it reads as an
 * unanswered question even on a shop where the answer is always yes.
 */
export const VegMark: React.FC<{ className?: string; label?: string }> = ({
  className = 'h-4 w-4',
  label = '100% vegetarian and eggless',
}) => (
  <span
    role="img"
    aria-label={label}
    title={label}
    className={`inline-flex shrink-0 items-center justify-center rounded-xs border border-emerald-600 bg-white/95 ${className}`}
  >
    <span className="h-[45%] w-[45%] rounded-full bg-emerald-600" />
  </span>
);

/** The same claim in words, for the places that have room to say it. */
export const VegBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800 ${className}`}
  >
    <VegMark className="h-3 w-3" label="" />
    100% Veg · Eggless
  </span>
);
