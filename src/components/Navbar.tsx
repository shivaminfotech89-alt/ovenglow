import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupees } from '../lib/pricing';
import { OvenglowLogo } from './OvenglowLogo';
import { 
  ShoppingBag, 
  Truck, 
  MapPin, 
  MessageSquare, 
  X, 
  Store,
  ShieldCheck,
  Sparkles,
  Search,
  User
} from 'lucide-react';

type MobileTabId = 'shop' | 'signature' | 'track' | 'account' | 'admin';

/**
 * What a customer sees along the bottom of a phone.
 *
 * Staff is deliberately absent. The shop asked for the admin not to be
 * advertised on the storefront, and a customer has no use for it. Reaching it
 * is covered below; a signed-in staff member gets a Console tab appended.
 */
const MOBILE_TABS: {
  id: MobileTabId;
  label: string;
  icon: typeof Store;
}[] = [
  { id: 'shop', label: 'Menu', icon: Store },
  { id: 'signature', label: 'Signature', icon: Sparkles },
  { id: 'track', label: 'Track', icon: Truck },
  { id: 'account', label: 'Account', icon: User },
];

const CONSOLE_TAB = { id: 'admin' as MobileTabId, label: 'Console', icon: ShieldCheck };

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    cart, 
    setIsCartOpen, 
    deliveryPincode, 
    setDeliveryPincode,
    getWhatsAppSupportLink,
    currentStaff,
    customerUser,
    setIsCustomerAuthOpen,
    searchQuery,
    setSearchQuery,
    coupons,
    storeSettings
  } = useStore();

  // The banner advertises a real, live code or nothing at all.
  const featuredCoupon =
    coupons.find(
      (c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt).getTime() > Date.now()),
    ) ?? null;

  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [customPin, setCustomPin] = useState('');

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);


  const handleApplyPincode = (area: string, pin: string) => {
    setDeliveryPincode(`${area} ${pin}`.trim());
    setCustomPin('');
    setIsPincodeModalOpen(false);
  };

  // Just the area for the chip; the pin is detail the header does not need.
  const deliveryArea = deliveryPincode.replace(/\s*\d{6}\s*$/, '').trim() || deliveryPincode;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== 'shop') {
      setActiveTab('shop');
    }
    document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#EBE3DA] shadow-[0_2px_8px_rgba(36,21,16,0.03)] transition-all">
        {/* Sleek Minimal Top Announcement Bar */}
        <div className="bg-[#241510] py-1.5 px-4 text-center text-[11px] font-normal text-[#E8DFD8] flex items-center justify-center gap-2 tracking-wide">
          <span>
            Free delivery on orders over{' '}
            <span className="tabular-nums">
              {formatRupees(storeSettings.freeDeliveryThreshold)}
            </span>
          </span>
          {featuredCoupon && (
            <>
              <span className="hidden sm:inline text-[#C58940]">•</span>
              <span className="hidden sm:inline">
                Use code{' '}
                <strong className="text-white font-medium">{featuredCoupon.code}</strong>{' '}
                for{' '}
                {featuredCoupon.discountType === 'percentage'
                  ? `${featuredCoupon.discountValue}% off`
                  : `₹${featuredCoupon.discountValue} off`}
              </span>
            </>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left: Brand Logo & Pincode */}
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <OvenglowLogo 
              size="sm" 
              onClick={() => {
                setActiveTab('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />

            {/* Location Delivery Selector (India) */}
            <button
              onClick={() => setIsPincodeModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#E8DFD8] text-xs text-[#5C4033] transition-colors shrink-0"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#C58940]" />
              <span className="max-w-[9rem] truncate font-medium text-[#241510]">
                {deliveryArea || 'Set your area'}
              </span>
            </button>
          </div>

          {/* Center: SHIFTED SEARCH BAR ON TOP BAR (Desktop & Tablet) */}
          <div className="relative mx-2 hidden min-w-[9rem] max-w-xs flex-1 md:flex xl:max-w-sm">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-3.5 h-3.5 text-[#9E8B80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="topbar-search-input"
                placeholder="Search the menu"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (activeTab !== 'shop' && val.trim().length > 0) {
                    setActiveTab('shop');
                  }
                }}
                className="w-full pl-9 pr-8 py-2 rounded-full bg-[#FAF7F2] hover:bg-white focus:bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs font-medium placeholder:text-[#9E8B80] focus:outline-none transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#8C766B] hover:text-[#241510] rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Right: Navigation Links & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Desktop Nav Links */}
            <nav className="hidden xl:flex items-center gap-1">
              <button
                id="nav-btn-shop"
                onClick={() => setActiveTab('shop')}
                className={`text-xs font-medium tracking-wide px-3 py-1.5 rounded-full transition-all ${
                  activeTab === 'shop'
                    ? 'bg-[#241510] text-white'
                    : 'text-[#5C4033] hover:text-[#241510] hover:bg-[#FAF7F2]'
                }`}
              >
                Shop
              </button>

              <button
                id="nav-btn-signature"
                onClick={() => setActiveTab('signature')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-all ${
                  activeTab === 'signature'
                    ? 'bg-[#241510] text-white'
                    : 'text-[#5C4033] hover:bg-[#FAF7F2] hover:text-[#241510]'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Signature</span>
              </button>

              <button
                id="nav-btn-track"
                onClick={() => setActiveTab('track')}
                className={`text-xs font-medium tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                  activeTab === 'track'
                    ? 'bg-[#241510] text-white'
                    : 'text-[#5C4033] hover:text-[#241510] hover:bg-[#FAF7F2]'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </button>

              {/* Not advertised to customers. Staff reach the sign-in screen
                  by its own address (see ADMIN_HASH in StoreContext); once
                  signed in, this is how they get back to it. */}
              {currentStaff && (
                <button
                  id="nav-btn-admin"
                  onClick={() => setActiveTab('admin')}
                  className={`text-xs font-medium tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                    activeTab === 'admin'
                      ? 'bg-[#241510] text-[#E5A93C] ring-1 ring-[#C58940]'
                      : 'bg-[#FAF7F2] text-[#241510] border border-[#C58940]/40 hover:bg-[#F2ECE4]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">Console</span>
                </button>
              )}
            </nav>
            
            {/* Customer account pill */}
            <button
              id="nav-btn-customer-account"
              onClick={() => setIsCustomerAuthOpen(true)}
              className="hidden min-h-10 sm:flex items-center gap-1.5 rounded-full border border-[#E8DFD8] bg-[#FAF7F2] px-3 text-xs text-[#241510] transition-all hover:bg-[#F2ECE4]"
              title={customerUser ? 'Your account and orders' : 'Sign in to keep your orders and address'}
            >
              {customerUser ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-[#241510] text-[#E5A93C] text-[10px] flex items-center justify-center font-bold">
                    {customerUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-[#241510] max-w-[85px] truncate hidden sm:inline">
                    {customerUser.name.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-[#C58940]" />
                  <span className="font-medium text-xs hidden sm:inline">Sign In</span>
                </>
              )}
            </button>

            {/* WhatsApp */}
            <a
              href={getWhatsAppSupportLink('Order enquiry')}
              target="_blank"
              rel="noopener noreferrer"
              title="Message us on WhatsApp"
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#25D366] transition-colors hover:bg-emerald-50"
            >
              <MessageSquare className="w-4 h-4" />
            </a>

            {/* Cart */}
            <button
              id="nav-btn-open-cart"
              onClick={() => setIsCartOpen(true)}
              className="relative flex min-h-11 items-center gap-1.5 rounded-full bg-[#241510] px-3.5 text-xs font-medium text-white shadow-xs transition-all hover:bg-[#3D2317] active:scale-95"
            >
              <ShoppingBag className="h-4 w-4 text-[#E5A93C]" />
              <span className="hidden sm:inline">Bag</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {totalCartCount}
              </span>
              {totalCartAmount > 0 && (
                <span className="font-mono text-xs font-normal border-l border-white/20 pl-1.5 hidden md:inline">
                  {formatRupees(totalCartAmount)}
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Top Bar Search Row (< md) */}
        <div className="md:hidden px-4 pb-2.5 pt-0.5 border-t border-[#F2ECE4]/60">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#9E8B80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="mobile-topbar-search-input"
              placeholder="Search cakes, cookies, brownies…"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (activeTab !== 'shop' && val.trim().length > 0) {
                  setActiveTab('shop');
                }
              }}
              className="w-full pl-9 pr-8 py-1.5 rounded-full bg-[#FAF7F2] focus:bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs font-medium placeholder:text-[#9E8B80] focus:outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8C766B] hover:text-[#241510] rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

      </header>


      {/*
        The delivery-area picker.

        It used to live inside <header>, which has `backdrop-blur-md`. A
        backdrop-filter makes an element a containing block for its
        position: fixed descendants, so `inset-0` resolved against the header's
        hundred-pixel box rather than the viewport: the dialog centred itself
        inside the header, clipped its own top off, and sat across the logo.
        Moving it out of the header is the whole fix.
      */}
      {isPincodeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-area-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPincodeModalOpen(false);
          }}
        >
          {/* max-h + overflow so a long list of areas scrolls inside the card
              instead of running off the screen on a short phone. */}
          <div className="relative max-h-[85vh] w-full max-w-sm space-y-3 overflow-y-auto rounded-2xl border border-[#E8DFD8] bg-white p-5 text-[#241510] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <h4
                id="delivery-area-title"
                className="flex items-center gap-2 font-serif text-base font-bold text-[#241510]"
              >
                <MapPin className="h-4 w-4 text-[#C58940]" />
                Where are we delivering?
              </h4>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsPincodeModalOpen(false)}
                className="rounded-full p-1 text-[#8C766B] hover:text-[#241510]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* The old copy promised temperature-controlled shipping across
                India. The shop bakes in one city and delivers by its own rider;
                the areas below are the ones it actually covers, set in Settings. */}
            <p className="text-xs text-[#8C766B]">
              We bake and deliver across {storeSettings.city}. Pick your area so we can
              check we reach you.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {storeSettings.deliveryAreas.map((area) => (
                <button
                  key={`${area.name}-${area.pin}`}
                  type="button"
                  onClick={() => handleApplyPincode(area.name, area.pin)}
                  className="rounded-xl border border-[#E8DFD8] bg-[#FAF7F2] p-2.5 text-left text-xs transition-colors hover:border-[#C58940] hover:bg-white"
                >
                  <span className="block font-medium text-[#241510]">{area.name}</span>
                  <span className="font-mono text-[10px] tabular-nums text-[#8C766B]">
                    {area.pin}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t border-[#F0EAE1] pt-2">
              <label
                htmlFor="delivery-pin-input"
                className="mb-1 block text-[11px] font-medium text-[#8C766B]"
              >
                Somewhere else in {storeSettings.city}? Enter your 6-digit PIN
              </label>
              <div className="flex gap-2">
                <input
                  id="delivery-pin-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="380054"
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 rounded-lg border border-[#E8DFD8] bg-[#FAF7F2] px-3 py-1.5 font-mono text-xs tabular-nums text-[#241510] focus:border-[#241510] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={customPin.length !== 6}
                  onClick={() => handleApplyPincode(storeSettings.city, customPin)}
                  className="rounded-lg bg-[#241510] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#3D2317] disabled:opacity-40"
                >
                  Set
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-[#A69286]">
                Outside our area we will say so on WhatsApp before you pay.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile tab bar. Heights are 56px with a 44px minimum touch area, and
          the bar pads itself past the iPhone home indicator. The Console tab
          appears only once someone is signed in. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EBE3DA] bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.04)] lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {(currentStaff ? [...MOBILE_TABS, CONSOLE_TAB] : MOBILE_TABS).map((tab) => {
            const isActive =
              tab.id === 'account' ? false : activeTab === tab.id;
            const Icon = tab.icon;
            const label =
              tab.id === 'account' ? (customerUser ? 'Account' : 'Sign In') : tab.label;

            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (tab.id === 'account') {
                    setIsCustomerAuthOpen(true);
                    return;
                  }
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] leading-none transition-colors ${
                  isActive ? 'font-semibold text-[#241510]' : 'font-normal text-[#8C766B]'
                }`}
              >
                {tab.id === 'account' && customerUser ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#241510] text-[10px] font-bold text-[#E5A93C]">
                    {customerUser.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <Icon
                    className={`h-5 w-5 ${
                      isActive
                        ? 'text-[#C58940]'
                        : tab.id === 'admin'
                          ? 'text-emerald-600'
                          : 'text-[#8C766B]'
                    }`}
                  />
                )}
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
