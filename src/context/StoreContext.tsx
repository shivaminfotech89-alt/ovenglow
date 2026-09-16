import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Product,
  CartItem,
  Order,
  PaymentMethod,
  CustomerDetails,
  CustomerUser,
  SalesReport,
  StaffUser,
  StoreSettings,
  Coupon,
  Banner,
  ProductCategory,
  isBuyable,
} from '../types';
import {
  OrderStage,
  STAGES,
  STAGE_ORDER,
  canTransition,
  getNextStages,
} from '../lib/orderStages';
import { StaffRole, can, Permission, isPermanentSuperAdmin } from '../lib/permissions';
import { calculateTotals, checkCoupon, OrderTotals } from '../lib/pricing';
import { generateDeliveryOtp, generateId, generateOrderNumber } from '../lib/ids';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { INITIAL_COUPONS } from '../data/initialCoupons';
import { INITIAL_BANNERS } from '../data/initialBanners';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  // Taken from the brand mark: OVENGLOW · DELIGHTS · CRAFTED TO CRAVE.
  storeName: 'Ovenglow Delights',
  tagline: 'Crafted to Crave',
  address: '',
  city: 'Ahmedabad',
  state: 'Gujarat',
  pincode: '',
  landmark: '',
  phone: '9824704877',
  whatsappNumber: '9824704877',
  email: 'ovenglowdelights@gmail.com',
  operatingHours: '10:00 AM – 11:00 PM (Daily Fresh Baking)',
  fssaiLicense: '',
  gstin: '',
  // Served from public/logo.png when that file exists; the drawn mark is used
  // until then, and any other URL can be set from Settings.
  logoUrl: '/logo.png',

  upiId: '',
  upiAccountName: '',
  upiQrImage: '',
  paymentInstructions:
    'Pay to the UPI ID above, then enter your 12-digit UPI reference number on the order page so we can verify it against our bank.',

  gstPercent: 5,
  deliveryFee: 60,
  freeDeliveryThreshold: 499,

  deliveryRadiusKm: 25,
  deliveryAreas: [
    { name: 'Bodakdev', pin: '380054' },
    { name: 'Satellite / Jodhpur', pin: '380015' },
    { name: 'Vastrapur', pin: '380052' },
    { name: 'SG Highway', pin: '380060' },
    { name: 'Prahlad Nagar', pin: '380015' },
    { name: 'Sindhu Bhavan Road', pin: '380059' },
    { name: 'Thaltej', pin: '380059' },
    { name: 'Navrangpura', pin: '380009' },
    { name: 'Paldi / Ellisbridge', pin: '380006' },
    { name: 'Maninagar', pin: '380008' },
  ],

  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
};

const DEFAULT_STAFF: StaffUser[] = [
  {
    id: 'staff-1',
    email: 'shivaminfotech89@gmail.com',
    name: 'Executive Administrator',
    role: 'super_admin',
    isActive: true,
    addedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'staff-2',
    email: 'ovenglowdelights@gmail.com',
    name: 'Executive Co-Owner',
    role: 'super_admin',
    isActive: true,
    addedAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * v3: the catalogue moved to the nine printed ranges, so stored products carry
 * category slugs that no longer exist. Bumped rather than migrated; older data
 * is left in place and ignored.
 */
const STORAGE_KEYS = {
  PRODUCTS: 'ovenglow_products_v3',
  ORDERS: 'ovenglow_orders_v3',
  CART: 'ovenglow_cart_v3',
  STAFF: 'ovenglow_staff_v3',
  SESSION: 'ovenglow_staff_session_v3',
  CUSTOMER: 'ovenglow_customer_v3',
  SETTINGS: 'ovenglow_settings_v3',
  COUPONS: 'ovenglow_coupons_v3',
  BANNERS: 'ovenglow_banners_v3',
} as const;

export type Result = { success: boolean; message: string };

/** State that mirrors itself into localStorage on every change. */
function usePersistentState<T>(key: string, fallback: T, onError?: (message: string) => void) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      onError?.('');
    } catch (e) {
      // Almost always the quota: uploaded photos are stored inline as data
      // URLs, and the whole origin gets about 5 MB. Failing silently here would
      // let the shop believe edits were saved when they were not, so it is
      // surfaced to the admin instead.
      const quota = e instanceof DOMException && e.name.includes('Quota');
      console.error(`Could not persist ${key}:`, e);
      onError?.(
        quota
          ? 'Browser storage is full, so the last change was NOT saved. Remove some uploaded photos, or use image URLs instead of uploads.'
          : 'The last change could not be saved to this browser.',
      );
    }
  }, [key, value, onError]);

  return [value, setValue] as const;
}

