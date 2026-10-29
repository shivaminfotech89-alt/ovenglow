import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageOff, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Banner, ProductCategory } from '../../types';
import { formatRupees } from '../../lib/pricing';
import { ImageField } from './ImageField';
import { Drawer, EmptyState, Field, btnGhost, btnPrimary, inputClass, useToast } from './ui';

/**
 * The slides at the top of the shop front.
 *
 * The hero was one panel written in the code, then a panel plus whatever
 * coupons were running. Every slide is the shop's now, and this is where they
 * are written: a photograph, a headline, a line under it, a third line if it is
 * wanted, an optional discount, the button's words and where it goes.
 *
 * Slide number rather than drag-and-drop, because the shop asked for numbers
 * and because a number survives what a drag does not -- it can be typed on a
 * phone, it is visible without moving anything, and two slides given the same
 * number simply fall back to alphabetical rather than landing somewhere
 * nobody chose.
 *
 * With no slides written, the shop front shows one built-in slide about the
 * shop instead of an empty panel. The first slide added replaces it.
 */
const blank = (nextNumber: number): Omit<Banner, 'id'> => ({
  slot: 'hero',
  title: '',
  subtitle: '',
  body: '',
  buttonText: 'See the menu',
  image: '',
  offerText: '',
  couponCode: '',
  linkedCategory: null,
  isActive: true,
  sortOrder: nextNumber,
});

