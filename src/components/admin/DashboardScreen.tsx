import React, { useMemo, useState } from 'react';
import { AlertTriangle, PackageX, TrendingUp } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { STAGES, STAGE_ORDER } from '../../lib/orderStages';
import { formatRupees } from '../../lib/pricing';
import { EmptyState, StageBadge, StatCard } from './ui';

/**
 * Bar colour: a darker step of the brand gold (#C58940), chosen because the
 * brand tone itself sits at 2.91:1 against a white card and fails the 3:1 floor.
 * This one clears every check in the palette validator.
 */
const BAR = '#A8721F';
const LOW_STOCK_AT = 10;

/**
 * Seven days of real revenue. One series, so no legend — the heading names it.
 * Order count rides in the tooltip rather than on a second axis; two y-scales on
 * one chart is the mistake this deliberately avoids.
 */
const RevenueChart: React.FC<{
  data: { date: string; label: string; revenue: number; orders: number }[];
}> = ({ data }) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const hasAny = data.some((d) => d.revenue > 0);

  return (
    <div className="rounded-2xl border border-[#E8DFD8] bg-white p-4">
      <div className="mb-1 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#C58940]" />
        <h3 className="text-xs font-semibold text-[#241510]">Revenue, last 7 days</h3>
      </div>
      <p className="mb-4 text-[11px] text-[#8C766B]">
        Counted from real order timestamps. Cancelled orders are excluded.
      </p>

      {!hasAny ? (
        <p className="py-6 text-center text-xs text-[#8C766B]">
          No revenue recorded in the last seven days.
        </p>
      ) : (
        <div className="relative">
          <div className="flex h-40 items-end gap-2" role="img" aria-label="Daily revenue for the last seven days">
            {data.map((d, i) => {
              const height = (d.revenue / max) * 100;
              return (
                <div
                  key={d.date}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  {hover === i && (
                    <div className="absolute bottom-full z-10 mb-1.5 w-max max-w-[10rem] rounded-lg border border-[#E8DFD8] bg-white px-2.5 py-1.5 text-[11px] shadow-lg">
                      <span className="block font-medium text-[#241510]">
                        {new Date(d.date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="block tabular-nums text-[#5C4033]">
                        {formatRupees(d.revenue)}
                      </span>
                      <span className="block text-[#8C766B]">
                        {d.orders} order{d.orders === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                  <div
                    className="w-full rounded-t-[4px] transition-opacity"
                    style={{
                      height: `${Math.max(height, d.revenue > 0 ? 3 : 0)}%`,
                      background: BAR,
                      opacity: hover === null || hover === i ? 1 : 0.55,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-1.5 flex gap-2 border-t border-[#F0EAE3] pt-1.5">
            {data.map((d) => (
              <span
                key={d.date}
                className="flex-1 text-center text-[10px] text-[#8C766B]"
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The table view the contrast rule obliges, and a fallback for screen readers. */}
      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] text-[#8C766B] hover:text-[#241510]">
          View as table
        </summary>
        <table className="mt-2 w-full text-left text-[11px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#8C766B]">
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">Revenue</th>
              <th className="py-1 text-right font-medium">Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-t border-[#F0EAE3]">
                <td className="py-1 text-[#5C4033]">{d.label}</td>
                <td className="py-1 text-right tabular-nums text-[#241510]">
                  {formatRupees(d.revenue)}
                </td>
                <td className="py-1 text-right tabular-nums text-[#5C4033]">{d.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

export const DashboardScreen: React.FC = () => {
  const { getAnalytics, orders, products, storeSettings } = useStore();
  const analytics = getAnalytics();

  const lowStock = useMemo(
    () =>
      [...products]
        .filter((p) => p.isPublished)
        .sort((a, b) => a.stockCount - b.stockCount)
        .slice(0, 5),
    [products],
  );

  const needsAttention = orders.filter(
    (o) => o.stage === 'inquiry_received' || o.stage === 'payment_verification_pending',
  );

  const settingsGaps = [
    !storeSettings.upiId && 'UPI ID is blank — customers cannot pay you.',
    !storeSettings.whatsappNumber && 'WhatsApp number is blank — Inquire buttons fall back to email.',
    !storeSettings.fssaiLicense && 'FSSAI licence is blank — a food business must display it.',
    !storeSettings.phone && 'Store phone is blank.',
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#241510]">Dashboard</h2>
        <p className="text-xs text-[#8C766B]">How the shop is doing, and what needs you today.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatRupees(analytics.totalRevenue)}
          hint="Excludes cancelled"
        />
        <StatCard label="Orders" value={analytics.totalOrders} />
        <StatCard label="Average order" value={formatRupees(analytics.averageOrderValue)} />
        <StatCard label="Items sold" value={analytics.itemsSold} />
      </div>

      {settingsGaps.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-800" />
            <h3 className="text-xs font-semibold text-amber-900">Finish setting up</h3>
          </div>
          <ul className="space-y-1 text-[11px] text-amber-900">
            {settingsGaps.map((gap) => (
              <li key={gap}>• {gap}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart data={analytics.dailySales} />

        <div className="rounded-2xl border border-[#E8DFD8] bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold text-[#241510]">Orders by stage</h3>
          {analytics.totalOrders === 0 ? (
            <p className="py-6 text-center text-xs text-[#8C766B]">No orders yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {[...STAGE_ORDER, 'cancelled' as const]
                .filter((s) => (analytics.stageCounts[s] ?? 0) > 0)
                .map((s) => (
                  <li key={s} className="flex items-center justify-between gap-3">
                    <StageBadge stage={s} />
                    <span className="tabular-nums text-xs font-semibold text-[#241510]">
                      {analytics.stageCounts[s]}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E8DFD8] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <PackageX className="h-4 w-4 text-[#C58940]" />
            <h3 className="text-xs font-semibold text-[#241510]">Closest to running out</h3>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-[#8C766B]">Nothing published yet.</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 flex-1 truncate text-[#5C4033]">{p.name}</span>
                  <span
                    className={`shrink-0 tabular-nums font-semibold ${
                      p.stockCount === 0
                        ? 'text-rose-600'
                        : p.stockCount <= LOW_STOCK_AT
                          ? 'text-amber-700'
                          : 'text-[#241510]'
                    }`}
                  >
                    {p.stockCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[#E8DFD8] bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold text-[#241510]">
            Needs attention ({needsAttention.length})
          </h3>
          {needsAttention.length === 0 ? (
            <p className="text-xs text-[#8C766B]">
              Nothing waiting on you. New inquiries and payment references show up here.
            </p>
          ) : (
            <ul className="space-y-2">
              {needsAttention.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[#241510]">{o.orderNumber}</span>
                  <StageBadge stage={o.stage} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {orders.length === 0 && (
        <EmptyState
          title="No orders have been placed yet"
          hint="Every figure above is computed from real orders. Nothing here is sample or simulated data — an empty shop reads as empty."
        />
      )}

      <p className="rounded-xl border border-[#E8DFD8] bg-[#F5EFE6] px-3 py-2.5 text-[11px] leading-relaxed text-[#5C4033]">
        These numbers describe orders stored in <b>this browser only</b>. Ovenglow has no server yet,
        so an order a customer places on their own phone never reaches this dashboard.{' '}
        {STAGES.inquiry_received.label} is where every order starts.
      </p>
    </div>
  );
};
