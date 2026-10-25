import makeWASocket, {
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  normalizeMessageContent,
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
import { generateSalesReply, isSalesBotEnabled, areFollowUpsEnabled, buildBotOrder, productVideo, AdContext, ChatTurn } from './salesBot.js';

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
  /** Saves an order taken in the chat by the AI assistant (no confirmation message is sent: the chat already confirmed it) */
  createOrder?(order: any): Promise<void>;
}

/** Catalog and public URL for the AI sales assistant, provided by server.ts */
export interface BotCatalog {
  listProducts(): Promise<any[]>;
  siteUrl(): string;
  /** Store settings (delivery fees by city, free-shipping threshold…) */
  settings(): Promise<any>;
  /** Bytes of an uploaded file (/uploads/...), from disk or the database */
  loadMedia(url: string): Promise<{ data: Buffer; mimeType: string } | null>;
}

/** Per-customer AI chat memory, kept in the WhatsApp store (PostgreSQL) so it survives redeploys */
interface AiChat {
  turns: ChatTurn[];
  ad?: AdContext;
  pausedUntil?: number;
  day: string;
  repliesToday: number;
  /** Products whose demo video was already sent in this chat */
  videosSent?: string[];
  /** Follow-ups sent since the customer's last message (max 2) */
  followUps?: number;
  orderNumber?: string;
  orderAt?: number;
}

const OUTBOX_KEY = 'shop-outbox';
const PROCESSED_KEY = 'shop-processed-ids';
const MAX_BACKOFF_MS = 60_000;
const WATCHDOG_INTERVAL_MS = 60_000;
const OUTBOX_MAX_AGE_MS = 3 * 24 * 3600 * 1000;
const INCOMING_MAX_AGE_S = 3 * 24 * 3600;
// The AI waits for the shopper to finish typing (they often send several short messages) before answering once
const AI_DEBOUNCE_MS = 6000;
// After the team writes in a chat (from the phone or WhatsApp Web), the AI stays silent in that chat
const HUMAN_TAKEOVER_MS = 12 * 3600 * 1000;
const AI_MAX_REPLIES_PER_DAY = 40;
// Customers who go quiet get at most 2 follow-ups, only inside WhatsApp's 24h window after their last message
// A list of {phone, at}: Baileys' JSON reviver turns objects with only numeric keys (phone numbers) into Buffers
const AI_CHAT_INDEX_KEY = 'ai-chat-index-v2';
type ChatIndex = { phone: string; at: number }[];
const FOLLOW_UP_1_MS = 60 * 60 * 1000;
const FOLLOW_UP_2_MS = 20 * 3600 * 1000;
const FOLLOW_UP_WINDOW_MS = 23 * 3600 * 1000;
const FOLLOW_UP_EVERY_TICKS = 5;

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

/** Click-to-WhatsApp ads (Facebook / Instagram) attach the ad that was clicked to the shopper's first message */
function adContextOf(msg: WAMessage): AdContext | undefined {
  const m: any = normalizeMessageContent(msg.message) || {};
  const info = m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || m.videoMessage?.contextInfo;
  const ad = info?.externalAdReply;
  if (!ad) return undefined;
  return { title: ad.title || undefined, body: ad.body || undefined, sourceUrl: ad.sourceUrl || undefined };
}

