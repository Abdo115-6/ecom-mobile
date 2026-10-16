import React from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { whatsappService } from '../../services/whatsappService';
import heroBg from '../../assets/images/shopme_morocco_hero_1791579209702.jpg';
import { 
  ArrowRight, 
  ShoppingBag, 
  Heart, 
  Star,
  MessageCircle,
  Sparkles,
  Flame,
  Gift,
  Truck,
  ShieldCheck,
  Tag,
  ChevronRight
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const { 
    navigateToProduct, 
    setCurrentView, 
    selectedCategorySlug,
    setSelectedCategorySlug, 
    addToCart, 
    toggleWishlist, 
    isWishlisted, 
    formatMoney, 
    products: allStoreProducts,
    isAdminAuthenticated,
    t 
  } = useApp();

  const categories = dbService.categories;
  const allPublished = allStoreProducts.filter(p => p.status === 'PUBLISHED');

  const selectedCat = categories.find(c => c.slug === selectedCategorySlug);
  const products = selectedCategorySlug
    ? allPublished.filter(p => {
        const subCatIds = selectedCat?.subcategories?.map(s => s.id) || [];
        return p.categoryId === selectedCat?.id || subCatIds.includes(p.categoryId);
      })
    : allPublished;

  // Filtered lists for dedicated sections
  const promoProducts = allPublished.filter(p => (p.compareAtPrice && p.compareAtPrice > p.price) || (p.promoPacks && p.promoPacks.length > 1));
  const hommesProducts = allPublished.filter(p => p.categoryId === 'cat-hommes');
  const femmesProducts = allPublished.filter(p => p.categoryId === 'cat-femmes');
  const digitalProducts = allPublished.filter(p => p.categoryId === 'cat-digital' || p.productKind === 'DIGITAL');

  return (
    <div className="space-y-8 sm:space-y-12 pb-24 overflow-x-hidden">
      
      {/* 1. HERO BANNER (ShopMe Casablanca & Livraison Partout au Maroc with WhatsApp Button) */}
      <section className="relative overflow-hidden w-full aspect-16/9 sm:aspect-21/9 max-h-[540px] bg-slate-900 flex items-center justify-center shadow-xs">
        <img
          src={heroBg}
          alt="ShopMe Maroc - Casablanca et partout au Maroc"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none" />

        {/* Hero Interactive Content & WhatsApp CTA */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8 md:p-12 text-white max-w-4xl">
          <div className="space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/90 backdrop-blur-xs text-slate-950 font-black rounded-full text-[10px] sm:text-xs uppercase tracking-wider shadow-md w-fit">
              <Truck className="w-3.5 h-3.5" />
              <span>LIVRAISON PARTOUT AU MAROC · الدفع عند الاستلام</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
              BOUTIQUE OFFICIELLE SHOPME
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-xl line-clamp-2 drop-shadow-sm">
              Mode Homme & Femme, High-Tech & Gadgets, Abonnements Digitaux Officiels avec paiement sécurisé à la livraison partout au Maroc.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* WhatsApp Hero Order Button */}
              <a
                href={whatsappService.generateSupportLink('Salam ShopMe Maroc ! Je souhaite passer une commande ou découvrir les promos disponibles.')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>COMMANDER SUR WHATSAPP (طلب عبر الواتساب)</span>
              </a>

              {/* Browse Promos & Packs */}
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border border-white/30"
              >
                <span>Voir les Offres & Packs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INFINITE MOVING WORDS (User Request: "the words moving abonnment accounts technlogy china usa morocco") */}
      <section className="w-full bg-slate-950 text-white py-3 border-y border-slate-800 overflow-hidden relative shadow-inner">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-[11px] sm:text-xs font-black tracking-widest uppercase">
          {/* Exact keywords from User: abonnment accounts technlogy china usa morocco */}
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">ABONNEMENT</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">ACCOUNTS</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/50">TECHNOLOGY</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/50">CHINA 🇨🇳</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/50">USA 🇺🇸</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">MOROCCO 🇲🇦</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-amber-300 font-extrabold">LIVRAISON PARTOUT AU MAROC</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-white">PAIEMENT CASH À LA LIVRAISON (COD)</span>
          </span>

          {/* Seamless duplicate loop for continuous scrolling */}
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">ABONNEMENT</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">ACCOUNTS</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/50">TECHNOLOGY</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/50">CHINA 🇨🇳</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/50">USA 🇺🇸</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">MOROCCO 🇲🇦</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-amber-300 font-extrabold">LIVRAISON PARTOUT AU MAROC</span>
          </span>
          <span className="flex items-center gap-2.5 text-amber-400">
            <span>✦</span>
            <span className="text-white">PAIEMENT CASH À LA LIVRAISON (COD)</span>
          </span>
        </div>
      </section>

      {/* 3. PROMO DE LA SEMAINE (User Request: "and product in promo") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                <Flame className="w-3 h-3 fill-white" />
                Offres Spéciales Limitées
              </span>
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                Stocks limités à Casablanca
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              PROMO DE LA SEMAINE
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Voir toutes les offres</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual Promotional Banners (Inspiration from Image 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Promo Card 1: 1+1=3 */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/70 border border-amber-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider shadow-xs">
                Pack Promo ShopMe
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                1 + 1 = 3 <br />
                <span className="text-rose-600">CHRI 2 PRODUITS, TALT FABOUR !</span>
              </h3>
              <p className="text-xs text-slate-700 font-medium max-w-sm">
                Commandez 2 articles de la même collection et recevez le 3ème article offert avec livraison express partout au Maroc.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <span>Profiter de l'offre</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-widest bg-amber-200/60 px-2.5 py-1 rounded-md">
                Livraison Gratuite
              </span>
            </div>
          </div>

          {/* Promo Card 2: Vente Flash */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between shadow-xs border border-slate-800">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-rose-600 text-white font-black rounded-lg text-xs uppercase tracking-wider shadow-xs">
                Vente Flash 24H-48H
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                JUSQU'À -45% DE REMISE <br />
                <span className="text-emerald-400">SUR UNE SÉLECTION LUXE & TECH</span>
              </h3>
              <p className="text-xs text-slate-300 font-medium max-w-sm">
                Montres élégantes, chargeurs rapides, accessoires et comptes digitaux avec paiement en cash après contrôle du colis.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <span>Découvrir la sélection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-400">
                Stock limité à Casablanca
              </span>
            </div>
          </div>
        </div>

        {/* Promo Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-2">
          {promoProducts.slice(0, 4).map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all relative"
            >
              {/* Photo & Discounts */}
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                  src={product.images[0]?.imageUrl}
                  alt={product.name}
                  onClick={() => navigateToProduct(product.slug)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                />

                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg tracking-wider shadow-xs flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-white" />
                    <span>-{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%</span>
                  </div>
                )}

                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Favoris"
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-500 transition-colors shadow-xs cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    {product.brand}
                  </div>
                  <h3
                    onClick={() => navigateToProduct(product.slug)}
                    className="font-bold text-xs sm:text-sm text-slate-950 group-hover:text-slate-700 transition-colors line-clamp-2 mt-0.5 cursor-pointer leading-snug"
                  >
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[11px] text-slate-800">{product.rating}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-sm sm:text-base text-slate-950">
                      {formatMoney(product.price)}
                    </div>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <div className="text-[11px] text-slate-400 line-through">
                        {formatMoney(product.compareAtPrice)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="p-2 sm:p-2.5 bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                    title={t.addToCart}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. NOS PACKS (User Request: "and under it packs") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Economie & Cadeaux
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              NOS PACKS AVANTAGEUX
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Commandez en pack et bénéficiez de prix dégressifs et de la livraison gratuite
            </p>
          </div>
        </div>

        {/* Pack Cards (Inspiration from Image 2: "NOS PACKS: HOMMES / FEMMES") */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Pack 1: Découverte 1 Pièce */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-400 transition-colors space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Essai & Découverte
                </span>
                <h3 className="text-lg font-black text-slate-950">Pack 1 Pièce</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Achat individuel sous boîte simple protectrice. Idéal pour tester nos produits et profiter de la qualité ShopMe.
              </p>
              <div className="text-xs font-bold text-slate-800 space-y-1 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Prix standard unitaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Paiement cash à la livraison</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCurrentView('catalog')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Détails</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <a
                href={whatsappService.generateSupportLink('Salam ShopMe Maroc, je souhaite commander le Pack 1 Pièce.')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-emerald-200"
                title="Commander Pack 1 sur WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Pack 2: Économique 2 Pièces (Best Seller) */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-white rounded-3xl border-2 border-emerald-500 p-6 flex flex-col justify-between shadow-md relative space-y-4">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs">
              LE PLUS POPULAIRE 🔥
            </span>
            <div className="space-y-3 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">
                  Meilleur Rapport Qualité / Prix
                </span>
                <h3 className="text-lg font-black text-slate-950">Pack 2 Pièces (Duo)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Remise immédiate sur le 2ème article + <strong>LIVRAISON GRATUITE OFFERTE</strong> partout au Maroc !
              </p>
              <div className="text-xs font-bold text-slate-800 space-y-1 pt-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <span>✓</span>
                  <span>Livraison 0 DH Gratuite</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Économie moyenne de 60 DH à 100 DH</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <a
                href={whatsappService.generateSupportLink('Salam ShopMe Maroc ! Je souhaite commander le Pack 2 Pièces (Duo) avec Livraison Gratuite Offerte partout au Maroc.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>COMMANDER PACK DUO SUR WHATSAPP</span>
              </a>
              <button
                onClick={() => setCurrentView('catalog')}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Voir les articles éligibles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pack 3: Coffret Cadeau Luxe 3 Pièces */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-400 transition-colors space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                  Prestige & Cadeaux
                </span>
                <h3 className="text-lg font-black text-slate-950">Pack 3 Pièces (Coffret)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Livré avec coffret de présentation de luxe, garantie étendue et prix unitaire le plus bas de la boutique.
              </p>
              <div className="text-xs font-bold text-slate-800 space-y-1 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Coffret cadeau inclus</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <span>✓</span>
                  <span>Livraison Gratuite Prioritaire</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCurrentView('catalog')}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Voir Coffrets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <a
                href={whatsappService.generateSupportLink('Salam ShopMe Maroc, je souhaite commander le Pack 3 Pièces Coffret Cadeau Luxe.')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-emerald-200"
                title="Commander Coffret Luxe sur WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 5. COLLECTION HOMMES (User Request: "and under it category homme femme") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Univers Masculin
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              COLLECTION HOMMES
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Montres chronographes, gadgets auto high-tech, ceintures et maroquinerie
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug('hommes');
              setCurrentView('catalog');
            }}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>Toute la collection Hommes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual Category Sub-Cards (Inspiration from Image 2: "BOITE SIMPLE / AVEC COFFRET") */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <div
            onClick={() => {
              setSelectedCategorySlug('hommes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
              alt="Montres Hommes"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                Boîte Simple & Coffret
              </span>
              <h4 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>MONTRES LUXE</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h4>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedCategorySlug('hommes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
              alt="High-Tech & Auto"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold block">
                Accessoires 5-en-1
              </span>
              <h4 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>HIGH-TECH AUTO</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h4>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedCategorySlug('hommes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm col-span-2 sm:col-span-1"
          >
            <img
              src="https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80"
              alt="Ceintures & Maroquinerie"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">
                Cuir & Anti-RFID
              </span>
              <h4 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>CEINTURES & CUIR</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h4>
            </div>
          </div>
        </div>

        {/* Featured Hommes Products */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 pt-2">
          {hommesProducts.slice(0, 3).map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                  src={product.images[0]?.imageUrl}
                  alt={product.name}
                  onClick={() => navigateToProduct(product.slug)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                />
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Favoris"
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-500 transition-colors shadow-xs cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => navigateToProduct(product.slug)}
                    className="font-bold text-xs sm:text-sm text-slate-950 group-hover:text-slate-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[11px] text-slate-800">{product.rating}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="font-black text-sm sm:text-base text-slate-950">
                    {formatMoney(product.price)}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="p-2 sm:p-2.5 bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. COLLECTION FEMMES (User Request: "and under it category homme femme") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Univers Féminin
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              COLLECTION FEMMES
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Montres élégantes, sacs de luxe, pochettes et porte-monnaie
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug('femmes');
              setCurrentView('catalog');
            }}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>Toute la collection Femmes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual Category Sub-Cards (Inspiration from Image 3: "MONTRES / SACS / PORTE MONNAIE") */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <div
            onClick={() => {
              setSelectedCategorySlug('femmes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80"
              alt="Montres Femmes"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-pink-300 font-bold block">
                Maille & Nacre
              </span>
              <h4 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>MONTRES & COFFRETS</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h4>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedCategorySlug('femmes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
              alt="Sacs à Main"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold block">
                Chic & Soirée
              </span>
              <h4 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>NOS SACS</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h4>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedCategorySlug('femmes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm col-span-2 sm:col-span-1"
          >
            <img
              src="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80"
              alt="Porte-Monnaie"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-rose-300 font-bold block">
                Zippé & Compact
              </span>
              <h4 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>PORTE-MONNAIE</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h4>
            </div>
          </div>
        </div>

        {/* Featured Femmes Products */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 pt-2">
          {femmesProducts.slice(0, 3).map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                  src={product.images[0]?.imageUrl}
                  alt={product.name}
                  onClick={() => navigateToProduct(product.slug)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                />
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Favoris"
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-500 transition-colors shadow-xs cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => navigateToProduct(product.slug)}
                    className="font-bold text-xs sm:text-sm text-slate-950 group-hover:text-slate-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[11px] text-slate-800">{product.rating}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="font-black text-sm sm:text-base text-slate-950">
                    {formatMoney(product.price)}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="p-2 sm:p-2.5 bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. ABONNEMENTS & COMPTES DIGITAUX (User Request: "and under the reset") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              ⚡ Livraison Instantanée WhatsApp
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              ABONNEMENTS & COMPTES DIGITAUX
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Netflix 4K, ChatGPT Plus, Spotify, clés de jeux & licences avec garantie totale
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug('produits-digitaux');
              setCurrentView('catalog');
            }}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir tous les comptes digitaux</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Digital Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {digitalProducts.slice(0, 4).map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-900">
                <img
                  src={product.images[0]?.imageUrl}
                  alt={product.name}
                  onClick={() => navigateToProduct(product.slug)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md tracking-wider shadow-xs">
                  ⚡ INSTANT
                </div>
              </div>

              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => navigateToProduct(product.slug)}
                    className="font-bold text-xs sm:text-sm text-slate-950 group-hover:text-slate-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[11px] text-slate-800">{product.rating}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="font-black text-sm sm:text-base text-slate-950">
                    {formatMoney(product.price)}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="p-2 sm:p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. TOUTES NOS COLLECTIONS (Interactive Categories Filter) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              TOUTES NOS COLLECTIONS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Explorez par univers et accédez à tout notre catalogue
            </p>
          </div>
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir tout le catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategorySlug(cat.slug);
                setCurrentView('catalog');
              }}
              className="group relative aspect-4/5 rounded-2xl overflow-hidden bg-slate-900 flex flex-col justify-end p-4 text-left border border-slate-200 hover:border-slate-400 transition-all cursor-pointer shadow-xs"
            >
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="relative z-10 text-white">
                <span className="font-extrabold text-sm sm:text-base block uppercase tracking-wide">
                  {cat.name}
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5 font-medium group-hover:translate-x-1 transition-transform">
                  Découvrir →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 9. REASSURANCE GUARANTEE BANNER */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <div className="py-5 px-6 bg-slate-900 text-white rounded-3xl flex flex-wrap items-center justify-around gap-4 text-xs font-bold shadow-lg">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>Livraison Express 24h-48h Partout au Maroc</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-base">💵</span>
            <span>Paiement Cash à la Livraison (Vérifiez le Colis)</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>100% Authentique & Qualité Garantie</span>
          </div>
        </div>
      </section>

    </div>
  );
};
