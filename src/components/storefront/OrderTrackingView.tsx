import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Order, OrderItem, OrderStatus } from '../../types/ecommerce';

export const OrderTrackingView: React.FC = () => {
  const { lastConfirmedOrder, formatMoney } = useApp();
  const [searchOrderNumber, setSearchOrderNumber] = useState(
    lastConfirmedOrder?.orderNumber || 'ORD-2026-9481'
  );
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(
    lastConfirmedOrder || dbService.orders[0] || null
  );
  const [hasSearched, setHasSearched] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = dbService.orders.find(
      o => o.orderNumber.toLowerCase() === searchOrderNumber.trim().toLowerCase()
    );
    setSearchedOrder(found || null);
    setHasSearched(true);
  };

  const statusSteps: Array<{ key: OrderStatus; label: string; desc: string }> = [
    { key: 'PENDING', label: 'En attente', desc: 'Commande reçue dans notre système' },
    { key: 'CONFIRMED', label: 'Confirmée', desc: 'Commande validée par l\'équipe' },
    { key: 'PROCESSING', label: 'En préparation', desc: 'Colis soigneusement emballé' },
    { key: 'SHIPPED', label: 'En livraison', desc: 'Pris en charge par le livreur Aura Express' },
    { key: 'DELIVERED', label: 'Livrée', desc: 'Colis remis en main propre' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PROCESSING': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 1;
    }
  };

  const currentStepIdx = searchedOrder ? getStepIndex(searchedOrder.status) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24">
      
      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Suivi de Commande en Temps Réel</h1>
        <p className="text-xs text-slate-500">
          Entrez votre numéro de commande pour connaître la position et le statut d'acheminement de votre colis.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchOrderNumber}
            onChange={(e) => setSearchOrderNumber(e.target.value)}
            placeholder="Ex: ORD-2026-9481"
            className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-md cursor-pointer"
        >
          Rechercher
        </button>
      </form>

      {/* Search Result */}
      {hasSearched && (
        searchedOrder ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Commande</span>
                <div className="text-base font-black text-slate-900">{searchedOrder.orderNumber}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transporteur</span>
                <div className="text-xs font-bold text-slate-900">{searchedOrder.shipment.carrier}</div>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Évolution de la livraison</h3>
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.key} className="relative flex items-start gap-3">
                      <div
                        className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isCurrent ? 'text-emerald-700' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label} {isCurrent && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm ml-1 font-semibold">En cours</span>}
                        </div>
                        <div className="text-[11px] text-slate-500">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items in this order */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Colis contenant ({searchedOrder.items.length} articles)</h3>
              {searchedOrder.items.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-400">Qté: {item.quantity} · {item.variantTitle || ''}</div>
                    </div>
                  </div>
                  <div className="font-black text-slate-900">{formatMoney(item.subtotal)}</div>
                </div>
              ))}
            </div>

            {/* Destination */}
            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 border border-slate-100">
              <div className="font-bold text-slate-900">Destination :</div>
              <div>{searchedOrder.shippingAddress.fullName} · {searchedOrder.shippingAddress.phone}</div>
              <div className="text-slate-500">{searchedOrder.shippingAddress.street}, {searchedOrder.shippingAddress.city}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-3xl space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Commande introuvable</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Veuillez vérifier l'orthographe du numéro de commande ou nous contacter par WhatsApp pour une vérification manuelle.
            </p>
          </div>
        )
      )}

    </div>
  );
};
