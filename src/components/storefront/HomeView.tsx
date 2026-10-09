import React from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import heroBg from '../../assets/images/shopme_morocco_hero_1791579209702.jpg';
import { 
  ArrowRight, 
  ShoppingBag, 
  Heart, 
  Star 
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

  return (
    <div className="space-y-6 sm:space-y-10 pb-20">
      
      {/* HERO BANNER (ShopMe Casablanca & Livraison Partout au Maroc) */}
      <section className="relative overflow-hidden w-full aspect-16/9 sm:aspect-21/9 max-h-[540px] bg-slate-100 flex items-center justify-center shadow-xs">
        <img
          src={heroBg}
          alt="ShopMe Maroc - Casablanca et partout au Maroc"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.01]"
        />
      </section>

      {/* 1. PRODUCTS FIRST (User Request: "show prduct then under it collection") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {selectedCat ? selectedCat.name : 'Nos Produits'}
            </h2>
            {selectedCat && (
              <span className="text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold">
                {products.length} articles
              </span>
            )}
          </div>
          {selectedCat ? (
            <button
              onClick={() => setSelectedCategorySlug(null)}
              className="text-xs font-bold text-slate-600 hover:text-slate-950 underline cursor-pointer"
            >
              Tous les produits
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('catalog')}
              className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tout le catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* PRODUCTS GRID (Direct, Clean, Minimalist) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all relative"
            >
              {/* Product Photo */}
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                  src={product.images[0]?.imageUrl}
                  alt={product.name}
                  onClick={() => navigateToProduct(product.slug)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                />

                {/* Discount Tag */}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded-md tracking-wider">
                    -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                  </div>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Ajouter aux favoris"
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

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[11px] text-slate-800">{product.rating}</span>
                  </div>
                </div>

                {/* Price and Add button */}
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

      {/* 2. COLLECTIONS UNDER PRODUCTS (User Request: "then under it collection") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 border-t border-slate-200/60">
        <div className="flex items-center justify-between pb-3 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Nos Collections
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Explorez par univers et trouvez ce que vous aimez
            </p>
          </div>
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-bold text-slate-900 hover:opacity-75 flex items-center gap-1 cursor-pointer"
          >
            <span>Toutes les catégories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Categories Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategorySlug(cat.slug);
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              className={`group relative aspect-4/5 rounded-2xl overflow-hidden bg-slate-100 flex flex-col justify-end p-3 sm:p-4 text-left border transition-all cursor-pointer shadow-xs ${
                selectedCategorySlug === cat.slug
                  ? 'border-slate-950 ring-2 ring-slate-950'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
              <div className="relative z-10 text-white">
                <span className="font-extrabold text-sm sm:text-base block uppercase tracking-wide">
                  {cat.name}
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5 font-medium">
                  Découvrir →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Simple 1-line reassurance banner (No talk, just clear icons) */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="py-4 px-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-slate-700">
          <span>🚚 Livraison Express 24h-48h Maroc</span>
          <span>💵 Paiement Cash à la Livraison</span>
          <span>✨ 100% Authentique & Garanti</span>
        </div>
      </section>

    </div>
  );
};
