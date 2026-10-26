import React, { useState, useEffect } from 'react';
import { normalizeMoroccanPhone, PHONE_ERROR_MESSAGE } from '../../services/phone';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { dataMiningService } from '../../services/dataMiningService';
import { whatsappService } from '../../services/whatsappService';
import { trackingService } from '../../services/trackingService';
import { MOROCCAN_CITIES, RECENT_MOROCCAN_BUYERS } from '../../services/moroccoData';
import { clientMovementService } from '../../services/clientMovementService';
import { RichProductDescription } from '../common/RichProductDescription';
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
  CheckCircle,
  Zap,
  Key,
  Laptop,
  Mail,
  FileText
} from 'lucide-react';
import { productKindOf } from '../../utils/productKind';

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
    products: storeProducts,
    openCartDrawer,
    t 
  } = useApp();

  const product = storeProducts.find(p => p.slug === selectedProductSlug) || dbService.getProductBySlug(selectedProductSlug || '');

  // Variant & Image state
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product?.variants[0]?.id
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customQuantity, setCustomQuantity] = useState<number>(1);

  // Selected variant calculation
  const activeVariant = product?.variants.find(v => v.id === selectedVariantId) || product?.variants[0];

  // Dynamic Offer Packs (Normalized from promotionalPacks / promoPacks or calculated from base price)
  const packsList = React.useMemo(() => {
    if (!product) return [];

    const rawPacks: any[] = (product.promoPacks && product.promoPacks.length > 0)
      ? product.promoPacks
      : ((product as any).promotionalPacks && (product as any).promotionalPacks.length > 0)
      ? (product as any).promotionalPacks
      : [];

    const basePiecePrice = activeVariant ? activeVariant.price : (product.variants[0]?.price || product.price || 299);
    const baseComparePrice = activeVariant?.compareAtPrice || product.compareAtPrice || Math.round(basePiecePrice * 1.3);

    if (rawPacks.length > 0) {
      return rawPacks.map((p, idx) => {
        const qty = Number(p.quantity) || (idx + 1);
        const rawPPrice = p.price ?? p.packPrice;
        let price = typeof rawPPrice === 'number' && !isNaN(rawPPrice) && rawPPrice > 0 
          ? rawPPrice 
          : (qty * basePiecePrice);

        // Adjust if active variant has differing price
        if (activeVariant && product.price > 0 && activeVariant.price !== product.price) {
          const ratio = activeVariant.price / product.price;
          price = Math.round(price * ratio);
        }

        const rawCompare = p.compareAtPrice;
        let compareAtPrice: number | undefined = typeof rawCompare === 'number' && !isNaN(rawCompare) && rawCompare > price
          ? rawCompare
          : Math.round(qty * baseComparePrice);

        if (compareAtPrice <= price) {
          compareAtPrice = qty > 1 ? Math.round(qty * basePiecePrice * 1.2) : undefined;
        }

        const unitPiecePrice = Math.round((price / qty) * 100) / 100;
        const totalSavings = compareAtPrice && compareAtPrice > price 
          ? (compareAtPrice - price) 
          : ((qty * basePiecePrice) > price ? ((qty * basePiecePrice) - price) : 0);

        return {
          id: p.id || `pack-${qty}-${idx}`,
          quantity: qty,
          title: p.title || `Pack ${qty} Pièce${qty > 1 ? 's' : ''}`,
          price,
          unitPrice: unitPiecePrice,
          compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined,
          savings: totalSavings,
          badge: p.badge || p.badgeText || (qty === 2 ? 'LE PLUS POPULAIRE 🔥 -20%' : qty === 3 ? 'MEILLEURE OFFRE 🎁 1 GRATUIT' : '')
        };
      });
    }

    // Default 1, 2, 3 packs
    const pack1Price = basePiecePrice;
    const pack2Price = Math.round(basePiecePrice * 2 * 0.8); // 20% discount on 2 pieces
    const pack3Price = Math.round(basePiecePrice * 2); // 3 for price of 2 (1 free)

    return [
      {
        id: 'pack-1',
        quantity: 1,
        title: 'Pack 1 Pièce',
        price: pack1Price,
        unitPrice: pack1Price,
        compareAtPrice: baseComparePrice > pack1Price ? baseComparePrice : undefined,
        savings: baseComparePrice > pack1Price ? baseComparePrice - pack1Price : 0,
        badge: ''
      },
      {
        id: 'pack-2',
        quantity: 2,
        title: 'Pack 2 Pièces',
        price: pack2Price,
        unitPrice: Math.round(pack2Price / 2),
        compareAtPrice: basePiecePrice * 2,
        savings: (basePiecePrice * 2) - pack2Price,
        badge: 'LE PLUS POPULAIRE 🔥 -20%'
      },
      {
        id: 'pack-3',
        quantity: 3,
        title: 'Pack 3 Pièces',
        price: pack3Price,
        unitPrice: Math.round(pack3Price / 3),
        compareAtPrice: basePiecePrice * 3,
        savings: (basePiecePrice * 3) - pack3Price,
        badge: 'MEILLEURE OFFRE 🎁 1 GRATUIT'
      }
    ];
  }, [product, activeVariant]);

  // Pack 1 is preselected; the bigger packs are an upsell the customer picks
  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(0);

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

  // Direct Moroccan Order Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedCity, setSelectedCity] = useState('Casablanca');
  const [shippingAddress, setShippingAddress] = useState('');
  const [playerIdOrAccount, setPlayerIdOrAccount] = useState('');
  const [serviceRequirements, setServiceRequirements] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Digital duration option & top up denomination state
  const [selectedDurationId, setSelectedDurationId] = useState<string | undefined>(
    product?.digitalSpecs?.durationOptions?.find(d => d.isDefault)?.id || product?.digitalSpecs?.durationOptions?.[0]?.id
  );
  const [selectedDenomId, setSelectedDenomId] = useState<string | undefined>(
    product?.digitalSpecs?.topUpDenominations?.find(d => d.isPopular)?.id || product?.digitalSpecs?.topUpDenominations?.[0]?.id
  );

  const hasFiredCheckoutPixelRef = React.useRef(false);

  // Track product view in client movement service
  useEffect(() => {
    if (product) {
      clientMovementService.trackProductView(product, packsList[selectedPackIndex]?.quantity || 1, activeVariant?.title);
    }
  }, [product?.id, selectedPackIndex, activeVariant?.id]);

  // ViewContent once per product (also covers visitors landing directly on the product URL)
  useEffect(() => {
    if (product) {
      trackingService.track('view_item', {
        value: unitPrice,
        currency: 'MAD',
        items: [{ id: product.sku, name: product.name, category: product.categoryName, price: unitPrice, quantity: 1 }]
      });
    }
  }, [product?.id]);

  // Handle Debounced Live Input Mining (Saisie en direct)
  const handleInputChange = (field: 'fullName' | 'phone' | 'city' | 'address', value: string) => {
    if (field === 'fullName') setCustomerName(value);
    if (field === 'phone') setCustomerPhone(value);
    if (field === 'city') setSelectedCity(value);
    if (field === 'address') setShippingAddress(value);

    // Fire InitiateCheckout once when customer starts typing in the order form
    if (!hasFiredCheckoutPixelRef.current && product) {
      hasFiredCheckoutPixelRef.current = true;
      trackingService.track('begin_checkout', {
        value: packTotalPrice,
        currency: 'MAD',
        items: [{ id: product.sku, name: product.name, category: product.categoryName, price: packTotalPrice, quantity: 1 }]
      });
    }

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

  const isDigital = productKindOf(product) === 'DIGITAL';
  const isService = productKindOf(product) === 'SERVICE';

  const selectedDuration = product.digitalSpecs?.durationOptions?.find(d => d.id === selectedDurationId);
  const selectedDenomination = product.digitalSpecs?.topUpDenominations?.find(d => d.id === selectedDenomId);

  // Dynamic unit price: respects digital duration option, denomination, or variant
  const unitPrice = selectedDuration 
    ? selectedDuration.price 
    : selectedDenomination 
    ? selectedDenomination.price 
    : (activeVariant ? activeVariant.price : product.price);

  const activeCompareAt = selectedDuration?.compareAtPrice 
    || selectedDenomination?.compareAtPrice 
    || (activeVariant?.compareAtPrice ?? product.compareAtPrice);

  const activeStock = activeVariant ? activeVariant.stockQuantity : product.stockQuantity;
  const activeSku = activeVariant ? activeVariant.sku : product.sku;

  // Dynamic Pack calculations from active pack
  const activePack = (isDigital || isService) ? null : (packsList[selectedPackIndex] || packsList[0]);
  const packQuantity = activePack ? activePack.quantity : 1;
  const packTotalPrice = (isDigital || isService) ? unitPrice : (activePack ? activePack.price : unitPrice);
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
    const msg = isDigital
      ? `Salam ! Voici le lien direct pour commander l'accès/clé *${product.name}* (Livraison Digitale Instantanée ⚡) :\n👉 ${url}`
      : isService
      ? `Salam ! Voici le lien direct pour réserver la prestation *${product.name}* 🛠️ :\n👉 ${url}`
      : `Salam ! Voici le lien direct pour commander *${product.name}* avec paiement à la livraison (COD) partout au Maroc 🇲🇦 :\n👉 ${url}`;
    clientMovementService.trackClick('Partager WhatsApp Client', 'WHATSAPP', {
      productSlug: product.slug,
      productName: product.name
    });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Delivery info for selected city
  const cityInfo = MOROCCAN_CITIES.find(c => c.name === selectedCity) || MOROCCAN_CITIES[0];

  // Merchandise total taking pack and quantity into account
  const isPhysical = !isDigital && !isService;
  const effectivePack = isPhysical ? (packsList[selectedPackIndex] || packsList[0]) : null;
  const packPieceCount = effectivePack ? effectivePack.quantity : 1;
  const effectiveUnitPrice = (isDigital || isService) ? unitPrice : (effectivePack ? effectivePack.price : unitPrice);
  const effectivePackSavings = (isDigital || isService) ? 0 : (effectivePack?.savings || packDiscount || 0);
  const totalItemsPrice = effectiveUnitPrice * customQuantity;
  const effectiveDiscount = effectivePackSavings * customQuantity;

  // Delivery fee from the product's admin setting or the city rates (Free 0 DH for digital & services)
  const deliveryFee = (isDigital || isService) ? 0 : dbService.calculateDeliveryFee(selectedCity, totalItemsPrice, [product.id]);
  const deliveryLabel = deliveryFee === 0 ? 'Livraison Gratuite' : `Livraison ${formatMoney(deliveryFee)}`;
  const finalOrderTotal = totalItemsPrice + deliveryFee;

  // Companion & Reviews
  const companionProduct = dataMiningService.getFrequentlyBoughtTogether(product.id);
  const productReviews = dbService.reviews.filter(r => r.productId === product.id && r.status === 'APPROVED');

  // Handle Add to Cart & Open Cart Drawer
  const handleAddToCart = () => {
    if (!product) return;
    const finalPrice = effectiveUnitPrice;
    const packPieces = isPhysical ? packPieceCount : 1;
    const packTitle = isPhysical ? effectivePack?.title : undefined;
    const pieceUnitPrice = isPhysical ? (effectivePack?.unitPrice || Math.round(finalPrice / packPieces)) : unitPrice;
    const savingsAmount = effectivePackSavings;

    const variantLabel = activeVariant?.title && activeVariant.title !== 'Défaut' && activeVariant.title !== 'Default'
      ? activeVariant.title
      : undefined;

    const finalTitle = isDigital && selectedDuration
      ? `${product.name} (${selectedDuration.label})`
      : isDigital && selectedDenomination
      ? `${product.name} (${selectedDenomination.amountLabel})`
      : packPieces > 1
      ? `${packTitle || `Pack ${packPieces} Pièces`} (${packPieces} pcs)${variantLabel ? ` · ${variantLabel}` : ''}`
      : variantLabel;

    // The customer is purchasing customQuantity pack(s) at finalPrice per pack
    const effectiveQty = customQuantity || 1;

    addToCart(product, activeVariant?.id, effectiveQty, {
      price: finalPrice,
      variantTitle: finalTitle,
      imageUrl: activeVariant?.imageUrl || product.images[0]?.imageUrl,
      openDrawer: true,
      packPieces,
      packTitle,
      pieceUnitPrice,
      savingsAmount
    });

    // AddToCart is tracked by addToCart() in AppContext (pixels + Conversions API)

    clientMovementService.trackClick('Ajout au Panier depuis Fiche Produit', 'BUTTON', {
      productSlug: product.slug,
      productName: product.name,
    });
  };

  // Handle Direct 1-Click Moroccan COD Order
  const handleDirectCodOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // Ignore the second tap of an impatient double-tap
    if (isSubmittingOrder) return;
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

    const cleanPhone = normalizeMoroccanPhone(customerPhone);
    if (!cleanPhone) {
      setOrderError(PHONE_ERROR_MESSAGE);
      return;
    }

    setIsSubmittingOrder(true);

    // Effective item title
    const effectiveTitle = isDigital && selectedDuration 
      ? `${product.name} (Durée : ${selectedDuration.label})` 
      : isDigital && selectedDenomination 
      ? `${product.name} (Option : ${selectedDenomination.amountLabel})` 
      : effectivePack && effectivePack.quantity > 1
      ? `${effectivePack.title} (${effectivePack.quantity} pcs)${activeVariant?.title && activeVariant.title !== 'Défaut' && activeVariant.title !== 'Default' ? ` · ${activeVariant.title}` : ''}`
      : activeVariant?.title && activeVariant.title !== 'Défaut' && activeVariant.title !== 'Default'
      ? `${product.name} - ${activeVariant.title}` 
      : product.name;

    // Build Moroccan order with exact quantity and subtotal
    const orderItems = [
      {
        id: "item-" + Date.now(),
        productId: product.id,
        productName: product.name,
        sku: activeSku,
        variantTitle: effectiveTitle,
        unitPrice: effectiveUnitPrice,
        quantity: customQuantity,
        subtotal: totalItemsPrice,
        imageUrl: activeVariant?.imageUrl || product.images[0]?.imageUrl || '',
        packPieces: packPieceCount
      }
    ];
    const visitUtm = trackingService.getUtm();

    setTimeout(async () => {
      try {
        const createdOrder = dbService.createOrder({
          customerId: "cust-" + Date.now(),
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || `${cleanPhone}@client-shopme.ma`,
          customerPhone: cleanPhone,
          status: 'PROCESSING',
          currency: 'MAD',
          subtotal: totalItemsPrice,
          discountAmount: effectiveDiscount,
          shippingFee: (isDigital || isService) ? 0 : deliveryFee,
          taxAmount: 0,
          totalAmount: finalOrderTotal,
          shippingAddress: {
            fullName: customerName.trim(),
            phone: cleanPhone,
            street: (isDigital || isService) 
              ? (customerEmail.trim() ? `Email: ${customerEmail.trim()}${playerIdOrAccount ? ` | ID: ${playerIdOrAccount}` : ''}` : 'Livraison Digitale Directe') 
              : (shippingAddress.trim() || 'Adresse confirmée par téléphone'),
            city: (isDigital || isService) ? 'Maroc (Livraison Directe)' : selectedCity,
            country: 'Maroc'
          },
          paymentMethod: isDigital ? 'INSTANT_DELIVERY' : isService ? 'DIRECT_TRANSFER' : 'CASH_ON_DELIVERY',
          paymentStatus: 'PENDING',
          shipment: (isDigital || isService) ? {
            carrier: isDigital ? '⚡ ShopMe Livraison Digitale' : '🛠️ ShopMe Prestations Pro',
            trackingNumber: `DIG-${Math.floor(100000 + Math.random() * 900000)}`,
            status: isDigital ? 'Prêt pour activation immédiate' : 'Prise en charge par un expert'
          } : {
            carrier: 'ShopMe Express Maroc',
            trackingNumber: `MA-${Math.floor(100000 + Math.random() * 900000)}`,
            status: 'Commande confirmée · En préparation'
          },
          items: orderItems,
          utmSource: visitUtm.source,
          utmCampaign: visitUtm.campaign,
          notes: isDigital 
            ? `⚡ PRODUIT DIGITAL: ${product.digitalSpecs?.digitalType || 'Digital'}. Email: ${customerEmail}. WhatsApp: ${customerPhone}.${playerIdOrAccount ? ` ID/Compte: ${playerIdOrAccount}` : ''}${selectedDuration ? ` Durée: ${selectedDuration.label}` : ''}`
            : isService
            ? `🛠️ SERVICE: ${product.serviceSpecs?.serviceType || 'Service'}. Email: ${customerEmail}. WhatsApp: ${customerPhone}. Besoins: ${serviceRequirements || 'Non spécifiés'}`
            : `Commande Express 1-Clic COD Pack ${packQuantity}. Ville : ${selectedCity}`
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
          },
          // Hashed server-side for Meta/TikTok match quality, never stored
          customer: {
            phone: cleanPhone,
            email: customerEmail.trim() || undefined,
            firstName: customerName.trim().split(' ')[0],
            lastName: customerName.trim().split(' ').slice(1).join(' ') || undefined,
            city: isPhysical ? selectedCity : undefined
          }
        });

        // Mark session as converted / purchased in client movement mining
        clientMovementService.markAsPurchased(createdOrder.orderNumber, packTotalPrice);

        // Give a slow connection a few seconds; if it fails the order stays queued on the phone
        await dbService.confirmOrderSynced(createdOrder.id, 8000);

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
  const whatsAppLink = `https://wa.me/${dbService.settings.whatsappPhoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsAppOrderText)}`;

  // The COD order form is shown twice: right under the price, and again at the bottom of the page (same fields, same state)
  const renderCodForm = (placement: 'top' | 'bottom') => (
      <div id={placement === 'top' ? 'direct-cod-form' : 'direct-cod-form-bottom'} className={`bg-gradient-to-b from-white to-slate-50 border-2 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-all ${
        directBuyMode ? 'border-blue-500 ring-4 ring-blue-500/20' : isDigital ? 'border-emerald-500/60' : isService ? 'border-purple-500/60' : 'border-emerald-500/50'
      }`}>
        
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 font-black text-sm uppercase tracking-wide ${
              isDigital ? 'text-emerald-700' : isService ? 'text-purple-700' : 'text-emerald-700'
            }`}>
              {isDigital ? <Zap className="w-4 h-4 text-emerald-600" /> : isService ? <Sparkles className="w-4 h-4 text-purple-600" /> : <Sparkles className="w-4 h-4 text-emerald-600" />}
              <span>
                {isDigital ? 'Passer Commande · Livraison Digitale Instantanée' : isService ? 'Réserver la Prestation · Prise en Charge Rapide' : 'Commander en 1 Clic · Paiement à la Livraison'}
              </span>
            </div>
            {directBuyMode && (
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md animate-pulse">
                ⚡ Lien d'achat direct actif
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isDigital 
              ? 'Livraison sans frais (0 DH). Vous recevrez vos clés / accès directement par WhatsApp & Email sous 2 minutes.' 
              : isService 
              ? 'Pas de frais de dossier (0 DH). Un expert ShopMe vous contactera directement par WhatsApp pour convenir des détails.' 
              : 'Nom, téléphone, ville : c\'est tout. Vous payez en espèces à la réception.'}
          </p>
        </div>

        {orderError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{orderError}</span>
          </div>
        )}

        <form onSubmit={handleDirectCodOrder} className="space-y-3.5">
          
          {/* Form Embedded Pack Choice (For Physical Products with multiple packs) */}
          {!isDigital && !isService && packsList.length > 1 && (
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-emerald-600" />
                <span>Choisissez votre offre :</span>
              </span>

              <div className="grid grid-cols-3 gap-2">
                {packsList.map((pack, idx) => {
                  const isSelected = selectedPackIndex === idx;
                  return (
                    <button
                      key={`cod-pack-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedPackIndex(idx);
                        setCustomQuantity(1);
                      }}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">{pack.title}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="mt-1 text-xs sm:text-sm font-black text-emerald-800 whitespace-nowrap">{formatMoney(pack.price)}</div>
                      {pack.badge && (
                        <div className="text-[8px] font-black text-emerald-700 uppercase tracking-tight mt-0.5 leading-tight line-clamp-2">
                          {pack.badge}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>{isService ? 'Nom & Prénom / Société' : 'Nom & Prénom'}</span>
              <span className="text-[11px] text-slate-400 font-normal">الاسم الكامل</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
                value={customerName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Ex: Youssef El Mansouri"
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              />
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Customer Phone & WhatsApp (Morocco) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>{isDigital ? 'Numéro WhatsApp (Pour envoi direct)' : 'Numéro de Téléphone'}</span>
              <span className="text-[11px] text-slate-400 font-normal">رقم الواتساب / الهاتف</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                value={customerPhone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="06 XX XX XX XX ou 07 XX XX XX XX"
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              />
              <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <div className="text-[10px] text-slate-500">
              {isDigital 
                ? '⚡ Vous recevrez immédiatement les codes et instructions sur ce numéro WhatsApp.' 
                : isService 
                ? 'Notre équipe d\'experts vous contactera directement pour coordonner la prestation.' 
                : 'On vous appelle pour confirmer l\'adresse.'}
            </div>
          </div>

          {/* Digital & Service specific fields: Email */}
          {(isDigital || isService) && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Adresse Email (Pour réception de la licence / facture)</span>
                <span className="text-[11px] text-slate-400 font-normal">البريد الإلكتروني</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="votre-email@gmail.com"
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Digital Player ID / Account Tag if needed */}
          {isDigital && (product.digitalSpecs?.digitalType === 'GAME_TOPUP' || product.digitalSpecs?.digitalType === 'ACCOUNT') && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>ID Joueur / Riot ID / Tag du compte (Optionnel ou Requis pour recharge)</span>
                <span className="text-[11px] text-slate-400 font-normal">معرف اللاعب</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={playerIdOrAccount}
                  onChange={(e) => setPlayerIdOrAccount(e.target.value)}
                  placeholder="Ex: Player#EUW ou ID numérique..."
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Service Requirements / Description */}
          {isService && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Détails ou instructions sur votre besoin</span>
                <span className="text-[11px] text-slate-400 font-normal">تفاصيل المشروع</span>
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={serviceRequirements}
                  onChange={(e) => setServiceRequirements(e.target.value)}
                  placeholder="Précisez brièvement vos attentes ou URL du projet..."
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          {/* Physical Only: City and Street Address */}
          {!isDigital && !isService && (
            <>
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

            </>
          )}

          {/* Total with delivery included, right above the button */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs">
            <div className="flex justify-between items-baseline text-sm font-black text-slate-900">
              <span>{isDigital ? 'Total à régler :' : isService ? 'Total Prestation :' : 'Total à payer :'}</span>
              <span className="text-xl text-emerald-700 font-mono">{formatMoney(finalOrderTotal)}</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {isDigital || isService
                ? 'Aucun frais supplémentaire.'
                : `${deliveryFee === 0 ? 'Livraison gratuite' : `Livraison ${formatMoney(deliveryFee)} comprise`} · 💵 Paiement à la livraison`}
            </div>
          </div>

          {/* Big High-Converting Pulsing Order Button */}
          <button
            type="submit"
            disabled={isSubmittingOrder || (!isDigital && !isService && activeStock <= 0)}
            className={`w-full py-4 px-6 text-white font-black text-sm sm:text-base rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 animate-pulse hover:animate-none ${
              isDigital 
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-600/30' 
                : isService 
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-600/30' 
                : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-600/30'
            }`}
          >
            {isSubmittingOrder ? (
              <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : isDigital ? (
              <>
                <Zap className="w-5 h-5" />
                <span>⚡ RECEVOIR MES ACCÈS IMMÉDIATEMENT (0 DH LIVRAISON)</span>
              </>
            ) : isService ? (
              <>
                <Sparkles className="w-5 h-5" />
                <span>🚀 CONFIRMER MA COMMANDE DE SERVICE</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>CONFIRMER MA COMMANDE (الدفع عند الاستلام)</span>
              </>
            )}
          </button>

          <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isDigital 
                ? 'Accès garanti 100% fonctionnel · Remplacement immédiat en cas de blocage' 
                : isService 
                ? 'Intervention de techniciens qualifiés · Suivi direct par WhatsApp' 
                : 'Paiement en espèces seulement après ouverture et vérification de votre colis'}
            </span>
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
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 sm:space-y-10 pb-24 relative">
      
      {/* Floating Recent Moroccan Buyer Toast Notification */}
      {showBuyerToast && RECENT_MOROCCAN_BUYERS[buyerIndex] && (
        <div className="fixed bottom-20 left-4 z-40 bg-slate-950/95 text-white border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-2xl text-xs flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300 max-w-[calc(100%-6.5rem)] sm:max-w-sm pointer-events-none">
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
            <img fetchPriority="high" decoding="async"
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
                  <img loading="lazy" decoding="async" src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Reassurance Badges */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
            {isDigital ? (
              <>
                <div className="p-3 bg-white border border-emerald-200/80 rounded-2xl shadow-xs space-y-1">
                  <Zap className="w-5 h-5 text-emerald-600 mx-auto" />
                  <div className="text-[11px] font-extrabold text-slate-900">En 2 Minutes</div>
                  <div className="text-[9px] text-slate-500">Livraison WhatsApp & Email</div>
                </div>
                <div className="p-3 bg-white border border-emerald-200/80 rounded-2xl shadow-xs space-y-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                  <div className="text-[11px] font-extrabold text-slate-900">Anti-Coupure</div>
                  <div className="text-[9px] text-slate-500">Garantie & SAV 24/7</div>
                </div>
                <div className="p-3 bg-white border border-emerald-200/80 rounded-2xl shadow-xs space-y-1">
                  <Sparkles className="w-5 h-5 text-blue-600 mx-auto" />
                  <div className="text-[11px] font-extrabold text-slate-900">Sans VPN</div>
                  <div className="text-[9px] text-slate-500">100% Officiel Maroc</div>
                </div>
              </>
            ) : isService ? (
              <>
                <div className="p-3 bg-white border border-purple-200/80 rounded-2xl shadow-xs space-y-1">
                  <Clock className="w-5 h-5 text-purple-600 mx-auto" />
                  <div className="text-[11px] font-extrabold text-slate-900">24h - 48h</div>
                  <div className="text-[9px] text-slate-500">Délai d'exécution</div>
                </div>
                <div className="p-3 bg-white border border-purple-200/80 rounded-2xl shadow-xs space-y-1">
                  <ShieldCheck className="w-5 h-5 text-purple-600 mx-auto" />
                  <div className="text-[11px] font-extrabold text-slate-900">Satisfait / Repris</div>
                  <div className="text-[9px] text-slate-500">Révisions incluses</div>
                </div>
                <div className="p-3 bg-white border border-purple-200/80 rounded-2xl shadow-xs space-y-1">
                  <UserCheck className="w-5 h-5 text-purple-600 mx-auto" />
                  <div className="text-[11px] font-extrabold text-slate-900">Expert Dédié</div>
                  <div className="text-[9px] text-slate-500">Accompagnement Pro</div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-md uppercase tracking-wider">
                {product.brand}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Réf: {activeSku}</span>
              {isDigital && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1 border border-emerald-300">
                  ⚡ {product.digitalSpecs?.digitalType === 'GAME_KEY' ? 'CLÉ CD JEU' : product.digitalSpecs?.digitalType === 'ACCOUNT' ? 'COMPTE PRIVÉ' : product.digitalSpecs?.digitalType === 'SOFTWARE' ? 'LOGICIEL' : product.digitalSpecs?.digitalType === 'SUBSCRIPTION' ? 'ABONNEMENT' : 'DIGITAL'}
                </span>
              )}
              {isService && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-md flex items-center gap-1 border border-purple-300">
                  🛠️ PRESTATION SERVICE
                </span>
              )}
              {product.subcategoryName && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
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
                {isPhysical && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${deliveryFee === 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-700 bg-slate-50 border-slate-200'}`}>
                    {deliveryFee === 0 ? '✓ Livraison Gratuite au Maroc' : `🚚 Livraison : ${formatMoney(deliveryFee)} (${selectedCity})`}
                  </span>
                )}
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

          {/* Model / colour: one compact row of chips */}
          {product.variants.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Modèle / coloris : <span className="text-blue-600">{activeVariant?.colorOption || activeVariant?.title}</span></span>
                {activeStock <= 0 ? (
                  <span className="text-rose-600">Rupture de stock</span>
                ) : activeStock <= 5 ? (
                  <span className="text-amber-700">Plus que {activeStock} en stock !</span>
                ) : (
                  <span className="text-emerald-700">✓ En stock</span>
                )}
              </div>
              {product.variants.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map(v => {
                    const isSelected = selectedVariantId === v.id;
                    const label = v.colorOption || v.title;
                    const c = label.toLowerCase();
                    const hexColor = v.colorHex || (
                      c.includes('noir') ? '#0f172a' : c.includes('blanc') ? '#f8fafc' : c.includes('bleu') ? '#1e3a8a' :
                      c.includes('vert') ? '#047857' : c.includes('or') || c.includes('gold') ? '#d97706' :
                      c.includes('argent') ? '#94a3b8' : c.includes('camel') ? '#b45309' : c.includes('rose') ? '#e11d48' : ''
                    );
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={v.stockQuantity <= 0}
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          if (v.imageUrl) {
                            const imgIdx = product.images.findIndex(img => img.imageUrl === v.imageUrl);
                            if (imgIdx >= 0) setSelectedImageIndex(imgIdx);
                          }
                          clientMovementService.trackClick(`Sélection Couleur: ${label}`, 'COLOR', {
                            productSlug: product.slug,
                            productName: product.name
                          });
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:line-through ${
                          isSelected ? 'border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-500/30' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {hexColor && <span className="w-3 h-3 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: hexColor }} />}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DURATION SELECTOR (FOR DIGITAL SUBSCRIPTIONS / KEYS / SOFTWARE) */}
          {isDigital && product.digitalSpecs?.durationOptions && product.digitalSpecs.durationOptions.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <label className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
                <span>Choisissez votre formule / durée :</span>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Livraison Moins 2 Min
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {product.digitalSpecs.durationOptions.map((opt) => {
                  const isSelected = (selectedDurationId || product.digitalSpecs?.durationOptions?.[0]?.id) === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedDurationId(opt.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {opt.badge && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md tracking-wider uppercase shadow-xs">
                          {opt.badge}
                        </span>
                      )}
                      <div className="text-xs font-black text-slate-900 line-clamp-1">{opt.label}</div>
                      <div className="text-base font-black text-emerald-800 mt-1">{formatMoney(opt.price)}</div>
                      {opt.compareAtPrice && opt.compareAtPrice > opt.price && (
                        <div className="text-[10px] text-slate-400 line-through">
                          {formatMoney(opt.compareAtPrice)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOP-UP DENOMINATIONS (FOR GAME TOP-UP / GIFT CARDS) */}
          {isDigital && product.digitalSpecs?.topUpDenominations && product.digitalSpecs.topUpDenominations.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <label className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
                <span>Sélectionnez votre recharge :</span>
                <span className="text-[11px] text-emerald-600 font-bold">Crédit Direct Garanti</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.digitalSpecs.topUpDenominations.map((denom) => {
                  const isSelected = (selectedDenomId || product.digitalSpecs?.topUpDenominations?.[0]?.id) === denom.id;
                  return (
                    <button
                      key={denom.id}
                      type="button"
                      onClick={() => setSelectedDenomId(denom.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {denom.discountBadge && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md tracking-wider uppercase shadow-xs">
                          {denom.discountBadge}
                        </span>
                      )}
                      <div className="text-xs font-black text-slate-900 line-clamp-1">{denom.amountLabel}</div>
                      {denom.bonus && <div className="text-[10px] text-emerald-600 font-bold">{denom.bonus}</div>}
                      <div className="text-base font-black text-emerald-800 mt-1">{formatMoney(denom.price)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ORDER FORM FIRST: the shopper can buy without scrolling */}
          {renderCodForm('top')}

          {/* Add to cart: compact secondary action under the order form */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
              <button
                type="button"
                onClick={() => setCustomQuantity(q => Math.max(1, q - 1))}
                disabled={customQuantity <= 1}
                className="w-8 h-9 flex items-center justify-center text-slate-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Diminuer la quantité"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-black text-sm text-slate-950">{customQuantity}</span>
              <button
                type="button"
                onClick={() => setCustomQuantity(q => Math.min(activeStock || 99, q + 1))}
                disabled={customQuantity >= (activeStock || 99)}
                className="w-8 h-9 flex items-center justify-center text-slate-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Augmenter la quantité"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isDigital && !isService && activeStock <= 0}
              className="flex-1 h-9 px-4 bg-white hover:bg-slate-50 border border-slate-900 text-slate-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ajouter au panier · {formatMoney(totalItemsPrice)}</span>
            </button>
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
                <img loading="lazy" decoding="async" src={product.images[0]?.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-slate-400">+</span>
              <div 
                onClick={() => navigateToProduct(companionProduct.slug)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:border-slate-400 transition-colors"
              >
                <img loading="lazy" decoding="async" src={companionProduct.images[0]?.imageUrl} alt="" className="w-full h-full object-cover" />
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

      {/* Description & Full Details avec Médias Riches (Images, GIFs, Vidéos) pour Mobile */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Détails & Caractéristiques du Produit
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60 hidden sm:inline-block">
            Expérience Mobile HD
          </span>
        </div>
        <RichProductDescription 
          description={product.description} 
          productName={product.name} 
        />
      </section>

      {/* Informations Techniques & Spécifications Adaptives */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          {isDigital ? <Zap className="w-5 h-5 text-emerald-600" /> : isService ? <Sparkles className="w-5 h-5 text-purple-600" /> : <Layers className="w-5 h-5 text-blue-600" />}
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            {isDigital ? 'Caractéristiques & Spécifications Digitales' : isService ? 'Détails & Modalités de la Prestation' : 'Informations & Fiche Technique'}
          </h2>
        </div>

        {isDigital ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type de Produit</div>
                <div className="text-xs font-black text-slate-900">
                  {product.digitalSpecs?.digitalType === 'GAME_KEY' ? 'Clé CD Officielle' : product.digitalSpecs?.digitalType === 'ACCOUNT' ? 'Compte Privé / Partagé' : product.digitalSpecs?.digitalType === 'SOFTWARE' ? 'Logiciel avec Licence' : product.digitalSpecs?.digitalType === 'SUBSCRIPTION' ? 'Abonnement Renouvelable' : 'Produit Digital'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mode d'accès</div>
                <div className="text-xs font-black text-slate-900">
                  {product.digitalSpecs?.sharingMethod === 'FULL_ACCESS' ? 'Accès Dédié 100% Personnel' : product.digitalSpecs?.sharingMethod === 'SHARED_ACCOUNT' ? 'Profil Privé avec Code PIN' : product.digitalSpecs?.sharingMethod === 'LICENSE_KEY' ? 'Clé Alphanumérique Unique' : product.digitalSpecs?.sharingMethod === 'FAMILY_INVITE' ? 'Invitation sur Compte Existant' : 'Activation Directe'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Délai d'envoi</div>
                <div className="text-xs font-black text-emerald-600 font-bold">{product.digitalSpecs?.deliveryTime || '⚡ Immédiat (Moins de 2 minutes)'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Garantie & Support</div>
                <div className="text-xs font-black text-slate-900">{product.digitalSpecs?.warrantyPeriod || 'Garantie anti-coupure & support 24/7'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Région / VPN</div>
                <div className="text-xs font-black text-slate-900">{product.digitalSpecs?.regionRestriction || 'Global / Sans VPN Requis'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appareils supportés</div>
                <div className="text-xs font-black text-slate-900">{(product.digitalSpecs?.supportedDevices || ['PC', 'Mac', 'Mobile', 'Console']).join(', ')}</div>
              </div>
            </div>

            {/* Included features list if available */}
            {product.digitalSpecs?.includedFeatures && product.digitalSpecs.includedFeatures.length > 0 && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-emerald-900">Avantages & Fonctionnalités inclus :</div>
                <div className="flex flex-wrap gap-2">
                  {product.digitalSpecs.includedFeatures.map((feat, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isService ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prestation</div>
                <div className="text-xs font-black text-slate-900">{product.serviceSpecs?.serviceType || 'Service Professionnel'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Délai d'exécution</div>
                <div className="text-xs font-black text-purple-700 font-bold">{product.serviceSpecs?.turnaroundTime || '24h - 48h ouvrées'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Révisions</div>
                <div className="text-xs font-black text-slate-900">{product.serviceSpecs?.revisions || 'Révisions incluses'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Garantie</div>
                <div className="text-xs font-black text-slate-900">{product.serviceSpecs?.guaranteeText || 'Satisfait ou ajusté'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1 col-span-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prérequis client</div>
                <div className="text-xs font-semibold text-slate-800">{product.serviceSpecs?.clientRequirements || 'Échange préalable via WhatsApp'}</div>
              </div>
            </div>

            {product.serviceSpecs?.deliverables && product.serviceSpecs.deliverables.length > 0 && (
              <div className="p-4 bg-purple-50/50 border border-purple-200/60 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-purple-900">Livrables fournis :</div>
                <div className="flex flex-wrap gap-2">
                  {product.serviceSpecs.deliverables.map((deliv, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-purple-300 text-purple-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs">
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                      {deliv}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}
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

      {/* Second order form at the bottom, for shoppers who read the description and reviews first */}
      <section className="max-w-2xl mx-auto w-full">
        {renderCodForm('bottom')}
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
