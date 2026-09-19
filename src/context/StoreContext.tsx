import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  Result,
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
import { generateDeliveryOtp, generateId } from '../lib/ids';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { INITIAL_COUPONS } from '../data/initialCoupons';
import { INITIAL_BANNERS } from '../data/initialBanners';
import {
  patchMany,
  patchRecord,
  putMany,
  putRecord,
  removeMany,
  removeRecord,
  useLiveCollection,
  useLiveDoc,
} from '../lib/firestoreSync';
import {
  User,
  createStaffLogin,
  refreshVerification,
  resetStaffPassword,
  sendVerification,
  signInStaff,
  signInWithGoogle,
  signOutStaff,
  watchStaffAuth,
} from '../lib/staffAuth';
import { isUsablePhone, orderLookupKey } from '../lib/orderLookup';
import { db, startAnalytics } from '../lib/firebase';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

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
  operatingHours: '10:00 AM – 11:00 PM, daily',
  fssaiLicense: '20725038003593',
  // Rendered once the file exists; see FssaiMark.
  fssaiLogoUrl: '/fssai-logo.png',
  gstin: '',
  // Served from public/logo.png when that file exists; the drawn mark is used
  // until then, and any other URL can be set from Settings.
  logoUrl: '/logo.png',
  logoMarkUrl: '/logo-mark.png',

  upiId: '',
  upiAccountName: '',
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


/**
 * What still lives in this browser.
 *
 * Everything the shop and its customers must agree about -- the catalogue,
 * orders, coupons, banners, settings, who works here -- moved to Firestore,
 * because keeping it here is what made a customer's order invisible to the
 * admin: each device held its own private copy of the world and nothing
 * travelled between them.
 *
 * What is left is genuinely per-browser. A half-filled bag belongs to the
 * phone it was filled on, not to the shop.
 */
const STORAGE_KEYS = {
  CART: 'ovenglow_cart_v3',
  CUSTOMER: 'ovenglow_customer_v3',
} as const;

/** Firestore collection names, in one place so a typo cannot go unnoticed. */
const COL = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  BANNERS: 'banners',
  STAFF: 'staff',
  SETTINGS: 'settings',
  ORDER_LOOKUP: 'orderLookup',
} as const;

const SETTINGS_DOC = 'store';

export type { Result };

/**
 * Turn a Firestore rejection into something a shopkeeper can act on.
 *
 * `permission-denied` here almost always means the sign-in expired or the
 * account is not staff, and "Missing or insufficient permissions" tells nobody
 * that.
 */
function writeFailure(e: unknown, what: string): string {
  const code = (e as { code?: string })?.code ?? '';
  console.error(`Could not ${what}:`, e);
  if (code === 'permission-denied') {
    return `Not allowed to ${what}. Sign out and in again; if it keeps happening your account may not have that permission.`;
  }
  if (code === 'unavailable') {
    return `Could not reach the database, so the change was NOT saved. Check the connection and try again.`;
  }
  return `Could not ${what}. Please try again.`;
}

/** Firestore rejects `undefined`; the optional fields on Order are often that. */
function stripForFirestore<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v === undefined) continue;
    out[key] =
      v && typeof v === 'object' && !Array.isArray(v) && (v as object).constructor === Object
        ? stripForFirestore(v as Record<string, unknown>)
        : v;
  }
  return out as T;
}

/**
 * The next human-readable order number for today, counted in the database.
 *
 * generateOrderNumber() counted the orders this device could see, which was
 * every order back when each browser held the whole shop. A customer's phone
 * can no longer list orders at all -- deliberately -- so the count comes from a
 * server-side aggregate instead, which needs no read permission on the rows.
 *
 * Two people checking out in the same second can still land on the same number.
 * It is a label for talking to customers, not a key: the document id is what
 * identifies an order, and that is unique by construction.
 */
