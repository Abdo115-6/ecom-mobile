import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type pg from 'pg';
import { classifyTrafficSource, CHANNEL_LABELS, TrafficChannel } from '../src/services/trafficSource';

// Real visitor analytics: stores events sent by the storefront, forwards conversions
// to Meta / TikTok / Snapchat Conversions APIs with the same event_id as the browser pixel.

type DispatchStatus = 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'SKIPPED';

export interface StoredEvent {
  eventId: string;
  eventName: string;
  anonymousId: string;
  sessionId: string;
  timestamp: string;
  receivedAt: string;
  pageUrl: string;
  pageTitle?: string;
  deviceType: string;
  utm: Record<string, string>;
  currency: string;
  value?: number;
  orderId?: string;
  items?: Array<{ id: string; name: string; category?: string; price: number; quantity: number; variant?: string }>;
  metadata?: Record<string, unknown>;
  landingUrl?: string;
  landingReferrer?: string;
  trafficChannel: TrafficChannel;
  trafficSource: string;
  referrerHost?: string;
  click?: { label: string; tag: string; href?: string; x: number; y: number };
  secondsOnSite?: number;
  dispatchedTo?: Record<string, boolean>;
  serverDispatch: Record<string, DispatchStatus>;
  deduplicationStatus: 'DEDUPLICATED' | 'BROWSER_ONLY' | 'SERVER_ONLY';
  ipAddress?: string;
  userAgent?: string;
}

interface TrackerOptions {
  dataDir: string;
  pgPool: pg.Pool;
  isPgConnected: () => boolean;
  getSettings: () => Record<string, any> | null;
}

const MAX_EVENTS_IN_MEMORY = 60000;
const LIVE_WINDOW_MS = 5 * 60 * 1000;
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp\/|preview|headless|lighthouse|pingdom|curl|wget|python-requests|axios/i;

const META_NAMES: Record<string, string> = {
  page_view: 'PageView', view_item: 'ViewContent', search: 'Search', add_to_cart: 'AddToCart',
  add_to_wishlist: 'AddToWishlist', begin_checkout: 'InitiateCheckout', add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase', sign_up: 'CompleteRegistration', whatsapp_click: 'Contact'
};
const TIKTOK_NAMES: Record<string, string> = {
  view_item: 'ViewContent', search: 'Search', add_to_cart: 'AddToCart', add_to_wishlist: 'AddToWishlist',
  begin_checkout: 'InitiateCheckout', add_payment_info: 'AddPaymentInfo', purchase: 'CompletePayment',
  sign_up: 'CompleteRegistration', whatsapp_click: 'Contact'
};
const SNAP_NAMES: Record<string, string> = {
  page_view: 'PAGE_VIEW', view_item: 'VIEW_CONTENT', add_to_cart: 'ADD_CART', begin_checkout: 'START_CHECKOUT',
  purchase: 'PURCHASE', search: 'SEARCH', sign_up: 'SIGN_UP', add_to_wishlist: 'ADD_TO_WISHLIST'
};

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

function normalizePhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) digits = '212' + digits.slice(1); // 06XXXXXXXX → 2126XXXXXXXX
  return digits.length >= 8 ? digits : undefined;
}

function hashedCustomer(customer?: Record<string, string | undefined>) {
  if (!customer) return {};
  const phone = normalizePhone(customer.phone);
  const email = customer.email?.trim().toLowerCase();
  const validEmail = email && /@/.test(email) && !email.endsWith('@client-shopme.ma') && !email.endsWith('@example.com') ? email : undefined;
  const clean = (v?: string) => v?.trim().toLowerCase().replace(/\s+/g, '') || undefined;
  return {
    ph: phone ? sha256(phone) : undefined,
    em: validEmail ? sha256(validEmail) : undefined,
    fn: clean(customer.firstName) ? sha256(clean(customer.firstName)!) : undefined,
    ln: clean(customer.lastName) ? sha256(clean(customer.lastName)!) : undefined,
    ct: clean(customer.city) ? sha256(clean(customer.city)!) : undefined,
    country: sha256('ma')
  };
}

function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname || '/';
  } catch {
    return url || '/';
  }
}

const casablancaParts = (d: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '00';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: get('hour') };
};

