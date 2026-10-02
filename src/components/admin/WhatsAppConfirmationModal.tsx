import React, { useState, useEffect, useRef } from 'react';
import { Order, WhatsAppMessage } from '../../types/ecommerce';
import { dbService } from '../../services/dbService';
import { 
  X, 
  CheckCheck, 
  Phone, 
  Video, 
  Printer, 
  MessageCircle, 
  ShieldCheck, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RefreshCw,
  QrCode
} from 'lucide-react';

interface WhatsAppConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onPrintTicket?: (order: Order) => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

export const WhatsAppConfirmationModal: React.FC<WhatsAppConfirmationModalProps> = ({
  order,
  onClose,
  onPrintTicket,
  onOrderUpdated
}) => {
  if (!order) return null;

  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [simText, setSimText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [botStatus, setBotStatus] = useState<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Poll backend every 1.5 seconds so incoming messages from WhatsApp / Webhook update dynamically
  useEffect(() => {
    fetch('/api/whatsapp/status').then(r => r.json()).then(setBotStatus).catch(() => null);

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            const found = data.orders.find((o: Order) => o.id === currentOrder.id);
            if (found) {
              const currentLen = currentOrder.whatsappConfirmation?.conversation?.length || 0;
              const newLen = found.whatsappConfirmation?.conversation?.length || 0;
              if (newLen !== currentLen || found.status !== currentOrder.status) {
                setCurrentOrder({ ...found });
                if (onOrderUpdated) onOrderUpdated(found);
              }
            }
          }
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [currentOrder.id, currentOrder.whatsappConfirmation?.conversation?.length, currentOrder.status]);

  const conf = currentOrder.whatsappConfirmation;
  const customerName = currentOrder.customerName || currentOrder.shippingAddress?.fullName || 'Client';
  const customerPhone = currentOrder.customerPhone || currentOrder.shippingAddress?.phone || '';
  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');

  const isConfirmed = conf?.isConfirmed || currentOrder.status === 'CONFIRMED';
  const isCancelled = currentOrder.status === 'CANCELLED';
  const needsHuman = conf?.needsHumanIntervention && !isConfirmed && !isCancelled;

  const defaultSentMessage = conf?.sentMessageText || 
    `Salam ${customerName} ! 👋\nMerci pour votre commande #${currentOrder.orderNumber} sur ShopMe Maroc 🇲🇦.\n💰 Total : ${currentOrder.totalAmount.toFixed(2)} MAD (Paiement cash à la livraison)\n📍 Adresse : ${currentOrder.shippingAddress?.street}, ${currentOrder.shippingAddress?.city}\n\n👉 Répondez OUI pour confirmer votre commande ✅ ou NON pour l'annuler ❌.`;

  // Build message history
  const conversation: WhatsAppMessage[] = (conf?.conversation && conf.conversation.length > 0)
    ? conf.conversation
    : [
        {
          id: 'msg-init',
          sender: 'STORE_BOT',
          text: defaultSentMessage,
          timestamp: conf?.messageTimestamp || '10:00'
        },
        ...(conf?.replyMessageText ? [{
          id: 'msg-reply',
          sender: 'CUSTOMER' as const,
          text: conf.replyMessageText,
          timestamp: conf.replyTimestamp || '10:05'
        }] : [])
      ];

  // Auto-scroll chat to bottom when conversation changes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length]);

  // Admin sending a direct message to the customer
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const updated = await dbService.sendAdminWhatsAppMessage(currentOrder.id, adminReplyText.trim());
    if (updated) {
      setCurrentOrder({ ...updated });
      if (onOrderUpdated) onOrderUpdated(updated);
    }
    setAdminReplyText('');
    setIsSubmitting(false);
  };

  // Simulating or receiving an incoming response from the customer
  const handleSimulateIncoming = async (textToSimulate: string) => {
    if (!textToSimulate.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const updated = await dbService.simulateCustomerWhatsAppReply(currentOrder.id, textToSimulate.trim());
    if (updated) {
      setCurrentOrder({ ...updated });
      if (onOrderUpdated) onOrderUpdated(updated);
    }
    setSimText('');
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-0 animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Top Header of the Modal */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConfirmed ? 'bg-emerald-400' : isCancelled ? 'bg-rose-400' : needsHuman ? 'bg-amber-400 animate-ping' : 'bg-blue-400 animate-pulse'}`}></span>
            <span className="font-extrabold text-white text-xs">WhatsApp Bot & Conversation Client</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
              {currentOrder.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSimPanel(!showSimPanel)}
              className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Tester le bot en simulant des réponses client"
            >
              <Bot className="w-3 h-3 text-purple-400" />
              <span>{showSimPanel ? 'Masquer Réponses' : 'Réponses Rapides'}</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Baileys Disconnected Alert */}
        {botStatus && !botStatus.bot?.connected && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-3.5 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Bot déconnecté :</strong> Scannez le QR code dans <em>WhatsApp Admin</em> pour automatiser, ou envoyez en 1-clic :
              </span>
            </div>
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultSentMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>📲 Envoyer au client (1-Clic)</span>
            </a>
          </div>
        )}

        {/* Quick Action Bar for Instant Client Confirmation */}
        {!isConfirmed && !isCancelled && (
          <div className="bg-[#182229] border-b border-slate-800 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <span>Réception réponse client :</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSimulateIncoming("OUI, je confirme ma commande !")}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-102"
              >
                <span>✓ Client répond « OUI »</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSimulateIncoming("NON, je souhaite annuler")}
                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>✕ Client répond « NON »</span>
              </button>
            </div>
          </div>
        )}

        {/* Needs Human Attention Banner */}
        {needsHuman && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
              <span>
                Intervention humaine requise : {conf?.humanInterventionReason || "Le client a posé une question"}
              </span>
            </div>
            <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded font-mono font-semibold">
              Action attendue
            </span>
          </div>
        )}

        {/* Confirmation State Banner */}
        {isConfirmed && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-3.5 py-1.5 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Commande validée avec accord du client sur WhatsApp ({currentOrder.totalAmount} MAD COD)</span>
          </div>
        )}

        {isCancelled && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-3.5 py-1.5 flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <X className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Commande annulée à la demande du client sur WhatsApp</span>
          </div>
        )}

        {/* Optional Simulator Panel */}
        {showSimPanel && (
          <div className="bg-slate-950 p-3 border-b border-slate-800 space-y-2 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tester une réponse du client pour vérifier la réponse automatique :</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSimulateIncoming("OUI")}
                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                « OUI » (Validation)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateIncoming("NON, annulez")}
                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                « NON » (Annulation)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateIncoming("C'est quand la livraison ?")}
                className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                « Quand la livraison ? »
              </button>
              <button
                type="button"
                onClick={() => handleSimulateIncoming("Puis-je ouvrir le colis avant de payer ?")}
                className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                « Ouvrir avant de payer ? »
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp Mobile Chat Shell */}
        <div className="bg-[#0b141a] text-slate-100 flex-1 flex flex-col font-sans overflow-hidden">
          
          {/* WhatsApp Chat Top Header */}
          <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-inner shrink-0">
                {customerName.charAt(0)}
              </div>
              <div className="leading-tight">
                <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="truncate max-w-[170px] sm:max-w-[200px]">{customerName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded font-normal font-mono">MA</span>
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span>Client ShopMe</span>
                  <span>·</span>
                  <span className="font-mono text-slate-300">{customerPhone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <a 
                href={`tel:${cleanPhone}`} 
                className="p-1.5 hover:text-emerald-400 hover:bg-slate-700/50 rounded-full transition-colors"
                title="Appeler le client"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a 
                href={`https://wa.me/${cleanPhone}`} 
                target="_blank" 
                rel="noreferrer"
                className="p-1.5 hover:text-emerald-400 hover:bg-slate-700/50 rounded-full transition-colors"
                title="Ouvrir dans WhatsApp"
              >
                <Video className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Chat Messages Body with WhatsApp Wallpaper Pattern */}
          <div 
            className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 relative"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: '16px 16px'
            }}
          >
            {/* End-to-End Encryption Notice Badge */}
            <div className="flex justify-center">
              <div className="bg-[#182229] border border-amber-500/20 text-amber-200/90 text-[10px] px-3 py-1 rounded-xl text-center shadow-xs flex items-center gap-1 max-w-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Conversation WhatsApp sécurisée. Commandes et confirmation ShopMe.</span>
              </div>
            </div>

            {/* Conversation Flow */}
            {conversation.map((msg) => {
              const isFromStore = msg.sender === 'STORE_BOT' || msg.sender === 'ADMIN';
              const isCustomer = msg.sender === 'CUSTOMER';

              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isFromStore ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  <div 
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 shadow-md space-y-1 relative ${
                      isCustomer 
                        ? 'bg-[#202c33] text-white rounded-tl-xs border border-slate-700/60' 
                        : msg.sender === 'ADMIN'
                        ? 'bg-[#005c4b] text-white rounded-tr-xs border border-emerald-500/30'
                        : 'bg-[#005c4b] text-white rounded-tr-xs border border-emerald-500/30'
                    }`}
                  >
                    {/* Sender Label */}
                    <div className="flex items-center justify-between gap-2 text-[10px] pb-0.5 border-b border-white/10">
                      <span className="font-bold flex items-center gap-1 text-emerald-300">
                        {msg.sender === 'STORE_BOT' && (
                          <>
                            <Bot className="w-3 h-3 text-emerald-300" />
                            <span>ShopMe Maroc - Bot Auto</span>
                          </>
                        )}
                        {msg.sender === 'ADMIN' && (
                          <>
                            <UserIcon className="w-3 h-3 text-blue-300" />
                            <span>Conseiller ShopMe (Vous)</span>
                          </>
                        )}
                        {isCustomer && (
                          <>
                            <span className="text-amber-300 font-bold">{customerName}</span>
                          </>
                        )}
                      </span>
                      <span className="text-[9px] text-white/50 font-mono">
                        {isFromStore ? 'SYSTEM' : 'CLIENT'}
                      </span>
                    </div>

                    {/* Message Text */}
                    <div className="whitespace-pre-line text-[11px] leading-relaxed text-slate-100">
                      {msg.text}
                    </div>

                    {/* Timestamp & checks */}
                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-300/80 pt-0.5">
                      <span>{msg.timestamp}</span>
                      {isFromStore && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={chatBottomRef} />
          </div>

          {/* Admin Live Reply Bar: Allows direct answer when bot can't */}
          <div className="p-3 bg-[#202c33] border-t border-slate-800 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Répondre directement au client via WhatsApp :</span>
              </span>
              {needsHuman && (
                <span className="text-amber-400 font-bold text-[10px] animate-pulse">
                  ● Réponse manuelle attendue
                </span>
              )}
            </div>

            <form onSubmit={handleSendAdminReply} className="flex items-center gap-2">
              <input
                type="text"
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="Écrivez votre message WhatsApp (ex: Bonjour, adresse bien notée...)..."
                className="flex-1 p-2.5 bg-[#111b21] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
              <button
                type="submit"
                disabled={!adminReplyText.trim() || isSubmitting}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-md"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Envoyer</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultSentMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ouvrir dans WhatsApp avec le message de confirmation pré-rempli"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>📲 Ouvrir WhatsApp & Envoyer au client (+{cleanPhone})</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {onPrintTicket && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPrintTicket(currentOrder);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-[11px] flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Imprimer Ticket & QR</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
