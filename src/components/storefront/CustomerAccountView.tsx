import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { 
  User, 
  Package, 
  MapPin, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  LogOut, 
  Truck, 
  Clock 
} from 'lucide-react';

export const CustomerAccountView: React.FC = () => {
  const { setCurrentView, formatMoney, t } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'reviews'>('orders');

  const customer = dbService.customers[0]; // Active demo customer
  const orders = dbService.orders;
  const reviews = dbService.reviews.filter(r => r.customerId === customer.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24">
      
      {/* Account Profile Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-lg">
            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-xl sm:text-2xl font-black">{customer.firstName} {customer.lastName}</h1>
              <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 font-bold rounded-full text-[10px]">
                {customer.segmentLabel} 👑
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{customer.email} · {customer.phone}</p>
            <div className="text-[11px] text-slate-300 mt-2 flex items-center gap-3">
              <span>{customer.ordersCount} commandes passées</span>
              <span>·</span>
              <span>{formatMoney(customer.totalSpent)} dépensés</span>
            </div>
          </div>
        </div>

        {/* Admin Back Office Quick Launch */}
        <button
          onClick={() => setCurrentView('admin-dashboard')}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-white/10 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Accès Back Office</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Historique des commandes ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'addresses'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Adresses de livraison</span>
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Mes avis déposés ({reviews.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-black text-slate-900">{order.orderNumber}</div>
                  <div className="text-[10px] text-slate-400">
                    Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs">
                    {order.status}
                  </span>
                  <div className="text-sm font-black text-slate-900">
                    {formatMoney(order.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">Qté: {item.quantity} · {item.variantTitle || ''}</div>
                      </div>
                    </div>
                    <span className="font-semibold text-slate-700">{formatMoney(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Footer actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Livreur : <strong className="text-slate-700">{order.shipment.carrier}</strong>
                </span>
                <button
                  onClick={() => setCurrentView('track-order')}
                  className="flex items-center gap-1 text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Détail du suivi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Adresse Principale (Domicile)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                Par défaut
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-0.5">
              <div>Karim Benjelloun</div>
              <div>14 Boulevard d'Anfa, Étage 3, Appt 12</div>
              <div>20000 Casablanca, Maroc</div>
              <div className="text-slate-400 mt-1">Tél : +212 661 234567</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Vous n'avez pas encore publié d'avis client.
            </div>
          ) : (
            reviews.map(rev => (
              <div key={rev.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900">{rev.productName}</div>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-800">{rev.title}</div>
                <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                <div className="text-[10px] text-emerald-600 font-semibold">Statut : {rev.status}</div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
