import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Coupon, Banner, HomepageSection } from '../../types/ecommerce';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Layers, 
  Sparkles, 
  Check, 
  X, 
  MoveUp, 
  MoveDown, 
  Image as ImageIcon 
} from 'lucide-react';

export const MarketingAdminView: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const [coupons, setCoupons] = useState<Coupon[]>(dbService.coupons);
  const [sections, setSections] = useState<HomepageSection[]>(dbService.homepageSections);
  const [banners, setBanners] = useState<Banner[]>(dbService.banners);

  // New Coupon Form
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<Coupon['discountType']>('PERCENTAGE');
  const [newValue, setNewValue] = useState<number>(10);
  const [newMinSpend, setNewMinSpend] = useState<number>(200);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const coupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      discountType: newType,
      discountValue: Number(newValue),
      minCartValue: Number(newMinSpend),
      usageCount: 0,
      isActive: true
    };

    dbService.coupons.unshift(coupon);
    setCoupons([...dbService.coupons]);
    setNewCode('');
    showToast(`Code promo "${coupon.code}" créé avec succès !`);
  };

  const handleToggleCoupon = (id: string) => {
    const target = dbService.coupons.find(c => c.id === id);
    if (target) {
      target.isActive = !target.isActive;
      setCoupons([...dbService.coupons]);
      showToast(`Statut coupon ${target.code} mis à jour`);
    }
  };

  const handleToggleSection = (id: string) => {
    const s = dbService.homepageSections.find(sec => sec.id === id);
    if (s) {
      s.isActive = !s.isActive;
      setSections([...dbService.homepageSections]);
      showToast(`Section "${s.title}" ${s.isActive ? 'activée' : 'masquée'}`);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white">Marketing, Promotions & CMS Page d'Accueil</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Gestion des codes promos, bannières programmées et blocs modulaires de la page d'accueil
        </p>
      </div>

      {/* Part 1: Coupons Engine */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Moteur de Coupons & Réductions</h2>
          </div>
          <span className="text-xs text-slate-400">{coupons.length} coupons actifs</span>
        </div>

        {/* Create Coupon Input */}
        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Code Promo *</label>
            <input
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Ex: AUTUMN20"
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase font-bold"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Type de Réduction</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
            >
              <option value="PERCENTAGE">Pourcentage (%)</option>
              <option value="FIXED_AMOUNT">Montant Fixe (DH)</option>
              <option value="FREE_SHIPPING">Livraison Gratuite</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Valeur Remise</label>
            <input
              type="number"
              required
              value={newValue}
              onChange={(e) => setNewValue(Number(e.target.value))}
              placeholder="10"
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Panier Min (DH)</label>
            <input
              type="number"
              value={newMinSpend}
              onChange={(e) => setNewMinSpend(Number(e.target.value))}
              placeholder="200"
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-md"
            >
              Créer Coupon
            </button>
          </div>
        </form>

        {/* Coupons Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/80">
                <th className="py-2.5 font-semibold">Code Promo</th>
                <th className="py-2.5 font-semibold">Type</th>
                <th className="py-2.5 font-semibold">Valeur</th>
                <th className="py-2.5 font-semibold">Panier Min</th>
                <th className="py-2.5 font-semibold">Utilisations</th>
                <th className="py-2.5 font-semibold">Statut</th>
                <th className="py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {coupons.map(c => (
                <tr key={c.id}>
                  <td className="py-2.5 font-black text-amber-400 font-mono text-sm">{c.code}</td>
                  <td className="py-2.5 text-slate-300">{c.discountType}</td>
                  <td className="py-2.5 font-bold text-white">
                    {c.discountType === 'PERCENTAGE' ? `-${c.discountValue}%` : c.discountType === 'FIXED_AMOUNT' ? `-${c.discountValue} DH` : 'Gratuit'}
                  </td>
                  <td className="py-2.5 text-slate-400">{c.minCartValue} DH</td>
                  <td className="py-2.5 font-mono text-slate-300">{c.usageCount} fois</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      c.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {c.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleToggleCoupon(c.id)}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {c.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 2: Homepage Modular CMS */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
          <Layers className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Gestionnaire Modulaire de la Homepage (Sans Code)</h2>
            <p className="text-xs text-slate-400">Activez ou désactivez les sections présentées aux visiteurs mobiles</p>
          </div>
        </div>

        <div className="space-y-2">
          {sections.map(sec => (
            <div
              key={sec.id}
              className="p-3.5 bg-slate-900/60 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center font-mono text-[11px]">
                  {sec.displayOrder}
                </span>
                <div>
                  <div className="font-bold text-white">{sec.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Type : {sec.sectionType}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  sec.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {sec.isActive ? 'Visible sur la boutique' : 'Masqué'}
                </span>
                <button
                  onClick={() => handleToggleSection(sec.id)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {sec.isActive ? 'Masquer' : 'Activer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
