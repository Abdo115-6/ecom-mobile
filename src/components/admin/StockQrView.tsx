import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Order } from '../../types/ecommerce';
import {
  orderOutcome,
  OUTCOME_LABELS,
  QR_PREFIX,
  type OrderCost,
  type StockUnit,
  type UnitStatus
} from '../../services/financeCalc';
import { Camera, CameraOff, Printer, QrCode, Search, Package, Truck, Banknote, RotateCcw, X, RefreshCw } from 'lucide-react';

// Each physical piece gets a code; scanning it moves the piece: shelf -> order (followed at Ozon) or direct sale

const STATUS_LABELS: Record<UnitStatus, string> = {
  in_stock: 'En stock',
  linked: 'Expédiée (commande)',
  sold: 'Vendue directement',
  lost: 'Perdue / cassée'
};

const STATUS_STYLE: Record<UnitStatus, string> = {
  in_stock: 'bg-emerald-500/15 text-emerald-300',
  linked: 'bg-blue-500/15 text-blue-300',
  sold: 'bg-violet-500/15 text-violet-300',
  lost: 'bg-rose-500/15 text-rose-300'
};

const OPEN_STATUSES: Order['status'][] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];
const today = () => new Date().toISOString().slice(0, 10);
const num = (v: string) => Math.max(0, Number(String(v).replace(',', '.')) || 0);

/** Short readable code, unique enough for a shop: U-K3F9-7QX2 */
const newUnitCode = () => {
  const r = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `U-${Date.now().toString(36).slice(-4).toUpperCase()}-${r()}`;
};

const codeFromScan = (text: string) => {
  const t = text.trim();
  return (t.startsWith(QR_PREFIX) ? t.slice(QR_PREFIX.length) : t).toUpperCase();
};