async function nextOrderNumber(): Promise<string> {
  const today = new Date();
  const stamp = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('');

  try {
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const todaysOrders = await getCountFromServer(
      query(collection(db, 'orders'), where('createdAt', '>=', startOfDay)),
    );
    return `OG-${stamp}-${String(todaysOrders.data().count + 1).padStart(3, '0')}`;
  } catch (e) {
    // An aggregate needs the same `list` permission a query does, which a
    // customer does not have. Falling back to a time-based suffix keeps
    // checkout working; the number stays unique enough to quote on WhatsApp.
    console.warn('Could not count today\u2019s orders; using a time-based number.', e);
    const since = today.getHours() * 3600 + today.getMinutes() * 60 + today.getSeconds();
    return `OG-${stamp}-${String(since % 1000).padStart(3, '0')}`;
  }
}

/** The storefront's top-level views. */
export type AppTab = 'shop' | 'signature' | 'track' | 'admin';

/**
 * How staff reach the admin now that the storefront does not advertise it.
 *
 * The shop asked for the admin not to be shown to customers, so the Staff
 * button is gone from the navigation, the phone's tab bar and the footer. That
 * removes the only ways in, so the address becomes the way in:
 *
 *     https://ovenglowdelights.com/#staff
 *
 * Worth being clear about what this is and is not. It is not a secret and it is
 * not security -- anyone can type it, and the sign-in screen is what stops them
 * going further. What stops them reading anything is firestore.rules. This is
 * housekeeping: customers should not be invited to a door that is not for them.
 *
 * Several spellings are accepted because the one a person remembers six months
 * from now is not predictable.
 */
