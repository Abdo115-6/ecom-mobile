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
    locale,
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
          alt="ShopMe Maroc"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none" />

        {/* Hero Interactive Content & WhatsApp CTA */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8 md:p-12 text-white max-w-4xl">
          <div className="space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/90 backdrop-blur-xs text-slate-950 font-black rounded-full text-[10px] sm:text-xs uppercase tracking-wider shadow-md w-fit">
              <Truck className="w-3.5 h-3.5" />
              <span>{t.deliveryEverywhere} · {t.cashOnDeliveryShort}</span>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* WhatsApp Hero Order Button */}
              <a
                href={whatsappService.generateSupportLink('Salam ShopMe Maroc ! Je souhaite passer une commande ou découvrir les promos disponibles.')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>{t.orderOnWhatsApp}</span>
              </a>

              {/* Browse Promos & Packs */}
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border border-white/30"
              >
                <span>{t.viewOffersAndPacks}</span>
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
                {locale === 'ar' ? 'عروض خاصة محدودة' : locale === 'en' ? 'Limited Special Deals' : 'Offres Spéciales Limitées'}
              </span>
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                {locale === 'ar' ? 'المخزون متوفر بالدار البيضاء' : locale === 'en' ? 'Stock in Casablanca' : 'Stocks limités à Casablanca'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              {t.weeklyPromo}
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{locale === 'ar' ? 'عرض جميع العروض' : locale === 'en' ? 'View all deals' : 'Voir toutes les offres'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual Promotional Banners (Inspiration from Image 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Promo Card 1: 1+1=3 */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/70 border border-amber-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider shadow-xs">
                {locale === 'ar' ? 'عرض ترويجي شوب مي' : locale === 'en' ? 'ShopMe Promo Pack' : 'Pack Promo ShopMe'}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                1 + 1 = 3 <br />
                <span className="text-rose-600">
                  {locale === 'ar' ? 'اشري 2 منتوجات، الثالث فابور !' : locale === 'en' ? 'BUY 2 ITEMS, GET 3RD FREE!' : 'CHRI 2 PRODUITS, TALT FABOUR !'}
                </span>
              </h3>
              <p className="text-xs text-slate-700 font-medium max-w-sm">
                {locale === 'ar'
                  ? 'اطلب قطعتين من نفس التشكيلة واحصل على القطعة الثالثة مجاناً مع توصيل سريع لجميع مدن المغرب.'
                  : locale === 'en'
                  ? 'Order 2 items from the same collection and get the 3rd one free with express delivery all over Morocco.'
                  : 'Commandez 2 articles de la même collection et recevez le 3ème article offert avec livraison express partout au Maroc.'}
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <span>{locale === 'ar' ? 'الاستفادة من العرض' : locale === 'en' ? 'Claim Offer' : "Profiter de l'offre"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-widest bg-amber-200/60 px-2.5 py-1 rounded-md">
                {locale === 'ar' ? 'توصيل مجاني' : locale === 'en' ? 'Free Shipping' : 'Livraison Gratuite'}
              </span>
            </div>
          </div>

          {/* Promo Card 2: Vente Flash */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between shadow-xs border border-slate-800">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-rose-600 text-white font-black rounded-lg text-xs uppercase tracking-wider shadow-xs">
                {locale === 'ar' ? 'تخفيضات سريعة 24-48 ساعة' : locale === 'en' ? 'Flash Sale 24H-48H' : 'Vente Flash 24H-48H'}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {locale === 'ar' ? 'خصومات تصل إلى -45%' : locale === 'en' ? 'UP TO 45% OFF' : "JUSQU'À -45% DE REMISE"} <br />
                <span className="text-emerald-400">
                  {locale === 'ar' ? 'على تشكيلة فاخرة وإلكترونيات' : locale === 'en' ? 'ON SELECT LUXURY & TECH' : 'SUR UNE SÉLECTION LUXE & TECH'}
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-medium max-w-sm">
                {locale === 'ar'
                  ? 'ساعات أنيقة، إكسسوارات وحسابات رقمية مع دفع نقدي بعد فحص الطرد.'
                  : locale === 'en'
                  ? 'Elegant watches, quick chargers, accessories, and digital accounts with cash payment upon package inspection.'
                  : 'Montres élégantes, chargeurs rapides, accessoires et comptes digitaux avec paiement en cash après contrôle du colis.'}
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <span>{locale === 'ar' ? 'اكتشف التشكيلة' : locale === 'en' ? 'Discover Selection' : 'Découvrir la sélection'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-400">
                {locale === 'ar' ? 'المخزون متوفر بالدار البيضاء' : locale === 'en' ? 'Stock in Casablanca' : 'Stock limité à Casablanca'}
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

      {/* 4. NOS PACKS (User Request: "for packs wait until i add product and do packs with the product i add") */}
      {(() => {
        // Find product with promo packs configured (e.g. added by owner)
        const productWithPacks = allPublished.find(p => p.promoPacks && p.promoPacks.length > 0);
        const packs = productWithPacks?.promoPacks || [];

        // If no product with packs added yet, wait (hide from clients, show notice only to owner)
        if (!productWithPacks || packs.length === 0) {
          if (!isAdminAuthenticated) return null;
          return (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Section Packs en attente (Visible uniquement par vous, propriétaire)
                  </h4>
                  <p className="text-xs text-amber-800">
                    Cette section est masquée pour les clients. Dès que vous ajouterez un produit avec des packs dans <span className="font-bold">/adminonly</span>, les packs de votre produit s'afficheront automatiquement ici.
                  </p>
                </div>
              </div>
            </section>
          );
        }

        // Dynamically render packs based on the product added by the owner
        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {locale === 'ar' ? 'باقات وتوفير' : locale === 'en' ? 'Packs & Savings' : 'Packs & Économies'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
                  {t.advantageousPacks}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === 'ar' ? `عروض حصرية للباقات على ${productWithPacks.name} مع توصيل لجميع مدن المغرب` : locale === 'en' ? `Exclusive pack offers on ${productWithPacks.name} with delivery all over Morocco` : `Offres exclusives en pack sur ${productWithPacks.name} avec livraison partout au Maroc`}
                </p>
              </div>
              <button
                onClick={() => navigateToProduct(productWithPacks.slug)}
                className="text-xs font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>{locale === 'ar' ? 'عرض تفاصيل المنتج' : locale === 'en' ? 'View product details' : 'Voir la fiche produit'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Featured product info banner */}
            <div 
              onClick={() => navigateToProduct(productWithPacks.slug)}
              className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex items-center gap-4 cursor-pointer hover:border-slate-300 transition-colors shadow-xs"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                <img 
                  src={productWithPacks.images[0]?.imageUrl} 
                  alt={productWithPacks.name}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Offre Spéciale en Pack</span>
                <h3 className="font-black text-xs sm:text-sm text-slate-950 truncate">{productWithPacks.name}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-1">{productWithPacks.shortDescription || productWithPacks.description}</p>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-bold block">À partir de</span>
                <span className="text-base font-black text-slate-950">{formatMoney(packs[0]?.price || productWithPacks.price)}</span>
              </div>
            </div>

            {/* Dynamic Pack Cards based on the product */}
            <div className={`grid grid-cols-1 ${packs.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 sm:gap-6`}>
              {packs.map((pack, idx) => {
                const isPopular = pack.badge?.toLowerCase().includes('populaire') || pack.quantity === 2 || idx === 1;
                const unitPrice = Math.round(pack.price / pack.quantity);
                const savings = pack.compareAtPrice && pack.compareAtPrice > pack.price ? (pack.compareAtPrice - pack.price) : 0;

                return (
                  <div
                    key={pack.id || `pack-${idx}`}
                    className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative space-y-4 ${
                      isPopular
                        ? 'bg-gradient-to-b from-emerald-50/80 to-white border-2 border-emerald-500 shadow-md'
                        : 'bg-white border border-slate-200 shadow-xs hover:border-slate-400'
                    }`}
                  >
                    {pack.badge && (
                      <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs ${
                        isPopular ? 'bg-emerald-600' : 'bg-slate-900'
                      }`}>
                        {pack.badge}
                      </span>
                    )}

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isPopular ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {pack.quantity === 1 ? <Gift className="w-6 h-6" /> : pack.quantity === 2 ? <Truck className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                          {pack.quantity} {pack.quantity > 1 ? 'Pièces' : 'Pièce'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-slate-950">{pack.title}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xl sm:text-2xl font-black text-slate-950">
                            {formatMoney(pack.price)}
                          </span>
                          {pack.compareAtPrice && pack.compareAtPrice > pack.price && (
                            <span className="text-xs text-slate-400 line-through font-bold">
                              {formatMoney(pack.compareAtPrice)}
                            </span>
                          )}
                        </div>
                        {pack.quantity > 1 && (
                          <span className="text-[11px] font-bold text-emerald-700">
                            Soit {formatMoney(unitPrice)} / pièce {savings > 0 ? `(Économie : ${formatMoney(savings)})` : ''}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-800 space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <span>✓</span>
                          <span>{pack.quantity >= 2 ? 'Livraison 0 DH Gratuite Partout au Maroc' : 'Livraison express 24h-48h'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span>
                          <span>Paiement cash à la livraison après vérification</span>
                        </div>
                        {pack.quantity >= 3 && (
                          <div className="flex items-center gap-2 text-amber-700">
                            <span>✓</span>
                            <span>Coffret de présentation inclus</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => navigateToProduct(productWithPacks.slug)}
                        className={`w-full py-2.5 font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                          isPopular 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                            : 'bg-slate-950 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>COMMANDER CE PACK</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={whatsappService.generateSupportLink(`Salam ShopMe Maroc ! Je souhaite commander le *${pack.title}* (${pack.quantity} pièces) pour *${productWithPacks.name}* au prix de ${pack.price} MAD avec livraison au Maroc.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        <span>Commander sur WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* 5. COLLECTION HOMMES (User Request: "and under it category homme femme") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {locale === 'ar' ? 'عالم الرجال' : locale === 'en' ? "Men's World" : 'Univers Masculin'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              {t.menCollection}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {locale === 'ar' ? 'ساعات كرونوغراف، إكسسوارات سيارات ومصنوعات جلدية' : locale === 'en' ? 'Chronograph watches, tech car gadgets, belts and leather goods' : 'Montres chronographes, gadgets auto high-tech, ceintures et maroquinerie'}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug('hommes');
              setCurrentView('catalog');
            }}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>{locale === 'ar' ? 'جميع تشكيلة الرجال' : locale === 'en' ? "All Men's Collection" : 'Toute la collection Hommes'}</span>
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
              {locale === 'ar' ? 'عالم النساء' : locale === 'en' ? "Women's World" : 'Univers Féminin'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              {t.womenCollection}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {locale === 'ar' ? 'ساعات نسائية أنيقة، حقائب يد فاخرة ومحافظ' : locale === 'en' ? 'Elegant watches, luxury bags, clutches and wallets' : 'Montres élégantes, sacs de luxe, pochettes et porte-monnaie'}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug('femmes');
              setCurrentView('catalog');
            }}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>{locale === 'ar' ? 'جميع تشكيلة النساء' : locale === 'en' ? "All Women's Collection" : 'Toute la collection Femmes'}</span>
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
              ⚡ {locale === 'ar' ? 'توصيل فوري عبر واتساب' : locale === 'en' ? 'Instant WhatsApp Delivery' : 'Livraison Instantanée WhatsApp'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
              {t.digitalAccounts}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {locale === 'ar' ? 'نتفليكس 4K، شات جي بي تي بلس، سبوتيفاي، ومفاتيح برامج مع ضمان شامل' : locale === 'en' ? 'Netflix 4K, ChatGPT Plus, Spotify, game keys & licenses with full warranty' : 'Netflix 4K, ChatGPT Plus, Spotify, clés de jeux & licences avec garantie totale'}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug('produits-digitaux');
              setCurrentView('catalog');
            }}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>{locale === 'ar' ? 'جميع الحسابات الرقمية' : locale === 'en' ? 'All Digital Accounts' : 'Voir tous les comptes digitaux'}</span>
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
              {t.allCollections}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {locale === 'ar' ? 'استكشف حسب القسم وتصفح كامل متجرنا' : locale === 'en' ? 'Explore by category and browse our entire catalog' : 'Explorez par univers et accédez à tout notre catalogue'}
            </p>
          </div>
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>{t.viewAllCatalog}</span>
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
                  {locale === 'ar' ? 'اكتشف ←' : locale === 'en' ? 'Discover →' : 'Découvrir →'}
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
            <span>{t.expressShipping}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-base">💵</span>
            <span>{t.cashOnDeliveryShort}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{t.qualityGuarantee}</span>
          </div>
        </div>
      </section>

    </div>
  );
};
