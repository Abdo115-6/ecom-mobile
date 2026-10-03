import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { SpecificationsModal } from './components/common/SpecificationsModal';

// Storefront Views
import { HomeView } from './components/storefront/HomeView';
import { CatalogView } from './components/storefront/CatalogView';
import { ProductDetailView } from './components/storefront/ProductDetailView';
import { CartView } from './components/storefront/CartView';
import { CheckoutView } from './components/storefront/CheckoutView';
import { OrderConfirmationView } from './components/storefront/OrderConfirmationView';
import { OrderTrackingView } from './components/storefront/OrderTrackingView';
import { WishlistView } from './components/storefront/WishlistView';

// Admin Views & Protected Login
import { AdminLoginView } from './components/admin/AdminLoginView';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardView } from './components/admin/DashboardView';
import { ProductsAdminView } from './components/admin/ProductsAdminView';
import { CategoriesAdminView } from './components/admin/CategoriesAdminView';
import { InventoryAdminView } from './components/admin/InventoryAdminView';
import { OrdersAdminView } from './components/admin/OrdersAdminView';
import { ReviewsAdminView } from './components/admin/ReviewsAdminView';
import { CustomersAdminView } from './components/admin/CustomersAdminView';
import { MarketingAdminView } from './components/admin/MarketingAdminView';
import { TrackingInspectorView } from './components/admin/TrackingInspectorView';
import { DataMiningView } from './components/admin/DataMiningView';
import { WhatsAppAdminView } from './components/admin/WhatsAppAdminView';
import { UsersAdminView } from './components/admin/UsersAdminView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { SettingsAdminView } from './components/admin/SettingsAdminView';

// Toast and Floating trigger icons
import { FileText } from 'lucide-react';

// Anti-crawler and anti-fetcher shield for secret admin panel
const isBotOrFetcher = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  // Headless browser check
  if ((navigator as any).webdriver) return true;

  const ua = (navigator.userAgent || '').toLowerCase();
  const botKeywords = [
    'bot', 'crawl', 'spider', 'slurp', 'fetch', 'headless', 'phantom',
    'lighthouse', 'curl', 'wget', 'python', 'bytespider', 'semrush',
    'ahrefs', 'megaindex', 'zoominfobot', 'googlebot', 'bingbot', 'yandex',
    'facebookexternalhit', 'scraper', 'screaming frog'
  ];
  return botKeywords.some(keyword => ua.includes(keyword));
};

const MainRouter: React.FC = () => {
  const { currentView, isAdminMode, toastMessage, setCurrentView } = useApp();
  const [specsModalOpen, setSpecsModalOpen] = useState(false);

  // Scroll to top on every view navigation (near navbar, not footer)
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentView]);

  // Dynamic meta robots shield to hide admin views from search engines and fetchers
  React.useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }

    if (currentView === 'admin-login' || isAdminMode) {
      metaRobots.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    } else {
      metaRobots.setAttribute('content', 'index, follow');
    }
  }, [currentView, isAdminMode]);

  // If on Admin Login Portal (/adminonly)
  if (currentView === 'admin-login') {
    // If a crawler/fetcher attempts to scan /adminonly, camouflage by showing storefront home
    if (isBotOrFetcher()) {
      return <HomeView />;
    }

    return (
      <>
        <AdminLoginView />
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-950 text-white border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold animate-in slide-in-from-top-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // If in Admin Mode, render inside AdminLayout
  if (isAdminMode) {
    return (
      <>
        <AdminLayout>
          {currentView === 'admin-dashboard' && <DashboardView />}
          {currentView === 'admin-products' && <ProductsAdminView />}
          {currentView === 'admin-categories' && <CategoriesAdminView />}
          {currentView === 'admin-inventory' && <InventoryAdminView />}
          {currentView === 'admin-orders' && <OrdersAdminView />}
          {currentView === 'admin-reviews' && <ReviewsAdminView />}
          {currentView === 'admin-customers' && <CustomersAdminView />}
          {currentView === 'admin-marketing' && <MarketingAdminView />}
          {currentView === 'admin-tracking' && <TrackingInspectorView />}
          {currentView === 'admin-datamining' && <DataMiningView />}
          {currentView === 'admin-whatsapp' && <WhatsAppAdminView />}
          {currentView === 'admin-users' && <UsersAdminView />}
          {currentView === 'admin-audit' && <AuditLogsView />}
          {currentView === 'admin-settings' && <SettingsAdminView />}
        </AdminLayout>

        {/* Admin Specs Viewer Button (Only inside Admin Backoffice) */}
        <button
          onClick={() => setSpecsModalOpen(true)}
          className="fixed bottom-5 right-5 z-50 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-transform hover:scale-105 cursor-pointer"
          title="Consulter l'architecture et les spécifications techniques"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Cahier des Charges & Specs</span>
        </button>

        {/* Specs Viewer Modal */}
        <SpecificationsModal isOpen={specsModalOpen} onClose={() => setSpecsModalOpen(false)} />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-950 text-white border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold animate-in slide-in-from-top-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // Otherwise render Customer-Facing Storefront (No account page, no admin links)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header onOpenSpecs={() => setSpecsModalOpen(true)} />

      <main className="flex-1">
        {currentView === 'home' && <HomeView />}
        {currentView === 'catalog' && <CatalogView />}
        {currentView === 'product-detail' && <ProductDetailView />}
        {currentView === 'cart' && <CartView />}
        {currentView === 'checkout' && <CheckoutView />}
        {currentView === 'order-confirmation' && <OrderConfirmationView />}
        {currentView === 'track-order' && <OrderTrackingView />}
        {currentView === 'wishlist' && <WishlistView />}
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold animate-in slide-in-from-top-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
