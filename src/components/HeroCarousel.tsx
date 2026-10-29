import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Sparkles, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { VegMark } from './VegMark';
import { Banner, Coupon } from '../types';
import { formatRupees } from '../lib/pricing';

/**
 * The hero, as a carousel the shop writes.
 *
 * It used to be one fixed panel, and then one fixed panel plus whatever offers
 * were running. Every slide is the shop's now: a photograph, a headline, a line
 * under it, an optional discount, a button and a number saying where in the
 * run it goes. Admin -> Hero Slides.
 *
 * The slide below stands in when the shop has written none, so a new shop is
 * never looking at an empty panel. It is not mixed in with the shop's own: once
 * there is a first slide, that is the first slide.
 */

/**
 * A photo's address, safe to drop into `background-image`.
 *
 * Quoted, and with quotes and backslashes inside it escaped. An unquoted
 * `url(...)` cannot contain brackets, commas or spaces, which is most data URLs
 * and a fair number of ordinary ones -- the first version of this shipped
 * unquoted and the picture simply never appeared, with nothing in the console
 * to say why. The quoting is also what stops a URL the shop pasted from closing
 * the declaration and writing CSS of its own.
 */
function cssUrl(src: string): string {
  return `url("${src.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

/** How long each slide holds before the next, in milliseconds. */
const DWELL = 6500;

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  /** Rendered in the brand's gold italic, under the title. */
  accent?: string;
  body?: string;
  /** The discount, in the shop's own words or taken from a live coupon. */
  offer?: string;
  /** The coupon to quote, once it has been checked against the coupon table. */
  code?: string;
  /** A photograph behind the words. Without one the oven artwork shows. */
  photo?: string;
  cta: string;
  onCta: () => void;
}

/**
 * What a coupon is worth, said the way a customer would say it.
 *
 * Read from the coupon table rather than typed into the banner, so a slide
 * cannot go on advertising 20% off after the shop has changed it to 10%.
 */
function describeCoupon(coupon: Coupon): string {
  const amount =
    coupon.discountType === 'percentage'
      ? `${coupon.discountValue}% off`
      : `${formatRupees(coupon.discountValue)} off`;
  return coupon.minPurchase > 0
    ? `${amount} on orders over ${formatRupees(coupon.minPurchase)}`
    : amount;
}

export const HeroCarousel: React.FC = () => {
  const { banners, coupons, storeSettings, setActiveTab, setSelectedCategory, products } =
    useStore();

  const goToMenu = useCallback((category?: string | null) => {
    if (category) setSelectedCategory(category);
    document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
  }, [setSelectedCategory]);

  const hasSignature = products.some((p) => p.isSignature);

  const slides = useMemo<Slide[]>(() => {
    const own = banners
      .filter((b: Banner) => b.slot === 'hero' && b.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
      .map((b: Banner): Slide => {
        // Read from the coupon table rather than typed into the slide, so a
        // slide cannot go on advertising 20% off after the code has been
        // changed to 10%.
        const coupon = b.couponCode
          ? coupons.find((c) => c.code.toUpperCase() === b.couponCode?.trim().toUpperCase())
          : undefined;
        const offer = coupon ? describeCoupon(coupon) : b.offerText?.trim();
        return {
          key: b.id,
          eyebrow: offer ? 'Offer on now' : `Baked fresh daily in ${storeSettings.city}`,
          title: b.title,
          accent: b.subtitle,
          body: b.body,
          offer,
          code: offer ? coupon?.code ?? b.couponCode?.trim().toUpperCase() : undefined,
          photo: b.image?.trim() || undefined,
          cta: b.buttonText || 'See the menu',
          onCta: () => goToMenu(b.linkedCategory),
        };
      });

    if (own.length > 0) return own;

    /*
     * Nothing written yet. One slide about the shop, so the front page is
     * never a blank panel -- a shop setting itself up should see something
     * that looks like a shop.
     */
    return [
      {
        key: 'brand',
        eyebrow: `Baked fresh daily in ${storeSettings.city}`,
        title: 'Artisanal Premium Chocolates & Baked Items',
        body: `Chocolates, cakes, cookies, brownies, cupcakes, muffins and cheesecakes — made to order in a 100% vegetarian, eggless kitchen and delivered across ${storeSettings.city}.`,
        cta: 'See the menu',
        onCta: () => goToMenu(),
      },
    ];
  }, [banners, coupons, storeSettings.city, goToMenu]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  // A slide removed in the admin must not leave the carousel pointing past the
  // end of the list.
  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [index, slides.length]);

  const showPhoto = Boolean(slides[Math.min(index, slides.length - 1)]?.photo);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  /**
   * Advance on a timer, but not against the person reading.
   *
   * It stops while the pointer is over the panel or the keyboard focus is
   * inside it, and it never starts at all for someone who has asked their
   * system for reduced motion -- for whom a panel that rewrites itself every
   * few seconds is the problem, not the feature. They get the dots.
   */
  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => go(index + 1), DWELL);
    return () => window.clearTimeout(timer);
  }, [index, paused, slides.length, go]);

  return (
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
      {/*
        The banner.

        It used to be sized by padding alone, so its height was whatever the
        copy happened to need -- roughly square on a phone and a 3:1 letterbox
        on a desktop, with the content stranded in the left third and half the
        panel left empty. A minimum height per breakpoint fixes the shape, the
        content column is capped so lines stay a readable length, and the oven
        artwork fills the space the copy does not.

        The height is also what keeps a carousel from shuffling the page: slides
        differ in length, and without a floor the whole catalogue would jump up
        and down every few seconds.
      */}
      <div
        id="hero-showcase-banner"
        role="region"
        aria-roledescription="carousel"
        aria-label="Offers and what we bake"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={(e) => {
          touchStart.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const from = touchStart.current;
          touchStart.current = null;
          if (from === null) return;
          const moved = e.changedTouches[0].clientX - from;
          // Far enough to be a swipe rather than a tap that wandered.
          if (Math.abs(moved) > 45) go(index + (moved < 0 ? 1 : -1));
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(index + 1);
          if (e.key === 'ArrowLeft') go(index - 1);
        }}
        className="relative flex min-h-[21rem] items-center overflow-hidden rounded-3xl border border-[#48281B] bg-gradient-to-br from-[#1C0E08] via-[#2A140B] to-[#120704] p-6 text-white shadow-[0_20px_50px_-15px_rgba(229,169,60,0.18),0_0_35px_-5px_rgba(255,122,24,0.12)] sm:min-h-[24rem] sm:p-10 lg:min-h-[27rem] lg:p-14"
      >
        {/*
          The slide's photograph, if it has one.
          
          Crossfaded rather than swapped: every slide's picture is mounted and
          only the current one is opaque, so moving between slides does not
          blink white while the next file is fetched. `aria-hidden`, because the
          words beside it already say what it is.
        */}
        {slides.map((slide, i) =>
          slide.photo ? (
            <div
              key={`photo-${slide.key}`}
              aria-hidden="true"
              style={{ backgroundImage: cssUrl(slide.photo) }}
              className={`pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : null,
        )}

        {/*
          And a scrim over it, heaviest on the left where the words are.
          
          A photograph the shop chose is a photograph of a cake, not a backdrop
          designed for white text, so the contrast cannot be left to luck. This
          is the whole reason a picture can be dropped in without anyone
          checking it reads.
        */}
        {showPhoto && (
          <>
            {/*
              Two scrims, because the words sit differently at the two sizes.
              
              On a wide screen the copy is held in the left column and the
              picture has the right half to itself, so the veil fades out across
              it. On a phone the copy runs the full width -- the gold second
              line ran straight over the bright part of the photograph and
              became unreadable -- so there the veil is even, and heavier.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[#130905]/78 lg:hidden"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#130905]/88 via-[#130905]/55 to-[#130905]/10 lg:block"
            />
          </>
        )}

        {/* ========================================================= */}
        {/* LIGHT OVEN GLOW BACKGROUND LAYERS */}
        {/* Hidden behind a photograph: two backgrounds arguing is worse */}
        {/* than either. */}
        {/* ========================================================= */}
        <div className={showPhoto ? 'hidden' : 'contents'}>

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
          className="pointer-events-none absolute bottom-0 right-0 h-56 w-64 select-none opacity-40 transition-opacity sm:right-4 sm:h-72 sm:w-80 md:right-8 md:h-80 md:w-[26rem] md:opacity-60 lg:right-10 lg:h-[21rem] lg:w-[32rem]"
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
        </div>

          {/* Hero content.

              Capped at max-w-xl so the paragraph stays near sixty characters a
              line; anything wider and the eye loses its place returning to the
              left edge. */}
          <div className="relative z-10 grid w-full max-w-xl">
            {/*
              Every slide is rendered, stacked in the one grid cell, and all but
              the current one is `invisible`.
              
              The obvious version swaps the words in place, and the panel then
              changes height whenever a slide has a longer headline -- the
              catalogue below it jumps up and down every few seconds. Stacking
              makes the panel as tall as the tallest slide and keeps it there.
              
              `invisible` is visibility:hidden rather than opacity: it takes the
              hidden slides' buttons out of the tab order, which opacity would
              not, and `aria-hidden` keeps them out of a screen reader's way.
            */}
            {slides.map((slide, i) => (
            <div
              key={slide.key}
              aria-hidden={i !== index}
              style={{ gridArea: '1 / 1' }}
              className={i === index ? 'animate-hero-slide' : 'invisible'}
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E5A93C] backdrop-blur-md sm:text-[11px]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF7A18] shadow-[0_0_8px_#FF7A18]"
                />
                <span>{slide.eyebrow}</span>
              </p>

              {/*
                `text-balance` rather than a hand-placed line break: the title
                comes from the database on an offer slide, so there is no line
                for this file to break it on.
                
                Only the slide on screen is the page's `h1`. Every slide is in
                the DOM so the panel keeps its height, and three h1 elements
                would be three competing titles to a crawler or a screen reader
                however well hidden two of them are.
              */}
              {React.createElement(
                i === index ? 'h1' : 'p',
                {
                  className:
                    'mt-4 text-balance font-serif text-[1.75rem] font-bold leading-[1.08] tracking-tight text-white sm:mt-5 sm:text-4xl lg:text-5xl',
                },
                slide.title,
              )}

              {slide.accent && (
                <p className="mt-1.5 font-serif text-lg font-normal italic text-[#E5A93C] sm:text-xl">
                  {slide.accent}
                </p>
              )}

              {slide.offer && (
                <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#E5A93C]/40 bg-[#E5A93C]/10 px-3 py-2 text-sm font-semibold text-[#F6D99B]">
                  <Tag className="h-4 w-4 shrink-0 text-[#E5A93C]" />
                  <span>{slide.offer}</span>
                  {slide.code && (
                    <span className="rounded-md bg-[#E5A93C] px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-[#241510]">
                      {slide.code}
                    </span>
                  )}
                </p>
              )}

              {slide.body && (
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#D4C5B9] sm:mt-5 sm:text-base">
                  {slide.body}
                </p>
              )}

              {/*
                The weights are deliberately unequal. Gold is the way in; the
                outline is the short list. "Order on WhatsApp" used to be the
                second button and took the first screen's traffic somewhere
                other than the catalogue; it is the green mark in the corner.
              */}
              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center">
                <button
                  type="button"
                  id={i === index ? 'btn-hero-cta' : undefined}
                  onClick={slide.onCta}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#E5A93C] px-7 text-sm font-bold text-[#241510] shadow-md transition-colors hover:bg-[#D99A2B] active:scale-[0.98]"
                >
                  <span>{slide.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {hasSignature && (
                  <button
                    type="button"
                    id={i === index ? 'btn-hero-signature' : undefined}
                    onClick={() => {
                      setActiveTab('signature');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:border-[#E5A93C] hover:bg-white/5"
                  >
                    <Sparkles className="h-4 w-4 text-[#E5A93C]" />
                    <span>Our Most Craved Creations</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>
            </div>
            ))}

            {/*
              The claim the whole shop rests on, under the buttons where it is
              read as a fact rather than as one more badge competing for the
              eye.
            */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#CBB9AC]">
                <VegMark className="h-3.5 w-3.5" label="" />
                100% vegetarian · eggless kitchen
              </p>

              {/*
                The slide picker sits in the flow beside the claim rather than
                pinned to the panel's bottom-left corner, where on a phone it
                lay across those very words.
                
                Shown only when there is more than one slide: a single dot is a
                control that does nothing.
              */}
              {slides.length > 1 && (
                <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.key}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={slide.title}
                      onClick={() => go(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? 'w-7 bg-[#E5A93C]' : 'w-3 bg-white/35 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
  );
};
