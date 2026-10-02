/**
 * Automatic WhatsApp order confirmation.
 *
 * Flow:
 *   1. POST /api/orders saves the order, then calls notifyNewOrder(order).
 *   2. We send the customer a message containing the order number and asking
 *      them to reply OUI (confirm) or NON (cancel).
 *   3. The customer's reply arrives on /api/whatsapp/webhook (Meta Cloud API)
 *      or /api/whatsapp/incoming (any other gateway) -> handleIncomingMessage().
 *   4. The order becomes CONFIRMED / CANCELLED and the customer gets an ack.
 *   5. Failed sends are retried in the background (retryPending()).
 *
 * Providers (WHATSAPP_PROVIDER):
 *   baileys           Your own WhatsApp linked by QR code (no Meta account).
 *   cloud   (default) Official Meta WhatsApp Cloud API.
 *   gateway           Any HTTP bot/gateway: POST {to, message} to WHATSAPP_GATEWAY_URL.
 */

export type NotificationStatus = 'SENT' | 'FAILED' | 'SKIPPED';

export interface WhatsAppNotification {
  status: NotificationStatus;
  provider: string;
  attempts: number;
  lastAttemptAt: string;
  sentAt?: string;
  messageId?: string;
  lastError?: string;
  messageText?: string;
}

const MAX_ATTEMPTS = 5;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v25.0';

const cfg = () => ({
  provider: (process.env.WHATSAPP_PROVIDER || 'cloud').toLowerCase(),
  token: process.env.WHATSAPP_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  templateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
  templateLang: process.env.WHATSAPP_TEMPLATE_LANG || 'fr',
  // Order of the {{1}} {{2}} ... body variables of your template
  templateParams: (process.env.WHATSAPP_TEMPLATE_PARAMS || 'customer_name,order_number,total,city')
    .split(',').map((x) => x.trim()).filter(Boolean),
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  gatewayUrl: process.env.WHATSAPP_GATEWAY_URL || '',
  gatewayToken: process.env.WHATSAPP_GATEWAY_TOKEN || '',
  defaultCountry: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '212',
});

import * as bot from './baileys';

export function isConfigured(): boolean {
  const c = cfg();
  if (c.provider === 'baileys') return bot.isConnected();
  if (c.provider === 'gateway') return !!c.gatewayUrl;
  return !!(c.token && c.phoneNumberId);
}

export function getVerifyToken(): string {
  return cfg().verifyToken;
}

/** "06 12 34 56 78", "+212612345678", "00212612345678", "612345678" -> "212612345678" */
export function normalizePhone(raw: string): string {
  const { defaultCountry } = cfg();
  let p = String(raw || '').trim();
  const hasPlus = p.startsWith('+');
  p = p.replace(/[^0-9]/g, '');
  if (!p) return '';
  if (p.startsWith('00')) return p.slice(2);
  if (hasPlus) return p;
  if (p.startsWith(defaultCountry) && p.length >= 11) return p;
  if (p.startsWith('0')) return defaultCountry + p.slice(1); // local format 06...
  if (p.length === 9) return defaultCountry + p; // 612345678
  return p;
}

/** Compare two phone numbers by their last 9 digits (robust to formatting). */
export function samePhone(a: string, b: string): boolean {
  const x = normalizePhone(a).slice(-9);
  const y = normalizePhone(b).slice(-9);
  return !!x && x === y;
}

// ---------------------------------------------------------------- message text

function fill(template: string, vars: Record<string, string>): string {
  // Supports {{customer_name}}, {customer_name}, {{customerName}}, {customerName}
  let out = template.replace(/\{\{?\s*total\s*\}?\}\s*(MAD|DH)\b/gi, vars.total);
  for (const [key, value] of Object.entries(vars)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    for (const k of new Set([key, camel])) {
      out = out.replace(new RegExp(`\\{\\{?\\s*${k}\\s*\\}?\\}`, 'g'), value);
    }
  }
  return out;
}

function orderVars(order: any): Record<string, string> {
  const items = (order.items || []).map((i: any) => `${i.productName} x${i.quantity}`).join(', ');
  const addr = order.shippingAddress || {};
  return {
    customer_name: addr.fullName || order.customerName || '',
    order_number: order.orderNumber || order.id,
    total: `${Number(order.totalAmount || 0).toFixed(2)} ${order.currency || 'MAD'}`,
    city: addr.city || '',
    address: [addr.street, addr.city].filter(Boolean).join(', '),
    items,
    tracking_number: order.shipment?.trackingNumber || '',
    date: new Date(order.createdAt || Date.now()).toLocaleDateString(
      String(process.env.WHATSAPP_TEMPLATE_LANG || 'fr').startsWith('en') ? 'en-US' : 'fr-FR',
      { year: 'numeric', month: 'short', day: 'numeric' },
    ),
  };
}

const CONFIRM_HINT = '\n\nRépondez *OUI* pour confirmer votre commande ou *NON* pour l\'annuler.';

