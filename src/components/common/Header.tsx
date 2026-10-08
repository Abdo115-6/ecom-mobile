import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  ShieldCheck, 
  Globe, 
  Coins, 
  FileText, 
  Activity, 
  Menu, 
  X,
  Store,
  ChevronDown
} from 'lucide-react';
import { Locale } from '../../services/i18nService';
import { CurrencyCode } from '../../services/currencyService';
import { dbService } from '../../services/dbService';

interface HeaderProps {
  onOpenSpecs: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSpecs }) => {
  const { 
    currentView, 
    setCurrentView, 
    cartItemCount, 
    wishlistIds, 
    locale, 
    setLocale, 
    currency, 
    setCurrency, 
    t, 
    formatMoney,
    isAdminMode,
    searchTerm,
    setSearchTerm,
    currentUser,
    switchUserRole,
    selectedCategorySlug,
    setSelectedCategorySlug
  } = useApp();

  const categories = dbService.categories;

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setCurrentView('catalog');
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium">
            {locale === 'ar' 
              ? '🚚 توصيل سريع 24-48 ساعة لجميع مدن المغرب · الدفع عند الاستلام بعد معاينة طلبك' 
              : '🚚 Livraison Gratuite 24h-48h partout au Maroc · Paiement Cash à la Livraison (الدفع عند الاستلام)'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <div className="flex items-center gap-1 text-[11px]">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              aria-label="Sélectionner la devise"
              className="bg-transparent text-slate-200 cursor-pointer focus:outline-none font-bold"
            >
              <option value="MAD" className="bg-slate-900 text-white">MAD (DH)</option>
              <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
              <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
            </select>
          </div>

          <span className="text-slate-700">|</span>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              aria-label="Sélectionner la langue"
              className="bg-transparent text-slate-200 cursor-pointer focus:outline-none font-bold"
            >
              <option value="fr" className="bg-slate-900 text-white">Français</option>
              <option value="ar" className="bg-slate-900 text-white">العربية (المغرب)</option>
              <option value="en" className="bg-slate-900 text-white">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('home')} 
            className="flex items-center group text-left cursor-pointer"
            aria-label="ShopMe Accueil"
          >
            <Logo size="md" variant="light" subtitleText="MAROC · HOMME & FEMME" />
          </button>

          {/* Storefront Quick Categories Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-6 text-xs font-bold text-slate-600">
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('catalog');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                !selectedCategorySlug && currentView === 'catalog'
                  ? 'text-slate-900 bg-slate-100'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Tous les Produits
            </button>
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategorySlug(cat.slug);
                  setCurrentView('catalog');
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedCategorySlug === cat.slug && currentView === 'catalog'
                    ? 'text-blue-600 bg-blue-50'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm mx-4 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={locale === 'ar' ? 'ابحث عن منتج، عطر، ساعة...' : 'Rechercher un parfum, une montre, un vêtement...'}
            className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Rechercher"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist Link */}
          <button
            onClick={() => setCurrentView('wishlist')}
            className="relative p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label={t.wishlist}
          >
            <Heart className="w-5 h-5" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setCurrentView('cart')}
            className="relative flex items-center gap-2 p-2.5 bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            aria-label={t.cart}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="w-5 h-5 bg-amber-400 text-slate-950 text-xs font-black rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      {mobileSearchOpen && (
        <form onSubmit={handleSearchSubmit} className="md:hidden p-3 border-t border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              autoFocus
              className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
      {/* Categories Bar in Navbar (User Request: "and the categoris do it in the navbar") */}
      <div className="bg-white/95 border-t border-slate-200/80 px-3 sm:px-4 py-2 overflow-x-auto no-scrollbar shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 text-xs font-bold whitespace-nowrap">
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              if (currentView !== 'home' && currentView !== 'catalog') {
                setCurrentView('home');
              }
            }}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer text-[11px] sm:text-xs font-bold ${
              !selectedCategorySlug
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Tous les Produits
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategorySlug(selectedCategorySlug === cat.slug ? null : cat.slug);
                if (currentView !== 'home' && currentView !== 'catalog') {
                  setCurrentView('home');
                }
              }}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer text-[11px] sm:text-xs font-bold flex items-center gap-1.5 ${
                selectedCategorySlug === cat.slug
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
