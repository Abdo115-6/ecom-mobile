import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Product } from '../../types/ecommerce';
import {
  buildFinanceReport,
  periodBounds,
  AD_PLATFORM_LABELS,
  OUTCOME_LABELS,
  type AdPlatform,
  type FinanceData,
  type OrderCost,
  type OrderOutcome,
  type ProductProfit,
  type OfflineSale
} from '../../services/financeCalc';
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
  Percent,
  Package,
  Wallet,
  Receipt,
  Trash2,
  Plus,
  RefreshCw,
  CalendarDays
} from 'lucide-react';

type Period = 7 | 30 | 90 | 'all';
type Tab = 'summary' | 'products' | 'deliveries' | 'stock' | 'ads' | 'expenses';

const PERIOD_LABELS: Array<[Period, string]> = [[7, '7 jours'], [30, '30 jours'], [90, '90 jours'], ['all', 'Tout']];
const TABS: Array<[Tab, string]> = [
  ['summary', 'Résumé'],
  ['products', 'Produits & catégories'],
  ['deliveries', 'Livraisons'],
  ['stock', 'Achats & stock'],
  ['ads', 'Publicité'],
  ['expenses', 'Autres charges']
];
const EXPENSE_CATEGORIES = ['Emballage', 'Internet / téléphone', 'Abonnements & outils', 'Salaires', 'Transport', 'Loyer', 'Autre'];

const emptyFinance = (): FinanceData => ({ purchase: [], ad: [], expense: [], order: [], offline: [], unit: [], settings: [] });
const today = () => new Date().toISOString().slice(0, 10);
const newId = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const num = (v: string) => Math.max(0, Number(String(v).replace(',', '.')) || 0);

interface CostDraft {
  costPrice: string;
  price: string;
  deliveryCost: string;
  adCostPerOrder: string;
}

const defaultDeliveryCost = () => dbService.settings.defaultDeliveryCost ?? 35;

const productDeliveryCost = (p: Product): number => {
  if ((p.productKind || 'PHYSICAL') !== 'PHYSICAL') return 0;
  return p.deliveryCost ?? defaultDeliveryCost();
};

const OUTCOME_STYLE: Record<OrderOutcome, string> = {
  pending: 'bg-slate-700/60 text-slate-300',
  dispatched: 'bg-blue-500/15 text-blue-300',
  delivered: 'bg-emerald-500/15 text-emerald-300',
  returned: 'bg-rose-500/15 text-rose-300',
  cancelled: 'bg-slate-800 text-slate-500'
};

