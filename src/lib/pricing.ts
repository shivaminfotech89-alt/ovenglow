/**
 * The only place order totals are calculated.
 *
 * The cart drawer, the checkout screen and the stored order all call this, so a
 * change to GST or the free-delivery threshold cannot make the three disagree.
 */

import { CartItem, Coupon, StoreSettings } from '../types';

export interface OrderTotals {
  itemTotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  /** How much more the customer must spend to get free delivery. 0 once earned. */
  freeDeliveryShortfall: number;
  isFreeDelivery: boolean;
}

export interface CouponCheck {
  valid: boolean;
  reason?: string;
}

/** Whether a coupon may be applied to this subtotal, and why not if it may not. */
export function checkCoupon(coupon: Coupon | null, itemTotal: number): CouponCheck {
  if (!coupon) return { valid: false, reason: 'No coupon applied.' };
  if (!coupon.isActive) return { valid: false, reason: 'This code is no longer active.' };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, reason: 'This code has expired.' };
  }
  if (itemTotal < coupon.minPurchase) {
    return {
      valid: false,
      reason: `Add ₹${coupon.minPurchase - itemTotal} more to use this code (minimum ₹${coupon.minPurchase}).`,
    };
  }
  return { valid: true };
}

export function calculateDiscount(coupon: Coupon | null, itemTotal: number): number {
  if (!checkCoupon(coupon, itemTotal).valid || !coupon) return 0;
  const raw =
    coupon.discountType === 'percentage'
      ? Math.round((itemTotal * coupon.discountValue) / 100)
      : coupon.discountValue;
  // Never discount below zero, whatever the code says.
  return Math.min(raw, itemTotal);
}

export function calculateTotals(
  cart: CartItem[],
  coupon: Coupon | null,
  settings: StoreSettings,
): OrderTotals {
  const itemTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = calculateDiscount(coupon, itemTotal);
  const afterDiscount = itemTotal - discount;

  const isFreeDelivery = afterDiscount >= settings.freeDeliveryThreshold;
  const deliveryFee = cart.length === 0 || isFreeDelivery ? 0 : settings.deliveryFee;
  const tax = Math.round((afterDiscount * settings.gstPercent) / 100);

  return {
    itemTotal,
    discount,
    deliveryFee,
    tax,
    total: Math.max(0, afterDiscount + deliveryFee + tax),
    freeDeliveryShortfall: Math.max(0, settings.freeDeliveryThreshold - afterDiscount),
    isFreeDelivery,
  };
}

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
