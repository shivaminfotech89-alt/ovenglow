import { Coupon } from '../types';

/**
 * Seed coupons. These are ordinary records now — a Super Admin edits, expires or
 * deactivates them from the Coupons screen rather than editing source.
 * None of them is applied automatically; the customer must enter a code.
 */
export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon-festive15',
    code: 'FESTIVE15',
    name: 'Festive 15% Off',
    discountType: 'percentage',
    discountValue: 15,
    minPurchase: 500,
    expiresAt: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    timesUsed: 0,
  },
  {
    id: 'coupon-ovenglow100',
    code: 'OVENGLOW100',
    name: '₹100 Gourmet Treat',
    discountType: 'fixed',
    discountValue: 100,
    minPurchase: 600,
    expiresAt: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    timesUsed: 0,
  },
  {
    id: 'coupon-sweet20',
    code: 'SWEET20',
    name: 'Luxury Bakery 20%',
    discountType: 'percentage',
    discountValue: 20,
    minPurchase: 1500,
    expiresAt: null,
    isActive: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    timesUsed: 0,
  },
];
