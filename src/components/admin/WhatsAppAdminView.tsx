import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { MessageCircle, Check, Send, Phone, FileText, Bell } from 'lucide-react';

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

  useEffect(() => {
    const load = () => fetch('/api/whatsapp/status').then(r => r.json()).then(setBotStatus).catch(() => null);
    load();
    const t = setInterval(load, 5000);
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

  const handleSendTestMessage = () => {
    const formatted = orderConfirmationTemplate
      .replace('{{customer_name}}', 'Test Client')
      .replace('{{order_number}}', 'ORD-2026-TEST')
      .replace('{{total}}', '899.00 DH')
      .replace('{{city}}', 'Casablanca');

    const cleanPhone = testRecipient.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(formatted)}`, '_blank');
    showToast("Simulation WhatsApp ouverte dans un nouvel onglet !");
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-black text-white">WhatsApp Business & Notifications Automatisées</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Configuration des notifications de commande, expédition et modèles de conversation
        </p>
      </div>

      {/* Bot connection (QR code) */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-300">
          <div className="font-bold text-white">Connexion du bot WhatsApp</div>
          <div className="text-[11px] text-slate-400">
            {botStatus?.provider !== 'baileys'
              ? `Mode actuel : ${botStatus?.provider || 'inconnu'}`
              : botStatus?.bot?.connected
              ? `✅ Connecté (+${botStatus.bot.account})`
              : '⚠ Non connecté : scannez le QR code avec WhatsApp'}
          </div>
        </div>
        {botStatus?.provider === 'baileys' && !botStatus?.bot?.connected && (
          <a
            href="/api/whatsapp/qr"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-xs"
          >
            Afficher le QR code
          </a>
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
              Numéro rattaché à votre compte WhatsApp Cloud API ou numéro de support direct.
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-700/80 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white block">
                Modèle de Confirmation de Commande
              </label>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
                Variables : {'{{customer_name}}, {{order_number}}, {{total}}, {{city}}'}
              </span>
            </div>
            <textarea
              rows={3}
              value={orderConfirmationTemplate}
              onChange={(e) => setOrderConfirmationTemplate(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-2 border-t border-slate-700/80 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white block">
                Modèle d'Alerte d'Expédition / Livraison
              </label>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
                Variables : {'{{customer_name}}, {{order_number}}, {{tracking_number}}'}
              </span>
            </div>
            <textarea
              rows={3}
              value={shippingTemplate}
              onChange={(e) => setShippingTemplate(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer la Configuration WhatsApp</span>
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
            Testez en conditions réelles la génération du lien et du message pré-rempli pour vous assurer du rendu sur mobile.
          </p>

          <div>
            <label className="text-[11px] text-slate-300 font-semibold block mb-1">Destinataire Test</label>
            <input
              type="text"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleSendTestMessage}
            className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envoyer Message de Test</span>
          </button>
        </div>

      </div>

    </div>
  );
};
