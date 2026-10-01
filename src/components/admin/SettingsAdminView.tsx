import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { 
  Settings, 
  Save, 
  Check, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

export const SettingsAdminView: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const currentSettings = dbService.settings;

  const [storeName, setStoreName] = useState(currentSettings.storeName);
  const [defaultCurrency, setDefaultCurrency] = useState(currentSettings.defaultCurrency);
  const [publicDomain, setPublicDomain] = useState(currentSettings.publicDomain || '');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(currentSettings.freeShippingThreshold);
  const [standardShippingFee, setStandardShippingFee] = useState(currentSettings.standardShippingFee);
  const [isFreeShippingPromoActive, setIsFreeShippingPromoActive] = useState(
    currentSettings.isFreeShippingPromoActive || false
  );
  
  // Custom City Shipping Rates
  const defaultCityRates: Record<string, number> = {
    'Casablanca': 20.00,
    'Rabat': 25.00,
    'Marrakech': 30.00,
    'Tanger': 35.00,
    'Fès': 30.00,
    'Agadir': 35.00,
    'Oujda': 40.00,
    'Meknès': 30.00,
    'Tétouan': 35.00,
    'Autre ville': 35.00
  };

  const [cityShippingRates, setCityShippingRates] = useState<Record<string, number>>(
    currentSettings.cityShippingRates || defaultCityRates
  );

  const [metaPixelId, setMetaPixelId] = useState(currentSettings.metaPixelId);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(currentSettings.googleAnalyticsId);
  const [tiktokPixelId, setTiktokPixelId] = useState(currentSettings.tiktokPixelId);

  const handleCityRateChange = (cityName: string, value: number) => {
    setCityShippingRates(prev => ({
      ...prev,
      [cityName]: Math.max(0, value)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateSettings({
      storeName,
      defaultCurrency,
      publicDomain: publicDomain.trim() || undefined,
      freeShippingThreshold: Number(freeShippingThreshold),
      standardShippingFee: Number(standardShippingFee),
      isFreeShippingPromoActive,
      cityShippingRates,
      metaPixelId,
      googleAnalyticsId,
      tiktokPixelId
    }, currentUser);
    showToast("Paramètres et frais de livraison enregistrés avec succès !");
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl sm:text-2xl font-black text-white">Paramètres Généraux & Frais de Livraison</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Contrôle des tarifs de livraison par ville, promotion livraison gratuite, devises et pixels
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-6">
        
        {/* Section 1: Store Basics */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Identité & Devise de Référence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nom de la Boutique</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Devise Principale</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value as any)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none cursor-pointer font-bold"
              >
                <option value="MAD">MAD - Dirham Marocain (DH)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="USD">USD - Dollar US ($)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Domaine Public Déployé (Railway / Nom de domaine personnalisé)
              </label>
              <input
                type="text"
                value={publicDomain}
                onChange={(e) => setPublicDomain(e.target.value)}
                placeholder="Ex: https://mon-app.up.railway.app ou https://shopme.ma"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder:text-slate-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Optionnel : laissez vide pour utiliser automatiquement l'URL de votre déploiement Railway actuel ({typeof window !== 'undefined' ? window.location.origin : 'https://...'})
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Logistics & Delivery Fees Control */}
        <div className="space-y-4 border-t border-slate-700/80 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>2. Contrôle des Frais de Livraison (Maroc)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gérez les frais appliqués au client lors de sa commande Cash on Delivery (COD)
              </p>
            </div>

            {/* Quick Free Shipping Promo Toggle */}
            <div 
              onClick={() => setIsFreeShippingPromoActive(!isFreeShippingPromoActive)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                isFreeShippingPromoActive 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {isFreeShippingPromoActive ? (
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-500" />
              )}
              <span className="text-xs font-black">
                {isFreeShippingPromoActive ? 'Promo Livraison 100% Gratuite Active' : 'Tarifs par Ville Actifs'}
              </span>
            </div>
          </div>

          {/* Global Rule Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Frais Standard par Défaut (DH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={standardShippingFee}
                  onChange={(e) => setStandardShippingFee(Number(e.target.value))}
                  disabled={isFreeShippingPromoActive}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold disabled:opacity-50"
                />
                <span className="text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 font-bold">DH</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Frais appliqués lorsqu'aucun tarif spécifique n'est défini pour une ville.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Seuil de Gratuité Automatique (DH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                  disabled={isFreeShippingPromoActive}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold disabled:opacity-50"
                />
                <span className="text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 font-bold">DH</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                La livraison devient automatiquement offerte au-delà de ce montant de panier.
              </span>
            </div>
          </div>

          {/* Custom City Rates Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Grille Tarifaire Personnalisée par Ville Marocaine (MAD / DH) :</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isFreeShippingPromoActive ? '(Ignorée car la promotion gratuite est activée)' : 'Appliquée dynamiquement au client'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(cityShippingRates).map(([city, rate]) => (
                <div 
                  key={city}
                  className={`bg-slate-900/80 p-3 rounded-2xl border space-y-1.5 ${
                    isFreeShippingPromoActive ? 'border-slate-800 opacity-60' : 'border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{city}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">MAD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={rate}
                      onChange={(e) => handleCityRateChange(city, Number(e.target.value))}
                      disabled={isFreeShippingPromoActive}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 text-right pr-7 disabled:opacity-50 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[11px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 font-bold">DH</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Section 3: Tracking Pixels */}
        <div className="space-y-3 border-t border-slate-700/80 pt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Identifiants Marketing Pixels & CAPI</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Meta Pixel ID</label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Google Analytics (GA4) ID</label>
              <input
                type="text"
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">TikTok Pixel ID</label>
              <input
                type="text"
                value={tiktokPixelId}
                onChange={(e) => setTiktokPixelId(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Tarifs & Paramètres</span>
          </button>

          <span className="text-[11px] text-slate-400">
            Les modifications prennent effet immédiatement sur la boutique et dans les commandes.
          </span>
        </div>

      </form>

    </div>
  );
};