export const StockQrView: React.FC = () => {
  const { formatMoney, showToast } = useApp();
  const [units, setUnits] = useState<StockUnit[]>([]);
  const [orderCosts, setOrderCosts] = useState<OrderCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<StockUnit | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [filterProduct, setFilterProduct] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'ALL'>('ALL');

  // Label creation
  const [genProductId, setGenProductId] = useState('');
  const [genQty, setGenQty] = useState('');
  const [genCost, setGenCost] = useState('');

  // Actions on the scanned piece
  const [linkOrderId, setLinkOrderId] = useState('');
  const [sale, setSale] = useState({ price: '', delivery: '', courier: '' });

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const products = useMemo(() => dbService.products.filter(p => (p.productKind || 'PHYSICAL') === 'PHYSICAL'), []);
  const ordersById = useMemo(() => new Map(dbService.orders.map(o => [o.id, o])), [units]);
  const costsById = useMemo(() => new Map(orderCosts.map(c => [c.id, c])), [orderCosts]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(res.status === 401 ? 'Session admin expirée' : data.message || `HTTP ${res.status}`);
      setUnits(data.unit || []);
      setOrderCosts(data.order || []);
    } catch (err: any) {
      showToast(`Chargement impossible : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const post = async (kind: string, body: any): Promise<any> => {
    const res = await fetch(`/api/finance/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  };

  const saveUnit = async (unit: StockUnit, action: string, note?: string): Promise<StockUnit | null> => {
    const next = { ...unit, history: [...unit.history, { at: new Date().toISOString(), action, note }].slice(-30) };
    try {
      const { entry } = await post('unit', next);
      setUnits(prev => [entry, ...prev.filter(u => u.id !== entry.id)]);
      setCurrent(entry);
      return entry;
    } catch (err: any) {
      showToast(`Enregistrement impossible : ${err.message}`);
      return null;
    }
  };

  // Where a piece really is: a piece packed for an order follows that order's delivery
  const unitState = (u: StockUnit): { label: string; style: string } => {
    if (u.status === 'linked' && u.orderId) {
      const order = ordersById.get(u.orderId);
      if (order) {
        const outcome = orderOutcome(order, costsById.get(order.id));
        const style = outcome === 'delivered' ? 'bg-emerald-500/15 text-emerald-300' : outcome === 'returned' ? 'bg-rose-500/15 text-rose-300' : 'bg-blue-500/15 text-blue-300';
        return { label: `${OUTCOME_LABELS[outcome]}${order.shipment?.status ? ` · ${order.shipment.status}` : ''}`, style };
      }
    }
    return { label: STATUS_LABELS[u.status], style: STATUS_STYLE[u.status] };
  };

  // ---------- Scan ----------
  const openCode = (raw: string) => {
    const code = codeFromScan(raw);
    if (!code) return;
    const unit = units.find(u => u.id === code);
    if (!unit) {
      showToast(`Code inconnu : ${code}`);
      return;
    }
    setCurrent(unit);
    setLinkOrderId('');
    const product = dbService.getProductById(unit.productId);
    setSale({ price: String(product?.price ?? ''), delivery: '0', courier: '0' });
    if (navigator.vibrate) navigator.vibrate(80);
  };

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const Detector = (window as any).BarcodeDetector;
      const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      const tick = async () => {
        if (!streamRef.current) return;
        let text = '';
        try {
          if (detector) {
            const found = await detector.detect(video);
            text = found[0]?.rawValue || '';
          } else if (video.videoWidth) {
            // jsQR fallback (iPhone Safari has no BarcodeDetector)
            const w = Math.min(640, video.videoWidth);
            const h = Math.round((video.videoHeight / video.videoWidth) * w);
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(video, 0, 0, w, h);
            text = jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data || '';
          }
        } catch {
          // keep scanning
        }
        const now = Date.now();
        if (text && (text !== lastScanRef.current.code || now - lastScanRef.current.at > 3000)) {
          lastScanRef.current = { code: text, at: now };
          openCode(text);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      setCameraError(err?.name === 'NotAllowedError' ? 'Autorisez la caméra pour ce site dans le navigateur.' : `Caméra indisponible : ${err?.message || err}`);
      stopCamera();
    }
  };

  // ---------- Labels ----------
  const printLabels = async (list: StockUnit[]) => {
    if (list.length === 0) return;
    const win = window.open('', '_blank');
    if (!win) return showToast('Autorisez les fenêtres pop-up pour imprimer');
    const images = await Promise.all(list.map(u => QRCode.toDataURL(QR_PREFIX + u.id, { margin: 1, width: 220, errorCorrectionLevel: 'M' })));
    const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Étiquettes QR</title>
      <style>
        body{font-family:Arial,sans-serif;margin:8mm}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}
        .l{border:1px dashed #999;padding:2mm;text-align:center;break-inside:avoid}
        .l img{width:30mm;height:30mm}
        .c{font:bold 9pt monospace}
        .n{font-size:7pt;color:#333;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
        @media print{.no{display:none}}
      </style></head><body>
      <button class="no" onclick="print()" style="margin-bottom:6mm;padding:8px 16px">Imprimer</button>
      <div class="grid">${list.map((u, i) => `<div class="l"><img src="${images[i]}"><div class="c">${esc(u.id)}</div><div class="n">${esc(u.productName.slice(0, 40))}</div></div>`).join('')}</div>
      </body></html>`);
    win.document.close();
  };

  const createLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = dbService.getProductById(genProductId);
    const qty = Math.min(Math.round(num(genQty)), 500);
    if (!product || qty <= 0) return showToast('Choisissez le produit et le nombre de pièces');
    const now = new Date().toISOString();
    const batch = `${today()} · ${qty} pcs`;
    const list: StockUnit[] = Array.from({ length: qty }, () => ({
      id: newUnitCode(), productId: product.id, productName: product.name, unitCost: num(genCost) || product.costPrice || 0,
      batch, status: 'in_stock', createdAt: now, history: [{ at: now, action: 'Étiquette créée', note: 'Mise en stock' }]
    }));
    try {
      const { entries } = await post('unit', list);
      setUnits(prev => [...entries, ...prev]);
      showToast(`✓ ${qty} étiquettes créées pour ${product.name}`);
      setGenQty('');
      printLabels(entries);
    } catch (err: any) {
      showToast(`Création impossible : ${err.message}`);
    }
  };

  // ---------- Actions ----------
  const productOrders = (u: StockUnit) => {
    const linked = new Map<string, number>();
    units.filter(x => x.status === 'linked' && x.orderId).forEach(x => linked.set(x.orderId!, (linked.get(x.orderId!) || 0) + 1));
    return dbService.orders.filter(o => {
      if (!OPEN_STATUSES.includes(o.status)) return false;
      const pieces = o.items.filter(i => i.productId === u.productId).reduce((s, i) => s + i.quantity * (i.packPieces || 1), 0);
      return pieces > (linked.get(o.id) || 0);
    });
  };

  const linkToOrder = async () => {
    if (!current) return;
    const order = dbService.orders.find(o => o.id === linkOrderId);
    if (!order) return showToast('Choisissez la commande');
    const saved = await saveUnit({ ...current, status: 'linked', orderId: order.id, orderNumber: order.orderNumber }, 'Emballée pour une commande', `#${order.orderNumber} · ${order.shippingAddress?.city || ''}`);
    if (saved) showToast(`✓ Pièce ${saved.id} associée à #${order.orderNumber}`);
  };

  const sellDirect = async () => {
    if (!current) return;
    const price = num(sale.price);
    if (price <= 0) return showToast('Saisissez le prix de vente');
    const saleId = `qr-${current.id}`;
    try {
      await post('offline', {
        id: saleId, date: today(), productId: current.productId, productName: current.productName, quantity: 1, orders: 1,
        unitPrice: price, deliveryCharged: num(sale.delivery), courierCost: num(sale.courier), channel: 'direct', note: `Vente directe QR ${current.id}`
      });
    } catch (err: any) {
      return showToast(`Vente non enregistrée : ${err.message}`);
    }
    const saved = await saveUnit({ ...current, status: 'sold', saleId, orderId: undefined, orderNumber: undefined }, 'Vendue directement', formatMoney(price + num(sale.delivery)));
    if (saved) showToast(`✓ Vente directe enregistrée : ${formatMoney(price + num(sale.delivery))}`);
  };

  const backToStock = async () => {
    if (!current) return;
    // A returned parcel scanned back in: the order's goods are not lost
    if (current.orderId) {
      const order = ordersById.get(current.orderId);
      if (order && orderOutcome(order, costsById.get(order.id)) === 'returned') {
        try {
          const prev = costsById.get(order.id);
          const { entry } = await post('order', { ...(prev || {}), id: order.id, restocked: true });
          setOrderCosts(list => [entry, ...list.filter(c => c.id !== entry.id)]);
        } catch {
          // the piece still goes back on the shelf
        }
      }
    }
    if (current.saleId) {
      await fetch(`/api/finance/offline/${encodeURIComponent(current.saleId)}`, { method: 'DELETE' }).catch(() => null);
    }
    const saved = await saveUnit({ ...current, status: 'in_stock', orderId: undefined, orderNumber: undefined, saleId: undefined }, 'Remise en stock', current.orderNumber ? `retour de #${current.orderNumber}` : undefined);
    if (saved) showToast(`✓ ${saved.id} remise en stock`);
  };

  const markLost = async () => {
    if (!current) return;
    const saved = await saveUnit({ ...current, status: 'lost' }, 'Perdue / cassée');
    if (saved) showToast(`${saved.id} marquée perdue`);
  };

  // ---------- Lists ----------
  const counts = useMemo(() => {
    const map = new Map<string, { name: string; in_stock: number; linked: number; sold: number; lost: number }>();
    units.forEach(u => {
      const c = map.get(u.productId) || { name: u.productName, in_stock: 0, linked: 0, sold: 0, lost: 0 };
      c[u.status] += 1;
      map.set(u.productId, c);
    });
    return [...map.entries()];
  }, [units]);

  const visible = units
    .filter(u => (filterProduct === 'ALL' || u.productId === filterProduct) && (filterStatus === 'ALL' || u.status === filterStatus))
    .slice(0, 400);

  const card = 'bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5';
  const fieldClass = 'w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white';
  const labelClass = 'text-[11px] font-semibold text-slate-400 block mb-1';
  const btn = 'px-3 py-2 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-40';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">Stock QR</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Une étiquette par pièce. Scannez-la pour l'expédier avec une commande (suivie chez Ozon), la vendre directement ou la remettre en stock.</p>
        </div>
        <button onClick={load} className={`${btn} bg-slate-800 border border-slate-700 text-slate-200`}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stock by product */}
      {counts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {counts.map(([pid, c]) => (
            <div key={pid} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3">
              <div className="text-xs text-white font-semibold truncate">{c.name}</div>
              <div className="flex gap-3 mt-1.5 text-[11px] font-mono">
                <span className="text-emerald-300">{c.in_stock} en stock</span>
                <span className="text-blue-300">{c.linked} expédiées</span>
                <span className="text-violet-300">{c.sold} vendues</span>
                {c.lost > 0 && <span className="text-rose-300">{c.lost} perdues</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scanner */}
        <div className={`lg:col-span-7 ${card} space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Scanner une pièce</h3>
            {cameraOn ? (
              <button onClick={stopCamera} className={`${btn} bg-slate-700 text-white`}><CameraOff className="w-4 h-4" /><span>Arrêter</span></button>
            ) : (
              <button onClick={startCamera} className={`${btn} bg-cyan-600 hover:bg-cyan-500 text-white`}><Camera className="w-4 h-4" /><span>Ouvrir la caméra</span></button>
            )}
          </div>
          <div className={`relative rounded-2xl overflow-hidden bg-black ${cameraOn ? '' : 'hidden'}`}>
            <video ref={videoRef} playsInline muted className="w-full max-h-[50vh] object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-cyan-400/80 rounded-2xl" />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          {cameraError && <p className="text-xs text-rose-300">{cameraError}</p>}
          <form onSubmit={e => { e.preventDefault(); openCode(manualCode); setManualCode(''); }} className="flex gap-2">
            <input value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="Ou tapez le code : U-XXXX-XXXX" className={`${fieldClass} font-mono`} />
            <button type="submit" className={`${btn} bg-slate-700 text-white`}><Search className="w-4 h-4" /></button>
          </form>

          {current && (() => {
            const state = unitState(current);
            const product = dbService.getProductById(current.productId);
            const order = current.orderId ? ordersById.get(current.orderId) : undefined;
            const options = current.status === 'in_stock' ? productOrders(current) : [];
            return (
              <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {product?.images[0]?.imageUrl && <img src={product.images[0].imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-mono text-cyan-300 font-black">{current.id}</div>
                      <div className="text-xs text-white truncate">{current.productName}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${state.style}`}>{state.label}</span>
                    </div>
                  </div>
                  <button onClick={() => setCurrent(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer" aria-label="Fermer"><X className="w-4 h-4" /></button>
                </div>
                {order && (
                  <div className="text-[11px] text-slate-400">
                    Commande #{order.orderNumber} · {order.customerName} · {order.shippingAddress?.city} · {formatMoney(order.totalAmount)}
                    {order.shipment?.trackingNumber && <> · Ozon {order.shipment.trackingNumber}</>}
                  </div>
                )}

                {current.status === 'in_stock' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className={labelClass}><Truck className="w-3.5 h-3.5 inline mr-1" />Expédier avec une commande</span>
                      <div className="flex gap-2">
                        <select value={linkOrderId} onChange={e => setLinkOrderId(e.target.value)} className={fieldClass}>
                          <option value="">{options.length ? 'Choisir la commande…' : 'Aucune commande ouverte pour ce produit'}</option>
                          {options.map(o => (
                            <option key={o.id} value={o.id}>#{o.orderNumber} · {o.customerName} · {o.shippingAddress?.city} · {o.status}</option>
                          ))}
                        </select>
                        <button onClick={linkToOrder} disabled={!linkOrderId} className={`${btn} bg-blue-600 hover:bg-blue-500 text-white shrink-0`}>Associer</button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className={labelClass}><Banknote className="w-3.5 h-3.5 inline mr-1" />Vente directe (payée maintenant)</span>
                      <div className="grid grid-cols-3 gap-2">
                        <label><span className="text-[10px] text-slate-500">Prix</span><input inputMode="decimal" value={sale.price} onChange={e => setSale(s => ({ ...s, price: e.target.value }))} className={`${fieldClass} font-mono`} /></label>
                        <label><span className="text-[10px] text-slate-500">Livraison payée</span><input inputMode="decimal" value={sale.delivery} onChange={e => setSale(s => ({ ...s, delivery: e.target.value }))} className={`${fieldClass} font-mono`} /></label>
                        <label><span className="text-[10px] text-slate-500">Livreur payé</span><input inputMode="decimal" value={sale.courier} onChange={e => setSale(s => ({ ...s, courier: e.target.value }))} className={`${fieldClass} font-mono`} /></label>
                      </div>
                      <button onClick={sellDirect} className={`${btn} w-full bg-violet-600 hover:bg-violet-500 text-white`}>Enregistrer la vente · {formatMoney(num(sale.price) + num(sale.delivery))}</button>
                    </div>
                    <button onClick={markLost} className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer">Marquer perdue / cassée</button>
                  </div>
                )}

                {current.status !== 'in_stock' && (
                  <button onClick={backToStock} className={`${btn} w-full bg-emerald-600 hover:bg-emerald-500 text-white`}>
                    <RotateCcw className="w-4 h-4" />
                    <span>Remettre en stock (retour vendable)</span>
                  </button>
                )}

                <div className="border-t border-slate-800 pt-2 space-y-0.5">
                  {[...current.history].reverse().slice(0, 6).map((h, i) => (
                    <div key={i} className="text-[10px] text-slate-500">{new Date(h.at).toLocaleString('fr-FR')} · <span className="text-slate-300">{h.action}</span>{h.note ? ` · ${h.note}` : ''}</div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Labels */}
        <form onSubmit={createLabels} className={`lg:col-span-5 ${card} space-y-3`}>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Créer des étiquettes QR</h3>
          </div>
          <label className="block">
            <span className={labelClass}>Produit</span>
            <select required value={genProductId} onChange={e => { setGenProductId(e.target.value); setGenCost(String(dbService.getProductById(e.target.value)?.costPrice ?? '')); }} className={fieldClass}>
              <option value="">Choisir…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label><span className={labelClass}>Pièces sur l'étagère</span><input required inputMode="numeric" value={genQty} onChange={e => setGenQty(e.target.value)} className={`${fieldClass} font-mono`} /></label>
            <label><span className={labelClass}>Coût d'achat / pièce</span><input inputMode="decimal" value={genCost} onChange={e => setGenCost(e.target.value)} className={`${fieldClass} font-mono`} /></label>
          </div>
          <button type="submit" className={`${btn} w-full bg-emerald-600 hover:bg-emerald-500 text-white`}><Printer className="w-4 h-4" /><span>Créer et imprimer</span></button>
          <p className="text-[10px] text-slate-500">Comptez les pièces que vous avez réellement, créez une étiquette par pièce et collez-la sur le carton. Pour un nouvel achat, enregistrez d'abord l'achat dans « Calculation », puis créez ses étiquettes ici.</p>
        </form>
      </div>

      {/* All pieces */}
      <div className={`${card} space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Toutes les pièces ({units.length})</h3>
          <div className="flex flex-wrap gap-2">
            <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
              <option value="ALL">Tous les produits</option>
              {counts.map(([pid, c]) => <option key={pid} value={pid}>{c.name.slice(0, 40)}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)} className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
              <option value="ALL">Tous les statuts</option>
              {(Object.keys(STATUS_LABELS) as UnitStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <button onClick={() => printLabels(visible)} disabled={visible.length === 0} className={`${btn} bg-slate-700 text-white`}><Printer className="w-3.5 h-3.5" /><span>Réimprimer</span></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-700">
                <th className="font-semibold py-2">Code</th>
                <th className="font-semibold py-2">Produit</th>
                <th className="font-semibold py-2">État</th>
                <th className="font-semibold py-2">Commande</th>
                <th className="font-semibold py-2 text-right">Coût</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(u => {
                const state = unitState(u);
                return (
                  <tr key={u.id} onClick={() => openCode(u.id)} className="border-b border-slate-800 hover:bg-slate-900/40 cursor-pointer">
                    <td className="py-2 font-mono text-cyan-300">{u.id}</td>
                    <td className="py-2 text-slate-200 truncate max-w-[200px]">{u.productName}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${state.style}`}>{state.label}</span></td>
                    <td className="py-2 text-slate-400">{u.orderNumber ? `#${u.orderNumber}` : '—'}</td>
                    <td className="py-2 text-right font-mono text-amber-300">{formatMoney(u.unitCost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {units.length === 0 && !loading && <div className="text-xs text-slate-500 text-center py-6">Aucune étiquette. Comptez votre stock et créez les étiquettes ci-dessus.</div>}
        </div>
      </div>
    </div>
  );
};
