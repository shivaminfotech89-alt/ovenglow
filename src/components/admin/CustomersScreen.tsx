import React, { useMemo, useState } from 'react';
import { Phone, Search } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { formatRupees } from '../../lib/pricing';
import { Drawer, EmptyState, StageBadge, inputClass } from './ui';

interface CustomerRow {
  phone: string;
  name: string;
  city: string;
  orders: Order[];
  lifetimeValue: number;
  lastOrderAt: string;
}

export const CustomersScreen: React.FC = () => {
  const { orders } = useStore();
  const [search, setSearch] = useState('');
  const [openPhone, setOpenPhone] = useState<string | null>(null);

  // Customers are derived from orders: there is no separate customer table yet,
  // and an account with no order is not something the shop needs to act on.
  const customers = useMemo<CustomerRow[]>(() => {
    const byPhone = new Map<string, CustomerRow>();
    orders.forEach((o) => {
      const phone = o.customer.phone.replace(/\D/g, '');
      const existing = byPhone.get(phone);
      if (existing) {
        existing.orders.push(o);
        if (o.stage !== 'cancelled') existing.lifetimeValue += o.totalAmount;
        if (o.createdAt > existing.lastOrderAt) existing.lastOrderAt = o.createdAt;
      } else {
        byPhone.set(phone, {
          phone,
          name: o.customer.name,
          city: o.customer.city,
          orders: [o],
          lifetimeValue: o.stage === 'cancelled' ? 0 : o.totalAmount,
          lastOrderAt: o.createdAt,
        });
      }
    });
    return [...byPhone.values()].sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.city.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const open = customers.find((c) => c.phone === openPhone) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#241510]">Customers</h2>
        <p className="text-xs text-[#8C766B]">
          {customers.length} customer{customers.length === 1 ? '' : 's'} who have ordered. Check what
          someone bought last festive season before you quote this one.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C766B]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, phone or city"
          className={`${inputClass} pl-8`}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={customers.length === 0 ? 'No customers yet' : 'Nothing matches'}
          hint={
            customers.length === 0
              ? 'A customer appears here once they place their first order.'
              : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E8DFD8] bg-white">
          <table className="w-full min-w-[40rem] text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8DFD8] bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#8C766B]">
                <th className="px-3 py-2.5 font-medium">Customer</th>
                <th className="px-3 py-2.5 font-medium">Phone</th>
                <th className="px-3 py-2.5 font-medium">City</th>
                <th className="px-3 py-2.5 text-right font-medium">Orders</th>
                <th className="px-3 py-2.5 text-right font-medium">Lifetime value</th>
                <th className="px-3 py-2.5 font-medium">Last order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.phone} className="border-b border-[#F0EAE3] last:border-0 hover:bg-[#FAF7F2]">
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setOpenPhone(c.phone)}
                      className="font-medium text-[#241510] underline decoration-[#E8DFD8] underline-offset-2 hover:decoration-[#C58940]"
                    >
                      {c.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[#5C4033]">{c.phone}</td>
                  <td className="px-3 py-2.5 text-[#5C4033]">{c.city}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.orders.length}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#241510]">
                    {formatRupees(c.lifetimeValue)}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-[#8C766B]">
                    {new Date(c.lastOrderAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={open !== null} onClose={() => setOpenPhone(null)} title={open?.name ?? ''}>
        {open && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#E8DFD8] bg-white p-4">
              <p className="font-medium text-[#241510]">{open.name}</p>
              <a
                href={`tel:${open.phone}`}
                className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs text-[#5C4033] underline underline-offset-2"
              >
                <Phone className="h-3 w-3" /> +91 {open.phone}
              </a>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E8DFD8] pt-3 text-xs">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#8C766B]">
                    Orders
                  </span>
                  <span className="font-semibold tabular-nums text-[#241510]">
                    {open.orders.length}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#8C766B]">
                    Lifetime value
                  </span>
                  <span className="font-semibold tabular-nums text-[#241510]">
                    {formatRupees(open.lifetimeValue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#241510]">Order history</h4>
              {open.orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-[#E8DFD8] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#241510]">
                      {o.orderNumber}
                    </span>
                    <StageBadge stage={o.stage} />
                  </div>
                  <p className="mt-1 text-[11px] text-[#8C766B]">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {o.items.reduce((s, i) => s + i.quantity, 0)} items ·{' '}
                    {formatRupees(o.totalAmount)}
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-[#5C4033]">
                    {o.items.map((i) => (
                      <li key={i.product.id}>
                        {i.quantity} × {i.product.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
