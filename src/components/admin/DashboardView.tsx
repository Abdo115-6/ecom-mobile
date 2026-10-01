import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dataMiningService } from '../../services/dataMiningService';
import { dbService } from '../../services/dbService';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Percent, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Star, 
  ArrowUpRight,
  ArrowRight,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { setCurrentView, formatMoney } = useApp();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('today');

  const kpis = dataMiningService.getDashboardKPIs();
  const funnel = dataMiningService.getFunnelData();
  const recentOrders = dbService.orders.slice(0, 5);


  // Sales timeline calculated strictly from real orders
  const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const salesTimeline = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysOfWeek[d.getDay()];
    const dayTotal = dbService.orders
      .filter(o => o.createdAt && o.createdAt.startsWith(dateStr))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return { day: dayName, amount: dayTotal };
  });
  const maxSale = Math.max(1, ...salesTimeline.map(s => s.amount));

  return (
    <div className="space-y-6">
      
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Tableau de Bord Exécutif</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Indicateurs clés de performance en temps réel, attribution marketing et ventes
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              timeRange === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              timeRange === '7days' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            7 derniers jours
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              timeRange === '30days' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            30 jours
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Section 16) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Today's Sales */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Chiffre d'Affaires</span>
            <span className="flex items-center text-emerald-400 font-bold text-[10px]">
              +{kpis.salesGrowthPercent}% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatMoney(kpis.todaySales)}
          </div>
          <div className="text-[11px] text-slate-400">Total encaissé aujourd'hui</div>
        </div>

        {/* Orders Today */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Commandes</span>
            <span className="flex items-center text-emerald-400 font-bold text-[10px]">
              +{kpis.ordersGrowthPercent}% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {kpis.ordersToday}
          </div>
          <div className="text-[11px] text-slate-400">{kpis.productsSoldToday} articles vendus</div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Taux de Conversion</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {kpis.conversionRatePercent}%
          </div>
          <div className="text-[11px] text-slate-400">Visiteur vers Achat</div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Panier Moyen (AOV)</span>
            <span className="text-blue-400 font-bold text-[10px]">Stable</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatMoney(kpis.averageOrderValue)}
          </div>
          <div className="text-[11px] text-slate-400">Par commande confirmée</div>
        </div>

      </div>

      {/* Operational Alerts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setCurrentView('admin-inventory')}
          className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Stock Faible</div>
              <div className="text-[10px] text-slate-400">Seuil critique atteint</div>
            </div>
          </div>
          <span className="text-sm font-black text-amber-400">{kpis.lowStockCount} articles</span>
        </div>

        <div
          onClick={() => setCurrentView('admin-orders')}
          className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-blue-500/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Commandes en Attente</div>
              <div className="text-[10px] text-slate-400">À préparer pour expédition</div>
            </div>
          </div>
          <span className="text-sm font-black text-blue-400">{kpis.pendingOrdersCount}</span>
        </div>

        <div
          onClick={() => setCurrentView('admin-reviews')}
          className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-purple-500/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Avis à Modérer</div>
              <div className="text-[10px] text-slate-400">En attente de validation</div>
            </div>
          </div>
          <span className="text-sm font-black text-purple-400">{kpis.pendingReviewsCount} avis</span>
        </div>
      </div>

      {/* Sales Timeline Bar Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Évolution des Ventes Hebdomadaires</h3>
              <p className="text-xs text-slate-400">Revenus générés par jour sur le storefront mobile</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              +24% vs semaine précédente
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {salesTimeline.map((item, idx) => {
              const heightPercent = Math.round((item.amount / maxSale) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    {item.amount} DH
                  </div>
                  <div
                    className="w-full bg-blue-600 rounded-t-lg group-hover:bg-blue-500 transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs text-slate-400 font-medium">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Entonnoir de Conversion</h3>
            <button
              onClick={() => setCurrentView('admin-datamining')}
              className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Détails</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {funnel.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 truncate font-medium">{step.stage}</span>
                  <span className="text-white font-bold">{step.users}</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.round((step.users / 4850) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Orders Preview */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <h3 className="text-sm font-bold text-white">Dernières Commandes Passées</h3>
          <button
            onClick={() => setCurrentView('admin-orders')}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Toutes les commandes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/80">
                <th className="pb-3 font-semibold">N° Commande</th>
                <th className="pb-3 font-semibold">Client</th>
                <th className="pb-3 font-semibold">Ville</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Canal UTM</th>
                <th className="pb-3 font-semibold">Statut</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-700/30">
                  <td className="py-3 font-bold text-white">{order.orderNumber}</td>
                  <td className="py-3 text-slate-300">{order.customerName}</td>
                  <td className="py-3 text-slate-400">{order.shippingAddress.city}</td>
                  <td className="py-3 font-black text-white">{formatMoney(order.totalAmount)}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md font-mono text-[10px]">
                      {order.utmSource || 'direct'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md font-bold text-[10px]">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setCurrentView('admin-orders')}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                    >
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
