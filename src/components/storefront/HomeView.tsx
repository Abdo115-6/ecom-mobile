import React from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { 
  ArrowRight, 
  Sparkles, 
  Star, 
  ShoppingBag, 
  Heart, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones 
} from 'lucide-react';
import { whatsappService } from '../../services/whatsappService';

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
    t 
  } = useApp();

  const categories = dbService.categories;
  const allPublished = dbService.products.filter(p => p.status === 'PUBLISHED');

  const selectedCat = categories.find(c => c.slug === selectedCategorySlug);
  const products = selectedCategorySlug
    ? allPublished.filter(p => {
        const subCatIds = selectedCat?.subcategories?.map(s => s.id) || [];
        return p.categoryId === selectedCat?.id || subCatIds.includes(p.categoryId);
      })
    : allPublished;

  const reviews = dbService.reviews.filter(r => r.status === 'APPROVED');

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Small Background With The Title (User Request: "make small background with the title and directly show the products") */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-sm mx-2 sm:mx-4 mt-2 px-4 sm:px-6 py-4 sm:py-5 border border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400/15 border border-amber-400/30 rounded-full text-[11px] font-bold text-amber-300 mb-1">
              <Sparkles className="w-3 h-3" />
              <span>🇲🇦 Boutique Officielle Maroc · Paiement Cash à la Livraison</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
              ShopMe Maroc — Parfums & Montres de Prestige
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Commandez en direct · Vérifiez votre colis avant paiement · Livraison 24h-48h partout au Maroc
            </p>
          </div>

          <a
            href={whatsappService.generateSupportLink('Salam ShopMe Maroc, je souhaite commander un article.')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors shrink-0 self-start sm:self-center cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
            <span>Commander sur WhatsApp</span>
          </a>
        </div>
      </section>

      {/* DIRECTLY SHOW PRODUCTS (User Request: "directly show the products") */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-950">
                {selectedCat ? selectedCat.name : 'Nos Produits en Stock'} ({products.length})
              </h2>
              {selectedCat && (
                <button
                  onClick={() => setSelectedCategorySlug(null)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Voir tout
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {selectedCat ? `Articles de la catégorie ${selectedCat.name}` : 'Sélectionnez vos articles avec livraison rapide partout au Maroc'}
            </p>
          </div>
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir tout le catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              {/* Top Badges & Wishlist */}
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                <img
                  src={product.images[0]?.imageUrl}
                  alt={product.name}
                  onClick={() => navigateToProduct(product.slug)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                />

                {/* Compare price discount badge */}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md">
                    -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                  </div>
                )}

                {/* Wishlist button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Ajouter aux favoris"
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-500 transition-colors shadow-xs cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">{product.brand}</div>
                  <h3
                    onClick={() => navigateToProduct(product.slug)}
                    className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-0.5 cursor-pointer leading-tight"
                  >
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-800 text-xs">{product.rating}</span>
                    <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
                  </div>
                </div>

                {/* Price and Cart Action */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-sm sm:text-base text-slate-900">
                      {formatMoney(product.price)}
                    </div>
                    {product.compareAtPrice && (
                      <div className="text-[10px] text-slate-400 line-through">
                        {formatMoney(product.compareAtPrice)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
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

      {/* CATEGORIES SECTION (User Request: "and after scroling down under products") */}
      <section className="max-w-7xl mx-auto px-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {t.categories}
            </h2>
            <p className="text-xs text-slate-500">Explorez par univers et rayon</p>
          </div>
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategorySlug(cat.slug);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group relative overflow-hidden rounded-2xl aspect-4/3 bg-slate-100 flex flex-col justify-end p-3 sm:p-5 text-left border border-slate-200 hover:border-slate-400 transition-all cursor-pointer shadow-xs"
            >
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="relative z-10 text-white">
                <span className="font-bold text-xs sm:text-base block leading-tight">{cat.name}</span>
                <span className="text-[10px] sm:text-xs text-slate-300 hidden sm:block mt-0.5">{cat.description}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Livraison Express 24h</div>
            <div className="text-[11px] text-slate-500">Partout au Maroc</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Paiement à la Livraison</div>
            <div className="text-[11px] text-slate-500">Vérifiez avant de payer</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Garantie & Retour 14j</div>
            <div className="text-[11px] text-slate-500">Remplacement immédiat</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Support WhatsApp 7j/7</div>
            <div className="text-[11px] text-slate-500">Réponse en &lt; 5 min</div>
          </div>
        </div>
      </section>

      {/* WhatsApp Special Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
              <MessageCircle className="w-4 h-4" />
              <span>Commande Directe par WhatsApp</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-extrabold">Pas envie de remplir un formulaire ?</h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg">
              Envoyez-nous simplement une capture d'écran du produit ou son nom sur WhatsApp. Notre conseiller finalise votre commande en 1 minute.
            </p>
          </div>
          <a
            href={whatsappService.generateSupportLink('Commande WhatsApp Directe')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-white text-emerald-800 font-extrabold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg flex items-center gap-2 shrink-0 cursor-pointer text-sm"
          >
            <MessageCircle className="w-5 h-5 fill-emerald-600 text-white" />
            <span>Discuter sur WhatsApp</span>
          </a>
        </div>
      </section>

      {/* Verified Customer Reviews Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-md mx-auto mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900">{t.customerReviews}</h2>
          <p className="text-xs text-slate-500 mt-1">Avis réels laissés par nos clients après réception</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map(rev => (
            <div key={rev.id} className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {rev.customerName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{rev.customerName}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">✓ Achat vérifié</div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-xs font-bold text-slate-800">{rev.title}</div>
              <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>

              {rev.adminReply && (
                <div className="mt-3 p-3 bg-slate-50 border-l-2 border-slate-900 rounded-r-lg text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-[11px]">Réponse ShopMe :</div>
                  <p className="text-slate-600 text-[11px]">{rev.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
