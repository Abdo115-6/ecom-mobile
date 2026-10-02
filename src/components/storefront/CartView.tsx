import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  Truck, 
  ShieldCheck, 
  Check, 
  X 
} from 'lucide-react';

export const CartView: React.FC = () => {
  const { 
    cartItems, 
    updateCartQuantity, 
    removeFromCart, 
    cartSubtotal, 
    cartDiscount, 
    cartShippingFee, 
    cartTotal, 
    appliedCouponCode, 
    applyCoupon, 
    removeCoupon, 
    formatMoney, 
    setCurrentView,
    t 
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const freeShippingThreshold = dbService.settings.freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError(null);
      setCouponInput('');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{t.emptyCart}</h2>
        <p className="text-xs text-slate-500">
          Découvrez notre catalogue pour trouver des articles qui correspondent à vos besoins.
        </p>
        <button
          onClick={() => setCurrentView('catalog')}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
        >
          {t.continueShopping}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{t.cart}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {cartItems.length} article{cartItems.length > 1 ? 's' : ''} dans votre panier
        </p>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>
              {remainingForFreeShipping > 0
                ? t.freeShippingAbove.replace('{amount}', formatMoney(remainingForFreeShipping))
                : t.freeShippingUnlocked}
            </span>
          </div>
          <span className="text-slate-500 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              remainingForFreeShipping === 0 ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Items List */}
        <div className="md:col-span-2 space-y-3">
          {cartItems.map(item => (
            <div
              key={item.id}
              className="p-3 sm:p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-xs"
            >
              {/* Product Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.productName}</h3>
                {item.variantTitle && (
                  <p className="text-[11px] text-slate-500">{item.variantTitle}</p>
                )}
                <div className="text-xs sm:text-sm font-black text-slate-900 mt-1">
                  {formatMoney(item.price)}
                </div>

                {/* Mobile controls */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Coupon */}
        <div className="space-y-4">
          
          {/* Coupon Code Section */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.applyCoupon}</span>
            </div>

            {appliedCouponCode ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{appliedCouponCode}</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={t.couponPlaceholder}
                    className="flex-1 p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {t.applyCoupon}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-500 font-medium">{couponError}</p>
                )}
                <div className="text-[10px] text-slate-400">
                  Codes test disponibles : <strong>WELCOME10</strong> (-10%), <strong>FLASH50</strong> (-50 DH), <strong>FREESHIP</strong>
                </div>
              </form>
            )}
          </div>

          {/* Totals Breakdown */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t.orderSummary}</h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="font-semibold text-slate-900">{formatMoney(cartSubtotal)}</span>
              </div>

              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>{t.discount}</span>
                  <span>-{formatMoney(cartDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{t.shipping}</span>
                <span className="font-semibold text-slate-900">
                  {cartShippingFee === 0 ? 'Gratuite' : formatMoney(cartShippingFee)}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm sm:text-base font-black text-slate-900">
                <span>{t.total}</span>
                <span>{formatMoney(cartTotal)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => setCurrentView('checkout')}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <span>{t.checkout}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paiement sécurisé à la livraison partout au Maroc</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
