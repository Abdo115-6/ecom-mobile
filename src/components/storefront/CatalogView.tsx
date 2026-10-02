import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { 
  Filter, 
  Search, 
  X, 
  Star, 
  ShoppingBag, 
  Heart, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const CatalogView: React.FC = () => {
  const { 
    navigateToProduct, 
    addToCart, 
    toggleWishlist, 
    isWishlisted, 
    formatMoney, 
    selectedCategorySlug, 
    setSelectedCategorySlug, 
    searchTerm, 
    setSearchTerm,
    t 
  } = useApp();

  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('featured');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(2000);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categories = dbService.categories;
  const allProducts = dbService.products.filter(p => p.status === 'PUBLISHED');

  // Available brands list
  const brands = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach(p => { if (p.brand) set.add(p.brand); });
    return Array.from(set);
  }, [allProducts]);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      // Category filter
      if (selectedCategorySlug && selectedCategorySlug !== 'all') {
        const cat = categories.find(c => c.slug === selectedCategorySlug);
        const subCatIds = cat?.subcategories?.map(s => s.id) || [];
        const isMatch = p.categoryId === cat?.id || subCatIds.includes(p.categoryId);
        if (!isMatch) return false;
      }

      // Brand filter
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }

      // Price filter
      if (p.price > maxPriceFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesDesc = p.shortDescription.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesDesc && !matchesBrand) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [allProducts, selectedCategorySlug, selectedBrand, maxPriceFilter, searchTerm, sortBy, categories]);

  const resetFilters = () => {
    setSelectedCategorySlug(null);
    setSelectedBrand('all');
    setMaxPriceFilter(2000);
    setSearchTerm('');
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-20">
      
      {/* Title & Mobile Filter Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{t.catalog}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Sort and Mobile Filter Button */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtres</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-3 py-2 rounded-xl">
            <span className="text-slate-500 font-medium hidden sm:inline">{t.sortBy} :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="featured">Recommandés</option>
              <option value="price_asc">{t.priceAsc}</option>
              <option value="price_desc">{t.priceDesc}</option>
              <option value="rating">{t.ratingHigh}</option>
              <option value="newest">{t.newest}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="flex gap-8">
        
        {/* Desktop Sidebar Filter */}
        <aside className="hidden md:block w-64 shrink-0 space-y-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t.categories}</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategorySlug(null)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  !selectedCategorySlug ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.allCategories}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategorySlug === cat.slug ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t.brand}</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedBrand === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Toutes les marques
              </button>
              {brands.map(brand => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedBrand === brand ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="uppercase tracking-wider">{t.price} Max</span>
              <span className="text-slate-900 font-extrabold">{formatMoney(maxPriceFilter)}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1">
          {/* Active Filter Pills */}
          {(selectedCategorySlug || selectedBrand !== 'all' || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
              <span className="text-slate-400">Filtres actifs :</span>
              {selectedCategorySlug && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-medium">
                  Catégorie: {categories.find(c => c.slug === selectedCategorySlug)?.name}
                  <button onClick={() => setSelectedCategorySlug(null)} className="hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBrand !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-medium">
                  Marque: {selectedBrand}
                  <button onClick={() => setSelectedBrand('all')} className="hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-medium">
                  Recherche: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-rose-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Aucun produit trouvé</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Aucun article ne correspond à vos critères de recherche actuels. Essayez d'ajuster vos filtres.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            /* Products Grid */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-5">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative"
                >
                  {/* Image & Wishlist */}
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={product.images[0]?.imageUrl}
                      alt={product.name}
                      onClick={() => navigateToProduct(product.slug)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />

                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md">
                        -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                      </div>
                    )}

                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-500 transition-colors shadow-xs cursor-pointer"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">{product.brand}</div>
                      <h3
                        onClick={() => navigateToProduct(product.slug)}
                        className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-0.5 cursor-pointer leading-tight"
                      >
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-slate-800 text-xs">{product.rating}</span>
                        <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
                      </div>
                    </div>

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
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer / Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/50 backdrop-blur-xs md:hidden">
          <div className="bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Filtres du catalogue</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t.categories}</label>
              <select
                value={selectedCategorySlug || 'all'}
                onChange={(e) => setSelectedCategorySlug(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="all">{t.allCategories}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Brands */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t.brand}</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="all">Toutes les marques</option>
                {brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-900">
                <span>Prix Maximum</span>
                <span>{formatMoney(maxPriceFilter)}</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
