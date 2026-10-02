export type Locale = 'fr' | 'ar' | 'en';

export interface Translations {
  appName: string;
  home: string;
  catalog: string;
  categories: string;
  search: string;
  searchPlaceholder: string;
  cart: string;
  wishlist: string;
  account: string;
  admin: string;
  trackOrder: string;
  orderNumber: string;
  orderStatus: string;
  freeShippingAbove: string;
  freeShippingUnlocked: string;
  addToCart: string;
  buyNow: string;
  addedToCart: string;
  itemOutOfStock: string;
  inStock: string;
  lowStockOnly: string;
  sku: string;
  brand: string;
  price: string;
  color: string;
  size: string;
  selectOption: string;
  frequentlyBoughtTogether: string;
  youMayAlsoLike: string;
  customerReviews: string;
  writeReview: string;
  submitReview: string;
  rating: string;
  yourComment: string;
  yourName: string;
  checkout: string;
  shippingAddress: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  street: string;
  paymentMethod: string;
  cashOnDelivery: string;
  creditCard: string;
  orderSummary: string;
  subtotal: string;
  shipping: string;
  discount: string;
  tax: string;
  total: string;
  applyCoupon: string;
  couponPlaceholder: string;
  couponApplied: string;
  invalidCoupon: string;
  placeOrder: string;
  orderSuccessTitle: string;
  orderSuccessMsg: string;
  whatsappConfirmation: string;
  contactOnWhatsApp: string;
  viewDetails: string;
  filterBy: string;
  sortBy: string;
  priceAsc: string;
  priceDesc: string;
  newest: string;
  ratingHigh: string;
  allCategories: string;
  emptyCart: string;
  continueShopping: string;
  specificationsDoc: string;
  liveTrackingInspector: string;
}

const fr: Translations = {
  appName: "Aura Commerce",
  home: "Accueil",
  catalog: "Boutique",
  categories: "Catégories",
  search: "Recherche",
  searchPlaceholder: "Rechercher un produit, marque...",
  cart: "Panier",
  wishlist: "Favoris",
  account: "Mon Compte",
  admin: "Back Office",
  trackOrder: "Suivre commande",
  orderNumber: "N° de Commande",
  orderStatus: "Statut de commande",
  freeShippingAbove: "Plus que {amount} pour la livraison gratuite !",
  freeShippingUnlocked: "🎉 Félicitations ! Livraison gratuite offerte !",
  addToCart: "Ajouter au Panier",
  buyNow: "Acheter Immédiatement",
  addedToCart: "Produit ajouté au panier avec succès !",
  itemOutOfStock: "Rupture de stock temporaire",
  inStock: "En stock - Expédition 24h",
  lowStockOnly: "Attention : plus que {count} pièces !",
  sku: "SKU",
  brand: "Marque",
  price: "Prix",
  color: "Couleur",
  size: "Taille",
  selectOption: "Sélectionnez une option",
  frequentlyBoughtTogether: "Fréquemment achetés ensemble",
  youMayAlsoLike: "Vous aimerez aussi",
  customerReviews: "Avis Clients Vérifiés",
  writeReview: "Donner mon avis",
  submitReview: "Publier l'avis",
  rating: "Note",
  yourComment: "Votre expérience...",
  yourName: "Votre Nom",
  checkout: "Finaliser la Commande",
  shippingAddress: "Adresse de Livraison",
  fullName: "Nom complet",
  phoneNumber: "Numéro de téléphone (WhatsApp)",
  city: "Ville",
  street: "Adresse complète (Rue, n°)",
  paymentMethod: "Mode de Paiement",
  cashOnDelivery: "Paiement à la livraison (Cash)",
  creditCard: "Carte Bancaire Sécurisée",
  orderSummary: "Récapitulatif",
  subtotal: "Sous-total",
  shipping: "Frais de livraison",
  discount: "Réduction",
  tax: "TVA",
  total: "Total à payer",
  applyCoupon: "Appliquer",
  couponPlaceholder: "Code promo (ex: PROMO10)",
  couponApplied: "Code appliqué avec succès !",
  invalidCoupon: "Code promotionnel invalide ou expiré",
  placeOrder: "Confirmer la Commande",
  orderSuccessTitle: "Commande Confirmée !",
  orderSuccessMsg: "Merci pour votre achat. Nous préparons votre colis.",
  whatsappConfirmation: "Recevoir le suivi par WhatsApp",
  contactOnWhatsApp: "Commander via WhatsApp",
  viewDetails: "Voir Détails",
  filterBy: "Filtrer par",
  sortBy: "Trier par",
  priceAsc: "Prix croissant",
  priceDesc: "Prix décroissant",
  newest: "Nouveautés",
  ratingHigh: "Meilleures notes",
  allCategories: "Toutes les catégories",
  emptyCart: "Votre panier est vide pour le moment",
  continueShopping: "Continuer mes achats",
  specificationsDoc: "Cahier des Charges & Specs",
  liveTrackingInspector: "Live Event Tracking"
};

