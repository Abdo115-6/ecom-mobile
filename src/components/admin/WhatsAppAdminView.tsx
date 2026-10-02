import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Order } from '../../types/ecommerce';
import { WhatsAppConfirmationModal } from './WhatsAppConfirmationModal';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Bell, 
  Sparkles, 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Clock,
  QrCode,
  RefreshCw,
  LogOut
} from 'lucide-react';

export const WhatsAppAdminView: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const [phoneNumber, setPhoneNumber] = useState(dbService.settings.whatsappPhoneNumber);
  const [orderConfirmationTemplate, setOrderConfirmationTemplate] = useState(
    dbService.settings.whatsappOrderConfirmationTemplate
  );
  const [shippingTemplate, setShippingTemplate] = useState(
    dbService.settings.whatsappShippingTemplate
  );
  const [testRecipient, setTestRecipient] = useState('+212600112233');
  const [botStatus, setBotStatus] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>(dbService.orders);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const load = () => {
      fetch('/api/whatsapp/status').then(r => r.json()).then(setBotStatus).catch(() => null);
      dbService.syncFromBackend().then(() => setOrders([...dbService.orders]));
    };
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateSettings({
      whatsappPhoneNumber: phoneNumber,
      whatsappOrderConfirmationTemplate: orderConfirmationTemplate,
      whatsappShippingTemplate: shippingTemplate
    }, currentUser);
    showToast("Paramètres WhatsApp Business et modèles mis à jour avec succès");
  };

  const handleLogoutBaileys = async () => {
    if (!window.confirm("Voulez-vous vraiment déconnecter votre session WhatsApp ?")) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      showToast("Session WhatsApp déconnectée");
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setBotStatus(data);
    } catch {
      showToast("Erreur lors de la déconnexion");
    }
    setIsLoggingOut(false);
  };

  const handleSendTestMessage = () => {
    const formatted = orderConfirmationTemplate
      .replace('{{customer_name}}', 'Test Client')
      .replace('{{order_number}}', 'ORD-2026-TEST')
      .replace('{{total}}', '899.00 DH')
      .replace('{{city}}', 'Casablanca')
      .replace('{{items}}', 'Parfum Oud Intense x1')
      .replace('{{address}}', 'Boulevard d\'Anfa, Casablanca')
      .replace('{{phone}}', testRecipient);

    const cleanPhone = testRecipient.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(formatted)}`, '_blank');
    showToast("Simulation WhatsApp ouverte dans un nouvel onglet !");
  };

  const whatsappOrders = orders.filter(o => 
    o.whatsappConfirmation || o.whatsappNotification || o.status === 'PENDING' || o.status === 'CONFIRMED'
  );

  const isBaileys = botStatus?.provider === 'baileys';
  const isConnected = botStatus?.bot?.connected;

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-black text-white">WhatsApp Bot Automatisé & Assistant AI</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Connexion réelle avec votre WhatsApp, envoi automatique des détails de commande, bot intelligent et alertes de prise de relais
        </p>
      </div>

      {/* Direct WhatsApp Connection Banner / QR Code Scanner */}
      {isBaileys && (
        <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          isConnected
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : 'bg-slate-800/90 border-amber-500/40 shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`}></span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <span>Connexion Directe WhatsApp Boutique (+212 668-381916)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {isConnected
                  ? `✅ Bot connecté avec succès sur le numéro +${botStatus.bot.account}. Chaque commande est réellement envoyée au client !`
                  : '⚠️ Votre téléphone n\'est pas encore relié au bot : scannez ce QR code ci-dessous pour que vos clients reçoivent réellement les messages sur leur téléphone.'}
              </p>
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={handleLogoutBaileys}
                disabled={isLoggingOut}
                className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnecter le bot</span>
              </button>
            )}
          </div>

          {!isConnected && (
            <div className="pt-4 flex flex-col md:flex-row items-center gap-6 bg-slate-900/90 p-5 rounded-2xl border border-slate-700/70 mt-3">
              <div className="shrink-0 flex flex-col items-center">
                {botStatus?.qr ? (
                  <div className="bg-white p-3 rounded-2xl shadow-2xl border-2 border-emerald-500/40">
                    <img src={botStatus.qr} alt="Scan WhatsApp QR" className="w-56 h-56 object-contain" />
                  </div>
                ) : (
                  <div className="w-56 h-56 bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs shrink-0 animate-pulse border border-slate-700">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                    <span>Génération du QR Code WhatsApp...</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-2 font-mono">
                  Le QR code se rafraîchit automatiquement
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-300 max-w-lg">
                <div className="font-bold text-white text-sm">
                  Instructions pour relier votre numéro (+212 668-381916) :
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>Ouvrez l'application <strong>WhatsApp</strong> sur votre téléphone.</li>
                  <li>Allez dans <strong>Réglages / Paramètres</strong> ou appuyez sur les <strong>3 points ⋮</strong> en haut à droite.</li>
                  <li>Sélectionnez <strong>Appareils connectés</strong> puis <strong>Connecter un appareil</strong>.</li>
                  <li>Scannez le QR Code affiché à gauche avec l'appareil photo de votre téléphone.</li>
                </ol>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] leading-relaxed">
                  🚀 <strong>Résultat immédiat :</strong> Dès que vous scannez, la boutique est connectée en temps réel. Dès qu'un client passe commande, il reçoit instantanément le récapitulatif sur son WhatsApp avec les boutons OUI/NON !
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bot & AI Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Gateway & Connection */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-400" />
              Mode d'envoi
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {isConnected ? 'Connecté Direct' : 'En attente scan'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isConnected 
              ? `Relié à votre numéro +${botStatus?.bot?.account}. Expédition instantanée aux clients.`
              : 'Scannez le QR code ci-dessus pour activer l\'envoi automatique.'}
          </p>
        </div>

        {/* AI Chatbot Engine */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              IA Conversationnelle
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Comprend le français, la Darija marocaine et l'arabe. Répond aux questions sur la livraison et le paiement cash.
          </p>
        </div>

        {/* Escalation & Manual Control */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Alerte Intervention Humaine
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              Prise de relais
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Si le bot ne peut pas répondre ou si le client veut changer d'adresse, une alerte est affichée et vous pouvez répondre directement.
          </p>
        </div>

      </div>

      {/* Real-time WhatsApp Conversations List */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Conversations Récentes des Commandes
            </h2>
            <p className="text-[11px] text-slate-400">
              Cliquez sur une commande pour ouvrir l'écran complet de la conversation en direct et répondre au client si nécessaire
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {whatsappOrders.length} conversation(s)
          </span>
        </div>

        {whatsappOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Aucune commande récente. Les prochaines commandes apparaîtront automatiquement ici avec leur fil WhatsApp.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {whatsappOrders.map(order => {
              const conf = order.whatsappConfirmation;
              const isConfirmed = conf?.isConfirmed || order.status === 'CONFIRMED';
              const needsHuman = conf?.needsHumanIntervention && !isConfirmed;
              const lastMessage = conf?.conversation && conf.conversation.length > 0
                ? conf.conversation[conf.conversation.length - 1]
                : null;

              return (
                <div
                  key={order.id}
                  onClick={() => setModalOrder(order)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    needsHuman 
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400' 
                      : isConfirmed 
                      ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-400' 
                      : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{order.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Commande <span className="font-mono font-bold text-slate-300">#{order.orderNumber}</span> · {order.shippingAddress?.city} · {order.totalAmount} MAD
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isConfirmed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmé WA
                        </span>
                      ) : needsHuman ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Réponse requise
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          En attente OUI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Last message snippet */}
                  <div className="mt-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
                    <span className="truncate max-w-[280px]">
                      {lastMessage ? (
                        <>
                          <strong className={lastMessage.sender === 'CUSTOMER' ? 'text-amber-300' : lastMessage.sender === 'ADMIN' ? 'text-blue-300' : 'text-emerald-400'}>
                            {lastMessage.sender === 'CUSTOMER' ? 'Client : ' : lastMessage.sender === 'ADMIN' ? 'Vous : ' : 'Bot : '}
                          </strong>
                          {lastMessage.text}
                        </>
                      ) : (
                        'Message de confirmation envoyé au client'
                      )}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-2">
                      Voir conversation →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Settings Form (8 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-8 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-white block mb-1">
              Numéro Officiel WhatsApp Business *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+212600112233"
                className="w-full p-3 pl-10 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Numéro utilisé par le bot pour communiquer avec les clients.
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-700/80 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white block">
                Modèle du Message de Confirmation Automatique Envoyé au Client
              </label>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
                Variables : {'{{customer_name}}, {{order_number}}, {{items}}, {{total}}, {{address}}, {{phone}}'}
              </span>
            </div>
            <textarea
              rows={6}
              value={orderConfirmationTemplate}
              onChange={(e) => setOrderConfirmationTemplate(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
            <p className="text-[10px] text-slate-400">
              Ce message est envoyé automatiquement au client dès la validation du panier.
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-700/80 pt-4">
            <label className="text-xs font-bold text-white block">
              Modèle de Notification d'Expédition
            </label>
            <textarea
              rows={2}
              value={shippingTemplate}
              onChange={(e) => setShippingTemplate(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Enregistrer les paramètres WhatsApp</span>
            </button>
          </div>
        </form>

        {/* Live Test Panel (4 cols) */}
        <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-700/80 pb-3">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Tester l'Envoi d'un Message WhatsApp</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Testez en conditions réelles la génération du message complet avec toutes les coordonnées du client pour vérifier le rendu mobile.
          </p>

          <div>
            <label className="text-[11px] text-slate-300 font-semibold block mb-1">Destinataire Test</label>
            <input
              type="text"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleSendTestMessage}
            className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envoyer Message de Test sur WhatsApp</span>
          </button>
        </div>

      </div>

      {/* Screen de Conversation Modal */}
      {modalOrder && (
        <WhatsAppConfirmationModal
          order={modalOrder}
          onClose={() => setModalOrder(null)}
          onOrderUpdated={(updated) => {
            setOrders([...dbService.orders]);
            setModalOrder(updated);
          }}
        />
      )}

    </div>
  );
};
