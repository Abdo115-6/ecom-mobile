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

  // Localization & Currency
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: Translations;
  currency: CurrencyCode;
  setCurrency: (cur: CurrencyCode) => void;
  formatMoney: (amountInMAD: number) => string;

  // Cart Management
  cartItems: CartItem[];
  addToCart: (product: Product, variantId?: string, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartShippingFee: number;
  cartTotal: number;
  appliedCouponCode: string | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  cartItemCount: number;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  // User & RBAC Simulation
  currentUser: User;
  switchUserRole: (role: RoleName) => void;
  isAdminMode: boolean;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, pass: string) => Promise<boolean>;
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

  const [locale, setLocaleState] = useState<Locale>('fr');
  const [currency, setCurrency] = useState<CurrencyCode>('MAD');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prod-oud-royal', 'prod-rose-musc']);
  const [currentUser, setCurrentUser] = useState<User>(dbService.users[0]); // Default Super Admin
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin authentication state stored in sessionStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('aura_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Safe setCurrentView enforcing protection on admin views and redirecting account
  const setCurrentView = (view: ActiveView) => {
    if (view === 'account') {
      setCurrentViewState('home');
      return;
    }
    if (view.startsWith('admin-') && view !== 'admin-login' && !isAdminAuthenticated) {
      setCurrentViewState('admin-login');
      window.history.pushState(null, '', '/adminonly');
      return;
    }
    setCurrentViewState(view);
    if (view === 'admin-login' || (view.startsWith('admin-') && isAdminAuthenticated)) {
      if (!window.location.pathname.includes('adminonly')) {
        window.history.pushState(null, '', '/adminonly');
      }
    }
  };

  // Set HTML direction and lang when locale changes
  const setLocale = (newLoc: Locale) => {
    setLocaleState(newLoc);
    document.documentElement.lang = newLoc;
    document.documentElement.dir = newLoc === 'ar' ? 'rtl' : 'ltr';
  };

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3200);
  };

  // Generate direct shareable product link
  const getProductShareUrl = (slug: string, directBuy = false): string => {
    if (typeof window === 'undefined') return `/?product=${slug}`;
    const base = window.location.origin;
    return `${base}/?product=${encodeURIComponent(slug)}${directBuy ? '&buy=1' : ''}`;
  };

  // Navigate to product and track view_item
  const navigateToProduct = (slug: string, directBuy = false) => {
    setSelectedProductSlug(slug);
    setDirectBuyMode(directBuy);
    setCurrentViewState('product-detail');

    if (typeof window !== 'undefined') {
      const url = `/?product=${encodeURIComponent(slug)}${directBuy ? '&buy=1' : ''}`;
      window.history.pushState(null, '', url);
    }

    const prod = dbService.getProductBySlug(slug);
    if (prod) {
      trackingService.track('view_item', {
        value: prod.price,
        currency,
        items: [{
          id: prod.sku,
          name: prod.name,
          category: prod.categoryName,
          price: prod.price,
          quantity: 1
        }]
      });
    }
  };

  // Cart operations
  const addToCart = (product: Product, variantId?: string, quantity = 1) => {
    let itemPrice = product.price;
    let variantTitle: string | undefined;
    let itemImage = product.images[0]?.imageUrl || '';
    let maxStock = product.stockQuantity;

    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        itemPrice = variant.price;
        variantTitle = variant.title;
        maxStock = variant.stockQuantity;
        if (variant.imageUrl) itemImage = variant.imageUrl;
      }
    }

    if (maxStock <= 0) {
      showToast(TRANSLATIONS[locale].itemOutOfStock);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id && i.variantId === variantId);
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
          maxStock
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

  const clearCart = () => {
    setCartItems([]);
    setAppliedCouponCode(null);
  };

  // Calculations
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = dbService.settings.freeShippingThreshold;

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

  const isFreeShipping = cartSubtotal >= freeShippingThreshold || isFreeShippingCoupon || cartSubtotal === 0;
  const cartShippingFee = isFreeShipping ? 0 : dbService.settings.standardShippingFee;
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
  const adminLogin = async (emailInput: string, passwordInput: string): Promise<boolean> => {
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
          lastName: data.user?.lastName || 'Store Admin',
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
        } catch (err) {
          console.warn('sessionStorage error', err);
        }

        dbService.addAuditLog(
          activeAdminUser,
          'APPROVE',
          'Authentication',
          activeAdminUser.id,
          `Connexion sécurisée réussie pour ${activeAdminUser.email}`
        );

        showToast(`Bienvenue Abdo sur votre Back-Office ShopMe Maroc`);
        setCurrentViewState('admin-dashboard');
        window.history.pushState(null, '', '/adminonly');
        return true;
      }
    } catch (err) {
      console.warn('Authentication error:', err);
    }

    return false;
  };

  // Admin Logout
  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('aura_admin_auth');
    } catch (err) {
      console.warn('sessionStorage error', err);
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
      const isAdminUrl = path.includes('adminonly') || hash.includes('adminonly') || hash.includes('admin');

      if (isAdminUrl) {
        if (sessionStorage.getItem('aura_admin_auth') === 'true') {
          setIsAdminAuthenticated(true);
          setCurrentViewState('admin-dashboard');
        } else {
          setCurrentViewState('admin-login');
        }
        return;
      }

      // Check for direct product links: ?product=slug or ?p=slug or /product/slug or #product=slug
      let productSlug = params.get('product') || params.get('p');
      if (!productSlug && path.startsWith('/product/')) {
        productSlug = path.replace('/product/', '').trim();
      } else if (!productSlug && hash.startsWith('#product=')) {
        productSlug = hash.replace('#product=', '').trim();
      }

      if (productSlug) {
        const isBuy = params.get('buy') === '1' || params.get('direct') === '1' || params.get('checkout') === '1';
        setSelectedProductSlug(productSlug);
        setDirectBuyMode(isBuy);
        setCurrentViewState('product-detail');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Track initial page view
  useEffect(() => {
    trackingService.track('page_view', {
      currency,
      metadata: { initialView: currentView }
    });
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
        clearCart,
        cartSubtotal,
        cartDiscount,
        cartShippingFee,
        cartTotal,
        appliedCouponCode,
        applyCoupon,
        removeCoupon,
        cartItemCount,
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
