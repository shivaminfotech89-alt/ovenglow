import React, { useMemo, useState } from 'react';
import { AlertTriangle, Copy, Download, Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ImageField } from './ImageField';
import { PRODUCT_CATEGORIES, Product, ProductCategory, needsPricing } from '../../types';
import {
  Drawer,
  EmptyState,
  Field,
  InlineEditNumber,
  StatCard,
  btnGhost,
  btnPrimary,
  inputClass,
  useToast,
} from './ui';

const LOW_STOCK_AT = 10;

const blankProduct = (): Omit<Product, 'id'> => ({
  sku: '',
  name: '',
  hindiSubname: '',
  tagline: '',
  description: '',
  price: 0,
  originalPrice: 0,
  category: 'premium-chocolate',
  image: '',
  secondaryImages: [],
  isPublished: false,
  stockCount: 0,
  isVeg: true,
  rating: 0,
  reviewCount: 0,
  weightGrams: 100,
  shelfLife: '',
  layers: [],
  flavorNotes: [],
  isSignature: false,
  signatureTitle: '',
  signatureBlurb: '',
  signatureOrder: 1,
});

export const ProductsScreen: React.FC = () => {
  const {
    products,
    updateProduct,
    addProduct,
    deleteProduct,
    bulkSetPublished,
    bulkDelete,
    findDuplicateSkus,
    hasPermission,
  } = useStore();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(blankProduct());

  const canEdit = hasPermission('products.edit');
  const duplicateSkus = findDuplicateSkus();

  const stats = useMemo(
    () => ({
      total: products.length,
      visible: products.filter((p) => p.isPublished && p.stockCount > 0).length,
      hidden: products.filter((p) => !p.isPublished).length,
      outOfStock: products.filter((p) => p.stockCount === 0).length,
      unpriced: products.filter(needsPricing).length,
      units: products.reduce((sum, p) => sum + p.stockCount, 0),
    }),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.flavorNotes.some((n) => n.toLowerCase().includes(q))
      );
    });
  }, [products, search, categoryFilter]);

  const allShownSelected = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  const openCreate = () => {
    setForm(blankProduct());
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    const { id: _id, ...rest } = p;
    setForm(rest);
    setEditingId(p.id);
    setFormOpen(true);
  };

  const saveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const res = editingId ? updateProduct(editingId, form) : addProduct(form);
    toast(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setFormOpen(false);
      setEditingId(null);
    }
  };

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = filtered.map((p) =>
      [p.sku, p.name, p.category, p.price, p.originalPrice, p.stockCount, p.isPublished ? 'Visible' : 'Hidden']
        .map(esc)
        .join(','),
    );
    const csv = [
      ['SKU', 'Name', 'Category', 'Price', 'MRP', 'Stock', 'Status'].map(esc).join(','),
      ...rows,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ovenglow-catalogue-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#241510]">Products &amp; Inventory</h2>
          <p className="text-xs text-[#8C766B]">
            Click any stock or price figure to edit it in place. Enter saves, Escape cancels.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCsv} className={btnGhost}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          {canEdit && (
            <button type="button" onClick={openCreate} className={btnPrimary}>
              <Plus className="h-3.5 w-3.5" /> New product
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total products" value={stats.total} />
        <StatCard label="Buyable now" value={stats.visible} tone="good" />
        <StatCard label="Hidden" value={stats.hidden} />
        <StatCard
          label="Out of stock"
          value={stats.outOfStock}
          tone={stats.outOfStock > 0 ? 'warn' : 'default'}
        />
        <StatCard
          label="Needs a price"
          value={stats.unpriced}
          tone={stats.unpriced > 0 ? 'warn' : 'default'}
          hint={stats.unpriced > 0 ? 'Cannot be published yet' : undefined}
        />
        <StatCard label="Units held" value={stats.units} />
      </div>

      {duplicateSkus.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
          <Copy className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            Duplicate product codes in the catalogue: <b>{duplicateSkus.join(', ')}</b>. Two products
            sharing a code makes reordering from a supplier invoice ambiguous — review and fix them.
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C766B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product name, code or flavour note"
            className={`${inputClass} pl-8`}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'all' | ProductCategory)}
          aria-label="Filter by category"
          className={`${inputClass} w-auto`}
        >
          <option value="all">All categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {selected.length > 0 && canEdit && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#241510] bg-[#241510] px-3 py-2 text-xs text-white">
          <span className="font-medium">{selected.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-white/10 px-2.5 py-1 hover:bg-white/20"
              onClick={() => {
                bulkSetPublished(selected, true);
                toast('success', `${selected.length} product(s) published.`);
                setSelected([]);
              }}
            >
              Publish
            </button>
            <button
              type="button"
              className="rounded-lg bg-white/10 px-2.5 py-1 hover:bg-white/20"
              onClick={() => {
                bulkSetPublished(selected, false);
                toast('success', `${selected.length} product(s) hidden.`);
                setSelected([]);
              }}
            >
              Hide
            </button>
            <button
              type="button"
              className="rounded-lg bg-rose-600 px-2.5 py-1 hover:bg-rose-700"
              onClick={() => {
                if (!confirm(`Delete ${selected.length} product(s)? This cannot be undone.`)) return;
                bulkDelete(selected);
                toast('success', `${selected.length} product(s) deleted.`);
                setSelected([]);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No products match" hint="Clear the search or pick another category." />
      ) : (
        <>
        {/* Phones get cards: an eight-column inventory table cannot be read or
            operated on a 360px screen. Stock and price stay inline-editable. */}
        <ul className="space-y-2.5 lg:hidden">
          {filtered.map((p) => (
            <li key={p.id} className="rounded-2xl border border-[#E8DFD8] bg-white p-4">
              <div className="flex items-start gap-3">
                {canEdit && (
                  <label className="-m-2 flex shrink-0 cursor-pointer p-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.name}`}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#241510]"
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                      )
                    }
                  />
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => canEdit && openEdit(p)}
                  disabled={!canEdit}
                  className="min-w-0 flex-1 text-left disabled:cursor-default"
                >
                  <span className="block text-sm font-medium text-[#241510]">{p.name}</span>
                  <span className="mt-0.5 block text-[11px] text-[#8C766B]">
                    {PRODUCT_CATEGORIES.find((c) => c.id === p.category)?.label}
                    {p.isSignature && <span className="ml-1.5 font-medium text-[#C58940]">· Signature</span>}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-[#A69286]">{p.sku}</span>
                </button>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-[#F0EAE3] pt-3">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#8C766B]">Stock</dt>
                  <dd>
                    <InlineEditNumber
                      label={`stock for ${p.name}`}
                      value={p.stockCount}
                      groupDigits
                      disabled={!canEdit}
                      onSave={(next) => {
                        const res = updateProduct(p.id, { stockCount: next });
                        return res.success ? null : res.message;
                      }}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#8C766B]">Price</dt>
                  <dd>
                    <InlineEditNumber
                      label={`price for ${p.name}`}
                      value={p.price}
                      prefix="₹"
                      groupDigits
                      disabled={!canEdit}
                      onSave={(next) => {
                        const res = updateProduct(p.id, { price: next });
                        return res.success ? null : res.message;
                      }}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#8C766B]">MRP</dt>
                  <dd>
                    <InlineEditNumber
                      label={`MRP for ${p.name}`}
                      value={p.originalPrice}
                      prefix="₹"
                      groupDigits
                      disabled={!canEdit}
                      onSave={(next) => {
                        if (next < p.price) return 'MRP cannot be below the selling price.';
                        const res = updateProduct(p.id, { originalPrice: next });
                        return res.success ? null : res.message;
                      }}
                    />
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center gap-2 border-t border-[#F0EAE3] pt-3">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => updateProduct(p.id, { isPublished: !p.isPublished })}
                  className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-[11px] font-medium ${
                    p.isPublished
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-[#E8DFD8] bg-[#F5EFE6] text-[#8C766B]'
                  } disabled:cursor-default`}
                >
                  {p.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {p.isPublished ? 'Visible' : 'Hidden'}
                </button>

                {p.stockCount === 0 ? (
                  <span className="text-[11px] font-medium text-rose-600">out of stock</span>
                ) : p.stockCount <= LOW_STOCK_AT ? (
                  <span className="text-[11px] font-medium text-amber-700">low stock</span>
                ) : null}

                {canEdit && (
                  <button
                    type="button"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => {
                      if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
                      deleteProduct(p.id);
                      toast('success', `"${p.name}" deleted.`);
                    }}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-md text-[#8C766B] hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-2xl border border-[#E8DFD8] bg-white lg:block">
          <table className="w-full min-w-[54rem] text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8DFD8] bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#8C766B]">
                <th className="w-9 px-3 py-2.5">
                  {canEdit && (
                    <input
                      type="checkbox"
                      aria-label="Select all shown"
                      className="h-4 w-4 accent-[#241510]"
                      checked={allShownSelected}
                      onChange={(e) =>
                        setSelected(e.target.checked ? filtered.map((p) => p.id) : [])
                      }
                    />
                  )}
                </th>
                <th className="px-3 py-2.5 font-medium">Product</th>
                <th className="px-3 py-2.5 font-medium">Code</th>
                <th className="px-3 py-2.5 text-right font-medium">Stock</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="px-3 py-2.5 text-right font-medium">MRP</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#F0EAE3] last:border-0 hover:bg-[#FAF7F2]">
                  <td className="px-3 py-2.5 align-top">
                    {canEdit && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        className="h-4 w-4 accent-[#241510]"
                        checked={selected.includes(p.id)}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                          )
                        }
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <button
                      type="button"
                      onClick={() => canEdit && openEdit(p)}
                      disabled={!canEdit}
                      className="text-left font-medium text-[#241510] disabled:cursor-default"
                    >
                      {p.name}
                    </button>
                    <span className="mt-0.5 block text-[10px] text-[#8C766B]">
                      {PRODUCT_CATEGORIES.find((c) => c.id === p.category)?.label}
                      {p.isSignature && (
                        <span className="ml-1.5 font-medium text-[#C58940]">· Signature</span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-[11px] text-[#5C4033]">{p.sku}</td>
                  <td className="px-3 py-2.5 text-right align-top">
                    <InlineEditNumber
                      label={`stock for ${p.name}`}
                      value={p.stockCount}
                      groupDigits
                      disabled={!canEdit}
                      onSave={(next) => {
                        const res = updateProduct(p.id, { stockCount: next });
                        return res.success ? null : res.message;
                      }}
                    />
                    {p.stockCount === 0 ? (
                      <span className="mt-0.5 block text-[10px] font-medium text-rose-600">
                        out of stock
                      </span>
                    ) : p.stockCount <= LOW_STOCK_AT ? (
                      <span className="mt-0.5 block text-[10px] font-medium text-amber-700">low</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top">
                    <InlineEditNumber
                      label={`price for ${p.name}`}
                      value={p.price}
                      prefix="₹"
                      groupDigits
                      disabled={!canEdit}
                      onSave={(next) => {
                        const res = updateProduct(p.id, { price: next });
                        return res.success ? null : res.message;
                      }}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right align-top">
                    <InlineEditNumber
                      label={`MRP for ${p.name}`}
                      value={p.originalPrice}
                      prefix="₹"
                      groupDigits
                      disabled={!canEdit}
                      onSave={(next) => {
                        if (next < p.price) return 'MRP cannot be below the selling price.';
                        const res = updateProduct(p.id, { originalPrice: next });
                        return res.success ? null : res.message;
                      }}
                    />
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => updateProduct(p.id, { isPublished: !p.isPublished })}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        p.isPublished
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-[#E8DFD8] bg-[#F5EFE6] text-[#8C766B]'
                      } disabled:cursor-default`}
                    >
                      {p.isPublished ? (
                        <>
                          <Eye className="h-3 w-3" /> Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> Hidden
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right align-top">
                    {canEdit && (
                      <button
                        type="button"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => {
                          if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
                          deleteProduct(p.id);
                          toast('success', `"${p.name}" deleted.`);
                        }}
                        className="rounded-md p-1 text-[#8C766B] hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit product' : 'New product'}
      >
        <form onSubmit={saveForm} className="space-y-3">
          <Field label="Product code (SKU)" hint="Must be unique — the form refuses a duplicate.">
            <input
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Tagline">
            <input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <input
                type="number"
                min={0}
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="MRP (₹)">
              <input
                type="number"
                min={0}
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Stock">
              <input
                type="number"
                min={0}
                value={form.stockCount}
                onChange={(e) => setForm({ ...form, stockCount: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Weight (g)">
              <input
                type="number"
                min={0}
                value={form.weightGrams}
                onChange={(e) => setForm({ ...form, weightGrams: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
              className={inputClass}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <ImageField
            label="Product photo"
            hint="Pick from your gallery, drag one in, or paste a URL."
            value={form.image}
            onChange={(image) => setForm({ ...form, image })}
          />

          <ImageField
            label="Second photo (optional)"
            value={form.secondaryImages[0] ?? ''}
            onChange={(img) =>
              setForm({ ...form, secondaryImages: img ? [img, ...form.secondaryImages.slice(1)] : form.secondaryImages.slice(1) })
            }
          />
          <Field label="Shelf life">
            <input
              value={form.shelfLife}
              onChange={(e) => setForm({ ...form, shelfLife: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Flavour notes" hint="Comma separated.">
            <input
              value={form.flavorNotes.join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  flavorNotes: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className={inputClass}
            />
          </Field>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-[#5C4033]">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Visible in shop
            </label>
            <label className="flex items-center gap-2 text-xs text-[#5C4033]">
              <input
                type="checkbox"
                checked={form.isVeg}
                onChange={(e) => setForm({ ...form, isVeg: e.target.checked })}
              />
              Eggless / vegetarian
            </label>
            <label className="flex items-center gap-2 text-xs text-[#5C4033]">
              <input
                type="checkbox"
                checked={!!form.isBestseller}
                onChange={(e) => setForm({ ...form, isBestseller: e.target.checked })}
              />
              Bestseller
            </label>
          </div>

          {/* Signature Collection */}
          <div className="space-y-3 rounded-lg border border-[#E8DFD8] bg-[#FAF7F2] p-3">
            <label className="flex items-center gap-2 text-xs font-medium text-[#241510]">
              <input
                type="checkbox"
                checked={!!form.isSignature}
                onChange={(e) => setForm({ ...form, isSignature: e.target.checked })}
              />
              Feature in the Signature Collection
            </label>
            <p className="text-[11px] text-[#8C766B]">
              Shown large on the hero page under “Our Most Craved Creations”. Keep it to a handful.
            </p>

            {form.isSignature && (
              <div className="space-y-3">
                <Field
                  label="Showcase name"
                  hint="The marketing name. Leave blank to use the product name."
                >
                  <input
                    value={form.signatureTitle ?? ''}
                    onChange={(e) => setForm({ ...form, signatureTitle: e.target.value })}
                    placeholder="The Biscoff Indulgence"
                    className={inputClass}
                  />
                </Field>
                <Field label="Position" hint="Lower numbers appear first.">
                  <input
                    type="number"
                    min={1}
                    value={form.signatureOrder ?? 1}
                    onChange={(e) => setForm({ ...form, signatureOrder: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Showcase line">
                  <textarea
                    rows={2}
                    value={form.signatureBlurb ?? ''}
                    onChange={(e) => setForm({ ...form, signatureBlurb: e.target.value })}
                    placeholder="Deep chocolate. Gooey centre. Pure comfort."
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </div>

          <p className="flex items-start gap-2 rounded-lg border border-[#E8DFD8] bg-[#F5EFE6] px-3 py-2 text-[11px] text-[#5C4033]">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-[#C58940]" />
            Ratings and review counts are not editable here. A rating should come from real customer
            reviews, not be typed in.
          </p>

          <div className="flex gap-2 pt-1">
            <button type="button" className={btnGhost} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={`${btnPrimary} flex-1`}>
              {editingId ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
