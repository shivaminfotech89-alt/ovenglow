import { OrderStage } from './lib/orderStages';
import { StaffRole } from './lib/permissions';

/** What a mutation did, and what to tell the person who asked for it. */
export type Result = { success: boolean; message: string };

/**
 * A range's id, as stored on a product.
 *
 * This used to be a union of the nine ranges the shop opened with, which made
 * the catalogue's shape a fact about the code: adding a tenth meant a developer
 * and a deploy. The shop adds its own ranges now, so the type is an id and the
 * list of real ones lives in the `categories` collection -- the storefront's
 * filter pills, the catalogue's sections and every picker read it from there.
 *
 * The looser type is the cost. Nothing stops a typo in a product's category
 * now, so the places that matter check: the product form offers a list rather
 * than a text box, and a product whose range has been deleted keeps it on
 * screen instead of being silently moved.
 */
export type ProductCategory = string;

/** A range of the menu, as the shop defines it. */
export interface Category {
  /** The slug stored on products, e.g. `premium-chocolate`. Never changes. */
  id: string;
  label: string;
  /**
   * A name from CATEGORY_ICON_CHOICES in src/lib/categories.ts, not a
   * component and not a URL: a range is drawn with one of a fixed set of marks,
   * so the shop can pick one without a developer and without the storefront
   * loading anything.
   */
  icon: string;
  /** Position in the menu. Ties fall back to the label. */
  sortOrder: number;
  /** A range being prepared can be hidden from the shop while it is filled. */
  isActive: boolean;
}

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
  /*
   * `isVeg` used to live here. It implied the shop sometimes sells something
   * else, and it made a food-safety claim a per-product checkbox that could be
   * left wrong on one cake out of thirty-nine. The kitchen is entirely
   * vegetarian and eggless; that is a fact about the shop, stated once, in
   * VegMark and in the hero.
   */
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

  /**
   * Signature Collection: the handful of products shown large on the hero page.
   *
   * `signatureTitle` is the marketing name and is deliberately separate from
   * `name`: the shop floor calls it "Biscoff Cheesecake" on a packing slip while
   * the showcase calls it "The Biscoff Indulgence".
   */
  isSignature?: boolean;
  signatureTitle?: string;
  signatureBlurb?: string;
  /** Position in the Signature Collection; lower comes first. */
  signatureOrder?: number;
}

/** True only when a customer can actually buy it right now. */
export function isBuyable(product: Product): boolean {
  return product.isPublished && product.stockCount > 0 && product.price > 0;
}

/** Seeded from the catalogue but not yet priced by the owner. */
export function needsPricing(product: Product): boolean {
  return product.price <= 0;
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
  /**
   * The Firebase Auth uid of the customer who placed it, when they were signed
   * in -- null for a guest order. This is what lets someone see their own order
   * history: the rules allow listing `orders` only where this equals the uid in
   * the caller's token, so the query returns their orders and refuses anything
   * wider.
   */
  customerUid?: string | null;
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
   * The discount, in the shop's own words: "Flat 100 off your first box".
   *
   * A hero slide needs this or a `couponCode` to be shown at all. The hero
   * carousel is the shop's own slide plus what is on offer; a hero banner with
   * neither is a second brand slide competing with the first.
   */
  offerText?: string;
  /**
   * A code from the coupon table. Preferred over `offerText`, because the
   * amount is then read from the coupon itself -- a slide cannot go on
   * advertising 20% off after the shop has changed the code to 10%.
   */
  couponCode?: string;
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

/**
 * Whoever the storefront is serving right now.
 *
 * `uid` is the difference between a signed-in customer and a guest. A guest
 * gets one of these too -- checkout remembers their details so the next order
 * pre-fills -- but it lives only in their browser and proves nothing. Only a
 * `uid` is proof, because it comes from Firebase Auth and is the same value the
 * security rules compare against an order's `customerUid`.
 */
export interface CustomerUser {
  /** Firebase Auth uid; absent for a guest whose details were merely typed. */
  uid?: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  loggedInAt: string;
}

/** The half of a customer's account that lives in Firestore, at `customers/{uid}`. */
export interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  updatedAt: string;
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
  /** The 14-digit FSSAI licence number. Displayed wherever it is set. */
  fssaiLicense: string;
  /**
   * The official FSSAI emblem, if the shop has the artwork on file.
   *
   * Left to a file rather than drawn in code: it is a government mark, and an
   * approximation of an official emblem would be wrong in its details while
   * still reading as official. Save the real one as `public/fssai-logo.png`
   * and it appears; until then the licence number is shown on its own.
   */
  fssaiLogoUrl: string;
  gstin: string;
  /**
   * The shop's real logo. Drop a file at public/logo.png (or set any URL here in
   * Settings) and it replaces the drawn fallback everywhere the mark appears.
   */
  logoUrl: string;
  /**
   * A tighter crop of the mark for small sizes. The full badge carries arched
   * lettering that is unreadable at header size, so the header shows just the
   * monogram. Falls back to `logoUrl` when blank.
   */
  logoMarkUrl: string;

  // Payment
  upiId: string;
  upiAccountName: string;
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
