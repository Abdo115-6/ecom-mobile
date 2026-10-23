// Ozon Express (Moroccan COD carrier): create parcels from orders and follow their delivery status.
// Credentials stay on the server: OZON_CUSTOMER_ID + OZON_API_KEY (Ozon dashboard → API).

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

export const isOzonConfigured = () => !!(process.env.OZON_CUSTOMER_ID && process.env.OZON_API_KEY);

const endpoint = (action: string) =>
  `${API}/customers/${encodeURIComponent(process.env.OZON_CUSTOMER_ID || '')}/${encodeURIComponent(process.env.OZON_API_KEY || '')}/${action}`;

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

/** Ozon error answers are not uniform: look for a message anywhere at the top level */
function ozonError(data: any): string | undefined {
  const r = data?.ADD_PARCEL?.RESULT || data?.RESULT || data?.result;
  if (r && String(r).toUpperCase() !== 'SUCCESS') {
    return String(data?.ADD_PARCEL?.MESSAGE || data?.MESSAGE || data?.message || r);
  }
  return undefined;
}

export async function createOzonParcel(order: any, opts: { cityId?: number; note?: string } = {}): Promise<OzonShipment> {
  if (!isOzonConfigured()) throw new Error('Ozon Express non configuré : ajoutez OZON_CUSTOMER_ID et OZON_API_KEY');
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
  const parcel = data?.ADD_PARCEL?.['NEW-PARCEL'] || data?.['NEW-PARCEL'] || data;
  const trackingNumber = parcel?.['TRACKING-NUMBER'];
  if (!trackingNumber) throw new Error(ozonError(data) || 'Ozon n\'a pas renvoyé de numéro de suivi');

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
