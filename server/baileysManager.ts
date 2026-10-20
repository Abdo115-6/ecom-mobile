import makeWASocket, {
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  WAMessage,
  proto
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import type pg from 'pg';
import { createWaStore, useStoreAuthState, WaStore } from './waAuthState.js';

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
  lastDisconnectAt?: string;
  lastDisconnectReason?: string;
  reconnectAttempts?: number;
  pendingOutbox?: number;
  sessionStorage?: 'postgres' | 'file';
  error?: string;
  uptimeSeconds: number;
}

interface OutboxItem {
  id: string;
  phone: string;
  text: string;
  orderNumber?: string;
  createdAt: string;
  attempts: number;
}

/** Order persistence provided by server.ts (file + PostgreSQL) */
export interface BotOrderStore {
  listOrders(): Promise<any[]>;
  updateOrder(id: string, patch: { status?: string; whatsappConfirmation?: any }): Promise<void>;
}

const OUTBOX_KEY = 'shop-outbox';
const PROCESSED_KEY = 'shop-processed-ids';
const MAX_BACKOFF_MS = 60_000;
const WATCHDOG_INTERVAL_MS = 60_000;
const OUTBOX_MAX_AGE_MS = 3 * 24 * 3600 * 1000;
const INCOMING_MAX_AGE_S = 3 * 24 * 3600;

// Word-level intent detection (\b does not work with Arabic, so tokens are compared)
const YES_WORDS = ['oui', 'ouii', 'ouiii', 'yes', 'ok', 'okay', 'daccord', "d'accord", 'wakha', 'wakhaa', 'waxa', 'confirme', 'confirmer', 'confirmé', 'je confirme', 'valide', 'je valide', 'iyeh', 'نعم', 'واخا', 'موافق', 'أكيد', 'اكيد', '👍', '✅'];
const NO_WORDS = ['non', 'annuler', 'annule', 'annulé', 'cancel', 'ma bghitch', 'mabghitch', 'الغاء', 'إلغاء'];
// Short words that are only meaningful when they are the whole reply ("la" is also French)
const YES_EXACT = ['ah', 'aah', 'cv', 'اه', 'آه', 'ايه'];
const NO_EXACT = ['la', 'laa', 'no', 'لا'];