interface StoreContextType {
  // Catalogue
  products: Product[];
  shopProducts: Product[];
  addProduct: (p: Omit<Product, 'id'>) => Result;
  updateProduct: (id: string, updates: Partial<Product>) => Result;
  deleteProduct: (id: string) => void;
  bulkSetPublished: (ids: string[], isPublished: boolean) => void;
  bulkDelete: (ids: string[]) => void;
  findDuplicateSkus: () => string[];

  // Orders
  orders: Order[];
  createOrder: (customer: CustomerDetails, paymentMethod: PaymentMethod) => Order;
  advanceOrderStage: (orderId: string, to: OrderStage, note?: string) => Result;
  submitUpiReference: (orderId: string, reference: string) => Result;
  verifyPayment: (orderId: string, note?: string) => Result;
  rejectPayment: (orderId: string, reason: string) => Result;
  getOrderById: (query: string) => Order | undefined;
  activeTrackingId: string | null;
  setActiveTrackingId: (id: string | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, note?: string) => Result;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totals: OrderTotals;

  // Coupons
  coupons: Coupon[];
  activeCoupon: Coupon | null;
  applyCoupon: (code: string) => Result;
  removeCoupon: () => void;
  addCoupon: (c: Omit<Coupon, 'id' | 'createdAt' | 'timesUsed'>) => Result;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;

  // Banners
  banners: Banner[];
  addBanner: (b: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;

  // Storefront view state
  activeTab: 'shop' | 'track' | 'admin';
  setActiveTab: (tab: 'shop' | 'track' | 'admin') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isVegOnly: boolean;
  setIsVegOnly: (v: boolean) => void;
  deliveryPincode: string;
  setDeliveryPincode: (pin: string) => void;

  // Settings
  storeSettings: StoreSettings;
  updateStoreSettings: (updates: Partial<StoreSettings>) => void;

  // Customer session
  customerUser: CustomerUser | null;
  loginWithMobile: (phone: string, name?: string, address?: string, pincode?: string) => Result;
  logoutCustomer: () => void;
  updateCustomerProfile: (updates: Partial<CustomerUser>) => void;
  isCustomerAuthOpen: boolean;
  setIsCustomerAuthOpen: (open: boolean) => void;

  // Staff session
  staff: StaffUser[];
  currentStaff: StaffUser | null;
  loginAsStaff: (email: string) => Result;
  logoutStaff: () => void;
  addStaff: (name: string, email: string, role: StaffRole) => Result;
  updateStaff: (id: string, updates: Partial<StaffUser>) => Result;
  removeStaff: (id: string) => Result;
  hasPermission: (permission: Permission) => boolean;

  /** Non-empty when the last write to browser storage failed (usually the quota). */
  storageWarning: string;

  // Messaging + analytics
  getWhatsAppOrderLink: (order: Order, phone?: string) => string;
  getWhatsAppSupportLink: (topic?: string) => string;
  getAnalytics: () => SalesReport;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storageWarning, setStorageWarning] = useState<string>('');
  const reportStorage = useCallback((message: string) => {
    setStorageWarning((prev) => (prev === message ? prev : message));
  }, []);

