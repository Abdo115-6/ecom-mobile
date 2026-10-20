import { StandardEventName, UnifiedEventPayload, UTMParameters, TrackingItem } from '../types/tracking';
import { classifyTrafficSource, TrafficSource } from './trafficSource';
import { consentService, readCookie, writeCookie } from './consentService';

type EventListener = (event: UnifiedEventPayload) => void;

interface LandingInfo {
  referrer: string;
  landingUrl: string;
  utm: UTMParameters;
  startedAt: number;
  traffic: TrafficSource;
}

const FLUSH_INTERVAL_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 60000;
const MAX_HEARTBEAT_SECONDS = 60 * 60;

// Browser pixel event names for each standard event
const META_EVENT_NAMES: Partial<Record<StandardEventName, string>> = {
  page_view: 'PageView',
  view_item: 'ViewContent',
  search: 'Search',
  add_to_cart: 'AddToCart',
  add_to_wishlist: 'AddToWishlist',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
  sign_up: 'CompleteRegistration',
  whatsapp_click: 'Contact'
};

const TIKTOK_EVENT_NAMES: Partial<Record<StandardEventName, string>> = {
  view_item: 'ViewContent',
  search: 'Search',
  add_to_cart: 'AddToCart',
  add_to_wishlist: 'AddToWishlist',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'CompletePayment',
  sign_up: 'CompleteRegistration',
  whatsapp_click: 'Contact'
};

const WHATSAPP_LINK = /(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|whatsapp:\/\/)/i;
const NINETY_DAYS = 60 * 60 * 24 * 90;

function newId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : Math.random().toString(36).substring(2, 12);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

class MarketingTrackingService {
  private anonymousId: string;
  private sessionId: string;
  private landing: LandingInfo;
  private eventHistory: UnifiedEventPayload[] = [];
  private listeners: Set<EventListener> = new Set();
  private queue: UnifiedEventPayload[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPageView: { url: string; at: number; payload: UnifiedEventPayload } | null = null;
  // Pixel events fired before the visitor answers the cookie banner (sent with their original event_id on accept)
  private pendingPixelEvents: Array<{ payload: UnifiedEventPayload; items?: TrackingItem[] }> = [];

  constructor() {
    this.anonymousId = this.getOrCreateAnonymousId();
    this.sessionId = this.getOrCreateSessionId();
    this.landing = this.getOrCreateLanding();
    this.loadEventHistory();
    this.installAutoTracking();
    if (consentService.get() === 'granted') this.persistClickIds();
    consentService.subscribe(choice => {
      const pending = this.pendingPixelEvents.splice(0);
      if (choice !== 'granted') return;
      this.persistClickIds();
      pending.forEach(({ payload, items }) => this.dispatchToBrowserPixels(payload, items));
    });
  }

  /**
   * Ad click IDs are kept in first-party cookies so a visitor who comes back days later
   * (without the ?fbclid / ?ttclid in the URL) is still attributed to the ad that brought them.
   */
  private persistClickIds() {
    const { fbclid, ttclid } = this.landing.utm;
    if (fbclid && !readCookie('_fbc')) {
      writeCookie('_fbc', `fb.1.${this.landing.startedAt}.${fbclid}`, NINETY_DAYS);
    }
    if (ttclid) writeCookie('ttclid', ttclid, NINETY_DAYS);
  }

  private getOrCreateAnonymousId(): string {
    try {
      let id = localStorage.getItem('aura_anon_id');
      if (!id) {
        id = newId('anon');
        localStorage.setItem('aura_anon_id', id);
      }
      return id;
    } catch {
      return newId('anon');
    }
  }

  private getOrCreateSessionId(): string {
    try {
      let id = sessionStorage.getItem('aura_session_id');
      if (!id) {
        id = newId('ses');
        sessionStorage.setItem('aura_session_id', id);
      }
      return id;
    } catch {
      return newId('ses');
    }
  }

  private extractUtmFromUrl(): UTMParameters {
    const utm: UTMParameters = {};
    try {
      const params = new URLSearchParams(window.location.search);
      const keys: Array<[keyof UTMParameters, string]> = [
        ['source', 'utm_source'], ['medium', 'utm_medium'], ['campaign', 'utm_campaign'],
        ['content', 'utm_content'], ['term', 'utm_term'],
        ['fbclid', 'fbclid'], ['ttclid', 'ttclid'], ['gclid', 'gclid']
      ];
      keys.forEach(([key, param]) => {
        const value = params.get(param);
        if (value) utm[key] = value;
      });
    } catch {
      // ignore
    }
    return utm;
  }

  /**
   * The landing referrer/UTMs are captured once per browser session, so a visit
   * is attributed to the link/search that brought the visitor, not to internal SPA navigation.
   */
  private getOrCreateLanding(): LandingInfo {
    const urlUtm = this.extractUtmFromUrl();
    try {
      const saved = sessionStorage.getItem('aura_landing');
      if (saved) {
        const parsed: LandingInfo = JSON.parse(saved);
        // A new ad/UTM click inside the same tab starts a new attribution
        if (Object.keys(urlUtm).length === 0) return parsed;
      }
    } catch {
      // ignore
    }

    const landing: LandingInfo = {
      referrer: document.referrer || '',
      landingUrl: window.location.href,
      utm: urlUtm,
      startedAt: Date.now(),
      traffic: classifyTrafficSource({
        referrer: document.referrer,
        landingUrl: window.location.href,
        ownHost: window.location.hostname,
        utm: urlUtm
      })
    };
    try {
      sessionStorage.setItem('aura_landing', JSON.stringify(landing));
      if (Object.keys(urlUtm).length > 0) {
        localStorage.setItem('aura_persisted_utm', JSON.stringify(urlUtm));
      }
    } catch {
      // ignore
    }
    return landing;
  }

  private loadEventHistory() {
    try {
      const saved = sessionStorage.getItem('aura_event_history');
      if (saved) this.eventHistory = JSON.parse(saved);
    } catch {
      this.eventHistory = [];
    }
  }

  private saveEventHistory() {
    try {
      sessionStorage.setItem('aura_event_history', JSON.stringify(this.eventHistory.slice(0, 100)));
    } catch {
      // Ignore
    }
  }

  /** Admin pages and the shop owner's own browsing are not counted as visitors */
  private isTrackingDisabled(): boolean {
    try {
      if (window.location.pathname.includes('adminonly')) return true;
      if (sessionStorage.getItem('aura_admin_auth') === 'true') return true;
      if (navigator.webdriver) return true;
    } catch {
      // ignore
    }
    return false;
  }

  private installAutoTracking() {
    if (typeof window === 'undefined') return;

    // Every click on a button / link / card is recorded with its label, page and time
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.('[data-track], button, a, [role="button"], input[type="submit"], label') as HTMLElement | null;
      if (!el) return;
      const label = (
        el.getAttribute('data-track') ||
        el.getAttribute('aria-label') ||
        el.innerText ||
        el.getAttribute('title') ||
        (el as HTMLInputElement).value ||
        el.tagName
      ).replace(/\s+/g, ' ').trim().slice(0, 80);
      const href = el instanceof HTMLAnchorElement ? el.href : undefined;
      if (href && WHATSAPP_LINK.test(href)) {
        this.track('whatsapp_click', { metadata: { label, view: window.location.pathname } });
      }
      this.track('click', {
        click: {
          label,
          tag: el.tagName.toLowerCase(),
          href,
          x: Math.round(e.clientX),
          y: Math.round(e.clientY)
        }
      });
    }, { capture: true, passive: true });

