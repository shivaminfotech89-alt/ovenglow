import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { PaymentMethod, CustomerDetails, Order } from '../types';
import confetti from 'canvas-confetti';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Building2, 
  MessageSquare, 
  ArrowRight,
  Sparkles,
  Truck,
  Copy,
  ExternalLink,
  Phone,
  User,
  RotateCw,
  Lock,
  AlertCircle
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { 
    cart, 
    activeCoupon, 
    createOrder, 
    getWhatsAppOrderLink,
    customerUser,
    loginWithMobile,
    logoutCustomer,
    storeSettings
  } = useStore();

  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Form State
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: customerUser?.name || '',
    phone: customerUser?.phone || '',
    email: customerUser?.email || '',
    address: customerUser?.address || '',
    city: customerUser?.city || storeSettings.city,
    state: storeSettings.state,
    pincode: customerUser?.pincode || storeSettings.pincode,
    giftMessage: '',
    enableWhatsAppUpdates: true,
  });

  // Inline Mobile Verification State (if user is not yet logged in)
  const [verifyPhone, setVerifyPhone] = useState(customerUser?.phone || '');
  const [verifyName, setVerifyName] = useState(customerUser?.name || '');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Sync when customerUser or storeSettings change or modal opens
  useEffect(() => {
    if (customerUser) {
      setCustomer((prev) => ({
        ...prev,
        name: customerUser.name || prev.name,
        phone: customerUser.phone || prev.phone,
        address: customerUser.address || prev.address,
        city: customerUser.city || storeSettings.city,
        state: storeSettings.state,
        pincode: customerUser.pincode || storeSettings.pincode
      }));
      setVerifyPhone(customerUser.phone);
      setVerifyName(customerUser.name);
    }
  }, [customerUser, storeSettings, isOpen]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'qr'>('qr');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Calculate totals
  const itemTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  let discount = 0;
  if (activeCoupon === 'FESTIVE15') discount = Math.round(itemTotal * 0.15);
  else if (activeCoupon === 'OVENGLOW100') discount = Math.min(itemTotal, 100);
  else if (activeCoupon === 'SWEET20') discount = Math.round(itemTotal * 0.20);

  const deliveryFee = itemTotal - discount >= 499 ? 0 : 60;
  const tax = Math.round((itemTotal - discount) * 0.05);
  const finalAmount = Math.max(0, itemTotal - discount + deliveryFee + tax);

  const handleConfirmInlineMobile = () => {
    setOtpError(null);
    const cleanPhone = verifyPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setOtpError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!verifyName.trim()) {
      setOtpError('Please enter your full name');
      return;
    }
    const res = loginWithMobile(cleanPhone, verifyName, customer.address, customer.pincode || storeSettings.pincode);
    if (res.success) {
      setCustomer((prev) => ({
        ...prev,
        name: verifyName,
        phone: cleanPhone,
        city: storeSettings.city,
        state: storeSettings.state,
        pincode: prev.pincode || storeSettings.pincode
      }));
      setOtpError(null);
    } else {
      setOtpError(res.message);
    }
  };

  const validateDetails = () => {
    const err: Record<string, string> = {};
    if (!customerUser) {
      err.auth = 'Customer mobile verification required before checkout. Please verify your mobile number above so our atelier can contact you for delivery.';
    }
    if (!customer.name.trim()) err.name = 'Full Name is required';
    if (!customer.phone.trim() || customer.phone.replace(/\D/g, '').length < 10) {
      err.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!customer.address.trim()) err.address = 'Delivery address is required';
    if (!customer.pincode.trim() || customer.pincode.length !== 6) {
      err.pincode = 'Enter a 6-digit Indian PIN code';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDetails()) {
      setStep('payment');
    }
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const order = createOrder(customer, paymentMethod);
      setCreatedOrder(order);
      setStep('success');

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E5A93C', '#F59E0B', '#F43F5E', '#10B981', '#FFFFFF']
        });
      } catch {
        // Fallback
      }

      onOrderSuccess(order);
    }, 1400);
  };

  const copyOtpToClipboard = () => {
    if (!createdOrder) return;
    navigator.clipboard.writeText(createdOrder.deliveryOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
    <div 
      id="checkout-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#FAF7F2] border border-[#E8DFD8] rounded-2xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#241510]">
              <ShieldCheck className="w-4 h-4 text-[#C58940]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#241510] text-base sm:text-lg">
                {step === 'details' && 'Shipping & Contact'}
                {step === 'payment' && 'Select Payment Method'}
                {step === 'success' && 'Order Confirmed'}
              </h3>
              <span className="text-xs text-[#8C766B] font-medium font-mono">
                {step !== 'success' ? `Total: ₹${finalAmount}` : `Ref #${createdOrder?.orderNumber}`}
              </span>
            </div>
          </div>

          {step !== 'success' && (
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#8C766B] hover:text-[#241510] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: CUSTOMER DETAILS */}
          {step === 'details' && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">

              {/* Customer Mobile Verification Banner / Prompt */}
              {customerUser ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-emerald-950">{customerUser.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          Verified Mobile
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-emerald-700 mt-0.5">
                        +91 {customerUser.phone} • Atelier & Courier contact line
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => logoutCustomer()}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 underline font-medium"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-amber-950 leading-tight">
                        Customer Mobile Login Required to Place Order
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Our atelier and delivery executives contact you directly on this number for order updates and cold-chain handover.
                      </p>
                    </div>
                  </div>

                  {errors.auth && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.auth}</span>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-amber-950 block mb-1">
                          Indian Mobile Number *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#241510]">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="Enter 10-digit mobile"
                            value={verifyPhone}
                            onChange={(e) => {
                              setVerifyPhone(e.target.value.replace(/\D/g, ''));
                              setOtpError(null);
                            }}
                            className="w-full pl-11 pr-3 py-2 rounded-lg bg-white border border-amber-300 focus:border-[#241510] text-[#241510] text-xs font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-amber-950 block mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={verifyName}
                          onChange={(e) => {
                            setVerifyName(e.target.value);
                            setOtpError(null);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 focus:border-[#241510] text-[#241510] text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {otpError && (
                      <p className="text-[11px] text-rose-600 font-medium">{otpError}</p>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmInlineMobile}
                        className="py-2 px-4 rounded-lg bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E5A93C]" />
                        <span>Confirm Mobile & Continue</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-medium text-[#5C4033] block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs focus:outline-none placeholder:text-[#8C766B]"
                  />
                  {errors.name && <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5C4033] block mb-1">
                    Mobile Number (Admin & Courier Line) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8C766B]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs font-mono focus:outline-none placeholder:text-[#8C766B]"
                    />
                  </div>
                  {errors.phone && <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#5C4033] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs focus:outline-none placeholder:text-[#8C766B]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#5C4033] block mb-1">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Apartment, building, street or landmark"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs focus:outline-none placeholder:text-[#8C766B] resize-none"
                />
                {errors.address && <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#5C4033] block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder={storeSettings.pincode}
                    value={customer.pincode}
                    onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs font-mono focus:outline-none"
                  />
                  {errors.pincode && <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.pincode}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5C4033] block mb-1">City</label>
                  <input
                    type="text"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5C4033] block mb-1">State</label>
                  <input
                    type="text"
                    value={customer.state}
                    onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* WhatsApp Notification Opt-in */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E8DFD8] flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-whatsapp-optin"
                  checked={customer.enableWhatsAppUpdates}
                  onChange={(e) => setCustomer({ ...customer, enableWhatsAppUpdates: e.target.checked })}
                  className="mt-0.5 accent-[#241510] w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="chk-whatsapp-optin" className="text-xs cursor-pointer text-[#5C4033]">
                  <span className="font-medium text-[#241510] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Delivery updates via WhatsApp
                  </span>
                  <span className="text-[11px] text-[#8C766B] block mt-0.5">
                    Real-time courier tracking link and dispatch confirmation sent to your number.
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-full font-medium bg-[#241510] hover:bg-[#3D2317] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs sm:text-sm"
                >
                  <span>Proceed to Payment • ₹{finalAmount}</span>
                  <ArrowRight className="w-4 h-4 text-[#C58940]" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT METHOD SELECTION */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-[#241510] bg-[#241510] text-white shadow-xs'
                      : 'border-[#E8DFD8] bg-white text-[#241510] hover:border-[#8C766B]'
                  }`}
                >
                  <QrCode className={`w-4 h-4 mb-2 ${paymentMethod === 'UPI' ? 'text-[#C58940]' : 'text-[#8C766B]'}`} />
                  <span className="text-xs font-medium block">UPI</span>
                  <span className={`text-[10px] ${paymentMethod === 'UPI' ? 'text-white/70' : 'text-[#8C766B]'}`}>Instant QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'Card'
                      ? 'border-[#241510] bg-[#241510] text-white shadow-xs'
                      : 'border-[#E8DFD8] bg-white text-[#241510] hover:border-[#8C766B]'
                  }`}
                >
                  <CreditCard className={`w-4 h-4 mb-2 ${paymentMethod === 'Card' ? 'text-[#C58940]' : 'text-[#8C766B]'}`} />
                  <span className="text-xs font-medium block">Card</span>
                  <span className={`text-[10px] ${paymentMethod === 'Card' ? 'text-white/70' : 'text-[#8C766B]'}`}>Credit / Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Netbanking')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'Netbanking'
                      ? 'border-[#241510] bg-[#241510] text-white shadow-xs'
                      : 'border-[#E8DFD8] bg-white text-[#241510] hover:border-[#8C766B]'
                  }`}
                >
                  <Building2 className={`w-4 h-4 mb-2 ${paymentMethod === 'Netbanking' ? 'text-[#C58940]' : 'text-[#8C766B]'}`} />
                  <span className="text-xs font-medium block">Net Banking</span>
                  <span className={`text-[10px] ${paymentMethod === 'Netbanking' ? 'text-white/70' : 'text-[#8C766B]'}`}>All Banks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-[#241510] bg-[#241510] text-white shadow-xs'
                      : 'border-[#E8DFD8] bg-white text-[#241510] hover:border-[#8C766B]'
                  }`}
                >
                  <Banknote className={`w-4 h-4 mb-2 ${paymentMethod === 'COD' ? 'text-[#C58940]' : 'text-[#8C766B]'}`} />
                  <span className="text-xs font-medium block">COD</span>
                  <span className={`text-[10px] ${paymentMethod === 'COD' ? 'text-white/70' : 'text-[#8C766B]'}`}>At Doorstep</span>
                </button>
              </div>

              {/* UPI Sub-Interface */}
              {paymentMethod === 'UPI' && (
                <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#241510]">Scan UPI QR Code</span>
                    <span className="text-emerald-700 text-[11px] font-medium">Zero Gateway Fees</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]">
                    <div className="w-28 h-28 bg-white p-2 rounded-lg shrink-0 flex items-center justify-center border border-[#E8DFD8]">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <rect width="100" height="100" fill="white" />
                        <rect x="10" y="10" width="25" height="25" fill="#241510" />
                        <rect x="15" y="15" width="15" height="15" fill="white" />
                        <rect x="18" y="18" width="9" height="9" fill="#241510" />
                        <rect x="65" y="10" width="25" height="25" fill="#241510" />
                        <rect x="70" y="15" width="15" height="15" fill="white" />
                        <rect x="73" y="18" width="9" height="9" fill="#241510" />
                        <rect x="10" y="65" width="25" height="25" fill="#241510" />
                        <rect x="15" y="70" width="15" height="15" fill="white" />
                        <rect x="18" y="73" width="9" height="9" fill="#241510" />
                        <rect x="42" y="15" width="6" height="6" fill="#241510" />
                        <rect x="52" y="25" width="6" height="6" fill="#241510" />
                        <rect x="45" y="45" width="10" height="10" fill="#C58940" />
                        <rect x="65" y="65" width="8" height="8" fill="#241510" />
                        <rect x="78" y="75" width="8" height="8" fill="#241510" />
                      </svg>
                    </div>
                    <div className="text-xs space-y-1 text-center sm:text-left">
                      <p className="font-medium text-[#241510]">Scan with Google Pay, PhonePe, Paytm or BHIM</p>
                      {storeSettings.upiId ? (
                        <p className="text-[#8C766B] font-mono text-[11px]">UPI ID: {storeSettings.upiId}</p>
                      ) : (
                        <p className="text-[#8C766B] font-mono text-[11px]">Direct UPI Intent & Dynamic QR</p>
                      )}
                      <span className="inline-block px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200">
                        Instant payment verification
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards Sub-Interface */}
              {paymentMethod === 'Card' && (
                <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#5C4033] block mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="16-digit card number"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] text-xs font-mono focus:outline-none focus:border-[#241510]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[#5C4033] block mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] text-xs font-mono focus:outline-none focus:border-[#241510]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#5C4033] block mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="CVV"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] text-xs font-mono focus:outline-none focus:border-[#241510]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking Sub-Interface */}
              {paymentMethod === 'Netbanking' && (
                <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] space-y-2">
                  <label className="text-xs font-medium text-[#5C4033] block">Select Bank</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                          selectedBank === bank
                            ? 'border-[#241510] bg-[#241510] text-white'
                            : 'border-[#E8DFD8] bg-[#FAF7F2] text-[#241510]'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* COD Notice */}
              {paymentMethod === 'COD' && (
                <div className="p-3.5 rounded-xl bg-white border border-[#E8DFD8] text-xs text-[#5C4033] space-y-1">
                  <p className="font-medium text-[#241510] flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-[#C58940]" /> Cash or UPI on Delivery
                  </p>
                  <p className="text-[11px] text-[#8C766B]">
                    Payment can be made in cash or via rider QR code upon handoff.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="px-4 py-2.5 rounded-full border border-[#E8DFD8] text-xs font-medium text-[#5C4033] hover:text-[#241510] hover:bg-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  id="btn-confirm-and-pay"
                  disabled={isProcessing}
                  onClick={handleCompletePayment}
                  className="flex-1 py-2.5 px-5 rounded-full font-medium bg-[#241510] hover:bg-[#3D2317] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isProcessing ? (
                    <span>Placing Order...</span>
                  ) : (
                    <span>Pay ₹{finalAmount} via {paymentMethod}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER SUCCESS WITH WHATSAPP LINK & OTP */}
          {step === 'success' && createdOrder && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#241510]">
                  Thank You, {createdOrder.customer.name}
                </h3>
                <p className="text-xs text-[#8C766B] mt-0.5">
                  Your artisanal bakery order has been confirmed.
                </p>
              </div>

              {/* Order Info Card */}
              <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] text-left space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DFD8] pb-2">
                  <div>
                    <span className="text-[10px] text-[#8C766B] block uppercase font-mono">Order Number</span>
                    <span className="text-sm font-semibold font-mono text-[#241510]">
                      #{createdOrder.orderNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8C766B] block uppercase font-mono">Amount</span>
                    <span className="text-sm font-bold font-mono text-[#241510]">
                      ₹{createdOrder.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Delivery OTP */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8]">
                  <div>
                    <span className="text-[10px] text-[#8C766B] block uppercase tracking-wider">
                      Delivery OTP
                    </span>
                    <span className="text-[11px] text-[#5C4033]">Share with courier at delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold font-mono text-[#241510] tracking-wider px-2.5 py-0.5 rounded bg-white border border-[#E8DFD8]">
                      {createdOrder.deliveryOtp}
                    </span>
                    <button
                      onClick={copyOtpToClipboard}
                      className="p-1 text-[#8C766B] hover:text-[#241510]"
                      title="Copy OTP"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {copiedOtp && (
                  <p className="text-[10px] text-emerald-700 text-right">OTP copied!</p>
                )}

                {/* Rider info */}
                <div className="flex items-center gap-2 pt-0.5 text-xs text-[#5C4033]">
                  <Truck className="w-3.5 h-3.5 text-[#C58940] shrink-0" />
                  <div>
                    <span className="text-[#241510]">Courier: {createdOrder.deliveryPartner.name}</span>
                    <span className="text-[10px] text-[#8C766B] font-mono block">{createdOrder.deliveryPartner.vehicleNumber}</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Notification Action Link */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-emerald-950 block">WhatsApp Updates</span>
                    <span className="text-[11px] text-emerald-800">Receive live dispatch tracking directly on WhatsApp</span>
                  </div>
                </div>

                <a
                  id="btn-whatsapp-order-confirm"
                  href={getWhatsAppOrderLink(createdOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <span>Open WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  id="btn-track-new-order"
                  onClick={() => {
                    onClose();
                    onOrderSuccess(createdOrder);
                  }}
                  className="w-full py-3 rounded-full font-medium bg-[#241510] hover:bg-[#3D2317] text-white text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Truck className="w-4 h-4 text-[#C58940]" />
                  <span>Track Live Delivery</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
