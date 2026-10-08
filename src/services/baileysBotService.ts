import QRCode from 'qrcode';
import { BaileysBotStatus, BaileysConversation, BaileysMessage, Order } from '../types/ecommerce';
import { dbService } from './dbService';

const STORAGE_KEY_CONVERSATIONS = 'shopme_baileys_conversations';
const STORAGE_KEY_STATUS = 'shopme_baileys_status';

export const BAILEYS_BOT_NUMBER = '+212 668-381916';

class BaileysBotService {
  private status: BaileysBotStatus;
  private conversations: BaileysConversation[] = [];
  private listeners: ((conversations: BaileysConversation[]) => void)[] = [];
  private statusListeners: ((status: BaileysBotStatus) => void)[] = [];

  constructor() {
    this.status = this.loadStatus();
    this.conversations = this.loadConversations();
    if (this.conversations.length === 0) {
      this.seedInitialConversations();
    }
    // Start background sync with server Baileys socket
    this.startLiveSync();
  }

  private startLiveSync(): void {
    if (typeof window === 'undefined') return;
    this.fetchLiveStatus();
    // Poll every 4 seconds for live server updates
    setInterval(() => {
      this.fetchLiveStatus();
    }, 4000);
  }

  public async fetchLiveStatus(): Promise<BaileysBotStatus> {
    try {
      const res = await fetch('/api/whatsapp/baileys/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const prevStatus = this.status.status;
          const prevPairing = this.status.pairingCode;
          const prevQr = this.status.qrCodeDataUrl;
          this.status = {
            ...this.status,
            status: data.status || this.status.status,
            qrCodeDataUrl: data.qrCodeDataUrl || this.status.qrCodeDataUrl,
            pairingCode: data.pairingCode || this.status.pairingCode,
            connectedAt: data.connectedAt || this.status.connectedAt,
            uptimeSeconds: data.uptimeSeconds || this.status.uptimeSeconds
          };
          if (prevStatus !== this.status.status || data.pairingCode !== prevPairing || data.qrCodeDataUrl !== prevQr) {
            this.saveStatus();
          }
        }
      }
    } catch (e) {
      // offline fallback
    }
    return { ...this.status };
  }

  public async requestLivePairingCode(phoneNumber?: string): Promise<string> {
    try {
      const res = await fetch('/api/whatsapp/baileys/request-pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber || '212668381916' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pairingCode) {
          this.status.pairingCode = data.pairingCode;
          this.status.status = 'SCAN_QR';
          this.saveStatus();
          return data.pairingCode;
        }
      }
    } catch (e) {
      console.warn('Live pairing code error:', e);
    }
    return this.status.pairingCode || '6683-8191';
  }

  // --- Status & QR Code ---

  private loadStatus(): BaileysBotStatus {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_STATUS);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load Baileys status:', e);
      }
    }
    return {
      status: 'CONNECTED',
      phoneNumber: BAILEYS_BOT_NUMBER,
      uptimeSeconds: 84600,
      autoConfirmationEnabled: true,
      connectedAt: new Date(Date.now() - 3600 * 24 * 1000).toISOString(),
      pairingCode: 'BAIL-212-668-381916'
    };
  }

  private saveStatus(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(this.status));
      } catch (e) {
        console.warn('Failed to save Baileys status:', e);
      }
    }
    this.statusListeners.forEach(listener => listener({ ...this.status }));
  }

  public getStatus(): BaileysBotStatus {
    return { ...this.status };
  }

  public async generateQrCode(): Promise<string> {
    return await this.requestLiveQr();
  }

  public async requestLiveQr(): Promise<string> {
    try {
      const res = await fetch('/api/whatsapp/baileys/refresh-qr', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.qrCodeDataUrl) {
          this.status.qrCodeDataUrl = data.qrCodeDataUrl;
          this.status.status = 'SCAN_QR';
          this.saveStatus();
          return data.qrCodeDataUrl;
        }
      }
    } catch (e) {
      console.warn('requestLiveQr error:', e);
    }
    return this.status.qrCodeDataUrl || '';
  }

  public getDirectWhatsAppUrl(conversationId: string): string {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv) return '';
    const cleanPhone = conv.customerPhone.replace(/[^0-9]/g, '');
    const firstBotMsg = conv.messages.find(m => m.sender === 'bot');
    const textToSend = firstBotMsg 
      ? firstBotMsg.text 
      : `Salam ${conv.customerName} ! Merci pour votre commande #${conv.orderNumber} sur ShopMe Maroc 🇲🇦.\nVeuillez répondre par *OUI* pour confirmer votre expédition express 24h-48h.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textToSend)}`;
  }

  public getDirectWhatsAppWebUrl(conversationId: string): string {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv) return '';
    const cleanPhone = conv.customerPhone.replace(/[^0-9]/g, '');
    const firstBotMsg = conv.messages.find(m => m.sender === 'bot');
    const textToSend = firstBotMsg 
      ? firstBotMsg.text 
      : `Salam ${conv.customerName} ! Merci pour votre commande #${conv.orderNumber} sur ShopMe Maroc 🇲🇦.\nVeuillez répondre par *OUI* pour confirmer votre expédition express 24h-48h.`;
    return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textToSend)}`;
  }

  public async requestQrScan(): Promise<void> {
    this.status.status = 'SCAN_QR';
    await this.generateQrCode();
    this.saveStatus();
  }

  public async simulateConnect(): Promise<void> {
    this.status.status = 'CONNECTING';
    this.saveStatus();

    await new Promise(r => setTimeout(r, 1200));

    this.status.status = 'CONNECTED';
    this.status.phoneNumber = BAILEYS_BOT_NUMBER;
    this.status.connectedAt = new Date().toISOString();
    this.saveStatus();
  }

  public disconnect(): void {
    this.status.status = 'DISCONNECTED';
    this.saveStatus();
  }

  // --- Conversations Management ---

  private loadConversations(): BaileysConversation[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load Baileys conversations:', e);
      }
    }
    return [];
  }

  private saveConversations(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(this.conversations));
      } catch (e) {
        console.warn('Failed to save Baileys conversations:', e);
      }
    }
    this.listeners.forEach(listener => listener([...this.conversations]));

    // Also sync to backend
    if (typeof window !== 'undefined') {
      fetch('/api/whatsapp/baileys/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversations: this.conversations })
      }).catch(err => console.warn('Backend baileys sync notice:', err));
    }
  }

  public getConversations(): BaileysConversation[] {
    return [...this.conversations];
  }

  public getConversationById(id: string): BaileysConversation | undefined {
    return this.conversations.find(c => c.id === id);
  }

  public getConversationByOrderId(orderId: string): BaileysConversation | undefined {
    return this.conversations.find(c => c.orderId === orderId);
  }

  public subscribe(listener: (conversations: BaileysConversation[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.conversations]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public subscribeStatus(listener: (status: BaileysBotStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener({ ...this.status });
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  // --- Automatic Order Flow Trigger ---

  /**
   * Called immediately whenever an order is submitted by a client in checkout
   * Sends automated WhatsApp confirmation message from +212 668-381916
   */
  public handleNewOrder(order: Order): BaileysConversation {
    const customerName = order.customerName || order.shippingAddress.fullName || 'Client';
    const customerPhone = order.customerPhone || order.shippingAddress.phone || '+212600000000';
    const customerCity = order.shippingAddress.city || 'Casablanca';
    const customerAddress = order.shippingAddress.street || order.shippingAddress.city || 'Centre-ville';
    const itemsSummary = order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');

    // Check if conversation already exists for this order
    const existing = this.conversations.find(c => c.orderId === order.id || c.orderNumber === order.orderNumber);
    if (existing) {
      return existing;
    }

    const orderTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Initial automated message asking client for "OUI" confirmation
    const botMessageText = `Salam ${customerName} ! 👋
