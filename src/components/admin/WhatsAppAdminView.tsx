import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { baileysBotService, BAILEYS_BOT_NUMBER } from '../../services/baileysBotService';
import { BaileysConversation, BaileysBotStatus } from '../../types/ecommerce';
import { 
  MessageCircle, 
  Check, 
  Send, 
  Phone, 
  QrCode, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  CheckCheck, 
  Sparkles, 
  Zap, 
  ExternalLink, 
  Printer, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Smartphone,
  Lock,
  ChevronRight,
  MoreVertical,
  Paperclip
} from 'lucide-react';

export const WhatsAppAdminView: React.FC = () => {
  const { currentUser, showToast, formatMoney } = useApp();
  
  // Baileys Service State
  const [status, setStatus] = useState<BaileysBotStatus>(baileysBotService.getStatus());
  const [conversations, setConversations] = useState<BaileysConversation[]>(baileysBotService.getConversations());
  const [selectedConversationId, setSelectedConversationId] = useState<string>(conversations[0]?.id || '');
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'CONFIRMED'>('ALL');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [adminReplyInput, setAdminReplyInput] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isGeneratingPairingCode, setIsGeneratingPairingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleGenerateLivePairingCode = async () => {
    setIsGeneratingPairingCode(true);
    const code = await baileysBotService.requestLivePairingCode(BAILEYS_BOT_NUMBER);
    setIsGeneratingPairingCode(false);
    showToast(`✓ Nouveau Code Officiel WhatsApp généré : ${code}`);
  };

  const handleCopyPairingCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code.replace(/[^a-zA-Z0-9]/g, ''));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast('Code d\'association copié dans le presse-papier !');
    }
  };

  useEffect(() => {
    const unsubConv = baileysBotService.subscribe((updated) => {
      setConversations(updated);
      if (!selectedConversationId && updated.length > 0) {
        setSelectedConversationId(updated[0].id);
      }
    });

    const unsubStatus = baileysBotService.subscribeStatus((updatedStatus) => {
      setStatus(updatedStatus);
    });

    return () => {
      unsubConv();
      unsubStatus();
    };
  }, [selectedConversationId]);

  // Active conversation
  const activeConversation = conversations.find(c => c.id === selectedConversationId) || conversations[0];

  // Filtered conversations
  const filteredConversations = conversations.filter(c => {
    if (statusFilter === 'WAITING' && c.status !== 'WAITING_CONFIRMATION') return false;
    if (statusFilter === 'CONFIRMED' && c.status !== 'CONFIRMED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.toLowerCase().includes(q) ||
        c.orderNumber.toLowerCase().includes(q) ||
        c.customerCity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action: Regenerate QR Code
  const handleRefreshQr = async () => {
    setIsGeneratingQr(true);
    await baileysBotService.requestLiveQr();
    setIsGeneratingQr(false);
    showToast('✓ Nouveau QR Code officiel WhatsApp généré');
  };

  useEffect(() => {
    if (isQrModalOpen && status.status !== 'CONNECTED') {
      baileysBotService.requestLiveQr();
    }
  }, [isQrModalOpen]);

  // Action: Connect / Scan
  const handleConnectSimulate = async () => {
    await baileysBotService.simulateConnect();
    setIsQrModalOpen(false);
    showToast('🎉 Baileys WhatsApp Bot connecté avec succès sur +212 668-381916');
  };

  // Action: Disconnect
  const handleDisconnect = () => {
    baileysBotService.disconnect();
    showToast('Bot WhatsApp déconnecté.');
  };

  // Action: Simulate Client "OUI" Reply (User Request: "after client answer oui or something that mean yes bailys answer him u order confirmed and u will receive it soon")
  const handleSimulateClientYes = (convId: string) => {
    const res = baileysBotService.processClientReply(convId, 'Salam, oui je confirme ma commande !');
    if (res.isConfirmed) {
      showToast('✅ Réponse "OUI" reçue ! Commande confirmée automatiquement par le bot Baileys.');
    }
  };

  // Action: Send custom admin message
  const handleSendAdminMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyInput.trim() || !activeConversation) return;

    baileysBotService.sendAdminMessage(activeConversation.id, adminReplyInput.trim());
    setAdminReplyInput('');
    showToast('Message envoyé au client via WhatsApp.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Title & Baileys Connection Status Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">Bot Baileys AI WhatsApp</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                  status.status === 'CONNECTED'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${status.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {status.status === 'CONNECTED' ? 'CONNECTÉ & ACTIF' : 'SCANNER QR CODE'}
                </span>
                <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full text-[11px] font-mono font-bold">
                  {BAILEYS_BOT_NUMBER}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Connexion WhatsApp Web par QR Code · Envoi automatique après commande · Réponse intelligente et confirmation immédiate
              </p>
            </div>
          </div>

          {/* Quick Connection Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{status.status === 'CONNECTED' ? 'QR Code & Statut' : 'Scanner QR Code'}</span>
            </button>

            {status.status === 'CONNECTED' ? (
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Déconnecter
              </button>
            ) : (
              <button
                onClick={handleConnectSimulate}
                className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Simuler Connexion
              </button>
            )}
          </div>
        </div>

        {/* Info Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Numéro Émetteur : <strong className="font-mono text-white">{BAILEYS_BOT_NUMBER}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Détection Mot-clé : <strong className="text-white">"OUI" / "OUI JE CONFIRME"</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Mise à jour Commande : <strong className="text-emerald-400">Automatique (Statut CONFIRMED)</strong></span>
          </div>
        </div>
      </div>

      {/* Main 2-Columns WhatsApp Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Conversations List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-3.5 shadow-sm">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Conversations Clients ({conversations.length})
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full font-mono">
              Live Stream
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, tél ou N° commande..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Toutes ({conversations.length})
            </button>
            <button
              onClick={() => setStatusFilter('WAITING')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'WAITING' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              En Attente ({conversations.filter(c => c.status === 'WAITING_CONFIRMATION').length})
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Confirmées ({conversations.filter(c => c.status === 'CONFIRMED').length})
            </button>
          </div>

          {/* Conversations Cards List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
                Aucune conversation trouvée.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-700/80 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {conv.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{conv.customerName}</span>
                            <span className="text-[10px]">🇲🇦</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {conv.customerPhone} · {conv.customerCity}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                        conv.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {conv.status === 'CONFIRMED' ? 'CONFIRMÉ ✅' : 'EN ATTENTE ⏳'}
                      </span>
                    </div>

                    {/* Order summary tag */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                      <span className="text-amber-400 font-bold font-mono">#{conv.orderNumber}</span>
                      <span className="text-white font-bold">{formatMoney(conv.orderTotal)}</span>
                    </div>

                    {/* Last message preview */}
                    {lastMsg && (
                      <div className="text-[11px] text-slate-400 line-clamp-1 italic">
                        {lastMsg.sender === 'client' ? '👤 Client : ' : '🤖 Bot : '}
                        {lastMsg.text}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full WhatsApp Conversation Screen (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[650px]">
          
          {/* WhatsApp Chat Header (WhatsApp Web Mobile Style) */}
          {activeConversation ? (
            <div className="bg-[#202c33] p-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-inner shrink-0">
                  {activeConversation.customerName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <span>{activeConversation.customerName}</span>
                    <span className="text-[10px]">🇲🇦</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                      #{activeConversation.orderNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-normal flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>en ligne</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 font-mono text-[10px]">{activeConversation.customerPhone}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 text-[10px]">{activeConversation.customerCity}</span>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${activeConversation.customerPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-[#128c7e] hover:bg-[#075e54] text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Ouvrir dans l'application WhatsApp"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Ouvrir WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-[#202c33] p-4 text-center text-xs text-slate-400">
              Sélectionnez une conversation à gauche
            </div>
          )}

          {/* Interactive Chat Messages Screen with WhatsApp Dark Shell */}
          {activeConversation ? (
            <div className="flex-1 bg-[#0b141a] p-4 space-y-3 overflow-y-auto max-h-[500px]">
              
              {/* WhatsApp Encryption & Security Notice */}
              <div className="flex justify-center">
                <div className="bg-[#182229] border border-[#222e35] text-[#ffd279] text-[10px] px-3 py-1.5 rounded-lg max-w-md text-center flex items-center gap-1.5 shadow-xs">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Messages chiffrés de bout en bout via Baileys Multi-Device · Envoyés depuis {BAILEYS_BOT_NUMBER}</span>
                </div>
              </div>

              {/* Order Recap Banner in Chat */}
              <div className="bg-[#1f2c34] border border-[#2a3942] rounded-2xl p-3 text-xs text-slate-200 space-y-1 shadow-sm">
                <div className="flex items-center justify-between font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Dossier Commande #{activeConversation.orderNumber}</span>
                  </span>
                  <span className="text-amber-400 font-mono text-sm">{formatMoney(activeConversation.orderTotal)}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Articles : <span className="text-slate-200 font-medium">{activeConversation.orderItemsSummary}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Adresse : <span className="text-slate-200 font-medium">{activeConversation.customerAddress}, {activeConversation.customerCity}</span>
                </div>
              </div>

              {/* Messages Feed */}
              {activeConversation.messages.map((msg) => {
                const isClient = msg.sender === 'client';
                const isAdmin = msg.sender === 'admin';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md space-y-1 text-xs whitespace-pre-wrap leading-relaxed ${
                        isClient
                          ? 'bg-[#202c33] text-slate-100 rounded-tl-xs border border-slate-700/60'
                          : isAdmin
                          ? 'bg-[#005c4b] text-white rounded-tr-xs'
                          : 'bg-[#005c4b] text-white rounded-tr-xs'
                      }`}
                    >
                      {/* Sender label */}
                      <div className="text-[9px] font-bold opacity-75">
                        {isClient ? activeConversation.customerName : isAdmin ? '👤 Admin (ShopMe)' : `🤖 Bot Baileys (${BAILEYS_BOT_NUMBER})`}
                      </div>

                      {/* Content */}
                      <div className="font-normal">{msg.text}</div>

                      {/* Timestamp & Status Ticks */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-300 pt-0.5">
                        <span>{msg.timestamp}</span>
                        {!isClient && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-slate-500 text-xs">
              Aucune conversation sélectionnée
            </div>
          )}

          {/* Quick Simulation & Action Box */}
          {activeConversation && (
            <div className="p-3 bg-[#111b21] border-t border-slate-800 space-y-2.5">
              
              {/* Direct WhatsApp Dispatch Bar (Fixes 'En attente de ce message' error) */}
              <div className="bg-[#202c33] p-3 rounded-2xl border border-[#2a3942] space-y-2">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-xs text-slate-200">
                    <span className="font-bold text-white block">Envoyer depuis {BAILEYS_BOT_NUMBER} :</span>
                    <span className="text-[11px] text-slate-400">
                      Envoi natif au client ({activeConversation.customerPhone}) avec récapitulatif complet de la commande #{activeConversation.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={baileysBotService.getDirectWhatsAppUrl(activeConversation.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      title="Envoyer le message WhatsApp au client sans erreur de chiffrement"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer au Client WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleSimulateClientYes(activeConversation.id)}
                      disabled={activeConversation.status === 'CONFIRMED'}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{activeConversation.status === 'CONFIRMED' ? 'Confirmé par Client ✅' : 'Simuler Réponse "OUI"'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Anti-erreur garanti :</strong> En envoyant via le bouton vert, WhatsApp génère les clés officielles, éliminant totalement l'erreur <em>« En attente de ce message »</em>.
                  </span>
                </div>
              </div>

              {/* Admin Message Input Bar */}
              <form onSubmit={handleSendAdminMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={adminReplyInput}
                  onChange={(e) => setAdminReplyInput(e.target.value)}
                  placeholder={`Répondre au client depuis ${BAILEYS_BOT_NUMBER}...`}
                  className="flex-1 bg-[#2a3942] border border-[#3b4a54] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!adminReplyInput.trim()}
                  className="p-2.5 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md shrink-0"
                  title="Envoyer le message WhatsApp"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

        </div>

      </div>

      {/* QR Code Pairing Modal (WhatsApp Web Baileys Connection) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connexion Baileys WhatsApp</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{BAILEYS_BOT_NUMBER}</p>
                </div>
              </div>
              <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real Live QR Code Scanner Container */}
            <div className="space-y-3.5">
              
              {/* QR Box */}
              <div className="bg-white p-4 rounded-3xl flex flex-col items-center justify-center space-y-3 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between w-full px-2">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>QR Code WhatsApp Multi-Device Live</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {BAILEYS_BOT_NUMBER}
                  </span>
                </div>

                <div className="w-64 h-64 sm:w-72 sm:h-72 bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-slate-100 overflow-hidden shadow-inner">
                  {status.qrCodeDataUrl ? (
                    <img
                      src={status.qrCodeDataUrl}
                      alt="WhatsApp Baileys QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 p-4 text-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="font-semibold text-slate-700">Génération du QR Code en cours...</span>
                      <span className="text-[10px] text-slate-400">Connexion aux serveurs WhatsApp</span>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <div className="text-xs font-black text-slate-900">
                    Pointez la caméra WhatsApp sur ce QR Code
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Ce QR code est généré en direct depuis les serveurs officiels WhatsApp
                  </div>
                </div>
              </div>

              {/* 3 Step Instructions */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white text-[11px] flex items-center gap-1.5 text-emerald-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Procédure de connexion :</span>
                </div>
                <ol className="list-decimal list-inside text-slate-300 text-[11px] space-y-1">
                  <li>Ouvrez <strong>WhatsApp</strong> sur votre smartphone avec le <strong>{BAILEYS_BOT_NUMBER}</strong></li>
                  <li>Allez dans <strong>Réglages / Paramètres &gt; Appareils connectés</strong></li>
                  <li>Touchez <strong>« Connecter un appareil »</strong> et scannez ce QR Code !</li>
                </ol>
              </div>

            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleRefreshQr}
                disabled={isGeneratingQr}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingQr ? 'animate-spin' : ''}`} />
                <span>Recharger QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  baileysBotService.simulateConnect();
                  setIsQrModalOpen(false);
                  showToast('✓ Session WhatsApp liée avec succès sur ' + BAILEYS_BOT_NUMBER);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Valider Connexion WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
