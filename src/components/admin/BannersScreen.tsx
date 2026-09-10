import React, { useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Banner, BannerSlot, PRODUCT_CATEGORIES, ProductCategory } from '../../types';
import { Drawer, EmptyState, Field, btnGhost, btnPrimary, inputClass, useToast } from './ui';

const SLOTS: { id: BannerSlot; label: string; hint: string }[] = [
  { id: 'hero', label: 'Hero Sliders', hint: 'The big rotating banners at the top of the homepage.' },
  { id: 'category', label: 'Categories', hint: 'The tiles under the banner.' },
  { id: 'campaign', label: 'Festival Campaigns', hint: 'Seasonal promotion tiles.' },
];

const blank = (slot: BannerSlot): Omit<Banner, 'id'> => ({
  slot,
  title: '',
  subtitle: '',
  buttonText: 'Shop now',
  image: '',
  linkedCategory: null,
  isActive: true,
  sortOrder: 0,
});

export const BannersScreen: React.FC = () => {
  const { banners, addBanner, updateBanner, deleteBanner } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Banner, 'id'>>(blank('hero'));

  const unlinked = banners.filter((b) => b.isActive && !b.linkedCategory);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      toast('error', 'Give the tile a title.');
      return;
    }
    addBanner(draft);
    toast('success', `"${draft.title}" added.`);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#241510]">Images &amp; Banners</h2>
          <p className="text-xs text-[#8C766B]">
            Everything a visitor sees before they reach a product. The wording stays yours — a tile
            can read “Diwali Gifting” and open Festive Hampers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(blank('hero'));
            setOpen(true);
          }}
          className={btnPrimary}
        >
          <Plus className="h-3.5 w-3.5" /> New tile
        </button>
      </div>

      {unlinked.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            {unlinked.length} active tile{unlinked.length === 1 ? '' : 's'} point at no category, so
            clicking {unlinked.length === 1 ? 'it opens' : 'them opens'} an empty shop:{' '}
            <b>{unlinked.map((b) => b.title).join(', ')}</b>.
          </span>
        </p>
      )}

      {SLOTS.map((slot) => {
        const rows = banners
          .filter((b) => b.slot === slot.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <section key={slot.id} className="space-y-2">
            <div>
              <h3 className="text-xs font-semibold text-[#241510]">{slot.label}</h3>
              <p className="text-[11px] text-[#8C766B]">{slot.hint}</p>
            </div>

            {rows.length === 0 ? (
              <EmptyState title={`No ${slot.label.toLowerCase()} yet`} />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((b) => (
                  <article
                    key={b.id}
                    className="overflow-hidden rounded-xl border border-[#E8DFD8] bg-white"
                  >
                    <div className="aspect-[16/7] bg-[#F5EFE6]">
                      {b.image && (
                        <img
                          src={b.image}
                          alt=""
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="space-y-2 p-3">
                      <div>
                        <p className="text-xs font-semibold text-[#241510]">{b.title}</p>
                        <p className="text-[11px] text-[#8C766B]">{b.subtitle}</p>
                      </div>

                      <Field label="Shows products from">
                        <select
                          value={b.linkedCategory ?? ''}
                          onChange={(e) =>
                            updateBanner(b.id, {
                              linkedCategory: (e.target.value || null) as ProductCategory | null,
                            })
                          }
                          className={inputClass}
                        >
                          <option value="">— not linked —</option>
                          {PRODUCT_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {!b.linkedCategory && (
                        <p className="text-[10px] font-medium text-amber-700">
                          Opens an empty shop until you link a category.
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => updateBanner(b.id, { isActive: !b.isActive })}
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            b.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-[#E8DFD8] bg-[#F5EFE6] text-[#8C766B]'
                          }`}
                        >
                          {b.isActive ? 'Live' : 'Off'}
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${b.title}`}
                          onClick={() => {
                            if (!confirm(`Delete tile "${b.title}"?`)) return;
                            deleteBanner(b.id);
                            toast('success', 'Tile deleted.');
                          }}
                          className="rounded-md p-1 text-[#8C766B] hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <Drawer open={open} onClose={() => setOpen(false)} title="New tile">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Where it appears">
            <select
              value={draft.slot}
              onChange={(e) => setDraft({ ...draft, slot: e.target.value as BannerSlot })}
              className={inputClass}
            >
              {SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Button text">
            <input
              value={draft.buttonText}
              onChange={(e) => setDraft({ ...draft, buttonText: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Image URL">
            <input
              value={draft.image}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>
          <Field
            label="Shows products from"
            hint="A tile with no category opens an empty shop."
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
              <option value="">— not linked —</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={`${btnPrimary} flex-1`}>
              Add tile
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
