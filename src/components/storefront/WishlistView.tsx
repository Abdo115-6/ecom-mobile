import React from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export const WishlistView: React.FC = () => {
  const { wishlistIds, toggleWishlist, addToCart, navigateToProduct, formatMoney, setCurrentView, t } = useApp();

  const wishlistedProducts = dbService.products.filter(p => wishlistIds.includes(p.id));

  if (wishlistedProducts.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Votre liste de favoris est vide</h2>
        <p className="text-xs text-slate-500">
          Enregistrez les articles qui vous plaisent en cliquant sur le cœur pour les retrouver facilement plus tard.
        </p>
        <button
          onClick={() => setCurrentView('catalog')}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
        >
          {t.continueShopping}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{t.wishlist}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {wishlistedProducts.length} article{wishlistedProducts.length > 1 ? 's' : ''} enregistré{wishlistedProducts.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {wishlistedProducts.map(product => (
          <div
            key={product.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-3 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
              <img
                src={product.images[0]?.imageUrl}
                alt={product.name}
                onClick={() => navigateToProduct(product.slug)}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-2 right-2 p-2 rounded-full bg-white/90 text-rose-500 hover:bg-white shadow-xs cursor-pointer"
                title="Retirer des favoris"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">{product.brand}</div>
              <h3
                onClick={() => navigateToProduct(product.slug)}
                className="font-bold text-xs text-slate-900 line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer mt-0.5"
              >
                {product.name}
              </h3>
              <div className="font-black text-sm text-slate-900 mt-1">{formatMoney(product.price)}</div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => addToCart(product)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