const ar: Translations = {
  appName: "أورا للتجارة",
  home: "الرئيسية",
  catalog: "المتجر",
  categories: "الأقسام",
  search: "بحث",
  searchPlaceholder: "ابحث عن منتج، علامة تجارية...",
  cart: "السلة",
  wishlist: "المفضلة",
  account: "حسابي",
  admin: "لوحة التحكم",
  trackOrder: "تتبع طلبي",
  orderNumber: "رقم الطلب",
  orderStatus: "حالة الطلب",
  freeShippingAbove: "باقي {amount} للاستفادة من التوصيل المجاني!",
  freeShippingUnlocked: "🎉 مبروك! حصلت على توصيل مجاني!",
  addToCart: "إضافة إلى السلة",
  buyNow: "اشتري الآن",
  addedToCart: "تمت إضافة المنتج إلى السلة بنجاح!",
  itemOutOfStock: "نفد من المخزون حالياً",
  inStock: "متوفر بالمخزون - شحن سريع 24 ساعة",
  lowStockOnly: "تنبيه: متبقي فقط {count} قطع!",
  sku: "رمز المنتج",
  brand: "الماركة",
  price: "السعر",
  color: "اللون",
  size: "المقاس",
  selectOption: "اختر المواصفات",
  frequentlyBoughtTogether: "يتم شراؤها معاً في الغالب",
  youMayAlsoLike: "قد يعجبك أيضاً",
  customerReviews: "تقييمات العملاء المعتمدة",
  writeReview: "أضف تقييمك",
  submitReview: "إرسال التقييم",
  rating: "التقييم",
  yourComment: "رأيك في المنتج...",
  yourName: "الاسم الكامل",
  checkout: "إتمام الطلب",
  shippingAddress: "عنوان التوصيل",
  fullName: "الاسم الكامل",
  phoneNumber: "رقم الهاتف (واتساب)",
  city: "المدينة",
  street: "العنوان التفصيلي",
  paymentMethod: "طريقة الدفع",
  cashOnDelivery: "الدفع عند الاستلام",
  creditCard: "بطاقة بنكية آمنة",
  orderSummary: "ملخص الطلب",
  subtotal: "المجموع الفرعي",
  shipping: "مصاريف التوصيل",
  discount: "الخصم",
  tax: "الضريبة",
  total: "المجموع الكلي",
  applyCoupon: "تطبيق",
  couponPlaceholder: "رمز القسيمة (مثال: PROMO10)",
  couponApplied: "تم تطبيق الكوبون بنجاح!",
  invalidCoupon: "كوبون غير صالح أو منتهي الصلاحية",
  placeOrder: "تأكيد الطلب الآن",
  orderSuccessTitle: "تم تأكيد طلبك بنجاح!",
  orderSuccessMsg: "شكراً لثقتكم. سنقوم بتجهيز وشحن طلبكم فوراً.",
  whatsappConfirmation: "تتبع طلبي عبر واتساب",
  contactOnWhatsApp: "اطلب مباشرة عبر واتساب",
  viewDetails: "عرض التفاصيل",
  filterBy: "تصفية حسب",
  sortBy: "ترتيب حسب",
  priceAsc: "السعر: من الأقل إلى الأعلى",
  priceDesc: "السعر: من الأعلى إلى الأقل",
  newest: "الأحدث",
  ratingHigh: "الأعلى تقييماً",
  allCategories: "جميع الأقسام",
  emptyCart: "سلة التسوق فارغة حالياً",
  continueShopping: "متابعة التسوق",
  specificationsDoc: "دفتر الشروط والمواصفات",
  liveTrackingInspector: "تتبع الأحداث المباشر"
};

