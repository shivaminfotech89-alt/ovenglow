import React from 'react';
import { OvenglowLogo } from './OvenglowLogo';
import { useStore } from '../context/StoreContext';
import { 
  ShieldCheck, 
  MessageSquare, 
  Truck, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Lock
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, getWhatsAppSupportLink, setIsCustomerAuthOpen, storeSettings } = useStore();

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
              <span className="text-white font-medium block text-xs">Insulated Cold Chain</span>
              <span className="text-[11px] text-[#A69286]">Temperature-controlled thermal packaging</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1B14] border border-[#4A2D22] flex items-center justify-center text-[#C58940] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-medium block text-xs">Pure Cocoa Butter</span>
              <span className="text-[11px] text-[#A69286]">Zero compound fats or palm oils</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1B14] border border-[#4A2D22] flex items-center justify-center text-emerald-400 shrink-0">
              <div className="w-3.5 h-3.5 border border-emerald-400 rounded-xs flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-white font-medium block text-xs">100% Eggless Bakery</span>
              <span className="text-[11px] text-[#A69286]">Carefully prepared vegetarian confections</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1B14] border border-[#4A2D22] flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-medium block text-xs">WhatsApp Concierge</span>
              <span className="text-[11px] text-[#A69286]">Bespoke hampers & real-time updates</span>
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
            Ovenglow produces small-batch chocolates, deck-oven molten cakes, and festive celebratory confections with pure ingredients and traditional artisanal tempering.
          </p>
          <div className="pt-1">
            <a
              href={getWhatsAppSupportLink('General Inquiry')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Concierge</span>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <span className="text-[#C58940] font-medium uppercase tracking-wider text-xs block">Artisanal Menu</span>
          <ul className="space-y-2 text-[#A69286] text-xs">
            <li><button onClick={() => setActiveTab('shop')} className="hover:text-white transition-colors">Single Origin Bars</button></li>
            <li><button onClick={() => setActiveTab('shop')} className="hover:text-white transition-colors">Kashmiri Saffron Truffles</button></li>
            <li><button onClick={() => setActiveTab('shop')} className="hover:text-white transition-colors">Belgian Lava Cakes</button></li>
            <li><button onClick={() => setActiveTab('shop')} className="hover:text-white transition-colors">Festive Gift Hampers</button></li>
            <li><button onClick={() => setActiveTab('shop')} className="hover:text-white transition-colors">100% Eggless Specialties</button></li>
          </ul>
        </div>

        {/* Tracking & Support */}
        <div className="space-y-3">
          <span className="text-[#C58940] font-medium uppercase tracking-wider text-xs block">Support & Orders</span>
          <ul className="space-y-2 text-[#A69286] text-xs">
            <li><button onClick={() => setActiveTab('track')} className="hover:text-white transition-colors">Track Live Order</button></li>
            <li><button onClick={() => setIsCustomerAuthOpen(true)} className="hover:text-white transition-colors">Customer Account & Mobile Login</button></li>
            <li><a href={getWhatsAppSupportLink('Bulk Corporate Gifting')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Corporate Gifting</a></li>
            <li><a href={getWhatsAppSupportLink('Custom Wedding Cakes')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Event Confections</a></li>
            {storeSettings.fssaiLicense ? (
              <li><span className="text-[#8C766B]">FSSAI Lic. {storeSettings.fssaiLicense}</span></li>
            ) : (
              <li><span className="text-[#8C766B]">FSSAI Safety Standards Compliant</span></li>
            )}
          </ul>
        </div>

        {/* Contact info in India */}
        <div className="space-y-3">
          <span className="text-[#C58940] font-medium uppercase tracking-wider text-xs block">Atelier Contacts</span>
          <div className="space-y-2 text-[#A69286] text-xs">
            <p className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#C58940] shrink-0 mt-0.5" />
              <span>
                {storeSettings.address
                  ? `${storeSettings.address}, ${storeSettings.city}${storeSettings.pincode ? ` ${storeSettings.pincode}` : ''}`
                  : `${storeSettings.city}, ${storeSettings.state}`}
              </span>
            </p>
            {storeSettings.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C58940] shrink-0" />
                <span>{storeSettings.phone} {storeSettings.operatingHours ? `(${storeSettings.operatingHours})` : ''}</span>
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C58940] shrink-0" />
                <span>{storeSettings.operatingHours || '10:00 AM – 11:00 PM (Daily Fresh Baking)'}</span>
              </p>
            )}
            <div className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 text-[#C58940] shrink-0 mt-0.5" />
              <div className="space-y-1 font-mono text-[11px]">
                <a href={`mailto:${storeSettings.email || 'ovenglowdelights@gmail.com'}`} className="block hover:text-white text-gray-200 transition-colors">
                  {storeSettings.email || 'ovenglowdelights@gmail.com'}
                </a>
                <span className="text-[10px] font-sans text-[#8C766B] block">
                  Atelier & Customer Inquiries
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Legal bar */}
      <div className="border-t border-[#3D2317] bg-[#1A0C08] py-4 px-4 text-center text-[#8C766B] text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Ovenglow Delights Pvt. Ltd.</span>
          <span className="flex items-center gap-1.5">
            Crafted for small-batch confectionery enthusiasts
          </span>
          <button
            onClick={() => {
              setActiveTab('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[#66493B] hover:text-[#C58940] transition-colors text-[11px] flex items-center gap-1 font-mono"
            title="Ovenglow Executive Console"
          >
            <Lock className="w-2.5 h-2.5" />
            <span>Staff Console</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
