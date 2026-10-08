import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { calculationService, CalculationService, CalculationProduct } from '../../services/calculationService';
import { 
  Calculator, 
  Plus, 
  Upload, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Layers, 
  Search, 
  Filter, 
  X, 
  Check, 
  Image as ImageIcon, 
  ArrowUpDown, 
  Info,
  Sparkles,
  ShoppingBag,
  Percent,
  Truck,
  Megaphone,
  Download
} from 'lucide-react';

export const CalculationAdminView: React.FC = () => {
  const { formatMoney, showToast } = useApp();
  const [products, setProducts] = useState<CalculationProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'profit-desc' | 'profit-asc' | 'margin-desc' | 'sell-desc' | 'buy-asc'>('profit-desc');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<CalculationProduct | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState<number | ''>(80);
  const [formSellPrice, setFormSellPrice] = useState<number | ''>(249);
  const [formShippingCost, setFormShippingCost] = useState<number | ''>(35);
  const [formAdCost, setFormAdCost] = useState<number | ''>(20);
  const [formEstimatedSales, setFormEstimatedSales] = useState<number | ''>(30);
  const [formImage, setFormImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Simulator Scale
  const [globalSalesMultiplier, setGlobalSalesMultiplier] = useState<number>(30);

  // Load products & categories
  useEffect(() => {
    const unsub = calculationService.subscribe((list) => {
      setProducts(list);
    });
    return () => unsub();
  }, []);

  const websiteCategories = useMemo(() => {
    const cats = dbService.categories || [];
    return cats.map(c => c.name);
  }, []);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
      }
      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      const metricsA = CalculationService.calculateMetrics(a);
      const metricsB = CalculationService.calculateMetrics(b);

      if (sortBy === 'profit-desc') return metricsB.netProfit - metricsA.netProfit;
      if (sortBy === 'profit-asc') return metricsA.netProfit - metricsB.netProfit;
      if (sortBy === 'margin-desc') return metricsB.netMarginPercent - metricsA.netMarginPercent;
      if (sortBy === 'sell-desc') return b.sellPrice - a.sellPrice;
      if (sortBy === 'buy-asc') return a.buyPrice - b.buyPrice;
      return 0;
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Global Metrics
  const globalSummary = useMemo(() => {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        avgBuyPrice: 0,
        avgSellPrice: 0,
        avgNetProfit: 0,
        avgMarginPercent: 0,
        totalPotentialMonthlyProfit: 0,
        bestProduct: null
      };
    }

    let sumBuy = 0;
    let sumSell = 0;
    let sumNetProfit = 0;
    let sumMarginPercent = 0;
    let sumMonthlyProfit = 0;
    let maxProfitProduct: { product: CalculationProduct; profit: number } | null = null;

    products.forEach(p => {
      const m = CalculationService.calculateMetrics(p);
      sumBuy += p.buyPrice;
      sumSell += p.sellPrice;
      sumNetProfit += m.netProfit;
      sumMarginPercent += m.netMarginPercent;
      sumMonthlyProfit += m.netProfit * globalSalesMultiplier;

      if (!maxProfitProduct || m.netProfit > maxProfitProduct.profit) {
        maxProfitProduct = { product: p, profit: m.netProfit };
      }
    });

    const count = products.length;
    return {
      totalProducts: count,
      avgBuyPrice: sumBuy / count,
      avgSellPrice: sumSell / count,
      avgNetProfit: sumNetProfit / count,
      avgMarginPercent: sumMarginPercent / count,
      totalPotentialMonthlyProfit: sumMonthlyProfit,
      bestProduct: maxProfitProduct ? (maxProfitProduct as any).product : null
    };
  }, [products, globalSalesMultiplier]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory(websiteCategories[0] || 'Général');
    setFormBuyPrice(80);
    setFormSellPrice(249);
    setFormShippingCost(35);
    setFormAdCost(20);
    setFormEstimatedSales(30);
    setFormImage('');
    setImagePreview('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (product: CalculationProduct) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormBuyPrice(product.buyPrice);
    setFormSellPrice(product.sellPrice);
    setFormShippingCost(product.shippingCost);
    setFormAdCost(product.adCost);
    setFormEstimatedSales(product.estimatedSales);
    setFormImage(product.image);
    setImagePreview(product.image);
    setFormNotes(product.notes || '');
    setIsModalOpen(true);
  };

  // Handle File Upload (PNG or JPG)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
      showToast('⚠️ Veuillez sélectionner un fichier image PNG ou JPG valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ Image trop lourde (maximum 5 Mo)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormImage(base64);
      setImagePreview(base64);
      showToast('✓ Photo PNG/JPG importée avec succès');
    };
    reader.readAsDataURL(file);
  };

  // Submit Product
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast('⚠️ Veuillez indiquer le nom du produit');
      return;
    }

    const buy = Number(formBuyPrice) || 0;
    const sell = Number(formSellPrice) || 0;

    if (sell <= 0) {
      showToast('⚠️ Le prix de vente doit être supérieur à 0');
      return;
    }

    const fallbackImg = imagePreview || formImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

    if (editingProduct) {
      calculationService.updateProduct(editingProduct.id, {
        name: formName.trim(),
        category: formCategory || 'Général',
        image: fallbackImg,
        buyPrice: buy,
        sellPrice: sell,
        shippingCost: Number(formShippingCost) || 0,
        adCost: Number(formAdCost) || 0,
        estimatedSales: Number(formEstimatedSales) || 30,
        notes: formNotes.trim()
      });
      showToast('✓ Produit de calcul mis à jour !');
    } else {
      calculationService.addProduct({
        name: formName.trim(),
        category: formCategory || 'Général',
        image: fallbackImg,
        buyPrice: buy,
        sellPrice: sell,
        shippingCost: Number(formShippingCost) || 0,
        adCost: Number(formAdCost) || 0,
        estimatedSales: Number(formEstimatedSales) || 30,
        notes: formNotes.trim()
      });
      showToast('✓ Nouveau produit ajouté au calcul de marge !');
    }

    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Supprimer le produit "${name}" du calcul de marge ?`)) {
      calculationService.deleteProduct(id);
      showToast('✓ Produit supprimé du calcul');
    }
  };

  // Live modal metrics calculation
  const currentModalMetrics = useMemo(() => {
    const buy = Number(formBuyPrice) || 0;
    const sell = Number(formSellPrice) || 0;
    const ship = Number(formShippingCost) || 0;
    const ad = Number(formAdCost) || 0;
    const sales = Number(formEstimatedSales) || 0;

    const gross = sell - buy;
    const net = sell - buy - ship - ad;
    const margin = sell > 0 ? (net / sell) * 100 : 0;
    const markup = buy > 0 ? sell / buy : 0;
    const monthly = net * sales;

    return {
      grossProfit: gross,
      netProfit: net,
      marginPercent: margin,
      markupMultiplier: markup,
      monthlyProfit: monthly
    };
  }, [formBuyPrice, formSellPrice, formShippingCost, formAdCost, formEstimatedSales]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Calculator className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Calcul de Marge & Rentabilité</span>
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  CALCULATION
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Analysez le coût d'achat réel, fixez vos prix de vente au Maroc et calculez instantanément votre <strong>bénéfice net</strong> par produit et par catégorie du site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Produit au Calcul</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
          
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
              <span>Produits Analysés</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {globalSummary.totalProducts}
            </div>
            <div className="text-[11px] text-slate-400">
              filtrables par catégorie
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bénéfice Net Moyen</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              +{globalSummary.avgNetProfit.toFixed(2)} DH
            </div>
            <div className="text-[11px] text-slate-400">
              après livraison & pub
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Marge Nette Moyenne</span>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {globalSummary.avgMarginPercent.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400">
              rentabilité catalogue
            </div>
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-4 space-y-1 bg-gradient-to-br from-emerald-950/30 to-slate-950/60">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulation Profit ({globalSalesMultiplier} v/p)</span>
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              +{globalSummary.totalPotentialMonthlyProfit.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH
            </div>
            <div className="text-[11px] text-emerald-400/80">
              potentiel mensuel net
            </div>
          </div>

        </div>
      </div>

      {/* Simulator Control Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Simulateur de Volume des Ventes</div>
            <div className="text-[11px] text-slate-400">Ajustez le nombre d'unités vendues pour simuler le bénéfice total</div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-300 whitespace-nowrap">Volume de vente :</span>
          <div className="flex items-center gap-2">
            {[10, 30, 50, 100].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setGlobalSalesMultiplier(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  globalSalesMultiplier === val 
                    ? 'bg-emerald-500 text-slate-950 shadow-md' 
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {val} ventes
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters & Category Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom de produit..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="profit-desc">Bénéfice le plus élevé (DH)</option>
              <option value="profit-asc">Bénéfice le plus faible (DH)</option>
              <option value="margin-desc">Marge la plus élevée (%)</option>
              <option value="sell-desc">Prix de vente décroissant</option>
              <option value="buy-asc">Prix d'achat croissant</option>
            </select>
          </div>
        </div>

        {/* Category Pills (Website categories filter) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-emerald-400" />
            <span>Filtrer par Catégorie du Site Web :</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Toutes les catégories ({products.length})
            </button>
            {websiteCategories.map(cat => {
              const count = products.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    selectedCategory === cat ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Calculation Grid / Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Tableau des Marges & Bénéfices ({filteredProducts.length} produits)
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Devise : <strong className="text-white">Dirham Marocain (DH)</strong>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Calculator className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Aucun produit trouvé</h3>
              <p className="text-xs text-slate-400">Ajoutez votre premier produit pour calculer votre rentabilité</p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 cursor-pointer"
            >
              + Ajouter un produit maintenant
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4 font-bold">Produit (Photo & Nom)</th>
                  <th className="py-3.5 px-4 font-bold">Catégorie</th>
                  <th className="py-3.5 px-4 font-bold text-right">Prix d'Achat (DH)</th>
                  <th className="py-3.5 px-4 font-bold text-right">Prix de Vente (DH)</th>
                  <th className="py-3.5 px-4 font-bold text-right">Frais (Liv.+Pub)</th>
                  <th className="py-3.5 px-4 font-bold text-right text-emerald-400">Bénéfice Net / Vente</th>
                  <th className="py-3.5 px-4 font-bold text-center">Marge %</th>
                  <th className="py-3.5 px-4 font-bold text-right">Profit Est. ({globalSalesMultiplier} v.)</th>
                  <th className="py-3.5 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredProducts.map(product => {
                  const metrics = CalculationService.calculateMetrics(product);
                  const isVeryProfitable = metrics.netMarginPercent >= 40;
                  const isProfitable = metrics.netMarginPercent >= 20 && metrics.netMarginPercent < 40;
                  const isLowMargin = metrics.netMarginPercent > 0 && metrics.netMarginPercent < 20;
                  const isLoss = metrics.netProfit <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-900/50 transition-colors">
                      
                      {/* Product with Photo PNG/JPG */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative group">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{product.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {product.id.slice(0, 10)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700/50">
                          {product.category}
                        </span>
                      </td>

                      {/* Buy Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-300">
                        {product.buyPrice.toFixed(2)} DH
                      </td>

                      {/* Sell Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {product.sellPrice.toFixed(2)} DH
                      </td>

                      {/* Expenses */}
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {(product.shippingCost + product.adCost).toFixed(2)} DH
                        <div className="text-[9px] text-slate-600">
                          liv: {product.shippingCost} | pub: {product.adCost}
                        </div>
                      </td>

                      {/* Net Profit per Unit */}
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-mono font-black text-sm ${
                          isLoss ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {metrics.netProfit > 0 ? `+${metrics.netProfit.toFixed(2)}` : metrics.netProfit.toFixed(2)} DH
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Brut: +{metrics.grossProfit.toFixed(2)} DH
                        </div>
                      </td>

                      {/* Margin % Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black font-mono border ${
                          isVeryProfitable ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          isProfitable ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                          isLowMargin ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {metrics.netMarginPercent > 0 ? `+${metrics.netMarginPercent}%` : `${metrics.netMarginPercent}%`}
                        </span>
                      </td>

                      {/* Estimated Profit for Multiplier */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-white text-xs">
                          +{(metrics.netProfit * globalSalesMultiplier).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH
                        </div>
                        <div className="text-[10px] text-slate-500">
                          sur {globalSalesMultiplier} ventes
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Modifier ce produit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer ce produit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Add / Edit Modal with PNG/JPG Upload and Live Calculation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingProduct ? 'Modifier le Produit de Calcul' : 'Ajouter un Produit pour Calculer la Marge'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Importez la photo (PNG/JPG), renseignez vos prix d'achat et de vente
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProduct} className="space-y-5">
              
              {/* Product Photo Upload Section (PNG/JPG) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Photo du Produit (PNG ou JPG) <span className="text-emerald-400">*</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {imagePreview ? (
                      <>
                        <img 
                          src={imagePreview} 
                          alt="Prévisualisation" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setFormImage('');
                          }}
                          className="absolute inset-0 bg-slate-950/70 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-500">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                        <span className="text-[10px] block">PNG / JPG</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Téléverser une image PNG / JPG depuis votre appareil</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Ou collez une URL d'image :</span>
                      <input
                        type="url"
                        value={formImage.startsWith('data:') ? '' : formImage}
                        onChange={(e) => {
                          setFormImage(e.target.value);
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Nom du Produit <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Écouteurs Sans Fil Pro 5..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Catégorie sur le Site Web <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {websiteCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Autre">Autre catégorie</option>
                  </select>
                </div>
              </div>

              {/* Buy Price & Sell Price (The Core Feature) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <span>Prix d'Achat (ce que vous payez) :</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formBuyPrice}
                      onChange={(e) => setFormBuyPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-rose-500/30 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-400"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Coût d'achat unitaire fournisseur</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>Prix de Vente (sur le site) :</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formSellPrice}
                      onChange={(e) => setFormSellPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Prix affiché au client marocain</span>
                </div>
              </div>

              {/* Additional Operating Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Frais de Livraison COD estimés (DH) :</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formShippingCost}
                      onChange={(e) => setFormShippingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="35"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-purple-400" />
                    <span>Coût Pub / Acquisition estimé (CPA DH) :</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formAdCost}
                      onChange={(e) => setFormAdCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="20"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span>
                  </div>
                </div>
              </div>

              {/* LIVE PROFIT CALCULATION RESULT BOX */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/60 to-slate-950 rounded-2xl border border-emerald-500/40 space-y-3">
                <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Résultat du Calcul Instantané :</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Bénéfice Net :</span>
                    <span className={`text-base font-black font-mono ${
                      currentModalMetrics.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {currentModalMetrics.netProfit > 0 ? `+${currentModalMetrics.netProfit.toFixed(2)}` : currentModalMetrics.netProfit.toFixed(2)} DH
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Marge Nette :</span>
                    <span className={`text-base font-black font-mono ${
                      currentModalMetrics.marginPercent >= 30 ? 'text-emerald-400' :
                      currentModalMetrics.marginPercent >= 15 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {currentModalMetrics.marginPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Multiplicateur :</span>
                    <span className="text-base font-black font-mono text-purple-300">
                      x{currentModalMetrics.markupMultiplier.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-900/40 p-2 rounded-lg flex items-center justify-between">
                  <span>Simulation pour <strong>30 ventes</strong> par mois :</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    +{(currentModalMetrics.netProfit * 30).toLocaleString('fr-FR')} DH Net
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Enregistrer les modifications' : 'Ajouter au Calcul de Marge'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