const en: Translations = {
  appName: "Aura Commerce",
  home: "Home",
  catalog: "Shop",
  categories: "Categories",
  search: "Search",
  searchPlaceholder: "Search products, brands...",
  cart: "Cart",
  wishlist: "Wishlist",
  account: "Account",
  admin: "Back Office",
  trackOrder: "Track Order",
  orderNumber: "Order Number",
  orderStatus: "Order Status",
  freeShippingAbove: "Add {amount} more for free shipping!",
  freeShippingUnlocked: "🎉 Congratulations! Free Shipping Unlocked!",
  addToCart: "Add to Cart",
  buyNow: "Buy Now",
  addedToCart: "Product added to cart successfully!",
  itemOutOfStock: "Temporarily out of stock",
  inStock: "In stock - Dispatched within 24h",
  lowStockOnly: "Hurry: only {count} items left!",
  sku: "SKU",
  brand: "Brand",
  price: "Price",
  color: "Color",
  size: "Size",
  selectOption: "Select an option",
  frequentlyBoughtTogether: "Frequently bought together",
  youMayAlsoLike: "You may also like",
  customerReviews: "Verified Customer Reviews",
  writeReview: "Write a review",
  submitReview: "Submit Review",
  rating: "Rating",
  yourComment: "Your experience...",
  yourName: "Your Full Name",
  checkout: "Complete Checkout",
  shippingAddress: "Shipping Address",
  fullName: "Full Name",
  phoneNumber: "Phone Number (WhatsApp)",
  city: "City",
  street: "Full Street Address",
  paymentMethod: "Payment Method",
  cashOnDelivery: "Cash on Delivery (COD)",
  creditCard: "Secure Credit Card",
  orderSummary: "Order Summary",
  subtotal: "Subtotal",
  shipping: "Shipping",
  discount: "Discount",
  tax: "Tax",
  total: "Total Amount",
  applyCoupon: "Apply",
  couponPlaceholder: "Coupon code (e.g., PROMO10)",
  couponApplied: "Coupon applied successfully!",
  invalidCoupon: "Invalid or expired promo code",
  placeOrder: "Confirm Order",
  orderSuccessTitle: "Order Confirmed!",
  orderSuccessMsg: "Thank you for your order. We are preparing your shipment.",
  whatsappConfirmation: "Receive WhatsApp Updates",
  contactOnWhatsApp: "Order via WhatsApp",
  viewDetails: "View Details",
  filterBy: "Filter by",
  sortBy: "Sort by",
  priceAsc: "Price: Low to High",
  priceDesc: "Price: High to Low",
  newest: "Newest Arrivals",
  ratingHigh: "Highest Rated",
  allCategories: "All Categories",
  emptyCart: "Your cart is currently empty",
  continueShopping: "Continue Shopping",
  specificationsDoc: "Architecture & Specs",
  liveTrackingInspector: "Live Event Tracking"
};

export const TRANSLATIONS: Record<Locale, Translations> = { fr, ar, en };