export function buildConfirmationMessage(order: any, template?: string): string {
  const vars = orderVars(order);
  let msg = template && template.trim() ? fill(template, vars) : '';
  // The message must always carry the order number and the reply instruction.
  if (!msg || !msg.includes(vars.order_number)) {
    msg =
      `Bonjour ${vars.customer_name} 👋\n` +
      `Merci pour votre commande *${vars.order_number}* sur ShopMe.\n` +
      `📦 ${vars.items}\n💰 Total : ${vars.total} (paiement à la livraison)\n📍 ${vars.address}`;
  }
  if (!/\bOUI\b/i.test(msg)) msg += CONFIRM_HINT;
  return msg;
}

// -------------------------------------------------------------------- sending

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  if (!res.ok) {
    const detail = json?.error?.message || json?.message || text.slice(0, 300);
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return json;
}

/** Send a free-form text message. Returns provider message id when available. */
export async function sendText(to: string, body: string): Promise<string | undefined> {
  const c = cfg();
  const phone = normalizePhone(to);
  if (!phone) throw new Error('Numéro de téléphone invalide');

  if (c.provider === 'baileys') {
    return bot.sendTextBaileys(phone, body);
  }

  if (c.provider === 'gateway') {
    const json = await postJson(
      c.gatewayUrl,
      c.gatewayToken ? { Authorization: `Bearer ${c.gatewayToken}` } : {},
      { to: phone, phone, number: phone, message: body, text: body },
    );
    return json?.id || json?.messageId;
  }

  const json = await postJson(
    `https://graph.facebook.com/${GRAPH_VERSION}/${c.phoneNumberId}/messages`,
    { Authorization: `Bearer ${c.token}` },
    { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body, preview_url: false } },
  );
  return json?.messages?.[0]?.id;
}

/**
 * Meta only allows free text inside the 24h customer-service window. A new
 * customer who has never written to you needs an APPROVED TEMPLATE. If
 * WHATSAPP_TEMPLATE_NAME is set we use it (body params: name, order number,
 * total, city), otherwise we fall back to plain text.
 */
async function sendOrderMessage(order: any, text: string): Promise<string | undefined> {
  const c = cfg();
  if (c.provider === 'cloud' && c.templateName) {
    const v = orderVars(order);
    const json = await postJson(
      `https://graph.facebook.com/${GRAPH_VERSION}/${c.phoneNumberId}/messages`,
      { Authorization: `Bearer ${c.token}` },
      {
        messaging_product: 'whatsapp',
        to: normalizePhone(order.customerPhone),
        type: 'template',
        template: {
          name: c.templateName,
          language: { code: c.templateLang },
          components: [
            {
              type: 'body',
              parameters: c.templateParams.map((k) => ({ type: 'text', text: (v as any)[k] || '-' })),
            },
          ],
        },
      },
    );
    return json?.messages?.[0]?.id;
  }
  return sendText(order.customerPhone, text);
}

// ------------------------------------------------------------ notify + retries

export type OrderStore = {
  getOrders: () => Promise<any[]>;
  patchOrder: (id: string, patch: Record<string, unknown>) => Promise<any | undefined>;
  getTemplate: () => string | undefined;
};

let store: OrderStore | null = null;
export function init(s: OrderStore) {
  store = s;
}

/** Send (or re-send) the confirmation request for one order and record the result. */
export async function notifyOrder(order: any): Promise<WhatsAppNotification> {
  if (!store) throw new Error('WhatsApp module not initialised');
  const prev: WhatsAppNotification | undefined = order.whatsappNotification;
  const now = new Date().toISOString();
  const attempts = (prev?.attempts || 0) + 1;
  const provider = cfg().provider;

  let result: WhatsAppNotification;

  if (!isConfigured()) {
    const reason =
      provider === 'baileys'
        ? 'WhatsApp non connecté: scannez le QR sur /api/whatsapp/qr'
        : provider === 'gateway'
        ? 'WHATSAPP_GATEWAY_URL non configuré'
        : 'WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID non configurés';
    console.warn(`[whatsapp] ${order.orderNumber}: SKIPPED - ${reason}`);
    result = { status: 'SKIPPED', provider, attempts: prev?.attempts || 0, lastAttemptAt: now, lastError: reason };
  } else {
    const text = buildConfirmationMessage(order, store.getTemplate());
    try {
      const messageId = await sendOrderMessage(order, text);
      console.log(`[whatsapp] ${order.orderNumber}: SENT to ${normalizePhone(order.customerPhone)}`);
      result = { status: 'SENT', provider, attempts, lastAttemptAt: now, sentAt: now, messageId, messageText: text };
    } catch (err: any) {
      let msg: string = err.message;
      if (/expired|OAuthException|\b190\b/i.test(msg)) msg = `Token WhatsApp expiré ou invalide: générez un nouveau token. (${msg})`;
      else if (/132000|number of parameters/i.test(msg)) msg = `Le nombre de variables ne correspond pas au template: vérifiez WHATSAPP_TEMPLATE_PARAMS. (${msg})`;
      else if (/131030|allowed list/i.test(msg)) msg = `Numéro non autorisé en mode test: ajoutez-le dans Meta > API Setup > To. (${msg})`;
      console.warn(`[whatsapp] ${order.orderNumber}: FAILED (attempt ${attempts}) - ${msg}`);
      result = { status: 'FAILED', provider, attempts, lastAttemptAt: now, lastError: msg, messageText: text };
    }
  }

  await store.patchOrder(order.id, { whatsappNotification: result });
  return result;
}

