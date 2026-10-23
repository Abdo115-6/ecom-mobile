// Ozon Express (Moroccan COD carrier): create parcels from orders and follow their delivery status.
// Credentials stay on the server: entered in Admin → Paramètres (stored server-side), or OZON_CUSTOMER_ID + OZON_API_KEY.

const API = 'https://api.ozonexpress.ma';

export interface OzonCity {
  id: number;
  ref: string;
  name: string;
  deliveredPrice: number;
  refusedPrice: number;
}

export interface OzonShipment {
  carrier: 'Ozon Express';
  trackingNumber: string;
  status: string;
  cityId: number;
  cityName: string;
  deliveredPrice?: number;
  sentAt: string;
  lastCheckedAt?: string;
  history?: Array<{ status: string; at: string }>;
}

export interface OzonCredentials {
  customerId: string;
  apiKey: string;
}

// Saved from the admin panel; takes precedence over the environment variables
let saved: OzonCredentials | null = null;
export const setOzonCredentials = (c: OzonCredentials | null) => { saved = c && c.customerId && c.apiKey ? c : null; };

const creds = (): OzonCredentials => ({
  customerId: saved?.customerId || process.env.OZON_CUSTOMER_ID || '',
  apiKey: saved?.apiKey || process.env.OZON_API_KEY || ''
});

export const isOzonConfigured = () => { const c = creds(); return !!(c.customerId && c.apiKey); };

/** What the admin panel may show: the ID and the last characters of the key only */
export function ozonCredentialSummary() {
  const c = creds();
  return {
    configured: isOzonConfigured(),
    source: saved ? 'admin' : c.apiKey ? 'env' : 'none',
    customerId: c.customerId,
    apiKeyHint: c.apiKey ? `••••${c.apiKey.slice(-4)}` : ''
  };
}

const endpointFor = (c: OzonCredentials, action: string) =>
  `${API}/customers/${encodeURIComponent(c.customerId)}/${encodeURIComponent(c.apiKey)}/${action}`;
const endpoint = (action: string) => endpointFor(creds(), action);

/** Read-only check of an ID + key pair: asks for a parcel that does not exist and reads Ozon's key / customer checks */
export async function verifyOzonCredentials(c: OzonCredentials): Promise<{ ok: boolean; message: string }> {
  const form = new FormData();
  form.append('tracking-number', 'VERIFY000000');
  const res = await fetch(endpointFor(c, 'parcel-info'), { method: 'POST', body: form, signal: AbortSignal.timeout(15000) });
  const data: any = await res.json().catch(() => null);
  if (!data) return { ok: false, message: `Réponse Ozon illisible (HTTP ${res.status})` };
  if (data.CHECK_API?.RESULT !== 'SUCCESS') return { ok: false, message: data.CHECK_API?.MESSAGE || 'Clé API refusée par Ozon' };
  if (data['PARCEL-INFO']?.CUSTOMER?.RESULT !== 'SUCCESS') return { ok: false, message: data['PARCEL-INFO']?.CUSTOMER?.MESSAGE || 'ID client refusé par Ozon' };
  return { ok: true, message: 'Clé API et ID client valides' };
}

/** Lowercase, no accents, letters only: "Fès" → "fes", "El-Jadida" → "eljadida" */
const norm = (s: string) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

// Common spellings customers type that differ from Ozon's city names
const ALIASES: Record<string, string> = {
  casa: 'casablanca', dardbeida: 'casablanca', fez: 'fes', tangier: 'tanger', tanja: 'tanger',
  marrakesh: 'marrakech', tetuan: 'tetouan', ksar: 'ksarelkebir'
};

let citiesCache: { at: number; list: OzonCity[] } | null = null;

