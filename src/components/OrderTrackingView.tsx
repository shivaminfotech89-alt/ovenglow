import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { STAGES, getStageTrack } from '../lib/orderStages';
import { formatRupees } from '../lib/pricing';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  ChefHat,
  Package,
  MessageSquare,
  Copy,
  ShieldCheck,
  Wallet,
  AlertCircle,
  PackageSearch,
  Ban,
} from 'lucide-react';

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  inquiry_received: Clock,
  confirmed: ShieldCheck,
  awaiting_payment: Wallet,
  payment_verification_pending: Wallet,
  paid: CheckCircle2,
  baking: ChefHat,
  packed: Package,
  dispatched: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
};

/** The customer-facing half of the payment workflow. */
const PaymentPanel: React.FC<{ order: Order }> = ({ order }) => {
  const { submitUpiReference, storeSettings } = useStore();
  const [reference, setReference] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  if (order.paymentMethod === 'COD') return null;

  if (order.stage === 'awaiting_payment') {
    return (
      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-800" />
          <h3 className="text-sm font-semibold text-amber-900">
            Pay {formatRupees(order.totalAmount)} to confirm your order
          </h3>
        </div>

        {order.payment.rejectionNote && (
          <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
            Your last reference could not be matched: {order.payment.rejectionNote}
          </p>
        )}

        {storeSettings.upiId ? (
          <div className="rounded-lg border border-amber-300 bg-white px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-[#8C766B]">Pay to UPI ID</span>
            <span className="font-mono text-sm font-semibold text-[#241510]">{storeSettings.upiId}</span>
            {storeSettings.upiAccountName && (
              <span className="mt-0.5 block text-[11px] text-[#8C766B]">{storeSettings.upiAccountName}</span>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-amber-900">
            Payment details will be sent to you on WhatsApp.
          </p>
        )}

        <p className="text-[11px] leading-relaxed text-amber-900">{storeSettings.paymentInstructions}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const res = submitUpiReference(order.id, reference);
            setFeedback({ ok: res.success, message: res.message });
            if (res.success) setReference('');
          }}
          className="space-y-2"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-amber-900">
              UPI reference number
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="12-digit reference from your payment app"
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-[#241510] focus:border-[#241510] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-[#241510] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3D2317]"
          >
            I have paid — submit reference
          </button>
        </form>

        {feedback && (
          <p className={`text-[11px] ${feedback.ok ? 'text-emerald-800' : 'text-rose-700'}`}>
            {feedback.message}
          </p>
        )}
      </div>
    );
  }

  if (order.stage === 'payment_verification_pending') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-800" />
          <h3 className="text-sm font-semibold text-amber-900">Checking your payment</h3>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-900">
          We have your reference{' '}
          <span className="font-mono font-semibold">{order.payment.upiReference}</span> and are
          matching it against our bank. Your order moves to the kitchen as soon as it clears.
        </p>
      </div>
    );
  }

  return null;
};

