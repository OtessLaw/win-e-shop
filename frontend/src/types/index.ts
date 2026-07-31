// ─── Shared API Response ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  lastLogin?: string;
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
}

export interface Role {
  _id: string;
  name: string;
  label: string;
  permissions: Permission[];
}

export interface Permission {
  _id: string;
  name: string;
  label: string;
  group: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface ProductImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface SizeVariant {
  size: string;
  stock: number;
  sku: string;
}

export interface ProductVariant {
  color: string;
  colorHex?: string;
  sizes: SizeVariant[];
  images: ProductImage[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  category: Category;
  brand?: Brand;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  tags: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  totalStock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFlashSale: boolean;
  flashSalePrice?: number;
  flashSaleEndsAt?: string;
  discount?: number;
  averageRating: number;
  reviewCount: number;
  soldCount: number;
  effectivePrice: number;
  createdAt: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: ProductImage;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
}

// ─── Brand ───────────────────────────────────────────────────────────────────
export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: ProductImage;
  productCount: number;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending' | 'confirmed' | 'packed' | 'shipped'
  | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';

export type PaymentMethod =
  | 'paystack_card' | 'paystack_mobile_money'
  | 'paystack_bank_transfer' | 'cash_on_delivery';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  product: string | Product;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  region: string;
  city: string;
  address: string;
  gpsAddress?: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: User | string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  deliveryMethod: 'standard' | 'express' | 'pickup';
  deliveryFee: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paystackReference?: string;
  orderStatus: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  invoiceNumber?: string;
  createdAt: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  stock: number;
}

// ─── Review ──────────────────────────────────────────────────────────────────
export interface Review {
  _id: string;
  product: string;
  user: { _id: string; name: string; avatar?: string };
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

// ─── Address ─────────────────────────────────────────────────────────────────
export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  region: string;
  city: string;
  address: string;
  gpsAddress?: string;
  isDefault: boolean;
}

// ─── Banner ──────────────────────────────────────────────────────────────────
export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: ProductImage;
  link?: string;
  ctaText?: string;
  position: 'hero' | 'promo' | 'sidebar';
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
}

// ─── Testimonial ─────────────────────────────────────────────────────────────
export interface Testimonial {
  _id: string;
  name: string;
  location?: string;
  avatar?: string;
  rating: number;
  message: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'account' | 'system' | 'stock';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────
export interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  expiresAt?: string;
  isActive: boolean;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface AnalyticsOverview {
  revenue: { total: number; today: number; thisMonth: number };
  orders: { total: number; pending: number };
  customers: { total: number; newThisMonth: number };
  products: { total: number; lowStock: number };
}

export interface SalesDataPoint {
  _id: string;  // date string
  revenue: number;
  orders: number;
}

// ─── Filter Params ────────────────────────────────────────────────────────────
export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  size?: string;
  rating?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  page?: number;
  limit?: number;
  newArrival?: boolean;
  bestSeller?: boolean;
  featured?: boolean;
  flashSale?: boolean;
}