export function detectIntent(text: string): 'YES' | 'NO' | 'UNKNOWN' {
  const t = text.toLowerCase().trim().replace(/[!.?,;]+/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = new Set(t.split(' '));
  const has = (words: string[]) => words.some(w => (w.includes(' ') ? t.includes(w) : tokens.has(w)));
  if (NO_EXACT.includes(t) || has(NO_WORDS)) return 'NO';
  if (YES_EXACT.includes(t) || has(YES_WORDS)) return 'YES';
  return 'UNKNOWN';
}

const pnOf = (jid?: string | null) =>
  jid && jid.endsWith('@s.whatsapp.net') ? jid.split('@')[0].split(':')[0] : undefined;

class BaileysManager {
  private sock: WASocket | null = null;
  private store: WaStore | null = null;
  private pool: pg.Pool | null = null;
  private usePostgres = false;
  private orderStore: BotOrderStore | null = null;
  private status: BaileysManagerStatus;
  private isInitializing = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private stoppedByReplacement = false;
  private manuallyStopped = false;
  private startTime = Date.now();
  private outbox: OutboxItem[] = [];
  private processedIds: string[] = [];
  private sentCache = new Map<string, proto.IMessage>();
  private flushing = false;

  constructor() {
    this.status = {
      status: 'CONNECTING',
      phoneNumber: DISPLAY_PHONE_NUMBER,
      uptimeSeconds: 0
    };
  }

  /** Called once by server.ts before start() */
  public configure(opts: { pool: pg.Pool; usePostgres: boolean; orderStore: BotOrderStore }) {
    this.pool = opts.pool;
    this.usePostgres = opts.usePostgres;
    this.orderStore = opts.orderStore;
  }

  private async getStore(): Promise<WaStore> {
    if (!this.store) {
      this.store = await createWaStore({
        pool: this.pool as pg.Pool,
        usePostgres: this.usePostgres && !!this.pool,
        fileDir: path.resolve(process.cwd(), 'data', 'wa-session'),
        legacyDirs: [path.resolve(process.cwd(), 'public', 'data', 'baileys_auth')]
      });
      this.status.sessionStorage = this.store.backend;
      this.outbox = (await this.store.read<OutboxItem[]>(OUTBOX_KEY)) || [];
      this.processedIds = (await this.store.read<string[]>(PROCESSED_KEY)) || [];
      if (this.store.backend === 'file') {
        console.warn('[Baileys] Session stored on local disk: it will be lost on redeploy unless DATABASE_URL (PostgreSQL) is set.');
      }
    }
    return this.store;
  }

  public getStatus(): BaileysManagerStatus {
    return {
      ...this.status,
      reconnectAttempts: this.reconnectAttempts,
      pendingOutbox: this.outbox.length,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  public isConnected(): boolean {
    return this.status.status === 'CONNECTED' && !!this.sock;
  }

  private startWatchdog() {
    if (this.watchdog) return;
    this.watchdog = setInterval(() => {
      if (this.manuallyStopped || this.stoppedByReplacement || this.isInitializing || this.reconnectTimer) return;
      const wsOpen = (this.sock as any)?.ws?.isOpen;
      if (this.status.status === 'CONNECTED' && wsOpen === false) {
        console.warn('[Baileys] Watchdog: socket marked connected but websocket is closed, restarting');
        this.restartSocket(0);
      } else if (this.status.status === 'DISCONNECTED' || (!this.sock && this.status.status !== 'SCAN_QR')) {
        console.warn('[Baileys] Watchdog: bot not running, restarting');
        this.restartSocket(0);
      } else if (this.status.status === 'CONNECTED' && this.outbox.length > 0) {
        this.flushOutbox();
      }
    }, WATCHDOG_INTERVAL_MS);
    this.watchdog.unref?.();
  }

  private closeSocket() {
    if (!this.sock) return;
    try {
      this.sock.ev.removeAllListeners('connection.update');
      this.sock.ev.removeAllListeners('messages.upsert');
      this.sock.ev.removeAllListeners('creds.update');
      this.sock.end(undefined);
    } catch {
      // ignore
    }
    this.sock = null;
  }

  private restartSocket(delayMs: number) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.isInitializing = false;
      this.start();
    }, delayMs);
  }

  public async start(): Promise<void> {
    if (this.isInitializing || (this.sock && this.status.status === 'CONNECTED')) {
      return;
    }
    if (process.env.WHATSAPP_BOT_ENABLED === 'false') {
      this.status.status = 'DISCONNECTED';
      this.status.error = 'Bot désactivé (WHATSAPP_BOT_ENABLED=false)';
      return;
    }

    this.isInitializing = true;
    this.manuallyStopped = false;
    this.stoppedByReplacement = false;
    this.status.status = 'CONNECTING';
    this.startWatchdog();

    try {
      const store = await this.getStore();
      const { state, saveCreds } = await useStoreAuthState(store);
      let version: [number, number, number] = [2, 3000, 1023223821];
      try {
        const v = await fetchLatestBaileysVersion();
        if (v?.version) version = v.version as [number, number, number];
      } catch {
        // fallback version
      }

      const logger = pino({ level: 'silent' });
      this.closeSocket();
      const sock = makeWASocket({
        version,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger as any) },
        printQRInTerminal: false,
        logger: logger as any,
        browser: Browsers.windows('Desktop'),
        syncFullHistory: false,
        // false = the phone keeps receiving notifications while the bot is online
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 20000,
        retryRequestDelayMs: 2000,
        // Lets WhatsApp re-request a message the customer could not decrypt
        getMessage: async key => (key.id ? this.sentCache.get(key.id) : undefined)
      });
      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async update => {
        if (this.sock !== sock) return; // event from an old socket
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.status.qrCodeDataUrl = await QRCode.toDataURL(qr, {
              errorCorrectionLevel: 'M',
              margin: 2,
              width: 320,
              color: { dark: '#000000', light: '#ffffff' }
            });
            this.status.status = 'SCAN_QR';
          } catch (err) {
            console.error('[Baileys] Error rendering QR code:', err);
          }
        }

        if (connection === 'open') {
          this.reconnectAttempts = 0;
          this.status.status = 'CONNECTED';
          this.status.connectedAt = new Date().toISOString();
          this.status.qrCodeDataUrl = undefined;
          this.status.pairingCode = undefined;
          this.status.error = undefined;
          console.log(`[Baileys] WhatsApp connected on ${DISPLAY_PHONE_NUMBER} (session: ${store.backend})`);
          this.flushOutbox();
        } else if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          this.status.lastDisconnectAt = new Date().toISOString();
          this.status.lastDisconnectReason = `${statusCode ?? 'inconnu'} ${lastDisconnect?.error?.message || ''}`.trim();
          this.closeSocket();
          this.isInitializing = false;

          if (statusCode === DisconnectReason.loggedOut) {
            // Unlinked from the phone: the old keys are useless, show a fresh QR code
            console.warn('[Baileys] Logged out from the phone, a new QR scan is required');
            await store.clearAuth();
            this.status.status = 'SCAN_QR';
            this.status.error = 'Appareil délié depuis le téléphone : scannez à nouveau le QR code';
            this.restartSocket(2000);
          } else if (statusCode === DisconnectReason.connectionReplaced) {
            // Another server instance (new deploy or local dev) is using the same session: let it win
            console.warn('[Baileys] Session opened by another instance; this instance stops the bot');
            this.stoppedByReplacement = true;
            this.status.status = 'DISCONNECTED';
            this.status.error = 'Session utilisée par une autre instance du serveur (nouveau déploiement ou serveur local)';
          } else if (statusCode === DisconnectReason.badSession) {
            await store.clearAuth();
            this.status.status = 'SCAN_QR';
            this.status.error = 'Session corrompue : scannez à nouveau le QR code';
            this.restartSocket(2000);
          } else if (statusCode === DisconnectReason.restartRequired) {
            this.restartSocket(0);
          } else if (!this.manuallyStopped) {
            const delay = Math.min(MAX_BACKOFF_MS, 2000 * 2 ** this.reconnectAttempts);
            this.reconnectAttempts++;
            this.status.status = state.creds.registered ? 'CONNECTING' : 'SCAN_QR';
            console.log(`[Baileys] Connection closed (${statusCode}). Reconnecting in ${delay / 1000}s`);
            this.restartSocket(delay);
          }
        }
      });

      // 'notify' = live messages, 'append' = messages received while the bot was offline
      sock.ev.on('messages.upsert', async ({ messages }) => {
        if (this.sock !== sock) return;
        for (const msg of messages) {
          await this.handleIncoming(msg).catch(err => console.error('[Baileys] Incoming message error:', err));
        }
      });

      this.isInitializing = false;
    } catch (err: any) {
      console.error('[Baileys] Error starting socket:', err);
      this.status.status = 'DISCONNECTED';
      this.status.error = err.message;
      this.isInitializing = false;
      this.restartSocket(Math.min(MAX_BACKOFF_MS, 5000 * 2 ** this.reconnectAttempts++));
    }
  }

  /** Resolves the customer's phone number, including Baileys v7 "@lid" chats */
  private async senderPhone(msg: WAMessage): Promise<string | undefined> {
    const key = msg.key as WAMessage['key'] & { remoteJidAlt?: string };
    const remote = key.remoteJid || '';
    if (remote.endsWith('@g.us') || remote.endsWith('@broadcast') || remote.endsWith('@newsletter')) return undefined;
    const direct = pnOf(remote) || pnOf(key.remoteJidAlt);
    if (direct) return direct;
    if (remote.endsWith('@lid') && this.sock) {
      try {
        const pn = await (this.sock as any).signalRepository?.lidMapping?.getPNForLID(remote);
        return pnOf(pn);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private async markProcessed(id: string) {
    this.processedIds.push(id);
    if (this.processedIds.length > 2000) this.processedIds = this.processedIds.slice(-1500);
    await this.store?.write(PROCESSED_KEY, this.processedIds).catch(() => {});
  }

  private async handleIncoming(msg: WAMessage) {
    if (!msg.message || msg.key.fromMe || !msg.key.id) return;
    if (this.processedIds.includes(msg.key.id)) return;
    const ts = Number(msg.messageTimestamp || 0);
    if (ts && Date.now() / 1000 - ts > INCOMING_MAX_AGE_S) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.buttonsResponseMessage?.selectedDisplayText ||
      msg.message.listResponseMessage?.title ||
      '';
    if (!text) return;

    const phone = await this.senderPhone(msg);
    if (!phone) return;
    await this.markProcessed(msg.key.id);

    console.log(`[Baileys] Message from ${phone}: "${text}"`);
    this.appendConversation(phone, 'client', text);

    const intent = detectIntent(text);
    if (intent === 'YES') {
      await this.handleClientConfirmation(phone, text);
    } else if (intent === 'NO') {
      this.setConversationStatus(phone, 'IN_DISCUSSION');
    }
  }

  /**
   * Refresh and generate a new live QR code from WhatsApp
   */
  public async refreshQr(): Promise<string> {
    try {
      this.closeSocket();
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.isInitializing = false;
      this.status.qrCodeDataUrl = undefined;

      // Fresh keys so WhatsApp generates a new QR code
      const store = await this.getStore();
      await store.clearAuth();

      await this.start();
      let waits = 0;
      while (!this.status.qrCodeDataUrl && waits < 50) {
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
    const rawPhone = normalizeMoroccanPhone(phoneInput || TARGET_PHONE_NUMBER);

    if (!this.sock) {
      await this.start();
    }
    // The socket must be connected to WhatsApp (QR stage) before a code can be requested
    let waitCount = 0;
    while (this.status.status !== 'SCAN_QR' && this.status.status !== 'CONNECTED' && waitCount < 50) {
      await new Promise(r => setTimeout(r, 200));
      waitCount++;
    }
    if (this.status.status === 'CONNECTED') {
      throw new Error('WhatsApp est déjà connecté');
    }
    if (!this.sock) {
      throw new Error('Connexion WhatsApp impossible pour le moment, réessayez dans quelques secondes');
    }

    const code = await this.sock.requestPairingCode(rawPhone);
    const formattedCode = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
    this.status.pairingCode = formattedCode;
    console.log(`[Baileys] Pairing code received for ${rawPhone}`);
    return formattedCode;
  }

  private async saveOutbox() {
    await this.store?.write(OUTBOX_KEY, this.outbox).catch(err => console.warn('[Baileys] Outbox save error:', err.message));
  }

  private async sendNow(cleanPhone: string, text: string): Promise<'SENT' | 'NOT_ON_WHATSAPP' | 'FAILED'> {
    if (!this.sock || this.status.status !== 'CONNECTED') return 'FAILED';
    const jid = `${cleanPhone}@s.whatsapp.net`;
    try {
      const [exists] = (await this.sock.onWhatsApp(jid)) || [];
      if (exists && exists.exists === false) return 'NOT_ON_WHATSAPP';
      const sent = await this.sock.sendMessage(jid, { text });
      if (sent?.key.id && sent.message) {
        this.sentCache.set(sent.key.id, sent.message);
        if (this.sentCache.size > 500) this.sentCache.delete(this.sentCache.keys().next().value as string);
      }
      return 'SENT';
    } catch (err: any) {
      console.error(`[Baileys] Error sending message to ${cleanPhone}:`, err.message || err);
      return 'FAILED';
    }
  }

  /** Sends now, or keeps the message in a persistent outbox and sends it as soon as WhatsApp reconnects */
  public async sendMessage(phoneNumber: string, text: string, orderNumber?: string): Promise<boolean> {
    const cleanPhone = normalizeMoroccanPhone(phoneNumber);
    if (!cleanPhone || cleanPhone.length < 11) {
      console.warn('[Baileys] Invalid phone number provided:', phoneNumber);
      return false;
    }

    const result = await this.sendNow(cleanPhone, text);
    if (result === 'SENT') return true;
    if (result === 'NOT_ON_WHATSAPP') {
      console.warn(`[Baileys] ${cleanPhone} is not on WhatsApp`);
      return false;
    }

    await this.getStore();
    this.outbox.push({
      id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      phone: cleanPhone,
      text,
      orderNumber,
      createdAt: new Date().toISOString(),
      attempts: 0
    });
    await this.saveOutbox();
    console.warn(`[Baileys] WhatsApp offline: message for ${cleanPhone} saved in outbox (${this.outbox.length} pending)`);
    return false;
  }

  private async flushOutbox() {
    if (this.flushing || !this.isConnected() || this.outbox.length === 0) return;
    this.flushing = true;
    try {
      const now = Date.now();
      const remaining: OutboxItem[] = [];
      for (const item of this.outbox) {
        if (now - new Date(item.createdAt).getTime() > OUTBOX_MAX_AGE_MS || item.attempts >= 5) {
          console.warn(`[Baileys] Outbox message to ${item.phone} dropped (too old or too many attempts)`);
          continue;
        }
        const result = await this.sendNow(item.phone, item.text);
        if (result === 'SENT') {
          console.log(`[Baileys] Outbox message delivered to ${item.phone}`);
          this.markConversationDelivered(item.phone);
        } else if (result === 'FAILED') {
          remaining.push({ ...item, attempts: item.attempts + 1 });
        }
        await new Promise(r => setTimeout(r, 1500)); // spacing to avoid WhatsApp spam detection
      }
      this.outbox = remaining;
      await this.saveOutbox();
    } finally {
      this.flushing = false;
    }
  }

  // --- Conversation log (admin WhatsApp page) ---

  private conversationsPath() {
    return path.resolve(process.cwd(), 'public', 'data', 'baileys_conversations.json');
  }

  private readConversations(): any[] {
    try {
      return JSON.parse(fs.readFileSync(this.conversationsPath(), 'utf-8'));
    } catch {
      return [];
    }
  }

  private writeConversations(list: any[]) {
    try {
      fs.mkdirSync(path.dirname(this.conversationsPath()), { recursive: true });
      fs.writeFileSync(this.conversationsPath(), JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Baileys] Conversation log write error:', err);
    }
  }

  private findConversation(list: any[], phone: string) {
    const target = normalizeMoroccanPhone(phone).slice(-9);
    return list.find(c => normalizeMoroccanPhone(c.customerPhone || '').slice(-9) === target);
  }

  private appendConversation(phone: string, sender: 'bot' | 'client', text: string) {
    const list = this.readConversations();
    const conv = this.findConversation(list, phone);
    if (!conv) return;
    conv.messages.push({
      id: `msg-${Date.now()}-${sender}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' }),
      status: 'delivered'
    });
    conv.lastActivity = new Date().toISOString();
    this.writeConversations(list);
  }

  private setConversationStatus(phone: string, status: string) {
    const list = this.readConversations();
    const conv = this.findConversation(list, phone);
    if (!conv) return;
    conv.status = status;
    conv.lastActivity = new Date().toISOString();
    this.writeConversations(list);
  }

  private markConversationDelivered(phone: string) {
    const list = this.readConversations();
    const conv = this.findConversation(list, phone);
    if (!conv) return;
    conv.messages.forEach((m: any) => { if (m.status === 'pending') m.status = 'delivered'; });
    this.writeConversations(list);
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

👉 Veuillez répondre simplement par *OUI* pour valider l'expédition express sous 24h-48h 🚚.`;

      console.log(`[Baileys] Order confirmation #${order.orderNumber} → ${cleanPhone}`);
      const sent = await this.sendMessage(cleanPhone, messageText, order.orderNumber);

      const conversations = this.readConversations();
      const existing = conversations.find((c: any) => c.orderId === order.id || c.orderNumber === order.orderNumber);
      const newMsg = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: messageText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' }),
        status: sent ? 'delivered' : 'pending'
      };

      if (existing) {
        existing.messages.push(newMsg);
        existing.lastActivity = new Date().toISOString();
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
      this.writeConversations(conversations);
      return sent;
    } catch (err) {
      console.error('[Baileys] Failed to dispatch order confirmation:', err);
      return false;
    }
  }

  /**
   * Stops the bot without unlinking the device (session is kept, reconnects on next start)
   */
  public async disconnect(): Promise<void> {
    this.manuallyStopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.closeSocket();
    this.status.status = 'DISCONNECTED';
    this.status.pairingCode = undefined;
    this.status.qrCodeDataUrl = undefined;
  }

  /** Clean shutdown on redeploy so the new instance can take over the session immediately */
  public async shutdown(): Promise<void> {
    this.manuallyStopped = true;
    if (this.watchdog) clearInterval(this.watchdog);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    await this.saveOutbox();
    this.closeSocket();
  }

  /**
   * Confirms the customer's most recent unconfirmed order when they reply "OUI"
   */
  private async handleClientConfirmation(senderPhone: string, replyText: string): Promise<void> {
    if (!this.orderStore) return;
    const target = normalizeMoroccanPhone(senderPhone).slice(-9);
    const orders = await this.orderStore.listOrders();
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;

    const matchingOrder = orders
      .filter(o => normalizeMoroccanPhone(o.customerPhone || o.shippingAddress?.phone || '').slice(-9) === target)
      .filter(o => ['PENDING', 'PROCESSING'].includes(o.status) && !o.whatsappConfirmation?.isConfirmed)
      .filter(o => new Date(o.createdAt).getTime() > sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!matchingOrder) {
      console.log(`[Baileys] "${replyText}" from ${senderPhone}: no unconfirmed order found`);
      return;
    }

    const now = new Date();
    await this.orderStore.updateOrder(matchingOrder.id, {
      status: 'CONFIRMED',
      whatsappConfirmation: {
        isConfirmed: true,
        confirmedAt: now.toISOString(),
        customerPhone: matchingOrder.customerPhone,
        sentMessageText: 'Confirmation de commande ShopMe',
        replyMessageText: replyText,
        messageTimestamp: now.toISOString(),
        replyTimestamp: now.toISOString(),
        channel: 'WHATSAPP_BOT'
      }
    });
    this.setConversationStatus(senderPhone, 'CONFIRMED');
    console.log(`[Baileys] Order #${matchingOrder.orderNumber} confirmed by customer reply "${replyText}"`);

    const confirmReply = `✅ Parfait ${matchingOrder.customerName || 'Cher Client'} ! Votre commande #${matchingOrder.orderNumber} est confirmée.
Votre colis est en préparation, vous le recevrez sous 24h à 48h.
Notre livreur vous contactera par téléphone avant son passage.
Merci pour votre confiance ! 🇲🇦📦`;
    if (await this.sendMessage(senderPhone, confirmReply, matchingOrder.orderNumber)) {
      this.appendConversation(senderPhone, 'bot', confirmReply);
    }
  }
}

export const baileysManager = new BaileysManager();
