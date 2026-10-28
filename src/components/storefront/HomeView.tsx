import React from 'react';
import { motion } from 'motion/react';
import { revealOnScroll } from '../common/Reveal';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { whatsappService } from '../../services/whatsappService';
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
import { productKindOf } from '../../utils/productKind';

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
    productsReady,
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
  const hommesProducts = allPublished.filter(p => p.categoryId === 'cat-hommes');
  const femmesProducts = allPublished.filter(p => p.categoryId === 'cat-femmes');
  const digitalProducts = allPublished.filter(p => productKindOf(p) === 'DIGITAL');

  return (
    <div className="space-y-8 sm:space-y-12 pb-24 overflow-x-hidden">
      
      {/* 1. PRODUCTS FIRST: category chips + product grid (the menu's category links filter it too) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-4">
        <div className="flex items-end justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            {selectedCat ? selectedCat.name : t.navAllProducts}
          </h1>
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{t.viewAllCatalog}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategorySlug(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors ${
              !selectedCategorySlug ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
            }`}
          >
            {t.navAllProducts}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors ${
                selectedCategorySlug === cat.slug ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Same-size placeholders until the products arrive, so the page below doesn't jump */}
          {!productsReady && Array.from({ length: 4 }, (_, i) => (
            <div key={`skeleton-${i}`} aria-hidden="true" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="aspect-square bg-slate-100 animate-pulse" />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-3 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="mt-3 pt-2.5 border-t border-slate-100 h-11" />
              </div>
            </div>
          ))}
          {products.slice(0, 12).map((product, index) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                {/* The first row is visible on load: fetch it right away (it is the page's largest image) */}
                <img loading={index < 4 ? 'eager' : 'lazy'} decoding="async"
                  fetchPriority={index < 2 ? 'high' : 'auto'}
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

              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <h2
                  onClick={() => navigateToProduct(product.slug)}
                  className="font-bold text-xs sm:text-sm text-slate-950 group-hover:text-slate-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
                >
                  {product.name}
                </h2>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-sm sm:text-base text-slate-950">
                      {formatMoney(product.price)}
                    </div>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <div className="text-[11px] text-slate-500 line-through">
                        {formatMoney(product.compareAtPrice)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="p-2 sm:p-2.5 bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                    title={t.addToCart}
                    aria-label={t.addToCart}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {productsReady && products.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-10">
            {locale === 'ar' ? 'لا توجد منتجات في هذا القسم حالياً' : locale === 'en' ? 'No products in this category yet' : 'Aucun produit dans cette catégorie pour le moment'}
          </div>
        )}

        {products.length > 12 && (
          <button
            onClick={() => setCurrentView('catalog')}
            className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm cursor-pointer"
          >
            {t.viewAllCatalog} ({products.length})
          </button>
        )}
      </section>

      {/* 4. NOS PACKS (Always Visible & Advantageous Bundles) */}
      {(() => {
        // Find product with promo packs configured, or top physical featured product (e.g. Lunette, etc.)
        const productWithPacks = allPublished.find(p => p.promoPacks && p.promoPacks.length > 0)
          || allPublished.find(p => p.categoryId !== 'cat-digital' && p.productKind !== 'DIGITAL')
          || allPublished[0];

        if (!productWithPacks) return null;

        const defaultPacks = [
          {
            id: 'pack-1',
            quantity: 1,
            title: 'Pack 1 Pièce',
            price: productWithPacks.variants[0]?.price || productWithPacks.price,
            compareAtPrice: productWithPacks.compareAtPrice,
            badge: ''
          },
          {
            id: 'pack-2',
            quantity: 2,
            title: 'Pack 2 Pièces',
            price: Math.round((productWithPacks.variants[0]?.price || productWithPacks.price) * 2 * 0.8),
            compareAtPrice: Math.round((productWithPacks.variants[0]?.price || productWithPacks.price) * 2),
            badge: 'LE PLUS POPULAIRE 🔥 -20%'
          },
          {
            id: 'pack-3',
            quantity: 3,
            title: 'Pack 3 Pièces',
            price: Math.round((productWithPacks.variants[0]?.price || productWithPacks.price) * 2),
            compareAtPrice: Math.round((productWithPacks.variants[0]?.price || productWithPacks.price) * 3),
            badge: 'MEILLEURE OFFRE 🎁 1 GRATUIT'
          }
        ];

        const rawHomePacks: any[] = (productWithPacks.promoPacks && productWithPacks.promoPacks.length > 0)
          ? productWithPacks.promoPacks
          : ((productWithPacks as any).promotionalPacks && (productWithPacks as any).promotionalPacks.length > 0)
          ? (productWithPacks as any).promotionalPacks
          : [];

        const basePiecePrice = productWithPacks.variants[0]?.price || productWithPacks.price;

        const packs = rawHomePacks.length > 0
          ? rawHomePacks.map((p: any, idx: number) => {
              const qty = Number(p.quantity) || (idx + 1);
              const rawPPrice = p.price ?? p.packPrice;
              const price = typeof rawPPrice === 'number' && !isNaN(rawPPrice) && rawPPrice > 0 ? rawPPrice : (qty * basePiecePrice);
              const compareAtPrice = p.compareAtPrice || (qty * (productWithPacks.compareAtPrice || Math.round(basePiecePrice * 1.25)));
              return {
                id: p.id || `pack-${qty}-${idx}`,
                quantity: qty,
                title: p.title || `Pack ${qty} Pièce${qty > 1 ? 's' : ''}`,
                price,
                compareAtPrice: compareAtPrice > price ? compareAtPrice : undefined,
                badge: p.badge || p.badgeText || (qty === 2 ? 'LE PLUS POPULAIRE 🔥 -20%' : qty === 3 ? 'MEILLEURE OFFRE 🎁 1 GRATUIT' : '')
              };
            })
          : defaultPacks;

        return (
          <motion.section {...revealOnScroll} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
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
                <img loading="lazy" decoding="async" 
                  src={productWithPacks.images[0]?.imageUrl} 
                  alt={productWithPacks.name}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Offre Spéciale en Pack</span>
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
                        isPopular ? 'bg-emerald-700' : 'bg-slate-900'
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
                            <span className="text-xs text-slate-500 line-through font-bold">
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
                          <span>{(() => {
                            const fee = dbService.calculateDeliveryFee('Casablanca', pack.price, [productWithPacks.id]);
                            return fee === 0 ? 'Livraison 0 DH Gratuite Partout au Maroc' : `Livraison express 24h-48h · ${formatMoney(fee)}`;
                          })()}</span>
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
                        onClick={() => {
                          addToCart(productWithPacks, productWithPacks.variants[0]?.id, 1, {
                            price: pack.price,
                            variantTitle: `${pack.title} (${pack.quantity} pcs)`,
                            imageUrl: productWithPacks.images[0]?.imageUrl,
                            openDrawer: true,
                            packPieces: pack.quantity,
                            packTitle: pack.title,
                            pieceUnitPrice: unitPrice,
                            savingsAmount: savings
                          });
                        }}
                        className={`w-full py-2.5 font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                          isPopular 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                            : 'bg-slate-950 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>AJOUTER CE PACK AU PANIER</span>
                      </button>

                      <button
                        onClick={() => navigateToProduct(productWithPacks.slug)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Commander en 1 Clic (Fiche Produit)</span>
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
          </motion.section>
        );
      })()}

      {/* 5. COLLECTION HOMMES (User Request: "and under it category homme femme") */}
      <motion.section {...revealOnScroll} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
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
            <img loading="lazy" decoding="async"
              src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
              alt="Montres Hommes"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                Boîte Simple & Coffret
              </span>
              <h3 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>MONTRES LUXE</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h3>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedCategorySlug('hommes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm"
          >
            <img loading="lazy" decoding="async"
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
              alt="High-Tech & Auto"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold block">
                Accessoires 5-en-1
              </span>
              <h3 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>HIGH-TECH AUTO</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h3>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedCategorySlug('hommes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm col-span-2 sm:col-span-1"
          >
            <img loading="lazy" decoding="async"
              src="https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80"
              alt="Ceintures & Maroquinerie"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">
                Cuir & Anti-RFID
              </span>
              <h3 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>CEINTURES & CUIR</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Featured Hommes Products */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 pt-2">
          {hommesProducts.slice(0, 3).map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img loading="lazy" decoding="async"
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
                  {product.reviewsCount > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-[11px] text-slate-800">{product.rating}</span>
                      <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
                    </div>
                  )}
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
      </motion.section>

      {/* 6. COLLECTION FEMMES (User Request: "and under it category homme femme") */}
      <motion.section {...revealOnScroll} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
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
            <img loading="lazy" decoding="async"
              src="https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80"
              alt="Montres Femmes"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-pink-300 font-bold block">
                Maille & Nacre
              </span>
              <h3 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>MONTRES & COFFRETS</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h3>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedCategorySlug('femmes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm"
          >
            <img loading="lazy" decoding="async"
              src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
              alt="Sacs à Main"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold block">
                Chic & Soirée
              </span>
              <h3 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>NOS SACS</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h3>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedCategorySlug('femmes');
              setCurrentView('catalog');
            }}
            className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm col-span-2 sm:col-span-1"
          >
            <img loading="lazy" decoding="async"
              src="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80"
              alt="Porte-Monnaie"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-rose-300 font-bold block">
                Zippé & Compact
              </span>
              <h3 className="text-base sm:text-lg font-black flex items-center justify-between">
                <span>PORTE-MONNAIE</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Featured Femmes Products */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 pt-2">
          {femmesProducts.slice(0, 3).map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img loading="lazy" decoding="async"
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
                  {product.reviewsCount > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-[11px] text-slate-800">{product.rating}</span>
                      <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
                    </div>
                  )}
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
      </motion.section>

      {/* 7. ABONNEMENTS & COMPTES DIGITAUX (User Request: "and under the reset") */}
      <motion.section {...revealOnScroll} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
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
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-900">
                <img loading="lazy" decoding="async"
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
                  {product.reviewsCount > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-[11px] text-slate-800">{product.rating}</span>
                      <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="font-black text-sm sm:text-base text-slate-950">
                    {formatMoney(product.price)}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="p-2 sm:p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer"
                    aria-label={t.addToCart}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 8. TOUTES NOS COLLECTIONS (Interactive Categories Filter) */}
      <motion.section {...revealOnScroll} className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-200">
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
              <img loading="lazy" decoding="async"
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
      </motion.section>

      {/* 9. REASSURANCE GUARANTEE BANNER */}
      <motion.section {...revealOnScroll} className="max-w-7xl mx-auto px-4 pt-4">
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
      </motion.section>

    </div>
  );
};
