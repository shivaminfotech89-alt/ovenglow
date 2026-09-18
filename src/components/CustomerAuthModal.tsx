import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupees } from '../lib/pricing';
import { STAGES } from '../lib/orderStages';
import { 
  X, 
  Phone, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  LogOut, 
  Package, 
  Lock,
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  messageNotice?: string;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  messageNotice
}) => {
  const { 
    customerUser, 
    loginWithMobile, 
    logoutCustomer, 
    updateCustomerProfile,
    orders,
    setActiveTab,
    setActiveTrackingId,
    storeSettings
  } = useStore();

  const [phone, setPhone] = useState(customerUser?.phone || '');
  const [name, setName] = useState(customerUser?.name || '');
  const [address, setAddress] = useState(customerUser?.address || '');
  const [pincode, setPincode] = useState(customerUser?.pincode || storeSettings.pincode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!isOpen) return null;

  // Filter orders placed by this customer (if logged in)
  const myOrders = customerUser 
    ? orders.filter(o => o.customer.phone.replace(/\D/g, '').includes(customerUser.phone))
    : [];

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    const res = loginWithMobile(cleanPhone, name, address, pincode || storeSettings.pincode);
    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleSaveProfileUpdates = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerUser) {
      updateCustomerProfile({
        name,
        address,
        pincode
      });
      setIsEditingProfile(false);
    }
  };

  return (
    <div 
      id="customer-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#FAF7F2] border border-[#E8DFD8] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E8DFD8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#241510] text-[#E5A93C] flex items-center justify-center font-serif font-bold text-base shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#241510]">
                {customerUser ? 'Customer Account' : 'Customer Sign In'}
              </h3>
              <p className="text-[11px] text-[#8C766B]">
                {customerUser 
                  ? 'Manage your confections delivery profile' 
                  : `Direct mobile sign-in • ${storeSettings.city} delivery`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#8C766B] hover:text-[#241510] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {messageNotice && !customerUser && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C58940] shrink-0 mt-0.5" />
              <span>{messageNotice}</span>
            </div>
          )}

          {customerUser ? (
            /* VIEW A: LOGGED IN CUSTOMER DASHBOARD */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white border border-[#E8DFD8] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified Customer
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs text-[#C58940] hover:underline font-medium"
                  >
                    {isEditingProfile ? 'Cancel Edit' : 'Edit Details'}
                  </button>
                </div>

                {!isEditingProfile ? (
                  <div className="space-y-1.5 text-xs text-[#5C4033]">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#241510]">
                      <User className="w-3.5 h-3.5 text-[#C58940]" />
                      <span>{customerUser.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[#241510]">
                      <Phone className="w-3.5 h-3.5 text-[#8C766B]" />
                      <span>+91 {customerUser.phone}</span>
                    </div>
                    {customerUser.address && (
                      <div className="flex items-start gap-2 text-[#5C4033] pt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#8C766B] shrink-0 mt-0.5" />
                        <span>{customerUser.address}, {customerUser.pincode || storeSettings.pincode} ({storeSettings.city})</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfileUpdates} className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-medium text-[#5C4033] block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#241510] focus:outline-none focus:border-[#241510]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#5C4033] block mb-1">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        placeholder="House/Apartment, Street, Area"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#241510] focus:outline-none focus:border-[#241510]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#5C4033] block mb-1">
                        {storeSettings.city} Pincode
                      </label>
                      <input
                        type="text"
                        placeholder={storeSettings.pincode}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-xs font-mono text-[#241510] focus:outline-none focus:border-[#241510]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-[#241510] text-white text-xs font-medium"
                    >
                      Save Profile Updates
                    </button>
                  </form>
                )}
              </div>

              {/* Order history summary */}
              {myOrders.length > 0 && (
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] space-y-2">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C766B]">
                    Your Active Confection Orders ({myOrders.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {myOrders.map((ord) => (
                      <div 
                        key={ord.id}
                        onClick={() => {
                          setActiveTrackingId(ord.orderNumber);
                          setActiveTab('track');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E8DFD8] hover:border-[#C58940] cursor-pointer transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-[#C58940]" />
                          <span className="font-mono font-bold text-[#241510]">{ord.orderNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#5C4033]">
                            {STAGES[ord.stage].label}
                          </span>
                        </div>
                        <span className="font-bold text-[#241510]">{formatRupees(ord.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab('track');
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Track Delivery</span>
                </button>

                <button
                  onClick={() => {
                    logoutCustomer();
                  }}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 border border-[#E8DFD8] hover:border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* VIEW B: DIRECT LOGIN (NO OTP REQUIRED) */
            <form onSubmit={handleDirectLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[#5C4033] block mb-1">
                  Indian Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#241510]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98250 12345"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setErrorMessage(null);
                    }}
                    className="w-full pl-13 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs font-mono focus:outline-none placeholder:text-[#A69286]"
                  />
                </div>
                <p className="text-[10px] text-[#8C766B] mt-1">
                  Used by our kitchen and delivery rider to reach you about your order in {storeSettings.city}.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-[#5C4033] block mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C766B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs focus:outline-none placeholder:text-[#A69286]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#5C4033] block mb-1">
                  Delivery Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#8C766B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Flat / House No., Street, Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs focus:outline-none placeholder:text-[#A69286]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#5C4033] block mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder={storeSettings.pincode || "Enter 6-digit PIN"}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs font-mono focus:outline-none placeholder:text-[#A69286]"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-medium flex items-center justify-center gap-2 shadow-xs transition-colors active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 text-[#E5A93C]" />
                <span>Sign In & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Discreet Staff Console Access Link at Bottom */}
          <div className="pt-3 border-t border-[#E8DFD8] text-center">
            <button
              onClick={() => {
                onClose();
                setActiveTab('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[11px] text-[#8C766B] hover:text-[#C58940] transition-colors inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Ovenglow Team Staff? Executive Admin Portal</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