    // Heartbeat keeps "live visitors" and time-on-site accurate
    setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if ((Date.now() - this.landing.startedAt) / 1000 > MAX_HEARTBEAT_SECONDS) return;
      this.track('heartbeat');
    }, HEARTBEAT_INTERVAL_MS);

    const flushNow = () => this.flush(true);
    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushNow();
    });
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush(false);
    }, FLUSH_INTERVAL_MS);
  }

  private flush(useBeacon: boolean) {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, 50);
    const body = JSON.stringify({ events: batch });
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        }).catch(() => {
          // Network error: put events back for the next attempt
          this.queue.unshift(...batch);
        });
      }
    } catch {
      // ignore
    }
    if (this.queue.length > 0) this.scheduleFlush();
  }

  /** UTMs of the current visit; when the visit has no UTM, the detected source is used */
  public getUtm(): UTMParameters {
    return {
      ...this.landing.utm,
      source: this.landing.utm.source || this.landing.traffic.source,
      medium: this.landing.utm.medium || this.landing.traffic.channel
    };
  }

  public getTrafficSource(): TrafficSource {
    return this.landing.traffic;
  }

  public setCustomUtm(utm: UTMParameters) {
    this.landing = { ...this.landing, utm: { ...this.landing.utm, ...utm } };
    try {
      sessionStorage.setItem('aura_landing', JSON.stringify(this.landing));
    } catch {
      // ignore
    }
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getHistory(): UnifiedEventPayload[] {
    return [...this.eventHistory];
  }

  /**
   * Central Track Method
   * One event_id is shared by the browser pixel (fbq / ttq) and the server
   * Conversions API call, so Meta / TikTok merge both and count the event once.
   */
  public track(
    eventName: StandardEventName,
    options?: {
      value?: number;
      currency?: 'MAD' | 'EUR' | 'USD';
      orderId?: string;
      items?: TrackingItem[];
      userId?: string;
      metadata?: Record<string, unknown>;
      customer?: UnifiedEventPayload['customer'];
      click?: UnifiedEventPayload['click'];
      force?: boolean;
    }
  ): UnifiedEventPayload {
    // The router can fire twice for the same URL on first load (initial view + URL sync)
    if (eventName === 'page_view') {
      const url = window.location.href;
      if (this.lastPageView && this.lastPageView.url === url && Date.now() - this.lastPageView.at < 1500) {
        return this.lastPageView.payload;
      }
    }

    const eventId = newId('evt');
    const width = window.innerWidth;
    const fbclid = this.landing.utm.fbclid;

    const payload: UnifiedEventPayload = {
      eventId,
      eventName,
      anonymousId: this.anonymousId,
      userId: options?.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer || undefined,
      deviceType: width <= 768 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop',
      utm: this.landing.utm,
      currency: options?.currency || 'MAD',
      value: options?.value,
      orderId: options?.orderId,
      items: options?.items,
      metadata: options?.metadata,
      landingUrl: this.landing.landingUrl,
      landingReferrer: this.landing.referrer || undefined,
      trafficChannel: this.landing.traffic.channel,
      trafficSource: this.landing.traffic.source,
      click: options?.click,
      secondsOnSite: Math.round((Date.now() - this.landing.startedAt) / 1000),
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc') || (fbclid ? `fb.1.${this.landing.startedAt}.${fbclid}` : undefined),
      ttp: readCookie('_ttp'),
      ttclid: this.landing.utm.ttclid || readCookie('ttclid'),
      adConsent: consentService.get(),
      customer: options?.customer,
      dispatchedTo: {
        browserGA4: false,
        browserMetaPixel: false,
        browserTikTokPixel: false
      },
      deduplicationStatus: 'BROWSER_ONLY'
    };

    if (eventName === 'page_view') {
      this.lastPageView = { url: payload.pageUrl, at: Date.now(), payload };
    }

    const disabled = this.isTrackingDisabled() && !options?.force;
    const isInternal = eventName === 'click' || eventName === 'heartbeat';

    if (!disabled && !isInternal) {
      const consent = consentService.get();
      if (consent === 'granted') this.dispatchToBrowserPixels(payload, options?.items);
      else if (consent === 'pending') this.pendingPixelEvents.push({ payload, items: options?.items });
    }

    if (!isInternal) {
      this.eventHistory.unshift(payload);
      this.saveEventHistory();
    }
    this.listeners.forEach(fn => fn(payload));

    if (!disabled) {
      this.queue.push(payload);
      // Conversions are sent immediately so they are not lost if the tab closes
      if (eventName === 'purchase' || eventName === 'begin_checkout') {
        this.flush(false);
      } else {
        this.scheduleFlush();
      }
    }

    return payload;
  }

  private dispatchToBrowserPixels(payload: UnifiedEventPayload, items?: TrackingItem[]) {
    const win = window as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
      fbq?: (...args: unknown[]) => void;
      ttq?: { track?: (...args: unknown[]) => void; page?: (...args: unknown[]) => void };
    };

    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push({
      event: payload.eventName,
      event_id: payload.eventId,
      ecommerce: {
        currency: payload.currency,
        value: payload.value,
        transaction_id: payload.orderId,
        items
      }
    });
    payload.dispatchedTo.browserGA4 = true;

    const contentIds = items?.map(i => i.id);
    const metaName = META_EVENT_NAMES[payload.eventName];
    if (metaName && typeof win.fbq === 'function') {
      const params: Record<string, unknown> = { currency: payload.currency };
      if (payload.value !== undefined) params.value = payload.value;
      if (contentIds?.length) {
        params.content_ids = contentIds;
        params.content_type = 'product';
        params.content_name = items?.[0]?.name;
        params.contents = items?.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price }));
        params.num_items = items?.reduce((s, i) => s + i.quantity, 0);
      }
      if (payload.orderId) params.order_id = payload.orderId;
      win.fbq('track', metaName, metaName === 'PageView' ? {} : params, { eventID: payload.eventId });
      payload.dispatchedTo.browserMetaPixel = true;
    }

    if (win.ttq) {
      if (payload.eventName === 'page_view' && typeof win.ttq.page === 'function') {
        win.ttq.page();
        payload.dispatchedTo.browserTikTokPixel = true;
      } else {
        const ttName = TIKTOK_EVENT_NAMES[payload.eventName];
        if (ttName && typeof win.ttq.track === 'function') {
          win.ttq.track(ttName, {
            value: payload.value,
            currency: payload.currency,
            content_type: 'product',
            contents: items?.map(i => ({ content_id: i.id, content_name: i.name, quantity: i.quantity, price: i.price }))
          }, { event_id: payload.eventId });
          payload.dispatchedTo.browserTikTokPixel = true;
        }
      }
    }
  }
}

export const trackingService = new MarketingTrackingService();