/** Rejects when a step takes longer than `ms` (a WhatsApp or AI call that never answers would block the reply forever) */
function withTimeout<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    work,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${what} : pas de réponse après ${Math.round(ms / 1000)} s`)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

const pnOf = (jid?: string | null) =>
  jid && jid.endsWith('@s.whatsapp.net') ? jid.split('@')[0].split(':')[0] : undefined;

class BaileysManager {
  private sock: WASocket | null = null;
  private store: WaStore | null = null;
  private pool: pg.Pool | null = null;
  private usePostgres = false;
  private orderStore: BotOrderStore | null = null;
  private catalog: BotCatalog | null = null;
  private aiTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private botSendingAt = new Map<string, number>();
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
  private watchdogTicks = 0;
  /** Last bot decisions, shown in the admin so the owner can see why a customer got (or did not get) an answer */
  private activity: { at: string; phone: string; event: string }[] = [];
  private followingUp = false;

  constructor() {
    this.status = {
      status: 'CONNECTING',
      phoneNumber: DISPLAY_PHONE_NUMBER,
      uptimeSeconds: 0
    };
  }

  /** Called once by server.ts before start() */
  public configure(opts: { pool: pg.Pool; usePostgres: boolean; orderStore: BotOrderStore; catalog?: BotCatalog }) {
    this.pool = opts.pool;
    this.usePostgres = opts.usePostgres;
    this.orderStore = opts.orderStore;
    this.catalog = opts.catalog || null;
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

  private note(phone: string, event: string) {
    this.activity.unshift({ at: new Date().toISOString(), phone: phone ? `+${normalizeMoroccanPhone(phone)}` : '?', event });
    if (this.activity.length > 50) this.activity.length = 50;
  }

  public getActivity() {
    return this.activity;
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
      if (++this.watchdogTicks % FOLLOW_UP_EVERY_TICKS === 0) {
        this.sendFollowUps().catch(err => console.error('[SalesBot] Follow-up error:', err));
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
          await this.handleIncoming(msg).catch(err => {
            console.error('[Baileys] Incoming message error:', err);
            this.note((msg.key.remoteJid || '?').split('@')[0], `Erreur à la réception : ${String(err?.message || err).slice(0, 160)}`);
          });
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
    const key = msg.key as WAMessage['key'] & { remoteJidAlt?: string; senderPn?: string };
    const remote = key.remoteJid || '';
    if (remote.endsWith('@g.us') || remote.endsWith('@broadcast') || remote.endsWith('@newsletter')) return undefined;
    const direct = pnOf(remote) || pnOf(key.remoteJidAlt) || pnOf(key.senderPn);
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
    if (msg.key.fromMe) return this.noteTeamMessage(msg);
    const from = msg.key.remoteJid || '?';
    if (!msg.key.id) return;
    if (!msg.message) {
      // Usually a message this linked device could not decrypt yet; WhatsApp re-sends it once keys are exchanged
      console.log(`[Baileys] Skipped message from ${from}: no readable content (stub ${msg.messageStubType ?? 'none'})`);
      if (!from.endsWith('@g.us') && !from.endsWith('@broadcast') && !from.endsWith('@newsletter')) {
        this.note(from.split('@')[0], 'Message illisible (pas encore déchiffré par WhatsApp)');
      }
      return;
    }
    if (this.processedIds.includes(msg.key.id)) return;
    const ts = Number(msg.messageTimestamp || 0);
    if (ts && Date.now() / 1000 - ts > INCOMING_MAX_AGE_S) return;

    // Disappearing-message chats, view-once and similar wrappers put the real content one level deeper
    const content = normalizeMessageContent(msg.message);
    const text =
      content?.conversation ||
      content?.extendedTextMessage?.text ||
      content?.imageMessage?.caption ||
      content?.videoMessage?.caption ||
      content?.buttonsResponseMessage?.selectedDisplayText ||
      content?.listResponseMessage?.title ||
      '';
    if (!text) {
      console.log(`[Baileys] Skipped message from ${from}: no text (${Object.keys(content || {}).join(', ') || 'empty'})`);
      if (!from.endsWith('@g.us') && !from.endsWith('@broadcast') && !from.endsWith('@newsletter') && !from.endsWith('@lid')) {
        this.note(from.split('@')[0], 'Message sans texte (photo, vocal…) : ignoré');
      }
      return;
    }

    const phone = await this.senderPhone(msg);
    if (!phone) {
      console.log(`[Baileys] Skipped message from ${from}: could not resolve the phone number`);
      this.note(from, 'Numéro du client introuvable (contact @lid) : message ignoré');
      return;
    }
    await this.markProcessed(msg.key.id);

    console.log(`[Baileys] Message from ${phone}: "${text}"`);
    this.appendConversation(phone, 'client', text);

    this.note(phone, `Reçu : « ${text.slice(0, 80)} »`);
    const intent = detectIntent(text);
    if (intent === 'YES' && (await this.handleClientConfirmation(phone, text))) {
      this.note(phone, 'Réponse « oui » : commande du site confirmée');
      return;
    }
    if (intent === 'NO') this.setConversationStatus(phone, 'IN_DISCUSSION');

    // Everything else (questions, shoppers coming from an ad…) is answered by the AI sales assistant.
    // Messages that piled up while the bot was offline for hours are left to the team.
    const fresh = !ts || Date.now() / 1000 - ts < 6 * 3600;
    if (!isSalesBotEnabled()) this.note(phone, "Salma est ARRÊTÉE (interrupteur) ou aucune clé IA : pas de réponse");
    else if (!fresh) this.note(phone, 'Message de plus de 6h : laissé à l\'équipe');
    if (isSalesBotEnabled() && fresh) {
      if (this.ensureLeadConversation(phone, msg.pushName || undefined, adContextOf(msg))) {
        this.appendConversation(phone, 'client', text);
      }
      await this.queueAiReply(phone, text, adContextOf(msg));
    }
  }

  /**
   * A message written by the team (phone app or WhatsApp Web) in a customer's chat hands the chat over to a human.
   * Messages the bot sends itself also come back here, so they are recognised by their send time.
   */
  private async noteTeamMessage(msg: WAMessage) {
    // WhatsApp also echoes hidden "fromMe" messages (receipts, key/protocol updates, reactions, edits, system stubs).
    // Only something a person actually wrote or sent hands the chat over, otherwise Salma went silent for no reason.
    const content: any = normalizeMessageContent(msg.message);
    const written =
      content?.conversation ||
      content?.extendedTextMessage?.text ||
      content?.imageMessage?.caption ||
      content?.videoMessage?.caption ||
      content?.documentMessage?.caption ||
      '';
    const media = content?.imageMessage ? 'photo'
      : content?.videoMessage ? 'vidéo'
      : content?.audioMessage ? 'vocal'
      : content?.documentMessage ? 'document'
      : content?.stickerMessage ? 'sticker'
      : content?.locationMessage ? 'localisation'
      : content?.contactMessage ? 'contact'
      : '';
    if (!written && !media) return;

    const phone = await this.senderPhone(msg);
    if (!phone) return;
    const sentByBot = Date.now() - (this.botSendingAt.get(phone) || 0) < 15_000 || (!!msg.key.id && this.sentCache.has(msg.key.id));
    if (sentByBot) return;
    const ts = Number(msg.messageTimestamp || 0) * 1000;
    if (ts && Date.now() - ts > HUMAN_TAKEOVER_MS) return;
    const chat = await this.readAiChat(phone);
    chat.pausedUntil = Date.now() + HUMAN_TAKEOVER_MS;
    await this.writeAiChat(phone, chat);
    const what = written ? `« ${written.slice(0, 60)} »` : `(${media})`;
    this.note(phone, `Message écrit par l'équipe depuis le téléphone ${what} : Salma se tait 12h dans ce chat`);
  }

  /** Lets Salma answer again in a chat the team had taken over */
  public async resumeAiChat(phone: string) {
    const chat = await this.readAiChat(phone);
    chat.pausedUntil = undefined;
    await this.writeAiChat(phone, chat);
    this.note(phone, 'Salma réactivée dans ce chat par l\'admin');
    // A customer message that arrived during the pause (less than 6 h ago) is answered now
    const last = chat.turns[chat.turns.length - 1];
    if (isSalesBotEnabled() && last?.role === 'client' && Date.now() - new Date(last.at).getTime() < 6 * 3600 * 1000) {
      this.answerWithAi(phone).catch(err => this.note(phone, `Erreur pendant la réponse : ${String(err?.message || err).slice(0, 160)}`));
    }
  }

  private aiChatKey(phone: string) {
    return `ai-chat-${normalizeMoroccanPhone(phone)}`;
  }

  private async readAiChat(phone: string): Promise<AiChat> {
    const store = await this.getStore();
    const today = new Date().toISOString().slice(0, 10);
    const chat = (await store.read<AiChat>(this.aiChatKey(phone)).catch(() => null)) || { turns: [], day: today, repliesToday: 0 };
    if (chat.day !== today) {
      chat.day = today;
      chat.repliesToday = 0;
    }
    return chat;
  }

  private async writeAiChat(phone: string, chat: AiChat) {
    chat.turns = chat.turns.slice(-30);
    const store = await this.getStore();
    await store.write(this.aiChatKey(phone), chat).catch(err => console.warn('[SalesBot] Chat save error:', err.message));
  }

  private async queueAiReply(phone: string, text: string, ad: AdContext | undefined) {
    const chat = await this.readAiChat(phone);
    chat.turns.push({ role: 'client', text, at: new Date().toISOString() });
    chat.followUps = 0;
    if (ad) chat.ad = ad;
    await this.writeAiChat(phone, chat);
    await this.touchChatIndex(phone);

    const pending = this.aiTimers.get(phone);
    if (pending) clearTimeout(pending);
    this.note(phone, `Réponse prévue dans ${AI_DEBOUNCE_MS / 1000} s`);
    this.aiTimers.set(phone, setTimeout(() => {
      this.aiTimers.delete(phone);
      this.answerWithAi(phone).catch(err => {
        console.error('[SalesBot] Reply error:', err);
        this.note(phone, `Erreur pendant la réponse : ${String(err?.message || err).slice(0, 160)}`);
      });
    }, AI_DEBOUNCE_MS));
  }

  private async answerWithAi(phone: string) {
    const chat = await this.readAiChat(phone);
    if (chat.pausedUntil && chat.pausedUntil > Date.now()) {
      const until = new Date(chat.pausedUntil).toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      this.note(phone, `Salma en pause dans ce chat jusqu'au ${until} (l'équipe a pris la main)`);
      return;
    }
    if (chat.repliesToday >= AI_MAX_REPLIES_PER_DAY) {
      this.note(phone, `Limite de ${AI_MAX_REPLIES_PER_DAY} réponses par jour atteinte pour ce client`);
      return;
    }
    if (chat.turns[chat.turns.length - 1]?.role !== 'client') {
      this.note(phone, 'Rien à répondre (le dernier message de ce chat vient déjà de Salma)');
      return;
    }

    this.note(phone, 'Salma prépare la réponse…');
    const started = Date.now();
    const [products, openOrder, settings] = await withTimeout(
      Promise.all([
        this.catalog ? this.catalog.listProducts().catch(() => []) : Promise.resolve([]),
        this.findOpenOrder(phone).catch(() => undefined),
        this.catalog ? this.catalog.settings().catch(() => null) : Promise.resolve(null)
      ]),
      30_000,
      'Lecture du catalogue'
    );
    const result = await withTimeout(
      generateSalesReply({
        history: chat.turns,
        products,
        siteUrl: this.catalog?.siteUrl() || '',
        settings,
        ad: chat.ad,
        openOrder
      }),
      120_000,
      "Réponse de l'IA"
    );
    this.note(phone, `Réponse IA prête en ${Math.round((Date.now() - started) / 1000)} s, envoi sur WhatsApp…`);

    if (result.reason?.startsWith('IA indisponible')) this.note(phone, result.reason);
    this.botSendingAt.set(phone, Date.now());
    if (!(await withTimeout(this.sendMessage(phone, result.reply), 60_000, 'Envoi WhatsApp'))) {
      this.note(phone, 'Échec de l\'envoi WhatsApp (message mis en attente)');
      return;
    }
    this.note(phone, `Répondu : « ${result.reply.slice(0, 80)} »`);
    const lastClientText = chat.turns[chat.turns.length - 1]?.text || '';
    const previousBotText = [...chat.turns].reverse().find(t => t.role === 'bot')?.text || '';
    chat.turns.push({ role: 'bot', text: result.reply, at: new Date().toISOString() });
    chat.repliesToday++;
    this.appendConversation(phone, 'bot', result.reply);

    if (result.video) await this.sendProductVideo(phone, chat, products, result.video);

    if (result.order) {
      await this.saveChatOrder(phone, chat, products, settings, result.order, { botText: previousBotText, clientText: lastClientText });
    } else if (result.needsHuman) {
      // The team takes over: the AI stays silent in this chat until the pause ends.
      // Not when the AI itself failed: Salma must be able to answer the next message once it is back.
      if (!result.reason?.startsWith('IA indisponible')) chat.pausedUntil = Date.now() + HUMAN_TAKEOVER_MS;
      const note = `A TRAITER PAR L'EQUIPE : ${result.reason || 'demande du client'}`;
      this.flagLeadConversation(phone, note);
      console.log(`[SalesBot] ${phone} handed over to the team: ${note}`);
    }
    await this.writeAiChat(phone, chat);
  }

  /** Sends the product's demo video once per chat, right after the text reply */
  private async sendProductVideo(phone: string, chat: AiChat, products: any[], slug: string) {
    if (chat.videosSent?.includes(slug) || !this.sock || !this.isConnected() || !this.catalog) return;
    const product = products.find(p => p.slug === slug);
    const video = product ? productVideo(product) : null;
    if (!video) return;
    const media = await this.catalog.loadMedia(video.url).catch(() => null);
    if (!media) {
      console.warn(`[SalesBot] Demo video ${video.url} not found`);
      return;
    }
    try {
      this.botSendingAt.set(phone, Date.now());
      const caption = video.caption || 'هاهو كيفاش كيخدم 👆';
      const sent = await this.sock.sendMessage(`${normalizeMoroccanPhone(phone)}@s.whatsapp.net`, { video: media.data, mimetype: media.mimeType || 'video/mp4', caption });
      if (sent?.key.id && sent.message) this.sentCache.set(sent.key.id, sent.message);
      chat.videosSent = [...(chat.videosSent || []), slug];
      this.appendConversation(phone, 'bot', `🎥 ${caption}`);
      this.note(phone, 'Vidéo démo envoyée');
      console.log(`[SalesBot] Demo video of ${slug} sent to ${phone}`);
    } catch (err: any) {
      console.warn(`[SalesBot] Video send error to ${phone}:`, err.message || err);
    }
  }

  /** The customer confirmed the summary in the chat: the order goes straight into the store, priced from the catalog */
  private async saveChatOrder(phone: string, chat: AiChat, products: any[], settings: any, collected: any, confirmation: { botText: string; clientText: string }) {
    const alreadyOrdered = !!chat.orderAt && Date.now() - chat.orderAt < 12 * 3600 * 1000;
    const built = alreadyOrdered || !this.orderStore?.createOrder
      ? { error: alreadyOrdered ? `commande #${chat.orderNumber} déjà créée il y a peu` : 'enregistrement indisponible' }
      : buildBotOrder({ collected, products, settings, phone, confirmation, adTitle: chat.ad?.title });

    if (built.order) {
      try {
        await this.orderStore!.createOrder!(built.order);
        chat.orderNumber = built.order.orderNumber;
        chat.orderAt = Date.now();
        this.flagLeadConversation(phone, `COMMANDE CRÉÉE #${built.order.orderNumber} : ${built.order.items[0].productName} x${built.order.items[0].quantity} - ${built.order.totalAmount} DH`);
        this.setConversationStatus(phone, 'CONFIRMED');
        this.note(phone, `Commande #${built.order.orderNumber} créée (${built.order.totalAmount} DH)`);
        console.log(`[SalesBot] Order #${built.order.orderNumber} created from the chat with ${phone}`);
        return;
      } catch (err: any) {
        built.error = err.message || 'erreur à l\'enregistrement';
      }
    }
    // Could not save it automatically: the team creates it by hand
    chat.pausedUntil = Date.now() + HUMAN_TAKEOVER_MS;
    const note = `COMMANDE A CREER (${built.error}) : ${collected.productSlug || collected.product || '?'} x${collected.quantity || 1} - ${collected.fullName || '?'}, ${collected.city || '?'}, ${collected.address || '?'}`;
    this.flagLeadConversation(phone, note);
    console.warn(`[SalesBot] ${phone}: ${note}`);
  }

  private async readChatIndex(): Promise<ChatIndex> {
    const store = await this.getStore();
    const index = await store.read<ChatIndex>(AI_CHAT_INDEX_KEY).catch(() => null);
    return Array.isArray(index) ? index.filter(e => e && typeof e.phone === 'string' && typeof e.at === 'number') : [];
  }

  /** Remembers when the customer last wrote (for follow-ups); a failure here must never stop the reply */
  private async touchChatIndex(phone: string) {
    try {
      const now = Date.now();
      const target = normalizeMoroccanPhone(phone);
      const index = (await this.readChatIndex()).filter(e => e.phone !== target && now - e.at < 25 * 3600 * 1000);
      index.push({ phone: target, at: now });
      const store = await this.getStore();
      await store.write(AI_CHAT_INDEX_KEY, index);
    } catch (err: any) {
      console.warn('[SalesBot] Chat index error:', err.message || err);
    }
  }

  /** Follow-up n°1 after 1h of silence, n°2 after 20h, never after WhatsApp's 24h window or once an order exists */
  private async sendFollowUps() {
    if (this.followingUp || !areFollowUpsEnabled() || !this.isConnected()) return;
    this.followingUp = true;
    try {
      const index = await this.readChatIndex();
      const now = Date.now();
      for (const { phone, at: lastClientAt } of index) {
        const silence = now - lastClientAt;
        if (silence < FOLLOW_UP_1_MS || silence > FOLLOW_UP_WINDOW_MS) continue;
        const chat = await this.readAiChat(phone);
        const sent = chat.followUps || 0;
        const last = chat.turns[chat.turns.length - 1];
        if (!last || last.role !== 'bot' || sent >= 2) continue;
        if (chat.pausedUntil && chat.pausedUntil > now) continue;
        if (chat.orderAt && chat.orderAt > lastClientAt - 60_000) continue;
        if (sent === 1 && silence < FOLLOW_UP_2_MS) continue;
        if (now - new Date(last.at).getTime() < FOLLOW_UP_1_MS) continue;
        if (await this.findOpenOrder(phone)) continue;

        const [products, settings] = await Promise.all([
          this.catalog ? this.catalog.listProducts().catch(() => []) : Promise.resolve([]),
          this.catalog ? this.catalog.settings().catch(() => null) : Promise.resolve(null)
        ]);
        const result = await generateSalesReply({ history: chat.turns, products, siteUrl: this.catalog?.siteUrl() || '', settings, ad: chat.ad, followUp: sent + 1 });
        if (!result.reply) continue;
        this.botSendingAt.set(phone, Date.now());
        if (!(await this.sendMessage(phone, result.reply))) continue;
        chat.turns.push({ role: 'bot', text: result.reply, at: new Date().toISOString() });
        chat.followUps = sent + 1;
        await this.writeAiChat(phone, chat);
        this.appendConversation(phone, 'bot', result.reply);
        console.log(`[SalesBot] Follow-up ${sent + 1}/2 sent to ${phone}`);
        await new Promise(r => setTimeout(r, 3000));
      }
    } finally {
      this.followingUp = false;
    }
  }

  private async findOpenOrder(phone: string): Promise<any | undefined> {
    if (!this.orderStore) return undefined;
    const target = normalizeMoroccanPhone(phone).slice(-9);
    const orders = await this.orderStore.listOrders().catch(() => [] as any[]);
    return orders
      .filter(o => normalizeMoroccanPhone(o.customerPhone || o.shippingAddress?.phone || '').slice(-9) === target)
      .filter(o => !['DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(o.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  /** Shoppers who write without an order get their own entry on the admin WhatsApp page (true when created) */
  private ensureLeadConversation(phone: string, name: string | undefined, ad: AdContext | undefined): boolean {
    const list = this.readConversations();
    if (this.findConversation(list, phone)) return false;
    list.unshift({
      id: `lead-${normalizeMoroccanPhone(phone)}`,
      customerPhone: `+${normalizeMoroccanPhone(phone)}`,
      customerName: name || 'Prospect WhatsApp',
      customerCity: '',
      customerAddress: '',
      orderId: '',
      orderNumber: ad ? 'PUB' : 'PROSPECT',
      orderTotal: 0,
      orderItemsSummary: ad?.title ? `Pub : ${ad.title}` : "Discussion avec l'assistant IA",
      status: 'IN_DISCUSSION',
      messages: [],
      lastActivity: new Date().toISOString()
    });
    this.writeConversations(list);
    return true;
  }

  private flagLeadConversation(phone: string, note: string) {
    const list = this.readConversations();
    const conv = this.findConversation(list, phone);
    if (!conv) return;
    conv.orderItemsSummary = note;
    conv.lastActivity = new Date().toISOString();
    this.writeConversations(list);
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
      const [exists] = (await withTimeout(this.sock.onWhatsApp(jid), 8_000, 'Vérification du numéro').catch(err => {
        console.warn(`[Baileys] ${err.message} (${cleanPhone}), sending anyway`);
        return undefined;
      })) || [];
      if (exists && exists.exists === false) return 'NOT_ON_WHATSAPP';
      const sent = await withTimeout(this.sock.sendMessage(jid, { text }), 30_000, 'Envoi WhatsApp');
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
  private async handleClientConfirmation(senderPhone: string, replyText: string): Promise<boolean> {
    if (!this.orderStore) return false;
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
      return false;
    }
    // A "yes" right after a message from Salma answers her question, not the older order confirmation
    const aiChat = await this.readAiChat(senderPhone);
    const lastBotTurn = [...aiChat.turns].reverse().find(t => t.role === 'bot');
    if (lastBotTurn && new Date(lastBotTurn.at).getTime() > new Date(matchingOrder.createdAt).getTime()) return false;

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
    return true;
  }
}

export const baileysManager = new BaileysManager();
