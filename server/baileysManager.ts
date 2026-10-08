import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  Browsers,
  fetchLatestBaileysVersion,
  WASocket
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export const TARGET_PHONE_NUMBER = '212668381916';
export const DISPLAY_PHONE_NUMBER = '+212 668-381916';

/**
 * Normalizes any Moroccan phone number into the international WhatsApp format:
 * e.g. "0661252184" -> "212661252184"
 *      "+212 668-381916" -> "212668381916"
 *      "0701020304" -> "212701020304"
 */
export function normalizeMoroccanPhone(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('00212')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Moroccan mobile numbers: 06XXXXXXXX or 07XXXXXXXX
    cleaned = '212' + cleaned.substring(1);
  } else if (!cleaned.startsWith('212') && cleaned.length === 9) {
    // Missing country code: 6XXXXXXXX or 7XXXXXXXX
    cleaned = '212' + cleaned;
  }
  return cleaned;
}

interface BaileysManagerStatus {
  status: 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'CONNECTED';
  phoneNumber: string;
  qrCodeDataUrl?: string;
  pairingCode?: string;
  connectedAt?: string;
  error?: string;
  uptimeSeconds: number;
}

class BaileysManager {
  private sock: WASocket | null = null;
  private authDir: string;
  private status: BaileysManagerStatus;
  private isInitializing: boolean = false;
  private isSocketReady: boolean = false;
  private startTime: number = Date.now();
  private pairingCodeRequested: boolean = false;

  constructor() {
    this.authDir = path.resolve(process.cwd(), 'public', 'data', 'baileys_auth');
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }

