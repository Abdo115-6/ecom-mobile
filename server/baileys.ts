/**
 * WhatsApp "bot" connection using Baileys (WhatsApp Web protocol).
 * No Meta account needed: you link your own WhatsApp by scanning a QR code once.
 *
 * Unofficial: WhatsApp can restrict numbers that behave like spam. Use a dedicated
 * number and only message customers who just ordered (which is what this app does).
 */
import path from 'path';
import fs from 'fs';

export type IncomingHandler = (from: string, text: string) => void | Promise<void>;

let sock: any = null;
let state: 'idle' | 'connecting' | 'qr' | 'open' = 'idle';
let qrDataUrl: string | null = null;
let me: string | null = null;
let started = false;
let onIncoming: IncomingHandler | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

const sessionDir = () => path.resolve(process.env.WHATSAPP_SESSION_DIR || path.join(process.cwd(), 'data', 'wa-session'));

export function getStatus() {
  return { state, connected: state === 'open', account: me, hasQr: !!qrDataUrl };
}
export function isConnected() {
  return state === 'open';
}
export function getQr() {
  return qrDataUrl;
}

export async function startBaileys(handler: IncomingHandler) {
  if (started) return;
  started = true;
  onIncoming = handler;
  await connect();
}

async function connect() {
  state = 'connecting';
  const baileys: any = await import('@whiskeysockets/baileys');
  const makeWASocket = baileys.default?.default || baileys.default || baileys.makeWASocket;
  const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;
  const pino = (await import('pino')).default;

  fs.mkdirSync(sessionDir(), { recursive: true });
  const { state: auth, saveCreds } = await useMultiFileAuthState(sessionDir());

  let version: number[] | undefined;
  try {
    version = (await fetchLatestBaileysVersion()).version;
  } catch { /* offline: use library default */ }

  sock = makeWASocket({
    version,
    auth,
    logger: pino({ level: 'silent' }),
    browser: Browsers?.macOS ? Browsers.macOS('Desktop') : ['ShopMe', 'Desktop', '1.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u: any) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      state = 'qr';
      const QRCode = (await import('qrcode')).default;
      qrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 1 });
      console.log('[whatsapp-bot] QR prêt: ouvrez /api/whatsapp/qr pour le scanner');
    }
    if (connection === 'open') {
      state = 'open';
      qrDataUrl = null;
      me = String(sock.user?.id || '').split(':')[0].split('@')[0] || null;
      console.log(`[whatsapp-bot] connecté (${me})`);
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      state = 'idle';
      qrDataUrl = null;
      if (code === DisconnectReason.loggedOut) {
        console.warn('[whatsapp-bot] déconnecté depuis le téléphone: session supprimée, nouveau QR requis');
        fs.rmSync(sessionDir(), { recursive: true, force: true });
      } else {
        console.warn(`[whatsapp-bot] connexion fermée (code ${code}), reconnexion...`);
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => connect().catch((e) => console.error('[whatsapp-bot] reconnect error:', e)), 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
    if (type !== 'notify') return;
    for (const m of messages || []) {
      try {
        if (!m.message || m.key?.fromMe) continue;
        const jid: string = m.key.remoteJid || '';
        if (jid.endsWith('@g.us') || jid === 'status@broadcast') continue;
        // Newer WhatsApp versions may use @lid ids; prefer the real phone jid when provided.
        const phoneJid: string = m.key.senderPn || m.key.remoteJidAlt || jid;
        if (phoneJid.endsWith('@lid')) {
          console.warn('[whatsapp-bot] message reçu avec un identifiant @lid non résolu: mise à jour de Baileys nécessaire');
          continue;
        }
        const text =
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          m.message.buttonsResponseMessage?.selectedDisplayText ||
          '';
        if (!text) continue;
        await onIncoming?.(phoneJid.split('@')[0].split(':')[0], text);
      } catch (e) {
        console.error('[whatsapp-bot] incoming error:', e);
      }
    }
  });
}

// Spread messages out (3-6s apart) so bursts of orders don't look like spam.
let queue: Promise<unknown> = Promise.resolve();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function sendTextBaileys(phone: string, text: string): Promise<string | undefined> {
  const job = queue.then(async () => {
    if (!isConnected() || !sock) throw new Error('WhatsApp non connecté: scannez le QR sur /api/whatsapp/qr');
    const found = await sock.onWhatsApp(phone);
    const entry = Array.isArray(found) ? found[0] : undefined;
    if (!entry?.exists) throw new Error(`Le numéro ${phone} n'est pas inscrit sur WhatsApp`);
    const sent = await sock.sendMessage(entry.jid, { text });
    await sleep(3000 + Math.random() * 3000);
    return sent?.key?.id as string | undefined;
  });
  queue = job.catch(() => null);
  return job;
}

export async function logoutBaileys() {
  try { await sock?.logout(); } catch { /* already closed */ }
  fs.rmSync(sessionDir(), { recursive: true, force: true });
  state = 'idle';
  qrDataUrl = null;
  me = null;
}
