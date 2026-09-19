import React from 'react';
import { OvenglowLogo } from './OvenglowLogo';
import { FssaiMark } from './FssaiMark';
import { useStore } from '../context/StoreContext';
import { PRODUCT_CATEGORIES } from '../types';
import { 
  ShieldCheck, 
  MessageSquare, 
  Truck, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Gift,
  Lock
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, setSelectedCategory, getWhatsAppSupportLink, setIsCustomerAuthOpen, storeSettings } =
    useStore();

  return (
    <footer className="w-full bg-[#241510] border-t border-[#3D2317] text-[#D4C5B9] text-xs mt-16">
      {/* Guarantees Row */}
      <div className="border-b border-[#3D2317] bg-[#1E110D] py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1B14] border border-[#4A2D22] flex items-center justify-center text-[#C58940] shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-medium text-white">Baked to order</span>
              <span className="text-[11px] text-[#A69286]">Never off the shelf</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1B14] border border-[#4A2D22] flex items-center justify-center text-[#C58940] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-medium text-white">Homemade goodness</span>
              <span className="text-[11px] text-[#A69286]">Small batches from our own kitchen</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1B14] border border-[#4A2D22] flex items-center justify-center text-[#C58940] shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-medium text-white">For every occasion</span>
              <span className="text-[11px] text-[#A69286]">Celebrations, gifting and everyday treats</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1B14] border border-[#4A2D22] flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-medium text-white">Order on WhatsApp</span>
              <span className="text-[11px] text-[#A69286]">Message us and track your order</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Brand Col */}
        <div className="lg:col-span-2 space-y-4">
          <div className="inline-block p-1.5 rounded-xl bg-[#FAF7F2]">
            <OvenglowLogo size="md" />
          </div>
          <p className="text-xs text-[#A69286] leading-relaxed max-w-sm">
            A home bakery in {storeSettings.city} baking cakes, cookies, brownies, cupcakes,
            muffins and cheesecakes to order, in small batches, from good ingredients.
          </p>
          <div className="pt-1">
            <a
              href={getWhatsAppSupportLink('General Inquiry')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-medium text-white transition-colors hover:bg-emerald-800"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message us on WhatsApp</span>
            </a>
          </div>

          {/* A licence is part of who the business is, so it sits with the name
              and the description rather than among the order links. */}
          <FssaiMark tone="dark" />
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C58940]">Our menu</span>
          <ul className="text-xs text-[#A69286]">
            {PRODUCT_CATEGORIES.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setSelectedCategory(c.id);
                    setActiveTab('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex min-h-8 items-center text-left transition-colors hover:text-white"
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tracking & Support */}
        <div className="space-y-3">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C58940]">Orders and help</span>
          <ul className="space-y-2 text-[#A69286] text-xs">
            <li><button onClick={() => setActiveTab('track')} className="inline-flex min-h-9 items-center transition-colors hover:text-white">Track your order</button></li>
            <li><button onClick={() => setIsCustomerAuthOpen(true)} className="inline-flex min-h-9 items-center transition-colors hover:text-white">Your account</button></li>
            <li className="flex"><a href={getWhatsAppSupportLink('Bulk Corporate Gifting')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center transition-colors hover:text-white">Corporate gifting</a></li>
            <li className="flex"><a href={getWhatsAppSupportLink('Custom Wedding Cakes')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center transition-colors hover:text-white">Event and wedding cakes</a></li>

          </ul>
        </div>

        {/* Contact info in India */}
        <div className="space-y-3">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C58940]">Find us</span>
          <div className="space-y-2 text-[#A69286] text-xs">
            <p className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#C58940] shrink-0 mt-0.5" />
              <span>
                {storeSettings.address
                  ? `${storeSettings.address}, ${storeSettings.city}${storeSettings.pincode ? ` ${storeSettings.pincode}` : ''}`
                  : `${storeSettings.city}, ${storeSettings.state}`}
              </span>
            </p>
            {storeSettings.phone && (
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0 text-[#C58940]" />
                <a href={`tel:${storeSettings.phone}`} className="tabular-nums transition-colors hover:text-white">
                  {storeSettings.phone}
                </a>
              </p>
            )}
            <p className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0 text-[#C58940]" />
              <span>{storeSettings.operatingHours || '10:00 AM – 11:00 PM, daily'}</span>
            </p>
            <div className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 text-[#C58940] shrink-0 mt-0.5" />
              <div className="space-y-1 font-mono text-[11px]">
                <a href={`mailto:${storeSettings.email || 'ovenglowdelights@gmail.com'}`} className="block hover:text-white text-gray-200 transition-colors">
                  {storeSettings.email || 'ovenglowdelights@gmail.com'}
                </a>
                <span className="block font-sans text-[10px] text-[#8C766B]">
                  Orders and enquiries
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Legal bar */}
      <div className="border-t border-[#3D2317] bg-[#1A0C08] px-4 pt-4 pb-[calc(1rem+3.5rem+env(safe-area-inset-bottom))] text-center text-xs text-[#8C766B] lg:pb-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {storeSettings.storeName}</span>
          <span className="flex items-center gap-1.5">
            Baked in small batches in {storeSettings.city}
          </span>
          <button
            onClick={() => {
              setActiveTab('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[#66493B] hover:text-[#C58940] transition-colors text-[11px] flex items-center gap-1 font-mono"
            title="Staff sign-in"
          >
            <Lock className="w-2.5 h-2.5" />
            <span>Staff sign-in</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
