import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { FssaiMark } from './FssaiMark';
import { HeroCarousel } from './HeroCarousel';
import { PRODUCT_CATEGORIES, Product, ProductCategory } from '../types';
import { 
  Sparkles, 
  Search, 
  Gift,
  Cake,
  Layers,
  Cookie,
  Coffee,
  Croissant,
  CakeSlice,
  IceCreamCone,
  Square,
  ArrowRight,
  X
} from 'lucide-react';

/** One icon per printed range, in catalogue order. */
const CATEGORY_ICONS: Record<ProductCategory, typeof Sparkles> = {
  'premium-chocolate': Layers,
  'brownie-indulgence': Square,
  'cookie-cravings': Cookie,
  'celebration-cakes': Cake,
  'tea-cakes': Coffee,
  'gourmet-cookies': Gift,
  'cupcake-dreams': IceCreamCone,
  'muffin-moments': Croissant,
  'cheesecake-heaven': CakeSlice,
};

/**
 * "Why Ovenglow Delights?" -- the shop's five promises, in the owner's words.
 *
 * This replaced an earlier "Our Promise" strip that made the same five points
 * in shorter form. Two sections saying the same thing on one page reads as
 * padding, so the richer version won and the emoji the shop chose came with it.
 * Emoji are decorative and hidden from screen readers; the number and title
 * carry the meaning.
 */
const WHY_OVENGLOW: { emoji: string; title: string; body: string }[] = [
  {
    emoji: '🟢',
    title: '100% Vegetarian',
    body: 'Every item is vegetarian and eggless. No exceptions, nothing to check.',
  },
  {
    emoji: '🍫',
    title: 'Premium Ingredients',
    body: 'We believe great desserts begin with great ingredients.',
  },
  {
    emoji: '✨',
    title: 'Small-Batch Craftsmanship',
    body: 'Made in limited batches so every creation receives the attention it deserves.',
  },
  {
    emoji: '🤎',
    title: 'Homemade Goodness',
    body: 'The warmth and comfort of homemade baking, elevated with premium presentation.',
  },
  {
    emoji: '🔥',
    title: 'Freshly Made',
    body: 'Freshness isn\u2019t an option. It\u2019s part of our promise.',
  },
  {
    emoji: '🎁',
    title: 'Made for Your Moments',
    body: 'Birthdays, anniversaries, festivals, gifting or simply \u201cI deserve something sweet.\u201d',
  },
];

interface ShopViewProps {
  onOpenProductDetails: (product: Product) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({ onOpenProductDetails }) => {
  const { 
    shopProducts,
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery, 
    storeSettings
  } = useStore();

  // One place for the shop's address, so changing it in Settings changes it
  // on the page.
  const shopEmail = storeSettings.email || 'ovenglowdelights@gmail.com';

  const categories: { id: string; label: string; icon: typeof Sparkles }[] = [
    { id: 'all', label: 'Everything', icon: Sparkles },
    ...PRODUCT_CATEGORIES.map((c) => ({
      id: c.id as string,
      label: c.label,
      icon: CATEGORY_ICONS[c.id],
    })),
  ];

  // Filtering
  const filteredProducts = shopProducts.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.hindiSubname && p.hindiSubname.includes(searchQuery)) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.flavorNotes.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  /**
   * The catalogue, cut into its ranges.
   *
   * "Everything" used to be one unbroken grid of thirty-nine cards: a muffin
   * next to a celebration cake next to a slab of chocolate, with nothing to say
   * where one range ended and the next began. Someone scrolling it had no idea
   * what they were looking at or how much was left.
   *
   * Cut into sections with the range's name above each, and the name stays on
   * screen while you scroll that section, so the answer to "what am I looking
   * at" is always on the page rather than somewhere above it.
   *
   * Only for "Everything". Picking a single range already says what it is, and
   * one heading over one grid is a label for something nobody asked about.
   * Empty ranges are dropped -- during a search most of them will be.
   */
  const sections =
    selectedCategory === 'all'
      ? PRODUCT_CATEGORIES.map((c) => ({
          ...c,
          icon: CATEGORY_ICONS[c.id],
          items: filteredProducts.filter((p) => p.category === c.id),
        })).filter((group) => group.items.length > 0)
      : null;