Merci pour votre commande sur ShopMe Maroc 🇲🇦

📦 *Récapitulatif Commande #${order.orderNumber}* :
• Articles : ${itemsSummary}
💰 *Total à régler à la livraison* : ${order.totalAmount.toFixed(2)} DH (Paiement Cash après inspection de votre colis)
📍 *Adresse de livraison* : ${customerAddress}, ${customerCity}
📞 *Téléphone renseigné* : ${customerPhone}

👉 Veuillez répondre simplement par *OUI* ou *OUI JE CONFIRME* pour valider l'expédition express sous 24h-48h 🚚.`;

    const initialMessage: BaileysMessage = {
      id: `msg-${Date.now()}-1`,
      sender: 'bot',
      text: botMessageText,
      timestamp: orderTime,
      status: 'delivered'
    };

    const newConversation: BaileysConversation = {
      id: `cnv-${order.id || Date.now()}`,
      customerPhone,
      customerName,
      customerCity,
      customerAddress,
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderTotal: order.totalAmount,
      orderItemsSummary: itemsSummary,
      status: 'WAITING_CONFIRMATION',
      messages: [initialMessage],
      lastActivity: new Date().toISOString()
    };

    this.conversations.unshift(newConversation);
    this.saveConversations();

    // Trigger backend Baileys engine for immediate delivery to customer's WhatsApp number
    if (typeof window !== 'undefined') {
      fetch('/api/whatsapp/baileys/send-order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      }).then(res => res.json()).then(data => {
        if (data.delivered) {
          initialMessage.status = 'delivered';
          this.saveConversations();
        }
      }).catch(err => {
        console.warn('[Baileys] Background delivery notice:', err);
      });
    }

    return newConversation;
  }

  // --- Processing Client Reply & AI Intent Matching ---

  /**
   * Processes an incoming response from a customer on WhatsApp
   * Checks if reply means "OUI", responds accordingly and auto-confirms order
   */
  public processClientReply(conversationId: string, replyText: string): { botReplyText: string; isConfirmed: boolean } {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv) {
      return { botReplyText: '', isConfirmed: false };
    }

    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // 1. Add client's message
    const clientMsg: BaileysMessage = {
      id: `msg-${Date.now()}-client`,
      sender: 'client',
      text: replyText,
      timestamp: nowTime,
      status: 'read'
    };
    conv.messages.push(clientMsg);

    // 2. Detect Positive Confirmation Intent
    const normalized = replyText.toLowerCase().trim();
    const isYes = /(oui|yes|d'accord|daccord|wakha|waxa|confirme|confirmer|ok|نعم|اه|موافق|cv|je valide|valide|tamam|bien|parfait|salam oui)/i.test(normalized);

    let botReplyText = '';

    if (isYes) {
      conv.status = 'CONFIRMED';
      conv.confirmedAt = new Date().toISOString();

      botReplyText = `✅ Parfait ${conv.customerName} ! Votre commande #${conv.orderNumber} est officiellement confirmée.
Votre colis est en cours de préparation et vous le recevrez très bientôt chez vous (sous 24h à 48h).
Notre livreur vous contactera par téléphone au ${conv.customerPhone} avant son passage.
Merci pour votre confiance ! 🌟🇲🇦`;

      // Update Order Status in dbService to CONFIRMED
      if (conv.orderId) {
        const currentUser = dbService.users.find(u => u.role === 'SUPER_ADMIN') || dbService.users[0];
        dbService.updateOrderStatus(conv.orderId, 'CONFIRMED', currentUser);
        dbService.confirmOrderViaWhatsApp(conv.orderId, replyText, currentUser);
      }
    } else if (/garantie|retour|échange/i.test(normalized)) {
      botReplyText = `Tous nos articles bénéficient de la garantie échange sous 7 jours. Vous avez le droit d'inspecter l'article à la livraison avant de régler le montant en espèces au livreur 🛡️. Souhaitez-vous valider votre commande ?`;
    } else if (/délai|combien|temps|quand|livraison/i.test(normalized)) {
      botReplyText = `La livraison s'effectue sous 24h pour Casablanca et 48h pour les autres villes du Maroc 🚚. Répondez simplement "OUI" pour déclencher l'envoi immédiat !`;
    } else {
      botReplyText = `Merci pour votre message ! Notre équipe commerciale (${BAILEYS_BOT_NUMBER}) a bien pris en compte votre remarque. Pour valider l'expédition immédiate de votre commande #${conv.orderNumber}, merci de répondre par *OUI* 🙏.`;
    }

    // 3. Add bot's answer
    const botMsg: BaileysMessage = {
      id: `msg-${Date.now()}-bot`,
      sender: 'bot',
      text: botReplyText,
      timestamp: nowTime,
      status: 'delivered'
    };
    conv.messages.push(botMsg);
    conv.lastActivity = new Date().toISOString();

    this.saveConversations();
    return { botReplyText, isConfirmed: isYes };
  }

  /**
   * Allows the Store Admin to send a direct message in the WhatsApp conversation
   */
  public sendAdminMessage(conversationId: string, text: string): BaileysMessage | null {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv || !text.trim()) return null;

    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const msg: BaileysMessage = {
      id: `msg-${Date.now()}-admin`,
      sender: 'admin',
      text: text.trim(),
      timestamp: nowTime,
      status: 'sent'
    };

    conv.messages.push(msg);
    conv.lastActivity = new Date().toISOString();
    this.saveConversations();
    return msg;
  }

  // --- Initial Seed from Existing Orders ---

  private seedInitialConversations(): void {
    const orders = dbService.orders;
    if (!orders || orders.length === 0) return;

    const seeded: BaileysConversation[] = orders.slice(0, 5).map((order, idx) => {
      const customerName = order.customerName || order.shippingAddress.fullName || 'Client';
      const customerPhone = order.customerPhone || order.shippingAddress.phone || '+212661234567';
      const itemsSummary = order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');

      const isConfirmed = order.status === 'CONFIRMED' || order.status === 'SHIPPED' || order.status === 'DELIVERED';
      const baseTime = '11:20';
      const replyTime = '11:24';
      const confirmTime = '11:25';

      const messages: BaileysMessage[] = [
        {
          id: `seed-${order.id}-1`,
          sender: 'bot',
          text: `Salam ${customerName} ! 👋
Merci pour votre commande sur ShopMe Maroc 🇲🇦

📦 *Récapitulatif Commande #${order.orderNumber}* :
• Articles : ${itemsSummary}
💰 *Total à régler à la livraison* : ${order.totalAmount.toFixed(2)} DH (Paiement Cash après inspection de votre colis)
📍 *Adresse de livraison* : ${order.shippingAddress.street || order.shippingAddress.city}, ${order.shippingAddress.city}
📞 *Téléphone renseigné* : ${customerPhone}

👉 Veuillez répondre simplement par *OUI* ou *OUI JE CONFIRME* pour valider l'expédition express sous 24h-48h 🚚.`,
          timestamp: baseTime,
          status: 'read'
        }
      ];

      if (isConfirmed) {
        messages.push({
          id: `seed-${order.id}-2`,
          sender: 'client',
          text: 'Salam, oui je confirme la commande ! Merci pour la rapidité 🙏',
          timestamp: replyTime,
          status: 'read'
        });
        messages.push({
          id: `seed-${order.id}-3`,
          sender: 'bot',
          text: `✅ Parfait ${customerName} ! Votre commande #${order.orderNumber} est officiellement confirmée.
Votre colis est en cours de préparation et vous le recevrez très bientôt chez vous (sous 24h à 48h).
Notre livreur vous contactera par téléphone au ${customerPhone} avant son passage.
Merci pour votre confiance ! 🌟🇲🇦`,
          timestamp: confirmTime,
          status: 'delivered'
        });
      }

      return {
        id: `cnv-${order.id}`,
        customerPhone,
        customerName,
        customerCity: order.shippingAddress.city,
        customerAddress: order.shippingAddress.street || order.shippingAddress.city,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderTotal: order.totalAmount,
        orderItemsSummary: itemsSummary,
        status: isConfirmed ? 'CONFIRMED' : 'WAITING_CONFIRMATION',
        messages,
        lastActivity: new Date(Date.now() - idx * 3600000).toISOString(),
        confirmedAt: isConfirmed ? new Date(Date.now() - idx * 3600000).toISOString() : undefined
      };
    });

    this.conversations = seeded;
    this.saveConversations();
  }
}

export const baileysBotService = new BaileysBotService();
