import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { dataMiningService } from '../../services/dataMiningService';
import { whatsappService } from '../../services/whatsappService';
import { trackingService } from '../../services/trackingService';
import { MOROCCAN_CITIES, RECENT_MOROCCAN_BUYERS } from '../../services/moroccoData';
import { clientMovementService } from '../../services/clientMovementService';
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  MessageCircle, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  ArrowLeft,
  X,
  Flame,
  Clock,
  Sparkles,
  PhoneCall,
  MapPin,
  UserCheck,
  CheckCircle2,
  Gift,
  Layers,
  Share2,
  Copy,
  Plus,
  Minus,
  Percent,
  CheckCircle
} from 'lucide-react';

export const ProductDetailView: React.FC = () => {
  const { 
    selectedProductSlug, 
    setCurrentView, 
    addToCart, 
    toggleWishlist, 
    isWishlisted, 
    formatMoney, 
    setLastConfirmedOrder,
    navigateToProduct,
    getProductShareUrl,
    directBuyMode,
    showToast,
    locale,
    t 
  } = useApp();

  const product = dbService.getProductBySlug(selectedProductSlug || '');

  // Variant & Image state
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product?.variants[0]?.id
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customQuantity, setCustomQuantity] = useState<number>(1);

  // Dynamic Offer Packs (Custom from merchant or default 1, 2, 3)
  const packsList = (product?.promoPacks && product.promoPacks.length > 0)
    ? product.promoPacks
    : [
        {
          id: 'pack-1',
          quantity: 1,
          title: 'Pack 1 Pièce',
          price: product ? (product.variants[0]?.price || product.price) : 299,
          compareAtPrice: product?.compareAtPrice,
          badge: ''
        },
        {
          id: 'pack-2',
          quantity: 2,
          title: 'Pack 2 Pièces',
          price: product ? Math.round((product.variants[0]?.price || product.price) * 2 * 0.8) : 499,
          compareAtPrice: product ? (product.variants[0]?.price || product.price) * 2 : 598,
          badge: 'LE PLUS POPULAIRE 🔥 -20%'
        },
        {
          id: 'pack-3',
          quantity: 3,
          title: 'Pack 3 Pièces',
          price: product ? (product.variants[0]?.price || product.price) * 2 : 598,
          compareAtPrice: product ? (product.variants[0]?.price || product.price) * 3 : 897,
          badge: 'MEILLEURE OFFRE 🎁 1 GRATUIT'
        }
      ];

  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(() => {
    return packsList.length > 1 ? 1 : 0;
  });

  // Selected variant calculation
  const activeVariant = product?.variants.find(v => v.id === selectedVariantId) || product?.variants[0];

  // Auto-scroll to COD form if directBuyMode is active
  useEffect(() => {
    if (directBuyMode) {
      setTimeout(() => {
        const el = document.getElementById('direct-cod-form');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    }
  }, [directBuyMode]);

  // Direct COD Moroccan Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCity, setSelectedCity] = useState('Casablanca');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Track product view in client movement service
  useEffect(() => {
    if (product) {
      clientMovementService.trackProductView(product, packsList[selectedPackIndex]?.quantity || 1, activeVariant?.title);
    }
  }, [product?.id, selectedPackIndex, activeVariant?.id]);

  // Handle Debounced Live Input Mining (Saisie en direct)
  const handleInputChange = (field: 'fullName' | 'phone' | 'city' | 'address', value: string) => {
    if (field === 'fullName') setCustomerName(value);
    if (field === 'phone') setCustomerPhone(value);
    if (field === 'city') setSelectedCity(value);
    if (field === 'address') setShippingAddress(value);

    clientMovementService.captureFormInput({
      fullName: field === 'fullName' ? value : customerName,
      phone: field === 'phone' ? value : customerPhone,
      city: field === 'city' ? value : selectedCity,
      address: field === 'address' ? value : shippingAddress,
      pack: packsList[selectedPackIndex]?.quantity || 1,
      variantTitle: activeVariant?.title,
      product
    });
  };

  // Floating Recent Moroccan Buyer Toast
  const [buyerIndex, setBuyerIndex] = useState(0);
  const [showBuyerToast, setShowBuyerToast] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setShowBuyerToast(false);
      setTimeout(() => {
        setBuyerIndex(prev => (prev + 1) % RECENT_MOROCCAN_BUYERS.length);
        setShowBuyerToast(true);
      }, 500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewName, setNewReviewName] = useState('');

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 px-4">
        <h2 className="text-lg font-bold text-slate-900">Produit introuvable</h2>
        <button
          onClick={() => setCurrentView('catalog')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Retour au catalogue
        </button>
      </div>
    );
  }

  // Selected variant unit price & stock calculation
  const unitPrice = activeVariant ? activeVariant.price : product.price;
  const activeStock = activeVariant ? activeVariant.stockQuantity : product.stockQuantity;
  const activeSku = activeVariant ? activeVariant.sku : product.sku;

  // Dynamic Pack calculations from active pack
  const activePack = packsList[selectedPackIndex] || packsList[0];
  const packQuantity = activePack ? activePack.quantity : 1;
  const packTotalPrice = activePack ? activePack.price : unitPrice;
  const packDiscount = (activePack && activePack.compareAtPrice && activePack.compareAtPrice > activePack.price)
    ? (activePack.compareAtPrice - activePack.price)
    : 0;
  const packBadge = activePack?.badge || '';

  // Copy Direct Purchase Link
  const handleCopyDirectLink = () => {
    if (!product) return;
    const url = getProductShareUrl(product.slug, true);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('✓ Lien direct d\'achat copié ! Vous pouvez l\'envoyer au client.');
    clientMovementService.trackClick('Copier Lien Achat Direct', 'SHARE', {
      productSlug: product.slug,
      productName: product.name
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Share to Client via WhatsApp
  const handleShareWhatsApp = () => {
    if (!product) return;
    const url = getProductShareUrl(product.slug, true);
    const msg = `Salam ! Voici le lien direct pour commander *${product.name}* avec paiement à la livraison (COD) partout au Maroc 🇲🇦 :\n👉 ${url}`;
    clientMovementService.trackClick('Partager WhatsApp Client', 'WHATSAPP', {
      productSlug: product.slug,
      productName: product.name
    });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Delivery info for selected city
  const cityInfo = MOROCCAN_CITIES.find(c => c.name === selectedCity) || MOROCCAN_CITIES[0];

  // Delivery fee calculation from admin settings
  const deliveryFee = dbService.calculateDeliveryFee(selectedCity, packTotalPrice);
  const finalOrderTotal = packTotalPrice + deliveryFee;

  // Companion & Reviews
  const companionProduct = dataMiningService.getFrequentlyBoughtTogether(product.id);
  const productReviews = dbService.reviews.filter(r => r.productId === product.id && r.status === 'APPROVED');

  // Handle Direct 1-Click Moroccan COD Order
  const handleDirectCodOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    clientMovementService.trackClick('Bouton Confirmer Commande COD', 'CTA', {
      productSlug: product.slug,
      productName: product.name,
      city: selectedCity
    });

    if (!customerName.trim()) {
      setOrderError("Veuillez renseigner votre nom complet.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\s+/g, '');
    if (cleanPhone.length < 9) {
      setOrderError("Veuillez saisir un numéro de téléphone valide au Maroc (ex: 06 XX XX XX XX).");
      return;
    }

    setIsSubmittingOrder(true);

    // Build Moroccan order
    const orderItems = [
      {
        id: "item-" + Date.now(),
        productId: product.id,
        productName: product.name,
        sku: activeSku,
        variantTitle: activeVariant ? `${activeVariant.title} (Pack ${packQuantity} pcs)` : `Pack ${packQuantity} pcs`,
        unitPrice: packTotalPrice / packQuantity,
        quantity: packQuantity,
        subtotal: packTotalPrice,
        imageUrl: product.images[0]?.imageUrl || ''
      }
    ];

    setTimeout(() => {
      try {
        const createdOrder = dbService.createOrder({
          customerId: "cust-" + Date.now(),
          customerName: customerName.trim(),
          customerEmail: `${customerPhone.replace(/[^0-9]/g, '')}@client-shopme.ma`,
          customerPhone: customerPhone.trim(),
          status: 'PROCESSING',
          currency: 'MAD',
          subtotal: unitPrice * packQuantity,
          discountAmount: packDiscount,
          shippingFee: deliveryFee,
          taxAmount: 0,
          totalAmount: finalOrderTotal,
          shippingAddress: {
            fullName: customerName.trim(),
            phone: customerPhone.trim(),
            street: shippingAddress.trim() || 'Adresse confirmée par téléphone',
            city: selectedCity,
            country: 'Maroc'
          },
          paymentMethod: 'CASH_ON_DELIVERY',
          paymentStatus: 'PENDING',
          shipment: {
            carrier: 'ShopMe Express Maroc',
            trackingNumber: `MA-${Math.floor(100000 + Math.random() * 900000)}`,
            status: 'Commande confirmée · En préparation'
          },
          items: orderItems,
          utmSource: new URLSearchParams(window.location.search).get('utm_source') || 'direct_ads',
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || 'morocco_conversion',
          notes: `Commande Express 1-Clic COD Pack ${packQuantity}. Ville : ${selectedCity}`
        });

        // Fire high-priority conversion tracking for Ads (GA4, Meta CAPI, TikTok, Snapchat)
        trackingService.track('purchase', {
          value: finalOrderTotal,
          currency: 'MAD',
          orderId: createdOrder.orderNumber,
          items: [{
            id: activeSku,
            name: product.name,
            category: product.categoryName,
            price: packTotalPrice,
            quantity: packQuantity
          }],
          metadata: {
            city: selectedCity,
            pack: packQuantity,
            shippingFee: deliveryFee,
            paymentMethod: 'CASH_ON_DELIVERY'
          }
        });

        // Mark session as converted / purchased in client movement mining
        clientMovementService.markAsPurchased(createdOrder.orderNumber, packTotalPrice);

        setIsSubmittingOrder(false);
        setLastConfirmedOrder(createdOrder);
        showToast("🎉 Commande validée avec succès ! Notre équipe ShopMe vous contactera pour la livraison.");
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        setCurrentView('order-confirmation');
      } catch (err) {
        setIsSubmittingOrder(false);
        setOrderError("Une erreur est survenue lors de l'enregistrement de votre commande. Veuillez réessayer.");
      }
    }, 450);
  };

  // WhatsApp 1-Click Order Link (ShopMe)
  const whatsAppOrderText = `Salam ShopMe Maroc, je souhaite commander : *${product.name}*\n- Option : ${activeVariant?.title || 'Standard'}\n- Offre choisie : Pack ${packQuantity} article(s)\n- Total à payer : *${packTotalPrice} DH* (Paiement à la livraison)\n- Ville de livraison : *${selectedCity}*\nMerci de confirmer ma commande !`;
  const whatsAppLink = `https://wa.me/212600000000?text=${encodeURIComponent(whatsAppOrderText)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 sm:space-y-10 pb-24 relative">
      
      {/* Floating Recent Moroccan Buyer Toast Notification */}
      {showBuyerToast && RECENT_MOROCCAN_BUYERS[buyerIndex] && (
        <div className="fixed bottom-20 left-4 z-40 bg-slate-950/95 text-white border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-2xl text-xs flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>{RECENT_MOROCCAN_BUYERS[buyerIndex].name}</span>
              <span className="text-[10px] text-amber-400 font-semibold">({RECENT_MOROCCAN_BUYERS[buyerIndex].city})</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              Vient d'acheter · <span className="text-slate-400">{RECENT_MOROCCAN_BUYERS[buyerIndex].timeAgo}</span>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('catalog')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la boutique</span>
        </button>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* Left Column: Gallery & Thumbnails (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <img
              src={product.images[selectedImageIndex]?.imageUrl || product.images[0]?.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Promo Discount Tag */}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-rose-600 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1">
                <span>-{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%</span>
                <span className="text-[10px] font-normal">RÉDUCTION</span>
              </div>
            )}

            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 p-3 rounded-2xl bg-white/90 backdrop-blur-md text-slate-700 hover:text-rose-500 transition-colors shadow-md cursor-pointer"
            >
              <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIndex === idx ? 'border-slate-900 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Reassurance Badges */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <Truck className="w-5 h-5 text-blue-600 mx-auto" />
              <div className="text-[11px] font-extrabold text-slate-900">Livraison 24h-48h</div>
              <div className="text-[9px] text-slate-500">Partout au Maroc</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
              <div className="text-[11px] font-extrabold text-slate-900">Paiement Cash</div>
              <div className="text-[9px] text-slate-500">À la réception</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <RotateCcw className="w-5 h-5 text-purple-600 mx-auto" />
              <div className="text-[11px] font-extrabold text-slate-900">Testez le Colis</div>
              <div className="text-[9px] text-slate-500">Avant de payer</div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Urgency, Packs & Direct COD Order Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Category & Subcategory Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setCurrentView('catalog')}>Boutique</span>
            <span>›</span>
            <span className="font-semibold text-slate-700">{product.categoryName || 'Catalogue'}</span>
            {product.subcategoryName && (
              <>
                <span>›</span>
                <span className="font-bold text-blue-600">{product.subcategoryName}</span>
              </>
            )}
          </div>

          {/* Title & Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-md uppercase tracking-wider">
                {product.brand}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Réf: {activeSku}</span>
              {product.subcategoryName && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-semibold rounded-md">
                  {product.subcategoryName}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
              {product.name}
            </h1>

            {/* Price Directly Under Title (User Request: "do price under title directly") */}
            <div className="pt-1 pb-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                  {formatMoney(unitPrice)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > unitPrice && (
                  <span className="text-lg sm:text-xl text-slate-400 line-through font-semibold">
                    {formatMoney(product.compareAtPrice)}
                  </span>
                )}
                {product.compareAtPrice && product.compareAtPrice > unitPrice && (
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white text-xs font-black rounded-lg shadow-xs">
                    -{Math.round(((product.compareAtPrice - unitPrice) / product.compareAtPrice) * 100)}%
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  ✓ Livraison Gratuite au Maroc
                </span>
              </div>
              {product.compareAtPrice && product.compareAtPrice > unitPrice && (
                <div className="text-xs text-emerald-600 font-bold mt-1">
                  Économie : {formatMoney(product.compareAtPrice - unitPrice)}
                </div>
              )}
            </div>

            {/* Rating & Reassurance */}
            <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
                <span className="text-xs font-black text-slate-900 ml-1">{product.rating}</span>
                <span className="text-slate-400">({product.reviewsCount} avis)</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">Paiement Cash à la livraison</span>
            </div>
          </div>

          {/* Colors & Variants Selector (User Request: "more control in colors and quantity") */}
          {product.variants.length > 0 && (
            <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Choisissez votre modèle / coloris :</span>
                <span className="text-blue-600">{activeVariant?.title}</span>
              </div>

              {/* Color Swatches if available */}
              {product.variants.some(v => v.colorHex || v.colorOption) && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 block">Coloris disponible :</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {product.variants.map(v => {
                      const isSelected = selectedVariantId === v.id;
                      const hexColor = v.colorHex || (
                        v.colorOption?.toLowerCase().includes('noir') ? '#0f172a' :
                        v.colorOption?.toLowerCase().includes('blanc') ? '#f8fafc' :
                        v.colorOption?.toLowerCase().includes('bleu') ? '#1e3a8a' :
                        v.colorOption?.toLowerCase().includes('vert') ? '#047857' :
                        v.colorOption?.toLowerCase().includes('or') || v.colorOption?.toLowerCase().includes('gold') ? '#d97706' :
                        v.colorOption?.toLowerCase().includes('argent') ? '#94a3b8' :
                        v.colorOption?.toLowerCase().includes('camel') ? '#b45309' :
                        v.colorOption?.toLowerCase().includes('rose') ? '#e11d48' : '#334155'
                      );

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(v.id);
                            if (v.imageUrl) {
                              const imgIdx = product.images.findIndex(img => img.imageUrl === v.imageUrl);
                              if (imgIdx >= 0) setSelectedImageIndex(imgIdx);
                            }
                            clientMovementService.trackClick(`Sélection Couleur: ${v.colorOption || v.title}`, 'COLOR', {
                              productSlug: product.slug,
                              productName: product.name
                            });
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20' 
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span 
                            className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-xs" 
                            style={{ backgroundColor: hexColor }} 
                          />
                          <span>{v.colorOption || v.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variant Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariantId(v.id);
                      if (v.imageUrl) {
                        const imgIdx = product.images.findIndex(img => img.imageUrl === v.imageUrl);
                        if (imgIdx >= 0) setSelectedImageIndex(imgIdx);
                      }
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                      selectedVariantId === v.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-500/30'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <div className="truncate">{v.title}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {v.stockQuantity > 0 ? `${v.stockQuantity} en stock` : 'Rupture'}
                    </div>
                  </button>
                ))}
              </div>

              {/* Stock Status Indicator */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Disponibilité :</span>
                {activeStock <= 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px]">
                    Rupture de stock
                  </span>
                ) : activeStock <= 5 ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Plus que {activeStock} exemplaires restants !
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    ✓ En stock ({activeStock} unités prêtes à expédier)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* DYNAMIC OFFER PACKS SELECTOR (User Request: "more control in prices promo and packs and colors and quntity") */}
          <div className="space-y-2.5 pt-1">
            <label className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
              <span>Sélectionnez votre offre promotionnelle :</span>
              <span className="text-[11px] text-emerald-600 font-bold">Livraison 0 DH</span>
            </label>

            <div className={`grid grid-cols-1 ${packsList.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2.5`}>
              {packsList.map((pack, idx) => {
                const isSelected = selectedPackIndex === idx;
                const savings = pack.compareAtPrice && pack.compareAtPrice > pack.price
                  ? pack.compareAtPrice - pack.price
                  : 0;

                return (
                  <div
                    key={pack.id || `pack-${idx}`}
                    onClick={() => {
                      setSelectedPackIndex(idx);
                      handleInputChange('fullName', customerName);
                      clientMovementService.trackClick(`Choix ${pack.title}`, 'PACK', {
                        productSlug: product.slug,
                        productName: product.name
                      });
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {pack.badge && (
                      <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md tracking-wider uppercase shadow-xs">
                        {pack.badge}
                      </span>
                    )}
                    <div className="text-xs font-extrabold text-slate-900">{pack.title}</div>
                    <div className="text-base font-black text-emerald-800 mt-1">{formatMoney(pack.price)}</div>
                    {pack.compareAtPrice && pack.compareAtPrice > pack.price ? (
                      <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                        <span className="text-slate-400 line-through">{formatMoney(pack.compareAtPrice)}</span>
                        <span className="text-emerald-700 font-bold">Économie {formatMoney(savings)}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 mt-0.5">Offre standard</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DIRECT EXPRESS CASH ON DELIVERY (COD) ORDER FORM - HIGH CONVERTING */}
          <div id="direct-cod-form" className={`bg-gradient-to-b from-white to-slate-50 border-2 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-all ${
            directBuyMode ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-emerald-500/50'
          }`}>
            
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-sm uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Commander en 1 Clic · Paiement à la Livraison</span>
                </div>
                {directBuyMode && (
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md animate-pulse">
                    ⚡ Lien d'achat direct actif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Remplissez simplement ce formulaire court. Vous paierez en espèces à la livraison après inspection du colis.
              </p>
            </div>

            {orderError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{orderError}</span>
              </div>
            )}

            <form onSubmit={handleDirectCodOrder} className="space-y-3.5">
              
              {/* Customer Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Nom & Prénom</span>
                  <span className="text-[11px] text-slate-400 font-normal">الاسم الكامل</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Ex: Youssef El Mansouri"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  />
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Customer Phone (Morocco) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Numéro de Téléphone</span>
                  <span className="text-[11px] text-slate-400 font-normal">رقم الهاتف للاتصال</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="06 XX XX XX XX ou 07 XX XX XX XX"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  />
                  <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <div className="text-[10px] text-slate-500">
                  Notre équipe vous contactera par téléphone ou WhatsApp pour confirmer l'adresse exacte.
                </div>
              </div>

              {/* City Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Ville de Livraison</span>
                  <span className="text-[11px] text-slate-400 font-normal">المدينة</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-8 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  >
                    {MOROCCAN_CITIES.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name} - {c.arabicName} ({c.deliveryNote})
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Adresse ou Quartier (Optionnel)</span>
                  <span className="text-[11px] text-slate-400 font-normal">العنوان</span>
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Ex: Quartier Maârif, Rue 14..."
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>

              {/* Order Recap Banner with Dynamic Delivery Fee */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Article :</span>
                  <span className="font-bold text-slate-900">{product.name} ({packQuantity} pcs)</span>
                </div>
                {packDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Remise Pack :</span>
                    <span>-{formatMoney(packDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700">
                  <span>Frais de livraison ({selectedCity}) :</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                      GRATUITE (0 DH)
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900 font-mono">
                      +{formatMoney(deliveryFee)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-emerald-200/80 text-sm font-black text-slate-900">
                  <span>Total Cash on Delivery à régler :</span>
                  <span className="text-xl text-emerald-700 font-mono">{formatMoney(finalOrderTotal)}</span>
                </div>
              </div>

              {/* Big High-Converting Pulsing Order Button */}
              <button
                type="submit"
                disabled={isSubmittingOrder || activeStock <= 0}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-sm sm:text-base rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 animate-pulse hover:animate-none"
              >
                {isSubmittingOrder ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>CONFIRMER MA COMMANDE (الدفع عند الاستلام)</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paiement en espèces seulement après ouverture et vérification de votre colis</span>
              </div>
            </form>

            {/* Alternative: Order via WhatsApp */}
            <div className="pt-2 border-t border-slate-200/80">
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-emerald-600 text-emerald-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>Ou Commandez directement par WhatsApp (طلب عبر الواتساب)</span>
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* Frequently Bought Together Bundle */}
      {companionProduct && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Pack Complémentaire Recommandé</h2>
            <p className="text-xs text-slate-500">Ajoutez cet article assorti et profitez de la livraison offerte.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0">
                <img src={product.images[0]?.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-slate-400">+</span>
              <div 
                onClick={() => navigateToProduct(companionProduct.slug)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:border-slate-400 transition-colors"
              >
                <img src={companionProduct.images[0]?.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 w-full border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
              <div>
                <div className="text-xs text-slate-500 font-medium">Prix pour les 2 articles :</div>
                <div className="text-lg sm:text-xl font-black text-slate-900">
                  {formatMoney(unitPrice + companionProduct.price)}
                </div>
              </div>

              <button
                onClick={() => {
                  addToCart(product, activeVariant?.id, 1);
                  addToCart(companionProduct, companionProduct.variants[0]?.id, 1);
                  showToast("Pack ajouté au panier avec succès !");
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ajouter le Pack Complet</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Description & Full Details */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-base sm:text-lg font-black text-slate-900">Détails & Caractéristiques du Produit</h2>
        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
          <p>{product.description}</p>
        </div>
      </section>

      {/* Informations Techniques & Spécifications */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">Informations & Fiche Technique</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Garantie & SAV</div>
            <div className="text-xs font-black text-slate-900">{product.technicalSpecs?.warranty || 'Garantie 1 an · Échange 7j'}</div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origine / Fabrication</div>
            <div className="text-xs font-black text-slate-900">{product.technicalSpecs?.origin || 'Maroc / Confection Artisanale'}</div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matière / Finition</div>
            <div className="text-xs font-black text-slate-900">{product.technicalSpecs?.material || 'Matériaux Supérieurs'}</div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poids</div>
            <div className="text-xs font-black text-slate-900">{product.technicalSpecs?.weight || '350 g'}</div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dimensions</div>
            <div className="text-xs font-black text-slate-900">{product.technicalSpecs?.dimensions || 'Format Standard'}</div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spécificité / Autonomie</div>
            <div className="text-xs font-black text-slate-900">{product.technicalSpecs?.batteryLife || 'Usage Quotidien Garanti'}</div>
          </div>
        </div>
      </section>

      {/* Verified Moroccan Customer Reviews */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">Avis de nos Clients au Maroc</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-black text-slate-900">{product.rating} sur 5</span>
              <span className="text-xs text-slate-400">({product.reviewsCount} avis certifiés)</span>
            </div>
          </div>

          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Donner mon avis
          </button>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {productReviews.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              Aucun avis pour le moment. Soyez le premier client à donner votre avis !
            </div>
          ) : (
            productReviews.map(rev => (
              <div key={rev.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {rev.customerName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">{rev.customerName}</span>
                      <span className="text-[10px] text-emerald-600 block">✓ Achat vérifié · Livraison reçue</span>
                    </div>
                  </div>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-800">{rev.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

                {rev.adminReply && (
                  <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-900 text-[11px]">Réponse du Support Aura :</span>
                    <p className="text-slate-600 text-[11px]">{rev.adminReply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Submit Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Donner votre avis</h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newReviewName.trim() || !newReviewComment.trim()) return;

                dbService.submitReview({
                  productId: product.id,
                  productName: product.name,
                  customerId: "cust-guest-" + Date.now(),
                  customerName: newReviewName,
                  rating: newReviewRating,
                  title: newReviewTitle || "Avis client",
                  comment: newReviewComment,
                  isFeatured: false,
                });

                setReviewModalOpen(false);
                setNewReviewTitle('');
                setNewReviewComment('');
                setNewReviewName('');
                showToast("Votre avis a été soumis avec succès et sera validé rapidement !");
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700">Votre Note</label>
                <div className="flex items-center gap-1 mt-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= newReviewRating ? 'fill-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Votre Nom Complet</label>
                <input
                  type="text"
                  required
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="Ex: Sara Alaoui"
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Titre de l'avis</label>
                <input
                  type="text"
                  value={newReviewTitle}
                  onChange={(e) => setNewReviewTitle(e.target.value)}
                  placeholder="Ex: Très satisfaite du produit et de la livraison !"
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Votre Commentaire</label>
                <textarea
                  required
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Partagez votre expérience avec ce produit..."
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Publier mon avis
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
