import type { StoredEvent } from './tracking';

// Data mining report built from what really happened on the shop: visitor events (/api/track),
// orders and the order forms that were filled in without being sent (client_leads).
// Every number comes from these records; the recommendations are rules applied to them.

type Priority = 'haute' | 'moyenne' | 'info';

export interface Recommendation {
  priority: Priority;
  area: string;
  title: string;
  detail: string;
}

interface ProductRef { id: string; name: string; image?: string; price?: number; slug?: string }

interface Input {
  events: StoredEvent[];
  orders: any[];
  leads: any[];
  products: any[];
  rangeDays: number;
  conversionApis: { meta: boolean; tiktok: boolean; snapchat: boolean };
}

const CANCELLED = new Set(['CANCELLED', 'REFUNDED']);
const DAY_MS = 24 * 3600 * 1000;
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

/** 06XXXXXXXX form, so "+212 6…", "2126…" and "06…" are the same customer */
export function normalizePhone(raw?: string): string {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('212')) d = '0' + d.slice(3);
  if (d.length === 9 && !d.startsWith('0')) d = '0' + d;
  return d;
}

const casablanca = (d: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Casablanca', weekday: 'short', hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(d);
  const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find(p => p.type === 'weekday')?.value || 'Sun');
  return { hour, weekday: Math.max(0, wd) };
};

