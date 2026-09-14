import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

interface OvenglowLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * The Ovenglow Delights brand mark.
 *
 * Prefers the shop's real logo file: whatever `storeSettings.logoUrl` points at,
 * which defaults to `/logo.png`. Drop the artwork in `public/logo.png` and it
 * appears everywhere the mark is used, with no code change.
 *
 * When that file is absent (or fails to load) the drawn mark below stands in.
 * It follows the real logo's composition -- silver on deep maroon, OVENGLOW
 * arched over an OG monogram with a cupcake set in the O and a leaf on the G,
 * then DELIGHTS and CRAFTED TO CRAVE beneath -- but it is a stand-in, not the
 * artwork itself.
 */
export const OvenglowLogo: React.FC<OvenglowLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: { dimension: 38, textSize: 'text-sm sm:text-base', subSize: 'text-[9px]' },
    md: { dimension: 50, textSize: 'text-xl', subSize: 'text-[11px]' },
    lg: { dimension: 76, textSize: 'text-2xl', subSize: 'text-xs' },
    xl: { dimension: 110, textSize: 'text-4xl', subSize: 'text-sm' },
  };

  const current = sizeMap[size];
  const { storeSettings } = useStore();
  const [artworkFailed, setArtworkFailed] = useState(false);
  const useArtwork = !!storeSettings.logoUrl && !artworkFailed;

  return (
    <div
      id="ovenglow-brand-logo"
      onClick={onClick}
      className={`flex min-w-0 items-center gap-3 select-none cursor-pointer group ${className}`}
    >
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105"
        style={{ width: current.dimension, height: current.dimension }}
      >
        {useArtwork ? (
          <img
            src={storeSettings.logoUrl}
            alt={`${storeSettings.storeName} logo`}
            onError={() => setArtworkFailed(true)}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`${storeSettings.storeName} logo`}>
            <defs>
              {/* Brushed-silver sweep, the closest flat equivalent to the
                  embossed metal in the real mark. */}
              <linearGradient id="ogSilver" x1="12%" y1="0%" x2="88%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="34%" stopColor="#E9EDF0" />
                <stop offset="58%" stopColor="#A9B0B7" />
                <stop offset="78%" stopColor="#F2F5F7" />
                <stop offset="100%" stopColor="#C8CFD5" />
              </linearGradient>

              <radialGradient id="ogMaroon" cx="42%" cy="34%" r="78%">
                <stop offset="0%" stopColor="#6A1E2C" />
                <stop offset="70%" stopColor="#4A1520" />
                <stop offset="100%" stopColor="#350F18" />
              </radialGradient>

              <path id="ogArcTop" d="M 32,102 A 68,68 0 0 1 168,102" fill="none" />
            </defs>

            <circle cx="100" cy="100" r="100" fill="url(#ogMaroon)" />

            {/* Outer ring, broken at the foot where the tagline sits */}
            <circle
              cx="100"
              cy="100"
              r="89"
              fill="none"
              stroke="url(#ogSilver)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="404 155"
              strokeDashoffset="-78"
            />

            <text
              fontSize="21"
              fontWeight="700"
              letterSpacing="5.5"
              fill="url(#ogSilver)"
              fontFamily="'Cinzel', Georgia, serif"
            >
              <textPath href="#ogArcTop" startOffset="50%" textAnchor="middle">
                OVENGLOW
              </textPath>
            </text>

            {/* OG monogram */}
            <g transform="translate(100,104)">
              {/* O */}
              <circle cx="-27" cy="0" r="35" fill="none" stroke="url(#ogSilver)" strokeWidth="7" />

              {/* Cupcake set inside the O */}
              <g transform="translate(-27,2) scale(0.62)" fill="none" stroke="url(#ogSilver)" strokeLinecap="round">
                <path d="M -19,9 L -13,34 L 13,34 L 19,9 Z" strokeWidth="4" />
                <line x1="-7" y1="13" x2="-5" y2="32" strokeWidth="2.6" />
                <line x1="1" y1="13" x2="1" y2="32" strokeWidth="2.6" />
                <line x1="9" y1="13" x2="7" y2="32" strokeWidth="2.6" />
                <path d="M -23,7 C -23,-3 -10,-11 0,-11 C 10,-11 23,-3 23,7 Z" strokeWidth="4" />
                <path d="M -15,-8 C -15,-19 -4,-23 0,-23 C 4,-23 15,-19 15,-8" strokeWidth="4" />
                <circle cx="0" cy="-29" r="5" fill="url(#ogSilver)" stroke="none" />
              </g>

              {/* G, overlapping the O as in the mark, with its swash tail */}
              <path
                d="M 47,-20 C 34,-36 8,-33 1,-11 C -6,13 10,31 30,28 C 42,26 50,17 50,4 L 27,4"
                fill="none"
                stroke="url(#ogSilver)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 50,4 C 50,24 41,37 21,41"
                fill="none"
                stroke="url(#ogSilver)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Leaf above the G */}
              <path d="M 33,-34 C 39,-48 56,-48 58,-36 C 53,-26 39,-26 33,-34 Z" fill="url(#ogSilver)" />
            </g>

            <text
              x="100"
              y="156"
              fontSize="11"
              fontWeight="700"
              letterSpacing="6"
              fill="url(#ogSilver)"
              textAnchor="middle"
              fontFamily="'Cinzel', Georgia, serif"
            >
              · DELIGHTS ·
            </text>

            <text
              x="100"
              y="170"
              fontSize="8"
              fontWeight="600"
              letterSpacing="3.4"
              fill="url(#ogSilver)"
              textAnchor="middle"
              fontFamily="'Cinzel', Georgia, serif"
            >
              CRAFTED TO CRAVE
            </text>

            {/* Flourish and heart */}
            <path
              d="M 66,178 C 77,173 88,181 100,181 C 112,181 123,173 134,178"
              fill="none"
              stroke="url(#ogSilver)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M 100,183.5 C 98.5,181 95,181.2 95,183.5 C 95,185.8 100,188.5 100,188.5 C 100,188.5 105,185.8 105,183.5 C 105,181.2 101.5,181 100,183.5 Z"
              fill="url(#ogSilver)"
            />
          </svg>
        )}
      </div>

      {showSubtitle && (
        <div className="flex min-w-0 flex-col">
          <span
            className={`whitespace-nowrap font-black uppercase tracking-tighter text-[#4A2C2A] group-hover:text-[#FF9933] transition-colors ${current.textSize}`}
          >
            {storeSettings.storeName}
          </span>
          <span
            className={`hidden min-w-0 items-center gap-1.5 font-black uppercase tracking-[0.2em] text-[#A68A78] sm:flex ${current.subSize}`}
          >
            <span className="truncate">{storeSettings.tagline}</span>
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#25D366]" />
          </span>
        </div>
      )}
    </div>
  );
};
