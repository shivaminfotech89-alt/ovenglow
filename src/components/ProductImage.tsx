import React, { useState } from 'react';
import { CakeSlice } from 'lucide-react';

/**
 * A product photograph, or a branded placeholder.
 *
 * Catalogue items are seeded without photographs, and the shop's images are
 * hot-linked, so both "no URL" and "URL that failed to load" are ordinary
 * states rather than faults. Either way the tile keeps its shape instead of
 * collapsing to an empty box.
 */
export const ProductImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}> = ({ src, alt, className = '', lazy = true }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} — no photograph yet`}
        className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#F5EFE6] ${className}`}
      >
        <CakeSlice className="h-7 w-7 text-[#C58940]" aria-hidden="true" />
        <span className="px-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-[#A69286]">
          Photo coming soon
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={lazy ? 'lazy' : undefined}
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
