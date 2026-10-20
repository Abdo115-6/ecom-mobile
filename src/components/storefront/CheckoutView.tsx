import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { trackingService } from '../../services/trackingService';
import { clientMovementService } from '../../services/clientMovementService';
import { 
  ShieldCheck, 
  Truck, 
  Banknote, 
  CheckCircle2, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  MessageCircle 
} from 'lucide-react';
import { PaymentMethod } from '../../types/ecommerce';
import { normalizeMoroccanPhone, PHONE_ERROR_MESSAGE } from '../../services/phone';

export const CheckoutView: React.FC = () => {
  const { 
    cartItems, 
    cartSubtotal, 
    cartDiscount, 
    cartShippingFee, 
    cartTotal, 
    currency, 
    formatMoney, 
    clearCart, 
    setLastConfirmedOrder, 
    setCurrentView,
    appliedCouponCode,
    hasFreeShippingCoupon,
    t 
  } = useApp();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [street, setStreet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState(false);
  // Blocks a second order when an impatient double-tap fires before React re-renders
  const submittingRef = React.useRef(false);

  // InitiateCheckout (browser pixels + Conversions API, shared event_id)
  React.useEffect(() => {
    if (cartItems.length > 0) {
      trackingService.track('begin_checkout', {
        value: cartTotal,
        currency: currency || 'MAD',
        items: cartItems.map(i => ({ id: i.productId, name: i.productName, price: i.price, quantity: i.quantity }))
      });
    }
  }, []);

  const handleFieldChange = (field: 'fullName' | 'phone' | 'city' | 'street', value: string) => {
    if (field === 'fullName') setFullName(value);
    if (field === 'phone') setPhone(value);
    if (field === 'city') setCity(value);
    if (field === 'street') setStreet(value);

    clientMovementService.captureFormInput({
      fullName: field === 'fullName' ? value : fullName,
      phone: field === 'phone' ? value : phone,
      city: field === 'city' ? value : city,
      address: field === 'street' ? value : street,
    });
  };

  // City-specific (or product-specific) delivery fee from admin settings
  const effectiveShippingFee = hasFreeShippingCoupon
    ? 0
    : dbService.calculateDeliveryFee(city, cartSubtotal - cartDiscount, cartItems.map(i => i.productId));
  const effectiveTotal = Math.max(0, cartSubtotal - cartDiscount + effectiveShippingFee);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Votre panier est vide</h2>
        <button
          onClick={() => setCurrentView('catalog')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setFormError(null);
    if (!fullName.trim() || !phone.trim() || !city.trim() || !street.trim()) {
      setFormError("Veuillez renseigner toutes vos coordonnées de livraison.");
      return;
    }
    const cleanPhone = normalizeMoroccanPhone(phone);
    if (!cleanPhone) {
      setPhoneError(true);
      setFormError(PHONE_ERROR_MESSAGE);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const utm = trackingService.getUtm();

    // Create Order in DB Service
    const order = dbService.createOrder({
      customerId: "cust-" + Date.now(),
      customerName: fullName,
      customerEmail: `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      customerPhone: cleanPhone,
      status: "PENDING",
      currency,
      subtotal: cartSubtotal,
      discountAmount: cartDiscount,
      shippingFee: effectiveShippingFee,
      taxAmount: 0,
      totalAmount: effectiveTotal,
      couponCode: appliedCouponCode || undefined,
      shippingAddress: {
        fullName,
        phone: cleanPhone,
        street,
        city,
        country: "Maroc"
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PAID',
      shipment: {
        carrier: "ShopMe Express Maroc",
        status: "Colis en attente de préparation",
      },
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.productId,
        variantTitle: item.variantTitle,
        unitPrice: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        imageUrl: item.imageUrl,
        packPieces: item.packPieces || 1
      })),
      utmSource: utm.source,
      utmCampaign: utm.campaign,
      notes
    });

    // Centralized Event Tracking: Track purchase with unique event_id and deduplication
    trackingService.track('purchase', {
      value: effectiveTotal,
      currency,
      orderId: order.orderNumber,
      items: cartItems.map(item => ({
        id: item.productId,
        name: item.productName,
        price: item.price,
        quantity: item.quantity,
        variant: item.variantTitle
      })),
      metadata: {
        paymentMethod,
        shippingCity: city,
        utmSource: utm.source,
        utmCampaign: utm.campaign
      },
      // Hashed server-side for Meta/TikTok match quality, never stored
      customer: {
        phone: cleanPhone,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' ') || undefined,
        city
      }
    });

    clientMovementService.markAsPurchased(order.orderNumber, cartTotal);

    // Give a slow connection a few seconds to deliver the order; if it can't, it stays queued
    // on the phone and the confirmation page offers to send it by WhatsApp
    await dbService.confirmOrderSynced(order.id, 8000);

    setLastConfirmedOrder(order);
    clearCart();
    submittingRef.current = false;
    setIsSubmitting(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setCurrentView('order-confirmation');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setCurrentView('cart')}
          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{t.checkout}</h1>
          <p className="text-xs text-slate-500">Validation rapide en 1 étape · Sans création de compte obligatoire</p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-6">
        
        {/* Step 1: Customer Contact & Shipping Address */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base border-b border-slate-100 pb-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>1. {t.shippingAddress}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {t.fullName} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  value={fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  placeholder="Ex: Karim Benjelloun"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {t.phoneNumber} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  value={phone}
                  onChange={(e) => { setPhoneError(false); handleFieldChange('phone', e.target.value); }}
                  onBlur={() => setPhoneError(phone.trim() !== '' && !normalizeMoroccanPhone(phone))}
                  aria-invalid={phoneError}
                  placeholder="Ex: 06 XX XX XX XX"
                  className={`w-full p-3 bg-slate-50 border rounded-xl ${phoneError ? 'border-rose-400' : 'border-slate-200'} text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white`}
                />
                <Phone className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className={`text-[10px] mt-1 block ${phoneError ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                {phoneError ? PHONE_ERROR_MESSAGE : 'Le livreur vous appellera sur ce numéro pour la livraison.'}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {t.city} <span className="text-rose-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white cursor-pointer"
              >
                <option value="Casablanca">Casablanca</option>
                <option value="Rabat">Rabat / Salé</option>
                <option value="Marrakech">Marrakech</option>
                <option value="Tanger">Tanger</option>
                <option value="Fès">Fès</option>
                <option value="Agadir">Agadir</option>
                <option value="Autre ville">Autre ville du Maroc</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {t.street} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoComplete="street-address"
                enterKeyHint="done"
                value={street}
                onChange={(e) => handleFieldChange('street', e.target.value)}
                placeholder="Quartier, Rue, N° d'immeuble ou maison"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Instructions pour le livreur (Optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Livrer après 17h, sonner à la porte gauche"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Step 2: Shipping Option */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base border-b border-slate-100 pb-3">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>2. Mode de Livraison</span>
          </div>

          <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">ShopMe Express Logistics (24h - 48h)</div>
                <div className="text-[11px] text-slate-500">Livraison à domicile en main propre à {city} avec suivi SMS/WhatsApp</div>
              </div>
            </div>
            <div className="text-xs font-black text-slate-900">
              {effectiveShippingFee === 0 ? 'Gratuite' : formatMoney(effectiveShippingFee)}
            </div>
          </div>
        </div>

        {/* Step 3: Payment Method - Cash On Delivery Exclusively */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base border-b border-slate-100 pb-3">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span>3. {t.paymentMethod}</span>
          </div>

          <div>
            {/* Cash On Delivery (Selected) */}
            <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Banknote className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <span>{t.cashOnDelivery}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    الدفع عند الاستلام
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Paiement sécurisé en espèces auprès du livreur après vérification complète de votre colis
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Order Summary & Submit Button */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.orderSummary}</h3>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Articles ({cartItems.length})</span>
              <span className="font-semibold text-white">{formatMoney(cartSubtotal)}</span>
            </div>

            {cartDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Réduction coupon ({appliedCouponCode})</span>
                <span>-{formatMoney(cartDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>{t.shipping} ({city})</span>
              <span className="font-semibold text-white">
                {effectiveShippingFee === 0 ? 'Offerte' : formatMoney(effectiveShippingFee)}
              </span>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-between text-base sm:text-lg font-black text-white">
              <span>{t.total} (Paiement Livraison)</span>
              <span className="text-amber-400 font-mono text-xl">{formatMoney(effectiveTotal)}</span>
            </div>
          </div>

          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs font-semibold">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-slate-950 font-black rounded-2xl transition-all shadow-lg text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-slate-950" />
            <span>{isSubmitting ? 'Traitement en cours...' : t.placeOrder}</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            En confirmant votre commande, vous acceptez nos conditions générales de vente. Vos données sont protégées et ne sont jamais revendues.
          </p>
        </div>

      </form>

    </div>
  );
};