const cityKey = (c?: string) =>
  String(c || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

export function buildDataMiningReport(input: Input) {
  const now = Date.now();
  const since = now - input.rangeDays * DAY_MS;

  // ---------- Product lookup (events carry the SKU, variant SKU or product id) ----------
  const productByKey = new Map<string, ProductRef>();
  for (const p of input.products || []) {
    const ref: ProductRef = { id: p.id, name: p.name, image: p.images?.[0]?.imageUrl, price: Number(p.price) || undefined, slug: p.slug };
    [p.id, p.sku, p.slug, ...(p.variants || []).map((v: any) => v?.sku)]
      .filter(Boolean)
      .forEach((k: string) => productByKey.set(String(k).toLowerCase(), ref));
    if (p.name) productByKey.set(`name:${String(p.name).toLowerCase()}`, ref);
  }
  const resolveProduct = (id?: string, name?: string): ProductRef | undefined => {
    if (id && productByKey.has(String(id).toLowerCase())) return productByKey.get(String(id).toLowerCase());
    if (name && productByKey.has(`name:${name.toLowerCase()}`)) return productByKey.get(`name:${name.toLowerCase()}`);
    if (id || name) return { id: String(id || name), name: String(name || id) };
    return undefined;
  };

  // ---------- Sessions from visitor events ----------
  interface Session {
    channel: string; source: string; device: string; first: number; last: number; pageViews: number; clicks: number;
    viewed: Set<string>; carted: boolean; checkout: boolean; purchased: boolean; revenue: number; landing: string;
  }
  const sessions = new Map<string, Session>();
  const productStats = new Map<string, {
    product: ProductRef; viewSessions: Set<string>; cartSessions: Set<string>; checkoutSessions: Set<string>;
    purchaseSessions: Set<string>; orders: number; validOrders: number; delivered: number; cancelled: number;
    units: number; revenue: number;
  }>();
  const productRow = (ref: ProductRef) => {
    let row = productStats.get(ref.id);
    if (!row) {
      row = {
        product: ref, viewSessions: new Set(), cartSessions: new Set(), checkoutSessions: new Set(), purchaseSessions: new Set(),
        orders: 0, validOrders: 0, delivered: 0, cancelled: 0, units: 0, revenue: 0
      };
      productStats.set(ref.id, row);
    }
    return row;
  };
  const clickCounts = new Map<string, { label: string; page: string; count: number; sessions: Set<string> }>();
  const visitHours = new Array(24).fill(0);
  const visitWeekdays = new Array(7).fill(0);
  let purchaseSecondsTotal = 0, purchaseSecondsCount = 0;

  const events = [...input.events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const e of events) {
    const t = new Date(e.timestamp).getTime();
    if (!(t >= since)) continue;
    let s = sessions.get(e.sessionId);
    if (!s) {
      s = {
        channel: e.trafficChannel || 'direct', source: e.trafficSource || 'Direct', device: e.deviceType || 'desktop',
        first: t, last: t, pageViews: 0, clicks: 0, viewed: new Set(), carted: false, checkout: false, purchased: false,
        revenue: 0, landing: pagePath(e.landingUrl || e.pageUrl)
      };
      sessions.set(e.sessionId, s);
      const c = casablanca(new Date(t));
      visitHours[c.hour]++;
      visitWeekdays[c.weekday]++;
    }
    s.last = Math.max(s.last, t);
    const item = e.items?.[0];
    const ref = item ? resolveProduct(item.id, item.name) : undefined;

    switch (e.eventName) {
      case 'page_view': s.pageViews++; break;
      case 'click':
        s.clicks++;
        if (e.click?.label) {
          const page = pagePath(e.pageUrl);
          const key = `${e.click.label}|${page}`;
          const row = clickCounts.get(key) || { label: e.click.label, page, count: 0, sessions: new Set<string>() };
          row.count++;
          row.sessions.add(e.sessionId);
          clickCounts.set(key, row);
        }
        break;
      case 'view_item':
        if (ref) { s.viewed.add(ref.id); productRow(ref).viewSessions.add(e.sessionId); }
        break;
      case 'add_to_cart':
        s.carted = true;
        if (ref) productRow(ref).cartSessions.add(e.sessionId);
        break;
      case 'begin_checkout':
        s.checkout = true;
        (e.items || []).forEach(i => { const r = resolveProduct(i.id, i.name); if (r) productRow(r).checkoutSessions.add(e.sessionId); });
        break;
      case 'purchase':
        if (!s.purchased) {
          s.purchased = true;
          s.checkout = true;
          s.revenue += e.value || 0;
          if (typeof e.secondsOnSite === 'number') { purchaseSecondsTotal += e.secondsOnSite; purchaseSecondsCount++; }
        }
        (e.items || []).forEach(i => { const r = resolveProduct(i.id, i.name); if (r) productRow(r).purchaseSessions.add(e.sessionId); });
        break;
    }
  }

  const sessionList = [...sessions.values()];
  const totalSessions = sessionList.length;
  const viewedSessions = sessionList.filter(s => s.viewed.size > 0).length;
  const cartSessions = sessionList.filter(s => s.carted).length;
  const checkoutSessions = sessionList.filter(s => s.checkout).length;
  const purchaseSessions = sessionList.filter(s => s.purchased).length;
  const bounces = sessionList.filter(s => s.pageViews <= 1 && s.clicks === 0 && s.viewed.size === 0).length;
  const avgSessionSeconds = totalSessions ? Math.round(sessionList.reduce((a, s) => a + (s.last - s.first) / 1000, 0) / totalSessions) : 0;
  const siteConversion = pct(purchaseSessions, totalSessions);

  // ---------- Orders ----------
  const allOrders = (input.orders || []).filter(o => o && o.createdAt);
  const orders = allOrders.filter(o => new Date(o.createdAt).getTime() >= since);
  const valid = orders.filter(o => !CANCELLED.has(o.status));
  const delivered = orders.filter(o => o.status === 'DELIVERED');
  const cancelled = orders.filter(o => CANCELLED.has(o.status));
  const revenue = valid.reduce((a, o) => a + (Number(o.totalAmount) || 0), 0);
  const deliveredRevenue = delivered.reduce((a, o) => a + (Number(o.totalAmount) || 0), 0);

  const orderHours = new Array(24).fill(0);
  const orderWeekdays = new Array(7).fill(0);
  const cities = new Map<string, { city: string; orders: number; valid: number; delivered: number; cancelled: number; revenue: number }>();
  const sourcesFromOrders = new Map<string, { source: string; orders: number; valid: number; revenue: number }>();
  const packs = new Map<number, number>();
  const basketCount = new Map<string, number>();
  const pairCount = new Map<string, number>();
  let multiItemOrders = 0;

  for (const o of orders) {
    const c = casablanca(new Date(o.createdAt));
    orderHours[c.hour]++;
    orderWeekdays[c.weekday]++;
    const isValid = !CANCELLED.has(o.status);

    const rawCity = o.shippingAddress?.city || 'Inconnue';
    const ck = cityKey(rawCity) || 'inconnue';
    const city = cities.get(ck) || { city: rawCity, orders: 0, valid: 0, delivered: 0, cancelled: 0, revenue: 0 };
    city.orders++;
    if (isValid) { city.valid++; city.revenue += Number(o.totalAmount) || 0; }
    if (o.status === 'DELIVERED') city.delivered++;
    if (!isValid) city.cancelled++;
    cities.set(ck, city);

    const src = o.utmSource ? String(o.utmSource) : 'non renseignée';
    const srow = sourcesFromOrders.get(src) || { source: src, orders: 0, valid: 0, revenue: 0 };
    srow.orders++;
    if (isValid) { srow.valid++; srow.revenue += Number(o.totalAmount) || 0; }
    sourcesFromOrders.set(src, srow);

    const ids = new Set<string>();
    for (const it of o.items || []) {
      const ref = resolveProduct(it.productId, it.productName);
      if (!ref) continue;
      ids.add(ref.id);
      const row = productRow(ref);
      const qty = Number(it.quantity) || 1;
      const pieces = qty * (Number(it.packPieces) || 1);
      packs.set(pieces, (packs.get(pieces) || 0) + 1);
      row.units += pieces;
      if (isValid) row.revenue += Number(it.subtotal) || (Number(it.unitPrice) || 0) * qty;
    }
    ids.forEach(id => {
      const row = productStats.get(id)!;
      row.orders++;
      if (isValid) row.validOrders++;
      if (o.status === 'DELIVERED') row.delivered++;
      if (!isValid) row.cancelled++;
      if (isValid) basketCount.set(id, (basketCount.get(id) || 0) + 1);
    });
    if (isValid && ids.size >= 2) {
      multiItemOrders++;
      const list = [...ids].sort();
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const k = `${list[i]}|${list[j]}`;
        pairCount.set(k, (pairCount.get(k) || 0) + 1);
      }
    }
  }

  // ---------- Products ----------
  const products = [...productStats.values()].map(r => ({
    id: r.product.id,
    name: r.product.name,
    image: r.product.image,
    views: r.viewSessions.size,
    carts: r.cartSessions.size,
    checkouts: r.checkoutSessions.size,
    purchases: r.purchaseSessions.size,
    orders: r.orders,
    validOrders: r.validOrders,
    delivered: r.delivered,
    cancelled: r.cancelled,
    units: r.units,
    revenue: Math.round(r.revenue),
    viewToCheckout: pct(r.checkoutSessions.size, r.viewSessions.size),
    viewToOrder: pct(Math.max(r.purchaseSessions.size, 0), r.viewSessions.size),
    cancelRate: pct(r.cancelled, r.orders)
  })).sort((a, b) => b.revenue - a.revenue || b.views - a.views);

  // ---------- Channels & devices ----------
  const groupSessions = (key: (s: Session) => string) => {
    const m = new Map<string, { key: string; sessions: number; viewed: number; checkouts: number; purchases: number; revenue: number; bounces: number }>();
    for (const s of sessionList) {
      const k = key(s);
      const row = m.get(k) || { key: k, sessions: 0, viewed: 0, checkouts: 0, purchases: 0, revenue: 0, bounces: 0 };
      row.sessions++;
      if (s.viewed.size) row.viewed++;
      if (s.checkout) row.checkouts++;
      if (s.purchased) { row.purchases++; row.revenue += s.revenue; }
      if (s.pageViews <= 1 && s.clicks === 0 && s.viewed.size === 0) row.bounces++;
      m.set(k, row);
    }
    return [...m.values()].map(r => ({
      ...r, revenue: Math.round(r.revenue), conversion: pct(r.purchases, r.sessions), bounceRate: pct(r.bounces, r.sessions),
      checkoutRate: pct(r.checkouts, r.sessions)
    })).sort((a, b) => b.sessions - a.sessions);
  };
  const sources = groupSessions(s => s.source);
  const devices = groupSessions(s => s.device);
  const landings = groupSessions(s => s.landing).slice(0, 15);

  // ---------- Cities ----------
  const cityList = [...cities.values()].map(c => ({
    ...c, revenue: Math.round(c.revenue), cancelRate: pct(c.cancelled, c.orders), deliveryRate: pct(c.delivered, c.orders)
  })).sort((a, b) => b.orders - a.orders);

  // ---------- Market basket (orders) and products viewed together (sessions) ----------
  const nValid = valid.length;
  const basket = [...pairCount.entries()].map(([k, n]) => {
    const [a, b] = k.split('|');
    const ca = basketCount.get(a) || 1, cb = basketCount.get(b) || 1;
    const confidence = n / Math.min(ca, cb);
    return {
      a: productStats.get(a)!.product.name, b: productStats.get(b)!.product.name, orders: n,
      support: pct(n, nValid), confidence: Math.round(confidence * 100),
      lift: Math.round(((n * nValid) / (ca * cb)) * 100) / 100
    };
  }).sort((x, y) => y.orders - x.orders).slice(0, 10);

  const coViewCount = new Map<string, number>();
  for (const s of sessionList) {
    const list = [...s.viewed].sort();
    if (list.length < 2 || list.length > 12) continue;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const k = `${list[i]}|${list[j]}`;
      coViewCount.set(k, (coViewCount.get(k) || 0) + 1);
    }
  }
  const coViews = [...coViewCount.entries()].map(([k, n]) => {
    const [a, b] = k.split('|');
    return { a: productStats.get(a)?.product.name || a, b: productStats.get(b)?.product.name || b, sessions: n };
  }).sort((x, y) => y.sessions - x.sessions).slice(0, 10);

  // ---------- Customers (RFM on every order, not only the period) ----------
  const customers = new Map<string, { phone: string; name: string; city: string; orders: number; spent: number; last: number; first: number }>();
  for (const o of allOrders) {
    if (CANCELLED.has(o.status)) continue;
    const phone = normalizePhone(o.customerPhone || o.shippingAddress?.phone);
    if (phone.length < 9) continue;
    const t = new Date(o.createdAt).getTime();
    const c = customers.get(phone) || { phone, name: o.customerName || '', city: o.shippingAddress?.city || '', orders: 0, spent: 0, last: 0, first: t };
    c.orders++;
    c.spent += Number(o.totalAmount) || 0;
    if (t > c.last) { c.last = t; c.name = o.customerName || c.name; c.city = o.shippingAddress?.city || c.city; }
    c.first = Math.min(c.first, t);
    customers.set(phone, c);
  }
  const SEGMENTS: Record<string, string> = {
    Champions: 'Offre VIP / avant-première par WhatsApp',
    'Clients fidèles': 'Proposer un produit complémentaire (cross-sell)',
    'Nouveaux clients': 'Message de suivi après livraison + demande d’avis',
    'À risque': 'Relance WhatsApp avec une remise limitée',
    'Endormis': 'Nouveautés ou pack spécial pour les réveiller',
    'Achat unique': 'Retargeting publicitaire avec un autre produit'
  };
  const customerList = [...customers.values()].map(c => {
    const recencyDays = Math.floor((now - c.last) / DAY_MS);
    const segment =
      c.orders >= 3 && recencyDays <= 45 ? 'Champions' :
      c.orders >= 2 && recencyDays <= 90 ? 'Clients fidèles' :
      c.orders >= 2 ? 'À risque' :
      recencyDays <= 21 ? 'Nouveaux clients' :
      recencyDays > 90 ? 'Endormis' : 'Achat unique';
    return { ...c, spent: Math.round(c.spent), recencyDays, segment };
  });
  const segments = Object.entries(SEGMENTS).map(([segment, action]) => {
    const list = customerList.filter(c => c.segment === segment);
    return {
      segment, action, count: list.length, share: pct(list.length, customerList.length),
      avgSpent: list.length ? Math.round(list.reduce((a, c) => a + c.spent, 0) / list.length) : 0,
      avgOrders: list.length ? Math.round((list.reduce((a, c) => a + c.orders, 0) / list.length) * 10) / 10 : 0,
      avgRecencyDays: list.length ? Math.round(list.reduce((a, c) => a + c.recencyDays, 0) / list.length) : 0
    };
  });
  const repeatCustomers = customerList.filter(c => c.orders >= 2).length;

  // ---------- Abandoned order forms ----------
  const ordersByPhone = new Map<string, any[]>();
  for (const o of allOrders) {
    const p = normalizePhone(o.customerPhone || o.shippingAddress?.phone);
    if (p.length < 9) continue;
    (ordersByPhone.get(p) || ordersByPhone.set(p, []).get(p)!).push(o);
  }
  const leads = (input.leads || [])
    .filter(l => l && l.capturedInputs && new Date(l.updatedAt || l.createdAt || 0).getTime() >= since)
    .map(l => {
      const phone = normalizePhone(l.capturedInputs.phone);
      const startedAt = new Date(l.createdAt || l.capturedInputs.lastInputAt || 0).getTime();
      // First order from the same phone placed after the form was started (10 min margin for clock drift)
      const later = phone.length >= 9
        ? (ordersByPhone.get(phone) || [])
            .filter(o => new Date(o.createdAt).getTime() >= startedAt - 10 * 60 * 1000)
            .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))[0]
        : undefined;
      return {
        id: l.id,
        name: l.capturedInputs.fullName || '',
        phone: l.capturedInputs.phone || '',
        city: l.capturedInputs.city || l.ipCity || '',
        address: l.capturedInputs.address || '',
        fieldsFilled: Number(l.capturedInputs.completedFieldsCount) || 0,
        productId: l.productId,
        productName: l.productName,
        productImage: l.productImage,
        pack: l.selectedPack || l.capturedInputs.selectedPack || 1,
        value: Number(l.potentialRevenue) || 0,
        source: l.referrerSource || '',
        device: l.deviceType || '',
        status: later ? 'PURCHASED' : l.status,
        orderNumber: later?.orderNumber,
        isContacted: !!l.isContacted,
        contactNotes: l.contactNotes || '',
        lastInputAt: l.capturedInputs.lastInputAt || l.updatedAt
      };
    })
    .sort((a, b) => String(b.lastInputAt).localeCompare(String(a.lastInputAt)));
  const openLeads = leads.filter(l => l.status !== 'PURCHASED' && normalizePhone(l.phone).length >= 9);
  const recoveredLeads = leads.filter(l => l.status === 'PURCHASED' && l.isContacted);
  const openLeadValue = openLeads.reduce((a, l) => a + l.value, 0);

  // ---------- Clicks ----------
  const topClicks = [...clickCounts.values()]
    .map(c => ({ label: c.label, page: c.page, count: c.count, sessions: c.sessions.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // ---------- Recommendations ----------
  const recs: Recommendation[] = [];
  const add = (priority: Priority, area: string, title: string, detail: string) => recs.push({ priority, area, title, detail });

  if (totalSessions < 30) {
    add('info', 'Données', 'Pas encore assez de visites pour des conclusions solides',
      `${totalSessions} visite(s) enregistrée(s) sur ${input.rangeDays} jours. Les tendances deviennent fiables à partir d’environ 100 visites et 20 commandes ; en attendant, lisez les chiffres comme des indices.`);
  }
  if (!input.conversionApis.meta && !input.conversionApis.tiktok) {
    add('haute', 'Tracking', 'Conversions API non configurées',
      'Les achats ne sont envoyés à Meta/TikTok que par le pixel du navigateur (bloqué par beaucoup de téléphones). Ajoutez META_ACCESS_TOKEN et TIKTOK_ACCESS_TOKEN sur Railway pour que les publicités optimisent sur les vraies commandes.');
  }

  if (openLeads.length > 0) {
    const notContacted = openLeads.filter(l => !l.isContacted);
    add(notContacted.length > 0 ? 'haute' : 'moyenne', 'Formulaire', `${openLeads.length} client(s) ont tapé leur numéro sans valider`,
      `${Math.round(openLeadValue)} DH de commandes potentielles, dont ${notContacted.length} jamais relancé(s). Un message WhatsApp dans l’heure récupère souvent 20 à 40 % de ces commandes (onglet « Formulaires abandonnés »).`);
  }

  if (checkoutSessions >= 10) {
    const formDrop = 100 - pct(purchaseSessions, checkoutSessions);
    if (formDrop >= 50) {
      add('haute', 'Formulaire', `${Math.round(formDrop)} % des visiteurs qui commencent le formulaire ne l’envoient pas`,
        'Réduisez le formulaire au strict minimum (nom, téléphone, ville), affichez le total livraison comprise avant le bouton et rappelez « paiement à la livraison » juste au-dessus du bouton.');
    }
  }
  if (viewedSessions >= 30) {
    const viewToCheckout = pct(checkoutSessions, viewedSessions);
    if (viewToCheckout < 10) {
      add('haute', 'Produits', `Seulement ${viewToCheckout} % des visiteurs d’une fiche produit commencent à commander`,
        'La fiche ne convainc pas : mettez une vidéo courte en premier, le prix barré et l’offre pack au-dessus de la ligne de flottaison, et des avis avec photos.');
    }
  }

  const productsWithViews = products.filter(p => p.views >= 20);
  const avgProductConv = productsWithViews.length
    ? productsWithViews.reduce((a, p) => a + p.viewToOrder, 0) / productsWithViews.length : 0;
  for (const p of productsWithViews) {
    if (p.purchases === 0 && p.views >= 30) {
      add('haute', 'Produits', `« ${p.name} » : ${p.views} visiteurs, aucune commande`,
        'Vérifiez le prix face à la concurrence, la première image/vidéo et la promesse de l’annonce qui envoie ce trafic. Sinon arrêtez la publicité sur ce produit.');
    } else if (avgProductConv > 0 && p.viewToOrder < avgProductConv / 2) {
      add('moyenne', 'Produits', `« ${p.name} » convertit 2× moins que la moyenne`,
        `${p.viewToOrder} % des visiteurs commandent contre ${Math.round(avgProductConv * 10) / 10} % en moyenne. Testez une offre pack, une vidéo démonstration ou un prix d’appel.`);
    }
  }
  const star = [...productsWithViews].sort((a, b) => b.viewToOrder - a.viewToOrder)[0];
  if (star && star.viewToOrder > 0 && star.viewToOrder >= avgProductConv * 1.3) {
    add('moyenne', 'Publicité', `« ${star.name} » est votre meilleur convertisseur (${star.viewToOrder} %)`,
      'Mettez plus de budget publicitaire sur ce produit et utilisez-le comme produit d’appel sur la page d’accueil.');
  }
  for (const p of products.filter(x => x.orders >= 5 && x.cancelRate >= 35)) {
    add('haute', 'Livraison', `« ${p.name} » : ${p.cancelRate} % de commandes annulées/retournées`,
      'Le produit reçu ne correspond peut-être pas à l’attente : alignez photos et description sur le produit réel et confirmez chaque commande par téléphone/WhatsApp avant l’envoi.');
  }

  for (const s of sources.filter(x => x.sessions >= 25)) {
    if (s.purchases === 0) {
      add('haute', 'Publicité', `${s.key} : ${s.sessions} visites, 0 commande`,
        `Taux de rebond ${s.bounceRate} %. Revoyez le ciblage et la cohérence annonce → page, ou coupez ce budget.`);
    } else if (siteConversion > 0 && s.conversion >= siteConversion * 1.5) {
      add('moyenne', 'Publicité', `${s.key} convertit le mieux (${s.conversion} %)`,
        `Moyenne du site : ${siteConversion} %. C’est le canal où augmenter le budget en priorité.`);
    }
  }
  if (totalSessions >= 30 && pct(bounces, totalSessions) >= 65) {
    add('moyenne', 'Page', `${pct(bounces, totalSessions)} % des visiteurs partent sans rien faire`,
      'Vérifiez la vitesse de chargement sur mobile 4G et que la première image reprend exactement le produit de l’annonce.');
  }

  const mobile = devices.find(d => d.key === 'mobile');
  const desktop = devices.find(d => d.key === 'desktop');
  if (mobile && desktop && mobile.sessions >= 30 && desktop.sessions >= 15 && mobile.conversion < desktop.conversion / 2) {
    add('haute', 'Mobile', 'Le mobile convertit 2× moins que l’ordinateur',
      `${mobile.conversion} % sur mobile contre ${desktop.conversion} % sur ordinateur. Testez le formulaire sur téléphone : bouton visible sans défiler, clavier numérique pour le téléphone.`);
  }

  if (orders.length >= 15) {
    const top = orderHours.map((n, h) => ({ h, n })).sort((a, b) => b.n - a.n).slice(0, 3).map(x => `${x.h}h`);
    const bestDay = orderWeekdays.map((n, d) => ({ d, n })).sort((a, b) => b.n - a.n)[0];
    add('info', 'Horaires', `Les commandes arrivent surtout vers ${top.join(', ')}`,
      `Meilleur jour : ${WEEKDAYS[bestDay.d]}. Concentrez le budget publicitaire et la disponibilité WhatsApp sur ces créneaux.`);
  }

  for (const c of cityList.filter(x => x.orders >= 5 && x.cancelRate >= 40)) {
    add('haute', 'Livraison', `${c.city} : ${c.cancelRate} % d’annulations/refus`,
      'Confirmez systématiquement par appel avant expédition dans cette ville, ou excluez-la du ciblage publicitaire.');
  }
  const deliveredOrClosed = delivered.length + cancelled.length;
  if (deliveredOrClosed >= 10 && pct(delivered.length, deliveredOrClosed) < 65) {
    add('haute', 'Livraison', `Taux de livraison ${pct(delivered.length, deliveredOrClosed)} %`,
      'En COD, en dessous de 65 % la publicité n’est plus rentable. Confirmez chaque commande par WhatsApp (Salma) et relancez la veille de la livraison.');
  }

  const packOrders = [...packs.entries()];
  const totalLines = packOrders.reduce((a, [, n]) => a + n, 0);
  const multiPack = packOrders.filter(([q]) => q >= 2).reduce((a, [, n]) => a + n, 0);
  if (totalLines >= 10 && pct(multiPack, totalLines) < 20) {
    add('moyenne', 'Panier moyen', `Seulement ${pct(multiPack, totalLines)} % des achats sont des packs`,
      'Mettez en avant le pack 2 (« le plus choisi ») avec l’économie en DH, et faites proposer le pack par Salma sur WhatsApp.');
  }
  if (basket[0] && basket[0].orders >= 2) {
    add('moyenne', 'Panier moyen', `« ${basket[0].a} » et « ${basket[0].b} » sont souvent achetés ensemble`,
      `${basket[0].orders} commande(s) les contiennent tous les deux (lift ${basket[0].lift}). Créez un bundle à prix spécial.`);
  } else if (coViews[0] && coViews[0].sessions >= 5) {
    add('info', 'Panier moyen', `« ${coViews[0].a} » et « ${coViews[0].b} » sont souvent regardés ensemble`,
      `${coViews[0].sessions} visiteurs ont consulté les deux. Proposez l’un sur la fiche de l’autre.`);
  }
  if (customerList.length >= 10) {
    add('info', 'Clients', `${repeatCustomers} client(s) sur ${customerList.length} ont commandé plusieurs fois`,
      `Taux de réachat ${pct(repeatCustomers, customerList.length)} %. Envoyez une offre WhatsApp aux clients livrés il y a 2-4 semaines (segment « Nouveaux clients »).`);
  }

  const order: Record<Priority, number> = { haute: 0, moyenne: 1, info: 2 };
  recs.sort((a, b) => order[a.priority] - order[b.priority]);

  return {
    generatedAt: new Date(now).toISOString(),
    rangeDays: input.rangeDays,
    coverage: {
      events: input.events.length,
      firstEventAt: events[0]?.timestamp,
      sessions: totalSessions,
      orders: orders.length,
      leads: leads.length,
      conversionApis: input.conversionApis
    },
    kpis: {
      sessions: totalSessions,
      avgSessionSeconds,
      bounceRate: pct(bounces, totalSessions),
      conversion: siteConversion,
      orders: orders.length,
      validOrders: valid.length,
      revenue: Math.round(revenue),
      deliveredRevenue: Math.round(deliveredRevenue),
      averageOrderValue: valid.length ? Math.round(revenue / valid.length) : 0,
      deliveryRate: pct(delivered.length, deliveredOrClosed),
      cancelRate: pct(cancelled.length, orders.length),
      avgSecondsToPurchase: purchaseSecondsCount ? Math.round(purchaseSecondsTotal / purchaseSecondsCount) : 0,
      openLeads: openLeads.length,
      openLeadValue: Math.round(openLeadValue),
      recoveredLeads: recoveredLeads.length,
      repeatCustomers,
      customers: customerList.length
    },
    funnel: [
      { stage: 'Visites', sessions: totalSessions },
      { stage: 'Fiche produit vue', sessions: viewedSessions },
      { stage: 'Ajout au panier', sessions: cartSessions },
      { stage: 'Formulaire commencé', sessions: checkoutSessions },
      { stage: 'Commande envoyée', sessions: purchaseSessions }
    ],
    recommendations: recs,
    products,
    sources,
    orderSources: [...sourcesFromOrders.values()].map(s => ({ ...s, revenue: Math.round(s.revenue) })).sort((a, b) => b.orders - a.orders),
    devices,
    landings,
    cities: cityList,
    hours: visitHours.map((visits, hour) => ({ hour, visits, orders: orderHours[hour] })),
    weekdays: visitWeekdays.map((visits, d) => ({ day: WEEKDAYS[d], visits, orders: orderWeekdays[d] })),
    packs: packOrders.sort((a, b) => a[0] - b[0]).map(([pieces, count]) => ({ pieces, count, share: pct(count, totalLines) })),
    basket,
    multiItemOrders,
    coViews,
    segments,
    topCustomers: customerList.sort((a, b) => b.spent - a.spent).slice(0, 15)
      .map(c => ({ name: c.name, phone: c.phone, city: c.city, orders: c.orders, spent: c.spent, recencyDays: c.recencyDays, segment: c.segment })),
    leads: leads.slice(0, 200),
    topClicks
  };
}

function pagePath(url?: string): string {
  if (!url) return '/';
  try {
    const u = new URL(url);
    const product = u.searchParams.get('product');
    return product ? `${u.pathname}?product=${product}` : u.pathname || '/';
  } catch {
    return url.split('#')[0] || '/';
  }
}

export type DataMiningReport = ReturnType<typeof buildDataMiningReport>;