/** Fire-and-forget entry point used right after an order is saved. */
export function notifyNewOrder(order: any) {
  notifyOrder(order).catch((e) => console.error('[whatsapp] notify error:', e));
}

/** Retry FAILED sends (and SKIPPED ones once the provider has been configured). */
export async function retryPending() {
  if (!store || !isConfigured()) return;
  const orders = await store.getOrders();
  const cutoff = Date.now() - 48 * 3600 * 1000; // don't chase very old orders
  for (const o of orders) {
    if (o.status === 'CANCELLED' || o.whatsappConfirmation?.isConfirmed) continue;
    if (new Date(o.createdAt).getTime() < cutoff) continue;
    const n: WhatsAppNotification | undefined = o.whatsappNotification;
    const needs = !n || n.status === 'SKIPPED' || (n.status === 'FAILED' && n.attempts < MAX_ATTEMPTS);
    if (!needs) continue;
    if (n?.status === 'FAILED' && Date.now() - new Date(n.lastAttemptAt).getTime() < 60_000 * n.attempts) continue;
    await notifyOrder(o);
  }
}

export function startRetryLoop(intervalMs = 60_000) {
  const t = setInterval(() => retryPending().catch((e) => console.error('[whatsapp] retry error:', e)), intervalMs);
  t.unref?.();
  setTimeout(() => retryPending().catch(() => null), 5000).unref?.();
}

// ------------------------------------------------------------ incoming replies

const YES = /^(oui|ouii+|ok|okay|yes|y|1|confirm|confirme|confirmer|confirmé|d'?accord|wakha|waxa|واخا|نعم|اه|ايه|أكيد|تأكيد)(?=$|\s)/i;
const NO = /^(non|no|n|2|annul|annuler|annule|cancel|لا|الغاء|إلغاء)(?=$|\s)/i;

export function parseIntent(text: string): 'YES' | 'NO' | 'UNKNOWN' {
  const t = String(text || '').trim().toLowerCase().replace(/[*_~!.,;:]+/g, ' ').trim();
  if (!t) return 'UNKNOWN';
  if (NO.test(t)) return 'NO';
  if (YES.test(t)) return 'YES';
  return 'UNKNOWN';
}

/** Customer replied. Finds their pending order and confirms / cancels it. */
export async function handleIncomingMessage(from: string, text: string): Promise<string> {
  if (!store) return 'not-initialised';
  const orders = await store.getOrders();
  const mine = orders.filter((o) => samePhone(o.customerPhone, from));
  if (!mine.length) return 'no-order';

  // If the reply mentions an order number, use it; otherwise the latest open order.
  const mentioned = mine.find((o) => o.orderNumber && text.toUpperCase().includes(String(o.orderNumber).toUpperCase()));
  const open = mine
    .filter((o) => o.status !== 'CANCELLED' && !o.whatsappConfirmation?.isConfirmed && o.whatsappNotification?.status === 'SENT')
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const order = mentioned || open[0];
  if (!order) return 'nothing-pending';

  const intent = parseIntent(text);
  const now = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (intent === 'YES') {
    await store.patchOrder(order.id, {
      status: 'CONFIRMED',
      whatsappConfirmation: {
        isConfirmed: true,
        confirmedAt: now,
        customerPhone: order.customerPhone,
        sentMessageText: order.whatsappNotification?.messageText || '',
        replyMessageText: text,
        messageTimestamp: timeStr,
        replyTimestamp: timeStr,
        channel: 'WHATSAPP_BOT',
      },
    });
    await sendText(from, `✅ Merci ! Votre commande *${order.orderNumber}* est confirmée. Nous la préparons pour la livraison.`).catch(() => null);
    return 'confirmed';
  }
  if (intent === 'NO') {
    await store.patchOrder(order.id, { status: 'CANCELLED' });
    await sendText(from, `Votre commande *${order.orderNumber}* a été annulée. À bientôt chez ShopMe !`).catch(() => null);
    return 'cancelled';
  }
  await sendText(from, `Pour la commande *${order.orderNumber}*, répondez *OUI* pour confirmer ou *NON* pour annuler.`).catch(() => null);
  return 'unclear';
}

/** Extract {from, text} pairs from a Meta Cloud API webhook payload. */
export function extractCloudMessages(body: any): { from: string; text: string }[] {
  const out: { from: string; text: string }[] = [];
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      for (const m of change?.value?.messages || []) {
        const text =
          m.text?.body ||
          m.button?.text ||
          m.button?.payload ||
          m.interactive?.button_reply?.title ||
          m.interactive?.button_reply?.id ||
          '';
        if (m.from && text) out.push({ from: m.from, text });
      }
    }
  }
  return out;
}
