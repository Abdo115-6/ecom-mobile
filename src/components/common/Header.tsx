import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  Menu, 
  X,
  ChevronRight,
  MessageCircle,
  Truck,
  Globe,
  Coins,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Locale } from '../../services/i18nService';
import { CurrencyCode } from '../../services/currencyService';
import { dbService } from '../../services/dbService';
import { whatsappService } from '../../services/whatsappService';

interface HeaderProps {
  onOpenSpecs: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSpecs }) => {
  const { 
    currentView, 
    setCurrentView, 
    cartItemCount, 
    openCartDrawer,
    wishlistIds, 
    locale, 
    setLocale, 
    currency, 
    setCurrency, 
    t, 
    searchTerm, 
    setSearchTerm,
    selectedCategorySlug, 
    setSelectedCategorySlug
  } = useApp();

  const categories = dbService.categories;

  // Sidebar (3 lines drawer) & search states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setCurrentView('catalog');
      setSearchOpen(false);
    }
  };

  const handleNavigateCategory = (slug: string | null) => {
    setSelectedCategorySlug(slug);
    if (currentView !== 'home' && currentView !== 'catalog') {
      setCurrentView('home');
    }
    setSidebarOpen(false);
  };

  return (
    <>
      {/* TOP ANNOUNCEMENT BAR (User Request: "up livraison par tout au maroc") */}
      <div className="bg-slate-950 text-white text-[10px] sm:text-xs py-2 px-3 sm:px-4 border-b border-slate-900 tracking-wider font-bold">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden text-left">
            <span className="text-amber-400">✦</span>
            <span className="uppercase tracking-widest text-slate-100 font-extrabold truncate">
              {t.deliveryEverywhere}
            </span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden sm:inline text-slate-300 font-medium">{t.cashOnDeliveryShort}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Language Switcher Bar */}
            <div className="inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 text-[10px] sm:text-[11px]">
              <Globe className="w-3 h-3 text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={() => setLocale('fr')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-extrabold ${
                  locale === 'fr' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Français"
                aria-label="Changer en Français"
              >
                FR
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setLocale('ar')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-extrabold ${
                  locale === 'ar' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="العربية (المغرب)"
                aria-label="التبديل إلى العربية"
              >
                عربي
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-extrabold ${
                  locale === 'en' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="English"
                aria-label="Switch to English"
              >
                EN
              </button>
            </div>

          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
        {/* Main Navbar: Left (3 Lines) - Middle (Logo) - Right (Search & Cart) */}
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between relative">
          
          {/* LEFT: Side bar 3 lines button (Hamburger) */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
            </button>
          </div>

          {/* MIDDLE: LOGO IN THE MIDDLE (User Request: "AND MAKE LOGO IN THE MIDDLE") */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('home');
              }}
              className="cursor-pointer py-1 flex items-center justify-center"
              aria-label="Accueil ShopMe"
            >
              <Logo size="md" />
            </button>
          </div>

          {/* RIGHT: WhatsApp, Search icon & Shopping bag icon */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* WhatsApp Quick Order Button */}
            <a
              href={whatsappService.generateSupportLink('Salam ShopMe Maroc, je souhaite commander ou avoir des renseignements.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
              title="Commander directement sur WhatsApp"
              aria-label="Commander sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="font-extrabold hidden xs:inline sm:inline">WhatsApp</span>
            </a>

            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
            </button>

            {/* Shopping Bag Trigger */}
            <button
              onClick={openCartDrawer}
              className="relative p-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label={t.cart}
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-slate-900 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Input Bar (Dropdown) */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="border-t border-slate-200 bg-white p-3 sm:p-4 shadow-md animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-xl mx-auto relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un parfum, une collection..."
                autoFocus
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </header>

      {/* SIDEBAR DRAWER WITH 3 LINES (User Request: "MAKE SIDE BAR WITH 3 LINES") */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Slide-out drawer */}
          <div className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-left duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="font-black text-sm tracking-widest uppercase text-slate-900">
                  ShopMe
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              
              {/* Collections section */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  {t.categories}
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavigateCategory(null)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      !selectedCategorySlug
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t.navAllProducts}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleNavigateCategory(cat.slug)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        selectedCategorySlug === cat.slug
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setCurrentView('wishlist');
                  setSidebarOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>{t.wishlist}</span>
                </span>
                {wishlistIds.length > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                    {wishlistIds.length}
                  </span>
                )}
              </button>
            </div>

            {/* Drawer Footer: Currency (language is in the top bar) */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs flex items-center justify-between">
              <span className="text-slate-500 font-semibold">{t.currencyLabel}</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-800 cursor-pointer"
              >
                <option value="MAD">MAD (DH)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
