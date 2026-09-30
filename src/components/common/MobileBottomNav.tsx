import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Grid, Heart, ShoppingBag, User as UserIcon, ShieldCheck } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { currentView, setCurrentView, cartItemCount, wishlistIds, t, isAdminMode } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        {/* Home */}
        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[44px] cursor-pointer transition-colors ${
            currentView === 'home' ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t.home}</span>
        </button>

        {/* Shop / Catalog */}
        <button
          onClick={() => setCurrentView('catalog')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[44px] cursor-pointer transition-colors ${
            currentView === 'catalog' ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t.catalog}</span>
        </button>

        {/* Wishlist */}
        <button
          onClick={() => setCurrentView('wishlist')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[44px] cursor-pointer transition-colors ${
            currentView === 'wishlist' ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-5 h-5" />
          {wishlistIds.length > 0 && (
            <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {wishlistIds.length}
            </span>
          )}
          <span className="text-[10px] mt-0.5">{t.wishlist}</span>
        </button>

        {/* Cart */}
        <button
          onClick={() => setCurrentView('cart')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[44px] cursor-pointer transition-colors ${
            currentView === 'cart' ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {cartItemCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 bg-slate-900 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5">{t.cart}</span>
        </button>
      </div>
    </nav>
  );
};