export function createTracker(opts: TrackerOptions) {
  const trackingDir = path.resolve(opts.dataDir);
  if (!fs.existsSync(trackingDir)) fs.mkdirSync(trackingDir, { recursive: true });
  const eventsFile = path.join(trackingDir, 'tracking_events.json');

  let events: StoredEvent[] = [];
  const seenIds = new Set<string>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  try {
    if (fs.existsSync(eventsFile)) {
      events = JSON.parse(fs.readFileSync(eventsFile, 'utf-8'));
      events.forEach(e => seenIds.add(e.eventId));
    }
  } catch (err) {
    console.warn('[Tracking] Could not read events file:', err);
    events = [];
  }

  const scheduleSave = () => {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      fs.promises.writeFile(eventsFile, JSON.stringify(events)).catch(err => console.warn('[Tracking] Save error:', err));
    }, 5000);
  };

  async function initPostgres() {
    if (!opts.isPgConnected()) return;
    try {
      const client = await opts.pgPool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS tracking_events (
          event_id VARCHAR(100) PRIMARY KEY,
          event_name VARCHAR(50) NOT NULL,
          session_id VARCHAR(100) NOT NULL,
          anonymous_id VARCHAR(100) NOT NULL,
          event_time TIMESTAMP WITH TIME ZONE NOT NULL,
          data JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS tracking_events_time_idx ON tracking_events (event_time DESC);
      `);
      // Postgres is the durable store when available: reload the last 30 days
      const result = await client.query(
        `SELECT data FROM tracking_events WHERE event_time > NOW() - INTERVAL '30 days' ORDER BY event_time ASC LIMIT $1`,
        [MAX_EVENTS_IN_MEMORY]
      );
      client.release();
      if (result.rows.length > 0) {
        events = result.rows.map(r => r.data);
        seenIds.clear();
        events.forEach(e => seenIds.add(e.eventId));
      }
    } catch (err: any) {
      console.warn('[Tracking] Postgres init notice:', err.message);
    }
  }

  async function persistToPostgres(batch: StoredEvent[]) {
    if (!opts.isPgConnected() || batch.length === 0) return;
    try {
      const client = await opts.pgPool.connect();
      const values: unknown[] = [];
      const rows = batch.map((e, i) => {
        values.push(e.eventId, e.eventName, e.sessionId, e.anonymousId, e.timestamp, JSON.stringify(e));
        const b = i * 6;
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6})`;
      });
      await client.query(
        `INSERT INTO tracking_events (event_id, event_name, session_id, anonymous_id, event_time, data)
         VALUES ${rows.join(', ')}
         ON CONFLICT (event_id) DO UPDATE SET data = EXCLUDED.data`,
        values
      );
      client.release();
    } catch (err: any) {
      console.warn('[Tracking] Postgres insert notice:', err.message);
    }
  }

  function credentials() {
    const s = opts.getSettings() || {};
    return {
      meta: {
        pixelId: process.env.META_PIXEL_ID || s.metaPixelId || '',
        token: process.env.META_ACCESS_TOKEN || '',
        testCode: process.env.META_TEST_EVENT_CODE || ''
      },
      tiktok: {
        pixelId: process.env.TIKTOK_PIXEL_ID || s.tiktokPixelId || '',
        token: process.env.TIKTOK_ACCESS_TOKEN || '',
        testCode: process.env.TIKTOK_TEST_EVENT_CODE || ''
      },
      snapchat: {
        pixelId: process.env.SNAP_PIXEL_ID || s.snapchatPixelId || '',
        token: process.env.SNAP_ACCESS_TOKEN || ''
      }
    };
  }

  async function postJson(url: string, body: unknown, headers: Record<string, string> = {}): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        console.warn(`[Tracking] CAPI ${url.split('?')[0]} → HTTP ${res.status}:`, (await res.text()).slice(0, 300));
        return false;
      }
      const json: any = await res.json().catch(() => ({}));
      // TikTok answers HTTP 200 with a non-zero code on errors
      if (typeof json.code === 'number' && json.code !== 0) {
        console.warn('[Tracking] CAPI error:', json.message || json.code);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('[Tracking] CAPI network error:', err.message);
      return false;
    }
  }

  async function dispatchServerSide(ev: StoredEvent, raw: any) {
    const creds = credentials();
    const eventTime = Math.floor(Math.min(new Date(ev.timestamp).getTime() || Date.now(), Date.now()) / 1000);
    const user = hashedCustomer(raw.customer);
    const contents = ev.items?.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price }));

    const tasks: Array<Promise<void>> = [];

    // Meta Conversions API
    const metaName = META_NAMES[ev.eventName];
    if (!metaName) ev.serverDispatch.meta = 'SKIPPED';
    else if (!creds.meta.pixelId || !creds.meta.token) ev.serverDispatch.meta = 'NOT_CONFIGURED';
    else {
      tasks.push(postJson(
        `https://graph.facebook.com/v21.0/${creds.meta.pixelId}/events?access_token=${encodeURIComponent(creds.meta.token)}`,
        {
          data: [{
            event_name: metaName,
            event_time: eventTime,
            event_id: ev.eventId,
            event_source_url: ev.pageUrl,
            action_source: 'website',
            user_data: {
              client_ip_address: ev.ipAddress,
              client_user_agent: ev.userAgent,
              fbp: raw.fbp,
              fbc: raw.fbc,
              external_id: sha256(ev.anonymousId),
              ph: user.ph ? [user.ph] : undefined,
              em: user.em ? [user.em] : undefined,
              fn: user.fn ? [user.fn] : undefined,
              ln: user.ln ? [user.ln] : undefined,
              ct: user.ct ? [user.ct] : undefined,
              country: [user.country]
            },
            custom_data: metaName === 'PageView' ? undefined : {
              currency: ev.currency,
              value: ev.value,
              order_id: ev.orderId,
              content_type: contents?.length ? 'product' : undefined,
              content_ids: ev.items?.map(i => i.id),
              contents,
              num_items: ev.items?.reduce((s, i) => s + i.quantity, 0)
            }
          }],
          test_event_code: creds.meta.testCode || undefined
        }
      ).then(ok => { ev.serverDispatch.meta = ok ? 'SENT' : 'FAILED'; }));
    }

    // TikTok Events API
    const ttName = TIKTOK_NAMES[ev.eventName];
    if (!ttName) ev.serverDispatch.tiktok = 'SKIPPED';
    else if (!creds.tiktok.pixelId || !creds.tiktok.token) ev.serverDispatch.tiktok = 'NOT_CONFIGURED';
    else {
      tasks.push(postJson(
        'https://business-api.tiktok.com/open_api/v1.3/event/track/',
        {
          event_source: 'web',
          event_source_id: creds.tiktok.pixelId,
          test_event_code: creds.tiktok.testCode || undefined,
          data: [{
            event: ttName,
            event_time: eventTime,
            event_id: ev.eventId,
            user: {
              ttclid: ev.utm?.ttclid,
              ttp: raw.ttp,
              phone: user.ph,
              email: user.em,
              external_id: sha256(ev.anonymousId),
              ip: ev.ipAddress,
              user_agent: ev.userAgent
            },
            page: { url: ev.pageUrl, referrer: ev.landingReferrer },
            properties: {
              currency: ev.currency,
              value: ev.value,
              order_id: ev.orderId,
              content_type: 'product',
              contents: ev.items?.map(i => ({ content_id: i.id, content_name: i.name, quantity: i.quantity, price: i.price }))
            }
          }]
        },
        { 'Access-Token': creds.tiktok.token }
      ).then(ok => { ev.serverDispatch.tiktok = ok ? 'SENT' : 'FAILED'; }));
    }

    // Snapchat Conversions API (v3)
    const snapName = SNAP_NAMES[ev.eventName];
    if (!snapName) ev.serverDispatch.snapchat = 'SKIPPED';
    else if (!creds.snapchat.pixelId || !creds.snapchat.token) ev.serverDispatch.snapchat = 'NOT_CONFIGURED';
    else {
      tasks.push(postJson(
        `https://tr.snapchat.com/v3/${creds.snapchat.pixelId}/events?access_token=${encodeURIComponent(creds.snapchat.token)}`,
        {
          data: [{
            event_name: snapName,
            event_time: eventTime,
            event_id: ev.eventId,
            event_source_url: ev.pageUrl,
            action_source: 'WEB',
            user_data: {
              client_ip_address: ev.ipAddress,
              client_user_agent: ev.userAgent,
              ph: user.ph ? [user.ph] : undefined,
              em: user.em ? [user.em] : undefined,
              external_id: [sha256(ev.anonymousId)]
            },
            custom_data: {
              currency: ev.currency,
              value: ev.value,
              order_id: ev.orderId,
              content_ids: ev.items?.map(i => i.id),
              num_items: ev.items?.reduce((s, i) => s + i.quantity, 0)
            }
          }]
        }
      ).then(ok => { ev.serverDispatch.snapchat = ok ? 'SENT' : 'FAILED'; }));
    }

    await Promise.all(tasks);

    const browserSent = !!(ev.dispatchedTo?.browserMetaPixel || ev.dispatchedTo?.browserTikTokPixel);
    const serverSent = Object.values(ev.serverDispatch).includes('SENT');
    ev.deduplicationStatus = browserSent && serverSent ? 'DEDUPLICATED' : serverSent ? 'SERVER_ONLY' : 'BROWSER_ONLY';
  }

  /** Accepts a batch of raw events from the storefront */
  async function ingest(rawEvents: any[], meta: { ip: string; userAgent: string }): Promise<number> {
    if (BOT_UA.test(meta.userAgent || '')) return 0;
    const accepted: StoredEvent[] = [];
    const conversions: Array<Promise<void>> = [];
    const now = new Date().toISOString();

    for (const raw of rawEvents.slice(0, 50)) {
      if (!raw || typeof raw.eventId !== 'string' || typeof raw.eventName !== 'string' || typeof raw.sessionId !== 'string') continue;
      if (seenIds.has(raw.eventId)) continue;
      seenIds.add(raw.eventId);

      const pageUrl = String(raw.pageUrl || '').slice(0, 500);
      let ownHost: string | undefined;
      try { ownHost = new URL(pageUrl).hostname; } catch { /* ignore */ }
      const traffic = classifyTrafficSource({
        referrer: raw.landingReferrer,
        landingUrl: raw.landingUrl,
        ownHost,
        utm: raw.utm
      });

      const ev: StoredEvent = {
        eventId: raw.eventId.slice(0, 100),
        eventName: raw.eventName.slice(0, 50),
        anonymousId: String(raw.anonymousId || 'unknown').slice(0, 100),
        sessionId: raw.sessionId.slice(0, 100),
        timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : now,
        receivedAt: now,
        pageUrl,
        pageTitle: typeof raw.pageTitle === 'string' ? raw.pageTitle.slice(0, 200) : undefined,
        deviceType: ['mobile', 'tablet', 'desktop'].includes(raw.deviceType) ? raw.deviceType : 'desktop',
        utm: raw.utm && typeof raw.utm === 'object' ? raw.utm : {},
        currency: raw.currency || 'MAD',
        value: typeof raw.value === 'number' ? raw.value : undefined,
        orderId: raw.orderId,
        items: Array.isArray(raw.items) ? raw.items.slice(0, 20) : undefined,
        metadata: raw.metadata,
        landingUrl: raw.landingUrl,
        landingReferrer: raw.landingReferrer,
        trafficChannel: traffic.channel,
        trafficSource: traffic.source,
        referrerHost: traffic.referrerHost,
        click: raw.click,
        secondsOnSite: typeof raw.secondsOnSite === 'number' ? raw.secondsOnSite : undefined,
        dispatchedTo: raw.dispatchedTo,
        serverDispatch: {},
        deduplicationStatus: 'BROWSER_ONLY',
        ipAddress: meta.ip,
        userAgent: (meta.userAgent || '').slice(0, 300)
        // raw.customer (phone/email) is only hashed for the Conversions APIs, never stored
      };

      if (ev.eventName !== 'click' && ev.eventName !== 'heartbeat') {
        conversions.push(dispatchServerSide(ev, raw));
      }
      accepted.push(ev);
    }

    if (accepted.length === 0) return 0;
    await Promise.all(conversions);

    events.push(...accepted);
    if (events.length > MAX_EVENTS_IN_MEMORY) {
      const removed = events.splice(0, events.length - MAX_EVENTS_IN_MEMORY);
      removed.forEach(e => seenIds.delete(e.eventId));
    }
    scheduleSave();
    persistToPostgres(accepted);
    return accepted.length;
  }

  function recent(limit = 200, includeTechnical = false): StoredEvent[] {
    const out: StoredEvent[] = [];
    for (let i = events.length - 1; i >= 0 && out.length < limit; i--) {
      const e = events[i];
      if (!includeTechnical && e.eventName === 'heartbeat') continue;
      out.push(e);
    }
    return out;
  }

  function stats(range: '24h' | '7d' | '30d' | 'today') {
    const now = Date.now();
    // 'today' = current calendar day in Morocco (filtered by day key below)
    const hoursBack = { today: 26, '24h': 24, '7d': 24 * 7, '30d': 24 * 30 }[range];
    const since = now - hoursBack * 3600 * 1000;
    const todayKey = casablancaParts(new Date()).day;
    const inRange = events.filter(e => {
      const t = new Date(e.timestamp).getTime();
      if (t < since) return false;
      if (range === 'today') return casablancaParts(new Date(t)).day === todayKey;
      return true;
    });

    interface SessionAgg {
      sessionId: string; anonymousId: string; first: number; last: number; channel: TrafficChannel; source: string;
      referrerHost?: string; device: string; pageViews: number; clicks: number; events: number;
      purchases: number; revenue: number; lastPage: string;
    }
    const sessions = new Map<string, SessionAgg>();
    const visitors = new Set<string>();
    const pages = new Map<string, number>();
    const clicks = new Map<string, { label: string; page: string; count: number; lastAt: string }>();
    const orderIds = new Set<string>();
    const hourly = range === '24h' || range === 'today';
    const timeline = new Map<string, { visitors: Set<string>; pageViews: number; clicks: number }>();
    const dispatch: Record<string, { sent: number; failed: number; notConfigured: number }> = {};
    let pageViews = 0, clickCount = 0, purchases = 0, revenue = 0;

    for (const e of inRange) {
      const t = new Date(e.timestamp).getTime();
      visitors.add(e.anonymousId);
      let s = sessions.get(e.sessionId);
      if (!s) {
        s = {
          sessionId: e.sessionId, anonymousId: e.anonymousId, first: t, last: t, channel: e.trafficChannel,
          source: e.trafficSource, referrerHost: e.referrerHost, device: e.deviceType, pageViews: 0, clicks: 0,
          events: 0, purchases: 0, revenue: 0, lastPage: pathOf(e.pageUrl)
        };
        sessions.set(e.sessionId, s);
      }
      s.first = Math.min(s.first, t);
      if (t >= s.last) { s.last = t; s.lastPage = pathOf(e.pageUrl); }
      s.events++;

      const parts = casablancaParts(new Date(t));
      const bucketKey = hourly ? `${parts.day} ${parts.hour}h` : parts.day;
      let bucket = timeline.get(bucketKey);
      if (!bucket) { bucket = { visitors: new Set(), pageViews: 0, clicks: 0 }; timeline.set(bucketKey, bucket); }
      bucket.visitors.add(e.anonymousId);

      if (e.eventName === 'page_view') {
        pageViews++; s.pageViews++; bucket.pageViews++;
        const p = pathOf(e.pageUrl);
        pages.set(p, (pages.get(p) || 0) + 1);
      } else if (e.eventName === 'click' && e.click) {
        clickCount++; s.clicks++; bucket.clicks++;
        const page = pathOf(e.pageUrl);
        const key = `${e.click.label}|${page}`;
        const c = clicks.get(key) || { label: e.click.label, page, count: 0, lastAt: e.timestamp };
        c.count++;
        if (e.timestamp > c.lastAt) c.lastAt = e.timestamp;
        clicks.set(key, c);
      } else if (e.eventName === 'purchase') {
        const key = e.orderId || e.eventId;
        if (!orderIds.has(key)) {
          orderIds.add(key);
          purchases++; s.purchases++;
          revenue += e.value || 0; s.revenue += e.value || 0;
        }
      }

      for (const [platform, status] of Object.entries(e.serverDispatch || {})) {
        const d = dispatch[platform] || (dispatch[platform] = { sent: 0, failed: 0, notConfigured: 0 });
        if (status === 'SENT') d.sent++;
        else if (status === 'FAILED') d.failed++;
        else if (status === 'NOT_CONFIGURED') d.notConfigured++;
      }
    }

    const sessionList = [...sessions.values()];
    const channelAgg = new Map<string, { sessions: number; visitors: Set<string>; purchases: number; revenue: number }>();
    const sourceAgg = new Map<string, { channel: string; sessions: number; visitors: Set<string>; purchases: number }>();
    const refAgg = new Map<string, number>();
    const deviceAgg = new Map<string, number>();
    let totalDuration = 0, bounces = 0;

    for (const s of sessionList) {
      const ch = channelAgg.get(s.channel) || { sessions: 0, visitors: new Set<string>(), purchases: 0, revenue: 0 };
      ch.sessions++; ch.visitors.add(s.anonymousId); ch.purchases += s.purchases; ch.revenue += s.revenue;
      channelAgg.set(s.channel, ch);

      const src = sourceAgg.get(s.source) || { channel: s.channel, sessions: 0, visitors: new Set<string>(), purchases: 0 };
      src.sessions++; src.visitors.add(s.anonymousId); src.purchases += s.purchases;
      sourceAgg.set(s.source, src);

      if (s.referrerHost) refAgg.set(s.referrerHost, (refAgg.get(s.referrerHost) || 0) + 1);
      deviceAgg.set(s.device, (deviceAgg.get(s.device) || 0) + 1);
      totalDuration += (s.last - s.first) / 1000;
      if (s.pageViews <= 1 && s.clicks === 0) bounces++;
    }

    const creds = credentials();
    const sortDesc = <T,>(arr: T[], key: (x: T) => number) => arr.sort((a, b) => key(b) - key(a));

    return {
      range,
      generatedAt: new Date().toISOString(),
      uniqueVisitors: visitors.size,
      sessions: sessionList.length,
      pageViews,
      clicks: clickCount,
      liveVisitors: new Set(sessionList.filter(s => now - s.last < LIVE_WINDOW_MS).map(s => s.anonymousId)).size,
      avgSessionSeconds: sessionList.length ? Math.round(totalDuration / sessionList.length) : 0,
      bounceRatePercent: sessionList.length ? Math.round((bounces / sessionList.length) * 100) : 0,
      purchases,
      revenue,
      conversionRatePercent: sessionList.length ? Number(((purchases / sessionList.length) * 100).toFixed(2)) : 0,
      channels: sortDesc([...channelAgg.entries()].map(([channel, v]) => ({
        channel, label: CHANNEL_LABELS[channel as TrafficChannel] || channel, sessions: v.sessions,
        visitors: v.visitors.size, purchases: v.purchases, revenue: v.revenue
      })), x => x.sessions),
      sources: sortDesc([...sourceAgg.entries()].map(([source, v]) => ({
        source, channel: v.channel, sessions: v.sessions, visitors: v.visitors.size, purchases: v.purchases
      })), x => x.sessions).slice(0, 20),
      referrers: sortDesc([...refAgg.entries()].map(([host, n]) => ({ host, sessions: n })), x => x.sessions).slice(0, 15),
      topPages: sortDesc([...pages.entries()].map(([p, views]) => ({ path: p, views })), x => x.views).slice(0, 15),
      topClicks: sortDesc([...clicks.values()], x => x.count).slice(0, 25),
      devices: sortDesc([...deviceAgg.entries()].map(([device, n]) => ({ device, sessions: n })), x => x.sessions),
      timeline: [...timeline.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([bucket, v]) => ({
        bucket, visitors: v.visitors.size, pageViews: v.pageViews, clicks: v.clicks
      })),
      liveSessions: sortDesc(sessionList.filter(s => now - s.last < LIVE_WINDOW_MS), s => s.last).slice(0, 30).map(s => ({
        sessionId: s.sessionId, source: s.source, channel: s.channel, page: s.lastPage, device: s.device,
        secondsOnSite: Math.round((s.last - s.first) / 1000), lastSeenAt: new Date(s.last).toISOString(), events: s.events
      })),
      serverDispatch: dispatch,
      configured: {
        meta: !!(creds.meta.pixelId && creds.meta.token),
        tiktok: !!(creds.tiktok.pixelId && creds.tiktok.token),
        snapchat: !!(creds.snapchat.pixelId && creds.snapchat.token)
      }
    };
  }

  async function clear() {
    events = [];
    seenIds.clear();
    await fs.promises.writeFile(eventsFile, '[]').catch(() => {});
    if (opts.isPgConnected()) {
      try {
        const client = await opts.pgPool.connect();
        await client.query('DELETE FROM tracking_events');
        client.release();
      } catch (err: any) {
        console.warn('[Tracking] Postgres clear notice:', err.message);
      }
    }
  }

  return { initPostgres, ingest, recent, stats, clear };
}