  const cardGrid = 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5';

  return (
    <div id="shop-view-container" className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      
      {/* The hero: the shop on the first slide, whatever is on offer after
          it. Admin -> Banners writes the offer slides. */}
      <HeroCarousel />

      {/* Why Ovenglow Delights -- sits directly under the hero so the reason to
          buy is read before the catalogue, and is the only place these five
          promises appear on the page. */}
      <section
        aria-labelledby="why-ovenglow-heading"
        className="rounded-2xl border border-[#EADBCE] bg-[#FAF5EE] p-4 sm:rounded-3xl sm:p-6"
      >
        <div className="mb-3.5 max-w-2xl sm:mb-4">
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#E8DFD8] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#5C4033]">
            <Sparkles className="h-3 w-3 text-[#C58940]" />
            <span>Why {storeSettings.storeName}</span>
          </div>

          <h2
            id="why-ovenglow-heading"
            className="font-serif text-lg font-bold tracking-tight text-[#2A1810] sm:text-xl lg:text-2xl"
          >
            What Makes Every Bite Special?
          </h2>
        </div>

        {/* The number, the emoji and the title share a line. They used to take
            two rows each, which ran the block to 876px on a phone -- taller
            than the screen -- for five short promises. */}
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3">
          {WHY_OVENGLOW.map((item, i) => (
            <li
              key={item.title}
              className="rounded-lg border border-[#E8DFD8] bg-white px-3.5 py-3 sm:rounded-xl"
            >
              <h3 className="flex items-baseline gap-1.5 font-serif text-sm font-bold leading-tight text-[#2A1810]">
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-[#C58940]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span aria-hidden="true" className="shrink-0 text-xs leading-none">
                  {item.emoji}
                </span>
                <span className="min-w-0">{item.title}</span>
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#6B574E]">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Category Filter & Active Top-Bar Search Section */}
      <div className="space-y-3">
        {/* Categories Pill Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/*
            An "Eggless only" filter used to lead this row, and a green tick on
            every card answered the same question again.
            
            Both are gone: the kitchen is entirely vegetarian and eggless, so a
            filter that never excludes anything is a control that does nothing,
            and the claim belongs to the shop rather than to each cake. It is
            made once in the hero and once in the promises below it, and the
            green mark stays on the cards because that is the symbol people
            actually scan for.
          */}
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex min-h-10 shrink-0 select-none items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-all ${
                  isSelected 
                    ? 'bg-[#2A1810] text-white border-[#2A1810] shadow-sm' 
                    : 'bg-white border-[#E8DFD8] text-[#5C4033] hover:border-[#2A1810] hover:text-[#2A1810]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E5A93C]' : 'text-[#8C766B]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Top Bar Search Banner */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs transition-all">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#C58940]" />
              <span className="text-[#5C4033]">
                Searching for <strong className="text-[#241510]">"{searchQuery}"</strong>
              </span>
              <span className="text-[11px] text-[#8C766B]">
                ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} found)
              </span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#8C766B] hover:text-[#241510] font-medium flex items-center gap-1 transition-colors underline"
            >
              <span>Clear search</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div id="product-catalog-grid">
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-0.5">
          <span className="text-xs font-medium tabular-nums text-[#8C766B]">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </span>


        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white border border-[#E8DFD8] space-y-3">
            {shopProducts.length === 0 ? (
              <>
                <p className="text-lg text-[#2A1810] font-serif font-bold">The menu is being set up</p>
                <p className="text-xs text-[#8C766B] max-w-md mx-auto">
                  Our {PRODUCT_CATEGORIES.length} ranges are loaded but not yet priced and published.
                  Message us on WhatsApp and we will take your order directly in the meantime.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-[#2A1810] font-serif font-bold">Nothing matches that search</p>
                <p className="text-xs text-[#8C766B]">
                  Try a different category, or clear your filters.
                </p>
              </>
            )}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-2 min-h-10 px-5 rounded-full bg-[#2A1810] text-white font-medium text-xs shadow-sm hover:bg-[#3D2317]"
            >
              Reset filters
            </button>
          </div>
        ) : sections ? (
          <div className="space-y-7 sm:space-y-9">
            {sections.map((group) => {
              const Icon = group.icon;
              return (
                <section key={group.id} aria-labelledby={`range-${group.id}`}>
                  {/*
                    An `h2`, not an `h3`: the cards inside carry `h3` for the
                    product name, and a range heading that ranks level with the
                    things under it tells a screen reader there is no nesting
                    here at all.
                    
                    Sticky under the site header rather than at the top of the
                    viewport: `--header-h` is measured by the header itself,
                    because its height is not a number anyone could type -- the
                    phone has a search row the desktop does not, and a signed-in
                    staff member adds a tab.
                    
                    Opaque, because cards scroll underneath it.
                  */}
                  <h2
                    id={`range-${group.id}`}
                    style={{ top: 'calc(var(--header-h, 5rem) + 0.25rem)' }}
                    className="sticky z-20 -mx-1 mb-3 flex items-center gap-2 rounded-lg bg-[#FAF7F2]/95 px-1 py-2 backdrop-blur-sm sm:mb-4"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#C58940]" />
                    <span className="font-serif text-base font-bold tracking-tight text-[#2A1810] sm:text-lg">
                      {group.label}
                    </span>
                    <span className="rounded-full bg-[#F2ECE4] px-2 py-0.5 text-[10px] font-medium tabular-nums text-[#8C766B]">
                      {group.items.length}
                    </span>
                    <span aria-hidden="true" className="ml-1 h-px flex-1 bg-[#EADBCE]" />
                  </h2>

                  <div className={cardGrid}>
                    {group.items.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpenDetails={onOpenProductDetails}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className={cardGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={onOpenProductDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Founder's Craft Note & Kitchen Guarantee */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#FAF5EE] border border-[#EADBCE] p-6 sm:p-10 space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8DFD8] text-[11px] font-semibold text-[#5C4033]">
            <Sparkles className="w-3.5 h-3.5 text-[#C58940]" />
            <span>From the Ovenglow Kitchen</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A1810] tracking-tight">
            Baked with love, crafted for delight
          </h3>

          <p className="text-xs sm:text-sm text-[#6B574E] leading-relaxed">
            Nine ranges — premium chocolate, brownies, cookies, celebration cakes, tea cakes, gourmet
            cookies, cupcakes, muffins and cheesecakes — baked in small batches to order. Tell us the
            occasion on WhatsApp and we will bake to suit it.
          </p>
        </div>

        {/* The promises themselves are made once, in "Why Ovenglow Delights?"
            above. What is left here is a fact: the FSSAI tile appears only once
            a real licence number is on file, because claiming certification
            without one is a claim the shop cannot back. */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <FssaiMark />
          {!storeSettings.fssaiLicense && (
            <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#E8DFD8] bg-white px-4 py-2.5">
              <span className="font-serif text-sm font-bold text-[#2A1810]">Order on WhatsApp</span>
              <span className="text-[11px] text-[#8C766B]">
                {storeSettings.whatsappNumber
                  ? `Message us on ${storeSettings.whatsappNumber}`
                  : 'Message us to place an order'}
              </span>
            </div>
          )}
        </div>

        {/* Direct Owner Inquiries */}
        <div className="pt-2 border-t border-[#E8DFD8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-[#8C766B]">
            <span>Planning a large order or corporate gifting? Write to us at </span>
            <strong className="font-mono font-semibold text-[#2A1810]">{shopEmail}</strong>
          </div>

          <a
            href={`mailto:${shopEmail}?subject=${encodeURIComponent('Bulk order enquiry')}`}
            className="inline-flex min-h-11 items-center gap-1.5 font-bold text-[#2A1810] transition-colors hover:text-[#C58940]"
          >
            <span>Send an enquiry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
};
