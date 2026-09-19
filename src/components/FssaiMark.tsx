import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

interface FssaiMarkProps {
  /** `dark` for the footer, `light` for the shop page. */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * The shop's FSSAI licence, displayed the way a food business must display it.
 *
 * Two deliberate decisions here.
 *
 * **It renders nothing without a licence number.** An earlier version of the
 * footer claimed "FSSAI Safety Standards Compliant" with no number on file,
 * which is a regulatory claim the shop could not have evidenced. The number is
 * the claim; without it there is nothing to say.
 *
 * **The emblem is a file, never drawn in code.** It is a government mark, and a
 * hand-made approximation would be wrong in its details while still reading as
 * official. `public/fssai-logo.png` holds the real artwork; if it is ever
 * missing this falls back to the typographic licence display that Indian
 * packaging uses anyway, rather than to an invented picture.
 *
 * **The emblem always sits on white**, in both tones. Its wordmark is navy on
 * a saffron-and-green rule, which on the footer's dark brown is close to
 * invisible -- and it is how the mark appears on every package it is printed
 * on. The white panel is not decoration, it is legibility.
 *
 * Note the mark used is the plain FSSAI wordmark, not the fuller lockup that
 * includes the State Emblem of India. The Ashoka pillar is separately
 * restricted under the State Emblem of India (Prohibition of Improper Use)
 * Act 2005, and a bakery has no business reproducing it.
 */
export const FssaiMark: React.FC<FssaiMarkProps> = ({ tone = 'light', className = '' }) => {
  const { storeSettings } = useStore();
  const [artworkFailed, setArtworkFailed] = useState(false);

  const licence = storeSettings.fssaiLicense?.trim();
  if (!licence) return null;

  const artwork = storeSettings.fssaiLogoUrl?.trim();
  const useArtwork = !!artwork && !artworkFailed;

  const dark = tone === 'dark';
  const frame = dark
    ? 'border-[#4A2D22] bg-[#2D1B14] text-[#D4C5B9]'
    : 'border-[#E8DFD8] bg-white text-[#5C4033]';
  const strong = dark ? 'text-white' : 'text-[#241510]';
  const quiet = dark ? 'text-[#A69286]' : 'text-[#8C766B]';

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-xl border px-3 py-2 ${frame} ${className}`}
    >
      {useArtwork ? (
        <span className="flex shrink-0 items-center rounded-md bg-white px-1.5 py-1">
          <img
            src={artwork}
            alt="FSSAI"
            width={460}
            height={232}
            onError={() => setArtworkFailed(true)}
            className="h-7 w-auto object-contain"
          />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={`shrink-0 rounded-md border px-1.5 py-1 text-[11px] font-bold leading-none tracking-[0.08em] ${
            dark ? 'border-emerald-500/50 text-emerald-400' : 'border-emerald-600/40 text-emerald-700'
          }`}
        >
          FSSAI
        </span>
      )}

      <span className="min-w-0 leading-tight">
        <span className={`block text-[10px] uppercase tracking-[0.12em] ${quiet}`}>
          FSSAI Lic. No.
        </span>
        <span className={`block font-mono text-xs font-semibold tabular-nums ${strong}`}>
          {licence}
        </span>
      </span>
    </div>
  );
};
