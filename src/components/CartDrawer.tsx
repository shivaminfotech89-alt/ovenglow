import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductImage } from './ProductImage';
import { formatRupees } from '../lib/pricing';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  Truck, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    activeCoupon,
    applyCoupon,
    removeCoupon,
    totals,
    storeSettings,
    coupons
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  // Only ever suggest a code that actually works today.
  const exampleCoupon =
    coupons.find(
      (c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt).getTime() > Date.now()),
    )?.code ?? null;
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isCartOpen) return null;

  // Every total comes from the one pricing function, so the drawer, the checkout
  // screen and the stored order can never disagree.
  const { itemTotal, discount, deliveryFee, tax, isFreeDelivery, freeDeliveryShortfall } = totals;
  const finalTotal = totals.total;
  const freeDeliveryThreshold = storeSettings.freeDeliveryThreshold;
  const amountNeededForFreeDelivery = freeDeliveryShortfall;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
    if (res.success) setCouponInput('');
  };

  return (
    <div 
      id="cart-drawer-overlay"
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity"
      onClick={() => setIsCartOpen(false)}
    >
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div 
          className="w-screen max-w-md bg-[#FAF7F2] border-l border-[#E8DFD8] shadow-2xl flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E8DFD8] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#241510] flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4 text-[#C58940]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#241510] text-base">Your Bag</h3>
                <span className="text-[11px] text-[#8C766B] font-normal">
                  {cart.reduce((s, i) => s + i.quantity, 0)} handcrafted {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#8C766B] transition-colors hover:bg-[#FAF7F2] hover:text-[#241510]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-4 sm:px-5 py-2.5 bg-[#F5EFE6] border-b border-[#E8DFD8]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#241510]">
                <Truck className="w-3.5 h-3.5 text-[#C58940]" />
                {isFreeDelivery ? (
                  <span className="text-emerald-800 font-medium">Free delivery unlocked!</span>
                ) : (
                  <span>Add {formatRupees(amountNeededForFreeDelivery)} more for free delivery</span>
                )}
              </span>
              <span className="font-mono text-[#8C766B] text-[10px]">{formatRupees(freeDeliveryThreshold)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E8DFD8] overflow-hidden">
              <div 
                className="h-full bg-[#241510] transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, ((itemTotal - discount) / freeDeliveryThreshold) * 100)}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white border border-[#E8DFD8] flex items-center justify-center text-[#8C766B]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#241510]">Your bag is empty</h4>
                <p className="text-xs text-[#8C766B] max-w-xs leading-relaxed">
                  Select from our small-batch chocolates, deck-oven molten cakes, or tasting boxes.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2 rounded-full text-xs font-medium bg-[#241510] text-white hover:bg-[#3D2317] transition-colors shadow-xs"
                >
                  Explore the Menu
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.product.id}
                  className="p-3 rounded-xl bg-white border border-[#E8DFD8] flex items-center gap-3 relative shadow-xs"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#F0EAE1]">
                    <ProductImage
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="font-serif font-bold text-[#241510] text-xs truncate">
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-[#241510] text-xs">
                        {formatRupees(item.product.price)}
                      </span>
                      {item.product.isVeg && (
                        <div className="w-3 h-3 rounded-xs border border-emerald-600 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-emerald-600" />
                        </div>
                      )}
                    </div>
                    {item.customMessage && (
                      <p className="text-[10px] text-[#8C766B] italic truncate mt-0.5">
                        Gift note: "{item.customMessage}"
                      </p>
                    )}

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] overflow-hidden text-xs">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#E8DFD8]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-medium text-[11px]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockCount}
                          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#E8DFD8] disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-medium text-xs text-[#241510] ml-auto">
                        {formatRupees(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-md text-[#8C766B] transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-[#E8DFD8] bg-white space-y-3">
              
              {/* Coupon Code Section */}
              <div>
                {activeCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-xs">
                    <span className="flex items-center gap-1.5 text-[#241510] font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#C58940]" />
                      Coupon <code className="font-mono font-bold text-[#C58940]">{activeCoupon.code}</code> applied
                    </span>
                    <button 
                      onClick={removeCoupon}
                      className="text-rose-700 hover:underline text-[11px] font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#9E8B80] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={exampleCoupon ? `Promo code (e.g. ${exampleCoupon})` : 'Promo code'}
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] focus:border-[#241510] text-xs text-[#241510] placeholder:text-[#9E8B80] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-medium transition-colors shadow-xs"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponFeedback && (
                  <p className={`text-[11px] mt-1 font-medium ${couponFeedback.success ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Price Details */}
              <div className="space-y-1 pt-1 text-xs tabular-nums text-[#6B574E]">
                <div className="flex justify-between gap-3">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#241510]">{formatRupees(itemTotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between gap-3 font-medium text-emerald-800">
                    <span>Discount</span>
                    <span>−{formatRupees(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between gap-3">
                  <span>Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="font-medium text-emerald-800">Free</span>
                    ) : (
                      formatRupees(deliveryFee)
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>GST ({storeSettings.gstPercent}% included)</span>
                  <span className="text-[#241510]">{formatRupees(tax)}</span>
                </div>

                <div className="flex items-baseline justify-between gap-3 border-t border-[#F0EAE1] pt-2 text-sm font-bold text-[#241510]">
                  <span className="font-serif">Total</span>
                  <span className="text-lg font-bold text-[#241510]">{formatRupees(finalTotal)}</span>
                </div>
              </div>

              {/* Checkout Trigger */}
              <button
                id="btn-cart-proceed-checkout"
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-2.5 sm:py-3 px-5 rounded-full font-medium bg-[#241510] hover:bg-[#3D2317] text-white flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all text-xs sm:text-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 opacity-80" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C766B]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>UPI • Cash on Delivery</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
