import React from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { CheckCircle2, MessageCircle, Package, Truck, ArrowRight, Home } from 'lucide-react';
import { whatsappService } from '../../services/whatsappService';

export const OrderConfirmationView: React.FC = () => {
  const { lastConfirmedOrder, setLastConfirmedOrder, setCurrentView, formatMoney, t } = useApp();

  if (!lastConfirmedOrder) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Aucune commande récente</h2>
        <button
          onClick={() => setCurrentView('home')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const whatsappLink = whatsappService.generateOrderConfirmationLink(lastConfirmedOrder);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 pb-24 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t.orderSuccessTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          {t.orderSuccessMsg} Votre colis est en cours de préparation par notre équipe logistique.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="text-xs text-slate-400">Numéro de Commande</div>
            <div className="text-base font-black text-slate-900">{lastConfirmedOrder.orderNumber}</div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs">
            {lastConfirmedOrder.status}
          </span>
        </div>

        {/* WhatsApp Notification & Confirmation CTA */}
        <div className={`p-4 rounded-2xl border transition-all ${
          lastConfirmedOrder.whatsappConfirmation?.isConfirmed || lastConfirmedOrder.status === 'CONFIRMED'
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageCircle className="w-6 h-6 fill-white text-emerald-600" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
                  <span>Confirmation de commande par WhatsApp</span>
                  {(lastConfirmedOrder.whatsappConfirmation?.isConfirmed || lastConfirmedOrder.status === 'CONFIRMED') && (
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                      ✓ Validée
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {lastConfirmedOrder.whatsappConfirmation?.isConfirmed || lastConfirmedOrder.status === 'CONFIRMED'
                    ? "Votre commande est officiellement confirmée ! Le livreur vous contactera par téléphone pour convenir de l'heure de livraison."
                    : "Recevez les informations de suivi et confirmez l'envoi express de votre colis par message."}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto shrink-0">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  dbService.confirmOrderViaWhatsApp(lastConfirmedOrder.id);
                  setLastConfirmedOrder({
                    ...lastConfirmedOrder,
                    status: 'CONFIRMED',
                    whatsappConfirmation: {
                      isConfirmed: true,
                      confirmedAt: new Date().toISOString(),
                      customerPhone: lastConfirmedOrder.customerPhone,
                      sentMessageText: "Confirmation commande ShopMe",
                      replyMessageText: "Salam ShopMe, je confirme ma commande ! Merci 🙏",
                      messageTimestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                      replyTimestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                      channel: 'WHATSAPP_BOT'
                    }
                  });
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Envoyer Accord WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              {(!lastConfirmedOrder.whatsappConfirmation?.isConfirmed && lastConfirmedOrder.status !== 'CONFIRMED') && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = dbService.confirmOrderViaWhatsApp(lastConfirmedOrder.id);
                    if (updated) {
                      setLastConfirmedOrder({ ...updated });
                    }
                  }}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ✓ Simuler Accord 1-Clic
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Articles commandés</h3>
          <div className="divide-y divide-slate-100">
            {lastConfirmedOrder.items.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    <div className="text-slate-400 text-[10px]">Qté : {item.quantity} · {item.variantTitle || ''}</div>
                  </div>
                </div>
                <div className="font-bold text-slate-900">{formatMoney(item.subtotal)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery info */}
        <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-700 border border-slate-100">
          <div className="font-bold text-slate-900">Adresse de livraison :</div>
          <div>{lastConfirmedOrder.shippingAddress.fullName} · {lastConfirmedOrder.shippingAddress.phone}</div>
          <div>{lastConfirmedOrder.shippingAddress.street}, {lastConfirmedOrder.shippingAddress.city}</div>
        </div>

        {/* Total breakdown */}
        <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Mode de paiement</span>
            <span className="font-semibold text-slate-900">Paiement à la livraison</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-100">
            <span>Total réglé / à régler</span>
            <span className="text-emerald-700">{formatMoney(lastConfirmedOrder.totalAmount)}</span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setCurrentView('track-order')}
          className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-colors text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          <span>Suivre l'acheminement du colis</span>
        </button>
        <button
          onClick={() => setCurrentView('home')}
          className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Retourner à l'accueil</span>
        </button>
      </div>

    </div>
  );
};
