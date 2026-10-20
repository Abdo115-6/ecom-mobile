import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { clientMovementService } from '../../services/clientMovementService';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  ChevronRight,
  PackageCheck,
  Gift,
  Check
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { 
    isCartDrawerOpen, 
    closeCartDrawer, 
    cartItems, 
    updateCartQuantity, 
    updateCartItem,
    removeFromCart, 
    cartSubtotal, 
    cartDiscount, 
    cartShippingFee, 
    cartFreeShippingThreshold,
    cartTotal, 
    formatMoney, 
    setCurrentView,
    navigateToProduct,
    cartItemCount,
    t 
  } = useApp();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartDrawerOpen) {
        closeCartDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartDrawerOpen, closeCartDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartDrawerOpen]);

  if (!isCartDrawerOpen) return null;

  const freeShippingThreshold = cartFreeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const progressPercent = freeShippingThreshold > 0 ? Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100)) : 0;

  const handleProceedToCheckout = () => {
    clientMovementService.trackClick('Acheter Maintenant depuis Panier Drawer', 'CTA', {
      productName: 'Panier Checkout'
    });
    closeCartDrawer();
    setCurrentView('checkout');
  };

  const handleViewFullCart = () => {
    closeCartDrawer();
    setCurrentView('cart');
  };

  const handleProductClick = (slug: string) => {
    closeCartDrawer();
    navigateToProduct(slug);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="cart-drawer-title" role="dialog" aria-modal="true">
      {/* Backdrop overlay with blur */}
      <div 
        onClick={closeCartDrawer}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
          
          {/* Drawer Top Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 id="cart-drawer-title" className="text-base font-extrabold text-slate-950 flex items-center gap-2">
                  <span>Votre Panier</span>
                  <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {cartItemCount}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Paiement Cash à la livraison (COD)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCartDrawer}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {cartItems.length > 0 && freeShippingThreshold > 0 && (
            <div className="px-5 py-3 bg-emerald-50/60 border-b border-emerald-100">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">
                    {remainingForFreeShipping > 0
                      ? `Plus que ${formatMoney(remainingForFreeShipping)} pour la livraison gratuite !`
                      : '🎉 Félicitations ! Livraison 100% offerte partout au Maroc !'}
                  </span>
                </div>
                <span className="text-[10px] font-black text-emerald-700">{progressPercent}%</span>
              </div>
              <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Drawer Body: Products in Cart */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">Votre panier est vide</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Ajoutez vos articles préférés pour commander rapidement avec paiement à la livraison.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeCartDrawer();
                    setCurrentView('catalog');
                  }}
                  className="px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>Découvrir la boutique</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex gap-3.5 items-start">
                    {/* Thumbnail */}
                    <div 
                      onClick={() => handleProductClick(item.productSlug)}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.productName} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 
                          onClick={() => handleProductClick(item.productSlug)}
                          className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors"
                        >
                          {item.productName}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Supprimer cet article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant/Option Badge & Pack Details */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {item.packPieces && item.packPieces > 1 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            📦 {item.packTitle || `Pack ${item.packPieces} Pièces`}
                            <span className="text-emerald-600 font-bold">({item.quantity * item.packPieces} pcs)</span>
                          </span>
                        ) : null}
                        {item.variantTitle && (!item.packPieces || item.packPieces <= 1 || !item.variantTitle.startsWith('Pack')) && (
                          <span className="inline-block text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.variantTitle}
                          </span>
                        )}
                      </div>

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="text-xs sm:text-sm font-black text-slate-950">
                            {formatMoney(item.price * item.quantity)}
                          </div>
                          {item.packPieces && item.packPieces > 1 ? (
                            <div className="text-[10px] font-semibold text-emerald-700">
                              Soit {formatMoney(item.pieceUnitPrice || (item.price / item.packPieces))} / pièce
                              {item.quantity > 1 && (
                                <span className="text-slate-400 font-normal ml-1">
                                  ({formatMoney(item.price)}/pack)
                                </span>
                              )}
                            </div>
                          ) : item.quantity > 1 ? (
                            <div className="text-[10px] font-semibold text-slate-400">
                              ({formatMoney(item.price)} / pièce)
                            </div>
                          ) : null}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-l-lg transition-colors cursor-pointer"
                            aria-label="Diminuer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <div className="px-1.5 min-w-[32px] text-center">
                            <span className="font-black text-xs text-slate-900 block leading-tight">
                              {item.quantity}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none block">
                              {item.packPieces && item.packPieces > 1 ? 'pack' : 'qté'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-r-lg transition-colors cursor-pointer"
                            aria-label="Augmenter"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* In-Cart Pack Chooser (Customer can choose packs directly inside Panier!) */}
                      {(() => {
                        const prod = dbService.getProductById(item.productId);
                        if (!prod || prod.productKind === 'DIGITAL' || prod.productKind === 'SERVICE' || prod.categoryId === 'cat-digital' || prod.categoryId === 'cat-services') {
                          return null;
                        }

                        const rawPacks: any[] = (prod.promoPacks && prod.promoPacks.length > 0)
                          ? prod.promoPacks
                          : ((prod as any).promotionalPacks && (prod as any).promotionalPacks.length > 0)
                          ? (prod as any).promotionalPacks
                          : [];

                        const basePrice = prod.variants.find(v => v.id === item.variantId)?.price || prod.price;
                        const availablePacks = rawPacks.length > 0
                          ? rawPacks.map((p, idx) => {
                              const qty = Number(p.quantity) || (idx + 1);
                              const rawPPrice = p.price ?? p.packPrice;
                              const packPrice = typeof rawPPrice === 'number' && !isNaN(rawPPrice) ? rawPPrice : (qty * basePrice);
                              const savings = (qty * basePrice) > packPrice ? ((qty * basePrice) - packPrice) : 0;
                              return {
                                id: p.id || `pack-${qty}-${idx}`,
                                quantity: qty,
                                title: p.title || `Pack ${qty} Pièce${qty > 1 ? 's' : ''}`,
                                price: packPrice,
                                unitPrice: Math.round(packPrice / qty),
                                savings,
                                badge: p.badge || p.badgeText || (qty === 2 ? '-20% 🔥' : qty === 3 ? '1 Offert 🎁' : '')
                              };
                            })
                          : [
                              { id: 'p1', quantity: 1, title: '1 Pièce', price: basePrice, unitPrice: basePrice, savings: 0, badge: '' },
                              { id: 'p2', quantity: 2, title: 'Pack 2 Pièces', price: Math.round(basePrice * 2 * 0.8), unitPrice: Math.round(basePrice * 0.8), savings: Math.round(basePrice * 2 * 0.2), badge: '-20% 🔥' },
                              { id: 'p3', quantity: 3, title: 'Pack 3 Pièces', price: Math.round(basePrice * 2), unitPrice: Math.round(basePrice * 2 / 3), savings: basePrice, badge: '1 Gratuit 🎁' }
                            ];

                        const currentPackQty = item.packPieces || 1;

                        return (
                          <div className="pt-2 mt-2 border-t border-slate-100/90">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1.5">
                              <span className="flex items-center gap-1 text-slate-800">
                                <Gift className="w-3 h-3 text-emerald-600" />
                                <span>Choisir un Pack :</span>
                              </span>
                              <span className="text-emerald-700 font-extrabold text-[9px]">
                                {currentPackQty > 1 ? `✓ Pack ${currentPackQty} actif` : 'Économies disponibles'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {availablePacks.map(p => {
                                const isCurrent = currentPackQty === p.quantity;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      updateCartItem(item.id, {
                                        price: p.price,
                                        packPieces: p.quantity,
                                        packTitle: p.title,
                                        pieceUnitPrice: p.unitPrice,
                                        savingsAmount: p.savings,
                                        variantTitle: p.quantity > 1 ? `${p.title} (${p.quantity} pcs)` : undefined
                                      });
                                    }}
                                    className={`py-1.5 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                                      isCurrent
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-1 ring-emerald-500/30'
                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium'
                                    }`}
                                  >
                                    <div className="text-[10px] leading-tight truncate">{p.title}</div>
                                    <div className="text-[11px] font-black mt-0.5">{formatMoney(p.price)}</div>
                                    {p.badge && (
                                      <div className="text-[8px] text-emerald-700 font-extrabold uppercase truncate">{p.badge}</div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer with Subtotal and "Acheter maintenant" Button */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50/90 space-y-3 shadow-lg">
              
              {/* Financial Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total ({cartItemCount} article{cartItemCount > 1 ? 's' : ''})</span>
                  <span className="font-bold text-slate-900">{formatMoney(cartSubtotal)}</span>
                </div>

                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Remise</span>
                    <span>-{formatMoney(cartDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Livraison partout au Maroc</span>
                  <span className="font-bold text-emerald-700">
                    {cartShippingFee === 0 ? 'GRATUITE (0 DH)' : formatMoney(cartShippingFee)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-black text-slate-950">
                  <span>Total Net à Régler</span>
                  <span className="text-xl text-emerald-800 font-mono font-black">
                    {formatMoney(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Primary "Acheter maintenant" (Buy Now) Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Acheter maintenant (الدفع عند الاستلام)</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Reassurance Badge */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Paiement en espèces seulement après vérification de votre colis</span>
              </div>

              {/* Secondary Navigation Links */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleViewFullCart}
                  className="text-slate-600 hover:text-slate-900 font-semibold underline decoration-slate-300 underline-offset-4 cursor-pointer"
                >
                  Voir les détails du panier
                </button>
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Continuer mes achats
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