export const OrderTrackingView: React.FC = () => {
  const {
    orders,
    customerUser,
    activeTrackingId,
    setActiveTrackingId,
    getOrderById,
    getWhatsAppSupportLink,
    storeSettings,
  } = useStore();

  const [query, setQuery] = useState(activeTrackingId ?? '');
  const [searched, setSearched] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Only ever the order that was actually asked for. The previous version fell
  // back to orders[0], which showed a stranger's name, address and handover PIN
  // to anyone who typed a wrong number.
  const currentOrder = query.trim() ? getOrderById(query) : undefined;

  // A signed-in customer sees their own orders as shortcuts — never the whole shop's.
  const myOrders = customerUser
    ? orders.filter((o) => o.customer.phone.replace(/\D/g, '') === customerUser.phone)
    : [];

  const track = currentOrder ? getStageTrack(currentOrder) : [];
  const currentIndex = currentOrder ? track.indexOf(currentOrder.stage) : -1;
  const isCancelled = currentOrder?.stage === 'cancelled';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-xl space-y-2.5 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DFD8] bg-[#FAF7F2] px-3 py-1 text-xs font-medium text-[#5C4033]">
          <Truck className="h-3.5 w-3.5 text-[#C58940]" />
          <span>Order tracking</span>
        </div>
        <h2 className="font-serif text-2xl font-bold tracking-tight text-[#241510] sm:text-3xl">
          Track your order
        </h2>
        <p className="text-xs text-[#6B574E] sm:text-sm">
          Enter your order number or the mobile number you ordered with.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearched(true);
            const found = getOrderById(query);
            if (found) setActiveTrackingId(found.orderNumber);
          }}
          className="mx-auto flex max-w-md gap-2 pt-1"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C766B]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearched(false);
              }}
              placeholder="OG-20260910-001 or your mobile number"
              className="w-full rounded-full border border-[#E8DFD8] bg-white py-2.5 pl-10 pr-4 text-xs text-[#241510] placeholder:text-[#A69286] focus:border-[#241510] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[#241510] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#3D2317]"
          >
            Track
          </button>
        </form>

        {myOrders.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {myOrders.slice(0, 4).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setQuery(o.orderNumber);
                  setActiveTrackingId(o.orderNumber);
                  setSearched(true);
                }}
                className="rounded-full border border-[#E8DFD8] bg-white px-2.5 py-1 font-mono text-[11px] text-[#5C4033] hover:border-[#C58940] hover:text-[#241510]"
              >
                {o.orderNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {!currentOrder ? (
        <div className="mx-auto max-w-md rounded-2xl border border-[#E8DFD8] bg-white p-8 text-center shadow-xs">
          <PackageSearch className="mx-auto mb-2 h-10 w-10 text-[#8C766B] opacity-60" />
          <h4 className="font-serif text-base font-bold text-[#241510]">
            {searched && query.trim() ? 'No order found' : 'Enter your order number'}
          </h4>
          <p className="mt-1 text-xs text-[#8C766B]">
            {searched && query.trim()
              ? 'We could not find an order with that number or mobile. Check the number on your confirmation, or message us and we will look it up.'
              : 'Your order number was shown when you checked out and starts with OG-.'}
          </p>
          <a
            href={getWhatsAppSupportLink('Order tracking help')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#5C4033] underline underline-offset-2 hover:text-[#241510]"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Ask us on WhatsApp
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8 sm:space-y-6">
            <div className="space-y-5 rounded-2xl border border-[#E8DFD8] bg-white p-5 shadow-xs sm:p-7">
              <div className="flex flex-col justify-between gap-3 border-b border-[#E8DFD8] pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-xl font-bold text-[#241510] sm:text-2xl">
                      {currentOrder.orderNumber}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        isCancelled
                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                          : currentOrder.stage === 'delivered'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-[#E8DFD8] bg-[#FAF7F2] text-[#241510]'
                      }`}
                    >
                      {STAGES[currentOrder.stage].label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#8C766B]">
                    Placed{' '}
                    {new Date(currentOrder.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-[#E8DFD8] bg-[#FAF7F2] px-3 py-1.5">
                  <div>
                    <span className="block text-[10px] text-[#8C766B]">Handover PIN</span>
                    <span className="font-mono text-base font-bold tracking-wider text-[#241510]">
                      {currentOrder.deliveryOtp}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Copy handover PIN"
                    onClick={() => {
                      navigator.clipboard.writeText(currentOrder.deliveryOtp);
                      setCopiedOtp(true);
                      setTimeout(() => setCopiedOtp(false), 2000);
                    }}
                    className="rounded-md p-1 text-[#8C766B] hover:text-[#241510]"
                  >
                    {copiedOtp ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#5C4033]">
                {STAGES[currentOrder.stage].why}
              </p>

              {isCancelled ? (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
                  <Ban className="h-4 w-4 shrink-0" />
                  This order was cancelled. If money was taken, a refund is handled separately.
                </div>
              ) : (
                <div>
                  <div className="hidden gap-1 sm:grid" style={{ gridTemplateColumns: `repeat(${track.length}, minmax(0, 1fr))` }}>
                    {track.map((stage, idx) => {
                      const Icon = STEP_ICONS[stage] ?? Clock;
                      const done = idx <= currentIndex;
                      return (
                        <div key={stage} className="flex flex-col items-center gap-1.5 text-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                              done ? 'border-[#241510] bg-[#241510] text-[#E5A93C]' : 'border-[#E8DFD8] bg-white text-[#8C766B]'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className={`text-[10px] leading-tight ${done ? 'font-medium text-[#241510]' : 'text-[#8C766B]'}`}>
                            {STAGES[stage].label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="sm:hidden">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8DFD8]">
                      <div
                        className="h-full rounded-full bg-[#241510] transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / track.length) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#8C766B]">
                      Step {currentIndex + 1} of {track.length}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <PaymentPanel order={currentOrder} />

            <div className="rounded-2xl border border-[#E8DFD8] bg-white p-5 shadow-xs">
              <h3 className="mb-3 text-xs font-semibold text-[#241510]">Progress</h3>
              <ol className="space-y-3">
                {[...currentOrder.stageHistory].reverse().map((entry, i) => (
                  <li key={`${entry.at}-${i}`} className="border-l-2 border-[#E8DFD8] pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-[#241510]">{STAGES[entry.stage].label}</span>
                      <span className="text-[10px] text-[#8C766B]">
                        {new Date(entry.at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#5C4033]">{entry.note}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-[#E8DFD8] bg-white p-5 shadow-xs">
              <h3 className="mb-2.5 text-xs font-semibold text-[#241510]">Your order</h3>
              <ul className="space-y-1.5">
                {currentOrder.items.map((item) => (
                  <li key={item.product.id} className="flex justify-between gap-2 text-xs">
                    <span className="text-[#5C4033]">
                      {item.quantity} × {item.product.name}
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
                  <dd className="tabular-nums">{formatRupees(currentOrder.itemTotal)}</dd>
                </div>
                {currentOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Discount {currentOrder.couponCode && `(${currentOrder.couponCode})`}</dt>
                    <dd className="tabular-nums">−{formatRupees(currentOrder.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[#8C766B]">Delivery</dt>
                  <dd className="tabular-nums">
                    {currentOrder.deliveryFee === 0 ? 'Free' : formatRupees(currentOrder.deliveryFee)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C766B]">GST @ {storeSettings.gstPercent}%</dt>
                  <dd className="tabular-nums">{formatRupees(currentOrder.tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-[#E8DFD8] pt-1.5 font-semibold text-[#241510]">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatRupees(currentOrder.totalAmount)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-[#E8DFD8] bg-white p-5 text-xs shadow-xs">
              <h3 className="mb-2 text-xs font-semibold text-[#241510]">Delivering to</h3>
              <p className="font-medium text-[#241510]">{currentOrder.customer.name}</p>
              <p className="mt-0.5 leading-relaxed text-[#5C4033]">
                {currentOrder.customer.address}
                <br />
                {currentOrder.customer.city} {currentOrder.customer.pincode}
              </p>
              <p className="mt-2 text-[11px] text-[#8C766B]">
                {currentOrder.deliveryPartner.name} · {currentOrder.estimatedDeliveryTime}
              </p>
            </div>

            <a
              href={getWhatsAppSupportLink(`Order ${currentOrder.orderNumber}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E8DFD8] bg-white px-4 py-2.5 text-xs font-medium text-[#5C4033] hover:text-[#241510]"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" /> Ask about this order
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
