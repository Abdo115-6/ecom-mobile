// Profit workflow: stock purchases -> orders -> delivery outcome -> ad spend -> other expenses -> net profit and cash.
// Pure functions so the margin page and any report compute the same numbers.
import type { Order, Product } from '../types/ecommerce';

export type AdPlatform = 'facebook' | 'tiktok' | 'snapchat' | 'google' | 'other';
export type OrderOutcome = 'pending' | 'dispatched' | 'delivered' | 'returned' | 'cancelled';

export interface StockPurchase {
  id: string;
  date: string; // YYYY-MM-DD
  productId: string;
  productName: string;
  quantity: number; // pieces
  unitCost: number;
  total: number;
  supplier?: string;
  note?: string;
}

export interface AdSpend {
  id: string;
  date: string;
  endDate?: string;
  platform: AdPlatform;
  campaign?: string;
  productId?: string;
  amount: number;
  note?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  label: string;
  amount: number;
}

/** Real figures entered for one order (overrides what is derived from the order) */
export interface OrderCost {
  id: string; // order id
  collected?: number;
  courierCost?: number;
  outcome?: 'delivered' | 'returned' | 'cancelled';
  restocked?: boolean;
  note?: string;
}

export interface FinanceSettings {
  id: 'settings';
  openingCash: number;
  defaultReturnCost: number;
}

export interface FinanceData {
  purchase: StockPurchase[];
  ad: AdSpend[];
  expense: Expense[];
  order: OrderCost[];
  settings: FinanceSettings[];
}

export const AD_PLATFORM_LABELS: Record<AdPlatform, string> = {
  facebook: 'Facebook / Instagram',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  google: 'Google',
  other: 'Autre'
};

export const OUTCOME_LABELS: Record<OrderOutcome, string> = {
  pending: 'En attente',
  dispatched: 'Expédiée',
  delivered: 'Livrée',
  returned: 'Retour / refusée',
  cancelled: 'Annulée'
};

/** Sales channel of an order from its UTM / traffic source */
export function orderChannel(order: Pick<Order, 'utmSource'>): AdPlatform | 'direct' {
  const s = String(order.utmSource || '').toLowerCase();
  if (s.includes('tiktok')) return 'tiktok';
  if (/facebook|^fb|meta|instagram|^ig/.test(s)) return 'facebook';
  if (s.includes('snap')) return 'snapchat';
  if (s.includes('google') || s.includes('gads')) return 'google';
  return 'direct';
}

/** Pieces per sold unit: explicit packPieces, or "(2 pcs)" in older order titles */
export const piecesPerUnit = (item: Order['items'][number]): number => {
  if (item.packPieces && item.packPieces > 0) return item.packPieces;
  const match = item.variantTitle?.match(/\((\d+)\s*pcs?\)/i);
  return match ? Number(match[1]) : 1;
};

export const orderPieces = (order: Order, productId?: string) =>
  order.items.filter(i => !productId || i.productId === productId).reduce((s, i) => s + i.quantity * piecesPerUnit(i), 0);

/** Where the order is in its delivery lifecycle; a manual outcome wins over the status */
export function orderOutcome(order: Order, cost?: OrderCost): OrderOutcome {
  if (cost?.outcome) return cost.outcome;
  if (order.status === 'DELIVERED') return 'delivered';
  if (order.status === 'SHIPPED') return 'dispatched';
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    // A parcel handed to the courier and then cancelled = refused or returned (the courier still charges)
    return order.shipment?.trackingNumber ? 'returned' : 'cancelled';
  }
  return 'pending';
}

export interface OrderProfit {
  order: Order;
  outcome: OrderOutcome;
  channel: AdPlatform | 'direct';
  pieces: number;
  merchandise: number;      // product price paid (after discounts)
  deliveryCharged: number;  // delivery fee paid by the customer
  collected: number;        // cash actually received (delivered only)
  productCost: number;      // purchase cost of the pieces (delivered, or returned and not restocked)
  courierCost: number;
  adCost: number;           // allocated advertising
  profit: number;           // before other expenses
  estimatedCourier: boolean;
}

