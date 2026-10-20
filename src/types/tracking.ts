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
  | 'coupon_applied'
  | 'click'
  | 'heartbeat';

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
  // Visit attribution (computed from the landing referrer / UTMs of the session)
  landingUrl?: string;
  landingReferrer?: string;
  trafficChannel?: string;
  trafficSource?: string;
  // Click details (eventName === 'click')
  click?: {
    label: string;
    tag: string;
    href?: string;
    x: number;
    y: number;
  };
  // Seconds spent on the site since the session started
  secondsOnSite?: number;
  // Browser identifiers used by Meta/TikTok to match server events
  fbp?: string;
  fbc?: string;
  ttp?: string;
  // TikTok click ID from the URL or the first-party cookie of an earlier ad click
  ttclid?: string;
  // Cookie banner choice: advertising pixels and Conversions APIs are skipped when denied
  adConsent?: 'granted' | 'denied' | 'pending';
  // Customer data, only sent with conversion events (hashed server-side, never stored)
  customer?: {
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
  };
  // Browser pixels that actually received the event
  dispatchedTo: {
    browserGA4: boolean;
    browserMetaPixel: boolean;
    browserTikTokPixel: boolean;
  };
  // Server-side Conversions API results (filled by the server)
  serverDispatch?: Record<string, ServerDispatchStatus>;
  // DEDUPLICATED = sent by both browser pixel and server with the same event_id
  deduplicationStatus: 'DEDUPLICATED' | 'BROWSER_ONLY' | 'SERVER_ONLY';
  ipAddress?: string;
  userAgent?: string;
  receivedAt?: string;
}

export type ServerDispatchStatus = 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'SKIPPED';

export interface TrackingStats {
  range: string;
  generatedAt: string;
  uniqueVisitors: number;
  sessions: number;
  pageViews: number;
  clicks: number;
  liveVisitors: number;
  avgSessionSeconds: number;
  bounceRatePercent: number;
  purchases: number;
  revenue: number;
  conversionRatePercent: number;
  channels: Array<{ channel: string; label: string; sessions: number; visitors: number; purchases: number; revenue: number }>;
  sources: Array<{ source: string; channel: string; sessions: number; visitors: number; purchases: number }>;
  referrers: Array<{ host: string; sessions: number }>;
  topPages: Array<{ path: string; views: number }>;
  topClicks: Array<{ label: string; page: string; count: number; lastAt: string }>;
  devices: Array<{ device: string; sessions: number }>;
  timeline: Array<{ bucket: string; visitors: number; pageViews: number; clicks: number }>;
  liveSessions: Array<{ sessionId: string; source: string; channel: string; page: string; device: string; secondsOnSite: number; lastSeenAt: string; events: number }>;
  serverDispatch: Record<string, { sent: number; failed: number; notConfigured: number }>;
  configured: { meta: boolean; tiktok: boolean; snapchat: boolean };
}
