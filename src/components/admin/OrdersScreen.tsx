import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Download,
  MessageSquare,
  Search,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { OrderStage, STAGES, STAGE_ORDER, canCancel, getNextStages } from '../../lib/orderStages';
import { formatRupees } from '../../lib/pricing';
import {
  Drawer,
  EmptyState,
  Field,
  StageBadge,
  btnGhost,
  btnPrimary,
  inputClass,
  useToast,
} from './ui';

const ALL_STAGES: OrderStage[] = [...STAGE_ORDER, 'cancelled'];

function toCsv(orders: Order[]): string {
  const headers = [
    'Order Number',
    'Placed',
    'Customer',
    'Phone',
    'City',
    'PIN',
    'Payment Method',
    'UPI Reference',
    'Stage',
    'Item Total',
    'Discount',
    'Delivery',
    'GST',
    'Total',
  ];
  // Quote every field and double any embedded quotes, so a comma in an address
  // cannot shift the columns.
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = orders.map((o) =>
    [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('en-IN'),
      o.customer.name,
      o.customer.phone,
      o.customer.city,
      o.customer.pincode,
      o.paymentMethod,
      o.payment.upiReference ?? '',
      STAGES[o.stage].label,
      o.itemTotal,
      o.discount,
      o.deliveryFee,
      o.tax,
      o.totalAmount,
    ]
      .map(esc)
      .join(','),
  );
  return [headers.map(esc).join(','), ...rows].join('\n');
}

/* ------------------------------------------------------ detail drawer -- */

