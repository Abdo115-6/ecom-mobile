import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Product, Order, OrderStatus } from '../../types/ecommerce';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Truck,
  Megaphone,
  Search,
  Download,
  Save,
  AlertTriangle,
  Layers,
  Percent
} from 'lucide-react';

type Period = '7d' | '30d' | '90d' | 'all';
type StatusScope = 'delivered' | 'active' | 'all';

const PERIOD_LABELS: Record<Period, string> = { '7d': '7 jours', '30d': '30 jours', '90d': '90 jours', all: 'Tout' };

const STATUS_SCOPES: Record<StatusScope, { label: string; statuses: OrderStatus[] }> = {
  delivered: { label: 'Livrées uniquement', statuses: ['DELIVERED'] },
  active: { label: 'Confirmées + expédiées + livrées', statuses: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
  all: { label: 'Toutes (hors annulées)', statuses: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
};

interface ProductProfit {
  product: Product;
  category: string;
  orders: number;
  pieces: number;
  revenue: number;          // merchandise money received (after discounts)
  shippingCollected: number; // delivery fees paid by customers
  purchaseCost: number;
  deliveryCost: number;     // paid to the delivery company
  adCost: number;
  netProfit: number;
}

interface CostDraft {
  costPrice: string;
  price: string;
  deliveryCost: string;
  adCostPerOrder: string;
}

/** Pieces per sold unit: explicit packPieces, or "(2 pcs)" in older order titles */
const piecesPerUnit = (item: Order['items'][number]): number => {
  if (item.packPieces && item.packPieces > 0) return item.packPieces;
  const match = item.variantTitle?.match(/\((\d+)\s*pcs?\)/i);
  return match ? Number(match[1]) : 1;
};

const defaultDeliveryCost = () => dbService.settings.defaultDeliveryCost ?? 35;

const productDeliveryCost = (p: Product | undefined): number => {
  if (!p) return defaultDeliveryCost();
  if ((p.productKind || 'PHYSICAL') !== 'PHYSICAL') return 0;
  return p.deliveryCost ?? defaultDeliveryCost();
};

export const CalculationAdminView: React.FC = () => {
  const { formatMoney, showToast, currentUser, refreshProducts } = useApp();
  const [period, setPeriod] = useState<Period>('30d');
  const [statusScope, setStatusScope] = useState<StatusScope>('active');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'profit-desc' | 'profit-asc' | 'revenue-desc' | 'margin-desc' | 'pieces-desc'>('profit-desc');
  const [drafts, setDrafts] = useState<Record<string, CostDraft>>({});
  const [version, setVersion] = useState(0);

  // Price simulator
  const [simBuy, setSimBuy] = useState(80);
  const [simSell, setSimSell] = useState(249);
  const [simClientDelivery, setSimClientDelivery] = useState(dbService.settings.standardShippingFee ?? 35);
  const [simCarrier, setSimCarrier] = useState(defaultDeliveryCost());
  const [simAds, setSimAds] = useState(30);
  const [simTargetMargin, setSimTargetMargin] = useState(30);

  const products = useMemo(() => [...dbService.products], [version]);

  const categoryOf = (p: Product) =>
    p.categoryName || dbService.categories.find(c => c.id === p.categoryId)?.name || 'Sans catégorie';

  const categories = useMemo(() => [...new Set(products.map(categoryOf))].sort(), [products]);

  const filteredOrders = useMemo(() => {
    const since = period === 'all' ? 0 : Date.now() - { '7d': 7, '30d': 30, '90d': 90 }[period] * 86400000;
    const statuses = STATUS_SCOPES[statusScope].statuses;
    return dbService.orders.filter(o => statuses.includes(o.status) && new Date(o.createdAt).getTime() >= since);
  }, [period, statusScope, version]);

  // Allocates each order's real money (merchandise, delivery fee, delivery cost) across its lines
  const rows = useMemo(() => {
    const byProduct = new Map<string, ProductProfit>();
    products.forEach(p => byProduct.set(p.id, {
      product: p, category: categoryOf(p), orders: 0, pieces: 0, revenue: 0, shippingCollected: 0,
      purchaseCost: 0, deliveryCost: 0, adCost: 0, netProfit: 0
    }));

    filteredOrders.forEach(order => {
      const linesTotal = order.items.reduce((s, i) => s + (i.subtotal || i.unitPrice * i.quantity), 0) || 1;
      const merchandisePaid = Math.max(0, (order.totalAmount || 0) - (order.shippingFee || 0));
      // One parcel per order: the most expensive delivery cost among its products
      const orderDeliveryCost = Math.max(0, ...order.items.map(i => productDeliveryCost(dbService.getProductById(i.productId))));

      order.items.forEach(item => {
        const row = byProduct.get(item.productId);
        if (!row) return;
        const share = (item.subtotal || item.unitPrice * item.quantity) / linesTotal;
        const pieces = item.quantity * piecesPerUnit(item);
        row.orders += 1;
        row.pieces += pieces;
        row.revenue += merchandisePaid * share;
        row.shippingCollected += (order.shippingFee || 0) * share;
        row.purchaseCost += pieces * (row.product.costPrice || 0);
        row.deliveryCost += orderDeliveryCost * share;
        row.adCost += row.product.adCostPerOrder || 0;
      });
    });

    byProduct.forEach(r => {
      r.netProfit = r.revenue + r.shippingCollected - r.purchaseCost - r.deliveryCost - r.adCost;
    });
    return [...byProduct.values()];
  }, [products, filteredOrders]);

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = rows.filter(r =>
      (selectedCategory === 'ALL' || r.category === selectedCategory) &&
      (!q || r.product.name.toLowerCase().includes(q) || r.product.sku.toLowerCase().includes(q))
    );
    const margin = (r: ProductProfit) => (r.revenue > 0 ? r.netProfit / r.revenue : -Infinity);
    return list.sort((a, b) => {
      if (sortBy === 'profit-asc') return a.netProfit - b.netProfit;
      if (sortBy === 'revenue-desc') return b.revenue - a.revenue;
      if (sortBy === 'margin-desc') return margin(b) - margin(a);
      if (sortBy === 'pieces-desc') return b.pieces - a.pieces;
      return b.netProfit - a.netProfit;
    });
  }, [rows, selectedCategory, searchQuery, sortBy]);

  const totals = useMemo(() => {
    const t = { orders: filteredOrders.length, pieces: 0, revenue: 0, shippingCollected: 0, purchaseCost: 0, deliveryCost: 0, adCost: 0, netProfit: 0 };
    visibleRows.forEach(r => {
      t.pieces += r.pieces; t.revenue += r.revenue; t.shippingCollected += r.shippingCollected;
      t.purchaseCost += r.purchaseCost; t.deliveryCost += r.deliveryCost; t.adCost += r.adCost; t.netProfit += r.netProfit;
    });
    return t;
  }, [visibleRows, filteredOrders]);

  const categoryRows = useMemo(() => {
    const map = new Map<string, { category: string; products: number; pieces: number; revenue: number; purchaseCost: number; netProfit: number }>();
    rows.forEach(r => {
      const c = map.get(r.category) || { category: r.category, products: 0, pieces: 0, revenue: 0, purchaseCost: 0, netProfit: 0 };
      c.products += 1; c.pieces += r.pieces; c.revenue += r.revenue + r.shippingCollected;
      c.purchaseCost += r.purchaseCost; c.netProfit += r.netProfit;
      map.set(r.category, c);
    });
    return [...map.values()].sort((a, b) => b.netProfit - a.netProfit);
  }, [rows]);

  const missingCost = rows.filter(r => r.pieces > 0 && !r.product.costPrice);

  const draftFor = (p: Product): CostDraft => drafts[p.id] || {
    costPrice: p.costPrice !== undefined ? String(p.costPrice) : '',
    price: String(p.price),
    deliveryCost: String(productDeliveryCost(p)),
    adCostPerOrder: String(p.adCostPerOrder ?? 0)
  };

  const updateDraft = (p: Product, field: keyof CostDraft, value: string) => {
    setDrafts(prev => ({ ...prev, [p.id]: { ...draftFor(p), [field]: value } }));
  };

  const saveDraft = (p: Product) => {
    const d = drafts[p.id];
    if (!d) return;
    const num = (v: string) => Math.max(0, Number(v.replace(',', '.')) || 0);
    const updated: Product = {
      ...p,
      costPrice: d.costPrice.trim() === '' ? undefined : num(d.costPrice),
      price: num(d.price) || p.price,
      deliveryCost: num(d.deliveryCost),
      adCostPerOrder: num(d.adCostPerOrder),
      updatedAt: new Date().toISOString()
    };
    dbService.saveProduct(updated, currentUser);
    refreshProducts();
    setDrafts(prev => {
      const next = { ...prev };
      delete next[p.id];
      return next;
    });
    setVersion(v => v + 1);
    showToast(`✓ Coûts de « ${p.name} » enregistrés`);
  };

  const exportCsv = () => {
    const header = 'Produit,SKU,Catégorie,Prix achat,Prix vente,Commandes,Pièces vendues,CA marchandise,Livraison encaissée,Coût achat,Coût livreur,Pub,Bénéfice net,Marge %';
    const lines = visibleRows.map(r => {
      const totalIn = r.revenue + r.shippingCollected;
      const margin = totalIn > 0 ? ((r.netProfit / totalIn) * 100).toFixed(1) : '0';
      return [
        `"${r.product.name.replace(/"/g, '""')}"`, r.product.sku, `"${r.category}"`, r.product.costPrice ?? '', r.product.price,
        r.orders, r.pieces, r.revenue.toFixed(2), r.shippingCollected.toFixed(2), r.purchaseCost.toFixed(2),
        r.deliveryCost.toFixed(2), r.adCost.toFixed(2), r.netProfit.toFixed(2), margin
      ].join(',');
    });
    const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rentabilite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Simulator math (one order of one piece)
  const simNet = simSell + simClientDelivery - simBuy - simCarrier - simAds;
  const simMargin = simSell + simClientDelivery > 0 ? (simNet / (simSell + simClientDelivery)) * 100 : 0;
  const simBreakEven = simBuy + simCarrier + simAds - simClientDelivery;
  const simTargetPrice = simTargetMargin < 100
    ? (simBuy + simCarrier + simAds - simClientDelivery * (1 - simTargetMargin / 100)) / (1 - simTargetMargin / 100)
    : 0;

  const totalIn = totals.revenue + totals.shippingCollected;
  const totalMargin = totalIn > 0 ? (totals.netProfit / totalIn) * 100 : 0;

  const kpis = [
    { label: 'Chiffre d\'affaires encaissé', value: formatMoney(totalIn), sub: `${totals.orders} commandes · ${totals.pieces} pièces`, icon: DollarSign, accent: 'text-blue-400' },
    { label: 'Coût d\'achat marchandise', value: formatMoney(totals.purchaseCost), sub: 'Prix d\'achat × pièces vendues', icon: ShoppingBag, accent: 'text-amber-400' },
    { label: 'Livraison (livreur − encaissé)', value: formatMoney(totals.deliveryCost - totals.shippingCollected), sub: `Payé ${formatMoney(totals.deliveryCost)} · encaissé ${formatMoney(totals.shippingCollected)}`, icon: Truck, accent: 'text-cyan-400' },
    { label: 'Publicité', value: formatMoney(totals.adCost), sub: 'Coût pub / commande × commandes', icon: Megaphone, accent: 'text-pink-400' },
    { label: 'Bénéfice net', value: formatMoney(totals.netProfit), sub: `Marge nette ${totalMargin.toFixed(1)}%`, icon: TrendingUp, accent: totals.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400' }
  ];

  const inputClass = 'w-20 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono text-right';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">Calcul de Marge & Rentabilité</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Coût d'achat réel, prix de vente au Maroc et bénéfice net par produit et par catégorie, calculés à partir de vos vraies commandes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                period === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <select
            value={statusScope}
            onChange={e => setStatusScope(e.target.value as StatusScope)}
            className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
          >
            {(Object.keys(STATUS_SCOPES) as StatusScope[]).map(s => (
              <option key={s} value={s}>{STATUS_SCOPES[s].label}</option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
              <k.icon className={`w-3.5 h-3.5 ${k.accent}`} />
              <span>{k.label}</span>
            </div>
            <div className={`text-lg sm:text-xl font-black mt-1 font-mono ${k.label === 'Bénéfice net' ? k.accent : 'text-white'}`}>{k.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {missingCost.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Prix d'achat manquant pour {missingCost.length} produit(s) vendu(s) : {missingCost.map(r => r.product.name).join(', ')}.
            Leur bénéfice est surestimé tant que le prix d'achat n'est pas saisi ci-dessous.
          </span>
        </div>
      )}

      {/* Product table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rentabilité par produit</h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher…"
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white w-40"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
            >
              <option value="ALL">Toutes catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
            >
              <option value="profit-desc">Bénéfice ↓</option>
              <option value="profit-asc">Bénéfice ↑</option>
              <option value="revenue-desc">Chiffre d'affaires ↓</option>
              <option value="margin-desc">Marge % ↓</option>
              <option value="pieces-desc">Pièces vendues ↓</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-xs min-w-[1050px]">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-700">
                <th className="font-semibold py-2 pl-4 sm:pl-0">Produit</th>
                <th className="font-semibold py-2 text-right">Prix achat</th>
                <th className="font-semibold py-2 text-right">Prix vente</th>
                <th className="font-semibold py-2 text-right">Livreur</th>
                <th className="font-semibold py-2 text-right">Pub/cmd</th>
                <th className="font-semibold py-2 text-right">Marge/pièce</th>
                <th className="font-semibold py-2 text-right">Vendues</th>
                <th className="font-semibold py-2 text-right">Encaissé</th>
                <th className="font-semibold py-2 text-right">Coût achat</th>
                <th className="font-semibold py-2 text-right">Bénéfice net</th>
                <th className="font-semibold py-2 text-right pr-4 sm:pr-0">Marge</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(r => {
                const p = r.product;
                const d = draftFor(p);
                const dirty = !!drafts[p.id];
                const unitMargin = (Number(d.price) || 0) - (Number(d.costPrice) || 0);
                const totalInRow = r.revenue + r.shippingCollected;
                const margin = totalInRow > 0 ? (r.netProfit / totalInRow) * 100 : null;
                const isPhysical = (p.productKind || 'PHYSICAL') === 'PHYSICAL';
                return (
                  <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-900/40">
                    <td className="py-2 pl-4 sm:pl-0">
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <img src={p.images[0]?.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-900 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate max-w-[200px]">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{r.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <input
                        className={`${inputClass} ${!d.costPrice ? 'border-amber-500/60' : ''}`}
                        value={d.costPrice}
                        placeholder="?"
                        inputMode="decimal"
                        onChange={e => updateDraft(p, 'costPrice', e.target.value)}
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input className={inputClass} value={d.price} inputMode="decimal" onChange={e => updateDraft(p, 'price', e.target.value)} />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        className={`${inputClass} disabled:opacity-40`}
                        value={d.deliveryCost}
                        disabled={!isPhysical}
                        inputMode="decimal"
                        onChange={e => updateDraft(p, 'deliveryCost', e.target.value)}
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input className={inputClass} value={d.adCostPerOrder} inputMode="decimal" onChange={e => updateDraft(p, 'adCostPerOrder', e.target.value)} />
                    </td>
                    <td className={`py-2 text-right font-mono font-bold ${unitMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {d.costPrice ? formatMoney(unitMargin) : '—'}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-200">
                      {r.pieces}
                      <div className="text-[10px] text-slate-500">{r.orders} cmd</div>
                    </td>
                    <td className="py-2 text-right font-mono text-slate-200">{formatMoney(totalInRow)}</td>
                    <td className="py-2 text-right font-mono text-amber-300">{formatMoney(r.purchaseCost)}</td>
                    <td className={`py-2 text-right font-mono font-black ${r.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatMoney(r.netProfit)}
                    </td>
                    <td className="py-2 text-right pr-4 sm:pr-0">
                      {dirty ? (
                        <button
                          onClick={() => saveDraft(p)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Enregistrer</span>
                        </button>
                      ) : (
                        <span className={`font-mono font-bold ${margin === null ? 'text-slate-500' : margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {margin === null ? '—' : `${margin.toFixed(1)}%`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {visibleRows.length > 0 && (
              <tfoot>
                <tr className="text-white font-black">
                  <td className="py-3 pl-4 sm:pl-0" colSpan={6}>Total ({visibleRows.length} produits)</td>
                  <td className="py-3 text-right font-mono">{totals.pieces}</td>
                  <td className="py-3 text-right font-mono">{formatMoney(totalIn)}</td>
                  <td className="py-3 text-right font-mono text-amber-300">{formatMoney(totals.purchaseCost)}</td>
                  <td className={`py-3 text-right font-mono ${totals.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatMoney(totals.netProfit)}</td>
                  <td className="py-3 text-right font-mono pr-4 sm:pr-0">{totalMargin.toFixed(1)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
          {visibleRows.length === 0 && <div className="text-xs text-slate-500 text-center py-8">Aucun produit.</div>}
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Bénéfice net = montant encaissé (marchandise + livraison payée par le client) − prix d'achat × pièces vendues (packs inclus) − coût livreur par colis − pub par commande.
          Modifiez les coûts directement dans le tableau puis cliquez sur « Enregistrer » : ils sont sauvegardés sur la fiche produit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category summary */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bénéfice par catégorie</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[480px]">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-700">
                  <th className="font-semibold py-2">Catégorie</th>
                  <th className="font-semibold py-2 text-right">Pièces</th>
                  <th className="font-semibold py-2 text-right">Encaissé</th>
                  <th className="font-semibold py-2 text-right">Coût achat</th>
                  <th className="font-semibold py-2 text-right">Bénéfice net</th>
                  <th className="font-semibold py-2 text-right">Marge</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map(c => (
                  <tr key={c.category} className="border-b border-slate-800">
                    <td className="py-2 text-slate-200 font-semibold">
                      {c.category} <span className="text-[10px] text-slate-500">({c.products})</span>
                    </td>
                    <td className="py-2 text-right font-mono text-slate-300">{c.pieces}</td>
                    <td className="py-2 text-right font-mono text-slate-200">{formatMoney(c.revenue)}</td>
                    <td className="py-2 text-right font-mono text-amber-300">{formatMoney(c.purchaseCost)}</td>
                    <td className={`py-2 text-right font-mono font-bold ${c.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatMoney(c.netProfit)}</td>
                    <td className="py-2 text-right font-mono text-slate-300">{c.revenue > 0 ? `${((c.netProfit / c.revenue) * 100).toFixed(1)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price simulator */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Simulateur de prix de vente</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['Prix d\'achat', simBuy, setSimBuy],
              ['Prix de vente', simSell, setSimSell],
              ['Livraison payée par client', simClientDelivery, setSimClientDelivery],
              ['Coût livreur', simCarrier, setSimCarrier],
              ['Pub par commande', simAds, setSimAds],
              ['Marge visée (%)', simTargetMargin, setSimTargetMargin]
            ] as Array<[string, number, (n: number) => void]>).map(([label, value, setter]) => (
              <label key={label} className="block">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">{label}</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={value}
                  onChange={e => setter(Number(e.target.value))}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </label>
            ))}
          </div>
          <div className="space-y-1.5 text-xs border-t border-slate-700/80 pt-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Bénéfice net par commande</span>
              <span className={`font-mono font-black ${simNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatMoney(simNet)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Marge nette</span>
              <span className="font-mono text-white font-bold">{simMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Prix minimum (bénéfice 0)</span>
              <span className="font-mono text-white font-bold">{formatMoney(simBreakEven)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Prix conseillé pour {simTargetMargin}% de marge</span>
              <span className="font-mono text-emerald-400 font-black">{simTargetPrice > 0 ? formatMoney(Math.ceil(simTargetPrice)) : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
