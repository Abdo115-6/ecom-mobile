import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Truck, Home } from 'lucide-react';

export const OrderConfirmationView: React.FC = () => {
  const { lastConfirmedOrder, setLastConfirmedOrder, setCurrentView, formatMoney, t } = useApp();

  // Background polling: syncs order status seamlessly
  useEffect(() => {
    if (!lastConfirmedOrder) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            const found = data.orders.find((o: any) => o.id === lastConfirmedOrder.id);
            if (
              found && 
              (found.status !== lastConfirmedOrder.status || 
               found.whatsappConfirmation?.isConfirmed !== lastConfirmedOrder.whatsappConfirmation?.isConfirmed)
            ) {
              setLastConfirmedOrder(found);
            }
          }
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [lastConfirmedOrder?.id]);

  if (!lastConfirmedOrder) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Aucune commande récente</h2>
        <button
          onClick={() => setCurrentView('home')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const isConfirmed = lastConfirmedOrder.whatsappConfirmation?.isConfirmed || lastConfirmedOrder.status === 'CONFIRMED';
  const isCancelled = lastConfirmedOrder.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 pb-24 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Success Badge */}
      <div className="text-center space-y-3">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm ${
          isCancelled ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {isCancelled ? 'Commande annulée' : t.orderSuccessTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          {isCancelled 
            ? 'Votre commande a été annulée.' 
            : `${t.orderSuccessMsg} Notre équipe prépare votre colis pour expédition rapide.`}
        </p>
      </div>

      {/* Main Order Details Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
        
        {/* Order Number & Live Status Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="text-xs text-slate-400">Numéro de Commande</div>
            <div className="text-base font-black text-slate-900">{lastConfirmedOrder.orderNumber}</div>
          </div>
          <span className={`px-3 py-1 font-bold rounded-lg text-xs ${
            isConfirmed ? 'bg-emerald-100 text-emerald-800' : isCancelled ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {isConfirmed ? 'CONFIRMÉE ✅' : isCancelled ? 'ANNULÉE ❌' : lastConfirmedOrder.status}
          </span>
        </div>

        {/* Items Summary */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Articles commandés</h3>
          <div className="divide-y divide-slate-100">
            {lastConfirmedOrder.items.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    <div className="text-slate-400 text-[10px]">Qté : {item.quantity} · {item.variantTitle || ''}</div>
                  </div>
                </div>
                <div className="font-bold text-slate-900">{formatMoney(item.subtotal)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-700 border border-slate-100">
          <div className="font-bold text-slate-900">Adresse de livraison :</div>
          <div>{lastConfirmedOrder.shippingAddress.fullName} · {lastConfirmedOrder.shippingAddress.phone}</div>
          <div>{lastConfirmedOrder.shippingAddress.street}, {lastConfirmedOrder.shippingAddress.city}</div>
        </div>

        {/* Total breakdown */}
        <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Mode de paiement</span>
            <span className="font-semibold text-slate-900">Paiement en espèces à la livraison (COD)</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-100">
            <span>Total à régler au livreur</span>
            <span className="text-emerald-700">{formatMoney(lastConfirmedOrder.totalAmount)}</span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setCurrentView('track-order')}
          className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-colors text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          <span>Suivre l'acheminement du colis</span>
        </button>
        <button
          onClick={() => setCurrentView('home')}
          className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Retourner à l'accueil</span>
        </button>
      </div>

    </div>
  );
};
