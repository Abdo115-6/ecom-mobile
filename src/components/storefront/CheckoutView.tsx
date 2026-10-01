import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { trackingService } from '../../services/trackingService';
import { clientMovementService } from '../../services/clientMovementService';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  MessageCircle 
} from 'lucide-react';
import { PaymentMethod } from '../../types/ecommerce';

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

  // City-specific delivery fee from admin settings
  const effectiveShippingFee = dbService.calculateDeliveryFee(city, cartSubtotal - cartDiscount);
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

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !city.trim() || !street.trim()) {
      alert("Veuillez renseigner toutes vos coordonnées de livraison.");
      return;
    }

    setIsSubmitting(true);

    const utm = trackingService.getUtm();

    // Create Order in DB Service
    const order = dbService.createOrder({
      customerId: "cust-" + Date.now(),
      customerName: fullName,
      customerEmail: `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      customerPhone: phone,
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
        phone,
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
        imageUrl: item.imageUrl
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
      }
    });

    clientMovementService.markAsPurchased(order.orderNumber, cartTotal);

    // Send the confirmation to the customer's WhatsApp number, not the store number.
    fetch('/api/whatsapp/order-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    }).catch((error) => console.warn('[v0] WhatsApp confirmation could not be sent:', error));

    setLastConfirmedOrder(order);
    clearCart();
    setIsSubmitting(false);
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
                  value={phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="Ex: 06 XX XX XX XX"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
                <Phone className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Le livreur vous appellera sur ce numéro pour la livraison.
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

        {/* Step 3: Payment Method */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base border-b border-slate-100 pb-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>3. {t.paymentMethod}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cash On Delivery (Selected by default) */}
            <div
              onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                paymentMethod === 'CASH_ON_DELIVERY'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-extrabold text-slate-900">{t.cashOnDelivery}</div>
                <div className="text-[10px] text-slate-500">Réglez en espèces au livreur après vérification</div>
              </div>
              {paymentMethod === 'CASH_ON_DELIVERY' && (
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />
              )}
            </div>

            {/* Credit Card */}
            <div
              onClick={() => setPaymentMethod('CREDIT_CARD')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                paymentMethod === 'CREDIT_CARD'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-extrabold text-slate-900">{t.creditCard}</div>
                <div className="text-[10px] text-slate-500">Paiement 3D Secure sécurisé CMI / Visa / Mastercard</div>
              </div>
              {paymentMethod === 'CREDIT_CARD' && (
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />
              )}
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
