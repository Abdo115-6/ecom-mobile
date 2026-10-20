import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, Translations, TRANSLATIONS } from '../services/i18nService';
import { CurrencyCode, formatPrice } from '../services/currencyService';
import { CartItem, Product, User, RoleName, Order } from '../types/ecommerce';
import { dbService } from '../services/dbService';
import { trackingService } from '../services/trackingService';

export type ActiveView = 
  // Storefront views
  | 'home'
  | 'catalog'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'order-confirmation'
  | 'track-order'
  | 'wishlist'
  | 'account'
  | 'specs'
  // Admin Login Portal
  | 'admin-login'
  // Admin views
  | 'admin-dashboard'
  | 'admin-products'
  | 'admin-categories'
  | 'admin-inventory'
  | 'admin-orders'
  | 'admin-reviews'
  | 'admin-customers'
  | 'admin-marketing'
  | 'admin-tracking'
  | 'admin-datamining'
  | 'admin-whatsapp'
  | 'admin-calculation'
  | 'admin-users'
  | 'admin-audit'
  | 'admin-settings';

interface AppContextType {
  // Navigation & View
  currentView: ActiveView;
  setCurrentView: (view: ActiveView) => void;
  selectedProductSlug: string | null;
  navigateToProduct: (slug: string, directBuy?: boolean) => void;
  getProductShareUrl: (slug: string, directBuy?: boolean) => string;
  directBuyMode: boolean;
  setDirectBuyMode: (active: boolean) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  lastConfirmedOrder: Order | null;
  setLastConfirmedOrder: (order: Order | null) => void;

  // Reactive Products State
  products: Product[];
  refreshProducts: () => void;

  // Localization & Currency
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: Translations;
  currency: CurrencyCode;
  setCurrency: (cur: CurrencyCode) => void;
  formatMoney: (amountInMAD: number) => string;

  // Cart Management
  cartItems: CartItem[];
  addToCart: (
    product: Product, 
    variantId?: string, 
    quantity?: number, 
    customOptions?: { 
      price?: number; 
      variantTitle?: string; 
      imageUrl?: string; 
      openDrawer?: boolean;
      packPieces?: number;
      packTitle?: string;
      pieceUnitPrice?: number;
      savingsAmount?: number;
    }
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, newQty: number) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartShippingFee: number;
  cartFreeShippingThreshold: number; // 0 when free shipping above a threshold does not apply to this cart
  hasFreeShippingCoupon: boolean;
  cartTotal: number;
  appliedCouponCode: string | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  cartItemCount: number;

  // Cart Sidebar Drawer State
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  // User & RBAC Simulation
  currentUser: User;
  switchUserRole: (role: RoleName) => void;
  isAdminMode: boolean;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  adminLogout: () => void;

