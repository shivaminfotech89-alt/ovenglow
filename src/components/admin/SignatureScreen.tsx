import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Search, Sparkles, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PRODUCT_CATEGORIES, Product, isBuyable } from '../../types';
import { formatRupees } from '../../lib/pricing';
import { ImageField } from './ImageField';
import {
  Drawer,
  EmptyState,
  Field,
  btnGhost,
  btnPrimary,
  inputClass,
  useToast,
} from './ui';

/** Keep the showcase to a handful; it stops being a highlight past this. */
const RECOMMENDED_MAX = 6;

export const SignatureScreen: React.FC = () => {
  const { products, updateProduct, hasPermission } = useStore();
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const canEdit = hasPermission('products.edit');

  const featured = useMemo(
    () =>
      products
        .filter((p) => p.isSignature)
        .sort((a, b) => (a.signatureOrder ?? 99) - (b.signatureOrder ?? 99)),
    [products],
  );

  const candidates = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return products
      .filter((p) => !p.isSignature)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, pickerQuery]);

  /** Rewrite positions as 1..n so the numbers stay tidy after any change. */
  const resequence = (ordered: Product[]) => {
    ordered.forEach((p, i) => {
      if (p.signatureOrder !== i + 1) updateProduct(p.id, { signatureOrder: i + 1 });
    });
  };

  const move = (index: number, delta: number) => {
    const next = [...featured];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    resequence(next);
  };

  const removeFromCollection = (product: Product) => {
    updateProduct(product.id, { isSignature: false });
    resequence(featured.filter((p) => p.id !== product.id));
    toast('success', `"${product.signatureTitle || product.name}" removed from the collection.`);
  };

  const addToCollection = async (product: Product) => {
    const res = await updateProduct(product.id, {
      isSignature: true,
      signatureOrder: featured.length + 1,
      signatureTitle: product.signatureTitle || product.name,
    });
    toast(res.success ? 'success' : 'error', res.success ? `"${product.name}" added.` : res.message);
    if (res.success) setPickerOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#241510]">Signature Collection</h2>
          <p className="text-xs text-[#8C766B]">
            The few products shown large on the hero page under “Our Most Craved Creations”.
          </p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setPickerOpen(true)} className={btnPrimary}>
            <Plus className="h-3.5 w-3.5" /> Add a product
          </button>
        )}
      </div>

      {featured.length > RECOMMENDED_MAX && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
          {featured.length} products are featured. A signature collection works best at four to six —
          past that it reads as a second catalogue rather than a highlight.
        </p>
      )}

      {featured.length === 0 ? (
        <EmptyState
          title="Nothing featured yet"
          hint="Add a few products and they appear large on the hero page, above the catalogue."
        />
      ) : (
        <div className="space-y-3">
          {featured.map((product, index) => {
            const buyable = isBuyable(product);
            return (
              <div
                key={product.id}
                className="grid gap-4 rounded-2xl border border-[#E8DFD8] bg-white p-4 lg:grid-cols-[auto_14rem_1fr]"
              >
                {/* Position */}
                <div className="flex flex-row items-center gap-2 lg:flex-col lg:justify-start">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#241510] text-[11px] font-bold text-[#E5A93C]">
                    {index + 1}
                  </span>
                  {canEdit && (
                    <div className="flex gap-1 lg:flex-col">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8DFD8] text-[#5C4033] hover:border-[#8C766B] disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={index === featured.length - 1}
                        onClick={() => move(index, 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8DFD8] text-[#5C4033] hover:border-[#8C766B] disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo — the thing the showcase is built around */}
                <div>
                  <ImageField
                    label="Showcase photo"
                    value={product.image}
                    onChange={(image) => updateProduct(product.id, { image })}
                  />
                </div>

                {/* Wording and status */}
                <div className="space-y-3">
                  <Field label="Showcase name" hint={`Catalogue name: ${product.name} · ${product.sku}`}>
                    <input
                      value={product.signatureTitle ?? ''}
                      disabled={!canEdit}
                      onChange={(e) => updateProduct(product.id, { signatureTitle: e.target.value })}
                      placeholder={product.name}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Showcase line">
                    <textarea
                      rows={2}
                      value={product.signatureBlurb ?? ''}
                      disabled={!canEdit}
                      onChange={(e) => updateProduct(product.id, { signatureBlurb: e.target.value })}
                      placeholder="One line that makes someone want it."
                      className={inputClass}
                    />
                  </Field>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-[#8C766B]">
                      {PRODUCT_CATEGORIES.find((c) => c.id === product.category)?.label}
                    </span>
                    {buyable ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
                        On sale at {formatRupees(product.price)}
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
                        {product.price <= 0 ? 'No price set' : 'Not published'} — the card offers
                        WhatsApp instead of a price
                      </span>
                    )}
                    {!product.image && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
                        No photo yet
                      </span>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeFromCollection(product)}
                        className="ml-auto inline-flex min-h-9 items-center gap-1 text-[#8C766B] hover:text-rose-600"
                      >
                        <X className="h-3 w-3" /> Remove from collection
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live preview of what a customer sees */}
      {featured.length > 0 && (
        <section className="rounded-2xl border border-[#EADBCE] bg-[#FFFDFA] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#C58940]" />
            <h3 className="text-xs font-semibold text-[#241510]">How it looks on the hero page</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {featured.map((product) => (
              <div key={product.id}>
                <div className="mb-2 aspect-4/5 overflow-hidden rounded-lg border border-[#EBE3DA] bg-[#F5EFE6]">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-wider text-[#A69286]">
                      Photo coming soon
                    </div>
                  )}
                </div>
                <p className="font-serif text-sm font-bold leading-tight text-[#2A1810]">
                  {product.signatureTitle || product.name}
                </p>
                {product.signatureBlurb && (
                  <p className="mt-0.5 text-[11px] leading-snug text-[#6B574E]">
                    {product.signatureBlurb}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <Drawer open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add to the collection">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C766B]" />
            <input
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="Product name or code"
              className={`${inputClass} pl-8`}
            />
          </div>

          {candidates.length === 0 ? (
            <EmptyState title="No products match" />
          ) : (
            <ul className="space-y-1.5">
              {candidates.slice(0, 40).map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => addToCollection(product)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#E8DFD8] bg-white px-3 py-2 text-left text-xs hover:border-[#8C766B]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[#241510]">{product.name}</span>
                      <span className="block font-mono text-[10px] text-[#8C766B]">{product.sku}</span>
                    </span>
                    <Plus className="h-3.5 w-3.5 shrink-0 text-[#8C766B]" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button type="button" className={`${btnGhost} w-full`} onClick={() => setPickerOpen(false)}>
            Done
          </button>
        </div>
      </Drawer>
    </div>
  );
};
