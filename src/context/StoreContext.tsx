import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Order, OrderStatus, PaymentMethod, CustomerDetails, CustomerUser, SalesReport, OwnerUser, StoreSettings, AUTHORIZED_OWNER_EMAILS } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { INITIAL_ORDERS } from '../data/initialOrders';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Ovenglow Artisanal Confections',
  tagline: 'Handcrafted Pure Cocoa Butter Chocolates & Gourmet Pastries',
  address: '',
  city: 'Ahmedabad',
  state: 'Gujarat',
  pincode: '',
  landmark: '',
  phone: '',
  whatsappNumber: '',
  email: 'ovenglowdelights@gmail.com',
  operatingHours: '10:00 AM – 11:00 PM (Daily Fresh Baking)',
  fssaiLicense: '',
  upiId: '',
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
    { name: 'Maninagar', pin: '380008' }
  ]
};

const DEFAULT_ADMINS: OwnerUser[] = [
  {
    id: 'admin-1',
    email: 'shivaminfotech89@gmail.com',
    name: 'Executive Administrator',
    role: 'Full Administrative Control (All Powers)',
    addedAt: '2026-01-01'
  },
  {
    id: 'admin-2',
    email: 'ovenglowdelights@gmail.com',
    name: 'Executive Co-Owner',
    role: 'Full Administrative Control (All Powers)',
    addedAt: '2026-01-01'
  }
];

interface StoreContextType {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  activeTab: 'shop' | 'track' | 'admin';
  setActiveTab: (tab: 'shop' | 'track' | 'admin') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isVegOnly: boolean;
  setIsVegOnly: (veg: boolean) => void;
  deliveryPincode: string;
  setDeliveryPincode: (pin: string) => void;
  
  // Store Settings (Admin Editable)
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;