  // Toast System
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentViewState] = useState<ActiveView>('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [directBuyMode, setDirectBuyMode] = useState<boolean>(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);

  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = (localStorage.getItem('shopme_locale') || localStorage.getItem('aura_locale')) as Locale;
        if (saved && (saved === 'fr' || saved === 'ar' || saved === 'en')) {
          return saved;
        }
      }
    } catch {}
    return 'fr';
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = (localStorage.getItem('shopme_currency') || localStorage.getItem('aura_currency')) as CurrencyCode;
        if (saved && (saved === 'MAD' || saved === 'EUR' || saved === 'USD')) {
          return saved;
        }
      }
    } catch {}
    return 'MAD';
  });
  // Cart and wishlist survive the phone closing the tab (switching to WhatsApp, low memory, refresh)
  const readSaved = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readSaved<CartItem[]>('shopme_cart_v1', []));
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(() => readSaved<string | null>('shopme_coupon_v1', null));
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => readSaved<string[]>('shopme_wishlist_v1', []));

  useEffect(() => {
    try {
      localStorage.setItem('shopme_cart_v1', JSON.stringify(cartItems));
      localStorage.setItem('shopme_coupon_v1', JSON.stringify(appliedCouponCode));
      localStorage.setItem('shopme_wishlist_v1', JSON.stringify(wishlistIds));
    } catch {
      // storage blocked (private mode): cart stays in memory
    }
  }, [cartItems, appliedCouponCode, wishlistIds]);
  const [currentUser, setCurrentUser] = useState<User>(dbService.users[0]); // Default Super Admin
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  // Reactive Products State
  const [products, setProducts] = useState<Product[]>(() => dbService.products);

  useEffect(() => {
    const unsub = dbService.subscribeProducts((latestProducts) => {
      setProducts([...latestProducts]);
    });
    return unsub;
  }, []);

  const refreshProducts = () => {
    setProducts([...dbService.products]);
  };

  // Admin authentication state stored in sessionStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('aura_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Safe setCurrentView enforcing protection on admin views and syncing clean browser history URLs
  const setCurrentView = (view: ActiveView) => {
    if (view === 'account') {
      setCurrentViewState('home');
      return;
    }
    if (view.startsWith('admin-') && view !== 'admin-login' && !isAdminAuthenticated) {
      setCurrentViewState('home');
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/');
      }
      return;
    }
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      if (view === 'admin-login' || (view.startsWith('admin-') && isAdminAuthenticated)) {
        if (!window.location.pathname.includes('adminonly')) {
          window.history.pushState(null, '', '/adminonly');
        }
      } else if (view === 'catalog') {
        window.history.pushState(null, '', '/catalog');
      } else if (view === 'cart') {
        window.history.pushState(null, '', '/cart');
      } else if (view === 'checkout') {
        window.history.pushState(null, '', '/checkout');
      } else if (view === 'wishlist') {
        window.history.pushState(null, '', '/wishlist');
      } else if (view === 'track-order') {
        window.history.pushState(null, '', '/tracking');
      } else if (view === 'home') {
        window.history.pushState(null, '', '/');
      }
    }
  };

  // Set HTML direction and lang when locale changes & persist in localStorage
  const setLocale = (newLoc: Locale) => {
    setLocaleState(newLoc);
    try {
      localStorage.setItem('shopme_locale', newLoc);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLoc;
      document.documentElement.dir = newLoc === 'ar' ? 'rtl' : 'ltr';
    }
  };

  const setCurrency = (newCur: CurrencyCode) => {
    setCurrencyState(newCur);
    try {
      localStorage.setItem('shopme_currency', newCur);
    } catch {}
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  }, [locale]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3200);
  };

  // Generate direct shareable product link (Adaptive to Railway, custom domains and origin)
  const getProductShareUrl = (slug: string, directBuy = true): string => {
    let base = '';
    const configuredDomain = dbService.settings.publicDomain;
    if (configuredDomain && configuredDomain.trim()) {
      base = configuredDomain.trim().replace(/\/+$/, '');
    } else if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
      base = window.location.origin;
    }

    const cleanSlug = encodeURIComponent(slug.trim());
    return `${base}/product/${cleanSlug}${directBuy ? '?buy=1' : ''}`;
  };

  // Navigate to product and track view_item with distinct clean path-based URL
  const navigateToProduct = (slug: string, directBuy = false) => {
    const cleanSlug = slug.trim();
    setSelectedProductSlug(cleanSlug);
    setDirectBuyMode(directBuy);
    setCurrentViewState('product-detail');

    if (typeof window !== 'undefined') {
      const url = `/product/${encodeURIComponent(cleanSlug)}${directBuy ? '?buy=1' : ''}`;
      window.history.pushState(null, '', url);
    }

    // view_item is tracked by ProductDetailView (covers direct URL landings too)
  };

  // Cart operations
  const addToCart = (
    product: Product, 
    variantId?: string, 
    quantity = 1,
    customOptions?: { 
      price?: number; 
      variantTitle?: string; 
      imageUrl?: string; 
      openDrawer?: boolean;
      packPieces?: number;
      packTitle?: string;
      pieceUnitPrice?: number;
      savingsAmount?: number;
    }
  ) => {
    let itemPrice = customOptions?.price !== undefined ? customOptions.price : product.price;
    let variantTitle: string | undefined = customOptions?.variantTitle;
    let itemImage = customOptions?.imageUrl || product.images[0]?.imageUrl || '';
    let maxStock = product.stockQuantity;

    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        if (customOptions?.price === undefined) itemPrice = variant.price;
        if (!variantTitle) variantTitle = variant.title;
        maxStock = variant.stockQuantity;
        if (!customOptions?.imageUrl && variant.imageUrl) itemImage = variant.imageUrl;
      }
    }

    if (maxStock <= 0) {
      showToast(TRANSLATIONS[locale].itemOutOfStock);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(i => 
        i.productId === product.id && 
        i.variantId === variantId && 
        i.variantTitle === variantTitle && 
        i.price === itemPrice &&
        i.packPieces === customOptions?.packPieces
      );
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, maxStock);
        return prev.map(i => i === existing ? { ...i, quantity: nextQty } : i);
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantId,
          variantTitle,
          price: itemPrice,
          quantity: Math.min(quantity, maxStock),
          imageUrl: itemImage,
          maxStock,
          packPieces: customOptions?.packPieces,
          packTitle: customOptions?.packTitle,
          pieceUnitPrice: customOptions?.pieceUnitPrice,
          savingsAmount: customOptions?.savingsAmount
        };
        return [...prev, newItem];
      }
    });

    showToast(TRANSLATIONS[locale].addedToCart);

    // Track add_to_cart
    trackingService.track('add_to_cart', {
      value: itemPrice * quantity,
      currency,
      items: [{
        id: product.sku,
        name: product.name,
        category: product.categoryName,
        price: itemPrice,
        quantity,
        variant: variantTitle
      }]
    });

    // Automatically open the side bar cart drawer (unless explicitly disabled)
    if (customOptions?.openDrawer !== false) {
      setIsCartDrawerOpen(true);
    }
  };

  const removeFromCart = (itemId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
      trackingService.track('remove_from_cart', {
        value: item.price * item.quantity,
        currency,
        items: [{
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity
        }]
      });
    }
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, quantity: Math.min(newQty, i.maxStock) };
      }
      return i;
    }));
  };

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCouponCode(null);
  };

  // Calculations
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartProductIds = cartItems.map(i => i.productId);
  const cartFreeShippingThreshold = dbService.isFreeShippingThresholdApplicable(cartProductIds)
    ? dbService.settings.freeShippingThreshold
    : 0;

  let cartDiscount = 0;
  let isFreeShippingCoupon = false;

  if (appliedCouponCode) {
    const couponValidation = dbService.validateCoupon(appliedCouponCode, cartSubtotal);
    if (couponValidation.valid && couponValidation.coupon) {
      const c = couponValidation.coupon;
      if (c.discountType === 'PERCENTAGE') {
        cartDiscount = (cartSubtotal * c.discountValue) / 100;
        if (c.maxDiscountAmount && cartDiscount > c.maxDiscountAmount) {
          cartDiscount = c.maxDiscountAmount;
        }
      } else if (c.discountType === 'FIXED_AMOUNT') {
        cartDiscount = Math.min(c.discountValue, cartSubtotal);
      } else if (c.discountType === 'FREE_SHIPPING') {
        isFreeShippingCoupon = true;
      }
    }
  }

  // Estimate with the default city; the checkout recalculates with the customer's city
  const cartShippingFee = (isFreeShippingCoupon || cartItems.length === 0)
    ? 0
    : dbService.calculateDeliveryFee('Casablanca', cartSubtotal - cartDiscount, cartProductIds);
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartShippingFee);
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const applyCoupon = (code: string) => {
    const result = dbService.validateCoupon(code, cartSubtotal);
    if (result.valid) {
      setAppliedCouponCode(code.trim().toUpperCase());
      showToast(TRANSLATIONS[locale].couponApplied);
      trackingService.track('coupon_applied', {
        metadata: { coupon: code.trim().toUpperCase() }
      });
      return { success: true, message: TRANSLATIONS[locale].couponApplied };
    } else {
      return { success: false, message: result.error || TRANSLATIONS[locale].invalidCoupon };
    }
  };

  const removeCoupon = () => {
    setAppliedCouponCode(null);
  };

  // Wishlist
  const toggleWishlist = (productId: string) => {
    const product = dbService.getProductById(productId);
    setWishlistIds(prev => {
      const exists = prev.includes(productId);
      if (!exists && product) {
        trackingService.track('add_to_wishlist', {
          value: product.price,
          currency,
          items: [{ id: product.sku, name: product.name, price: product.price, quantity: 1 }]
        });
      }
      return exists ? prev.filter(id => id !== productId) : [...prev, productId];
    });
  };

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  // Switch RBAC user
  const switchUserRole = (role: RoleName) => {
    const matched = dbService.users.find(u => u.role === role) || {
      id: `usr-${Date.now()}`,
      email: `${role.toLowerCase()}@auracommerce.com`,
      firstName: role.replace('_', ' '),
      lastName: "Operator",
      role,
      permissions: [role.toLowerCase()],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setCurrentUser(matched);
    showToast(`Rôle actif : ${role}`);
  };

  // Admin Login authentication check - Secured on real backend to shield from fetchers
  const adminLogin = async (emailInput: string, passwordInput: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const activeAdminUser: User = {
          id: data.user?.id || 'usr-abdo',
          email: data.user?.email || 'abdo@store.com',
          firstName: data.user?.firstName || 'Abdo',
          lastName: data.user?.lastName || 'Propriétaire',
          role: (data.user?.role || 'SUPER_ADMIN') as RoleName,
          permissions: data.user?.permissions || ['all'],
          isActive: true,
          createdAt: new Date().toISOString()
        };

        setCurrentUser(activeAdminUser);
        setIsAdminAuthenticated(true);
        try {
          sessionStorage.setItem('aura_admin_auth', 'true');
          sessionStorage.setItem('aura_admin_token', data.token);
          localStorage.setItem('aura_admin_auth', 'true');
          localStorage.setItem('aura_admin_token', data.token);
        } catch (err) {
          console.warn('Storage notice:', err);
        }

        dbService.addAuditLog(
          activeAdminUser,
          'APPROVE',
          'Authentication',
          activeAdminUser.id,
          `Connexion propriétaire réussie pour ${activeAdminUser.email}`
        );

        showToast(`Bienvenue Abdo sur votre Back-Office ShopMe Maroc`);
        setCurrentViewState('admin-dashboard');
        window.history.pushState(null, '', '/adminonly');
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Identifiants incorrects.' };
      }
    } catch (err) {
      console.warn('Authentication error:', err);
      return { success: false, message: "Erreur de connexion au serveur d'authentification." };
    }
  };

  // Admin Logout
  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('aura_admin_auth');
      sessionStorage.removeItem('aura_admin_token');
      localStorage.removeItem('aura_admin_auth');
      localStorage.removeItem('aura_admin_token');
    } catch (err) {
      console.warn('Storage notice:', err);
    }
    dbService.addAuditLog(
      currentUser,
      'DELETE',
      'Authentication',
      currentUser.id,
      `Déconnexion de la session administrative`
    );
    showToast("Session administrative fermée avec succès.");
    setCurrentViewState('home');
    window.history.pushState(null, '', '/');
  };

  const isAdminMode = currentView.startsWith('admin-') && currentView !== 'admin-login' && isAdminAuthenticated;

  // Listen to URL changes for /adminonly, #adminonly, ?product=slug, and ?buy=1
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const isAdminUrl = path === '/adminonly' || path.startsWith('/adminonly') || hash === '#adminonly';

      // Obscure common attack scans for /admin or /admin/ by redirecting to home
      if (!isAdminUrl && (path === '/admin' || path === '/admin/' || hash === '#admin')) {
        window.history.replaceState(null, '', '/');
        setCurrentViewState('home');
        return;
      }

      if (isAdminUrl) {
        const isAuth = sessionStorage.getItem('aura_admin_auth') === 'true' || localStorage.getItem('aura_admin_auth') === 'true';
        if (isAuth) {
          setIsAdminAuthenticated(true);
          setCurrentViewState('admin-dashboard');
        } else {
          setCurrentViewState('admin-login');
        }
        return;
      }

      // Check for clean path-based product URL: /product/:slug (Railway standard)
      let productSlug: string | null = null;
      if (path.startsWith('/product/')) {
        const rawPart = path.replace('/product/', '').split(/[?#]/)[0];
        const trimmed = rawPart.replace(/\/+$/, '');
        if (trimmed) {
          try {
            productSlug = decodeURIComponent(trimmed).trim();
          } catch {
            productSlug = trimmed.trim();
          }
        }
      }

      // Also support query param fallback (?product=slug or ?p=slug or #product=slug)
      if (!productSlug) {
        const qp = params.get('product') || params.get('p');
        if (qp) {
          try {
            productSlug = decodeURIComponent(qp).trim();
          } catch {
            productSlug = qp.trim();
          }
        }
      }

      if (!productSlug && hash.startsWith('#product=')) {
        const rawHash = hash.replace('#product=', '').split('&')[0];
        try {
          productSlug = decodeURIComponent(rawHash).trim();
        } catch {
          productSlug = rawHash.trim();
        }
      }

      if (productSlug) {
        const isBuy = params.get('buy') === '1' || params.get('direct') === '1' || params.get('checkout') === '1';
        setSelectedProductSlug(productSlug);
        setDirectBuyMode(isBuy);
        setCurrentViewState('product-detail');
        return;
      }

      // Top-level store views navigation
      if (path === '/catalog') {
        setCurrentViewState('catalog');
      } else if (path === '/cart') {
        setCurrentViewState('cart');
      } else if (path === '/checkout') {
        setCurrentViewState('checkout');
      } else if (path === '/wishlist') {
        setCurrentViewState('wishlist');
      } else if (path === '/tracking') {
        setCurrentViewState('track-order');
      } else if (path === '/' || path === '') {
        setCurrentViewState('home');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedProductSlug,
        navigateToProduct,
        getProductShareUrl,
        directBuyMode,
        setDirectBuyMode,
        selectedCategorySlug,
        setSelectedCategorySlug,
        searchTerm,
        setSearchTerm,
        lastConfirmedOrder,
        setLastConfirmedOrder,
        locale,
        setLocale,
        t: TRANSLATIONS[locale],
        currency,
        setCurrency,
        formatMoney: (val: number) => formatPrice(val, currency),
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartItem,
        clearCart,
        cartSubtotal,
        cartDiscount,
        cartShippingFee,
        cartFreeShippingThreshold,
        hasFreeShippingCoupon: isFreeShippingCoupon,
        cartTotal,
        appliedCouponCode,
        applyCoupon,
        removeCoupon,
        cartItemCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        wishlistIds,
        toggleWishlist,
        isWishlisted,
        currentUser,
        switchUserRole,
        isAdminMode,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        toastMessage,
        showToast,
        products,
        refreshProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