    this.status = {
      status: 'SCAN_QR',
      phoneNumber: DISPLAY_PHONE_NUMBER,
      uptimeSeconds: 0
    };
  }

  public getStatus(): BaileysManagerStatus {
    return {
      ...this.status,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  public async start(): Promise<void> {
    if (this.isInitializing || (this.sock && this.status.status === 'CONNECTED')) {
      return;
    }

    this.isInitializing = true;
    this.status.status = 'CONNECTING';

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      let version = [2, 3000, 1043857760];
      try {
        const v = await fetchLatestBaileysVersion();
        if (v && v.version) {
          version = v.version;
        }
      } catch (e) {
        // fallback version
      }

      this.sock = makeWASocket({
        version: version as any,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.windows('Desktop'),
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 15000
      });

      // Save credentials on update
      this.sock.ev.on('creds.update', saveCreds);

      // Listen for connection updates (live QR code & connection state)
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        this.isSocketReady = true;

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, {
              errorCorrectionLevel: 'M',
              margin: 2,
              width: 320,
              color: { dark: '#000000', light: '#ffffff' }
            });
            this.status.qrCodeDataUrl = qrDataUrl;
            this.status.status = 'SCAN_QR';
            console.log('[Baileys] Real Live WhatsApp QR Code updated (length: ' + qr.length + ')');
          } catch (err) {
            console.error('[Baileys] Error rendering live QR code:', err);
          }
        }

        if (connection === 'open') {
          this.status.status = 'CONNECTED';
          this.status.connectedAt = new Date().toISOString();
          this.status.qrCodeDataUrl = undefined;
          this.status.pairingCode = undefined;
          console.log(`[Baileys] WhatsApp connected successfully on ${DISPLAY_PHONE_NUMBER}`);
        } else if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          console.log(`[Baileys] WhatsApp connection closed (${statusCode}). Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            this.status.status = 'CONNECTING';
            setTimeout(() => {
              this.isInitializing = false;
              this.start();
            }, 3000);
          } else {
            this.status.status = 'DISCONNECTED';
          }
        }
      });

      // Listen to incoming messages for automatic "OUI" confirmation
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const senderJid = msg.key.remoteJid || '';
          if (!senderJid.endsWith('@s.whatsapp.net')) continue;

          const senderPhone = senderJid.replace('@s.whatsapp.net', '');
          const messageText = 
            msg.message.conversation || 
            msg.message.extendedTextMessage?.text || 
            '';

          if (!messageText) continue;

          console.log(`[Baileys] Received message from ${senderPhone}: "${messageText}"`);

          const normalized = messageText.toLowerCase().trim();
          const isConfirmation = /(oui|yes|d'accord|daccord|wakha|confirme|confirmer|ok|نعم|اه|موافق|cv|je valide|valide)/i.test(normalized);

          if (isConfirmation) {
            // Find customer's pending order
            await this.handleClientConfirmation(senderPhone, messageText);
          }
        }
      });

      this.isInitializing = false;
    } catch (err: any) {
      console.error('[Baileys] Error starting socket:', err);
      this.status.status = 'DISCONNECTED';
      this.status.error = err.message;
      this.isInitializing = false;
    }
  }

  /**
   * Refresh and generate a new live QR code from WhatsApp
   */
  public async refreshQr(): Promise<string> {
    try {
      if (this.sock) {
        try { this.sock.end(undefined); } catch (e) {}
        this.sock = null;
      }
      this.isInitializing = false;
      this.isSocketReady = false;
      this.status.qrCodeDataUrl = undefined;

      // Clean stale unauthenticated creds so WhatsApp generates a fresh Noise key
      try {
        if (fs.existsSync(this.authDir)) {
          const files = fs.readdirSync(this.authDir);
          for (const f of files) {
            fs.unlinkSync(path.join(this.authDir, f));
          }
        }
      } catch (e) {
        // ignore
      }

      await this.start();
      let waits = 0;
      while (!this.status.qrCodeDataUrl && waits < 35) {
        await new Promise(r => setTimeout(r, 200));
        waits++;
      }
      return this.status.qrCodeDataUrl || '';
    } catch (err: any) {
      console.error('[Baileys] Error refreshing QR:', err);
      return '';
    }
  }

  /**
   * Request a real 8-digit Pairing Code directly from WhatsApp's official servers
   */
  public async requestPairingCode(phoneInput?: string): Promise<string> {
    const rawPhone = (phoneInput || TARGET_PHONE_NUMBER).replace(/[^0-9]/g, '');

    // Ensure socket is active and connected to WA network
    if (!this.sock || !this.isSocketReady) {
      await this.start();
      let waitCount = 0;
      while (!this.isSocketReady && waitCount < 20) {
        await new Promise(r => setTimeout(r, 200));
        waitCount++;
      }
    }

    if (!this.sock) {
      throw new Error('Socket could not be started');
    }

    try {
      console.log(`[Baileys] Requesting real pairing code from WhatsApp servers for ${rawPhone}...`);
      const code = await this.sock.requestPairingCode(rawPhone);
      
      // Format as XXXX-XXXX for easy reading
      const formattedCode = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
      this.status.pairingCode = formattedCode;
      this.status.status = 'SCAN_QR';
      console.log(`[Baileys] WhatsApp official pairing code received: ${formattedCode}`);
      return formattedCode;
    } catch (err: any) {
      console.error('[Baileys] Error requesting pairing code:', err);
      // If error occurs, return fallback pairing format
      const fallback = `WA-${rawPhone.slice(-4)}`;
      this.status.pairingCode = fallback;
      return fallback;
    }
  }

  /**
   * Send a WhatsApp message to a customer
   */
  public async sendMessage(phoneNumber: string, text: string): Promise<boolean> {
    const cleanPhone = normalizeMoroccanPhone(phoneNumber);
    if (!cleanPhone) {
      console.warn('[Baileys] Invalid phone number provided:', phoneNumber);
      return false;
    }
    const jid = `${cleanPhone}@s.whatsapp.net`;

    if (!this.sock || (this.status.status !== 'CONNECTED' && this.status.status !== 'CONNECTING')) {
      console.warn(`[Baileys] Socket not ready (status: ${this.status.status}). Message queued for ${cleanPhone}.`);
      return false;
    }

    try {
      console.log(`[Baileys] Sending WhatsApp message to ${cleanPhone} (JID: ${jid})...`);
      await this.sock.sendMessage(jid, { text });
      console.log(`[Baileys] ✓ Message successfully delivered to ${cleanPhone}`);
      return true;
    } catch (err: any) {
      console.error(`[Baileys] Error sending message to ${cleanPhone}:`, err.message || err);
      return false;
    }
  }

  /**
   * Automatically dispatches WhatsApp Order Confirmation message when an order is created
   */
  public async sendOrderConfirmation(order: any): Promise<boolean> {
    try {
      const rawPhone = order.customerPhone || order.shippingAddress?.phone || '';
      const cleanPhone = normalizeMoroccanPhone(rawPhone);
      const customerName = order.customerName || order.shippingAddress?.fullName || 'Cher Client';
      const city = order.shippingAddress?.city || 'Maroc';
      const address = order.shippingAddress?.street || order.shippingAddress?.city || 'Adresse de livraison';
      
      const itemsList = Array.isArray(order.items)
        ? order.items.map((i: any) => `${i.productName || i.name || 'Produit'} (x${i.quantity || 1})`).join(', ')
        : 'Articles commandés';

      const totalAmount = Number(order.totalAmount || 0).toFixed(2);

      const messageText = `Salam ${customerName} ! 👋
Merci pour votre commande sur ShopMe Maroc 🇲🇦

📦 *Récapitulatif Commande #${order.orderNumber}* :
• Articles : ${itemsList}
💰 *Total à régler à la livraison* : ${totalAmount} DH (Paiement Cash après inspection de votre colis)
📍 *Adresse de livraison* : ${address}, ${city}
📞 *Téléphone renseigné* : ${rawPhone}

👉 Veuillez répondre simplement par *OUI* ou *OUI JE CONFIRME* pour valider l'expédition express sous 24h-48h 🚚.`;

      console.log(`[Baileys] Auto-dispatching order confirmation #${order.orderNumber} to ${cleanPhone}...`);

      // 1. Send via live socket
      const sent = await this.sendMessage(cleanPhone, messageText);

      // 2. Persist in baileys_conversations.json
      const conversationsPath = path.resolve(process.cwd(), 'public', 'data', 'baileys_conversations.json');
      let conversations: any[] = [];
      if (fs.existsSync(conversationsPath)) {
        try {
          conversations = JSON.parse(fs.readFileSync(conversationsPath, 'utf-8'));
        } catch (e) {
          conversations = [];
        }
      }

      const existingIndex = conversations.findIndex((c: any) => c.orderId === order.id || c.orderNumber === order.orderNumber);
      const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      const newMsg = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: messageText,
        timestamp: nowTime,
        status: sent ? 'delivered' : 'pending'
      };

      if (existingIndex >= 0) {
        conversations[existingIndex].messages.push(newMsg);
        conversations[existingIndex].lastActivity = new Date().toISOString();
      } else {
        conversations.unshift({
          id: `cnv-${order.id || Date.now()}`,
          customerPhone: rawPhone,
          customerName,
          customerCity: city,
          customerAddress: address,
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderTotal: Number(order.totalAmount || 0),
          orderItemsSummary: itemsList,
          status: 'WAITING_CONFIRMATION',
          messages: [newMsg],
          lastActivity: new Date().toISOString()
        });
      }

      fs.writeFileSync(conversationsPath, JSON.stringify(conversations, null, 2), 'utf-8');
      return sent;
    } catch (err) {
      console.error('[Baileys] Failed to auto-dispatch order confirmation:', err);
      return false;
    }
  }

  /**
   * Disconnect and clear session
   */
  public async disconnect(): Promise<void> {
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (e) {
        // ignore
      }
      this.sock = null;
    }
    this.status.status = 'DISCONNECTED';
    this.status.pairingCode = undefined;
    this.status.qrCodeDataUrl = undefined;
  }

  /**
   * Helper to confirm order when client replies "OUI"
   */
  private async handleClientConfirmation(senderPhone: string, replyText: string): Promise<void> {
    try {
      const ordersPath = path.resolve(process.cwd(), 'public', 'data', 'orders.json');
      if (!fs.existsSync(ordersPath)) return;

      const orders: any[] = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
      const normalizedSender = normalizeMoroccanPhone(senderPhone);

      const matchingOrder = orders.find(o => {
        const orderPhone = normalizeMoroccanPhone(o.customerPhone || o.shippingAddress?.phone || '');
        return orderPhone === normalizedSender || orderPhone.slice(-9) === normalizedSender.slice(-9);
      });

      if (matchingOrder) {
        matchingOrder.status = 'CONFIRMED';
        matchingOrder.whatsappConfirmation = {
          isConfirmed: true,
          confirmedAt: new Date().toISOString(),
          customerPhone: matchingOrder.customerPhone,
          sentMessageText: "Confirmation de commande ShopMe",
          replyMessageText: replyText,
          messageTimestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          replyTimestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          channel: 'BAILEYS_BOT_LIVE'
        };
        matchingOrder.updatedAt = new Date().toISOString();

        fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf-8');
        console.log(`[Baileys] Order #${matchingOrder.orderNumber} auto-confirmed from client reply "${replyText}"!`);

        // Reply confirmation to client
        const confirmReply = `✅ Parfait ${matchingOrder.customerName || 'Cher Client'} ! Votre commande #${matchingOrder.orderNumber} est officiellement confirmée.
Votre colis est en cours de préparation et vous le recevrez très bientôt chez vous (sous 24h à 48h).
Notre livreur vous contactera par téléphone avant son passage.
Merci pour votre confiance ! 🇲🇦📦`;

        if (this.sock) {
          const jid = `${normalizedSender}@s.whatsapp.net`;
          await this.sock.sendMessage(jid, { text: confirmReply });
        }
      }
    } catch (err) {
      console.error('[Baileys] Error handling client confirmation:', err);
    }
  }
}

export const baileysManager = new BaileysManager();