  // Cart Actions
  addToCart: (product: Product, quantity?: number, note?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  activeCoupon: string | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Checkout & Orders
  createOrder: (customer: CustomerDetails, paymentMethod: PaymentMethod) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  activeTrackingId: string | null;
  setActiveTrackingId: (id: string | null) => void;
  getOrderById: (orderIdOrNumber: string) => Order | undefined;

  // Customer Mobile Authentication (No OTP required)
  customerUser: CustomerUser | null;
  loginWithMobile: (phone: string, name?: string, address?: string, pincode?: string) => { success: boolean; message: string };
  logoutCustomer: () => void;
  updateCustomerProfile: (updates: Partial<CustomerUser>) => void;
  isCustomerAuthOpen: boolean;
  setIsCustomerAuthOpen: (open: boolean) => void;

  // Owner / Admin Authentication & Management
  ownerUser: OwnerUser | null;
  loginAsOwner: (email?: string) => { success: boolean; message: string };
  logoutOwner: () => void;
  admins: OwnerUser[];
  addAdmin: (name: string, email: string, role?: string) => { success: boolean; message: string };
  removeAdmin: (email: string) => { success: boolean; message: string };
  authorizedOwnerEmails: string[];

  // Admin Product CRUD
  addProduct: (newProd: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // WhatsApp Messaging Helpers
  getWhatsAppOrderLink: (order: Order, phone?: string) => string;
  getWhatsAppSupportLink: (topic?: string) => string;

  // Analytics
  getAnalytics: () => SalesReport;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'ovenglow_products_v1',
  ORDERS: 'ovenglow_orders_v1',
  CART: 'ovenglow_cart_v1',
  PINCODE: 'ovenglow_pincode_v1',
  OWNER: 'ovenglow_owner_v1',
  CUSTOMER: 'ovenglow_customer_v1',
  SETTINGS: 'ovenglow_settings_v1',
  ADMINS: 'ovenglow_admins_v1'
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load store settings (Admin controlled, defaults to Ahmedabad)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!saved) return DEFAULT_STORE_SETTINGS;
      const parsed = JSON.parse(saved);
      // Clean out any previously injected dummy street address, fake numbers, or fake FSSAI
      if (parsed.address && (parsed.address.includes('Gala Empire') || parsed.address.includes('Bandra'))) {
        parsed.address = '';
      }
      if (parsed.phone && parsed.phone.includes('98250')) {
        parsed.phone = '';
      }
      if (parsed.whatsappNumber && parsed.whatsappNumber.includes('9825012345')) {
        parsed.whatsappNumber = '';
      }
      if (parsed.fssaiLicense === '10724026000189' || parsed.fssaiLicense === '11524998000142') {
        parsed.fssaiLicense = '';
      }
      if (parsed.upiId === 'ovenglow@okhdfcbank') {
        parsed.upiId = '';
      }
      if (parsed.landmark && parsed.landmark.includes('Vastrapur Lake')) {
        parsed.landmark = '';
      }
      return { ...DEFAULT_STORE_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_STORE_SETTINGS;
    }
  });

  const updateStoreSettings = (updates: Partial<StoreSettings>) => {
    setStoreSettings((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
  };

  // Load products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Load real orders - strip any old mock/imaginary orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out imaginary mock orders with ord-100 IDs
        const real = parsed.filter((o: Order) => !o.id?.startsWith('ord-100'));
        return real;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Load cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'shop' | 'track' | 'admin'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [deliveryPincode, setDeliveryPincode] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.PINCODE) || '380054 - Ahmedabad (Express)';
  });
  const [activeCoupon, setActiveCoupon] = useState<string | null>('FESTIVE15');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);

  // Customer mobile authentication state (Direct login, no OTP required)
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState<boolean>(false);

  const loginWithMobile = (phone: string, name?: string, address?: string, pincode?: string) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' };
    }
    const customer: CustomerUser = {
      phone: cleanPhone,
      name: name && name.trim() ? name.trim() : `Customer (+91 ${cleanPhone.slice(0, 5)}...)`,
      address: address || '',
      pincode: pincode || storeSettings.pincode,
      city: storeSettings.city,
      isVerified: true,
      loggedInAt: new Date().toISOString()
    };
    setCustomerUser(customer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(customer));
    return { success: true, message: `Welcome ${customer.name}! Logged in successfully.` };
  };

  const logoutCustomer = () => {
    setCustomerUser(null);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER);
  };

  const updateCustomerProfile = (updates: Partial<CustomerUser>) => {
    setCustomerUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(updated));
      return updated;
    });
  };

  // Dynamic Admin Team Management (Empower admin to add/remove admins)
  const [admins, setAdmins] = useState<OwnerUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMINS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_ADMINS;
    } catch {
      return DEFAULT_ADMINS;
    }
  });

  const addAdmin = (name: string, email: string, role = 'Full Administrative Control (All Powers)') => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!name.trim()) {
      return { success: false, message: 'Please enter the admin full name.' };
    }
    if (admins.some(a => a.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'This email is already an authorized administrator.' };
    }

    const newAdmin: OwnerUser = {
      id: `admin-${Date.now()}`,
      email: cleanEmail,
      name: name.trim(),
      role: role.trim() || 'Full Administrative Control (All Powers)',
      addedAt: new Date().toISOString()
    };

    const updated = [...admins, newAdmin];
    setAdmins(updated);
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(updated));
    return { success: true, message: `Administrator "${newAdmin.name}" added successfully.` };
  };

  const removeAdmin = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (admins.length <= 1) {
      return { success: false, message: 'Cannot remove the last remaining administrator.' };
    }
    const updated = admins.filter(a => a.email.toLowerCase() !== cleanEmail);
    setAdmins(updated);
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(updated));
    if (ownerUser && ownerUser.email.toLowerCase() === cleanEmail) {
      logoutOwner();
    }
    return { success: true, message: 'Administrator access removed successfully.' };
  };

  // Owner authentication state (Unified Common Admin Access)
  const [ownerUser, setOwnerUser] = useState<OwnerUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OWNER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loginAsOwner = (email?: string) => {
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : (admins[0]?.email || 'shivaminfotech89@gmail.com');
    const matched = admins.find(a => a.email.toLowerCase() === cleanEmail);

    if (matched) {
      const user: OwnerUser = {
        ...matched,
        role: 'Full Administrative Control (All Powers)'
      };
      setOwnerUser(user);
      localStorage.setItem(STORAGE_KEYS.OWNER, JSON.stringify(user));
      return { success: true, message: `Authenticated as ${user.name} with full administrative powers.` };
    } else if (cleanEmail === 'shivaminfotech89@gmail.com' || cleanEmail === 'ovenglowdelights@gmail.com') {
      const user: OwnerUser = {
        email: cleanEmail,
        name: 'Executive Administrator',
        role: 'Full Administrative Control (All Powers)'
      };
      setOwnerUser(user);
      localStorage.setItem(STORAGE_KEYS.OWNER, JSON.stringify(user));
      return { success: true, message: 'Authenticated with full administrative powers.' };
    } else {
      return {
        success: false,
        message: 'Unauthorized email. Only official administrators registered in Ovenglow have access.'
      };
    }
  };

  const logoutOwner = () => {
    setOwnerUser(null);
    localStorage.removeItem(STORAGE_KEYS.OWNER);
  };

  // Persist products
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }, [products]);

  // Persist orders
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }, [orders]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }, [cart]);

  // Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('ovenglow_sync_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'ORDER_UPDATED' || event.data?.type === 'ORDER_CREATED') {
          const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
          if (savedOrders) {
            setOrders(JSON.parse(savedOrders));
          }
        } else if (event.data?.type === 'PRODUCTS_UPDATED') {
          const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
          if (savedProducts) {
            setProducts(JSON.parse(savedProducts));
          }
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel not supported in current environment', err);
    }

    return () => {
      channel?.close();
    };
  }, []);

  const notifySync = (type: string) => {
    try {
      const channel = new BroadcastChannel('ovenglow_sync_channel');
      channel.postMessage({ type, timestamp: Date.now() });
      channel.close();
    } catch {
      // Ignore fallback
    }
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, note?: string) => {
    if (product.stockCount <= 0) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + quantity, product.stockCount);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          customMessage: note || updated[existingIndex].customMessage
        };
        return updated;
      } else {
        return [...prev, { product, quantity: Math.min(quantity, product.stockCount), customMessage: note }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stockCount;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setActiveCoupon(null);
  };

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'FESTIVE15') {
      setActiveCoupon('FESTIVE15');
      return { success: true, message: '🎉 15% Festive discount applied successfully!' };
    }
    if (clean === 'OVENGLOW100') {
      setActiveCoupon('OVENGLOW100');
      return { success: true, message: '🍫 ₹100 Gourmet Treat discount applied!' };
    }
    if (clean === 'SWEET20') {
      setActiveCoupon('SWEET20');
      return { success: true, message: '✨ 20% Luxury Bakery discount applied!' };
    }
    return { success: false, message: 'Invalid coupon code. Try FESTIVE15 or OVENGLOW100' };
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
  };

  // Create Order
  const createOrder = (customer: CustomerDetails, paymentMethod: PaymentMethod): Order => {
    const itemTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    
    // Calculate discounts
    let discount = 0;
    if (activeCoupon === 'FESTIVE15') {
      discount = Math.round(itemTotal * 0.15);
    } else if (activeCoupon === 'OVENGLOW100') {
      discount = Math.min(itemTotal, 100);
    } else if (activeCoupon === 'SWEET20') {
      discount = Math.round(itemTotal * 0.20);
    }

    // Free delivery over ₹499
    const deliveryFee = itemTotal - discount >= 499 ? 0 : 60;
    // 5% GST for bakery/chocolates in India
    const tax = Math.round((itemTotal - discount) * 0.05);
    const totalAmount = itemTotal - discount + deliveryFee + tax;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `OG-${randomSuffix}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const deliveryPartners = [
      { name: 'Cold-Chain Express Fleet', phone: storeSettings.phone || '', vehicleNumber: 'Insulated Thermal Van' },
      { name: 'Atelier Direct Dispatch', phone: storeSettings.phone || '', vehicleNumber: 'Temperature Controlled EV' },
      { name: 'Artisanal Fresh Courier', phone: storeSettings.phone || '', vehicleNumber: 'Insulated Express Courier' },
    ];
    const partner = deliveryPartners[Math.floor(Math.random() * deliveryPartners.length)];

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customer,
      items: [...cart],
      itemTotal,
      discount,
      deliveryFee,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Paid',
      status: 'Placed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryPartner: partner,
      estimatedDeliveryTime: '30 - 45 Minutes',
      deliveryOtp: otp,
      statusHistory: [
        {
          status: 'Placed',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Order received with ${paymentMethod} payment.`
        }
      ]
    };

    // Decrement inventory stock
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = cart.find((ci) => ci.product.id === prod.id);
        if (cartItem) {
          const newStock = Math.max(0, prod.stockCount - cartItem.quantity);
          return {
            ...prod,
            stockCount: newStock,
            inStock: newStock > 0
          };
        }
        return prod;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setActiveTrackingId(newOrder.orderNumber);
    notifySync('ORDER_CREATED');

    return newOrder;
  };

  // Update order status (Admin function that notifies user & syncs real-time)
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, customNote?: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const defaultNotes: Record<OrderStatus, string> = {
            Placed: 'Order received and logged in bakery queue.',
            Confirmed: 'Order verified by Ovenglow master chef.',
            Baking: 'Chocolatier actively tempering cocoa & baking fresh in deck ovens.',
            Packed: 'Sealed in temperature-controlled thermal pack with chilled dry gel.',
            OutForDelivery: `Rider ${ord.deliveryPartner.name} has picked up package. Thermal delivery in progress.`,
            Delivered: `Delivered successfully to ${ord.customer.name}. Handed over with OTP verification.`,
            Cancelled: 'Order has been cancelled and refund initiated.'
          };

          const note = customNote || defaultNotes[newStatus];
          const newHistory = [...ord.statusHistory, { status: newStatus, timestamp, note }];

          return {
            ...ord,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            statusHistory: newHistory
          };
        }
        return ord;
      })
    );
    notifySync('ORDER_UPDATED');
  };

  // Admin Product CRUD
  const addProduct = (newProd: Omit<Product, 'id'>): Product => {
    const id = `prod-${Date.now()}`;
    const productWithId: Product = { ...newProd, id };
    setProducts((prev) => [productWithId, ...prev]);
    notifySync('PRODUCTS_UPDATED');
    return productWithId;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === id) {
          const updated = { ...prod, ...updates };
          if (updates.stockCount !== undefined) {
            updated.inStock = updates.stockCount > 0;
          }
          return updated;
        }
        return prod;
      })
    );
    notifySync('PRODUCTS_UPDATED');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    notifySync('PRODUCTS_UPDATED');
  };

  const getOrderById = (query: string): Order | undefined => {
    const clean = query.trim().toUpperCase();
    return orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === clean ||
        o.id === query ||
        o.customer.phone.replace(/\D/g, '') === query.replace(/\D/g, '')
    );
  };

  // WhatsApp helpers
  const getWhatsAppOrderLink = (order: Order, customPhone?: string): string => {
    const phone = customPhone || order.customer.phone.replace(/\D/g, '');
    const itemsList = order.items
      .map((i) => `• ${i.quantity}x ${i.product.name} (₹${i.product.price * i.quantity})`)
      .join('%0A');
    
    const message = `*🍫 OVENGLOW - DELIGHTS CRAFTED TO CRAVE*%0A%0A*Order Status Update*%0A*Order No:* #${order.orderNumber}%0A*Customer:* ${encodeURIComponent(order.customer.name)}%0A*Status:* *${order.status.toUpperCase()}*%0A*Amount:* ₹${order.totalAmount} (${order.paymentMethod} - ${order.paymentStatus})%0A%0A*Items:*%0A${itemsList}%0A%0A*Delivery Partner:* ${encodeURIComponent(order.deliveryPartner.name)}%0A*Delivery OTP:* ${order.deliveryOtp}%0A*ETA:* ${encodeURIComponent(order.estimatedDeliveryTime)}%0A%0A_Thank you for choosing Ovenglow Artisanal Chocolates & Bakery!_`;

    if (!phone) {
      return `https://wa.me/?text=${message}`;
    }
    return `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${message}`;
  };

  const getWhatsAppSupportLink = (topic = 'Order Inquiry'): string => {
    const supportPhone = storeSettings.whatsappNumber ? storeSettings.whatsappNumber.replace(/\D/g, '') : '';
    const message = encodeURIComponent(`Hello ${storeSettings.storeName} (${storeSettings.city})! I have an inquiry regarding: ${topic}`);
    if (supportPhone) {
      return `https://wa.me/${supportPhone.startsWith('91') ? supportPhone : '91' + supportPhone}?text=${message}`;
    }
    return `mailto:${storeSettings.email}?subject=${encodeURIComponent(`Ovenglow Inquiry: ${topic}`)}&body=${message}`;
  };

  // Analytics Computation
  const getAnalytics = (): SalesReport => {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const itemsSold = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const categoryRevenue: Record<string, number> = {};
    const paymentMethodBreakdown: Record<string, number> = { UPI: 0, Card: 0, Netbanking: 0, COD: 0 };
    const statusCounts: Record<OrderStatus, number> = {
      Placed: 0,
      Confirmed: 0,
      Baking: 0,
      Packed: 0,
      OutForDelivery: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    orders.forEach((ord) => {
      statusCounts[ord.status] = (statusCounts[ord.status] || 0) + 1;
      paymentMethodBreakdown[ord.paymentMethod] = (paymentMethodBreakdown[ord.paymentMethod] || 0) + ord.totalAmount;

      ord.items.forEach((item) => {
        const cat = item.product.category;
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.product.price * item.quantity;
      });
    });

    // Daily sales trend
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
    const dailySales = days.map((day, idx) => ({
      date: day,
      revenue: totalRevenue === 0 ? 0 : Math.round(totalRevenue * (0.1 + (idx * 0.15))),
      orders: totalOrders === 0 ? 0 : Math.max(1, Math.round(totalOrders * (0.1 + (idx * 0.12))))
    }));

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      itemsSold,
      categoryRevenue,
      paymentMethodBreakdown,
      statusCounts,
      dailySales
    };
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        cart,
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
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        activeCoupon,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen,
        createOrder,
        updateOrderStatus,
        activeTrackingId,
        setActiveTrackingId,
        getOrderById,
        customerUser,
        loginWithMobile,
        logoutCustomer,
        updateCustomerProfile,
        isCustomerAuthOpen,
        setIsCustomerAuthOpen,
        ownerUser,
        loginAsOwner,
        logoutOwner,
        admins,
        addAdmin,
        removeAdmin,
        authorizedOwnerEmails: admins.map(a => a.email),
        addProduct,
        updateProduct,
        deleteProduct,
        getWhatsAppOrderLink,
        getWhatsAppSupportLink,
        getAnalytics
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
