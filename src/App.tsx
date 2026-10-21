import React, { Suspense, lazy, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { CartDrawer } from './components/common/CartDrawer';
import { FloatingWhatsAppButton } from './components/common/FloatingWhatsAppButton';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { ConnectionBanner } from './components/common/ConnectionBanner';

// Storefront Views
import { HomeView } from './components/storefront/HomeView';
import { CatalogView } from './components/storefront/CatalogView';
import { ProductDetailView } from './components/storefront/ProductDetailView';

const lazyNamed = <K extends string>(loader: () => Promise<Record<K, React.ComponentType<any>>>, name: K) =>
  lazy(() => loader().then(m => ({ default: m[name] })));

// Pages nobody lands on first: kept out of the first download, then fetched in the
// background once the page is idle so opening them later is still instant
const loadCart = () => import('./components/storefront/CartView');
const loadCheckout = () => import('./components/storefront/CheckoutView');
const loadOrderConfirmation = () => import('./components/storefront/OrderConfirmationView');
const loadOrderTracking = () => import('./components/storefront/OrderTrackingView');
const loadWishlist = () => import('./components/storefront/WishlistView');
const CartView = lazyNamed(loadCart, 'CartView');
const CheckoutView = lazyNamed(loadCheckout, 'CheckoutView');
const OrderConfirmationView = lazyNamed(loadOrderConfirmation, 'OrderConfirmationView');
const OrderTrackingView = lazyNamed(loadOrderTracking, 'OrderTrackingView');
const WishlistView = lazyNamed(loadWishlist, 'WishlistView');

if (typeof window !== 'undefined') {
  const prefetch = () => [loadCheckout, loadCart, loadOrderConfirmation, loadOrderTracking, loadWishlist].forEach(load => load().catch(() => {}));
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch, { timeout: 4000 });
    else setTimeout(prefetch, 2000);
  }, { once: true });
}

const PageFallback = () => <div className="min-h-[60vh]" />;

// Admin Views & Protected Login
// The back office is loaded on demand so shoppers never download it

const SpecificationsModal = lazyNamed(() => import('./components/common/SpecificationsModal'), 'SpecificationsModal');
const AdminLoginView = lazyNamed(() => import('./components/admin/AdminLoginView'), 'AdminLoginView');
const AdminLayout = lazyNamed(() => import('./components/admin/AdminLayout'), 'AdminLayout');
const DashboardView = lazyNamed(() => import('./components/admin/DashboardView'), 'DashboardView');
const ProductsAdminView = lazyNamed(() => import('./components/admin/ProductsAdminView'), 'ProductsAdminView');
const CategoriesAdminView = lazyNamed(() => import('./components/admin/CategoriesAdminView'), 'CategoriesAdminView');
const InventoryAdminView = lazyNamed(() => import('./components/admin/InventoryAdminView'), 'InventoryAdminView');
const OrdersAdminView = lazyNamed(() => import('./components/admin/OrdersAdminView'), 'OrdersAdminView');
const ReviewsAdminView = lazyNamed(() => import('./components/admin/ReviewsAdminView'), 'ReviewsAdminView');
const CustomersAdminView = lazyNamed(() => import('./components/admin/CustomersAdminView'), 'CustomersAdminView');
const MarketingAdminView = lazyNamed(() => import('./components/admin/MarketingAdminView'), 'MarketingAdminView');
const TrackingInspectorView = lazyNamed(() => import('./components/admin/TrackingInspectorView'), 'TrackingInspectorView');
const DataMiningView = lazyNamed(() => import('./components/admin/DataMiningView'), 'DataMiningView');
const WhatsAppAdminView = lazyNamed(() => import('./components/admin/WhatsAppAdminView'), 'WhatsAppAdminView');
const CalculationAdminView = lazyNamed(() => import('./components/admin/CalculationAdminView'), 'CalculationAdminView');
const UsersAdminView = lazyNamed(() => import('./components/admin/UsersAdminView'), 'UsersAdminView');
const AuditLogsView = lazyNamed(() => import('./components/admin/AuditLogsView'), 'AuditLogsView');
const SettingsAdminView = lazyNamed(() => import('./components/admin/SettingsAdminView'), 'SettingsAdminView');

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <span className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-white animate-spin"></span>
  </div>
);

