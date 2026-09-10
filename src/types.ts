import { OrderStage } from './lib/orderStages';
import { StaffRole } from './lib/permissions';

export type ProductCategory =
  | 'artisanal-chocolates'
  | 'truffles-bonbons'
  | 'gourmet-cakes'
  | 'bakery-pastries'
  | 'festive-hampers';

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'artisanal-chocolates', label: 'Artisanal Chocolates' },
  { id: 'truffles-bonbons', label: 'Truffles & Bonbons' },
  { id: 'gourmet-cakes', label: 'Gourmet Cakes' },
  { id: 'bakery-pastries', label: 'Bakery & Pastries' },
  { id: 'festive-hampers', label: 'Festive Hampers' },
];

export interface Product {
  id: string;
  /** The code on the supplier invoice. Unique; the product form refuses a duplicate. */
  sku: string;
  name: string;
  hindiSubname?: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  category: ProductCategory;
  image: string;
  secondaryImages: string[];
  /** Whether the product appears in the shop at all, independent of stock. */
  isPublished: boolean;
  stockCount: number;
  isVeg: boolean; // 100% Eggless / Pure Vegetarian badge
  rating: number;
  reviewCount: number;
  weightGrams: number;
  cacaoPercentage?: number;
  shelfLife: string;
  layers: {
    name: string;
    description: string;
    color: string;
  }[];
  isBestseller?: boolean;
  isFestiveSpecial?: boolean;
  flavorNotes: string[];
}

/** True only when a customer can actually buy it right now. */
export function isBuyable(product: Product): boolean {
  return product.isPublished && product.stockCount > 0;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customMessage?: string;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Netbanking' | 'COD';

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  giftMessage?: string;
  enableWhatsAppUpdates: boolean;
}

export interface DeliveryPartner {
  name: string;
  phone: string;
  vehicleNumber: string;
}

/**
 * What the customer submitted and what an admin did about it.
 * `verifiedBy` is only ever set by an admin moving the order to `paid`.
 */
export interface PaymentRecord {
  method: PaymentMethod;
  /** The UPI transaction reference the customer typed in. */
  upiReference?: string;
  submittedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  /** Set when an admin rejects a reference, so the customer sees why. */
  rejectionNote?: string;
}

export interface StageHistoryEntry {
  stage: OrderStage;
  at: string;
  /** Email of the staff member, or 'customer' / 'system'. */
  by: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerDetails;
  items: CartItem[];
  itemTotal: number;
  discount: number;
  couponCode: string | null;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  payment: PaymentRecord;
  stage: OrderStage;
  createdAt: string;
  updatedAt: string;
  deliveryPartner: DeliveryPartner;
  estimatedDeliveryTime: string;
  deliveryOtp: string;
  stageHistory: StageHistoryEntry[];
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  /** Cart subtotal below which the code is refused. 0 means no minimum. */
  minPurchase: number;
  /** ISO date, or null for a code that never expires. */
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  timesUsed: number;
}

export type BannerSlot = 'hero' | 'category' | 'campaign';

export interface Banner {
  id: string;
  slot: BannerSlot;
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  /**
   * The category this tile opens. Null means it opens an empty shop, which the
   * admin screen flags as a warning.
   */
  linkedCategory: ProductCategory | null;
  isActive: boolean;
  sortOrder: number;
}

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
  addedAt: string;
  lastLoginAt?: string;
}

export interface CustomerUser {
  phone: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  loggedInAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  operatingHours: string;
  fssaiLicense: string;
  gstin: string;

  // Payment
  upiId: string;
  upiAccountName: string;
  upiQrImage: string;
  paymentInstructions: string;

  // Charges — read by the single pricing function, editable by a Super Admin.
  gstPercent: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;

  // Delivery coverage
  deliveryRadiusKm: number;
  deliveryAreas: { name: string; pin: string }[];

  // Social
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  itemsSold: number;
  categoryRevenue: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  stageCounts: Record<OrderStage, number>;
  /** Real revenue bucketed by day from order timestamps, oldest first. */
  dailySales: {
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }[];
}
