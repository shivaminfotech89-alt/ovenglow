import React from 'react';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { SignatureCollection } from './SignatureCollection';

interface SignatureViewProps {
  onOpenProductDetails: (product: Product) => void;
}

/**
 * The Signature Collection as its own page.
 *
 * It used to sit on the shop page above the catalogue, which pushed the menu
 * itself below the fold. The menu now leads the shop page and the showcase gets
 * room of its own here.
 */
export const SignatureView: React.FC<SignatureViewProps> = ({ onOpenProductDetails }) => {
  const { products, setActiveTab, getWhatsAppSupportLink, storeSettings } = useStore();
  const count = products.filter((p) => p.isSignature).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E8DFD8] bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C4033]">
          <Sparkles className="h-3.5 w-3.5 text-[#C58940]" />
          <span>Signature Collection</span>
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#241510] sm:text-4xl">
          Our Most Craved Creations
        </h1>

        <p className="text-xs leading-relaxed text-[#6B574E] sm:text-sm">
          The few we are asked for again and again. Everything else lives on the full menu.
        </p>
      </header>

      {count === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-[#E8DFD8] bg-white p-8 text-center shadow-xs">
          <h2 className="font-serif text-base font-bold text-[#241510]">
            Nothing featured just yet
          </h2>
          <p className="mt-1 text-xs text-[#8C766B]">
            Browse the full menu, or message us and we will suggest something.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setActiveTab('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#241510] px-5 text-xs font-semibold text-white hover:bg-[#3D2317]"
            >
              See the full menu <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <a
              href={getWhatsAppSupportLink('Recommendations')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E8DFD8] bg-white px-5 text-xs font-medium text-[#5C4033] hover:text-[#241510]"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" /> Ask us
            </a>
          </div>
        </div>
      ) : (
        <>
          <SignatureCollection onOpenProductDetails={onOpenProductDetails} showHeading={false} />

          <div className="rounded-2xl border border-[#EADBCE] bg-[#FAF5EE] p-6 text-center sm:p-8">
            <h2 className="font-serif text-xl font-bold text-[#2A1810] sm:text-2xl">
              There is plenty more
            </h2>
            <p className="mx-auto mt-1.5 max-w-lg text-xs leading-relaxed text-[#6B574E] sm:text-sm">
              Nine ranges of cakes, cookies, brownies, cupcakes, muffins and cheesecakes, baked fresh
              across {storeSettings.city}.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#241510] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#3D2317] sm:text-sm"
            >
              Browse the full menu <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