export const HeroSlidesScreen: React.FC = () => {
  const { banners, categories, coupons, addBanner, updateBanner, deleteBanner } = useStore();
  const toast = useToast();

  const slides = banners
    .filter((b) => b.slot === 'hero')
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Banner, 'id'>>(blank(1));

  const startNew = () => {
    setEditingId(null);
    setDraft(blank(slides.reduce((max, s) => Math.max(max, s.sortOrder), 0) + 1));
    setOpen(true);
  };

  const startEdit = (slide: Banner) => {
    const { id: _ignored, ...rest } = slide;
    setEditingId(slide.id);
    setDraft({ ...rest, body: rest.body ?? '', offerText: rest.offerText ?? '', couponCode: rest.couponCode ?? '' });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      toast('error', 'Give the slide a headline.');
      return;
    }
    if (editingId) {
      updateBanner(editingId, draft);
      toast('success', 'Slide saved.');
    } else {
      addBanner(draft);
      toast('success', `"${draft.title}" added to the slider.`);
    }
    setOpen(false);
  };

  /** What a slide will actually advertise, resolved the way the hero does. */
  const offerOn = (slide: Banner): string | null => {
    const coupon = slide.couponCode
      ? coupons.find((c) => c.code.toUpperCase() === slide.couponCode?.trim().toUpperCase())
      : undefined;
    if (coupon) {
      const amount =
        coupon.discountType === 'percentage'
          ? `${coupon.discountValue}% off`
          : `${formatRupees(coupon.discountValue)} off`;
      return `${amount} · ${coupon.code}`;
    }
    // A code typed here that is not in the coupon table advertises nothing, and
    // saying so beats a slide that quietly drops its offer on the shop front.
    if (slide.couponCode?.trim()) return `Unknown code ${slide.couponCode.trim().toUpperCase()}`;
    return slide.offerText?.trim() || null;
  };

  /** Swap a slide's number with its neighbour's, so the buttons move one place. */
  const nudge = (slide: Banner, direction: -1 | 1) => {
    const i = slides.findIndex((s) => s.id === slide.id);
    const other = slides[i + direction];
    if (!other) return;
    updateBanner(slide.id, { sortOrder: other.sortOrder });
    updateBanner(other.id, { sortOrder: slide.sortOrder });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#241510]">Hero Slides</h2>
          <p className="max-w-2xl text-xs text-[#8C766B]">
            The big panel at the top of the shop front. Add as many as you like — they rotate in
            slide-number order, and a visitor can tap between them.
          </p>
        </div>
        <button type="button" id="btn-add-hero-slide" className={btnPrimary} onClick={startNew}>
          <Plus className="h-4 w-4" /> Add a slide
        </button>
      </div>

      {slides.length === 0 ? (
        <EmptyState
          title="No slides yet"
          hint="The shop front is showing a standard slide about the bakery. The first one you add replaces it."
        />
      ) : (
        <ul className="space-y-2">
          {slides.map((slide, i) => {
            const offer = offerOn(slide);
            return (
              <li
                key={slide.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 ${
                  slide.isActive ? 'border-[#E8DFD8]' : 'border-dashed border-[#E8DFD8] opacity-70'
                }`}
              >
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${slide.title} earlier`}
                    disabled={i === 0}
                    onClick={() => nudge(slide, -1)}
                    className="rounded-md border border-[#E8DFD8] p-1 text-[#5C4033] hover:border-[#241510] disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${slide.title} later`}
                    disabled={i === slides.length - 1}
                    onClick={() => nudge(slide, 1)}
                    className="rounded-md border border-[#E8DFD8] p-1 text-[#5C4033] hover:border-[#241510] disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                {/* The number itself, editable. Typing 1 into the fourth slide
                    is the fastest way to move it to the front, and faster than
                    three presses of the arrow. */}
                <label className="flex shrink-0 flex-col items-center">
                  <span className="text-[9px] uppercase tracking-wide text-[#8C766B]">Slide</span>
                  <input
                    type="number"
                    min={1}
                    value={slide.sortOrder}
                    aria-label={`Slide number for ${slide.title}`}
                    onChange={(e) =>
                      updateBanner(slide.id, { sortOrder: Number(e.target.value) || 0 })
                    }
                    className="w-14 rounded-lg border border-[#E8DFD8] bg-white px-2 py-1 text-center text-xs tabular-nums text-[#241510] focus:border-[#241510] focus:outline-none"
                  />
                </label>

                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E8DFD8] bg-[#FAF7F2]">
                  {slide.image ? (
                    <img src={slide.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[#C0AFA3]">
                      <ImageOff className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#241510]">
                    {slide.title || <em className="text-[#8C766B]">Untitled</em>}
                  </span>
                  <span className="block truncate text-[11px] text-[#8C766B]">
                    {slide.subtitle || '—'}
                  </span>
                  {offer && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#E5A93C]/40 bg-[#FDF6E7] px-2 py-0.5 text-[10px] font-semibold text-[#8A5A12]">
                      <Tag className="h-3 w-3" />
                      {offer}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => updateBanner(slide.id, { isActive: !slide.isActive })}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    slide.isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-[#E8DFD8] bg-[#FAF7F2] text-[#8C766B]'
                  }`}
                >
                  {slide.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {slide.isActive ? 'Showing' : 'Hidden'}
                </button>

                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(slide)}
                    aria-label={`Edit ${slide.title}`}
                    className="rounded-md border border-[#E8DFD8] p-1.5 text-[#5C4033] hover:border-[#241510]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteBanner(slide.id);
                      toast('success', 'Slide deleted.');
                    }}
                    aria-label={`Delete ${slide.title}`}
                    className="rounded-md border border-[#E8DFD8] p-1.5 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] leading-relaxed text-[#8C766B]">
        <strong className="text-[#5C4033]">Hidden</strong> keeps a slide out of the rotation while
        you finish it. A slide with <strong className="text-[#5C4033]">no photo</strong> gets the
        oven artwork behind it instead. A{' '}
        <strong className="text-[#5C4033]">coupon code</strong> is quoted at whatever the coupon is
        worth today, so changing the code changes every slide that advertises it.
      </p>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit slide' : 'Add a slide'}
      >
        <form onSubmit={submit} className="space-y-3">
          <ImageField
            label="Photo"
            hint="Fills the panel behind the words. Leave it empty for the oven artwork."
            value={draft.image}
            onChange={(image) => setDraft({ ...draft, image })}
            aspect="wide"
          />

          <Field label="Headline" hint="The big line. Keep it short enough to read at a glance.">
            <input
              id="hero-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Festive boxes, ready to gift"
              className={inputClass}
            />
          </Field>

          <Field label="Second line" hint="Set in gold italic under the headline.">
            <input
              id="hero-subtitle"
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              placeholder="Chocolate, cookies and brownies, boxed for the season."
              className={inputClass}
            />
          </Field>

          <Field
            label="Third line"
            hint="Optional, and usually best left out — a slide is read in two seconds."
          >
            <textarea
              id="hero-body"
              rows={2}
              value={draft.body ?? ''}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field
            label="Coupon code to advertise"
            hint="The amount is read from the coupon, so changing its value changes the slide."
          >
            <input
              id="hero-coupon"
              value={draft.couponCode ?? ''}
              onChange={(e) => setDraft({ ...draft, couponCode: e.target.value.toUpperCase() })}
              placeholder="FESTIVE15"
              className={`${inputClass} font-mono uppercase`}
            />
          </Field>

          <Field label="Or the offer in your own words" hint="Used when there is no coupon code.">
            <input
              id="hero-offer"
              value={draft.offerText ?? ''}
              onChange={(e) => setDraft({ ...draft, offerText: e.target.value })}
              placeholder="Free delivery on orders over ₹499"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Button text">
              <input
                value={draft.buttonText}
                onChange={(e) => setDraft({ ...draft, buttonText: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Slide number" hint="1 shows first.">
              <input
                id="hero-number"
                type="number"
                min={1}
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
          </div>

          <Field
            label="The button opens"
            hint="A range of the menu, or the whole menu if you leave it unset."
          >
            <select
              value={draft.linkedCategory ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  linkedCategory: (e.target.value || null) as ProductCategory | null,
                })
              }
              className={inputClass}
            >
              <option value="">The whole menu</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-xs text-[#5C4033]">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            />
            Show this slide on the shop front
          </label>

          <div className="flex gap-2 pt-1">
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" id="btn-save-hero-slide" className={`${btnPrimary} flex-1`}>
              {editingId ? 'Save slide' : 'Add slide'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