const ADMIN_HASHES = ['#staff', '#admin', '#console', '#login'];

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
  addProduct: (p: Omit<Product, 'id'>) => Promise<Result>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Result>;
  deleteProduct: (id: string) => Promise<void>;
  bulkSetPublished: (ids: string[], isPublished: boolean) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  /** True until the catalogue has arrived from the database. */
  productsReady: boolean;
  findDuplicateSkus: () => string[];

  // Orders
  orders: Order[];
  /** False until the admin's order list has loaded. Empty means empty, not loading. */
  ordersReady: boolean;
  createOrder: (customer: CustomerDetails, paymentMethod: PaymentMethod) => Promise<Order>;
  advanceOrderStage: (orderId: string, to: OrderStage, note?: string) => Promise<Result>;
  submitUpiReference: (orderId: string, reference: string) => Promise<Result>;
  verifyPayment: (orderId: string, note?: string) => Promise<Result>;
  rejectPayment: (orderId: string, reason: string) => Promise<Result>;

  /**
   * The one order a customer is looking at on the tracking page.
   *
   * Staff read orders straight out of `orders`. A customer cannot: listing
   * orders is staff-only, precisely so that nobody can walk the customer base.
   * They reach exactly one order, by proving they know its number AND the phone
   * it was placed with, and it arrives here.
   */
  trackedOrder: Order | null;
  findOrder: (orderNumber: string, phone: string) => Promise<Result>;
  clearTrackedOrder: () => void;
  /** True while findOrder is waiting on the database. */
  isFindingOrder: boolean;

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
  addCoupon: (c: Omit<Coupon, 'id' | 'createdAt' | 'timesUsed'>) => Promise<Result>;
  updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;

  // Banners
  banners: Banner[];
  addBanner: (b: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (id: string, updates: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;

  // Storefront view state
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
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
  updateStoreSettings: (updates: Partial<StoreSettings>) => Promise<void>;

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
  loginAsStaff: (email: string, password: string) => Promise<Result>;
  loginAsStaffWithGoogle: () => Promise<Result>;
  logoutStaff: () => Promise<void>;
  addStaff: (name: string, email: string, role: StaffRole, password: string) => Promise<Result>;
  updateStaff: (id: string, updates: Partial<StaffUser>) => Promise<Result>;
  removeStaff: (id: string) => Promise<Result>;
  hasPermission: (permission: Permission) => boolean;
  sendStaffPasswordReset: (email: string) => Promise<Result>;

  /**
   * Sign-in is settled and we know whether anyone is signed in. The admin shows
   * nothing until this is true, so a signed-in admin never sees the login
   * screen flash past while Firebase restores the session.
   */
  authReady: boolean;
  /**
   * Set when the signed-in account has not confirmed its email address. The two
   * owner addresses get their powers from the security rules only once the
   * address is verified, so the admin has to be able to say so and offer to
   * send the link again.
   */
  needsEmailVerification: boolean;
  resendVerification: () => Promise<Result>;
  recheckVerification: () => Promise<boolean>;

  /** Non-empty when the last write to the database failed. */
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

  /* ------------------------------------------------------ who is signed in -- */

  /**
   * Firebase owns the session now, not localStorage.
   *
   * The old admin kept `currentStaff` in browser storage, which meant anyone
   * who could open devtools could type themselves a Super Admin role and the
   * app would believe it. Firebase holds a signed token instead, and every
   * security rule asks Firebase rather than the browser -- so editing
   * localStorage now achieves exactly nothing.
   */
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    startAnalytics();
    return watchStaffAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
  }, []);

  const signedIn = authUser !== null;

  /* ------------------------------------------------------------ live data -- */

  // The catalogue, the banners, the coupons and the shop's settings are
  // world-readable, so they load for a visitor who has never signed in. Orders
  // and the staff list are not: subscribing to them while signed out would only
  // earn a permission error on every page load of the public shop.
  const productsLive = useLiveCollection<Product>(COL.PRODUCTS);
  const couponsLive = useLiveCollection<Coupon>(COL.COUPONS);
  const bannersLive = useLiveCollection<Banner>(COL.BANNERS);
  /**
   * The signed-in person's own staff record, read on its own.
   *
   * This used to come out of the full staff list, which meant the list had to
   * be readable by anyone signed in -- and once Google sign-in was switched on,
   * "anyone signed in" became anyone on earth with a Gmail address, who could
   * then read every colleague's name, address and role.
   *
   * Reading one document by id breaks that: the rules can allow you your own
   * record and nobody else's, and the list becomes staff-only.
   */
  const myStaffLive = useLiveDoc<StaffUser | null>(
    COL.STAFF,
    authUser?.uid ?? '',
    null,
    signedIn,
  );
  const settingsLive = useLiveDoc<StoreSettings>(
    COL.SETTINGS,
    SETTINGS_DOC,
    DEFAULT_STORE_SETTINGS,
  );

  const products = productsLive.items;
  const coupons = couponsLive.items;
  const banners = bannersLive.items;
  const storeSettings = settingsLive.value;

  /**
   * The signed-in person as the admin understands them.
   *
   * Normally this is their `staff/{uid}` record. The two owner addresses are a
   * deliberate exception: the security rules treat them as Super Admins
   * whatever the database says, because otherwise the very first sign-in could
   * not write the very first staff record. Mirroring that here means the admin
   * lets them in on the same terms the database will.
   */
  const currentStaff = useMemo<StaffUser | null>(() => {
    if (!authUser?.email) return null;
    const email = authUser.email.toLowerCase();
    const stored = myStaffLive.value;
    const record = stored ? { ...stored, id: authUser.uid } : undefined;
    if (record) {
      if (!record.isActive && !isPermanentSuperAdmin(email)) return null;
      return isPermanentSuperAdmin(email) ? { ...record, role: 'super_admin' } : record;
    }
    if (!isPermanentSuperAdmin(email)) return null;
    return {
      id: authUser.uid,
      email,
      name: authUser.displayName || 'Owner',
      role: 'super_admin',
      isActive: true,
      addedAt: new Date().toISOString(),
    };
  }, [authUser, myStaffLive.value]);

  const needsEmailVerification = signedIn && authUser?.emailVerified === false;

  /**
   * The reads that only staff are allowed.
   *
   * Gated on actually being staff rather than merely being signed in. With
   * Google enabled anyone can reach Firebase Auth, and subscribing them to
   * collections the rules will refuse would fill the console with permission
   * errors on every visit -- the kind that teach people to ignore the console.
   */
  const isStaff = currentStaff !== null;
  const ordersLive = useLiveCollection<Order>(COL.ORDERS, isStaff);
  const staffLive = useLiveCollection<StaffUser>(COL.STAFF, isStaff);

  const orders = ordersLive.items;
  const staff = staffLive.items;

  // Surface whichever read is failing, so a rules mistake shows up in the admin
  // rather than only in the console.
  useEffect(() => {
    reportStorage(
      productsLive.error ||
        ordersLive.error ||
        settingsLive.error ||
        staffLive.error ||
        myStaffLive.error ||
        couponsLive.error ||
        bannersLive.error ||
        '',
    );
  }, [
    productsLive.error,
    ordersLive.error,
    settingsLive.error,
    staffLive.error,
    myStaffLive.error,
    couponsLive.error,
    bannersLive.error,
    reportStorage,
  ]);

  /* ------------------------------------------------------ this browser only -- */

  const [cart, setCart] = usePersistentState<CartItem[]>(STORAGE_KEYS.CART, []);
  const [customerUser, setCustomerUser] = usePersistentState<CustomerUser | null>(
    STORAGE_KEYS.CUSTOMER,
    null,
  );

  const [activeTab, setActiveTab] = useState<AppTab>('shop');

  // Open the admin when the address asks for it, on load and on any later
  // change -- a bookmark, a typed address, or the back button.
  useEffect(() => {
    const apply = () => {
      if (ADMIN_HASHES.includes(window.location.hash.toLowerCase())) setActiveTab('admin');
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  // Keep the address in step, so the console can be bookmarked and a reload
  // stays where it was. `replaceState` rather than assigning to the hash: the
  // latter stacks a history entry on every tab change, which turns the back
  // button into a tour of the whole site.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onAdminUrl = ADMIN_HASHES.includes(window.location.hash.toLowerCase());
    const base = `${window.location.pathname}${window.location.search}`;
    if (activeTab === 'admin' && !onAdminUrl) {
      window.history.replaceState(null, '', `${base}#staff`);
    } else if (activeTab !== 'admin' && onAdminUrl) {
      window.history.replaceState(null, '', base);
    }
  }, [activeTab]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [deliveryPincode, setDeliveryPincode] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState<boolean>(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isFindingOrder, setIsFindingOrder] = useState(false);
  // No coupon is applied until the customer enters one.
  const [activeCouponCode, setActiveCouponCode] = useState<string | null>(null);

  /**
   * Put the shop on the shelves the first time an owner signs in.
   *
   * A brand new Firestore database is empty, and an empty catalogue means the
   * shop front says "the menu is being set up" forever. This uploads the nine
   * printed ranges, the starting coupons and banners, and the default settings
   * -- once, only when a catalogue editor is signed in to be allowed to, and
   * only into collections that are actually empty, so it can never overwrite
   * prices the shop has since set.
   */
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    if (!currentStaff || !can(currentStaff.role, 'products.edit')) return;
    // `ready` distinguishes "empty" from "not loaded yet". Seeding on the
    // latter would duplicate the entire catalogue.
    if (!productsLive.ready || !couponsLive.ready || !bannersLive.ready || !settingsLive.ready) {
      return;
    }
    seeded.current = true;

    void (async () => {
      try {
        if (products.length === 0) await putMany(COL.PRODUCTS, INITIAL_PRODUCTS);
        if (coupons.length === 0) await putMany(COL.COUPONS, INITIAL_COUPONS);
        if (banners.length === 0) await putMany(COL.BANNERS, INITIAL_BANNERS);

        const settingsDoc = await getDoc(doc(db, COL.SETTINGS, SETTINGS_DOC));
        if (!settingsDoc.exists()) {
          await setDoc(doc(db, COL.SETTINGS, SETTINGS_DOC), DEFAULT_STORE_SETTINGS);
        }
      } catch (e) {
        console.error('Could not set up the shop:', e);
        seeded.current = false;
        reportStorage('Could not load the starting catalogue. Check the Firestore rules.');
      }
    })();
  }, [
    currentStaff,
    products.length,
    coupons.length,
    banners.length,
    productsLive.ready,
    couponsLive.ready,
    bannersLive.ready,
    settingsLive.ready,
    reportStorage,
  ]);

  /* ------------------------------------------------------------ settings -- */

  const updateStoreSettings = useCallback(async (updates: Partial<StoreSettings>) => {
    await patchRecord(COL.SETTINGS, SETTINGS_DOC, updates);
  }, []);

  /* ----------------------------------------------------------- catalogue -- */

  const shopProducts = useMemo(() => products.filter(isBuyable), [products]);

  const findDuplicateSkus = useCallback(() => {
    const seen = new Map<string, number>();
    products.forEach((p) => seen.set(p.sku, (seen.get(p.sku) ?? 0) + 1));
    return [...seen.entries()].filter(([, n]) => n > 1).map(([sku]) => sku);
  }, [products]);

  const addProduct = useCallback(
    async (newProd: Omit<Product, 'id'>): Promise<Result> => {
      const sku = newProd.sku.trim();
      if (!sku) return { success: false, message: 'A product code (SKU) is required.' };
      if (products.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) {
        return { success: false, message: `Product code "${sku}" already exists.` };
      }
      try {
        await putRecord(COL.PRODUCTS, { ...newProd, sku, id: generateId('prod') });
      } catch (e) {
        return { success: false, message: writeFailure(e, 'add that product') };
      }
      return { success: true, message: `"${newProd.name}" added to the catalogue.` };
    },
    [products],
  );

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>): Promise<Result> => {
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
      try {
        await patchRecord(COL.PRODUCTS, id, updates as Record<string, unknown>);
      } catch (e) {
        return { success: false, message: writeFailure(e, 'save that change') };
      }
      return { success: true, message: 'Saved.' };
    },
    [products],
  );

  const deleteProduct = useCallback(async (id: string) => {
    await removeRecord(COL.PRODUCTS, id);
  }, []);

  const bulkSetPublished = useCallback(async (ids: string[], isPublished: boolean) => {
    await patchMany(COL.PRODUCTS, ids, { isPublished });
  }, []);

  const bulkDelete = useCallback(async (ids: string[]) => {
    await removeMany(COL.PRODUCTS, ids);
  }, []);

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
    async (c: Omit<Coupon, 'id' | 'createdAt' | 'timesUsed'>): Promise<Result> => {
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
      try {
        await putRecord(COL.COUPONS, {
          ...c,
          code,
          id: generateId('coupon'),
          createdAt: new Date().toISOString(),
          timesUsed: 0,
        });
      } catch (e) {
        return { success: false, message: writeFailure(e, 'create that coupon') };
      }
      return { success: true, message: `Coupon ${code} created.` };
    },
    [coupons],
  );

  const updateCoupon = useCallback(async (id: string, updates: Partial<Coupon>) => {
    await patchRecord(COL.COUPONS, id, updates as Record<string, unknown>);
  }, []);

  const deleteCoupon = useCallback(async (id: string) => {
    await removeRecord(COL.COUPONS, id);
  }, []);

  /* ------------------------------------------------------------ banners -- */

  const addBanner = useCallback(async (b: Omit<Banner, 'id'>) => {
    await putRecord(COL.BANNERS, { ...b, id: generateId('banner') });
  }, []);

  const updateBanner = useCallback(async (id: string, updates: Partial<Banner>) => {
    await patchRecord(COL.BANNERS, id, updates as Record<string, unknown>);
  }, []);

  const deleteBanner = useCallback(async (id: string) => {
    await removeRecord(COL.BANNERS, id);
  }, []);

  /* ------------------------------------------------------------- orders -- */

  const createOrder = useCallback(
    async (customer: CustomerDetails, paymentMethod: PaymentMethod): Promise<Order> => {
      const partners = [
        { name: 'Ovenglow Delivery', vehicleNumber: 'Own rider' },
        { name: 'Ovenglow Delivery', vehicleNumber: 'Own rider' },
        { name: 'Local Courier', vehicleNumber: 'Courier partner' },
      ];
      const partner = partners[Math.floor(Math.random() * partners.length)];
      const now = new Date().toISOString();

      // Firestore issues the document id, and it has to be unguessable: it is
      // the only thing protecting an order from being read by a stranger who
      // has the number. `generateId('ord')` produced something predictable.
      const ref = doc(collection(db, COL.ORDERS));

      const order: Order = {
        id: ref.id,
        // Numbering off `orders` only worked when this device could see every
        // order, which a customer's phone cannot. Counting today's orders in
        // the database keeps the human-readable number sequential.
        orderNumber: await nextOrderNumber(),
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

      // Stock and coupon counts used to be adjusted here. They cannot be: the
      // catalogue is staff-writable only, and a customer at checkout is not
      // signed in. Opening `products` to anonymous writes so a cart could
      // decrement it would let anyone zero the shop's entire stock.
      //
      // They move to the moment staff confirm the order instead, which is also
      // the more honest reading: an unconfirmed enquiry should not be eating
      // stock the shop has not agreed to sell.
      const { id: _ignored, ...body } = order;
      await setDoc(ref, stripForFirestore(body));

      // How the customer finds this again: the hash of their order number and
      // their phone number, holding the id that was just generated. Written
      // second, so a failure here cannot leave an order number pointing at
      // nothing.
      try {
        await setDoc(
          doc(db, COL.ORDER_LOOKUP, await orderLookupKey(order.orderNumber, customer.phone)),
          { orderId: ref.id },
        );
      } catch (e) {
        // The order is placed and the shop can see it; only self-service
        // tracking is affected, and WhatsApp still reaches us.
        console.error('Could not write the tracking lookup:', e);
      }

      setCart([]);
      setActiveCouponCode(null);
      setTrackedOrder(order);
      return order;
    },
    [cart, totals, activeCoupon, storeSettings.phone],
  );

  /**
   * Book the stock and the coupon use for an order the shop has just accepted.
   *
   * Runs on confirmation rather than at checkout, because only staff may write
   * the catalogue -- and because an enquiry nobody has agreed to bake should
   * not be holding stock. Failures are logged and swallowed: the order is
   * already confirmed, and refusing the confirmation because a stock counter
   * would not move would be the worse outcome.
   */
  const bookStockAndCoupon = useCallback(
    async (order: Order) => {
      try {
        await Promise.all(
          order.items.map((line) => {
            const live = products.find((p) => p.id === line.product.id);
            if (!live) return Promise.resolve();
            return patchRecord(COL.PRODUCTS, live.id, {
              stockCount: Math.max(0, live.stockCount - line.quantity),
            });
          }),
        );

        if (order.couponCode) {
          const coupon = coupons.find((c) => c.code === order.couponCode);
          if (coupon) {
            await patchRecord(COL.COUPONS, coupon.id, { timesUsed: coupon.timesUsed + 1 });
          }
        }
      } catch (e) {
        console.error('Could not book stock for', order.orderNumber, e);
      }
    },
    [products, coupons],
  );

  /** The single door every stage change goes through. */
  const applyStageChange = useCallback(
    async (
      orderId: string,
      to: OrderStage,
      note: string,
      by: string,
      patch?: (o: Order) => Partial<Order>,
    ): Promise<Result> => {
      // Staff work from the live list. A customer submitting a UPI reference
      // has only the one order they are tracking, which is not in it.
      const order =
        orders.find((o) => o.id === orderId || o.orderNumber === orderId) ??
        (trackedOrder && (trackedOrder.id === orderId || trackedOrder.orderNumber === orderId)
          ? trackedOrder
          : undefined);
      if (!order) return { success: false, message: 'Order not found.' };
      if (!canTransition(order, to)) {
        return {
          success: false,
          message: `An order at "${STAGES[order.stage].label}" cannot move to "${STAGES[to].label}".`,
        };
      }

      const at = new Date().toISOString();
      const next: Order = {
        ...order,
        ...(patch ? patch(order) : {}),
        stage: to,
        updatedAt: at,
        stageHistory: [...order.stageHistory, { stage: to, at, by, note }],
      };

      try {
        const { id: _ignored, ...body } = next;
        await setDoc(doc(db, COL.ORDERS, order.id), stripForFirestore(body));
      } catch (e) {
        return { success: false, message: writeFailure(e, `move order ${order.orderNumber}`) };
      }

      // The customer's own copy is not fed by a listener, so it is refreshed
      // here; staff get the change from onSnapshot.
      setTrackedOrder((prev) => (prev && prev.id === order.id ? next : prev));

      // Confirming an order is the point at which the shop commits to baking
      // it, so that is where stock and coupon use are booked.
      if (to === 'confirmed') void bookStockAndCoupon(next);

      return { success: true, message: `Order ${order.orderNumber} moved to ${STAGES[to].label}.` };
    },
    [orders, trackedOrder],
  );

  const advanceOrderStage = useCallback(
    async (orderId: string, to: OrderStage, note?: string): Promise<Result> => {
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
    async (orderId: string, reference: string): Promise<Result> => {
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
    async (orderId: string, note?: string): Promise<Result> => {
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
    async (orderId: string, reason: string): Promise<Result> => {
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
   * Find one order, given its number and the phone it was placed with.
   *
   * This used to search the local order list by number alone. That list was
   * every order the shop had ever taken, sitting in the customer's browser, and
   * the numbers run in sequence -- so anyone could read anyone's address by
   * counting. Now a customer's browser holds no orders at all, and finding one
   * means proving you know both halves: the hash of number and phone is the
   * only route to the document id.
   */
  const findOrder = useCallback(
    async (orderNumber: string, phone: string): Promise<Result> => {
      const number = orderNumber.trim();
      if (!number) return { success: false, message: 'Enter your order number.' };
      if (!isUsablePhone(phone)) {
        return { success: false, message: 'Enter the 10-digit mobile number you ordered with.' };
      }

      // Staff already have every order; no need to make them type a phone.
      const mine = orders.find(
        (o) => o.orderNumber.toLowerCase() === number.toLowerCase() || o.id === number,
      );
      if (mine) {
        setTrackedOrder(mine);
        return { success: true, message: `Order ${mine.orderNumber}.` };
      }

      setIsFindingOrder(true);
      try {
        const key = await orderLookupKey(number, phone);
        const pointer = await getDoc(doc(db, COL.ORDER_LOOKUP, key));
        if (!pointer.exists()) {
          return {
            success: false,
            message:
              'No order matches that number and mobile number. Check both, or message us on WhatsApp.',
          };
        }

        const snap = await getDoc(doc(db, COL.ORDERS, pointer.data().orderId as string));
        if (!snap.exists()) {
          return { success: false, message: 'That order could not be found. Please message us.' };
        }

        const found = { ...(snap.data() as Order), id: snap.id };
        setTrackedOrder(found);
        return { success: true, message: `Order ${found.orderNumber}.` };
      } catch (e) {
        return { success: false, message: writeFailure(e, 'look up that order') };
      } finally {
        setIsFindingOrder(false);
      }
    },
    [orders],
  );

  const clearTrackedOrder = useCallback(() => setTrackedOrder(null), []);

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

  /**
   * Sign in with a password.
   *
   * The old version took an email and nothing else, checked it against a list
   * the browser itself held, and wrote the resulting "session" to localStorage.
   * The login screen printed every staff address as a button, so becoming a
   * Super Admin took two clicks. Firebase checks the password now, and the
   * session is a signed token this code cannot forge.
   */
  const loginAsStaff = useCallback(
    async (email: string, password: string): Promise<Result> => {
      if (!email.trim()) return { success: false, message: 'Enter your email address.' };
      if (!password) return { success: false, message: 'Enter your password.' };
      return signInStaff(email, password);
    },
    [],
  );

  const loginAsStaffWithGoogle = useCallback(() => signInWithGoogle(), []);

  const logoutStaff = useCallback(async () => {
    await signOutStaff();
  }, []);

  const sendStaffPasswordReset = useCallback((email: string) => resetStaffPassword(email), []);

  const resendVerification = useCallback(() => sendVerification(), []);

  const recheckVerification = useCallback(() => refreshVerification(), []);

  /**
   * Add a colleague: a login they can use, and the record that gives it meaning.
   *
   * Both halves are needed. A Firebase account on its own grants nothing,
   * because every security rule reads `staff/{uid}`; the record on its own
   * cannot be signed in to. The document id is deliberately the Firebase uid,
   * so the rules can look someone up straight from their token.
   */
  const addStaff = useCallback(
    async (name: string, email: string, role: StaffRole, password: string): Promise<Result> => {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanName) return { success: false, message: 'Enter the staff member’s full name.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { success: false, message: 'Enter a valid email address.' };
      }
      if (password.length < 6) {
        return { success: false, message: 'Give them a password of at least six characters.' };
      }
      if (staff.some((s) => s.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'That email already has an account.' };
      }

      const created = await createStaffLogin(cleanEmail, password);
      if (!created.success || !created.uid) return created;

      try {
        await putRecord(COL.STAFF, {
          id: created.uid,
          name: cleanName,
          email: cleanEmail,
          role,
          isActive: true,
          addedAt: new Date().toISOString(),
        });
      } catch (e) {
        return { success: false, message: writeFailure(e, 'save that staff record') };
      }

      return {
        success: true,
        message: `${cleanName} added. Give them the password you set and ask them to change it.`,
      };
    },
    [staff],
  );

  const updateStaff = useCallback(
    async (id: string, updates: Partial<StaffUser>): Promise<Result> => {
      const target = staff.find((s) => s.id === id);
      if (!target) return { success: false, message: 'Staff member not found.' };
      if (isPermanentSuperAdmin(target.email) && (updates.role || updates.isActive === false)) {
        return {
          success: false,
          message: 'This owner account is a permanent Super Admin and cannot be changed.',
        };
      }
      try {
        await patchRecord(COL.STAFF, id, updates as Record<string, unknown>);
      } catch (e) {
        return { success: false, message: writeFailure(e, 'update that staff account') };
      }
      return { success: true, message: 'Staff account updated.' };
    },
    [staff],
  );

  const removeStaff = useCallback(
    async (id: string): Promise<Result> => {
      const target = staff.find((s) => s.id === id);
      if (!target) return { success: false, message: 'Staff member not found.' };
      if (isPermanentSuperAdmin(target.email)) {
        return { success: false, message: 'This owner account cannot be removed.' };
      }
      if (staff.filter((s) => s.role === 'super_admin' && s.isActive).length <= 1 && target.role === 'super_admin') {
        return { success: false, message: 'At least one Super Admin must remain.' };
      }
      try {
        await removeRecord(COL.STAFF, id);
      } catch (e) {
        return { success: false, message: writeFailure(e, 'remove that staff account') };
      }
      // Their Firebase login still exists and can still be signed in to; with
      // no staff record it now grants nothing, because every rule refuses it.
      return {
        success: true,
        message: `${target.name} removed. Their login no longer has any access.`,
      };
    },
    [staff],
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
    productsReady: productsLive.ready,

    orders,
    ordersReady: ordersLive.ready,
    createOrder,
    advanceOrderStage,
    submitUpiReference,
    verifyPayment,
    rejectPayment,
    trackedOrder,
    findOrder,
    clearTrackedOrder,
    isFindingOrder,

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
    loginAsStaffWithGoogle,
    logoutStaff,
    sendStaffPasswordReset,
    authReady,
    needsEmailVerification,
    resendVerification,
    recheckVerification,
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
