import React, { useState } from 'react';
import {
  X,
  Phone,
  User,
  MapPin,
  LogOut,
  Package,
  Mail,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  messageNotice?: string;
}

/** The Google "G", drawn rather than loaded, so it needs no network request. */
const GoogleMark: React.FC = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.4-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4z" />
    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

/**
 * Signing in, and the account behind it.
 *
 * What this replaces: a box that asked for a mobile number, believed it, wrote
 * it to this browser and printed "Verified Customer" above it. Nothing was
 * checked. That is why the old version could not show anyone their past orders
 * -- a typed phone number is not proof, and building an order history on one
 * would have meant handing a stranger somebody's address for the price of
 * guessing their number.
 *
 * Google or an email and password are proof, and Firebase carries that proof
 * into the security rules, so the order history below is the real thing: it
 * survives signing out, and it follows the account onto a new phone.
 *
 * Signing in is never required to buy something. Checkout works for a guest
 * exactly as it did, and their order is found with its number and their phone.
 */
export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  messageNotice,
}) => {
  const {
    customerUser,
    isCustomerSignedIn,
    signInCustomerWithGoogle,
    signInCustomerWithEmail,
    registerCustomer,
    sendCustomerPasswordReset,
    logoutCustomer,
    updateCustomerProfile,
    myOrders,
    setActiveTab,
    storeSettings,
  } = useStore();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(customerUser?.phone ?? '');
  const [name, setName] = useState(customerUser?.name ?? '');
  const [address, setAddress] = useState(customerUser?.address ?? '');
  const [pincode, setPincode] = useState(customerUser?.pincode ?? storeSettings.pincode);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!isOpen) return null;

  const run = async (work: () => Promise<{ success: boolean; message: string }>) => {
    setBusy(true);
    setNotice(null);
    const res = await work();
    setBusy(false);
    if (res.success) {
      onSuccess?.();
      onClose();
    } else {
      setNotice({ ok: false, text: res.message });
    }
  };

  const submitEmailForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register') {
      if (!name.trim()) {
        setNotice({ ok: false, text: 'Please enter your name.' });
        return;
      }
      void run(async () => {
        const res = await registerCustomer(name, email, password);
        if (res.success) await updateCustomerProfile({ name: name.trim() });
        return res;
      });
      return;
    }
    void run(() => signInCustomerWithEmail(email, password));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await updateCustomerProfile({ name, phone, address, pincode });
    setBusy(false);
    setIsEditingProfile(false);
    setNotice({ ok: true, text: 'Saved to your account.' });
  };

  const fieldClass =
    'w-full rounded-xl border border-[#E8DFD8] bg-white px-3.5 py-2.5 text-xs text-[#241510] placeholder:text-[#A69286] focus:border-[#241510] focus:outline-none';

  return (
    <div
      id="customer-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E8DFD8] bg-[#FAF7F2] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E8DFD8] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#241510] text-[#E5A93C] shadow-xs">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#241510]">
                {isCustomerSignedIn ? 'Your account' : 'Sign in'}
              </h3>
              <p className="text-[11px] text-[#8C766B]">
                {isCustomerSignedIn
                  ? 'Your details and your orders'
                  : 'So your orders and address are here next time'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#8C766B] transition-colors hover:bg-[#FAF7F2] hover:text-[#241510]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {messageNotice && !isCustomerSignedIn && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C58940]" />
              <span>{messageNotice}</span>
            </div>
          )}

          {notice && (
            <p
              className={`rounded-xl border px-3 py-2 text-[11px] ${
                notice.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {notice.text}
            </p>
          )}

          {isCustomerSignedIn && customerUser ? (
            <div className="space-y-4">
              <div className="space-y-3 rounded-xl border border-[#E8DFD8] bg-white p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    Signed in
                  </span>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs font-medium text-[#C58940] hover:underline"
                  >
                    {isEditingProfile ? 'Cancel' : 'Edit details'}
                  </button>
                </div>

                {!isEditingProfile ? (
                  <div className="space-y-1.5 text-xs text-[#5C4033]">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#241510]">
                      <User className="h-3.5 w-3.5 text-[#C58940]" />
                      <span>{customerUser.name}</span>
                    </div>
                    {customerUser.email && (
                      <div className="flex items-center gap-2 break-all">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-[#8C766B]" />
                        <span>{customerUser.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-mono text-[#241510]">
                      <Phone className="h-3.5 w-3.5 text-[#8C766B]" />
                      <span>{customerUser.phone ? `+91 ${customerUser.phone}` : 'No mobile yet'}</span>
                    </div>
                    {customerUser.address && (
                      <div className="flex items-start gap-2 pt-1">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8C766B]" />
                        <span>
                          {customerUser.address}, {customerUser.pincode || storeSettings.pincode} (
                          {customerUser.city || storeSettings.city})
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={saveProfile} className="space-y-2.5 pt-1">
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className={fieldClass}
                    />
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Mobile number"
                      className={`${fieldClass} font-mono`}
                    />
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Flat / house no., street, area"
                      className={fieldClass}
                    />
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder={storeSettings.pincode || 'PIN code'}
                      className={`${fieldClass} font-mono`}
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full rounded-xl bg-[#241510] py-2 text-xs font-medium text-white disabled:opacity-60"
                    >
                      {busy ? 'Saving…' : 'Save to my account'}
                    </button>
                  </form>
                )}
              </div>

              <button
                type="button"
                id="btn-account-orders"
                onClick={() => {
                  setActiveTab('track');
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#E8DFD8] bg-[#FAF7F2] p-3 text-left text-xs transition-colors hover:border-[#C58940]"
              >
                <span className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-[#C58940]" />
                  <span className="font-medium text-[#241510]">Your orders</span>
                </span>
                <span className="text-[10px] tabular-nums text-[#8C766B]">
                  {myOrders.length === 0
                    ? 'None yet'
                    : `${myOrders.length} order${myOrders.length === 1 ? '' : 's'}`}
                </span>
              </button>

              <button
                onClick={() => void logoutCustomer()}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E8DFD8] bg-white px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:border-rose-200 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <button
                type="button"
                id="btn-customer-google"
                disabled={busy}
                onClick={() => void run(signInCustomerWithGoogle)}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#E8DFD8] bg-white py-2.5 text-xs font-semibold text-[#241510] shadow-xs transition-colors hover:border-[#8C766B] disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[#E8DFD8]" />
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#A69286]">or</span>
                <span className="h-px flex-1 bg-[#E8DFD8]" />
              </div>

              <form onSubmit={submitEmailForm} className="space-y-2.5">
                {mode === 'register' && (
                  <input
                    id="customer-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className={fieldClass}
                  />
                )}
                <input
                  id="customer-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className={fieldClass}
                />
                <input
                  id="customer-password"
                  type="password"
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Choose a password' : 'Password'}
                  className={fieldClass}
                />
                <button
                  type="submit"
                  id="btn-customer-email-submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#241510] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#3D2317] disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {mode === 'register' ? 'Create my account' : 'Sign in'}
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'register' : 'signin');
                    setNotice(null);
                  }}
                  className="font-medium text-[#C58940] hover:underline"
                >
                  {mode === 'signin' ? 'Create an account' : 'I already have an account'}
                </button>

                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await sendCustomerPasswordReset(email);
                      setNotice({ ok: res.success, text: res.message });
                    }}
                    className="text-[#8C766B] hover:text-[#241510] hover:underline"
                  >
                    Forgotten your password?
                  </button>
                )}
              </div>

              {/*
                Said plainly, because the alternative is someone abandoning a
                cake order at a sign-up form. An account is a convenience --
                your address and your past orders kept for you -- not a gate.
              */}
              <p className="rounded-xl border border-[#E8DFD8] bg-white px-3 py-2 text-[11px] leading-relaxed text-[#6B574E]">
                You do not need an account to order. Checkout works without one, and you can
                track that order with its number and your mobile number.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
