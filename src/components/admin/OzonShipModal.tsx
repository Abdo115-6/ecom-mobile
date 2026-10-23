import React, { useEffect, useMemo, useState } from 'react';
import { X, Truck, Search, Loader2, Copy } from 'lucide-react';
import { Order } from '../../types/ecommerce';
import { useApp } from '../../context/AppContext';

interface OzonCity {
  id: number;
  name: string;
  deliveredPrice: number;
}

interface Props {
  order: Order;
  onClose: () => void;
  onSent: (shipment: Order['shipment'], status: Order['status']) => void;
}

/** Sends one order to Ozon Express: the city is pre-selected when it matches exactly one Ozon city */
export const OzonShipModal: React.FC<Props> = ({ order, onClose, onSent }) => {
  const { formatMoney, showToast } = useApp();
  const [cities, setCities] = useState<OzonCity[]>([]);
  const [cityId, setCityId] = useState<number | ''>('');
  const [query, setQuery] = useState(order.shippingAddress.city || '');
  const [note, setNote] = useState(order.notes || '');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alreadySent = order.shipment?.carrier === 'Ozon Express' && !!order.shipment?.trackingNumber;

  useEffect(() => {
    fetch(`/api/ozon/cities?city=${encodeURIComponent(order.shippingAddress.city || '')}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.message);
        setCities(data.cities);
        if (data.match) setCityId(data.match);
      })
      .catch(err => setError(err.message || 'Villes Ozon indisponibles'))
      .finally(() => setLoading(false));
  }, [order.shippingAddress.city]);

  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const shown = useMemo(() => {
    const q = norm(query.trim());
    const list = q ? cities.filter(c => norm(c.name).includes(q)) : cities;
    const selected = cities.find(c => c.id === cityId);
    return selected && !list.includes(selected) ? [selected, ...list] : list;
  }, [cities, query, cityId]);

  const send = async () => {
    if (!cityId) return setError('Choisissez la ville Ozon');
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/ozon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId, note })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSent(data.shipment, data.status);
      showToast(`✓ Colis Ozon créé : ${data.shipment.trackingNumber}`);
    } catch (err: any) {
      setError(err.message || 'Envoi Ozon impossible');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Ozon Express</h3>
              <p className="text-xs text-slate-400 font-mono">#{order.orderNumber} · {order.customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {alreadySent ? (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-slate-400">Numéro de suivi</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono font-black text-emerald-400 text-base">{order.shipment.trackingNumber}</span>
                <button
                  onClick={() => { navigator.clipboard?.writeText(order.shipment.trackingNumber || ''); showToast('Numéro copié'); }}
                  className="text-slate-400 hover:text-white" title="Copier"
                ><Copy className="w-3.5 h-3.5" /></button>
              </div>
              <div className="mt-2 text-slate-300">Statut Ozon : <span className="font-bold text-white">{order.shipment.status || '—'}</span></div>
            </div>
            {(order.shipment as any).history?.length > 0 && (
              <div className="space-y-1">
                {[...(order.shipment as any).history].reverse().map((h: any, i: number) => (
                  <div key={i} className="flex justify-between text-slate-400">
                    <span>{h.status}</span>
                    <span className="font-mono">{new Date(h.at).toLocaleString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1">
              <div className="text-white font-bold">{order.shippingAddress.fullName || order.customerName} · {order.shippingAddress.phone || order.customerPhone}</div>
              <div className="text-slate-300">{order.shippingAddress.street}, {order.shippingAddress.city}</div>
              <div className="text-amber-400 font-bold">À encaisser : {formatMoney(order.totalAmount)}</div>
            </div>

            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Ville Ozon (quartier pour Casablanca)</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher une ville…"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-8 pr-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <select
                value={cityId}
                onChange={e => setCityId(Number(e.target.value) || '')}
                size={6}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-1 text-white focus:outline-none"
                disabled={loading}
              >
                {shown.map(c => (
                  <option key={c.id} value={c.id}>{c.name} · {c.deliveredPrice} DH</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Note pour le livreur (optionnel)</span>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-orange-500"
              />
            </label>
          </div>
        )}

        {error && <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">{error}</div>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">Fermer</button>
          {!alreadySent && (
            <button
              onClick={send}
              disabled={sending || loading || !cityId}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              <span>Créer le colis</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
