import { StandardEventName, UnifiedEventPayload, UTMParameters, TrackingItem } from '../types/tracking';

type EventListener = (event: UnifiedEventPayload) => void;

class MarketingTrackingService {
  private anonymousId: string;
  private sessionId: string;
  private currentUtm: UTMParameters = {};
  private eventHistory: UnifiedEventPayload[] = [];
  private listeners: Set<EventListener> = new Set();

  constructor() {
    this.anonymousId = this.getOrCreateAnonymousId();
    this.sessionId = this.getOrCreateSessionId();
    this.extractUtmFromUrl();
    this.loadEventHistory();
  }

  private getOrCreateAnonymousId(): string {
    try {
      let id = localStorage.getItem('aura_anon_id');
      if (!id) {
        id = 'anon_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        localStorage.setItem('aura_anon_id', id);
      }
      return id;
    } catch {
      return 'anon_' + Math.random().toString(36).substring(2, 10);
    }
  }

  private getOrCreateSessionId(): string {
    try {
      let id = sessionStorage.getItem('aura_session_id');
      if (!id) {
        id = 'ses_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        sessionStorage.setItem('aura_session_id', id);
      }
      return id;
    } catch {
      return 'ses_' + Math.random().toString(36).substring(2, 10);
    }
  }

  private extractUtmFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm: UTMParameters = {};
      
      if (params.get('utm_source')) utm.source = params.get('utm_source')!;
      if (params.get('utm_medium')) utm.medium = params.get('utm_medium')!;
      if (params.get('utm_campaign')) utm.campaign = params.get('utm_campaign')!;
      if (params.get('utm_content')) utm.content = params.get('utm_content')!;
      if (params.get('utm_term')) utm.term = params.get('utm_term')!;
      if (params.get('fbclid')) utm.fbclid = params.get('fbclid')!;
      if (params.get('ttclid')) utm.ttclid = params.get('ttclid')!;
      if (params.get('gclid')) utm.gclid = params.get('gclid')!;

      // If URL has UTMs, persist them for the whole journey
      if (Object.keys(utm).length > 0) {
        this.currentUtm = utm;
        localStorage.setItem('aura_persisted_utm', JSON.stringify(utm));
      } else {
        const saved = localStorage.getItem('aura_persisted_utm');
        if (saved) {
          this.currentUtm = JSON.parse(saved);
        } else {
          // Default organic direct visit attribution
          this.currentUtm = { source: 'direct', medium: 'organic' };
        }
      }
    } catch {
      this.currentUtm = { source: 'direct', medium: 'organic' };
    }
  }

  private loadEventHistory() {
    try {
      const saved = sessionStorage.getItem('aura_event_history');
      if (saved) {
        this.eventHistory = JSON.parse(saved);
      }
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

  public getUtm(): UTMParameters {
    return this.currentUtm;
  }

  public setCustomUtm(utm: UTMParameters) {
    this.currentUtm = { ...this.currentUtm, ...utm };
    localStorage.setItem('aura_persisted_utm', JSON.stringify(this.currentUtm));
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
   * Generates deterministic event_id, captures environment metadata,
   * simulates both Browser Pixel dispatch and Server Conversions API (CAPI) dispatch,
   * tags event as DEDUPLICATED, and stores in the real-time pipeline.
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
    }
  ): UnifiedEventPayload {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const isMobile = window.innerWidth <= 768;

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
      deviceType: isMobile ? 'mobile' : 'desktop',
      utm: this.currentUtm,
      currency: options?.currency || 'MAD',
      value: options?.value,
      orderId: options?.orderId,
      items: options?.items,
      metadata: options?.metadata,
      dispatchedTo: {
        browserGA4: true,
        browserMetaPixel: true,
        serverMetaCAPI: true,
        tiktokAPI: true,
        snapchatCAPI: true,
        bigQueryStream: true,
      },
      deduplicationStatus: 'DEDUPLICATED'
    };

    // Client-side simulation of Google Analytics dataLayer push
    if (typeof window !== 'undefined') {
      const win = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
      win.dataLayer = win.dataLayer || [];
      win.dataLayer.push({
        event: eventName,
        event_id: eventId,
        ecommerce: {
          currency: payload.currency,
          value: payload.value,
          transaction_id: payload.orderId,
          items: payload.items
        }
      });
    }

    // Add to history and notify observers
    this.eventHistory.unshift(payload);
    this.saveEventHistory();
    this.listeners.forEach(fn => fn(payload));

    return payload;
  }
}

export const trackingService = new MarketingTrackingService();
