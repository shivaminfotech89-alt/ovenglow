import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { OvenglowLogo } from './OvenglowLogo';
import { 
  ShoppingBag, 
  Truck, 
  MapPin, 
  MessageSquare, 
  X, 
  Store,
  ShieldCheck,
  Phone,
  Search
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    cart, 
    setIsCartOpen, 
    isVegOnly, 
    setIsVegOnly, 
    deliveryPincode, 
    setDeliveryPincode,
    getWhatsAppSupportLink,
    ownerUser,
    customerUser,
    setIsCustomerAuthOpen,
    searchQuery,
    setSearchQuery
  } = useStore();

  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [customPin, setCustomPin] = useState('');

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const indianCities = [
    { name: 'Ahmedabad', pin: '380054' },
    { name: 'Mumbai', pin: '400001' },
    { name: 'Bengaluru', pin: '560001' },
    { name: 'New Delhi', pin: '110001' },
    { name: 'Pune', pin: '411001' },
    { name: 'Hyderabad', pin: '500001' },
  ];

  const handleApplyPincode = (city: string, pin: string) => {
    setDeliveryPincode(`${pin} - ${city}`);
    setIsPincodeModalOpen(false);
  };

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
          <span>Complimentary express cold-chain delivery on orders over ₹499</span>
          <span className="hidden sm:inline text-[#C58940]">•</span>
          <span className="hidden sm:inline">Use code <strong className="text-white font-medium">GLOW10</strong> for 10% off</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left: Brand Logo & Pincode */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
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
              <MapPin className="w-3.5 h-3.5 text-[#C58940]" />
              <span className="text-[#8C766B] font-normal">Deliver to:</span>
              <span className="font-medium text-[#241510] truncate max-w-[120px]">{deliveryPincode}</span>
            </button>
          </div>

          {/* Center: SHIFTED SEARCH BAR ON TOP BAR (Desktop & Tablet) */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-2 relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-3.5 h-3.5 text-[#9E8B80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="topbar-search-input"
                placeholder="Search chocolates, cakes, truffles..."
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
                Confections
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

              {/* Owner Portal: only rendered when owner is authenticated */}
              {ownerUser && (
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
            
            {/* Pure Veg Switch */}
            <button 
              onClick={() => setIsVegOnly(!isVegOnly)}
              title="Filter 100% Eggless / Vegetarian only"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all border ${
                isVegOnly 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium' 
                  : 'bg-white border-[#E8DFD8] text-[#8C766B] hover:border-[#241510]'
              }`}
            >
              <div className="w-3 h-3 border border-emerald-600 rounded-xs flex items-center justify-center">
                <div className={`w-1.5 h-1.5 rounded-full ${isVegOnly ? 'bg-emerald-600' : 'bg-transparent'}`} />
              </div>
              <span className="text-[11px] font-medium hidden sm:inline">Veg Only</span>
            </button>

            {/* Customer Mobile Login / Profile Pill */}
            <button
              id="nav-btn-customer-account"
              onClick={() => setIsCustomerAuthOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#E8DFD8] text-xs transition-all text-[#241510]"
              title={customerUser ? 'Customer Account & Orders' : 'Sign in with Mobile Number'}
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
                  <Phone className="w-3.5 h-3.5 text-[#C58940]" />
                  <span className="font-medium text-xs hidden sm:inline">Sign In</span>
                </>
              )}
            </button>

            {/* WhatsApp Concierge */}
            <a
              href={getWhatsAppSupportLink('Bakery Concierge')}
              target="_blank"
              rel="noopener noreferrer"
              title="Concierge Support"
              className="p-2 rounded-full text-[#25D366] hover:bg-emerald-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </a>

            {/* Refined Luxury Cart Trigger */}
            <button
              id="nav-btn-open-cart"
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 sm:px-3.5 py-1.5 bg-[#241510] hover:bg-[#3D2317] text-white rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span className="hidden sm:inline">Bag</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {totalCartCount}
              </span>
              {totalCartAmount > 0 && (
                <span className="font-mono text-xs font-normal border-l border-white/20 pl-1.5 hidden md:inline">
                  ₹{totalCartAmount}
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
              placeholder="Search chocolates, cakes, truffles..."
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

        {/* Indian Delivery Pincode Modal */}
        {isPincodeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="relative w-full max-w-sm bg-white border border-[#E8DFD8] rounded-2xl p-5 shadow-xl space-y-3 text-[#241510]">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
                <h4 className="font-serif font-bold text-[#241510] text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C58940]" />
                  Select Delivery City
                </h4>
                <button
                  onClick={() => setIsPincodeModalOpen(false)}
                  className="p-1 rounded-full text-[#8C766B] hover:text-[#241510]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#8C766B]">
                Shipped with temperature-controlled ice gel packs across India.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {indianCities.map((c) => (
                  <button
                    key={c.pin}
                    onClick={() => handleApplyPincode(c.name, c.pin)}
                    className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] hover:border-[#C58940] hover:bg-white text-left text-xs transition-colors"
                  >
                    <span className="font-medium text-[#241510] block">{c.name}</span>
                    <span className="text-[10px] font-mono text-[#8C766B]">{c.pin}</span>
                  </button>
                ))}
              </div>

              {/* Custom PIN Code */}
              <div className="pt-2 border-t border-[#F0EAE1]">
                <label className="text-[11px] font-medium text-[#8C766B] block mb-1">Or enter 6-digit Indian PIN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit PIN"
                    value={customPin}
                    onChange={(e) => setCustomPin(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] text-xs font-mono focus:outline-none focus:border-[#241510]"
                  />
                  <button
                    onClick={() => {
                      if (customPin.length === 6) {
                        handleApplyPincode('Express', customPin);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-medium shadow-xs"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Elegant Native-Feeling Bottom Bar on Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EBE3DA] px-6 py-2 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => {
            setActiveTab('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[11px] transition-colors ${
            activeTab === 'shop' ? 'text-[#241510] font-semibold' : 'text-[#8C766B] font-normal'
          }`}
        >
          <Store className={`w-4 h-4 ${activeTab === 'shop' ? 'text-[#C58940]' : 'text-[#8C766B]'}`} />
          <span>Shop</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('track');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[11px] transition-colors ${
            activeTab === 'track' ? 'text-[#241510] font-semibold' : 'text-[#8C766B] font-normal'
          }`}
        >
          <Truck className={`w-4 h-4 ${activeTab === 'track' ? 'text-[#C58940]' : 'text-[#8C766B]'}`} />
          <span>Track</span>
        </button>

        {ownerUser ? (
          <button
            onClick={() => {
              setActiveTab('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[11px] transition-colors ${
              activeTab === 'admin' ? 'text-[#241510] font-semibold' : 'text-[#8C766B] font-normal'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'admin' ? 'text-[#C58940]' : 'text-emerald-600'}`} />
            <span>Console</span>
          </button>
        ) : (
          <button
            onClick={() => setIsCustomerAuthOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[11px] text-[#8C766B] hover:text-[#241510] transition-colors"
          >
            {customerUser ? (
              <div className="w-4 h-4 rounded-full bg-[#241510] text-[#E5A93C] text-[9px] flex items-center justify-center font-bold">
                {customerUser.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Phone className="w-4 h-4 text-[#C58940]" />
            )}
            <span>{customerUser ? 'Account' : 'Sign In'}</span>
          </button>
        )}
      </div>
    </>
  );
};
