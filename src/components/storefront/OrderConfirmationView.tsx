import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Product } from '../../types/ecommerce';
import { 
  CheckCircle2, 
  Truck, 
  Home, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  PhoneCall, 
  PackageOpen, 
  Banknote, 
  MessageCircle, 
  Sparkles, 
  ArrowRight, 
  ShoppingBag,
  Gift,
  MapPin,
  Phone
} from 'lucide-react';

export const OrderConfirmationView: React.FC = () => {
  const { 
    lastConfirmedOrder, 
    setLastConfirmedOrder, 
    setCurrentView, 
    navigateToProduct,
    formatMoney, 
    t 
  } = useApp();

  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  // Instant scroll-to-top on mount to guarantee it appears near the navbar, not the footer
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Background polling: syncs live order status seamlessly
  useEffect(() => {
    if (!lastConfirmedOrder) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            const found = data.orders.find((o: any) => o.id === lastConfirmedOrder.id);
            if (
              found && 
              (found.status !== lastConfirmedOrder.status || 
               found.whatsappConfirmation?.isConfirmed !== lastConfirmedOrder.whatsappConfirmation?.isConfirmed)
            ) {
              setLastConfirmedOrder(found);
            }
          }
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [lastConfirmedOrder?.id]);

  // Load complementary Moroccan bestsellers for post-purchase discovery
  useEffect(() => {
    const prods = dbService.getProducts({ status: 'ACTIVE' });
    const currentItemIds = new Set(lastConfirmedOrder?.items.map(i => i.productId) || []);
    const filtered = prods.filter(p => !currentItemIds.has(p.id)).slice(0, 4);
    setRecommendedProducts(filtered.length > 0 ? filtered : prods.slice(0, 4));
  }, [lastConfirmedOrder]);

  const handleCopyOrderNumber = () => {
    if (!lastConfirmedOrder) return;
    navigator.clipboard?.writeText(lastConfirmedOrder.orderNumber);
    setCopiedOrderNumber(true);
    setTimeout(() => setCopiedOrderNumber(false), 2000);
  };

  const handleCopyCoupon = () => {
    navigator.clipboard?.writeText('MERCI10');
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  if (!lastConfirmedOrder) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Aucune commande récente</h2>
        <p className="text-xs text-slate-500">Vous n'avez pas encore passé de commande lors de cette session.</p>
        <button
          onClick={() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            setCurrentView('home');
          }}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md hover:bg-slate-800 transition-colors"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  const customerName = lastConfirmedOrder.customerName || lastConfirmedOrder.shippingAddress?.fullName || 'Cher Client';
  const customerCity = lastConfirmedOrder.shippingAddress?.city || 'Maroc';
  const isConfirmed = lastConfirmedOrder.whatsappConfirmation?.isConfirmed || lastConfirmedOrder.status === 'CONFIRMED';
  const isCancelled = lastConfirmedOrder.status === 'CANCELLED';

  const storePhone = dbService.settings.whatsappPhoneNumber || '+212 668-381916';
  const cleanStorePhone = storePhone.replace(/[^0-9]/g, '');
  const supportWhatsAppUrl = `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(
    `Salam ShopMe Maroc ! 👋 J'ai une question concernant ma commande #${lastConfirmedOrder.orderNumber} (Nom : ${customerName}). Merci !`
  )}`;

  return (
    <div className="pt-4 sm:pt-6 pb-20 max-w-4xl mx-auto px-4 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Celebratory Hero Banner (Babouti.ma Creative Style) */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl">
        {/* Subtle decorative glow circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-3.5 max-w-2xl mx-auto">
          
          {/* Celebratory Icon Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg animate-bounce duration-1000">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>

          {/* Dual Moroccan Greeting */}
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold tracking-wide border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Commande Reçue · Livraison 24h-48h au Maroc 🇲🇦</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight pt-1">
              مبروك عليك ! Commande Validée
            </h1>
            <p className="text-sm sm:text-base text-emerald-50 font-medium">
              Merci <strong className="text-white font-extrabold">{customerName}</strong>, votre commande a été transmise à notre service logistique.
            </p>
          </div>

          {/* Interactive Order Number Bar */}
          <div className="bg-black/25 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm mt-2 shadow-inner">
            <span className="text-emerald-100 font-medium">Numéro de Commande :</span>
            <span className="font-mono font-black text-white text-base tracking-wider">
              {lastConfirmedOrder.orderNumber}
            </span>
            <button
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
              title="Copier le numéro de commande"
            >
              {copiedOrderNumber ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-200">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* 2. 4-Step Moroccan Delivery Journey (Reassurance Process) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>Que va-t-il se passer maintenant ? (Prochaines étapes)</span>
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
            Processus 100% Transparent
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          
          {/* Step 1 */}
          <div className="bg-slate-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              1
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900">Commande Enregistrée</div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Vos articles sont réservés et en préparation immédiate dans notre entrepôt central.
            </p>
            <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
              <Check className="w-3 h-3" />
              <span>Étape validée</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
              2
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <span>Appel / WhatsApp</span>
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Notre équipe vous contacte brièvement pour coordonner le moment idéal de livraison à {customerCity}.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
              3
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <span>Expédition Express</span>
              <Truck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Livraison sous 24h à 48h ouvrables directement à votre domicile ou lieu de travail.
            </p>
          </div>

          {/* Step 4: The Golden Moroccan Guarantee */}
          <div className="bg-emerald-50/80 border-2 border-emerald-500/40 rounded-2xl p-4 space-y-2 relative shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              4
            </div>
            <div className="font-bold text-xs sm:text-sm text-emerald-900 flex items-center gap-1.5">
              <span>Vérification & Paiement</span>
              <PackageOpen className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              <strong className="text-emerald-950 font-extrabold">Ouvrez et vérifiez votre colis</strong> devant le livreur avant de régler le montant en espèces.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Moroccan COD Trust Badges (Inspired by Babouti.ma Guarantees) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center space-y-1 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <PackageOpen className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-slate-900">Ouverture avant Paiement</div>
          <p className="text-[10px] text-slate-500">Contrôlez vos articles en toute confiance</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center space-y-1 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-slate-900">Livraison 24h/48h</div>
          <p className="text-[10px] text-slate-500">Partout au Maroc avec suivi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center space-y-1 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-slate-900">Échange sous 7 Jours</div>
          <p className="text-[10px] text-slate-500">Service après-vente garanti</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center space-y-1 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <Banknote className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-slate-900">Paiement à la Livraison</div>
          <p className="text-[10px] text-slate-500">0 DH avancé, payez en cash</p>
        </div>
      </div>

      {/* 4. Complete Invoice / Order Summary Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs text-slate-400">Récapitulatif Officiel</div>
            <div className="text-base sm:text-lg font-black text-slate-900">Détails de votre commande</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 font-bold rounded-xl text-xs flex items-center gap-1.5 ${
              isConfirmed 
                ? 'bg-emerald-100 text-emerald-800' 
                : isCancelled 
                ? 'bg-rose-100 text-rose-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>{isConfirmed ? 'CONFIRMÉE ✅' : isCancelled ? 'ANNULÉE ❌' : 'EN PRÉPARATION LOGISTIQUE'}</span>
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Articles commandés ({lastConfirmedOrder.items.reduce((acc, i) => acc + i.quantity, 0)})
          </div>
          <div className="divide-y divide-slate-100">
            {lastConfirmedOrder.items.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate text-xs sm:text-sm">{item.productName}</div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                      <span>Quantité : <strong className="text-slate-800">{item.quantity}</strong></span>
                      {item.variantTitle && (
                        <>
                          <span>·</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-medium">
                            {item.variantTitle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="font-extrabold text-slate-900 text-sm shrink-0">
                  {formatMoney(item.subtotal)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address & Contact details */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Adresse de livraison</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">{lastConfirmedOrder.shippingAddress.fullName}</div>
            <div className="text-slate-600">{lastConfirmedOrder.shippingAddress.street}</div>
            <div className="font-bold text-emerald-800">{lastConfirmedOrder.shippingAddress.city}, Maroc 🇲🇦</div>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Téléphone joignable</span>
            </div>
            <div className="font-mono font-bold text-slate-900 text-sm">{lastConfirmedOrder.shippingAddress.phone}</div>
            <p className="text-[11px] text-slate-500">
              Le livreur vous contactera sur ce numéro avant son passage.
            </p>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Sous-total articles</span>
            <span className="font-bold text-slate-800">{formatMoney(lastConfirmedOrder.subtotal || lastConfirmedOrder.totalAmount)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Frais de livraison ({customerCity})</span>
            {lastConfirmedOrder.shippingFee === 0 ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                Gratuite 🎁
              </span>
            ) : (
              <span className="font-bold text-slate-800">{formatMoney(lastConfirmedOrder.shippingFee)}</span>
            )}
          </div>

          <div className="flex justify-between">
            <span>Mode de paiement</span>
            <span className="font-semibold text-slate-900">Paiement en espèces à la livraison (COD)</span>
          </div>

          <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 pt-3 border-t border-slate-200">
            <span>Total à régler au livreur</span>
            <span className="text-emerald-700 text-lg sm:text-xl">{formatMoney(lastConfirmedOrder.totalAmount)}</span>
          </div>
        </div>

      </div>

      {/* 5. Moroccan VIP Loyalty Reward Gift (Babouti.ma Creative Style) */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-300/60 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Gift className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-black text-slate-900">
              🎁 Cadeau VIP pour votre prochaine commande !
            </div>
            <p className="text-xs text-slate-600">
              Profitez de <strong className="text-amber-800 font-bold">-10% de réduction immédiate</strong> avec votre code promo exclusif.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyCoupon}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          {copiedCoupon ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-white">Code MERCI10 Copié !</span>
            </>
          ) : (
            <>
              <span>Code : <strong>MERCI10</strong></span>
              <Copy className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* 6. Direct Moroccan WhatsApp Concierge Assistance */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <MessageCircle className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-slate-900">
              Une question ou une modification d'adresse ?
            </div>
            <p className="text-[11px] text-slate-500">
              Notre équipe est joignable sur WhatsApp au <strong className="font-mono text-slate-700">{storePhone}</strong>
            </p>
          </div>
        </div>

        <a
          href={supportWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-md shrink-0 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Assistance WhatsApp ShopMe</span>
        </a>
      </div>

      {/* 7. Action Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            setCurrentView('track-order');
          }}
          className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-colors text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          <span>Suivre l'acheminement en direct</span>
        </button>
        <button
          onClick={() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            setCurrentView('catalog');
          }}
          className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continuer mes achats</span>
        </button>
      </div>

      {/* 8. Babouti-Style Post-Purchase Cross-Sell / Recommendations ("Nos clients ont aussi aimé") */}
      {recommendedProducts.length > 0 && (
        <div className="pt-6 space-y-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Nos clients ont également commandé
              </h3>
              <p className="text-xs text-slate-500">Sélection de nouveautés et coups de cœur tendance au Maroc</p>
            </div>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                setCurrentView('catalog');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {recommendedProducts.map(p => (
              <div 
                key={p.id}
                onClick={() => {
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  navigateToProduct(p.slug);
                }}
                className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 space-y-2 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative">
                  <img 
                    src={p.images[0]?.imageUrl} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {p.compareAtPrice && p.compareAtPrice > p.price && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black">
                      Promo
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {p.name}
                  </h4>
                  <div className="text-xs font-black text-emerald-700">
                    {formatMoney(p.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
