import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupees } from '../lib/pricing';
import { ProductCard } from './ProductCard';
import { SignatureCollection } from './SignatureCollection';
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
  ShieldCheck,
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
    isVegOnly,
    storeSettings
  } = useStore();

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
    const matchesVeg = !isVegOnly || p.isVeg;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.hindiSubname && p.hindiSubname.includes(searchQuery)) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.flavorNotes.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesVeg && matchesSearch;
  });

  return (
    <div id="shop-view-container" className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      
      {/* Light Atmospheric Hearth & Oven Glow spreading across the Hero Page Canvas Background */}
      <div className="relative">
        <div 
          aria-hidden="true" 
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-[96%] max-w-6xl h-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF9933]/15 via-[#E5A93C]/8 to-transparent rounded-full blur-3xl pointer-events-none -z-10 animate-oven-glow" 
        />
        <div 
          aria-hidden="true" 
          className="absolute -top-6 right-6 sm:right-16 w-80 sm:w-[480px] h-80 sm:h-[480px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-[#FF7A18]/16 via-[#E5A93C]/8 to-transparent rounded-full blur-3xl pointer-events-none -z-10" 
        />
        <div 
          aria-hidden="true" 
          className="absolute -bottom-8 left-8 sm:left-20 w-72 sm:w-96 h-40 bg-[radial-gradient(ellipse,_var(--tw-gradient-stops))] from-[#E5A93C]/10 via-[#FF9933]/5 to-transparent rounded-full blur-2xl pointer-events-none -z-10" 
        />

        {/* Hero Showcase Banner - Haute Confectionery with Ambient Light Deck-Oven Glow */}
        <div 
          id="hero-showcase-banner"
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1C0E08] via-[#2A140B] to-[#120704] text-white border border-[#48281B] shadow-[0_20px_50px_-15px_rgba(229,169,60,0.18),0_0_35px_-5px_rgba(255,122,24,0.12)] p-6 sm:p-10 md:p-12"
        >
          {/* ========================================================= */}
          {/* LIGHT OVEN GLOW BACKGROUND LAYERS */}
          {/* ========================================================= */}

          {/* 1. Primary Gentle Hearth Radiant Glow */}
          <div 
            aria-hidden="true"
            className="absolute right-0 bottom-0 w-[420px] sm:w-[580px] md:w-[700px] h-[300px] sm:h-[400px] rounded-full pointer-events-none opacity-85"
            style={{
              background: 'radial-gradient(ellipse at 80% 90%, rgba(255, 120, 30, 0.24) 0%, rgba(229, 169, 60, 0.16) 32%, rgba(197, 137, 64, 0.08) 55%, transparent 75%)'
            }}
          />

          {/* 2. Secondary Breathing Oven Hearth Glow (Soft pulsation) */}
          <div 
            aria-hidden="true"
            className="absolute -right-16 -bottom-16 w-80 sm:w-[480px] h-80 sm:h-[480px] rounded-full bg-gradient-to-tl from-[#FF7A18]/20 via-[#E5A93C]/12 to-transparent blur-3xl pointer-events-none animate-oven-glow"
          />

          {/* 3. Subtle Warm Ambient Floor Spill from the Oven Mouth */}
          <div 
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FF9933]/12 via-[#E5A93C]/5 to-transparent pointer-events-none"
          />

          {/* 4. Artistic Deck-Oven Hearth Silhouette in the Background (Right side) */}
          <div 
            aria-hidden="true"
            className="absolute right-0 sm:right-6 md:right-12 bottom-0 w-64 sm:w-80 md:w-96 h-56 sm:h-72 pointer-events-none select-none opacity-45 md:opacity-65 transition-opacity"
          >
            {/* Deck Oven Arched Hearth Graphic */}
            <svg viewBox="0 0 320 240" className="w-full h-full" fill="none">
              <defs>
                {/* Hearth Firelight Gradients */}
                <radialGradient id="ovenHearthGlow" cx="50%" cy="85%" r="70%">
                  <stop offset="0%" stopColor="#FFF4DE" stopOpacity="0.95" />
                  <stop offset="25%" stopColor="#FFB347" stopOpacity="0.75" />
                  <stop offset="55%" stopColor="#FF6B1A" stopOpacity="0.45" />
                  <stop offset="85%" stopColor="#8A2B0E" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1A0D08" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="ovenArchStone" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4A2A1D" stopOpacity="0.65" />
                  <stop offset="50%" stopColor="#361C13" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#24110A" stopOpacity="0.95" />
                </linearGradient>

                <linearGradient id="flameBeam" x1="50%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#FF9933" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#FF9933" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Radiant Hearth Light Core */}
              <path
                d="M 50,240 A 110,110 0 0,1 270,240 Z"
                fill="url(#ovenHearthGlow)"
                className="animate-flame-flicker"
              />

              {/* Deck Oven Stone Arch Frame */}
              <path
                d="M 35,240 A 125,125 0 0,1 285,240 L 265,240 A 105,105 0 0,0 55,240 Z"
                fill="url(#ovenArchStone)"
                stroke="#6B3B26"
                strokeWidth="1.5"
                strokeOpacity="0.45"
              />

              {/* Refractory brick mortar grooves on arch */}
              <path
                d="M 80,165 L 68,155 M 115,130 L 108,116 M 160,116 L 160,102 M 205,130 L 212,116 M 240,165 L 252,155"
                stroke="#E5A93C"
                strokeWidth="1.5"
                strokeOpacity="0.35"
              />

              {/* Radiant Heat Rays emanating from oven mouth */}
              <polygon points="160,180 80,240 240,240" fill="url(#flameBeam)" />

              {/* Warm Baking Deck Floor Line */}
              <line x1="40" y1="236" x2="280" y2="236" stroke="#FF9933" strokeWidth="2.5" strokeOpacity="0.6" />
              <line x1="70" y1="232" x2="250" y2="232" stroke="#FFF2D6" strokeWidth="1.5" strokeOpacity="0.45" />
            </svg>

            {/* Floating Warm Micro-Embers Rising from the Oven */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <span 
                className="absolute bottom-6 left-1/3 w-1.5 h-1.5 rounded-full bg-[#FFB347] shadow-[0_0_8px_#FF9933] animate-ember-rise"
                style={{ animationDelay: '0s', animationDuration: '3.8s' }} 
              />
              <span 
                className="absolute bottom-8 left-1/2 w-1 h-1 rounded-full bg-[#FFE5B4] shadow-[0_0_6px_#FF9933] animate-ember-rise" 
                style={{ animationDelay: '1.2s', animationDuration: '4.2s' }} 
              />
              <span 
                className="absolute bottom-5 right-1/3 w-1.5 h-1.5 rounded-full bg-[#FF8C38] shadow-[0_0_8px_#E25822] animate-ember-rise" 
                style={{ animationDelay: '2.3s', animationDuration: '3.6s' }} 
              />
              <span 
                className="absolute bottom-10 left-[42%] w-1 h-1 rounded-full bg-[#FFD700] shadow-[0_0_6px_#FF9933] animate-ember-rise" 
                style={{ animationDelay: '0.7s', animationDuration: '4.6s' }} 
              />
            </div>
          </div>

          {/* 5. Subtle Top-Right Oven Temperature Indicator */}
          <div className="hidden sm:inline-flex items-center gap-2 absolute top-6 right-8 px-3.5 py-1.5 rounded-full bg-[#241510]/70 backdrop-blur-md border border-[#E5A93C]/30 text-[#E5A93C] text-[11px] font-medium shadow-sm z-10 select-none">
            <span className="w-2 h-2 rounded-full bg-[#FF7A18] animate-pulse shadow-[0_0_8px_#FF7A18]" />
            <span>Baked fresh daily</span>
          </div>

          {/* Left Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#E5A93C] text-[11px] font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>Baked with Love • Crafted for Delight • {storeSettings.city}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.08]">
              Delights <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#E5A93C]">Crafted to Crave</span>
            </h1>

            <p className="text-[#D4C5B9] text-xs sm:text-sm md:text-base font-normal leading-relaxed max-w-xl">
              Cakes, cookies, brownies, cupcakes, muffins and cheesecakes — baked fresh for every occasion, and delivered across {storeSettings.city}.
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-[#E5A93C] hover:bg-[#D99A2B] text-[#241510] font-bold rounded-full shadow-md text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Explore the Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-medium text-[#E8DFD8]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Free delivery over {formatRupees(storeSettings.freeDeliveryThreshold)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Ovenglow Delights -- sits directly under the hero so the reason to
          buy is read before the catalogue, and is the only place these five
          promises appear on the page. */}
      <section
        aria-labelledby="why-ovenglow-heading"
        className="rounded-2xl border border-[#EADBCE] bg-[#FAF5EE] p-5 sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E8DFD8] bg-white px-3 py-1 text-[11px] font-semibold text-[#5C4033]">
            <Sparkles className="h-3.5 w-3.5 text-[#C58940]" />
            <span>Why {storeSettings.storeName}?</span>
          </div>

          <h2
            id="why-ovenglow-heading"
            className="font-serif text-2xl font-bold tracking-tight text-[#2A1810] sm:text-3xl"
          >
            What Makes Every Bite Special?
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_OVENGLOW.map((item, i) => (
            <li
              key={item.title}
              className="rounded-xl border border-[#E8DFD8] bg-white p-4 sm:p-5"
            >
              <div className="mb-2 flex items-center gap-2.5">
                <span className="font-serif text-lg font-bold tabular-nums text-[#C58940]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span aria-hidden="true" className="text-base leading-none">
                  {item.emoji}
                </span>
              </div>

              <h3 className="font-serif text-base font-bold leading-tight text-[#2A1810] sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#6B574E] sm:text-[13px]">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <SignatureCollection onOpenProductDetails={onOpenProductDetails} />

      {/* Category Filter & Active Top-Bar Search Section */}
      <div className="space-y-3">
        {/* Categories Pill Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all select-none border ${
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
          <span className="text-xs font-medium text-[#8C766B]">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </span>

          {isVegOnly && (
            <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              100% Eggless Only
            </span>
          )}
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
              className="mt-2 px-5 py-2 rounded-full bg-[#2A1810] text-white font-medium text-xs shadow-sm hover:bg-[#3D2317]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
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

        {/* Only the factual tile remains here; the promises themselves live in
            the Our Promise section above rather than being said twice. The
            FSSAI tile appears only once a real licence number is on file --
            claiming certification without one is a claim we cannot back. */}
        <div className="pt-1">
          {storeSettings.fssaiLicense ? (
            <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#E8DFD8] bg-white px-4 py-2.5">
              <span className="font-serif text-sm font-bold text-[#2A1810]">FSSAI Licensed</span>
              <span className="font-mono text-[11px] text-[#8C766B]">
                Lic. {storeSettings.fssaiLicense}
              </span>
            </div>
          ) : (
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
            <span>Corporate gifting or bespoke tasting box? Direct atelier email: </span>
            <strong className="font-mono text-[#2A1810] font-semibold">ovenglowdelights@gmail.com</strong>
          </div>

          <a
            href="mailto:ovenglowdelights@gmail.com?subject=Custom%20Ovenglow%20Gifting%20Inquiry"
            className="inline-flex items-center gap-1.5 font-bold text-[#2A1810] hover:text-[#C58940] transition-colors"
          >
            <span>Request Bespoke Tasting Box</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
};