export async function listOzonCities(): Promise<OzonCity[]> {
  if (citiesCache && Date.now() - citiesCache.at < 24 * 3600 * 1000) return citiesCache.list;
  const res = await fetch(`${API}/cities`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Ozon cities HTTP ${res.status}`);
  const data: any = await res.json();
  const list: OzonCity[] = Object.values(data?.CITIES || {}).map((c: any) => ({
    id: Number(c.ID),
    ref: String(c.REF || ''),
    name: String(c.NAME || ''),
    deliveredPrice: Number(c['DELIVERED-PRICE'] || 0),
    refusedPrice: Number(c['REFUSED-PRICE'] || 0)
  })).filter(c => c.id && c.name).sort((a, b) => a.name.localeCompare(b.name));
  citiesCache = { at: Date.now(), list };
  return list;
}

/**
 * Finds the Ozon city for the city the customer typed at checkout. Only an unambiguous match is returned:
 * big cities are split into districts at Ozon (Casablanca has ~30), and a wrong guess sends the parcel to the wrong agency.
 */
export async function matchOzonCity(cityName: string): Promise<OzonCity | undefined> {
  const list = await listOzonCities();
  const wanted = ALIASES[norm(cityName)] || norm(cityName);
  if (wanted.length < 3) return undefined;
  const exact = list.filter(c => norm(c.name) === wanted);
  if (exact.length === 1) return exact[0];
  const prefixed = list.filter(c => norm(c.name).startsWith(wanted));
  return prefixed.length === 1 ? prefixed[0] : undefined;
}

/** Ozon expects the local format: +212 6XX… / 2126XX… → 06XX… */
const localPhone = (raw: string) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('212')) return `0${digits.slice(3)}`;
  return digits.startsWith('0') ? digits : `0${digits}`;
};

async function postForm(action: string, fields: Record<string, string>): Promise<any> {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v));
  const res = await fetch(endpoint(action), { method: 'POST', body: form, signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`Réponse Ozon illisible (HTTP ${res.status})`); }
  return data;
}

/** Ozon nests its answers per check ("CHECK_API", "ADD-PARCEL", "NEW-PARCEL"…): find the first object holding `key` */
function findWithKey(data: any, key: string, depth = 0): any {
  if (!data || typeof data !== 'object' || depth > 5) return undefined;
  if (key in data) return data;
  for (const v of Object.values(data)) {
    const found = findWithKey(v, key, depth + 1);
    if (found) return found;
  }
  return undefined;
}

/** First failed check in an Ozon answer, e.g. {"CHECK_API":{"RESULT":"ERROR","MESSAGE":"Please verify your API Key"}} */
function ozonError(data: any, depth = 0): string | undefined {
  if (!data || typeof data !== 'object' || depth > 5) return undefined;
  if (data.RESULT && String(data.RESULT).toUpperCase() !== 'SUCCESS') return String(data.MESSAGE || data.RESULT);
  for (const v of Object.values(data)) {
    const msg = ozonError(v, depth + 1);
    if (msg) return msg;
  }
  return undefined;
}

export async function createOzonParcel(order: any, opts: { cityId?: number; note?: string } = {}): Promise<OzonShipment> {
  if (!isOzonConfigured()) throw new Error('Ozon Express non configuré : ajoutez votre ID et clé API dans Admin → Paramètres');
  const city = opts.cityId
    ? (await listOzonCities()).find(c => c.id === Number(opts.cityId))
    : await matchOzonCity(order.shippingAddress?.city || '');
  if (!city) throw new Error(`Choisissez la ville Ozon pour "${order.shippingAddress?.city || '?'}" (plusieurs quartiers possibles ou ville inconnue)`);

  const price = Math.round(Number(order.totalAmount) || 0);
  const nature = (order.items || []).map((i: any) => `${i.productName} x${i.quantity}`).join(', ').slice(0, 250);
  const fields: Record<string, string> = {
    'tracking-number': '',
    'parcel-receiver': String(order.shippingAddress?.fullName || order.customerName || '').slice(0, 100),
    'parcel-phone': localPhone(order.shippingAddress?.phone || order.customerPhone),
    'parcel-city': String(city.id),
    'parcel-address': String(order.shippingAddress?.street || city.name).slice(0, 250),
    'parcel-note': [opts.note || order.notes || '', `Cmd ${order.orderNumber}`].filter(Boolean).join(' · ').slice(0, 250),
    'parcel-price': String(price),
    'parcel-nature': nature,
    // 0 = Ozon picks the parcel up from you (ramassage), 1 = shipped from your stock at Ozon
    'parcel-stock': process.env.OZON_PARCEL_STOCK === '1' ? '1' : '0',
    // The customer may open the parcel before paying (store promise)
    'parcel-open': '1'
  };
  if (!fields['tracking-number']) delete fields['tracking-number'];
  if (price <= 0 || price > 5000) fields['parcel-declared-value'] = String(Math.max(50, price));

  const data = await postForm('add-parcel', fields);
  const parcel = findWithKey(data, 'TRACKING-NUMBER');
  const trackingNumber = parcel?.['TRACKING-NUMBER'];
  if (!trackingNumber) {
    console.warn('[Ozon] add-parcel answer without tracking number:', JSON.stringify(data).slice(0, 1000));
    throw new Error(`Ozon : ${ozonError(data) || JSON.stringify(data).slice(0, 200)}`);
  }

  const now = new Date().toISOString();
  return {
    carrier: 'Ozon Express',
    trackingNumber: String(trackingNumber),
    status: 'Nouveau colis',
    cityId: city.id,
    cityName: String(parcel?.CITY_NAME || city.name),
    deliveredPrice: Number(parcel?.['DELIVERED-PRICE'] || city.deliveredPrice) || undefined,
    sentAt: now,
    history: [{ status: 'Nouveau colis', at: now }]
  };
}

/** Latest status label of each parcel, from the tracking endpoint (bulk JSON form) */
export async function fetchOzonStatuses(trackingNumbers: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!isOzonConfigured() || trackingNumbers.length === 0) return out;
  for (let i = 0; i < trackingNumbers.length; i += 50) {
    const chunk = trackingNumbers.slice(i, i + 50);
    const res = await fetch(endpoint('tracking'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'tracking-number': chunk }),
      signal: AbortSignal.timeout(20000)
    });
    const data: any = await res.json().catch(() => null);
    if (!data) continue;
    // Single and bulk answers differ; walk the response and keep the newest status found per tracking number
    for (const tn of chunk) {
      const entry = data?.[tn] || data?.TRACKING?.[tn] || (chunk.length === 1 ? data?.TRACKING || data : undefined);
      const status = latestStatus(entry);
      if (status) out.set(tn, status);
    }
  }
  return out;
}

function latestStatus(entry: any): string | undefined {
  if (!entry || typeof entry !== 'object') return undefined;
  const last = entry['LAST_TRACKING'] || entry['LAST-TRACKING'];
  if (last) return String(last.STATUT || last.STATUS || last['STATUT-LABEL'] || '').trim() || undefined;
  const history = entry.HISTORY || entry.history || entry.TRACKING;
  if (history && typeof history === 'object') {
    const rows: any[] = Object.values(history);
    const row = rows[rows.length - 1];
    if (row) return String(row.STATUT || row.STATUS || row.status || '').trim() || undefined;
  }
  const s = entry.STATUT || entry.STATUS || entry.status;
  return s ? String(s).trim() : undefined;
}

/** Maps an Ozon status label to the store order status (undefined = no change) */
export function orderStatusFromOzon(label: string): string | undefined {
  const words = String(label || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const has = (...w: string[]) => w.some(x => words.includes(x));
  if (has('annule', 'cancelled', 'canceled')) return 'CANCELLED';
  // A refused or returned COD parcel was never paid: the order is lost
  if (has('retour', 'retourne', 'refuse', 'returned', 'refused')) return 'CANCELLED';
  if (has('livre', 'delivered') && !has('non', 'pas')) return 'DELIVERED';
  if (has('ramasse', 'expedie', 'cours', 'distribution', 'transit', 'envoye', 'recu', 'livreur', 'livraison')) return 'SHIPPED';
  return undefined;
}