// Browser tab titles per storefront page (the server sets the same tags for crawlers)
const VIEW_TITLES: Record<string, string> = {
  home: 'ShopMe Maroc | Livraison 24h & Paiement à la livraison',
  catalog: 'Catalogue produits | ShopMe Maroc',
  cart: 'Panier | ShopMe Maroc',
  checkout: 'Commande | ShopMe Maroc',
  'order-confirmation': 'Commande confirmée | ShopMe Maroc',
  'track-order': 'Suivi de commande | ShopMe Maroc',
  wishlist: 'Favoris | ShopMe Maroc'
};

const setCanonical = (href: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

// Toast and Floating trigger icons
import { FileText } from 'lucide-react';
import { trackingService } from './services/trackingService';

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
  const { currentView, isAdminMode, toastMessage, setCurrentView, products, selectedProductSlug } = useApp();
  const [specsModalOpen, setSpecsModalOpen] = useState(false);

  // Title, description and canonical follow SPA navigation (also read by the pixels' page_view)
  React.useLayoutEffect(() => {
    if (currentView.startsWith('admin')) return;
    const product = currentView === 'product-detail'
      ? products.find(p => p.slug === selectedProductSlug)
      : undefined;
    document.title = product
      ? product.seoTitle || `${product.name} | ShopMe Maroc`
      : VIEW_TITLES[currentView] || VIEW_TITLES.home;
    if (product) {
      const description = (product.seoDescription || product.shortDescription || '').trim();
      const meta = document.querySelector('meta[name="description"]');
      if (description && meta) meta.setAttribute('content', description.slice(0, 160));
    }
    setCanonical(window.location.origin + window.location.pathname);
  }, [currentView, products, selectedProductSlug]);

  // Scroll to top on every view navigation and record a page view on SPA route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Real page view on each SPA route change (browser pixels + server, shared event_id)
    if (!currentView.startsWith('admin')) {
      trackingService.track('page_view', { metadata: { view: currentView } });
    }
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
      <Suspense fallback={<AdminFallback />}>
        <AdminLoginView />
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-950 text-white border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold animate-in slide-in-from-top-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{toastMessage}</span>
          </div>
        )}
      </Suspense>
    );
  }

  // If in Admin Mode, render inside AdminLayout
  if (isAdminMode) {
    return (
      <Suspense fallback={<AdminFallback />}>
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
          {currentView === 'admin-calculation' && <CalculationAdminView />}
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
      </Suspense>
    );
  }

  // Otherwise render Customer-Facing Storefront (No account page, no admin links)
  return (
    <div className="shop-press min-h-dvh bg-slate-50 flex flex-col font-sans">
      <Header onOpenSpecs={() => setSpecsModalOpen(true)} />

      <main className="flex-1">
        {/* Smooth fade/slide between pages */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView === 'product-detail' ? `product-${selectedProductSlug}` : currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {currentView === 'home' && <HomeView />}
            {currentView === 'catalog' && <CatalogView />}
            {currentView === 'product-detail' && <ProductDetailView />}
            <Suspense fallback={<PageFallback />}>
              {currentView === 'cart' && <CartView />}
              {currentView === 'checkout' && <CheckoutView />}
              {currentView === 'order-confirmation' && <OrderConfirmationView />}
              {currentView === 'track-order' && <OrderTrackingView />}
              {currentView === 'wishlist' && <WishlistView />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <MobileBottomNav />
      <CartDrawer />
      <FloatingWhatsAppButton />
      <CookieConsentBanner />
      <ConnectionBanner />

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
      <MotionConfig reducedMotion="user">
        <MainRouter />
      </MotionConfig>
    </AppProvider>
  );
}
