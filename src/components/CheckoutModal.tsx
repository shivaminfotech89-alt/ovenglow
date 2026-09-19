import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UpiPayPanel } from './UpiPayPanel';
import { PaymentMethod, CustomerDetails, Order } from '../types';
import confetti from 'canvas-confetti';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Banknote,
  MessageSquare,
  ArrowRight,
  Copy,
  AlertCircle,
  Info,
} from 'lucide-react';
import { formatRupees } from '../lib/pricing';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

/**
 * Only the two payment routes the shop can actually honour today.
 *
 * Card and net-banking were removed: they collected a PAN, expiry and CVV that
 * were never validated, never transmitted and never charged, while the order was
 * marked Paid regardless. Capturing card data with no gateway behind it is a
 * PCI-DSS exposure, so the fields are gone until a hosted checkout (Razorpay,
 * PhonePe, Cashfree) is wired in.
 */
const METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'UPI', label: 'UPI', hint: 'Pay now, we verify the reference' },
  { id: 'COD', label: 'Cash on delivery', hint: 'Pay the rider at your door' },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { cart, createOrder, getWhatsAppOrderLink, customerUser, loginWithMobile, storeSettings, totals, activeCoupon } =
    useStore();

  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: customerUser?.name ?? '',
    phone: customerUser?.phone ?? '',
    email: customerUser?.email ?? '',
    address: customerUser?.address ?? '',
    city: customerUser?.city ?? storeSettings.city,
    state: storeSettings.state,
    pincode: customerUser?.pincode ?? '',
    giftMessage: '',
    enableWhatsAppUpdates: true,
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [isPlacing, setIsPlacing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Every hook belongs above the `if (!isOpen) return null` below. One declared
  // after it made the hook count change when the modal opened, which React
  // treats as a fatal error rather than a warning.
  const [placeError, setPlaceError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerUser) return;
    setCustomer((prev) => ({
      ...prev,
      name: customerUser.name || prev.name,
      phone: customerUser.phone || prev.phone,
      address: customerUser.address || prev.address,
      city: customerUser.city || storeSettings.city,
      state: storeSettings.state,
      pincode: customerUser.pincode || prev.pincode,
    }));
  }, [customerUser, storeSettings, isOpen]);

  if (!isOpen) return null;

  const servicedPins = storeSettings.deliveryAreas.map((a) => a.pin).filter(Boolean);

  const validateDetails = () => {
    const err: Record<string, string> = {};
    if (!customer.name.trim()) err.name = 'Full name is required';
    if (customer.phone.replace(/\D/g, '').length !== 10) {
      err.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!customer.address.trim()) err.address = 'Delivery address is required';
    if (!/^\d{6}$/.test(customer.pincode.trim())) {
      err.pincode = 'Enter a 6-digit Indian PIN code';
    } else if (servicedPins.length > 0 && !servicedPins.includes(customer.pincode.trim())) {
      // Better to say so now than to take money for an address we cannot reach.
      err.pincode = `We do not deliver to ${customer.pincode} yet. Serviced PINs: ${[...new Set(servicedPins)].join(', ')}`;
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const proceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;
    // Remember the customer so their next order pre-fills.
    if (!customerUser) {
      loginWithMobile(customer.phone, customer.name, customer.address, customer.pincode);
    }
    setStep('payment');
  };

  const placeOrder = async () => {
    setIsPlacing(true);
    setPlaceError(null);
    let order;
    try {
      // The order goes to the database now, not to this browser. It can fail,
      // and telling the customer their order was placed when it was not is the
      // one outcome worth guarding hardest against.
      order = await createOrder(customer, paymentMethod);
    } catch (e) {
      console.error('Could not place the order:', e);
      setIsPlacing(false);
      setPlaceError(
        'We could not place your order just now. Please check your connection and try again, or message us on WhatsApp.',
      );
      return;
    }

    setCreatedOrder(order);
    setStep('success');
    setIsPlacing(false);
    try {
      confetti({ particleCount: 110, spread: 70, origin: { y: 0.6 }, colors: ['#E5A93C', '#C58940', '#10B981', '#FFFFFF'] });
    } catch {
      /* confetti is decoration; never block the order on it */
    }
    onOrderSuccess(order);
  };

  const inputBase =
    'w-full px-3 py-2 rounded-lg bg-white border border-[#E8DFD8] text-[#241510] text-xs focus:outline-none focus:border-[#241510]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        className="relative my-auto flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E8DFD8] bg-[#FAF7F2] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#E8DFD8] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DFD8] bg-[#FAF7F2]">
              <ShieldCheck className="h-4 w-4 text-[#C58940]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#241510]">
                {step === 'success' ? 'Order placed' : 'Checkout'}
              </h3>
              <p className="text-[11px] text-[#8C766B]">
                {step === 'details' ? 'Where should we deliver?' : step === 'payment' ? 'How would you like to pay?' : 'What happens next'}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close checkout" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#8C766B] hover:bg-[#FAF7F2] hover:text-[#241510]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* ---------------------------------------------------- details -- */}
          {step === 'details' && (
            <form onSubmit={proceed} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[#5C4033]">Full name</span>
                  <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={inputBase} />
                  {errors.name && <span className="mt-1 block text-[11px] text-rose-600">{errors.name}</span>}
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[#5C4033]">Mobile number</span>
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '') })}
                    className={inputBase}
                  />
                  {errors.phone && <span className="mt-1 block text-[11px] text-rose-600">{errors.phone}</span>}
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#5C4033]">Delivery address</span>
                <textarea
                  rows={2}
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className={inputBase}
                />
                {errors.address && <span className="mt-1 block text-[11px] text-rose-600">{errors.address}</span>}
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[#5C4033]">City</span>
                  <input value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} className={inputBase} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[#5C4033]">PIN code</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={customer.pincode}
                    onChange={(e) => setCustomer({ ...customer, pincode: e.target.value.replace(/\D/g, '') })}
                    className={inputBase}
                  />
                  {errors.pincode && <span className="mt-1 block text-[11px] text-rose-600">{errors.pincode}</span>}
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#5C4033]">Gift message (optional)</span>
                <input
                  value={customer.giftMessage}
                  onChange={(e) => setCustomer({ ...customer, giftMessage: e.target.value })}
                  placeholder="Written on the card inside the box"
                  className={inputBase}
                />
              </label>

              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#241510] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#3D2317] sm:text-sm">
                Continue to payment <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ---------------------------------------------------- payment -- */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E8DFD8] bg-white p-4">
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[#8C766B]">Subtotal</dt>
                    <dd className="tabular-nums">{formatRupees(totals.itemTotal)}</dd>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <dt>Discount ({activeCoupon?.code})</dt>
                      <dd className="tabular-nums">−{formatRupees(totals.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-[#8C766B]">Delivery</dt>
                    <dd className="tabular-nums">{totals.deliveryFee === 0 ? 'Free' : formatRupees(totals.deliveryFee)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#8C766B]">GST @ {storeSettings.gstPercent}%</dt>
                    <dd className="tabular-nums">{formatRupees(totals.tax)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-[#E8DFD8] pt-1.5 text-sm font-semibold text-[#241510]">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatRupees(totals.total)}</dd>
                  </div>
                </dl>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      paymentMethod === m.id ? 'border-[#241510] bg-[#241510] text-white' : 'border-[#E8DFD8] bg-white text-[#241510] hover:border-[#8C766B]'
                    }`}
                  >
                    {m.id === 'UPI' ? (
                      <QrCode className={`mb-2 h-4 w-4 ${paymentMethod === m.id ? 'text-[#C58940]' : 'text-[#8C766B]'}`} />
                    ) : (
                      <Banknote className={`mb-2 h-4 w-4 ${paymentMethod === m.id ? 'text-[#C58940]' : 'text-[#8C766B]'}`} />
                    )}
                    <span className="block text-xs font-medium">{m.label}</span>
                    <span className={`text-[10px] ${paymentMethod === m.id ? 'text-white/70' : 'text-[#8C766B]'}`}>{m.hint}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'UPI' && (
                <div className="space-y-2.5 rounded-xl border border-[#E8DFD8] bg-white p-4 text-xs">
                  {storeSettings.upiId ? (
                    <>
                      <p className="font-medium text-[#241510]">Pay to this UPI ID</p>
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E8DFD8] bg-[#FAF7F2] px-3 py-2">
                        <span className="font-mono text-sm font-semibold text-[#241510]">{storeSettings.upiId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(storeSettings.upiId);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E8DFD8] px-2 py-1 text-[11px] text-[#5C4033] hover:text-[#241510]"
                        >
                          <Copy className="h-3 w-3" /> {copiedUpi ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      {storeSettings.upiAccountName && (
                        <p className="text-[11px] text-[#8C766B]">Account name: {storeSettings.upiAccountName}</p>
                      )}
                      {/* No QR at this step on purpose. The order does not
                          exist yet, so a code here could not carry an order
                          number, and a payment the shop cannot match to an
                          order is a payment it has to chase. The code appears
                          the moment the order is placed. */}
                      <p className="text-[11px] text-[#8C766B]">
                        You will get a scannable code with the exact amount as soon as you
                        place the order.
                      </p>
                    </>
                  ) : (
                    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                      The shop has not published a UPI ID yet. Place the order and we will send payment
                      details on WhatsApp.
                    </p>
                  )}

                  <p className="flex items-start gap-2 border-t border-[#E8DFD8] pt-2.5 text-[11px] leading-relaxed text-[#5C4033]">
                    <Info className="mt-px h-3.5 w-3.5 shrink-0 text-[#C58940]" />
                    {storeSettings.paymentInstructions}
                  </p>
                </div>
              )}

              {paymentMethod === 'COD' && (
                <div className="rounded-xl border border-[#E8DFD8] bg-white p-4 text-xs">
                  <p className="font-medium text-[#241510]">Cash or UPI on delivery</p>
                  <p className="mt-1 text-[11px] text-[#8C766B]">
                    Pay the rider when your order arrives. We start baking as soon as the kitchen
                    confirms your order.
                  </p>
                </div>
              )}

              {placeError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {placeError}
                </p>
              )}

              <div className="flex gap-2.5">
                <button type="button" onClick={() => setStep('details')} className="rounded-full border border-[#E8DFD8] px-4 py-2.5 text-xs font-medium text-[#5C4033] hover:bg-white">
                  Back
                </button>
                <button
                  type="button"
                  disabled={isPlacing || cart.length === 0}
                  onClick={() => void placeOrder()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#241510] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#3D2317] disabled:opacity-50 sm:text-sm"
                >
                  {isPlacing ? 'Placing order…' : `Place order · ${formatRupees(totals.total)}`}
                </button>
              </div>

              <p className="text-center text-[11px] text-[#8C766B]">
                Placing an order does not charge you. Nothing is marked paid until our team confirms
                the money has arrived.
              </p>
            </div>
          )}

          {/* ---------------------------------------------------- success -- */}
          {step === 'success' && createdOrder && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-[#241510] sm:text-2xl">
                  Thank you, {createdOrder.customer.name}
                </h3>
                <p className="mt-0.5 text-xs text-[#8C766B]">
                  Your order is with our kitchen. We will confirm it shortly.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-[#E8DFD8] bg-white p-4 text-left">
                <div className="flex items-center justify-between border-b border-[#E8DFD8] pb-2">
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-[#8C766B]">Order number</span>
                    <span className="font-mono text-sm font-semibold text-[#241510]">{createdOrder.orderNumber}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[#241510]">
                    {formatRupees(createdOrder.totalAmount)}
                  </span>
                </div>

                {/* The moment a customer is most willing to pay is the moment
                    they have just ordered. Sending them away to find payment
                    details later loses orders; the code is here, with the
                    amount and order number already in it. */}
                {createdOrder.paymentMethod === 'UPI' && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#241510]">Pay now to confirm</p>
                    <UpiPayPanel
                      amount={createdOrder.totalAmount}
                      reference={createdOrder.orderNumber}
                      className="border-[#E8DFD8]"
                    />
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-[#5C4033]">
                  <p className="font-medium text-[#241510]">What happens next</p>
                  <ol className="list-inside list-decimal space-y-1 text-[11px]">
                    <li>Our kitchen confirms your order.</li>
                    {createdOrder.paymentMethod === 'UPI' ? (
                      <>
                        <li>You pay by UPI, with the code above or on the tracking page.</li>
                        <li>You enter your UPI reference on the tracking page.</li>
                        <li>We check it against our bank and mark the order paid.</li>
                        <li>Then we bake, pack and deliver.</li>
                      </>
                    ) : (
                      <>
                        <li>We bake and pack your order fresh.</li>
                        <li>You pay the rider on delivery.</li>
                      </>
                    )}
                  </ol>
                </div>

                <p className="rounded-lg bg-[#F5EFE6] px-3 py-2 text-[11px] text-[#5C4033]">
                  Keep your handover PIN{' '}
                  <span className="font-mono font-semibold text-[#241510]">{createdOrder.deliveryOtp}</span>{' '}
                  private. Read it out to the rider only when your order arrives.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={getWhatsAppOrderLink(createdOrder, storeSettings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#E8DFD8] bg-white px-4 py-2.5 text-xs font-medium text-[#5C4033] hover:text-[#241510]"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-600" /> Message us on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setStep('details');
                    setCreatedOrder(null);
                    onClose();
                  }}
                  className="flex-1 rounded-full bg-[#241510] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3D2317]"
                >
                  Track my order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