const OrderDetail: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const {
    advanceOrderStage,
    verifyPayment,
    rejectPayment,
    hasPermission,
    getWhatsAppOrderLink,
    storeSettings,
  } = useStore();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const canVerify = hasPermission('orders.verify_payment');

  // Both moves out of payment_verification_pending have dedicated controls in
  // the panel above (Verify / Reject), and `paid` is refused by
  // advanceOrderStage by design. Rendering them here too would offer buttons
  // that either duplicate a safer path or can only fail.
  const next = getNextStages(order).filter(
    (stage) => stage !== 'paid' && order.stage !== 'payment_verification_pending',
  );

  const move = (to: OrderStage) => {
    const res = advanceOrderStage(order.id, to, note);
    toast(res.success ? 'success' : 'error', res.message);
    if (res.success) setNote('');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#E8DFD8] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-[#241510]">#{order.orderNumber}</span>
          <StageBadge stage={order.stage} />
        </div>
        <p className="mt-1 text-[11px] text-[#8C766B]">
          Placed {new Date(order.createdAt).toLocaleString('en-IN')}
        </p>
      </div>

      {/* Payment verification — the one action a customer can never do */}
      {order.stage === 'payment_verification_pending' && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-800" />
            <h4 className="text-xs font-semibold text-amber-900">Verify this payment</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900">
            The customer says they paid {formatRupees(order.totalAmount)}. Check this reference against
            your bank statement before marking the order paid.
          </p>
          <div className="rounded-lg border border-amber-300 bg-white px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-[#8C766B]">
              UPI reference
            </span>
            <span className="font-mono text-sm font-semibold text-[#241510]">
              {order.payment.upiReference ?? '—'}
            </span>
            {order.payment.submittedAt && (
              <span className="mt-0.5 block text-[10px] text-[#8C766B]">
                Submitted {new Date(order.payment.submittedAt).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {!canVerify ? (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-900">
              <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              Only an Admin or Super Admin can confirm a payment. Ask one to check this order.
            </p>
          ) : showReject ? (
            <div className="space-y-2">
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why is this reference wrong?"
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setShowReject(false);
                    setRejectReason('');
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={`${btnPrimary} flex-1 bg-rose-700 hover:bg-rose-800`}
                  onClick={() => {
                    const res = rejectPayment(order.id, rejectReason);
                    toast(res.success ? 'success' : 'error', res.message);
                    if (res.success) {
                      setShowReject(false);
                      setRejectReason('');
                    }
                  }}
                >
                  Reject reference
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" className={btnGhost} onClick={() => setShowReject(true)}>
                Reject
              </button>
              <button
                type="button"
                className={`${btnPrimary} flex-1 bg-emerald-700 hover:bg-emerald-800`}
                onClick={() => {
                  const res = verifyPayment(order.id);
                  toast(res.success ? 'success' : 'error', res.message);
                }}
              >
                <BadgeCheck className="h-4 w-4" /> Money received — mark paid
              </button>
            </div>
          )}
        </div>
      )}

      {order.payment.rejectionNote && order.stage === 'awaiting_payment' && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          Last reference was rejected: {order.payment.rejectionNote}
        </p>
      )}

      {/* Move the order on */}
      <div className="space-y-2.5 rounded-xl border border-[#E8DFD8] bg-white p-4">
        <h4 className="text-xs font-semibold text-[#241510]">Move this order on</h4>
        {next.length === 0 && !canCancel(order) ? (
          <p className="text-[11px] text-[#8C766B]">
            {STAGES[order.stage].label} is a final stage. Nothing further to do.
          </p>
        ) : (
          <>
            <Field label="Note (optional)" hint="Shown to the customer on their tracking page.">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={STAGES[next[0] ?? order.stage].why}
                className={inputClass}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              {next.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  className={btnPrimary}
                  onClick={() => move(stage)}
                  disabled={!hasPermission('orders.advance')}
                >
                  {STAGES[stage].label} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ))}
              {canCancel(order) && hasPermission('orders.cancel') && (
                <button
                  type="button"
                  className={`${btnGhost} border-rose-200 text-rose-700 hover:border-rose-400`}
                  onClick={() => move('cancelled')}
                >
                  <Ban className="h-3.5 w-3.5" /> Cancel order
                </button>
              )}
            </div>
          </>
        )}

        <a
          href={getWhatsAppOrderLink(order)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnGhost} w-full`}
        >
          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Notify customer on WhatsApp
        </a>
      </div>

      {/* Items and money */}
      <div className="rounded-xl border border-[#E8DFD8] bg-white p-4">
        <h4 className="mb-2 text-xs font-semibold text-[#241510]">Items</h4>
        <ul className="space-y-1.5">
          {order.items.map((item) => (
            <li key={item.product.id} className="flex justify-between gap-3 text-xs">
              <span className="text-[#5C4033]">
                {item.quantity} × {item.product.name}
                {item.customMessage && (
                  <em className="mt-0.5 block text-[11px] text-[#8C766B]">“{item.customMessage}”</em>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-[#241510]">
                {formatRupees(item.product.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-1 border-t border-[#E8DFD8] pt-3 text-xs">
          <div className="flex justify-between">
            <dt className="text-[#8C766B]">Subtotal</dt>
            <dd className="tabular-nums">{formatRupees(order.itemTotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
              <dd className="tabular-nums">−{formatRupees(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-[#8C766B]">Delivery</dt>
            <dd className="tabular-nums">
              {order.deliveryFee === 0 ? 'Free' : formatRupees(order.deliveryFee)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#8C766B]">GST @ {storeSettings.gstPercent}%</dt>
            <dd className="tabular-nums">{formatRupees(order.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-[#E8DFD8] pt-1.5 font-semibold text-[#241510]">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatRupees(order.totalAmount)}</dd>
          </div>
        </dl>
      </div>

      {/* Delivery */}
      <div className="rounded-xl border border-[#E8DFD8] bg-white p-4 text-xs">
        <h4 className="mb-2 text-xs font-semibold text-[#241510]">Deliver to</h4>
        <p className="font-medium text-[#241510]">{order.customer.name}</p>
        <p className="mt-0.5 leading-relaxed text-[#5C4033]">
          {order.customer.address}
          <br />
          {order.customer.city} {order.customer.pincode}
        </p>
        <a
          href={`tel:${order.customer.phone}`}
          className="mt-1.5 inline-block font-mono text-[#5C4033] underline underline-offset-2"
        >
          +91 {order.customer.phone}
        </a>
        {order.customer.giftMessage && (
          <p className="mt-2 rounded-lg bg-[#F5EFE6] p-2 text-[11px] italic text-[#5C4033]">
            Gift note: “{order.customer.giftMessage}”
          </p>
        )}
        <p className="mt-2 text-[11px] text-[#8C766B]">
          Handover PIN <span className="font-mono font-semibold text-[#241510]">{order.deliveryOtp}</span>{' '}
          — ask the customer to read it out; never read it to them.
        </p>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-[#E8DFD8] bg-white p-4">
        <h4 className="mb-2 text-xs font-semibold text-[#241510]">History</h4>
        <ol className="space-y-2.5">
          {[...order.stageHistory].reverse().map((entry, i) => (
            <li key={`${entry.at}-${i}`} className="border-l-2 border-[#E8DFD8] pl-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-[#241510]">{STAGES[entry.stage].label}</span>
                <span className="text-[10px] text-[#8C766B]">
                  {new Date(entry.at).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#5C4033]">{entry.note}</p>
              <p className="text-[10px] text-[#8C766B]">by {entry.by}</p>
            </li>
          ))}
        </ol>
      </div>

      <button type="button" onClick={onClose} className={`${btnGhost} w-full`}>
        Close
      </button>
    </div>
  );
};

/* -------------------------------------------------------------- list -- */

export const OrdersScreen: React.FC = () => {
  const { orders, hasPermission } = useStore();
  const toast = useToast();
  const [stageFilter, setStageFilter] = useState<'all' | OrderStage>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  // Announce orders that arrive while this screen is open.
  const seenCount = useRef(orders.length);
  useEffect(() => {
    if (orders.length > seenCount.current) {
      const fresh = orders.length - seenCount.current;
      toast('info', `${fresh} new order${fresh === 1 ? '' : 's'} just arrived.`);
    }
    seenCount.current = orders.length;
  }, [orders.length, toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (stageFilter !== 'all' && o.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        o.customer.city.toLowerCase().includes(q) ||
        (o.payment.upiReference ?? '').toLowerCase().includes(q)
      );
    });
  }, [orders, stageFilter, search]);

  const openOrder = orders.find((o) => o.id === openId) ?? null;

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ovenglow-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#241510]">Orders</h2>
          <p className="text-xs text-[#8C766B]">
            {filtered.length} of {orders.length} shown · newest first
          </p>
        </div>
        <button type="button" onClick={exportCsv} className={btnGhost} disabled={filtered.length === 0}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C766B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order number, name, phone or UPI reference"
            className={`${inputClass} pl-8`}
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as 'all' | OrderStage)}
          aria-label="Filter by stage"
          className={`${inputClass} w-auto`}
        >
          <option value="all">All stages</option>
          {ALL_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGES[s].label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={orders.length === 0 ? 'No orders yet' : 'Nothing matches that filter'}
          hint={
            orders.length === 0
              ? 'Orders placed on the storefront land here. Remember: with no backend, only orders placed in this same browser are visible.'
              : 'Try a different stage or clear the search.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E8DFD8] bg-white">
          <table className="w-full min-w-[52rem] text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8DFD8] bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#8C766B]">
                <th className="px-3 py-2.5 font-medium">Order</th>
                <th className="px-3 py-2.5 font-medium">Customer</th>
                <th className="px-3 py-2.5 font-medium">Stage</th>
                <th className="px-3 py-2.5 font-medium">Payment</th>
                <th className="px-3 py-2.5 text-right font-medium">Total</th>
                <th className="px-3 py-2.5 font-medium">Next</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const next = getNextStages(o);
                return (
                  <tr key={o.id} className="border-b border-[#F0EAE3] last:border-0 hover:bg-[#FAF7F2]">
                    <td className="px-3 py-2.5 align-top">
                      <button
                        type="button"
                        onClick={() => setOpenId(o.id)}
                        className="font-mono font-semibold text-[#241510] underline decoration-[#E8DFD8] underline-offset-2 hover:decoration-[#C58940]"
                      >
                        {o.orderNumber}
                      </button>
                      <span className="mt-0.5 block text-[10px] text-[#8C766B]">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <span className="block text-[#241510]">{o.customer.name}</span>
                      <span className="block font-mono text-[10px] text-[#8C766B]">
                        {o.customer.city} · {o.customer.phone}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <StageBadge stage={o.stage} />
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <span className="text-[#5C4033]">{o.paymentMethod}</span>
                      {o.payment.verifiedAt && (
                        <span className="mt-0.5 block text-[10px] text-emerald-700">verified</span>
                      )}
                      {o.stage === 'payment_verification_pending' && (
                        <span className="mt-0.5 block text-[10px] font-medium text-amber-700">
                          needs checking
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right align-top tabular-nums text-[#241510]">
                      {formatRupees(o.totalAmount)}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      {next.length > 0 && hasPermission('orders.advance') ? (
                        <button
                          type="button"
                          onClick={() => setOpenId(o.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E8DFD8] px-2 py-1 text-[11px] text-[#5C4033] hover:border-[#8C766B] hover:text-[#241510]"
                        >
                          {STAGES[next[0]].label} <ArrowRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#8C766B]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={openOrder !== null}
        onClose={() => setOpenId(null)}
        title={openOrder ? `Order ${openOrder.orderNumber}` : ''}
      >
        {openOrder && <OrderDetail order={openOrder} onClose={() => setOpenId(null)} />}
      </Drawer>
    </div>
  );
};