export interface ProductProfit {
  product: Product;
  category: string;
  unitCost: number;          // average purchase cost per piece
  unitCostSource: 'achats' | 'fiche' | 'manquant';
  ordersDelivered: number;
  ordersReturned: number;
  ordersInProgress: number;
  piecesSold: number;
  collected: number;
  productCost: number;
  courierCost: number;
  adCost: number;
  profit: number;
  purchasedPieces: number;   // all time
  stockLeft: number | null;  // purchased - dispatched + restocked; null without purchases
}

export interface AdPerformance {
  platform: AdPlatform;
  spend: number;
  orders: number;
  delivered: number;
  returned: number;
  collected: number;
  profitBeforeAds: number;
  net: number;
  costPerDelivered: number | null;
  roas: number | null;
}

export interface FinanceReport {
  from: number;
  to: number;
  orders: OrderProfit[];
  products: ProductProfit[];
  categories: Array<{ category: string; products: number; piecesSold: number; collected: number; productCost: number; profit: number }>;
  ads: AdPerformance[];
  totals: {
    ordersAll: number;
    pending: number;
    dispatched: number;
    delivered: number;
    returned: number;
    cancelled: number;
    deliveryRate: number | null; // delivered / (delivered + returned)
    collected: number;
    merchandise: number;
    deliveryCharged: number;
    productCost: number;
    courierCost: number;
    returnCourierCost: number;
    adSpend: number;
    adAllocated: number;
    adEstimated: boolean;
    expenses: number;
    purchases: number;
    netProfit: number;
    profitPerDelivered: number | null;
    inTransitValue: number;
    piecesSold: number;
  };
  cash: {
    openingCash: number;
    collectedAllTime: number;
    purchasesAllTime: number;
    adsAllTime: number;
    courierAllTime: number;
    expensesAllTime: number;
    balance: number;
    inTransit: number;
    stockValue: number;
  };
  weeks: Array<{ weekStart: string; delivered: number; returned: number; collected: number; adSpend: number; expenses: number; netProfit: number }>;
  warnings: string[];
}

const dayMs = 86400000;
const ts = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).getTime();

const categoryOf = (p: Product, categories: Array<{ id: string; name: string }>) =>
  p.categoryName || categories.find(c => c.id === p.categoryId)?.name || 'Sans catégorie';

