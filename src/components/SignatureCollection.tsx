import React from 'react';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, isBuyable } from '../types';
import { ProductImage } from './ProductImage';
import { formatRupees } from '../lib/pricing';

interface SignatureCollectionProps {
  onOpenProductDetails: (product: Product) => void;
}

/**
 * The Signature Collection: a handful of products shown large, with their
 * marketing names, above the full catalogue.
 *
 * Driven by `isSignature` on the product rather than hardcoded here, so the
 * shop chooses what is featured from the admin and each card links to the real
 * product. A featured item that is not yet priced and published still earns its
 * place in the showcase, but sends the customer to WhatsApp rather than
 * pretending it can be bought.
 *
 * The section renders nothing when nothing is flagged, so it cannot leave an
 * empty band on the page.
 */
export const SignatureCollection: React.FC<SignatureCollectionProps> = ({ onOpenProductDetails }) => {
  const { products, getWhatsAppSupportLink } = useStore();

  const signatures = products
    .filter((p) => p.isSignature)
    .sort((a, b) => (a.signatureOrder ?? 99) - (b.signatureOrder ?? 99));
  if (signatures.length === 0) return null;

  return (
    <section
      aria-labelledby="signature-collection-heading"
      className="rounded-2xl border border-[#EADBCE] bg-[#FFFDFA] p-5 sm:rounded-3xl sm:p-8"
    >
      <div className="mb-6 max-w-2xl">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E8DFD8] bg-white px-3 py-1 text-[11px] font-semibold text-[#5C4033]">
          <Sparkles className="h-3.5 w-3.5 text-[#C58940]" />
          <span>Signature Collection</span>
        </div>

        <h2
          id="signature-collection-heading"
          className="font-serif text-2xl font-bold tracking-tight text-[#2A1810] sm:text-3xl"
        >
          Our Most Craved Creations
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {signatures.map((product) => {
          const buyable = isBuyable(product);
          const title = product.signatureTitle || product.name;

          return (
            <article key={product.id} className="group flex flex-col">
              {/* Photography leads. A tall frame gives the photo room to be the
                  thing you notice first. */}
              <div className="relative mb-3.5 aspect-4/5 w-full overflow-hidden rounded-xl border border-[#EBE3DA] bg-[#F5EFE6] sm:rounded-2xl">
                <ProductImage
                  src={product.image}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent"
                />
              </div>

              <h3 className="font-serif text-lg font-bold leading-tight text-[#2A1810] sm:text-xl">
                {title}
              </h3>

              {product.signatureBlurb && (
                <p className="mt-1.5 text-xs leading-relaxed text-[#6B574E] sm:text-[13px]">
                  {product.signatureBlurb}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                {buyable ? (
                  <>
                    <span className="font-semibold tabular-nums text-[#2A1810]">
                      {formatRupees(product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenProductDetails(product)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#241510] px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#3D2317]"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <a
                    href={getWhatsAppSupportLink(title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5C4033] underline decoration-[#E8DFD8] underline-offset-4 transition-colors hover:text-[#241510] hover:decoration-[#C58940]"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    Enquire on WhatsApp
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
