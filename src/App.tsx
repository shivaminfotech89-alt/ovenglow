/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { ShopView } from './components/ShopView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { SignatureView } from './components/SignatureView';
import { AdminApp } from './components/admin/AdminApp';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Footer } from './components/Footer';
import { Product, Order } from './types';

function AppContent() {
  const { 
    activeTab,
    setActiveTab,
    isCustomerAuthOpen,
    setIsCustomerAuthOpen,
  } = useStore();
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const handleOrderSuccess = (_order: Order) => {
    // createOrder already put this order on the tracking page; there is no
    // lookup to do, and the customer should not have to prove ownership of an
    // order they placed thirty seconds ago.
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#241510] selection:bg-[#C58940] selection:text-white font-sans">
      {/* Sticky Global Navigation */}
      <Navbar />

      {/* The clearance for the fixed mobile tab bar belongs on the footer, the
          last thing on the page, not here: with it on main the bar still sat
          over the footer's final row, and a 56px gap opened above the footer
          for no reason. */}
      <main className="relative flex-1 overflow-hidden">
        {/* Light atmospheric oven glow in background of hero page */}
        {activeTab === 'shop' && (
          <div 
            aria-hidden="true" 
            className="absolute inset-x-0 top-0 h-[720px] pointer-events-none overflow-hidden select-none z-0"
          >
            {/* Broad gentle warm hearth aura */}
            <div 
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] max-w-[140vw] h-[600px] rounded-full blur-3xl opacity-75 animate-oven-glow"
              style={{
                background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 153, 51, 0.14) 0%, rgba(229, 169, 60, 0.08) 42%, rgba(245, 158, 11, 0.03) 65%, transparent 80%)'
              }}
            />
            {/* Soft amber glow accentuating the deck oven side */}
            <div 
              className="absolute top-8 right-[4%] sm:right-[10%] w-[460px] h-[460px] rounded-full blur-3xl opacity-65"
              style={{
                background: 'radial-gradient(circle at center, rgba(255, 122, 24, 0.14) 0%, rgba(229, 169, 60, 0.07) 48%, transparent 75%)'
              }}
            />
          </div>
        )}

        {activeTab === 'shop' && (
          <ShopView onOpenProductDetails={(prod) => setSelectedProductForModal(prod)} />
        )}

        {activeTab === 'signature' && (
          <SignatureView onOpenProductDetails={(prod) => setSelectedProductForModal(prod)} />
        )}

        {activeTab === 'track' && (
          <OrderTrackingView />
        )}

        {activeTab === 'admin' && (
          <AdminApp />
        )}
      </main>

      {/* Global Modals & Drawers */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
      />

      <ProductDetailModal
        key={selectedProductForModal?.id ?? 'none'}
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
