import React, { useState } from 'react';
import { dbService } from '../../services/dbService';
import { useApp } from '../../context/AppContext';
import { Users, Search, Crown, Star, Phone, Mail } from 'lucide-react';

export const CustomersAdminView: React.FC = () => {
  const { formatMoney } = useApp();
  const [customers] = useState(dbService.customers);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">Gestion des Clients & Profils RFM</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Segmentation comportementale, historique de dépenses (LTV) et coordonnées
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email, tél..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-4 font-semibold">Client</th>
                <th className="py-3 px-4 font-semibold">Téléphone WhatsApp</th>
                <th className="py-3 px-4 font-semibold">Commandes</th>
                <th className="py-3 px-4 font-semibold">Total Dépensé (LTV)</th>
                <th className="py-3 px-4 font-semibold">Score RFM (R/F/M)</th>
                <th className="py-3 px-4 font-semibold">Segment Comportemental</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{c.firstName} {c.lastName}</div>
                    <div className="text-[10px] text-slate-400">{c.email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{c.phone}</td>
                  <td className="py-3 px-4 font-bold text-white">{c.ordersCount} commandes</td>
                  <td className="py-3 px-4 font-black text-emerald-400">{formatMoney(c.totalSpent)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    <span className="text-blue-400">{c.rfmRecencyScore}</span>/
                    <span className="text-purple-400">{c.rfmFrequencyScore}</span>/
                    <span className="text-amber-400">{c.rfmMonetaryScore}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 w-max ${
                      c.segmentLabel === 'Champions'
                        ? 'bg-amber-400/20 text-amber-300'
                        : c.segmentLabel === 'Loyal Customers'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {c.segmentLabel === 'Champions' && <Crown className="w-3 h-3 text-amber-400" />}
                      <span>{c.segmentLabel}</span>
                    </span>
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
