import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dataMiningService } from '../../services/dataMiningService';
import { clientMovementService, ClientSessionMovement } from '../../services/clientMovementService';
import { 
  BrainCircuit, 
  Users, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Target, 
  Package, 
  BarChart3, 
  Lightbulb, 
  MessageCircle,
  Phone,
  CheckCircle2,
  Clock,
  MapPin,
  Eye,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Search,
  RotateCcw,
  Smartphone,
  Laptop,
  Check,
  Send,
  Zap,
  Activity
} from 'lucide-react';

export const DataMiningView: React.FC = () => {
  const { formatMoney, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'abandoned_inputs' | 'purchased' | 'views_movements' | 'rfm_analytics'>('abandoned_inputs');
  
  // Real-time client movement sessions
  const [sessions, setSessions] = useState<ClientSessionMovement[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');

  useEffect(() => {
    // Subscribe to live client movements
    const unsubscribe = clientMovementService.subscribe((updatedSessions) => {
      setSessions(updatedSessions);
    });
    return () => unsubscribe();
  }, []);

  // Compute key data mining segments
  const rfmSegments = dataMiningService.computeRFMSegments();
  const coOccurrences = dataMiningService.computeProductCoOccurrences();
  const funnelData = dataMiningService.getFunnelData();

  // Metrics from Client Movement Service
  const abandonedInputLeads = sessions.filter(s => s.status === 'ABANDONED_INPUT');
  const purchasedSessions = sessions.filter(s => s.status === 'PURCHASED');
  const productViewSessions = sessions.filter(s => s.status === 'PRODUCT_VIEWED' || s.status === 'BROWSING');

  const totalLostRevenue = abandonedInputLeads.reduce((acc, s) => acc + (s.potentialRevenue || 0), 0);
  const totalConvertedRevenue = purchasedSessions.reduce((acc, s) => acc + (s.potentialRevenue || 0), 0);
  const recoveredCount = abandonedInputLeads.filter(s => s.isContacted).length;

  // Filtered Abandoned Leads
  const filteredAbandonedLeads = abandonedInputLeads.filter(lead => {
    const q = filterQuery.toLowerCase();
    const matchesQuery = 
      !q ||
      lead.capturedInputs.fullName.toLowerCase().includes(q) ||
      lead.capturedInputs.phone.toLowerCase().includes(q) ||
      lead.productName?.toLowerCase().includes(q) ||
      lead.capturedInputs.city.toLowerCase().includes(q);
    
    const matchesCity = selectedCityFilter === 'ALL' || lead.capturedInputs.city === selectedCityFilter || lead.ipCity === selectedCityFilter;
    return matchesQuery && matchesCity;
  });

  // Action: Convert Abandoned Lead into Order
  const handleConvertLead = (leadId: string) => {
    const success = clientMovementService.convertLeadToConfirmedOrder(leadId);
    if (success) {
      showToast('🎉 Lead converti avec succès en Commande Officielle !');
    }
  };

  // Action: Mark Lead as contacted
  const handleMarkContacted = (leadId: string) => {
    clientMovementService.markLeadContacted(leadId, 'Contacté via WhatsApp par le service commercial');
    showToast('Statut mis à jour : Client contacté');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Live Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">Data Mining & Mouvements Clients</h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Surveillance en direct des saisies formulaires sans achat, conversions et parcours prospects
              </p>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 text-xs">
          <button
            onClick={() => setActiveTab('abandoned_inputs')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'abandoned_inputs'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Inputs Sans Achat</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'abandoned_inputs' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {abandonedInputLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('purchased')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'purchased'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Achats Validés</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black">
              {purchasedSessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('views_movements')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'views_movements'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Consultations & Mouvements</span>
            <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black">
              {productViewSessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rfm_analytics')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'rfm_analytics'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>RFM & MBA Apriori</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Abandoned Inputs / Lost Leads */}
        <div className="bg-slate-800/80 border border-amber-500/30 rounded-3xl p-4.5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Inputs Sans Achat</span>
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md">
              À Relancer
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">{abandonedInputLeads.length}</div>
            <div className="text-xs font-bold text-amber-300">{formatMoney(totalLostRevenue)} potentiels</div>
          </div>
          <p className="text-[11px] text-slate-400">
            Prospects ayant tapé nom/tél sans valider le COD. Taux de récupération: <strong className="text-white">{Math.round((recoveredCount / (abandonedInputLeads.length || 1)) * 100)}%</strong>
          </p>
        </div>

        {/* Card 2: Validated Orders */}
        <div className="bg-slate-800/80 border border-emerald-500/30 rounded-3xl p-4.5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              <span>Achats Confirmés</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md">
              Converti
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">{purchasedSessions.length}</div>
            <div className="text-xs font-bold text-emerald-400">{formatMoney(totalConvertedRevenue)}</div>
          </div>
          <p className="text-[11px] text-slate-400">
            Commandes validées avec succès en Cash on Delivery (Casablanca, Rabat, etc.)
          </p>
        </div>

        {/* Card 3: Products Viewed */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Consultations Produits</span>
            </span>
            <span className="text-[10px] text-slate-400">Dernières 24h</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">{productViewSessions.length}</div>
            <div className="text-xs font-bold text-blue-300">
              {Math.round((purchasedSessions.length / (sessions.length || 1)) * 100)}% conversion
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Visiteurs ayant examiné une fiche produit, variateur de pack ou avis clients.
          </p>
        </div>

        {/* Card 4: Algorithmic Efficiency */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>Moteur de Mining</span>
            </span>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-md">
              Actif
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">x2.85</div>
            <div className="text-xs font-bold text-purple-300">Lift Co-occurrence</div>
          </div>
          <p className="text-[11px] text-slate-400">
            Recommandation intelligente de packs et bundles croisés sur fiches articles.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: 🚨 INPUTS SAISIS SANS ACHAT (LEADS CHAUDS PERDUS)   */}
      {/* ======================================================== */}
      {activeTab === 'abandoned_inputs' && (
        <div className="space-y-4">
          
          {/* Explanation Alert & Tools Bar */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-800/80 to-slate-900 border border-amber-500/30 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Mine d'Or Commerciale : Clients Ayant Tapé Leurs Coordonnées Sans Valider</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Ces visiteurs sont arrivés via vos publicités (TikTok / Meta), ont sélectionné un produit et ont <strong>commencé à renseigner leur prénom et numéro de téléphone</strong>, mais n'ont pas cliqué sur valider. Contactez-les immédiatement sur WhatsApp pour récupérer la commande !
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher nom, tel, produit..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-48 sm:w-60"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">Toutes les villes</option>
                <option value="Casablanca">Casablanca</option>
                <option value="Rabat">Rabat</option>
                <option value="Marrakech">Marrakech</option>
                <option value="Tanger">Tanger</option>
                <option value="Fès">Fès</option>
                <option value="Agadir">Agadir</option>
              </select>
            </div>
          </div>

          {/* Leads Grid / Cards */}
          {filteredAbandonedLeads.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Aucun formulaire abandonné détecté</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Tous les visiteurs ayant saisi leurs coordonnées ont soit validé leur commande, soit aucune saisie ne correspond aux filtres actuels.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredAbandonedLeads.map((lead) => {
                const waLink = clientMovementService.generateWhatsAppRecoveryLink(lead);
                const hasPhone = lead.capturedInputs.phone.trim().length >= 6;
                const cleanPhone = lead.capturedInputs.phone.replace(/[^0-9]/g, '');

                return (
                  <div
                    key={lead.id}
                    className={`bg-slate-800/90 border rounded-3xl p-5 transition-all space-y-4 hover:border-amber-500/50 ${
                      lead.isContacted 
                        ? 'border-slate-700/80 opacity-80' 
                        : 'border-amber-500/30 shadow-md ring-1 ring-amber-500/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Customer & Product Information */}
                      <div className="flex items-start gap-3.5">
                        {lead.productImage ? (
                          <img
                            src={lead.productImage}
                            alt={lead.productName || 'Article'}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-white text-sm">
                              {lead.capturedInputs.fullName || 'Prospect Anonyme (Coordonnées partielles)'}
                            </span>
                            
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-[10px] rounded-md border border-amber-500/30">
                              Formulaire Non Validé ⚠️
                            </span>

                            {lead.isContacted && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded-md border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Déjà Contacté
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                            {lead.productName && (
                              <span className="font-semibold text-white">
                                {lead.productName} {lead.selectedPack && lead.selectedPack > 1 ? `(Pack ${lead.selectedPack} pcs)` : ''}
                              </span>
                            )}
                            <span className="text-amber-400 font-black">
                              {formatMoney(lead.potentialRevenue || lead.productPrice || 0)}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {lead.capturedInputs.city || lead.ipCity} {lead.capturedInputs.address ? `(${lead.capturedInputs.address})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Source & Timestamp */}
                      <div className="text-left sm:text-right text-xs text-slate-400 space-y-1">
                        <div className="font-medium text-slate-300 flex sm:justify-end items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>{lead.referrerSource}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex sm:justify-end items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Dernière saisie : {new Date(lead.capturedInputs.lastInputAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                    </div>

                    {/* Captured Fields Bar & Instant Action Buttons */}
                    <div className="pt-3 border-t border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl">
                      
                      {/* Left: Raw Captured Contact Data */}
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Téléphone Saisi</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {lead.capturedInputs.phone || 'Non complété'}
                          </span>
                        </div>

                        <div className="border-l border-slate-800 pl-4">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Progression Saisie</span>
                          <span className="text-slate-200 font-bold">
                            {lead.capturedInputs.completedFieldsCount}/4 champs saisis
                          </span>
                        </div>

                        {lead.contactNotes && (
                          <div className="border-l border-slate-800 pl-4 text-slate-400 text-xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Note de relance</span>
                            <span className="text-slate-300 italic">{lead.contactNotes}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Instant Recovery Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 1-Click WhatsApp Recovery */}
                        {hasPhone && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleMarkContacted(lead.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                            title="Ouvrir WhatsApp avec message personnalisé pré-rempli"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
                            <span>Relancer sur WhatsApp</span>
                          </a>
                        )}

                        {/* Direct Phone Call */}
                        {hasPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={() => handleMarkContacted(lead.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700 cursor-pointer"
                            title="Appeler directement le client"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-400" />
                            <span>Appeler</span>
                          </a>
                        )}

                        {/* Convert to Confirmed Order */}
                        <button
                          onClick={() => handleConvertLead(lead.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
                          title="Créer directement la commande dans la base de données"
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950 text-amber-500" />
                          <span>Convertir en Commande</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: 🛒 ACHATS & CLIENTS CONVERTIS (BUY)               */}
      {/* ======================================================== */}
      {activeTab === 'purchased' && (
        <div className="space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Clients Ayant Mené à Bien Leur Commande (Conversions En Direct)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Historique des sessions où le visiteur a rempli le formulaire et confirmé son achat en Cash on Delivery (COD).
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-700/80">
                    <th className="py-3.5 px-4 font-bold">Client / Téléphone</th>
                    <th className="py-3.5 px-4 font-bold">Produit & Pack</th>
                    <th className="py-3.5 px-4 font-bold">Ville</th>
                    <th className="py-3.5 px-4 font-bold">Montant</th>
                    <th className="py-3.5 px-4 font-bold">Source Publicitaire</th>
                    <th className="py-3.5 px-4 font-bold">Heure Achat</th>
                    <th className="py-3.5 px-4 font-bold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {purchasedSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{s.capturedInputs.fullName || 'Client ShopMe'}</div>
                        <div className="text-[11px] font-mono text-emerald-400">{s.capturedInputs.phone || '06XXXXXXXX'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{s.productName || 'Article Boutique'}</div>
                        <div className="text-[10px] text-slate-400">
                          {s.selectedPack ? `Pack ${s.selectedPack} pièces` : 'Unité standard'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {s.capturedInputs.city || s.ipCity}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-400">
                        {formatMoney(s.potentialRevenue)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-900 rounded-md font-mono text-[11px]">
                          {s.referrerSource}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(s.lastActiveAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg text-[10px] inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Payé / COD Confirmé
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 👀 CONSULTATIONS & MOUVEMENTS (VIEW THE PRODUCT)  */}
      {/* ======================================================== */}
      {activeTab === 'views_movements' && (
        <div className="space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Journal des Consultations & Mouvements des Visiteurs</span>
            </h3>
            <p className="text-xs text-slate-400">
              Traçage des interactions : navigation sur le catalogue, sélection des variantes de produits et appareils utilisés (mobile vs ordinateur).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-slate-300">
                      {session.deviceType === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">
                        {session.productName || 'Consultation Boutique ShopMe'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{session.ipCity}</span>
                        <span>•</span>
                        <span>{session.referrerSource}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    session.status === 'PURCHASED' ? 'bg-emerald-500/20 text-emerald-300' :
                    session.status === 'ABANDONED_INPUT' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {session.status === 'PURCHASED' ? 'Achat Validé' :
                     session.status === 'ABANDONED_INPUT' ? 'Formulaire Non Validé' :
                     'Consultation'}
                  </span>
                </div>

                {/* Timeline micro-actions */}
                <div className="bg-slate-900/60 p-3 rounded-2xl space-y-1.5 text-[11px] border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timeline d'activité</div>
                  {session.timeline.slice(0, 3).map((tl, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-300">
                      <span className="font-medium">• {tl.action}</span>
                      <span className="text-slate-500 text-[10px]">{tl.details || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: 🧠 ANALYTIQUE RFM & MARKET BASKET (MBA APRIORI)   */}
      {/* ======================================================== */}
      {activeTab === 'rfm_analytics' && (
        <div className="space-y-6">
          
          {/* RFM Methodology */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Méthodologie RFM (Récence · Fréquence · Montant)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Les clients sont notés de 1 à 5 sur leur date de dernier achat (R), leur nombre de commandes (F) et leur montant dépensé cumulé (M). Cette matrice permet de cibler les campagnes marketing WhatsApp et fidélité sans spammer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rfmSegments.map(seg => (
              <div
                key={seg.segment}
                className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-xs hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm">{seg.segment}</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold text-[10px] rounded-md font-mono">
                      {seg.sharePercent}% des clients
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/80 text-center">
                    <div className="bg-slate-900/60 p-2 rounded-xl">
                      <div className="text-[10px] text-slate-400">Récence</div>
                      <div className="text-xs font-black text-white mt-0.5">{seg.avgRecencyDays}/5</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-xl">
                      <div className="text-[10px] text-slate-400">Fréquence</div>
                      <div className="text-xs font-black text-white mt-0.5">{seg.avgFrequency} cmd</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-xl">
                      <div className="text-[10px] text-slate-400">Dépense</div>
                      <div className="text-xs font-black text-emerald-400 mt-0.5">{formatMoney(seg.avgMonetary)}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    <span>Action Marketing Recommandée :</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">{seg.actionRecommendation}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Market Basket Analysis Table */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Règles d'Association Panier (Algorithme Apriori / Co-occurrence)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calcul du Support, de la Confiance et du Lift pour recommander automatiquement les produits complémentaires sur les fiches articles ShopMe.
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/80">
                    <th className="py-3 px-4 font-semibold">Produit Source (A)</th>
                    <th className="py-3 px-4 font-semibold">Produit Associé (B)</th>
                    <th className="py-3 px-4 font-semibold">Paniers Communs</th>
                    <th className="py-3 px-4 font-semibold">Support</th>
                    <th className="py-3 px-4 font-semibold">Confiance</th>
                    <th className="py-3 px-4 font-semibold">Lift Multiplicateur</th>
                    <th className="py-3 px-4 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {coOccurrences.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{item.productAName}</td>
                      <td className="py-3 px-4 font-bold text-purple-300">{item.productBName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white">{item.coOccurrenceCount} commandes</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{item.support}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{Math.round(item.confidence * 100)}%</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-md font-mono">
                          x{item.lift}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold text-[10px]">
                          ✓ Actif sur Storefront
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Analyse des Décrochages par Étape du Tunnel</h3>
              <p className="text-xs text-slate-400">Taux de rétention et points de fuite</p>
            </div>

            <div className="space-y-4">
              {funnelData.map((step, idx) => (
                <div key={idx} className="space-y-1.5 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{idx + 1}. {step.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-white">{step.users} visiteurs</span>
                      {idx > 0 && (
                        <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md">
                          Abandon : {step.dropoffRate}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((step.users / 4850) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
