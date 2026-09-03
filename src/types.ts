export interface Product {
  id: string;
  name: string;
  hindiSubname?: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  category: 'artisanal-chocolates' | 'truffles-bonbons' | 'gourmet-cakes' | 'bakery-pastries' | 'festive-hampers';
  image: string;
  secondaryImages: string[];
  inStock: boolean;
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

export interface CartItem {
  product: Product;
  quantity: number;
  customMessage?: string;
}

export type OrderStatus = 
  | 'Placed' 
  | 'Confirmed' 
  | 'Baking' 
  | 'Packed' 
  | 'OutForDelivery' 
  | 'Delivered' 
  | 'Cancelled';

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
  currentLat?: number;
  currentLng?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerDetails;
  items: CartItem[];
  itemTotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending' | 'COD';
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  deliveryPartner: DeliveryPartner;
  estimatedDeliveryTime: string;
  deliveryOtp: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  itemsSold: number;
  categoryRevenue: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  statusCounts: Record<OrderStatus, number>;
  dailySales: {
    date: string;
    revenue: number;
    orders: number;
  }[];
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
  upiId: string;
  deliveryRadiusKm: number;
  deliveryAreas: { name: string; pin: string }[];
}

export interface CustomerUser {
  phone: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  isVerified: boolean;
  loggedInAt: string;
}

export interface OwnerUser {
  id?: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  addedAt?: string;
}

export const AUTHORIZED_OWNER_EMAILS = [
  'ovenglowdelights@gmail.com',
  'shivaminfotech89@gmail.com'
];
