import React from 'react';
import { Order } from '../../types/ecommerce';
import { 
  X, 
  CheckCheck, 
  Phone, 
  Video, 
  MoreVertical, 
  Printer, 
  MessageCircle, 
  ShieldCheck, 
  ExternalLink,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface WhatsAppConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onPrintTicket?: (order: Order) => void;
}

export const WhatsAppConfirmationModal: React.FC<WhatsAppConfirmationModalProps> = ({
  order,
  onClose,
  onPrintTicket
}) => {
  if (!order) return null;

  const conf = order.whatsappConfirmation;
  const customerName = order.customerName || order.shippingAddress.fullName;
  const customerPhone = order.customerPhone || order.shippingAddress.phone;
  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  const itemsText = order.items.map(i => `${i.productName} (x${i.quantity})`).join('\n• ');

  const defaultSentMessage = conf?.sentMessageText || 
    `Salam ${customerName} ! 👋\nMerci pour votre commande sur ShopMe Maroc 🇲🇦.\n\n📋 *Détails de la Commande #${order.orderNumber}* :\n• ${itemsText}\n\n💰 *Total à régler* : ${order.totalAmount.toFixed(2)} DH (Paiement Cash à la livraison)\n📍 *Adresse* : ${order.shippingAddress.street}, ${order.shippingAddress.city}\n\nVeuillez répondre « OUI » ou « JE CONFIRME » pour autoriser l'expédition express de votre colis.`;

  const defaultReplyMessage = conf?.replyMessageText || 
    `Salam ShopMe, oui je confirme ma commande ! Merci de l'envoyer au plus vite 🙏✅`;

  const timeSent = conf?.messageTimestamp || '10:15';
  const timeReply = conf?.replyTimestamp || '10:18';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl space-y-0 animate-in zoom-in-95">
        
        {/* Top Header of the Modal */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-extrabold text-white text-xs">Screen de Confirmation WhatsApp</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              {order.orderNumber}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp Mobile Chat Shell */}
        <div className="bg-[#0b141a] text-slate-100 flex flex-col font-sans select-none">
          
          {/* WhatsApp Chat Header */}
          <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-inner shrink-0">
                {customerName.charAt(0)}
              </div>
              <div className="leading-tight">
                <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="truncate max-w-[170px] sm:max-w-[200px]">{customerName}</span>
                  <span className="text-[10px]">🇲🇦</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-normal flex items-center gap-1">
                  <span>en ligne</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 font-mono text-[10px]">{customerPhone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <a 
                href={`https://wa.me/${cleanPhone}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Ouvrir dans WhatsApp"
                className="hover:text-emerald-400 transition-colors"
              >
                <Video className="w-4 h-4" />
              </a>
              <a 
                href={`tel:${cleanPhone}`} 
                title="Appeler le client"
                className="hover:text-emerald-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Chat Messages Body with WhatsApp Wallpaper pattern */}
          <div 
            className="p-3.5 space-y-3 min-h-[380px] max-h-[460px] overflow-y-auto flex flex-col justify-end"
            style={{
              backgroundColor: '#0b141a',
              backgroundImage: 'radial-gradient(#1f2c34 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          >
            {/* End to end encryption pill */}
            <div className="text-center my-1">
              <span className="bg-[#182229] text-[#ffd279] text-[10px] px-3 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-xs border border-amber-500/10 max-w-[90%]">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>Les messages sont chiffrés de bout en bout. Confirmation certifiée.</span>
              </span>
            </div>

            {/* Date Badge */}
            <div className="text-center my-1">
              <span className="bg-[#182229] text-slate-400 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Aujourd'hui
              </span>
            </div>

            {/* Outgoing Message from ShopMe Store Bot */}
            <div className="flex justify-end">
              <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-xs p-3 max-w-[85%] sm:max-w-[80%] shadow-md space-y-1.5 border border-emerald-500/20 text-xs">
                <div className="text-[10px] font-bold text-emerald-200 flex items-center justify-between pb-1 border-b border-emerald-400/20">
                  <span>ShopMe Maroc · Service Expéditions</span>
                  <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded font-mono">AUTOMATED</span>
                </div>
                <div className="whitespace-pre-line text-[11px] leading-relaxed">
                  {defaultSentMessage}
                </div>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/80 pt-1">
                  <span>{timeSent}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                </div>
              </div>
            </div>

            {/* Incoming Message from Customer (Confirmation reply) */}
            <div className="flex justify-start">
              <div className="bg-[#202c33] text-white rounded-2xl rounded-tl-xs p-3 max-w-[85%] sm:max-w-[80%] shadow-md space-y-1 border border-slate-700/50 text-xs">
                <div className="text-[10px] font-bold text-amber-300">
                  {customerName}
                </div>
                <div className="text-[12px] font-medium leading-relaxed text-slate-100">
                  {defaultReplyMessage}
                </div>
                <div className="flex items-center justify-end text-[9px] text-slate-400 pt-0.5">
                  <span>{timeReply}</span>
                </div>
              </div>
            </div>

            {/* Confirmation Verified Badge */}
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold block text-[11px]">Accord Client Validé sur WhatsApp</span>
                <span className="text-[10px] text-slate-400">Le client a confirmé le montant de {order.totalAmount} DH et la livraison à {order.shippingAddress.city}.</span>
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="p-3 bg-[#202c33] border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2 text-xs">
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Salam ${customerName}, votre commande #${order.orderNumber} est bien confirmée !`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>Ouvrir sur WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {onPrintTicket && (
              <button
                onClick={() => {
                  onClose();
                  onPrintTicket(order);
                }}
                className="w-full sm:flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>Imprimer Ticket & QR</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
