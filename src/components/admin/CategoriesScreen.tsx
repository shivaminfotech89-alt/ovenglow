import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';
import { CATEGORY_ICON_CHOICES, categoryIcon } from '../../lib/categories';
import { categorySlug } from '../../data/initialCategories';
import { Drawer, EmptyState, Field, btnGhost, btnPrimary, inputClass, useToast } from './ui';

/**
 * The ranges the menu is cut into.
 *
 * These were nine lines in `src/types.ts` until now, which made the shape of
 * the shop's own menu a fact about the code: adding a tenth range meant a
 * developer and a deploy. They are rows the shop owns now -- added, renamed,
 * reordered, hidden and deleted here, and offered on the product form.
 *
 * Two things this screen is careful about, because both are quiet failures:
 *
 * A range's id is what every product in it stores, so renaming changes the
 * label and never the id. Otherwise a shop tidying up "Tea Cakes" into
 * "Everyday Cakes" would orphan every tea cake it sells.
 *
 * Deleting is refused while products are still in the range. Nothing cascades:
 * the products would simply keep an address the menu no longer has and stop
 * appearing on the shop front, with nothing on screen to say why.
 */
const IconPicker: React.FC<{ value: string; onChange: (name: string) => void }> = ({
  value,
  onChange,
}) => (
  <div className="flex flex-wrap gap-1.5">
    {CATEGORY_ICON_CHOICES.map((choice) => {
      const Icon = choice.icon;
      const picked = choice.name === value;
      return (
        <button
          key={choice.name}
          type="button"
          onClick={() => onChange(choice.name)}
          aria-pressed={picked}
          title={choice.label}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
            picked
              ? 'border-[#241510] bg-[#241510] text-[#E5A93C]'
              : 'border-[#E8DFD8] bg-white text-[#5C4033] hover:border-[#8C766B]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      );
    })}
  </div>
);

export const CategoriesScreen: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, moveCategory } =
    useStore();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('cookie');
  const [busy, setBusy] = useState(false);

  /** The row being renamed, if any. One at a time. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftIcon, setDraftIcon] = useState('cookie');

  const countIn = (id: string) => products.filter((p) => p.category === id).length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await addCategory(label, icon);
    setBusy(false);
    toast(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setOpen(false);
      setLabel('');
      setIcon('cookie');
    }
  };

  const startEdit = (c: Category) => {
    setEditing(c.id);
    setDraftLabel(c.label);
    setDraftIcon(c.icon);
  };

  const saveEdit = async (id: string) => {
    const res = await updateCategory(id, { label: draftLabel.trim(), icon: draftIcon });
    toast(res.success ? 'success' : 'error', res.message);
    if (res.success) setEditing(null);
  };

  const remove = async (c: Category) => {
    const res = await deleteCategory(c.id);
    toast(res.success ? 'success' : 'error', res.message);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#241510]">Categories</h2>
          <p className="max-w-2xl text-xs text-[#8C766B]">
            The ranges your menu is divided into. They are the filter buttons on the shop front,
            the headings customers scroll past, and the list the product form offers.
          </p>
        </div>
        <button
          type="button"
          id="btn-add-category"
          className={btnPrimary}
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add a range
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No ranges yet"
          hint="Add one, and it will appear on the product form and on the shop front."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E8DFD8] bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E8DFD8] bg-[#FAF7F2] text-[11px] uppercase tracking-wide text-[#8C766B]">
              <tr>
                <th className="w-20 px-3 py-2.5 font-medium">Order</th>
                <th className="px-3 py-2.5 font-medium">Range</th>
                <th className="px-3 py-2.5 font-medium">Address</th>
                <th className="px-3 py-2.5 font-medium">Products</th>
                <th className="px-3 py-2.5 font-medium">On the shop</th>
                <th className="px-3 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => {
                const Icon = categoryIcon(c.icon);
                const used = countIn(c.id);
                const isEditing = editing === c.id;

                return (
                  <tr key={c.id} className="border-b border-[#F2ECE4] last:border-0 align-top">
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${c.label} up`}
                          disabled={i === 0}
                          onClick={() => void moveCategory(c.id, -1)}
                          className="rounded-md border border-[#E8DFD8] p-1 text-[#5C4033] hover:border-[#241510] disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${c.label} down`}
                          disabled={i === categories.length - 1}
                          onClick={() => void moveCategory(c.id, 1)}
                          className="rounded-md border border-[#E8DFD8] p-1 text-[#5C4033] hover:border-[#241510] disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={draftLabel}
                            onChange={(e) => setDraftLabel(e.target.value)}
                            aria-label={`Rename ${c.label}`}
                            className={inputClass}
                          />
                          <IconPicker value={draftIcon} onChange={setDraftIcon} />
                        </div>
                      ) : (
                        <span className="flex items-center gap-2 font-medium text-[#241510]">
                          <Icon className="h-4 w-4 shrink-0 text-[#C58940]" />
                          {c.label}
                        </span>
                      )}
                    </td>

                    {/* The id, shown plainly. It is what every product in the
                        range stores and what a renaming deliberately leaves
                        alone, so it is worth being able to see. */}
                    <td className="px-3 py-2.5 font-mono text-[11px] text-[#8C766B]">{c.id}</td>

                    <td className="px-3 py-2.5 tabular-nums text-[#5C4033]">{used}</td>

                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => void updateCategory(c.id, { isActive: !c.isActive })}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          c.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-[#E8DFD8] bg-[#FAF7F2] text-[#8C766B]'
                        }`}
                      >
                        {c.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {c.isActive ? 'Shown' : 'Hidden'}
                      </button>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void saveEdit(c.id)}
                              className="rounded-md border border-[#241510] bg-[#241510] p-1.5 text-white"
                              aria-label="Save"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="rounded-md border border-[#E8DFD8] p-1.5 text-[#5C4033]"
                              aria-label="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(c)}
                              className="rounded-md border border-[#E8DFD8] p-1.5 text-[#5C4033] hover:border-[#241510]"
                              aria-label={`Rename ${c.label}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {/*
                              Disabled rather than hidden while the range is in
                              use, with the reason on the button: a delete that
                              is simply absent reads as a bug, and one that
                              fails on press wastes the press.
                            */}
                            <button
                              type="button"
                              onClick={() => void remove(c)}
                              disabled={used > 0}
                              title={
                                used > 0
                                  ? `${used} product${used === 1 ? '' : 's'} still in this range`
                                  : `Delete ${c.label}`
                              }
                              className="rounded-md border border-[#E8DFD8] p-1.5 text-rose-700 hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                              aria-label={`Delete ${c.label}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[#8C766B]">
        <strong className="text-[#5C4033]">Hidden</strong> keeps a range off the shop front while
        you fill it; its products stay here and stay out of the menu.{' '}
        <strong className="text-[#5C4033]">Renaming</strong> changes the name customers read and
        leaves the address alone, so the products in the range stay in it.{' '}
        <strong className="text-[#5C4033]">Deleting</strong> waits until the range is empty.
      </p>

      <Drawer open={open} onClose={() => setOpen(false)} title="Add a range">
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Name"
            hint="What customers read on the filter button and the heading."
          >
            <input
              id="category-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Festive Hampers"
              className={inputClass}
              autoFocus
            />
          </Field>

          {/* The address it will get, before it is created rather than after.
              It is permanent, and seeing "festive-hampers" while typing is the
              cheapest way to catch a name that was going to read badly. */}
          {label.trim() && (
            <p className="rounded-lg border border-[#E8DFD8] bg-[#FAF7F2] px-3 py-2 text-[11px] text-[#8C766B]">
              Address: <span className="font-mono text-[#241510]">{categorySlug(label)}</span>
              <span className="mt-0.5 block">
                Products store this, so it stays the same if you rename the range later.
              </span>
            </p>
          )}

          <Field label="Mark" hint="Shown beside the name on the shop front.">
            <IconPicker value={icon} onChange={setIcon} />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-category"
              disabled={busy}
              className={`${btnPrimary} flex-1`}
            >
              {busy ? 'Adding…' : 'Add range'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