  const [storeSettings, setStoreSettings] = usePersistentState<StoreSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_STORE_SETTINGS,
    reportStorage,
  );
  const [products, setProducts] = usePersistentState<Product[]>(
    STORAGE_KEYS.PRODUCTS,
    INITIAL_PRODUCTS,
    reportStorage,
  );
  const [orders, setOrders] = usePersistentState<Order[]>(STORAGE_KEYS.ORDERS, [], reportStorage);
  const [cart, setCart] = usePersistentState<CartItem[]>(STORAGE_KEYS.CART, []);
  const [coupons, setCoupons] = usePersistentState<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
  const [banners, setBanners] = usePersistentState<Banner[]>(
    STORAGE_KEYS.BANNERS,
    INITIAL_BANNERS,
    reportStorage,
  );
  const [staff, setStaff] = usePersistentState<StaffUser[]>(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
  const [currentStaff, setCurrentStaff] = usePersistentState<StaffUser | null>(
    STORAGE_KEYS.SESSION,
    null,
  );
  const [customerUser, setCustomerUser] = usePersistentState<CustomerUser | null>(
    STORAGE_KEYS.CUSTOMER,
    null,
  );

  const [activeTab, setActiveTab] = useState<'shop' | 'track' | 'admin'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [deliveryPincode, setDeliveryPincode] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState<boolean>(false);
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  // No coupon is applied until the customer enters one.
  const [activeCouponCode, setActiveCouponCode] = useState<string | null>(null);

  /* ---------------------------------------------------------------- sync -- */

  const notifySync = useCallback((type: string) => {
    try {
      const channel = new BroadcastChannel('ovenglow_sync_channel');
      channel.postMessage({ type, at: Date.now() });
      channel.close();
    } catch {
      // BroadcastChannel is unavailable; other tabs pick changes up on reload.
    }
  }, []);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    const reload = <T,>(key: string, setter: (v: T) => void) => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) setter(JSON.parse(saved) as T);
      } catch {
        /* ignore a corrupt payload from another tab */
      }
    };

    try {
      channel = new BroadcastChannel('ovenglow_sync_channel');
      channel.onmessage = (event) => {
        const type = event.data?.type;
        if (type === 'ORDERS') reload<Order[]>(STORAGE_KEYS.ORDERS, setOrders);
        else if (type === 'PRODUCTS') reload<Product[]>(STORAGE_KEYS.PRODUCTS, setProducts);
        else if (type === 'COUPONS') reload<Coupon[]>(STORAGE_KEYS.COUPONS, setCoupons);
        else if (type === 'BANNERS') reload<Banner[]>(STORAGE_KEYS.BANNERS, setBanners);
        else if (type === 'SETTINGS') reload<StoreSettings>(STORAGE_KEYS.SETTINGS, setStoreSettings);
      };
    } catch {
      // Not supported here.
    }
    return () => channel?.close();
  }, [setOrders, setProducts, setCoupons, setBanners, setStoreSettings]);

  /* ------------------------------------------------------------ settings -- */

  const updateStoreSettings = useCallback(
    (updates: Partial<StoreSettings>) => {
      setStoreSettings((prev) => ({ ...prev, ...updates }));
      notifySync('SETTINGS');
    },
    [setStoreSettings, notifySync],
  );

  /* ----------------------------------------------------------- catalogue -- */

  const shopProducts = useMemo(() => products.filter(isBuyable), [products]);

  const findDuplicateSkus = useCallback(() => {
    const seen = new Map<string, number>();
    products.forEach((p) => seen.set(p.sku, (seen.get(p.sku) ?? 0) + 1));
    return [...seen.entries()].filter(([, n]) => n > 1).map(([sku]) => sku);
  }, [products]);

  const addProduct = useCallback(
    (newProd: Omit<Product, 'id'>): Result => {
      const sku = newProd.sku.trim();
      if (!sku) return { success: false, message: 'A product code (SKU) is required.' };
      if (products.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) {
        return { success: false, message: `Product code "${sku}" already exists.` };
      }
      setProducts((prev) => [{ ...newProd, sku, id: generateId('prod') }, ...prev]);
      notifySync('PRODUCTS');
      return { success: true, message: `"${newProd.name}" added to the catalogue.` };
    },
    [products, setProducts, notifySync],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>): Result => {
      if (updates.sku !== undefined) {
        const sku = updates.sku.trim();
        if (!sku) return { success: false, message: 'A product code (SKU) is required.' };
        if (products.some((p) => p.id !== id && p.sku.toLowerCase() === sku.toLowerCase())) {
          return { success: false, message: `Product code "${sku}" is already in use.` };
        }
      }
      if (updates.price !== undefined && updates.price < 0) {
        return { success: false, message: 'Price cannot be negative.' };
      }
      if (updates.stockCount !== undefined && updates.stockCount < 0) {
        return { success: false, message: 'Stock cannot be negative.' };
      }
      if (updates.isPublished) {
        const target = products.find((p) => p.id === id);
        const price = updates.price ?? target?.price ?? 0;
        if (price <= 0) {
          return { success: false, message: 'Set a price before publishing this product.' };
        }
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      notifySync('PRODUCTS');
      return { success: true, message: 'Saved.' };
    },
    [products, setProducts, notifySync],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      notifySync('PRODUCTS');
    },
    [setProducts, notifySync],
  );

  const bulkSetPublished = useCallback(
    (ids: string[], isPublished: boolean) => {
      setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, isPublished } : p)));
      notifySync('PRODUCTS');
    },
    [setProducts, notifySync],
  );

  const bulkDelete = useCallback(
    (ids: string[]) => {
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      notifySync('PRODUCTS');
    },
    [setProducts, notifySync],
  );

  /* --------------------------------------------------------------- cart -- */

  const activeCoupon = useMemo(
    () => coupons.find((c) => c.code === activeCouponCode) ?? null,
    [coupons, activeCouponCode],
  );

  const totals = useMemo(
    () => calculateTotals(cart, activeCoupon, storeSettings),
    [cart, activeCoupon, storeSettings],
  );

  const addToCart = useCallback(
    (product: Product, quantity = 1, note?: string): Result => {
      // Read stock from the catalogue, not from the (possibly stale) copy the
      // caller is holding.
      const live = products.find((p) => p.id === product.id);
      if (!live || !isBuyable(live)) {
        return { success: false, message: 'This item is not available right now.' };
      }

      let outcome: Result = { success: true, message: 'Added to your bag.' };
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        const wanted = (existing?.quantity ?? 0) + quantity;
        if (wanted > live.stockCount) {
          outcome = {
            success: false,
            message: `Only ${live.stockCount} left — your bag has been capped at that.`,
          };
        }
        const capped = Math.min(wanted, live.stockCount);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, product: live, quantity: capped, customMessage: note ?? item.customMessage }
              : item,
          );
        }
        return [...prev, { product: live, quantity: capped, customMessage: note }];
      });

      setIsCartOpen(true);
      return outcome;
    },
    [products, setCart],
  );

  const removeFromCart = useCallback(
    (productId: string) => setCart((prev) => prev.filter((i) => i.product.id !== productId)),
    [setCart],
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setCart((prev) =>
        prev.map((item) => {
          if (item.product.id !== productId) return item;
          const live = products.find((p) => p.id === productId) ?? item.product;
          return { ...item, product: live, quantity: Math.min(quantity, live.stockCount) };
        }),
      );
    },
    [products, removeFromCart, setCart],
  );

  const clearCart = useCallback(() => setCart([]), [setCart]);

  /* ------------------------------------------------------------ coupons -- */

  const applyCoupon = useCallback(
    (code: string): Result => {
      const clean = code.trim().toUpperCase();
      const found = coupons.find((c) => c.code.toUpperCase() === clean);
      if (!found) return { success: false, message: 'That code was not recognised.' };

      const check = checkCoupon(found, totals.itemTotal);
      if (!check.valid) return { success: false, message: check.reason ?? 'This code cannot be used.' };

      setActiveCouponCode(found.code);
      return { success: true, message: `${found.name} applied.` };
    },
    [coupons, totals.itemTotal],
  );

  const removeCoupon = useCallback(() => setActiveCouponCode(null), []);

  const addCoupon = useCallback(
    (c: Omit<Coupon, 'id' | 'createdAt' | 'timesUsed'>): Result => {
      const code = c.code.trim().toUpperCase();
      if (!code) return { success: false, message: 'A coupon code is required.' };
      if (coupons.some((existing) => existing.code.toUpperCase() === code)) {
        return { success: false, message: `Code "${code}" already exists.` };
      }
      if (c.discountValue <= 0) {
        return { success: false, message: 'The discount must be greater than zero.' };
      }
      if (c.discountType === 'percentage' && c.discountValue > 100) {
        return { success: false, message: 'A percentage discount cannot exceed 100%.' };
      }
      setCoupons((prev) => [
        { ...c, code, id: generateId('coupon'), createdAt: new Date().toISOString(), timesUsed: 0 },
        ...prev,
      ]);
      notifySync('COUPONS');
      return { success: true, message: `Coupon ${code} created.` };
    },
    [coupons, setCoupons, notifySync],
  );

  const updateCoupon = useCallback(
    (id: string, updates: Partial<Coupon>) => {
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
      notifySync('COUPONS');
    },
    [setCoupons, notifySync],
  );

  const deleteCoupon = useCallback(
    (id: string) => {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      notifySync('COUPONS');
    },
    [setCoupons, notifySync],
  );

  /* ------------------------------------------------------------ banners -- */

  const addBanner = useCallback(
    (b: Omit<Banner, 'id'>) => {
      setBanners((prev) => [...prev, { ...b, id: generateId('banner') }]);
      notifySync('BANNERS');
    },
    [setBanners, notifySync],
  );

  const updateBanner = useCallback(
    (id: string, updates: Partial<Banner>) => {
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
      notifySync('BANNERS');
    },
    [setBanners, notifySync],
  );

  const deleteBanner = useCallback(
    (id: string) => {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      notifySync('BANNERS');
    },
    [setBanners, notifySync],
  );

  /* ------------------------------------------------------------- orders -- */

  const createOrder = useCallback(
    (customer: CustomerDetails, paymentMethod: PaymentMethod): Order => {
      const partners = [
        { name: 'Ovenglow Delivery', vehicleNumber: 'Own rider' },
        { name: 'Ovenglow Delivery', vehicleNumber: 'Own rider' },
        { name: 'Local Courier', vehicleNumber: 'Courier partner' },
      ];
      const partner = partners[Math.floor(Math.random() * partners.length)];
      const now = new Date().toISOString();

      const order: Order = {
        id: generateId('ord'),
        orderNumber: generateOrderNumber(orders),
        customer,
        items: [...cart],
        itemTotal: totals.itemTotal,
        discount: totals.discount,
        couponCode: activeCoupon?.code ?? null,
        deliveryFee: totals.deliveryFee,
        tax: totals.tax,
        totalAmount: totals.total,
        paymentMethod,
        // Nothing is marked paid at checkout. Prepaid orders reach `paid` only
        // when an admin confirms the money against the bank.
        payment: { method: paymentMethod },
        stage: 'inquiry_received',
        createdAt: now,
        updatedAt: now,
        deliveryPartner: { ...partner, phone: storeSettings.phone },
        estimatedDeliveryTime: '30 - 45 Minutes',
        deliveryOtp: generateDeliveryOtp(),
        stageHistory: [
          {
            stage: 'inquiry_received',
            at: now,
            by: 'system',
            note: `Order received. Payment method chosen: ${paymentMethod}.`,
          },
        ],
      };

      setProducts((prev) =>
        prev.map((prod) => {
          const line = cart.find((ci) => ci.product.id === prod.id);
          if (!line) return prod;
          return { ...prod, stockCount: Math.max(0, prod.stockCount - line.quantity) };
        }),
      );

      if (activeCoupon) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === activeCoupon.id ? { ...c, timesUsed: c.timesUsed + 1 } : c)),
        );
      }

      setOrders((prev) => [order, ...prev]);
      setCart([]);
      setActiveCouponCode(null);
      setActiveTrackingId(order.orderNumber);
      notifySync('ORDERS');
      notifySync('PRODUCTS');
      return order;
    },
    [cart, orders, totals, activeCoupon, storeSettings.phone, setProducts, setCoupons, setOrders, setCart, notifySync],
  );

  /** The single door every stage change goes through. */
  const applyStageChange = useCallback(
    (
      orderId: string,
      to: OrderStage,
      note: string,
      by: string,
      patch?: (o: Order) => Partial<Order>,
    ): Result => {
      const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!order) return { success: false, message: 'Order not found.' };
      if (!canTransition(order, to)) {
        return {
          success: false,
          message: `An order at "${STAGES[order.stage].label}" cannot move to "${STAGES[to].label}".`,
        };
      }

      const at = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                ...(patch ? patch(o) : {}),
                stage: to,
                updatedAt: at,
                stageHistory: [...o.stageHistory, { stage: to, at, by, note }],
              }
            : o,
        ),
      );
      notifySync('ORDERS');
      return { success: true, message: `Order ${order.orderNumber} moved to ${STAGES[to].label}.` };
    },
    [orders, setOrders, notifySync],
  );

  const advanceOrderStage = useCallback(
    (orderId: string, to: OrderStage, note?: string): Result => {
      if (!currentStaff) return { success: false, message: 'Sign in to change an order.' };

      // Reaching `paid` is an assertion that money arrived; it is gated
      // separately from ordinary stage progression.
      const needed: Permission =
        to === 'paid' ? 'orders.verify_payment' : to === 'cancelled' ? 'orders.cancel' : 'orders.advance';
      if (!can(currentStaff.role, needed)) {
        return { success: false, message: 'Your role does not allow that change.' };
      }
      if (to === 'paid') {
        return { success: false, message: 'Use Verify Payment to mark an order paid.' };
      }

      return applyStageChange(orderId, to, note?.trim() || STAGES[to].why, currentStaff.email);
    },
    [currentStaff, applyStageChange],
  );

  const submitUpiReference = useCallback(
    (orderId: string, reference: string): Result => {
      const clean = reference.trim();
      if (clean.length < 6) {
        return { success: false, message: 'Enter the full UPI reference number from your payment app.' };
      }
      return applyStageChange(
        orderId,
        'payment_verification_pending',
        `Customer submitted UPI reference ${clean}.`,
        'customer',
        () => ({
          payment: {
            method: 'UPI' as PaymentMethod,
            upiReference: clean,
            submittedAt: new Date().toISOString(),
          },
        }),
      );
    },
    [applyStageChange],
  );

  const verifyPayment = useCallback(
    (orderId: string, note?: string): Result => {
      if (!currentStaff || !can(currentStaff.role, 'orders.verify_payment')) {
        return { success: false, message: 'Only an Admin or Super Admin can verify a payment.' };
      }
      const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!order) return { success: false, message: 'Order not found.' };

      return applyStageChange(
        orderId,
        'paid',
        note?.trim() || `Payment verified against the bank by ${currentStaff.name}.`,
        currentStaff.email,
        (o) => ({
          payment: {
            ...o.payment,
            verifiedBy: currentStaff.email,
            verifiedAt: new Date().toISOString(),
            rejectionNote: undefined,
          },
        }),
      );
    },
    [currentStaff, orders, applyStageChange],
  );

  const rejectPayment = useCallback(
    (orderId: string, reason: string): Result => {
      if (!currentStaff || !can(currentStaff.role, 'orders.verify_payment')) {
        return { success: false, message: 'Only an Admin or Super Admin can reject a payment.' };
      }
      if (!reason.trim()) {
        return { success: false, message: 'Give a reason so the customer knows what to fix.' };
      }
      return applyStageChange(
        orderId,
        'awaiting_payment',
        `Payment reference rejected: ${reason.trim()}`,
        currentStaff.email,
        (o) => ({
          payment: { ...o.payment, upiReference: undefined, rejectionNote: reason.trim() },
        }),
      );
    },
    [currentStaff, applyStageChange],
  );

  /**
   * Look an order up by its number, or by the phone it was placed with.
   * Returns undefined when nothing matches — callers must not fall back to
   * showing another customer's order.
   */
  const getOrderById = useCallback(
    (query: string): Order | undefined => {
      const clean = query.trim();
      if (!clean) return undefined;
      const digits = clean.replace(/\D/g, '');
      return orders.find(
        (o) =>
          o.orderNumber.toLowerCase() === clean.toLowerCase() ||
          o.id === clean ||
          (digits.length === 10 && o.customer.phone.replace(/\D/g, '').endsWith(digits)),
      );
    },
    [orders],
  );

  /* -------------------------------------------------- customer sessions -- */

  const loginWithMobile = useCallback(
    (phone: string, name?: string, address?: string, pincode?: string): Result => {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' };
      }
      const customer: CustomerUser = {
        phone: cleanPhone,
        name: name?.trim() || `Customer +91 ${cleanPhone.slice(0, 5)}`,
        address: address ?? '',
        pincode: pincode ?? '',
        city: storeSettings.city,
        loggedInAt: new Date().toISOString(),
      };
      setCustomerUser(customer);
      return { success: true, message: `Welcome, ${customer.name}.` };
    },
    [storeSettings.city, setCustomerUser],
  );

  const logoutCustomer = useCallback(() => setCustomerUser(null), [setCustomerUser]);

  const updateCustomerProfile = useCallback(
    (updates: Partial<CustomerUser>) =>
      setCustomerUser((prev) => (prev ? { ...prev, ...updates } : null)),
    [setCustomerUser],
  );

  /* ----------------------------------------------------- staff sessions -- */

  const loginAsStaff = useCallback(
    (email: string): Result => {
      const clean = email.trim().toLowerCase();
      const match = staff.find((s) => s.email.toLowerCase() === clean);
      if (!match) {
        return { success: false, message: 'That email is not registered as Ovenglow staff.' };
      }
      if (!match.isActive && !isPermanentSuperAdmin(clean)) {
        return { success: false, message: 'This account has been deactivated.' };
      }
      const session = { ...match, lastLoginAt: new Date().toISOString() };
      setCurrentStaff(session);
      setStaff((prev) => prev.map((s) => (s.id === match.id ? session : s)));
      return { success: true, message: `Signed in as ${match.name}.` };
    },
    [staff, setCurrentStaff, setStaff],
  );

  const logoutStaff = useCallback(() => setCurrentStaff(null), [setCurrentStaff]);

  const addStaff = useCallback(
    (name: string, email: string, role: StaffRole): Result => {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanName) return { success: false, message: 'Enter the staff member’s full name.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { success: false, message: 'Enter a valid email address.' };
      }
      if (staff.some((s) => s.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'That email already has an account.' };
      }
      setStaff((prev) => [
        ...prev,
        {
          id: generateId('staff'),
          name: cleanName,
          email: cleanEmail,
          role,
          isActive: true,
          addedAt: new Date().toISOString(),
        },
      ]);
      return { success: true, message: `${cleanName} added.` };
    },
    [staff, setStaff],
  );

  const updateStaff = useCallback(
    (id: string, updates: Partial<StaffUser>): Result => {
      const target = staff.find((s) => s.id === id);
      if (!target) return { success: false, message: 'Staff member not found.' };
      if (isPermanentSuperAdmin(target.email) && (updates.role || updates.isActive === false)) {
        return {
          success: false,
          message: 'This owner account is a permanent Super Admin and cannot be changed.',
        };
      }
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      // Keep the live session in step if an admin edited themselves.
      setCurrentStaff((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
      return { success: true, message: 'Staff account updated.' };
    },
    [staff, setStaff, setCurrentStaff],
  );

  const removeStaff = useCallback(
    (id: string): Result => {
      const target = staff.find((s) => s.id === id);
      if (!target) return { success: false, message: 'Staff member not found.' };
      if (isPermanentSuperAdmin(target.email)) {
        return { success: false, message: 'This owner account cannot be removed.' };
      }
      if (staff.filter((s) => s.role === 'super_admin' && s.isActive).length <= 1 && target.role === 'super_admin') {
        return { success: false, message: 'At least one Super Admin must remain.' };
      }
      setStaff((prev) => prev.filter((s) => s.id !== id));
      setCurrentStaff((prev) => (prev && prev.id === id ? null : prev));
      return { success: true, message: `${target.name} removed.` };
    },
    [staff, setStaff, setCurrentStaff],
  );

  const hasPermission = useCallback(
    (permission: Permission) => can(currentStaff?.role, permission),
    [currentStaff],
  );

  /* ---------------------------------------------------------- messaging -- */

  const getWhatsAppOrderLink = useCallback(
    (order: Order, customPhone?: string): string => {
      const phone = (customPhone || order.customer.phone).replace(/\D/g, '');
      const items = order.items
        .map((i) => `• ${i.quantity}x ${i.product.name} (₹${i.product.price * i.quantity})`)
        .join('\n');

      const lines = [
        `*${storeSettings.storeName}*`,
        '',
        `*Order:* #${order.orderNumber}`,
        `*Status:* ${STAGES[order.stage].label}`,
        `*Amount:* ₹${order.totalAmount} (${order.paymentMethod})`,
        '',
        '*Items:*',
        items,
        '',
        `*Delivery PIN:* ${order.deliveryOtp}`,
        `*ETA:* ${order.estimatedDeliveryTime}`,
        '',
        STAGES[order.stage].why,
      ];

      const text = encodeURIComponent(lines.join('\n'));
      if (!phone) return `https://wa.me/?text=${text}`;
      return `https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${text}`;
    },
    [storeSettings.storeName],
  );

  const getWhatsAppSupportLink = useCallback(
    (topic = 'Order Inquiry'): string => {
      const supportPhone = storeSettings.whatsappNumber.replace(/\D/g, '');
      const text = encodeURIComponent(
        `Hello ${storeSettings.storeName} (${storeSettings.city})! I have an inquiry regarding: ${topic}`,
      );
      if (supportPhone) {
        return `https://wa.me/${supportPhone.startsWith('91') ? supportPhone : `91${supportPhone}`}?text=${text}`;
      }
      return `mailto:${storeSettings.email}?subject=${encodeURIComponent(
        `Ovenglow Inquiry: ${topic}`,
      )}&body=${text}`;
    },
    [storeSettings.whatsappNumber, storeSettings.storeName, storeSettings.city, storeSettings.email],
  );

  /* ---------------------------------------------------------- analytics -- */

  const getAnalytics = useCallback((): SalesReport => {
    const billable = orders.filter((o) => o.stage !== 'cancelled');
    const totalRevenue = billable.reduce((sum, o) => sum + o.totalAmount, 0);
    const itemsSold = billable.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );

    const categoryRevenue: Record<string, number> = {};
    const paymentMethodBreakdown: Record<string, number> = { UPI: 0, Card: 0, Netbanking: 0, COD: 0 };
    const stageCounts = STAGE_ORDER.concat('cancelled').reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {} as Record<OrderStage, number>,
    );

    orders.forEach((o) => {
      stageCounts[o.stage] = (stageCounts[o.stage] ?? 0) + 1;
      paymentMethodBreakdown[o.paymentMethod] =
        (paymentMethodBreakdown[o.paymentMethod] ?? 0) + o.totalAmount;
      o.items.forEach((item) => {
        categoryRevenue[item.product.category] =
          (categoryRevenue[item.product.category] ?? 0) + item.product.price * item.quantity;
      });
    });

    // Real revenue per day for the last seven days, read from order timestamps.
    const dailySales = Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - i));
      const next = new Date(day);
      next.setDate(next.getDate() + 1);

      const onDay = billable.filter((o) => {
        const placed = new Date(o.createdAt).getTime();
        return placed >= day.getTime() && placed < next.getTime();
      });

      return {
        date: day.toISOString().slice(0, 10),
        label:
          i === 6 ? 'Today' : day.toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: onDay.reduce((sum, o) => sum + o.totalAmount, 0),
        orders: onDay.length,
      };
    });

    return {
      totalRevenue,
      totalOrders: orders.length,
      averageOrderValue: billable.length ? Math.round(totalRevenue / billable.length) : 0,
      itemsSold,
      categoryRevenue,
      paymentMethodBreakdown,
      stageCounts,
      dailySales,
    };
  }, [orders]);

  const value: StoreContextType = {
    products,
    shopProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkSetPublished,
    bulkDelete,
    findDuplicateSkus,

    orders,
    createOrder,
    advanceOrderStage,
    submitUpiReference,
    verifyPayment,
    rejectPayment,
    getOrderById,
    activeTrackingId,
    setActiveTrackingId,

    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    totals,

    coupons,
    activeCoupon,
    applyCoupon,
    removeCoupon,
    addCoupon,
    updateCoupon,
    deleteCoupon,

    banners,
    addBanner,
    updateBanner,
    deleteBanner,

    activeTab,
    setActiveTab,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isVegOnly,
    setIsVegOnly,
    deliveryPincode,
    setDeliveryPincode,

    storeSettings,
    updateStoreSettings,

    customerUser,
    loginWithMobile,
    logoutCustomer,
    updateCustomerProfile,
    isCustomerAuthOpen,
    setIsCustomerAuthOpen,

    staff,
    currentStaff,
    loginAsStaff,
    logoutStaff,
    addStaff,
    updateStaff,
    removeStaff,
    hasPermission,
    storageWarning,

    getWhatsAppOrderLink,
    getWhatsAppSupportLink,
    getAnalytics,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};

export { STAGES, getNextStages };
export type { ProductCategory };
