export type RoleName = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'PRODUCT_MANAGER' 
  | 'ORDER_MANAGER' 
  | 'MARKETING_MANAGER' 
  | 'SUPPORT' 
  | 'ANALYST';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleName;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isGuest: boolean;
  totalSpent: number;
  ordersCount: number;
  rfmRecencyScore: number;
  rfmFrequencyScore: number;
  rfmMonetaryScore: number;
  segmentLabel: 'Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'At Risk' | 'Hibernating' | 'New Customers';
  createdAt: string;
}

export interface Address {
  id: string;
  customerId: string;
  addressType: 'SHIPPING' | 'BILLING';
  fullName: string;
  phone: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  postalCode?: string;
  countryCode: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  subcategories?: Category[];
}

export interface PromoPack {
  id: string;
  quantity: number;
  title: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  isDefault?: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  title: string;
  sizeOption?: string;
  colorOption?: string;
  colorHex?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface TechnicalSpecs {
  weight?: string;
  dimensions?: string;
  warranty?: string;
  origin?: string;
  material?: string;
  batteryLife?: string;
  power?: string;
  features?: string[];
}

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  status: ProductStatus;
  isFeatured: boolean;
  isVisible: boolean;
  seoTitle?: string;
  seoDescription?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  promoPacks?: PromoPack[];
  technicalSpecs?: TechnicalSpecs;
  stockQuantity: number; // Aggregate across variants
  rating: number;
  reviewsCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementType = 
  | 'IN' 
  | 'OUT' 
  | 'ADJUSTMENT' 
  | 'RETURN' 
  | 'RESERVATION' 
  | 'RELEASE';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  variantTitle?: string;
  movementType: InventoryMovementType;
  quantityChanged: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantTitle?: string;
  price: number;
  quantity: number;
  imageUrl: string;
  maxStock: number;
}

export interface Cart {
  id: string;
  customerId?: string;
  anonymousSessionId: string;
  items: CartItem[];
  couponCode?: string;
  discountAmount: number;
  subtotal: number;
  total: number;
}

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'REFUNDED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'CREDIT_CARD' | 'BANK_TRANSFER';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantTitle?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl: string;
}

export interface WhatsAppMessage {
  id: string;
  sender: 'STORE_BOT' | 'CUSTOMER' | 'AI_BOT' | 'ADMIN';
  text: string;
  timestamp: string;
}

export interface WhatsAppConfirmation {
  isConfirmed: boolean;
  confirmedAt?: string;
  customerPhone: string;
  sentMessageText: string;
  replyMessageText: string;
  messageTimestamp: string;
  replyTimestamp: string;
  channel: 'WHATSAPP_BOT' | 'WHATSAPP_AGENT';
  needsHumanIntervention?: boolean;
  humanInterventionReason?: string;
  conversation?: WhatsAppMessage[];
}

export interface WhatsAppNotification {
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  provider: string;
  attempts: number;
  lastAttemptAt: string;
  sentAt?: string;
  messageId?: string;
  lastError?: string;
  messageText?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  currency: 'MAD' | 'EUR' | 'USD';
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  couponCode?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    country: string;
  };
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  shipment: {
    carrier: string;
    trackingNumber?: string;
    status: string;
  };
  items: OrderItem[];
  utmSource?: string;
  utmCampaign?: string;
  notes?: string;
  whatsappConfirmation?: WhatsAppConfirmation;
  whatsappNotification?: WhatsAppNotification;
  createdAt: string;
  updatedAt: string;
}

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponType;
  discountValue: number;
  minCartValue: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  status: ReviewStatus;
  isFeatured: boolean;
  adminReply?: string;
  adminRepliedAt?: string;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  ctaText: string;
  ctaUrl: string;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export type HomepageSectionType = 
  | 'HERO_BANNER' 
  | 'FEATURED_CATEGORIES' 
  | 'BEST_SELLERS' 
  | 'NEW_ARRIVALS' 
  | 'PROMOTION' 
  | 'TESTIMONIALS'
  | 'WHATSAPP_CTA';

export interface HomepageSection {
  id: string;
  sectionType: HomepageSectionType;
  title: string;
  displayOrder: number;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'APPROVE' | 'REJECT' | 'EXPORT';
  entityName: string;
  entityId: string;
  summary: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  defaultCurrency: 'MAD' | 'EUR' | 'USD';
  defaultLanguage: 'fr' | 'ar' | 'en';
  taxRatePercent: number;
  freeShippingThreshold: number;
  standardShippingFee: number;
  isFreeShippingPromoActive?: boolean;
  cityShippingRates?: Record<string, number>;
  whatsappPhoneNumber: string;
  whatsappOrderConfirmationTemplate: string;
  whatsappShippingTemplate: string;
  metaPixelId: string;
  googleAnalyticsId: string;
  tiktokPixelId: string;
  snapchatPixelId: string;
  publicDomain?: string;
}