export const CalculationAdminView: React.FC = () => {
  const { formatMoney, showToast, currentUser, refreshProducts } = useApp();
  const [tab, setTab] = useState<Tab>('summary');
  const [period, setPeriod] = useState<Period>(30);
  const [finance, setFinance] = useState<FinanceData>(emptyFinance);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [version, setVersion] = useState(0);

  // Products tab
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'profit-desc' | 'profit-asc' | 'revenue-desc' | 'margin-desc' | 'pieces-desc'>('profit-desc');
  const [drafts, setDrafts] = useState<Record<string, CostDraft>>({});

  // Deliveries tab
  const [outcomeFilter, setOutcomeFilter] = useState<OrderOutcome | 'ALL'>('ALL');
  const [orderDrafts, setOrderDrafts] = useState<Record<string, { collected: string; courierCost: string; outcome: string; restocked: boolean }>>({});

  // Forms
  const [purchaseForm, setPurchaseForm] = useState({ date: today(), productId: '', quantity: '', unitCost: '', supplier: '', updateCost: true });
  const [adForm, setAdForm] = useState({ date: today(), platform: 'facebook' as AdPlatform, campaign: '', productId: '', amount: '' });
  const [expenseForm, setExpenseForm] = useState({ date: today(), category: EXPENSE_CATEGORIES[0], label: '', amount: '' });
  const [offlineForm, setOfflineForm] = useState({ date: today(), productId: '', quantity: '', orders: '', unitPrice: '', deliveryCharged: '', courierCost: '', note: '' });
  const [adSync, setAdSync] = useState<{ meta: boolean; tiktok: boolean; usdToMad: number; lastRunAt?: string; lastResult?: string; lastError?: string } | null>(null);
  const [adSyncing, setAdSyncing] = useState(false);
  const [ozonCheck, setOzonCheck] = useState<{ loading: boolean; rows: Array<{ orderNumber: string; tn: string; status: string; detail: string }> } | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<{ openingCash: string; defaultReturnCost: string } | null>(null);

  // Price simulator
  const [simBuy, setSimBuy] = useState(80);
  const [simSell, setSimSell] = useState(249);
  const [simClientDelivery, setSimClientDelivery] = useState(dbService.settings.standardShippingFee ?? 25);
  const [simCarrier, setSimCarrier] = useState(defaultDeliveryCost());
  const [simAds, setSimAds] = useState(30);
  const [simTargetMargin, setSimTargetMargin] = useState(30);

  const loadFinance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(res.status === 401 ? 'Session admin expirée : reconnectez-vous' : data.message || `HTTP ${res.status}`);
      setFinance({ purchase: data.purchase || [], ad: data.ad || [], expense: data.expense || [], order: data.order || [], offline: data.offline || [], unit: data.unit || [], settings: data.settings || [] });
      setLoadError('');
    } catch (err: any) {
      setLoadError(err.message || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFinance(); }, [loadFinance]);

  useEffect(() => {
    if (tab !== 'ads' || adSync) return;
    fetch('/api/finance/ads-sync').then(r => r.json()).then(d => d.success && setAdSync(d)).catch(() => null);
  }, [tab, adSync]);

  const runAdSync = async () => {
    setAdSyncing(true);
    try {
      const res = await fetch('/api/finance/ads-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: 14 }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
      setAdSync(data);
      showToast(`✓ ${data.result}`);
      loadFinance();
    } catch (err: any) {
      showToast(`Synchro pub impossible : ${err.message}`);
    } finally {
      setAdSyncing(false);
    }
  };

  const saveEntry = async (kind: keyof FinanceData, entry: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/finance/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
      setFinance(prev => ({ ...prev, [kind]: [data.entry, ...((prev[kind] || []) as any[]).filter(e => e.id !== data.entry.id)] }));
      return true;
    } catch (err: any) {
      showToast(`Enregistrement impossible : ${err.message || 'erreur'}`);
      return false;
    }
  };

  const deleteEntry = async (kind: keyof FinanceData, id: string) => {
    try {
      const res = await fetch(`/api/finance/${kind}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFinance(prev => ({ ...prev, [kind]: ((prev[kind] || []) as any[]).filter(e => e.id !== id) }));
    } catch (err: any) {
      showToast(`Suppression impossible : ${err.message || 'erreur'}`);
    }
  };

  const products = useMemo(() => [...dbService.products], [version]);
  const physicalProducts = useMemo(() => products.filter(p => (p.productKind || 'PHYSICAL') === 'PHYSICAL'), [products]);

  const report = useMemo(() => {
    const { from, to } = periodBounds(period);
    return buildFinanceReport({
      orders: dbService.orders,
      products,
      categories: dbService.categories,
      finance,
      from,
      to,
      defaultDeliveryCost: defaultDeliveryCost()
    });
  }, [products, finance, period, version]);

  const { totals, cash } = report;
  const settings = finance.settings[0] || { id: 'settings' as const, openingCash: 0, defaultReturnCost: 0 };
  const categories = useMemo(() => [...new Set(report.products.map(r => r.category))].sort(), [report]);

  // ---------- Products tab ----------
  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = report.products.filter(r =>
      (selectedCategory === 'ALL' || r.category === selectedCategory) &&
      (!q || r.product.name.toLowerCase().includes(q) || r.product.sku.toLowerCase().includes(q))
    );
    const margin = (r: ProductProfit) => (r.collected > 0 ? r.profit / r.collected : -Infinity);
    return list.sort((a, b) => {
      if (sortBy === 'profit-asc') return a.profit - b.profit;
      if (sortBy === 'revenue-desc') return b.collected - a.collected;
      if (sortBy === 'margin-desc') return margin(b) - margin(a);
      if (sortBy === 'pieces-desc') return b.piecesSold - a.piecesSold;
      return b.profit - a.profit;
    });
  }, [report, selectedCategory, searchQuery, sortBy]);

  const productTotals = useMemo(() => visibleRows.reduce((t, r) => ({
    pieces: t.pieces + r.piecesSold, collected: t.collected + r.collected, productCost: t.productCost + r.productCost, profit: t.profit + r.profit
  }), { pieces: 0, collected: 0, productCost: 0, profit: 0 }), [visibleRows]);

  const draftFor = (p: Product): CostDraft => drafts[p.id] || {
    costPrice: p.costPrice !== undefined ? String(p.costPrice) : '',
    price: String(p.price),
    deliveryCost: String(productDeliveryCost(p)),
    adCostPerOrder: String(p.adCostPerOrder ?? 0)
  };

  const updateDraft = (p: Product, field: keyof CostDraft, value: string) => {
    setDrafts(prev => ({ ...prev, [p.id]: { ...draftFor(p), [field]: value } }));
  };

  const saveProductPatch = (p: Product, patch: Partial<Product>, message: string) => {
    dbService.saveProduct({ ...p, ...patch, updatedAt: new Date().toISOString() }, currentUser);
    refreshProducts();
    setVersion(v => v + 1);
    showToast(message);
  };

  const saveDraft = (p: Product) => {
    const d = drafts[p.id];
    if (!d) return;
    saveProductPatch(p, {
      costPrice: d.costPrice.trim() === '' ? undefined : num(d.costPrice),
      price: num(d.price) || p.price,
      deliveryCost: num(d.deliveryCost),
      adCostPerOrder: num(d.adCostPerOrder)
    }, `✓ Coûts de « ${p.name} » enregistrés`);
    setDrafts(prev => {
      const next = { ...prev };
      delete next[p.id];
      return next;
    });
  };

  // ---------- Deliveries tab ----------
  const costById = useMemo(() => new Map(finance.order.map(c => [c.id, c])), [finance.order]);
  const visibleOrders = report.orders.filter(o => outcomeFilter === 'ALL' || o.outcome === outcomeFilter);

  const orderDraftFor = (id: string) => {
    if (orderDrafts[id]) return orderDrafts[id];
    const c = costById.get(id);
    return {
      collected: c?.collected !== undefined ? String(c.collected) : '',
      courierCost: c?.courierCost !== undefined ? String(c.courierCost) : '',
      outcome: c?.outcome || '',
      restocked: !!c?.restocked
    };
  };

  const updateOrderDraft = (id: string, patch: Partial<ReturnType<typeof orderDraftFor>>) => {
    setOrderDrafts(prev => ({ ...prev, [id]: { ...orderDraftFor(id), ...patch } }));
  };

  const saveOrderCost = async (id: string) => {
    const d = orderDrafts[id];
    if (!d) return;
    const entry: OrderCost = {
      id,
      collected: d.collected.trim() === '' ? undefined : num(d.collected),
      courierCost: d.courierCost.trim() === '' ? undefined : num(d.courierCost),
      outcome: (d.outcome || undefined) as OrderCost['outcome'],
      restocked: d.restocked
    };
    if (await saveEntry('order', entry)) {
      setOrderDrafts(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast('✓ Livraison mise à jour');
    }
  };

  // ---------- Off-site sales ----------
  const addOffline = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = dbService.getProductById(offlineForm.productId);
    const quantity = Math.round(num(offlineForm.quantity));
    if (!product || quantity <= 0) return showToast('Choisissez le produit et la quantité vendue');
    const ok = await saveEntry('offline', {
      id: newId('off'), date: offlineForm.date, productId: product.id, productName: product.name, quantity,
      orders: Math.round(num(offlineForm.orders)) || quantity, unitPrice: num(offlineForm.unitPrice),
      deliveryCharged: num(offlineForm.deliveryCharged), courierCost: num(offlineForm.courierCost), note: offlineForm.note
    });
    if (ok) {
      showToast(`✓ Vente hors site enregistrée : ${quantity} × ${product.name}`);
      setOfflineForm(f => ({ ...f, quantity: '', orders: '', unitPrice: '', deliveryCharged: '', courierCost: '', note: '' }));
    }
  };

  // ---------- Ozon check ----------
  const checkOzon = async () => {
    const parcels = dbService.orders.filter(o => o.shipment?.carrier === 'Ozon Express' && o.shipment?.trackingNumber);
    if (parcels.length === 0) return showToast('Aucun colis Ozon');
    setOzonCheck({ loading: true, rows: [] });
    try {
      const sync = await fetch('/api/ozon/sync', { method: 'POST' }).then(r => r.json()).catch(() => null);
      const rows = [];
      for (const o of parcels) {
        const tn = o.shipment.trackingNumber!;
        const data = await fetch(`/api/ozon/parcel/${encodeURIComponent(tn)}`).then(r => r.json()).catch(() => null);
        const flat = JSON.stringify(data?.tracking || data?.info || data || {});
        const statuses = [...flat.matchAll(/"(?:STATUT|STATUS|STATUT-LABEL)"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
        rows.push({ orderNumber: o.orderNumber, tn, status: statuses[statuses.length - 1] || o.shipment.status || '?', detail: flat.slice(0, 600) });
      }
      setOzonCheck({ loading: false, rows });
      if (sync?.updated) showToast(`✓ ${sync.updated} commande(s) mises à jour depuis Ozon`);
    } catch (err: any) {
      setOzonCheck(null);
      showToast(`Ozon : ${err.message || 'erreur'}`);
    }
  };

  // ---------- Purchases ----------
  const addPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = dbService.getProductById(purchaseForm.productId);
    const quantity = Math.round(num(purchaseForm.quantity));
    const unitCost = num(purchaseForm.unitCost);
    if (!product || quantity <= 0) return showToast('Choisissez le produit et la quantité');
    const ok = await saveEntry('purchase', {
      id: newId('pur'), date: purchaseForm.date, productId: product.id, productName: product.name,
      quantity, unitCost, total: quantity * unitCost, supplier: purchaseForm.supplier
    });
    if (!ok) return;
    // Stock goes up with the purchase; the product cost follows the latest buying price when asked
    saveProductPatch(product, {
      stockQuantity: (product.stockQuantity || 0) + quantity,
      ...(purchaseForm.updateCost && unitCost > 0 ? { costPrice: unitCost } : {})
    }, `✓ Achat enregistré : ${quantity} × ${product.name} (stock +${quantity})`);
    setPurchaseForm(f => ({ ...f, quantity: '', unitCost: '', supplier: '' }));
  };

  const applyStock = (r: ProductProfit) => {
    const qty = r.unitsInStock ?? r.stockLeft;
    if (qty === null) return;
    saveProductPatch(r.product, { stockQuantity: Math.max(0, qty) }, `✓ Stock de « ${r.product.name} » mis à ${Math.max(0, qty)}`);
  };

  // ---------- Ads ----------
  const addAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = num(adForm.amount);
    if (amount <= 0) return showToast('Saisissez le montant réellement débité');
    if (await saveEntry('ad', { id: newId('ad'), ...adForm, productId: adForm.productId || undefined, amount })) {
      showToast(`✓ Dépense ${AD_PLATFORM_LABELS[adForm.platform]} enregistrée`);
      setAdForm(f => ({ ...f, amount: '', campaign: '' }));
    }
  };

  // ---------- Expenses ----------
  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = num(expenseForm.amount);
    if (amount <= 0) return showToast('Saisissez le montant');
    if (await saveEntry('expense', { id: newId('exp'), ...expenseForm, amount })) {
      showToast('✓ Charge enregistrée');
      setExpenseForm(f => ({ ...f, label: '', amount: '' }));
    }
  };

  const saveSettings = async () => {
    if (!settingsDraft) return;
    if (await saveEntry('settings', { id: 'settings', openingCash: Number(settingsDraft.openingCash.replace(',', '.')) || 0, defaultReturnCost: num(settingsDraft.defaultReturnCost) })) {
      setSettingsDraft(null);
      showToast('✓ Paramètres enregistrés');
    }
  };

  const exportCsv = () => {
    const header = 'Commande,Date,Statut,Canal,Pièces,Encaissé,Coût produit,Livreur,Pub,Bénéfice';
    const lines = report.orders.map(o => [
      o.order.orderNumber, o.order.createdAt.slice(0, 10), OUTCOME_LABELS[o.outcome], o.channel, o.pieces,
      o.collected.toFixed(2), o.productCost.toFixed(2), o.courierCost.toFixed(2), o.adCost.toFixed(2), o.profit.toFixed(2)
    ].join(','));
    const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rentabilite-${today()}.csv`;
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

  const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(0)}%`);
  const profitClass = (v: number) => (v >= 0 ? 'text-emerald-400' : 'text-rose-400');
  const card = 'bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5';
  const inputClass = 'w-20 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono text-right';
  const fieldClass = 'w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white';
  const labelClass = 'text-[11px] font-semibold text-slate-400 block mb-1';
  const th = 'font-semibold py-2 text-right';

  const kpis = [
    { label: 'Encaissé (livrées)', value: formatMoney(totals.collected), sub: `${totals.delivered} livrées · ${totals.piecesSold} pièces`, icon: DollarSign, accent: 'text-blue-400' },
    { label: 'Coût marchandise', value: formatMoney(totals.productCost), sub: 'Pièces livrées + retours perdus', icon: ShoppingBag, accent: 'text-amber-400' },
    { label: 'Livreur', value: formatMoney(totals.courierCost), sub: `dont retours ${formatMoney(totals.returnCourierCost)}`, icon: Truck, accent: 'text-cyan-400' },
    { label: 'Publicité', value: formatMoney(totals.adSpend), sub: totals.adEstimated ? 'Estimée (aucune dépense saisie)' : 'Dépenses réelles saisies', icon: Megaphone, accent: 'text-pink-400' },
    { label: 'Autres charges', value: formatMoney(totals.expenses), sub: 'Emballage, outils…', icon: Receipt, accent: 'text-violet-400' },
    { label: 'Bénéfice net', value: formatMoney(totals.netProfit), sub: totals.profitPerDelivered === null ? '—' : `${formatMoney(totals.profitPerDelivered)} / commande livrée`, icon: TrendingUp, accent: profitClass(totals.netProfit), strong: true }
  ];

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
            Achat du stock → commande → livraison → publicité → bénéfice net et trésorerie, calculés sur vos vraies commandes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_LABELS.map(([p, label]) => (
            <button
              key={String(p)}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                period === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => { loadFinance(); setVersion(v => v + 1); }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
          Achats, publicité et charges non chargés : {loadError}. Les chiffres ci-dessous n'en tiennent pas compte.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer border ${
              tab === id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {report.warnings.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
          {report.warnings.map(w => (
            <div key={w} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* ================= SUMMARY ================= */}
      {tab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {kpis.map(k => (
              <div key={k.label} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <k.icon className={`w-3.5 h-3.5 ${k.accent}`} />
                  <span>{k.label}</span>
                </div>
                <div className={`text-lg sm:text-xl font-black mt-1 font-mono ${k.strong ? k.accent : 'text-white'}`}>{k.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Profit breakdown */}
            <div className={`lg:col-span-5 ${card} space-y-3`}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Calcul du bénéfice</h3>
              <div className="space-y-1.5 text-xs font-mono">
                {([
                  ['Prix des produits (livrées)', totals.merchandise, 1],
                  ['+ Livraison payée par les clients', totals.deliveryCharged, 1],
                  ['− Coût d\'achat des produits', totals.productCost, -1],
                  ['− Livreur (livrées + retours)', totals.courierCost, -1],
                  ['− Publicité', totals.adSpend, -1],
                  ['− Autres charges', totals.expenses, -1]
                ] as Array<[string, number, number]>).map(([label, value, sign]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-400 font-sans">{label}</span>
                    <span className={sign < 0 ? 'text-rose-300' : 'text-slate-200'}>{sign < 0 ? '−' : ''}{formatMoney(value)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-700 pt-2 text-sm font-black">
                  <span className="text-white font-sans">= Bénéfice net</span>
                  <span className={profitClass(totals.netProfit)}>{formatMoney(totals.netProfit)}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Seules les commandes livrées rapportent de l'argent. Un retour coûte les frais du livreur (et la marchandise si elle n'est pas remise en stock).
                Les commandes en attente ou expédiées ne comptent pas encore.
              </p>
            </div>

            {/* Delivery funnel + cash */}
            <div className="lg:col-span-7 space-y-6">
              <div className={`${card} space-y-3`}>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Commandes de la période ({totals.ordersAll})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  {([
                    ['En attente', totals.pending, 'text-slate-300'],
                    ['Expédiées', totals.dispatched, 'text-blue-300'],
                    ['Livrées', totals.delivered, 'text-emerald-300'],
                    ['Retours', totals.returned, 'text-rose-300'],
                    ['Annulées', totals.cancelled, 'text-slate-500'],
                    ['Taux livraison', pct(totals.deliveryRate), 'text-white']
                  ] as Array<[string, number | string, string]>).map(([label, value, cls]) => (
                    <div key={label} className="p-2.5 bg-slate-900/60 rounded-xl">
                      <div className={`text-lg font-black font-mono ${cls}`}>{value}</div>
                      <div className="text-[10px] text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
                {totals.inTransitValue > 0 && (
                  <p className="text-[11px] text-slate-400">{formatMoney(totals.inTransitValue)} en cours de livraison (pas encore encaissé).</p>
                )}
              </div>

              <div className={`${card} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Trésorerie (depuis le début)</h3>
                  </div>
                  {!settingsDraft && (
                    <button
                      onClick={() => setSettingsDraft({ openingCash: String(settings.openingCash || 0), defaultReturnCost: String(settings.defaultReturnCost || 0) })}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Paramètres
                    </button>
                  )}
                </div>
                {settingsDraft && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl">
                    <label>
                      <span className={labelClass}>Caisse de départ (DH)</span>
                      <input className={fieldClass} inputMode="decimal" value={settingsDraft.openingCash} onChange={e => setSettingsDraft({ ...settingsDraft, openingCash: e.target.value })} />
                    </label>
                    <label>
                      <span className={labelClass}>Frais livreur d'un retour (DH)</span>
                      <input className={fieldClass} inputMode="decimal" value={settingsDraft.defaultReturnCost} onChange={e => setSettingsDraft({ ...settingsDraft, defaultReturnCost: e.target.value })} />
                    </label>
                    <div className="col-span-2 flex gap-2 justify-end">
                      <button onClick={() => setSettingsDraft(null)} className="px-3 py-1.5 text-xs text-slate-400 cursor-pointer">Annuler</button>
                      <button onClick={saveSettings} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer">Enregistrer</button>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 text-xs font-mono">
                  {([
                    ['Caisse de départ', cash.openingCash, 1],
                    ['+ Encaissé des clients', cash.collectedAllTime, 1],
                    ['− Achats de stock', cash.purchasesAllTime, -1],
                    ['− Publicité', cash.adsAllTime, -1],
                    ['− Livreur', cash.courierAllTime, -1],
                    ['− Autres charges', cash.expensesAllTime, -1]
                  ] as Array<[string, number, number]>).map(([label, value, sign]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-400 font-sans">{label}</span>
                      <span className={sign < 0 ? 'text-rose-300' : 'text-slate-200'}>{sign < 0 ? '−' : ''}{formatMoney(value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-700 pt-2 text-sm font-black">
                    <span className="text-white font-sans">= Solde de caisse</span>
                    <span className={profitClass(cash.balance)}>{formatMoney(cash.balance)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">Argent chez le livreur (colis en route)</span>
                    <span>{formatMoney(cash.inTransit)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">Valeur du stock restant (prix d'achat)</span>
                    <span>{formatMoney(cash.stockValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly */}
          <div className={`${card} space-y-3`}>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bilan par semaine</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-slate-500 text-left border-b border-slate-700">
                    <th className="font-semibold py-2">Semaine du</th>
                    <th className={th}>Livrées</th>
                    <th className={th}>Retours</th>
                    <th className={th}>Encaissé</th>
                    <th className={th}>Pub</th>
                    <th className={th}>Charges</th>
                    <th className={th}>Bénéfice net</th>
                  </tr>
                </thead>
                <tbody>
                  {report.weeks.map(w => (
                    <tr key={w.weekStart} className="border-b border-slate-800">
                      <td className="py-2 text-slate-200">{new Date(`${w.weekStart}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</td>
                      <td className="py-2 text-right font-mono text-emerald-300">{w.delivered}</td>
                      <td className="py-2 text-right font-mono text-rose-300">{w.returned}</td>
                      <td className="py-2 text-right font-mono text-slate-200">{formatMoney(w.collected)}</td>
                      <td className="py-2 text-right font-mono text-slate-400">{formatMoney(w.adSpend)}</td>
                      <td className="py-2 text-right font-mono text-slate-400">{formatMoney(w.expenses)}</td>
                      <td className={`py-2 text-right font-mono font-bold ${profitClass(w.netProfit)}`}>{formatMoney(w.netProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.weeks.length === 0 && <div className="text-xs text-slate-500 text-center py-6">Aucune activité sur la période.</div>}
            </div>
          </div>

          {/* Routine */}
          <div className={`${card} space-y-2`}>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Votre routine</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
              {([
                ['Achat de stock', 'Onglet « Achats & stock » : date, quantité, prix unitaire. Le stock augmente.', 'stock'],
                ['Commande reçue', 'Automatique : chaque commande du site est enregistrée avec son prix et sa source.', 'deliveries'],
                ['Colis livré / retourné', 'Suivi Ozon automatique. Pour un autre livreur, indiquez le statut et le vrai coût dans « Livraisons ».', 'deliveries'],
                ['Chaque soir', 'Saisissez la pub réellement débitée (Facebook, TikTok) dans « Publicité ».', 'ads'],
                ['Chaque semaine', 'Vérifiez le bénéfice net, la pub rentable, le stock et la caisse ici.', 'summary'],
                ['Autres dépenses', 'Emballage, outils, internet… dans « Autres charges ».', 'expenses']
              ] as Array<[string, string, Tab]>).map(([title, text, target]) => (
                <button key={title} onClick={() => setTab(target)} className="text-left p-3 bg-slate-900/60 hover:bg-slate-900 rounded-xl cursor-pointer">
                  <div className="font-bold text-slate-200">{title}</div>
                  <div className="text-slate-500 mt-0.5">{text}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCTS ================= */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className={`${card} space-y-4`}>
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
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
                  <option value="ALL">Toutes catégories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
                  <option value="profit-desc">Bénéfice ↓</option>
                  <option value="profit-asc">Bénéfice ↑</option>
                  <option value="revenue-desc">Encaissé ↓</option>
                  <option value="margin-desc">Marge % ↓</option>
                  <option value="pieces-desc">Pièces vendues ↓</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs min-w-[1150px]">
                <thead>
                  <tr className="text-slate-500 text-left border-b border-slate-700">
                    <th className="font-semibold py-2 pl-4 sm:pl-0">Produit</th>
                    <th className={th}>Coût achat</th>
                    <th className={th}>Prix vente</th>
                    <th className={th}>Livreur</th>
                    <th className={th}>Pub/cmd</th>
                    <th className={th}>Livrées</th>
                    <th className={th}>Retours</th>
                    <th className={th}>Encaissé</th>
                    <th className={th}>Coûts</th>
                    <th className={th}>Bénéfice net</th>
                    <th className={`${th} pr-4 sm:pr-0`}>Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map(r => {
                    const p = r.product;
                    const d = draftFor(p);
                    const dirty = !!drafts[p.id];
                    const margin = r.collected > 0 ? (r.profit / r.collected) * 100 : null;
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
                          {r.unitCostSource === 'achats' ? (
                            <div className="font-mono text-amber-300" title="Moyenne pondérée de vos achats enregistrés">
                              {formatMoney(r.unitCost)}
                              <div className="text-[9px] text-slate-500 font-sans">moy. achats</div>
                            </div>
                          ) : (
                            <input
                              className={`${inputClass} ${!d.costPrice ? 'border-amber-500/60' : ''}`}
                              value={d.costPrice}
                              placeholder="?"
                              inputMode="decimal"
                              onChange={e => updateDraft(p, 'costPrice', e.target.value)}
                            />
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <input className={inputClass} value={d.price} inputMode="decimal" onChange={e => updateDraft(p, 'price', e.target.value)} />
                        </td>
                        <td className="py-2 text-right">
                          <input className={`${inputClass} disabled:opacity-40`} value={d.deliveryCost} disabled={!isPhysical} inputMode="decimal" onChange={e => updateDraft(p, 'deliveryCost', e.target.value)} />
                        </td>
                        <td className="py-2 text-right">
                          <input className={inputClass} value={d.adCostPerOrder} inputMode="decimal" onChange={e => updateDraft(p, 'adCostPerOrder', e.target.value)} />
                        </td>
                        <td className="py-2 text-right font-mono text-slate-200">
                          {r.ordersDelivered}
                          <div className="text-[10px] text-slate-500">{r.piecesSold} pcs</div>
                        </td>
                        <td className="py-2 text-right font-mono text-rose-300">{r.ordersReturned || '—'}</td>
                        <td className="py-2 text-right font-mono text-slate-200">{formatMoney(r.collected)}</td>
                        <td className="py-2 text-right font-mono text-slate-400" title={`Achat ${formatMoney(r.productCost)} · livreur ${formatMoney(r.courierCost)} · pub ${formatMoney(r.adCost)}`}>
                          {formatMoney(r.productCost + r.courierCost + r.adCost)}
                        </td>
                        <td className={`py-2 text-right font-mono font-black ${profitClass(r.profit)}`}>{formatMoney(r.profit)}</td>
                        <td className="py-2 text-right pr-4 sm:pr-0">
                          {dirty ? (
                            <button onClick={() => saveDraft(p)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
                              <Save className="w-3 h-3" />
                              <span>Enregistrer</span>
                            </button>
                          ) : (
                            <span className={`font-mono font-bold ${margin === null ? 'text-slate-500' : profitClass(margin)}`}>
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
                      <td className="py-3 pl-4 sm:pl-0" colSpan={5}>Total ({visibleRows.length} produits)</td>
                      <td className="py-3 text-right font-mono">{productTotals.pieces} pcs</td>
                      <td />
                      <td className="py-3 text-right font-mono">{formatMoney(productTotals.collected)}</td>
                      <td />
                      <td className={`py-3 text-right font-mono ${profitClass(productTotals.profit)}`}>{formatMoney(productTotals.profit)}</td>
                      <td className="py-3 text-right font-mono pr-4 sm:pr-0">{productTotals.collected > 0 ? `${((productTotals.profit / productTotals.collected) * 100).toFixed(1)}%` : '—'}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {visibleRows.length === 0 && <div className="text-xs text-slate-500 text-center py-8">Aucun produit.</div>}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Bénéfice par produit = encaissé sur les commandes livrées − coût d'achat (moyenne de vos achats, sinon la fiche produit) − livreur (livrées et retours) − publicité répartie.
              Les autres charges ne sont comptées que dans le total du Résumé. « Livreur » et « Pub/cmd » servent d'estimation quand le vrai montant n'est pas saisi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-7 ${card} space-y-3`}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bénéfice par catégorie</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[480px]">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-slate-700">
                      <th className="font-semibold py-2">Catégorie</th>
                      <th className={th}>Pièces</th>
                      <th className={th}>Encaissé</th>
                      <th className={th}>Coût achat</th>
                      <th className={th}>Bénéfice net</th>
                      <th className={th}>Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.categories.map(c => (
                      <tr key={c.category} className="border-b border-slate-800">
                        <td className="py-2 text-slate-200 font-semibold">{c.category} <span className="text-[10px] text-slate-500">({c.products})</span></td>
                        <td className="py-2 text-right font-mono text-slate-300">{c.piecesSold}</td>
                        <td className="py-2 text-right font-mono text-slate-200">{formatMoney(c.collected)}</td>
                        <td className="py-2 text-right font-mono text-amber-300">{formatMoney(c.productCost)}</td>
                        <td className={`py-2 text-right font-mono font-bold ${profitClass(c.profit)}`}>{formatMoney(c.profit)}</td>
                        <td className="py-2 text-right font-mono text-slate-300">{c.collected > 0 ? `${((c.profit / c.collected) * 100).toFixed(1)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`lg:col-span-5 ${card} space-y-4`}>
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
                    <span className={labelClass}>{label}</span>
                    <input type="number" min={0} step="any" value={value} onChange={e => setter(Number(e.target.value))} className={`${fieldClass} font-mono`} />
                  </label>
                ))}
              </div>
              <div className="space-y-1.5 text-xs border-t border-slate-700/80 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bénéfice net par commande livrée</span>
                  <span className={`font-mono font-black ${profitClass(simNet)}`}>{formatMoney(simNet)}</span>
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
      )}

      {/* ================= DELIVERIES ================= */}
      {tab === 'deliveries' && (
        <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={addOffline} className={`lg:col-span-7 ${card} space-y-3`}>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ventes hors site</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Ventes livrées et payées qui ne sont pas des commandes du site (anciennes ventes, WhatsApp, Instagram…). Vous pouvez grouper plusieurs ventes au même prix.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="col-span-2">
                <span className={labelClass}>Produit</span>
                <select required className={fieldClass} value={offlineForm.productId} onChange={e => setOfflineForm(f => ({ ...f, productId: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Date</span>
                <input type="date" className={fieldClass} value={offlineForm.date} onChange={e => setOfflineForm(f => ({ ...f, date: e.target.value }))} />
              </label>
              <label>
                <span className={labelClass}>Pièces vendues</span>
                <input required inputMode="numeric" className={`${fieldClass} font-mono`} value={offlineForm.quantity} onChange={e => setOfflineForm(f => ({ ...f, quantity: e.target.value }))} />
              </label>
              <label>
                <span className={labelClass}>Prix par pièce</span>
                <input required inputMode="decimal" className={`${fieldClass} font-mono`} value={offlineForm.unitPrice} onChange={e => setOfflineForm(f => ({ ...f, unitPrice: e.target.value }))} />
              </label>
              <label>
                <span className={labelClass}>Nb de clients</span>
                <input inputMode="numeric" placeholder="= pièces" className={`${fieldClass} font-mono`} value={offlineForm.orders} onChange={e => setOfflineForm(f => ({ ...f, orders: e.target.value }))} />
              </label>
              <label>
                <span className={labelClass}>Livraison payée (total)</span>
                <input inputMode="decimal" placeholder="0" className={`${fieldClass} font-mono`} value={offlineForm.deliveryCharged} onChange={e => setOfflineForm(f => ({ ...f, deliveryCharged: e.target.value }))} />
              </label>
              <label>
                <span className={labelClass}>Livreur payé (total)</span>
                <input inputMode="decimal" placeholder="0" className={`${fieldClass} font-mono`} value={offlineForm.courierCost} onChange={e => setOfflineForm(f => ({ ...f, courierCost: e.target.value }))} />
              </label>
              <label className="col-span-2 sm:col-span-3">
                <span className={labelClass}>Note</span>
                <input className={fieldClass} value={offlineForm.note} onChange={e => setOfflineForm(f => ({ ...f, note: e.target.value }))} />
              </label>
              <div className="flex items-end">
                <button type="submit" className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Encaissé : <span className="font-mono text-white font-bold">{formatMoney(num(offlineForm.quantity) * num(offlineForm.unitPrice) + num(offlineForm.deliveryCharged))}</span>
            </div>
            {(finance.offline || []).length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[520px]">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-slate-700">
                      <th className="font-semibold py-2">Date</th>
                      <th className="font-semibold py-2">Produit</th>
                      <th className={th}>Pièces</th>
                      <th className={th}>Prix</th>
                      <th className={th}>Livraison</th>
                      <th className={th}>Livreur</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...(finance.offline || [])].sort((a: OfflineSale, b: OfflineSale) => b.date.localeCompare(a.date)).map((s: OfflineSale) => (
                      <tr key={s.id} className="border-b border-slate-800">
                        <td className="py-2 text-slate-300">{s.date}</td>
                        <td className="py-2 text-slate-200 truncate max-w-[180px]">{s.productName}{s.note ? <span className="text-slate-500"> · {s.note}</span> : null}</td>
                        <td className="py-2 text-right font-mono text-slate-200">{s.quantity}<span className="text-[10px] text-slate-500"> / {s.orders} cl.</span></td>
                        <td className="py-2 text-right font-mono text-slate-300">{formatMoney(s.unitPrice)}</td>
                        <td className="py-2 text-right font-mono text-slate-300">{formatMoney(s.deliveryCharged)}</td>
                        <td className="py-2 text-right font-mono text-cyan-300">{formatMoney(s.courierCost)}</td>
                        <td className="py-2 text-right">
                          <button type="button" onClick={() => deleteEntry('offline', s.id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer" aria-label="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </form>

          <div className={`lg:col-span-5 ${card} space-y-3`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Vérifier chez Ozon</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Met à jour les commandes depuis Ozon (livré, refusé, en distribution) et affiche le dernier statut de chaque colis.</p>
              </div>
              <button type="button" onClick={checkOzon} disabled={ozonCheck?.loading} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0">
                <RefreshCw className={`w-3.5 h-3.5 ${ozonCheck?.loading ? 'animate-spin' : ''}`} />
                <span>Vérifier</span>
              </button>
            </div>
            {ozonCheck && !ozonCheck.loading && (
              <div className="space-y-1.5">
                {ozonCheck.rows.map(r => (
                  <details key={r.tn} className="p-2 bg-slate-900/60 rounded-xl text-[11px]">
                    <summary className="cursor-pointer flex justify-between gap-2">
                      <span className="text-slate-200 font-semibold">#{r.orderNumber}</span>
                      <span className="text-blue-300">{r.status}</span>
                    </summary>
                    <div className="mt-1 text-slate-500 font-mono break-all">{r.tn} · {r.detail}</div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`${card} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Livraisons & encaissements</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Le statut vient des commandes (et du suivi Ozon). Corrigez-le ici si besoin, et saisissez le montant réellement encaissé et le vrai coût du livreur.
              </p>
            </div>
            <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value as typeof outcomeFilter)} className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
              <option value="ALL">Tous les statuts</option>
              {(Object.keys(OUTCOME_LABELS) as OrderOutcome[]).map(k => <option key={k} value={k}>{OUTCOME_LABELS[k]}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs min-w-[1100px]">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-700">
                  <th className="font-semibold py-2 pl-4 sm:pl-0">Commande</th>
                  <th className="font-semibold py-2">Statut</th>
                  <th className={th}>Total cmd</th>
                  <th className={th}>Encaissé réel</th>
                  <th className={th}>Livreur réel</th>
                  <th className="font-semibold py-2 text-center">Retour en stock</th>
                  <th className={th}>Coût produit</th>
                  <th className={th}>Pub</th>
                  <th className={`${th} pr-4 sm:pr-0`}>Bénéfice</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.slice(0, 300).map(o => {
                  const id = o.order.id;
                  const d = orderDraftFor(id);
                  const dirty = !!orderDrafts[id];
                  if (o.offline) {
                    return (
                      <tr key={id} className="border-b border-slate-800 bg-slate-900/30">
                        <td className="py-2 pl-4 sm:pl-0">
                          <div className="text-white font-semibold">Hors site · {o.count} client(s)</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[220px]">{new Date(o.order.createdAt).toLocaleDateString('fr-FR')} · {o.order.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}</div>
                        </td>
                        <td className="py-2"><span className={`px-2 py-1 rounded-lg text-[11px] font-bold ${OUTCOME_STYLE.delivered}`}>Livrée</span></td>
                        <td className="py-2 text-right font-mono text-slate-300">{formatMoney(o.order.totalAmount)}</td>
                        <td className="py-2 text-right font-mono text-slate-300">{formatMoney(o.collected)}</td>
                        <td className="py-2 text-right font-mono text-slate-300">{formatMoney(o.courierCost)}</td>
                        <td />
                        <td className="py-2 text-right font-mono text-amber-300">{formatMoney(o.productCost)}</td>
                        <td className="py-2 text-right font-mono text-slate-400">{o.adCost ? formatMoney(o.adCost) : '—'}</td>
                        <td className={`py-2 text-right pr-4 sm:pr-0 font-mono font-black ${profitClass(o.profit)}`}>{formatMoney(o.profit)}</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={id} className="border-b border-slate-800 hover:bg-slate-900/40">
                      <td className="py-2 pl-4 sm:pl-0">
                        <div className="text-white font-semibold">#{o.order.orderNumber}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[220px]">
                          {new Date(o.order.createdAt).toLocaleDateString('fr-FR')} · {o.order.shippingAddress?.city || '—'} · {o.channel === 'direct' ? 'Direct' : AD_PLATFORM_LABELS[o.channel]}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[220px]">{o.order.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}</div>
                      </td>
                      <td className="py-2">
                        <select
                          value={d.outcome}
                          onChange={e => updateOrderDraft(id, { outcome: e.target.value })}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border border-slate-700 ${OUTCOME_STYLE[o.outcome]}`}
                        >
                          <option value="">Auto : {OUTCOME_LABELS[o.outcome]}</option>
                          <option value="delivered">Livrée</option>
                          <option value="returned">Retour / refusée</option>
                          <option value="cancelled">Annulée sans envoi</option>
                        </select>
                        {o.order.shipment?.status && <div className="text-[10px] text-slate-500 mt-0.5">{o.order.shipment.carrier} : {o.order.shipment.status}</div>}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-300">{formatMoney(o.order.totalAmount || 0)}</td>
                      <td className="py-2 text-right">
                        <input className={inputClass} inputMode="decimal" placeholder={o.outcome === 'delivered' ? String(o.order.totalAmount || 0) : '—'} value={d.collected} onChange={e => updateOrderDraft(id, { collected: e.target.value })} />
                      </td>
                      <td className="py-2 text-right">
                        <input
                          className={`${inputClass} ${o.estimatedCourier && !d.courierCost ? 'border-amber-500/60' : ''}`}
                          inputMode="decimal"
                          placeholder={o.courierCost ? String(o.courierCost) : '—'}
                          value={d.courierCost}
                          onChange={e => updateOrderDraft(id, { courierCost: e.target.value })}
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={o.outcome !== 'returned'}
                          checked={d.restocked}
                          onChange={e => updateOrderDraft(id, { restocked: e.target.checked })}
                          className="w-4 h-4 accent-emerald-500 disabled:opacity-30 cursor-pointer"
                          title="Le produit retourné est vendable et remis en stock"
                        />
                      </td>
                      <td className="py-2 text-right font-mono text-amber-300">{o.productCost ? formatMoney(o.productCost) : '—'}</td>
                      <td className="py-2 text-right font-mono text-slate-400">{o.adCost ? formatMoney(o.adCost) : '—'}</td>
                      <td className="py-2 text-right pr-4 sm:pr-0">
                        {dirty ? (
                          <button onClick={() => saveOrderCost(id)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
                            <Save className="w-3 h-3" />
                            <span>Enregistrer</span>
                          </button>
                        ) : (
                          <span className={`font-mono font-black ${o.outcome === 'delivered' || o.outcome === 'returned' ? profitClass(o.profit) : 'text-slate-500'}`}>
                            {o.outcome === 'delivered' || o.outcome === 'returned' ? formatMoney(o.profit) : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleOrders.length === 0 && <div className="text-xs text-slate-500 text-center py-8">Aucune commande sur la période.</div>}
            {visibleOrders.length > 300 && <div className="text-[11px] text-slate-500 text-center py-2">300 premières commandes affichées : réduisez la période.</div>}
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Encaissé réel vide = total de la commande. Livreur réel vide = tarif Ozon du colis, sinon le « Livreur » de la fiche produit (livrée) ou les frais de retour par défaut (retour, voir Paramètres dans le Résumé).
            Cochez « Retour en stock » seulement si le produit revenu est vendable : sa valeur n'est alors pas comptée comme perte.
          </p>
        </div>
        </div>
      )}

      {/* ================= PURCHASES & STOCK ================= */}
      {tab === 'stock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={addPurchase} className={`lg:col-span-5 ${card} space-y-3`}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Enregistrer un achat de stock</h3>
              </div>
              <label className="block">
                <span className={labelClass}>Produit</span>
                <select required className={fieldClass} value={purchaseForm.productId} onChange={e => setPurchaseForm(f => ({ ...f, productId: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {physicalProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label>
                  <span className={labelClass}>Date</span>
                  <input type="date" className={fieldClass} value={purchaseForm.date} onChange={e => setPurchaseForm(f => ({ ...f, date: e.target.value }))} />
                </label>
                <label>
                  <span className={labelClass}>Quantité (pièces)</span>
                  <input required inputMode="numeric" className={`${fieldClass} font-mono`} value={purchaseForm.quantity} onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))} />
                </label>
                <label>
                  <span className={labelClass}>Prix unitaire</span>
                  <input required inputMode="decimal" className={`${fieldClass} font-mono`} value={purchaseForm.unitCost} onChange={e => setPurchaseForm(f => ({ ...f, unitCost: e.target.value }))} />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Fournisseur (optionnel)</span>
                <input className={fieldClass} value={purchaseForm.supplier} onChange={e => setPurchaseForm(f => ({ ...f, supplier: e.target.value }))} />
              </label>
              <label className="flex items-center gap-2 text-[11px] text-slate-400">
                <input type="checkbox" className="accent-emerald-500" checked={purchaseForm.updateCost} onChange={e => setPurchaseForm(f => ({ ...f, updateCost: e.target.checked }))} />
                Mettre ce prix comme coût d'achat de la fiche produit
              </label>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Total : <span className="font-mono text-white font-bold">{formatMoney(num(purchaseForm.quantity) * num(purchaseForm.unitCost))}</span></span>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter l'achat</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Le stock du produit augmente de la quantité achetée. Pour vos anciens stocks, saisissez un achat à leur date avec la quantité de départ.</p>
            </form>

            <div className={`lg:col-span-7 ${card} space-y-3`}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Stock calculé</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[520px]">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-slate-700">
                      <th className="font-semibold py-2">Produit</th>
                      <th className={th}>Acheté</th>
                      <th className={th}>Restant calculé</th>
                      <th className={th}>En stock (QR)</th>
                      <th className={th}>Stock fiche</th>
                      <th className={th}>Coût moyen</th>
                      <th className={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.products.filter(r => r.stockLeft !== null || r.unitsInStock !== null).map(r => (
                      <tr key={r.product.id} className="border-b border-slate-800">
                        <td className="py-2 text-slate-200 font-semibold truncate max-w-[200px]">{r.product.name}</td>
                        <td className="py-2 text-right font-mono text-slate-300">{r.purchasedPieces}</td>
                        <td className={`py-2 text-right font-mono font-bold ${(r.stockLeft ?? 0) < 0 ? 'text-rose-400' : (r.stockLeft ?? 0) <= 5 ? 'text-amber-300' : 'text-emerald-300'}`}>{r.stockLeft}</td>
                        <td className="py-2 text-right font-mono text-cyan-300">{r.unitsInStock ?? '—'}</td>
                        <td className="py-2 text-right font-mono text-slate-400">{r.product.stockQuantity}</td>
                        <td className="py-2 text-right font-mono text-amber-300">{formatMoney(r.unitCost)}</td>
                        <td className="py-2 text-right">
                          {(r.unitsInStock ?? r.stockLeft) !== r.product.stockQuantity && (
                            <button onClick={() => applyStock(r)} className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">Appliquer</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {report.products.every(r => r.stockLeft === null) && <div className="text-xs text-slate-500 text-center py-6">Aucun achat enregistré.</div>}
              </div>
              <p className="text-[10px] text-slate-500">Restant = acheté − pièces expédiées (livrées, en route, retours non remis en stock). Un chiffre négatif signifie qu'un achat n'a pas été saisi.</p>
            </div>
          </div>

          <div className={`${card} space-y-3`}>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Historique des achats ({finance.purchase.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-slate-500 text-left border-b border-slate-700">
                    <th className="font-semibold py-2">Date</th>
                    <th className="font-semibold py-2">Produit</th>
                    <th className={th}>Quantité</th>
                    <th className={th}>Prix unitaire</th>
                    <th className={th}>Total</th>
                    <th className="font-semibold py-2 pl-3">Fournisseur</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...finance.purchase].sort((a, b) => b.date.localeCompare(a.date)).map(pu => (
                    <tr key={pu.id} className="border-b border-slate-800">
                      <td className="py-2 text-slate-300">{pu.date}</td>
                      <td className="py-2 text-slate-200">{pu.productName}</td>
                      <td className="py-2 text-right font-mono text-slate-200">{pu.quantity}</td>
                      <td className="py-2 text-right font-mono text-slate-300">{formatMoney(pu.unitCost)}</td>
                      <td className="py-2 text-right font-mono text-amber-300">{formatMoney(pu.total)}</td>
                      <td className="py-2 pl-3 text-slate-400">{pu.supplier || '—'}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => deleteEntry('purchase', pu.id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer" aria-label="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADS ================= */}
      {tab === 'ads' && (
        <div className="space-y-6">
          <div className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-white uppercase tracking-wider">Synchro automatique (chaque nuit)</div>
              <div className="text-slate-400">
                Facebook : <span className={adSync?.meta ? 'text-emerald-300' : 'text-slate-500'}>{adSync?.meta ? 'connecté' : 'non configuré'}</span>
                {' · '}TikTok : <span className={adSync?.tiktok ? 'text-emerald-300' : 'text-slate-500'}>{adSync?.tiktok ? 'connecté' : 'non configuré'}</span>
                {adSync && <> · 1 $ = {adSync.usdToMad} DH</>}
              </div>
              {adSync?.lastResult && <div className="text-slate-500">Dernière synchro : {adSync.lastRunAt ? new Date(adSync.lastRunAt).toLocaleString('fr-FR') : ''} · {adSync.lastResult}</div>}
              {adSync?.lastError && <div className="text-rose-300">{adSync.lastError}</div>}
            </div>
            <button
              type="button"
              onClick={runAdSync}
              disabled={adSyncing || !(adSync?.meta || adSync?.tiktok)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${adSyncing ? 'animate-spin' : ''}`} />
              <span>Synchroniser (14 jours)</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={addAd} className={`lg:col-span-5 ${card} space-y-3`}>
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dépense publicitaire</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className={labelClass}>Date du débit</span>
                  <input type="date" className={fieldClass} value={adForm.date} onChange={e => setAdForm(f => ({ ...f, date: e.target.value }))} />
                </label>
                <label>
                  <span className={labelClass}>Plateforme</span>
                  <select className={fieldClass} value={adForm.platform} onChange={e => setAdForm(f => ({ ...f, platform: e.target.value as AdPlatform }))}>
                    {(Object.keys(AD_PLATFORM_LABELS) as AdPlatform[]).map(k => <option key={k} value={k}>{AD_PLATFORM_LABELS[k]}</option>)}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Montant débité (DH)</span>
                  <input required inputMode="decimal" className={`${fieldClass} font-mono`} value={adForm.amount} onChange={e => setAdForm(f => ({ ...f, amount: e.target.value }))} />
                </label>
                <label>
                  <span className={labelClass}>Produit (optionnel)</span>
                  <select className={fieldClass} value={adForm.productId} onChange={e => setAdForm(f => ({ ...f, productId: e.target.value }))}>
                    <option value="">Toute la boutique</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Campagne (optionnel)</span>
                <input className={fieldClass} value={adForm.campaign} onChange={e => setAdForm(f => ({ ...f, campaign: e.target.value }))} />
              </label>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Saisissez le montant réellement débité (facture Meta / TikTok), pas le budget prévu. Il est réparti sur les commandes livrées venant de cette plateforme (et de ce produit si choisi).</p>
            </form>

            <div className={`lg:col-span-7 ${card} space-y-3`}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Performance par plateforme</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[640px]">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-slate-700">
                      <th className="font-semibold py-2">Plateforme</th>
                      <th className={th}>Dépensé</th>
                      <th className={th}>Cmd</th>
                      <th className={th}>Livrées</th>
                      <th className={th}>Coût/livrée</th>
                      <th className={th}>ROAS</th>
                      <th className={th}>Bénéfice après pub</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.ads.map(a => (
                      <tr key={a.platform} className="border-b border-slate-800">
                        <td className="py-2 text-slate-200 font-semibold">{AD_PLATFORM_LABELS[a.platform]}</td>
                        <td className="py-2 text-right font-mono text-pink-300">{formatMoney(a.spend)}</td>
                        <td className="py-2 text-right font-mono text-slate-300">{a.orders}</td>
                        <td className="py-2 text-right font-mono text-emerald-300">{a.delivered}{a.returned ? <span className="text-rose-300"> / {a.returned} ret.</span> : null}</td>
                        <td className="py-2 text-right font-mono text-slate-300">{a.costPerDelivered === null ? '—' : formatMoney(a.costPerDelivered)}</td>
                        <td className="py-2 text-right font-mono text-slate-300">{a.roas === null ? '—' : `×${a.roas.toFixed(2)}`}</td>
                        <td className={`py-2 text-right font-mono font-bold ${profitClass(a.net)}`}>{formatMoney(a.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {report.ads.length === 0 && <div className="text-xs text-slate-500 text-center py-6">Aucune dépense ni commande attribuée sur la période.</div>}
              </div>
              <p className="text-[10px] text-slate-500">Les commandes sont attribuées à une plateforme grâce à leur source (utm). Bénéfice après pub = encaissé − coût produit − livreur − dépense de la plateforme. Négatif = la pub coûte plus qu'elle ne rapporte.</p>
            </div>
          </div>

          <div className={`${card} space-y-3`}>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dépenses enregistrées ({finance.ad.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="text-slate-500 text-left border-b border-slate-700">
                    <th className="font-semibold py-2">Date</th>
                    <th className="font-semibold py-2">Plateforme</th>
                    <th className="font-semibold py-2">Campagne / produit</th>
                    <th className={th}>Montant</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...finance.ad].sort((a, b) => b.date.localeCompare(a.date)).map(a => (
                    <tr key={a.id} className="border-b border-slate-800">
                      <td className="py-2 text-slate-300">{a.date}</td>
                      <td className="py-2 text-slate-200">{AD_PLATFORM_LABELS[a.platform]}</td>
                      <td className="py-2 text-slate-400">{[a.campaign, a.productId ? dbService.getProductById(a.productId)?.name : ''].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="py-2 text-right font-mono text-pink-300">{formatMoney(a.amount)}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => deleteEntry('ad', a.id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer" aria-label="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXPENSES ================= */}
      {tab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={addExpense} className={`lg:col-span-5 ${card} space-y-3`}>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Autre charge</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className={labelClass}>Date</span>
                <input type="date" className={fieldClass} value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} />
              </label>
              <label>
                <span className={labelClass}>Montant (DH)</span>
                <input required inputMode="decimal" className={`${fieldClass} font-mono`} value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
              </label>
              <label>
                <span className={labelClass}>Type</span>
                <select className={fieldClass} value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Détail</span>
                <input className={fieldClass} value={expenseForm.label} onChange={e => setExpenseForm(f => ({ ...f, label: e.target.value }))} />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </form>

          <div className={`lg:col-span-7 ${card} space-y-3`}>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Charges enregistrées ({finance.expense.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[480px]">
                <thead>
                  <tr className="text-slate-500 text-left border-b border-slate-700">
                    <th className="font-semibold py-2">Date</th>
                    <th className="font-semibold py-2">Type</th>
                    <th className="font-semibold py-2">Détail</th>
                    <th className={th}>Montant</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...finance.expense].sort((a, b) => b.date.localeCompare(a.date)).map(x => (
                    <tr key={x.id} className="border-b border-slate-800">
                      <td className="py-2 text-slate-300">{x.date}</td>
                      <td className="py-2 text-slate-200">{x.category}</td>
                      <td className="py-2 text-slate-400">{x.label || '—'}</td>
                      <td className="py-2 text-right font-mono text-violet-300">{formatMoney(x.amount)}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => deleteEntry('expense', x.id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer" aria-label="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
