export type StandardEventName =
  | 'page_view'
  | 'view_item'
  | 'view_category'
  | 'search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'add_to_wishlist'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'purchase'
  | 'refund'
  | 'login'
  | 'sign_up'
  | 'whatsapp_click'
  | 'coupon_applied';

export interface UTMParameters {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
  ttclid?: string;
  gclid?: string;
}

export interface TrackingItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface UnifiedEventPayload {
  eventId: string; // Deterministic event ID for deduplication
  eventName: StandardEventName;
  anonymousId: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  pageUrl: string;
  pageTitle: string;
  referrer?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  utm: UTMParameters;
  currency: 'MAD' | 'EUR' | 'USD';
  value?: number;
  orderId?: string;
  items?: TrackingItem[];
  metadata?: Record<string, unknown>;
  // Dispatched destinations status
  dispatchedTo: {
    browserGA4: boolean;
    browserMetaPixel: boolean;
    serverMetaCAPI: boolean;
    tiktokAPI: boolean;
    snapchatCAPI: boolean;
    bigQueryStream: boolean;
  };
  deduplicationStatus: 'DEDUPLICATED' | 'BROWSER_ONLY' | 'SERVER_ONLY';
}