/** Monday of the week (local time), as YYYY-MM-DD */
const weekStart = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function buildFinanceReport(input: {
  orders: Order[];
  products: Product[];
  categories: Array<{ id: string; name: string }>;
  finance: FinanceData;
  from: number;
  to: number;
  defaultDeliveryCost: number;
}): FinanceReport {
  const { orders, products, categories, finance, from, to, defaultDeliveryCost } = input;
  const settings = finance.settings[0] || { id: 'settings', openingCash: 0, defaultReturnCost: 0 };
  const costs = new Map(finance.order.map(c => [c.id, c]));
  const productById = new Map(products.map(p => [p.id, p]));
  const inRange = (t: number) => t >= from && t <= to;
  const warnings: string[] = [];

  // Average purchase cost per piece from recorded purchases, else the cost on the product sheet
  const purchasedByProduct = new Map<string, { pieces: number; total: number }>();
  finance.purchase.forEach(pu => {
    const agg = purchasedByProduct.get(pu.productId) || { pieces: 0, total: 0 };
    agg.pieces += pu.quantity;
    agg.total += pu.total;
    purchasedByProduct.set(pu.productId, agg);
  });
  const unitCostOf = (productId: string): { cost: number; source: ProductProfit['unitCostSource'] } => {
    const agg = purchasedByProduct.get(productId);
    if (agg && agg.pieces > 0) return { cost: agg.total / agg.pieces, source: 'achats' };
    const p = productById.get(productId);
    if (p?.costPrice) return { cost: p.costPrice, source: 'fiche' };
    return { cost: 0, source: 'manquant' };
  };

  const productCourier = (productId: string) => {
    const p = productById.get(productId);
    if (!p) return defaultDeliveryCost;
    if ((p.productKind || 'PHYSICAL') !== 'PHYSICAL') return 0;
    return p.deliveryCost ?? defaultDeliveryCost;
  };

  // ---- Per order (all time, so cash and stock are complete; the period is applied afterwards)
  const computeOrder = (order: Order): OrderProfit => {
    const cost = costs.get(order.id);
    const outcome = orderOutcome(order, cost);
    const deliveryCharged = order.shippingFee || 0;
    const merchandise = Math.max(0, (order.totalAmount || 0) - deliveryCharged);
    const pieces = orderPieces(order);
    const isPhysical = order.items.some(i => (productById.get(i.productId)?.productKind || 'PHYSICAL') === 'PHYSICAL');

    let courierCost = 0;
    let estimatedCourier = false;
    if (cost?.courierCost !== undefined) courierCost = cost.courierCost;
    else if (outcome === 'delivered' || outcome === 'dispatched') {
      const ship = order.shipment as any;
      if (ship?.deliveredPrice) courierCost = Number(ship.deliveredPrice);
      else {
        courierCost = isPhysical ? Math.max(0, ...order.items.map(i => productCourier(i.productId))) : 0;
        estimatedCourier = isPhysical;
      }
    } else if (outcome === 'returned') {
      const ship = order.shipment as any;
      courierCost = Number(ship?.refusedPrice) || settings.defaultReturnCost || 0;
      estimatedCourier = !ship?.refusedPrice;
    }

    // Goods leave the stock when delivered; a returned parcel costs its goods only if not put back in stock
    const goodsLost = outcome === 'delivered' || (outcome === 'returned' && !cost?.restocked);
    const productCost = goodsLost
      ? order.items.reduce((s, i) => s + i.quantity * piecesPerUnit(i) * unitCostOf(i.productId).cost, 0)
      : 0;
    const collected = outcome === 'delivered' ? (cost?.collected ?? order.totalAmount ?? 0) : 0;

    return {
      order, outcome, channel: orderChannel(order), pieces, merchandise, deliveryCharged, collected,
      productCost, courierCost: outcome === 'delivered' || outcome === 'returned' ? courierCost : 0,
      adCost: 0, profit: 0, estimatedCourier: estimatedCourier && (outcome === 'delivered' || outcome === 'returned')
    };
  };
  const allOrders = orders.map(computeOrder);
  const periodOrders = allOrders.filter(o => inRange(new Date(o.order.createdAt).getTime()));

  // ---- Advertising: recorded spend in the period, spread over the delivered orders it paid for
  const periodAds = finance.ad.filter(a => inRange(ts(a.date)));
  const adSpend = periodAds.reduce((s, a) => s + a.amount, 0);
  const delivered = periodOrders.filter(o => o.outcome === 'delivered');
  let adAllocated = 0;
  const adEstimated = periodAds.length === 0;

  if (!adEstimated) {
    periodAds.forEach(ad => {
      // Same product (if set) and, when possible, orders that came from that platform
      const forProduct = delivered.filter(o => !ad.productId || o.order.items.some(i => i.productId === ad.productId));
      const fromPlatform = forProduct.filter(o => o.channel === ad.platform);
      const targets = fromPlatform.length > 0 ? fromPlatform : forProduct;
      const weight = targets.reduce((s, o) => s + (o.collected || 1), 0);
      if (targets.length === 0 || weight <= 0) return;
      targets.forEach(o => {
        const part = ad.amount * ((o.collected || 1) / weight);
        o.adCost += part;
        adAllocated += part;
      });
    });
  } else {
    // No spend recorded: fall back to the "Pub/cmd" estimate of each product
    delivered.forEach(o => {
      const est = Math.max(0, ...o.order.items.map(i => productById.get(i.productId)?.adCostPerOrder || 0));
      o.adCost = est;
      adAllocated += est;
    });
    if (delivered.length > 0 && adAllocated > 0) warnings.push('Aucune dépense publicitaire saisie sur la période : la pub est estimée avec le « Pub/cmd » de chaque produit.');
  }

  periodOrders.forEach(o => {
    o.profit = o.collected - o.productCost - o.courierCost - o.adCost;
  });

  // ---- Per product
  const productRows = new Map<string, ProductProfit>();
  products.forEach(p => {
    const uc = unitCostOf(p.id);
    productRows.set(p.id, {
      product: p, category: categoryOf(p, categories), unitCost: uc.cost, unitCostSource: uc.source,
      ordersDelivered: 0, ordersReturned: 0, ordersInProgress: 0, piecesSold: 0, collected: 0,
      productCost: 0, courierCost: 0, adCost: 0, profit: 0,
      purchasedPieces: purchasedByProduct.get(p.id)?.pieces || 0, stockLeft: null
    });
  });

  periodOrders.forEach(o => {
    const linesTotal = o.order.items.reduce((s, i) => s + (i.subtotal || i.unitPrice * i.quantity), 0) || 1;
    o.order.items.forEach(item => {
      const row = productRows.get(item.productId);
      if (!row) return;
      const share = (item.subtotal || item.unitPrice * item.quantity) / linesTotal;
      const pieces = item.quantity * piecesPerUnit(item);
      if (o.outcome === 'delivered') { row.ordersDelivered += 1; row.piecesSold += pieces; }
      else if (o.outcome === 'returned') row.ordersReturned += 1;
      else if (o.outcome === 'pending' || o.outcome === 'dispatched') row.ordersInProgress += 1;
      row.collected += o.collected * share;
      row.productCost += o.productCost > 0 ? pieces * row.unitCost : 0;
      row.courierCost += o.courierCost * share;
      row.adCost += o.adCost * share;
    });
  });

  // Stock: purchased - dispatched (shipped, delivered, returned) + returns put back in stock, all time
  const outByProduct = new Map<string, number>();
  allOrders.forEach(o => {
    if (!['dispatched', 'delivered', 'returned'].includes(o.outcome)) return;
    const back = o.outcome === 'returned' && costs.get(o.order.id)?.restocked;
    if (back) return;
    o.order.items.forEach(i => outByProduct.set(i.productId, (outByProduct.get(i.productId) || 0) + i.quantity * piecesPerUnit(i)));
  });

  let stockValue = 0;
  productRows.forEach(r => {
    r.profit = r.collected - r.productCost - r.courierCost - r.adCost;
    if (r.purchasedPieces > 0) {
      r.stockLeft = r.purchasedPieces - (outByProduct.get(r.product.id) || 0);
      stockValue += Math.max(0, r.stockLeft) * r.unitCost;
    }
  });

  const missing = [...productRows.values()].filter(r => r.piecesSold > 0 && r.unitCostSource === 'manquant');
  if (missing.length) warnings.push(`Coût d'achat manquant pour ${missing.map(r => r.product.name).join(', ')} : leur bénéfice est surestimé.`);
  const estCourier = periodOrders.filter(o => o.estimatedCourier).length;
  if (estCourier) warnings.push(`${estCourier} commande(s) utilisent un coût livreur estimé (fiche produit ou frais de retour par défaut) : saisissez le vrai montant dans l'onglet Livraisons.`);

  // ---- Categories
  const catMap = new Map<string, FinanceReport['categories'][number]>();
  productRows.forEach(r => {
    const c = catMap.get(r.category) || { category: r.category, products: 0, piecesSold: 0, collected: 0, productCost: 0, profit: 0 };
    c.products += 1; c.piecesSold += r.piecesSold; c.collected += r.collected; c.productCost += r.productCost; c.profit += r.profit;
    catMap.set(r.category, c);
  });

  // ---- Ad platforms
  const platforms: AdPlatform[] = ['facebook', 'tiktok', 'snapchat', 'google', 'other'];
  const ads: AdPerformance[] = platforms.map(platform => {
    const spend = periodAds.filter(a => a.platform === platform).reduce((s, a) => s + a.amount, 0);
    const own = periodOrders.filter(o => o.channel === platform);
    const del = own.filter(o => o.outcome === 'delivered');
    const collected = del.reduce((s, o) => s + o.collected, 0);
    const profitBeforeAds = own.reduce((s, o) => s + o.collected - o.productCost - o.courierCost, 0);
    return {
      platform, spend, orders: own.length, delivered: del.length,
      returned: own.filter(o => o.outcome === 'returned').length,
      collected, profitBeforeAds, net: profitBeforeAds - spend,
      costPerDelivered: del.length ? spend / del.length : null,
      roas: spend > 0 ? collected / spend : null
    };
  }).filter(a => a.spend > 0 || a.orders > 0);

  // ---- Totals for the period
  const periodExpenses = finance.expense.filter(e => inRange(ts(e.date))).reduce((s, e) => s + e.amount, 0);
  const periodPurchases = finance.purchase.filter(p => inRange(ts(p.date))).reduce((s, p) => s + p.total, 0);
  const count = (k: OrderOutcome) => periodOrders.filter(o => o.outcome === k).length;
  const sum = (f: (o: OrderProfit) => number, list = periodOrders) => list.reduce((s, o) => s + f(o), 0);
  const collected = sum(o => o.collected);
  const productCost = sum(o => o.productCost);
  const courierCost = sum(o => o.courierCost);
  // Every dirham charged by the ad platforms counts, even when no delivered order absorbed it
  const adCostTotal = adEstimated ? adAllocated : adSpend;
  const netProfit = collected - productCost - courierCost - adCostTotal - periodExpenses;
  const nDelivered = count('delivered');
  const nReturned = count('returned');

  // ---- Cash (all time): what came in minus what went out
  const collectedAllTime = allOrders.reduce((s, o) => s + o.collected, 0);
  const courierAllTime = allOrders.reduce((s, o) => s + o.courierCost, 0);
  const purchasesAllTime = finance.purchase.reduce((s, p) => s + p.total, 0);
  const adsAllTime = finance.ad.reduce((s, a) => s + a.amount, 0);
  const expensesAllTime = finance.expense.reduce((s, e) => s + e.amount, 0);
  const inTransit = allOrders.filter(o => o.outcome === 'dispatched').reduce((s, o) => s + (o.order.totalAmount || 0), 0);

  // ---- Weekly (period)
  const weekMap = new Map<string, FinanceReport['weeks'][number]>();
  const wk = (key: string) => {
    const w = weekMap.get(key) || { weekStart: key, delivered: 0, returned: 0, collected: 0, adSpend: 0, expenses: 0, netProfit: 0 };
    weekMap.set(key, w);
    return w;
  };
  periodOrders.forEach(o => {
    const w = wk(weekStart(new Date(o.order.createdAt).getTime()));
    if (o.outcome === 'delivered') w.delivered += 1;
    if (o.outcome === 'returned') w.returned += 1;
    w.collected += o.collected;
    w.netProfit += o.collected - o.productCost - o.courierCost - (adEstimated ? o.adCost : 0);
  });
  if (!adEstimated) periodAds.forEach(a => { const w = wk(weekStart(ts(a.date))); w.adSpend += a.amount; w.netProfit -= a.amount; });
  finance.expense.filter(e => inRange(ts(e.date))).forEach(e => { const w = wk(weekStart(ts(e.date))); w.expenses += e.amount; w.netProfit -= e.amount; });

  return {
    from, to,
    orders: periodOrders.sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime()),
    products: [...productRows.values()],
    categories: [...catMap.values()].filter(c => c.products > 0).sort((a, b) => b.profit - a.profit),
    ads,
    totals: {
      ordersAll: periodOrders.length,
      pending: count('pending'),
      dispatched: count('dispatched'),
      delivered: nDelivered,
      returned: nReturned,
      cancelled: count('cancelled'),
      deliveryRate: nDelivered + nReturned > 0 ? nDelivered / (nDelivered + nReturned) : null,
      collected,
      merchandise: sum(o => (o.outcome === 'delivered' ? o.collected - o.deliveryCharged : 0)),
      deliveryCharged: sum(o => (o.outcome === 'delivered' ? o.deliveryCharged : 0)),
      productCost,
      courierCost,
      returnCourierCost: sum(o => (o.outcome === 'returned' ? o.courierCost : 0)),
      adSpend: adCostTotal,
      adAllocated,
      adEstimated,
      expenses: periodExpenses,
      purchases: periodPurchases,
      netProfit,
      profitPerDelivered: nDelivered ? netProfit / nDelivered : null,
      inTransitValue: periodOrders.filter(o => o.outcome === 'dispatched').reduce((s, o) => s + (o.order.totalAmount || 0), 0),
      piecesSold: sum(o => (o.outcome === 'delivered' ? o.pieces : 0))
    },
    cash: {
      openingCash: settings.openingCash || 0,
      collectedAllTime,
      purchasesAllTime,
      adsAllTime,
      courierAllTime,
      expensesAllTime,
      balance: (settings.openingCash || 0) + collectedAllTime - purchasesAllTime - adsAllTime - courierAllTime - expensesAllTime,
      inTransit,
      stockValue
    },
    weeks: [...weekMap.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart)),
    warnings
  };
}

export const periodBounds = (days: number | 'all'): { from: number; to: number } => ({
  from: days === 'all' ? 0 : Date.now() - days * dayMs,
  to: Date.now() + dayMs
});
