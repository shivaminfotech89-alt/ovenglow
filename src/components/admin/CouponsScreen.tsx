import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Coupon } from '../../types';
import { formatRupees } from '../../lib/pricing';
import { Drawer, EmptyState, Field, btnGhost, btnPrimary, inputClass, useToast } from './ui';

type CouponDraft = Omit<Coupon, 'id' | 'createdAt' | 'timesUsed'>;

const blank = (): CouponDraft => ({
  code: '',
  name: '',
  discountType: 'percentage',
  discountValue: 10,
  minPurchase: 0,
  expiresAt: null,
  isActive: true,
});

const isExpired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();

export const CouponsScreen: React.FC = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CouponDraft>(blank());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addCoupon(draft);
    toast(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setOpen(false);
      setDraft(blank());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#241510]">Coupons</h2>
          <p className="text-xs text-[#8C766B]">
            Discount codes with the limits that stop them being abused. A code only applies when a
            customer types it — nothing is auto-applied.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(blank());
            setOpen(true);
          }}
          className={btnPrimary}
        >
          <Plus className="h-3.5 w-3.5" /> New coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState title="No coupons yet" hint="Create a code to run a festive or bulk offer." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E8DFD8] bg-white">
          <table className="w-full min-w-[46rem] text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8DFD8] bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#8C766B]">
                <th className="px-3 py-2.5 font-medium">Code</th>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 text-right font-medium">Discount</th>
                <th className="px-3 py-2.5 text-right font-medium">Min. purchase</th>
                <th className="px-3 py-2.5 font-medium">Expires</th>
                <th className="px-3 py-2.5 text-right font-medium">Used</th>
                <th className="px-3 py-2.5 font-medium">Active</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-[#F0EAE3] last:border-0 hover:bg-[#FAF7F2]">
                  <td className="px-3 py-2.5 font-mono font-semibold text-[#241510]">{c.code}</td>
                  <td className="px-3 py-2.5 text-[#5C4033]">{c.name}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#241510]">
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}%`
                      : formatRupees(c.discountValue)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#5C4033]">
                    {c.minPurchase > 0 ? formatRupees(c.minPurchase) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-[11px]">
                    {c.expiresAt ? (
                      <span className={isExpired(c) ? 'font-medium text-rose-600' : 'text-[#5C4033]'}>
                        {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                        {isExpired(c) && ' · expired'}
                      </span>
                    ) : (
                      <span className="text-[#8C766B]">Never</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#5C4033]">{c.timesUsed}</td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => updateCoupon(c.id, { isActive: !c.isActive })}
                      aria-label={`${c.isActive ? 'Deactivate' : 'Activate'} ${c.code}`}
                      className={`inline-flex min-h-9 items-center rounded-full border px-3 text-[11px] font-medium ${
                        c.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-[#E8DFD8] bg-[#F5EFE6] text-[#8C766B]'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Off'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      aria-label={`Delete ${c.code}`}
                      onClick={() => {
                        if (!confirm(`Delete coupon ${c.code}?`)) return;
                        deleteCoupon(c.id);
                        toast('success', `Coupon ${c.code} deleted.`);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#8C766B] hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="New coupon">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Code" hint="What the customer types. Stored uppercase.">
            <input
              required
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              placeholder="DIWALI25"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Internal name">
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Diwali 25% off"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={draft.discountType}
                onChange={(e) =>
                  setDraft({ ...draft, discountType: e.target.value as 'percentage' | 'fixed' })
                }
                className={inputClass}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </Field>
            <Field label={draft.discountType === 'percentage' ? 'Percent off' : 'Rupees off'}>
              <input
                type="number"
                min={1}
                max={draft.discountType === 'percentage' ? 100 : undefined}
                required
                value={draft.discountValue}
                onChange={(e) => setDraft({ ...draft, discountValue: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field
            label="Minimum purchase (₹)"
            hint="Stops a bulk code being used on a single item. 0 means no minimum."
          >
            <input
              type="number"
              min={0}
              value={draft.minPurchase}
              onChange={(e) => setDraft({ ...draft, minPurchase: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Expires on" hint="Leave blank for a code that never expires.">
            <input
              type="date"
              value={draft.expiresAt ? draft.expiresAt.slice(0, 10) : ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2 text-xs text-[#5C4033]">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            />
            Active immediately
          </label>

          <div className="flex gap-2 pt-1">
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={`${btnPrimary} flex-1`}>
              Create coupon
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
