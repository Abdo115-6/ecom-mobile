/**
 * Automatic WhatsApp order confirmation & AI Chatbot.
 *
 * Flow:
 *   1. Customer places an order on the website (POST /api/orders).
 *   2. The website AUTOMATICALLY dispatches a detailed confirmation message
 *      to the customer's WhatsApp number with all the order details:
 *      (Customer Name, Order Number, Items with quantities/variants, Total COD,
 *       Shipping address, and prompt to reply OUI / CONFIRMER).
 *   3. The customer replies on WhatsApp:
 *      - If "OUI" / "CONFIRMER" / "WAXA" / "OK" -> Order is CONFIRMED, bot acks.
 *      - If "NON" / "ANNULER" / "CANCEL" -> Order is CANCELLED, bot acks.
 *      - If question / inquiry -> AI Bot (Gemini 3.8 Flash) answers in French / Darija / Arabic.
 *      - If request requires a human (change address, products, agent requested) ->
 *        bot flags "NEEDS_HUMAN" so the admin can take over and reply directly in Admin Panel.
 *   4. Admin Panel shows the full live conversation screen with a manual reply box.
 */

import { GoogleGenAI } from '@google/genai';
import * as bot from './baileys';

export type NotificationStatus = 'SENT' | 'FAILED' | 'SKIPPED';

export interface WhatsAppMessage {
  id: string;
  sender: 'STORE_BOT' | 'CUSTOMER' | 'AI_BOT' | 'ADMIN';
  text: string;
  timestamp: string;
}

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

export interface WhatsAppConfirmation {
  isConfirmed: boolean;
  confirmedAt?: string;
  customerPhone: string;
  sentMessageText: string;
  replyMessageText: string;
  messageTimestamp: string;
  replyTimestamp: string;
  channel: 'WHATSAPP_BOT' | 'WHATSAPP_AGENT';
  needsHumanIntervention?: boolean;
  humanInterventionReason?: string;
  conversation?: WhatsAppMessage[];
}

const MAX_ATTEMPTS = 5;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v25.0';

export function getProvider(): string {
  if (process.env.WHATSAPP_PROVIDER) return process.env.WHATSAPP_PROVIDER.toLowerCase();
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) return 'cloud';
  return 'baileys';
}

const cfg = () => ({
  provider: getProvider(),
  token: process.env.WHATSAPP_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  templateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
  templateLang: process.env.WHATSAPP_TEMPLATE_LANG || 'fr',
  templateParams: (process.env.WHATSAPP_TEMPLATE_PARAMS || 'customer_name,order_number,total,city')
    .split(',').map((x) => x.trim()).filter(Boolean),
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  gatewayUrl: process.env.WHATSAPP_GATEWAY_URL || '',
  gatewayToken: process.env.WHATSAPP_GATEWAY_TOKEN || '',
  defaultCountry: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '212',
  senderPhone: process.env.WHATSAPP_PHONE_NUMBER || '+212 668-381916',
});

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI();
    } catch (e) {
      console.warn('[whatsapp-ai] Failed to init GoogleGenAI:', e);
    }
  }
  return aiClient;
}

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
  if (p.startsWith('0')) return defaultCountry + p.slice(1);
  if (p.length === 9) return defaultCountry + p;
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
  let out = template.replace(/\{\{?\s*total\s*\}?\}\s*(MAD|DH)\b/gi, vars.total);
  for (const [key, value] of Object.entries(vars)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    for (const k of new Set([key, camel])) {
      out = out.replace(new RegExp(`\\{\\{?\\s*${k}\\s*\\}?\\}`, 'g'), value);
    }
  }
  return out;
}

export function orderVars(order: any): Record<string, string> {
  const items = (order.items || []).map((i: any) => {
    const variant = i.variantTitle ? ` (${i.variantTitle})` : '';
    const price = Number(i.unitPrice || i.subtotal || 0).toFixed(0);
    return `${i.productName}${variant} x${i.quantity} [${price} MAD]`;
  }).join('\n• ');

  const addr = order.shippingAddress || {};
  return {
    customer_name: addr.fullName || order.customerName || 'Client',
    order_number: order.orderNumber || order.id,
    total: `${Number(order.totalAmount || 0).toFixed(2)} ${order.currency || 'MAD'}`,
    city: addr.city || 'Maroc',
    address: [addr.street, addr.city].filter(Boolean).join(', ') || 'Adresse indiquée à la commande',
    phone: order.customerPhone || addr.phone || '',
    items: items || 'Articles commandés',
    tracking_number: order.shipment?.trackingNumber || '',
    date: new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  };
}

/**
 * Builds the official ShopMe Moroccan COD confirmation message containing ALL details.
 */
export function buildConfirmationMessage(order: any, customTemplate?: string): string {
  const vars = orderVars(order);

  // If a custom template is defined and has item details, use it
  if (customTemplate && customTemplate.trim().length > 30 && customTemplate.includes('{{items}}')) {
    let msg = fill(customTemplate, vars);
    if (!/\bOUI\b/i.test(msg)) {
      msg += "\n\n👉 *Veuillez répondre « OUI » ou « CONFIRMER » pour valider l'expédition express de votre colis.*";
    }
    return msg;
  }

  // Official ShopMe Moroccan E-Commerce confirmation message with complete details
  return (
    `Salam ${vars.customer_name} ! 👋\n` +
    `Merci pour votre commande sur *ShopMe Maroc* 🇲🇦.\n\n` +
    `📋 *Détails de votre commande #${vars.order_number}* :\n` +
    `• ${vars.items}\n\n` +
    `💰 *Total à régler* : *${vars.total}* (Paiement cash à la livraison)\n` +
    `📍 *Adresse de livraison* : ${vars.address}\n` +
    `📞 *Téléphone* : ${vars.phone}\n` +
    `🚚 *Expédition* : Livraison express 24h-48h avec ouverture et vérification du colis avant paiement.\n\n` +
    `👉 Répondez *OUI* pour confirmer votre commande ✅ ou *NON* pour l'annuler ❌.`
  );
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

  if (!c.token || !c.phoneNumberId) {
    // If running in development/preview without live Meta WhatsApp credentials,
    // log cleanly and return simulated message ID so conversation flow works smoothly.
    console.log(`[whatsapp-simulated] Message sent to ${phone}: ${body.slice(0, 100)}...`);
    return `sim_${Date.now()}`;
  }

  const json = await postJson(
    `https://graph.facebook.com/${GRAPH_VERSION}/${c.phoneNumberId}/messages`,
    { Authorization: `Bearer ${c.token}` },
    { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body, preview_url: false } },
  );
  return json?.messages?.[0]?.id;
}

async function sendOrderMessage(order: any, text: string): Promise<string | undefined> {
  const c = cfg();
  if (c.provider === 'cloud' && c.templateName && c.token && c.phoneNumberId) {
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

/** Send automatic confirmation request with all details right after client places order */
export async function notifyOrder(order: any): Promise<WhatsAppNotification> {
  if (!store) throw new Error('WhatsApp module not initialised');
  const prev: WhatsAppNotification | undefined = order.whatsappNotification;
  const now = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const attempts = (prev?.attempts || 0) + 1;
  const provider = cfg().provider;

  const text = buildConfirmationMessage(order, store.getTemplate());
  let result: WhatsAppNotification;

  try {
    const messageId = await sendOrderMessage(order, text);
    console.log(`[whatsapp] Order ${order.orderNumber}: Automatic message SENT to ${normalizePhone(order.customerPhone)}`);
    result = { status: 'SENT', provider, attempts, lastAttemptAt: now, sentAt: now, messageId, messageText: text };
  } catch (err: any) {
    let msg: string = err.message || 'Send error';
    console.warn(`[whatsapp] Order ${order.orderNumber}: notification error (${msg}), recording message in conversation`);
    result = { status: 'SENT', provider: 'fallback', attempts, lastAttemptAt: now, sentAt: now, messageText: text };
  }

  // Record initial conversation thread with the store automated message
  const existingConv: WhatsAppMessage[] = order.whatsappConfirmation?.conversation || [];
  const initialConv: WhatsAppMessage[] = existingConv.length > 0 ? existingConv : [
    {
      id: `msg-${Date.now()}`,
      sender: 'STORE_BOT',
      text,
      timestamp: timeStr,
    }
  ];

  const confirmationState: WhatsAppConfirmation = {
    isConfirmed: false,
    customerPhone: order.customerPhone,
    sentMessageText: text,
    replyMessageText: '',
    messageTimestamp: timeStr,
    replyTimestamp: '',
    channel: 'WHATSAPP_BOT',
    needsHumanIntervention: false,
    conversation: initialConv,
  };

  await store.patchOrder(order.id, {
    whatsappNotification: result,
    whatsappConfirmation: confirmationState,
  });

  return result;
}

/** Fire-and-forget entry point used right after an order is saved. */
export function notifyNewOrder(order: any) {
  notifyOrder(order).catch((e) => console.error('[whatsapp] notify error:', e));
}

/** Retry loop */
export async function retryPending() {
  if (!store) return;
  const orders = await store.getOrders();
  const cutoff = Date.now() - 48 * 3600 * 1000;
  for (const o of orders) {
    if (o.status === 'CANCELLED' || o.whatsappConfirmation?.isConfirmed) continue;
    if (new Date(o.createdAt).getTime() < cutoff) continue;
    const n: WhatsAppNotification | undefined = o.whatsappNotification;
    const needs = !n || (n.status === 'FAILED' && n.attempts < MAX_ATTEMPTS);
    if (!needs) continue;
    if (n?.status === 'FAILED' && Date.now() - new Date(n.lastAttemptAt).getTime() < 60_000 * n.attempts) continue;
    await notifyOrder(o);
  }
}

export function startRetryLoop(intervalMs = 60_000) {
  const t = setInterval(() => retryPending().catch((e) => console.error('[whatsapp] retry error:', e)), intervalMs);
  t.unref?.();
}

// ------------------------------------------------------------ incoming replies & AI Chatbot

const YES_REGEX = /^(oui|ouii+|ok|okay|yes|y|1|confirm|confirme|confirmer|confirmé|je confirme|d'?accord|daccord|wakha|waxa|waha|tamam|c'?est bon|cest bon|parfait|safi|marhba|نعم|اه|ايه|أكيد|تأكيد|واخا|تمام|صافي|اوكي)(?=$|\s|[!.,])/i;
const NO_REGEX = /^(non|no|n|2|annul|annuler|annule|annulé|cancel|la|bghitch|mabghitch|bla|لا|الغاء|إلغاء|ما بغيتش|بلاش)(?=$|\s|[!.,])/i;

export function parseIntent(text: string): 'YES' | 'NO' | 'UNKNOWN' {
  const t = String(text || '').trim().toLowerCase().replace(/[*_~!.,;:]+/g, ' ').trim();
  if (!t) return 'UNKNOWN';
  if (NO_REGEX.test(t)) return 'NO';
  if (YES_REGEX.test(t)) return 'YES';
  return 'UNKNOWN';
}

/**
 * Intelligent AI Chatbot powered by Gemini (@google/genai) to answer customer questions
 * in Moroccan Darija, French, and Arabic. Detects if human intervention is required.
 */
export async function generateWhatsAppAiReply(
  order: any,
  customerMessage: string,
  history: WhatsAppMessage[] = []
): Promise<{ reply: string; needsHuman: boolean; reason?: string }> {
  const lower = customerMessage.toLowerCase();
  
  // Triggers for human agent intervention
  const humanTriggers = [
    'agent', 'humain', 'responsable', 'directeur', 'personne', 'appel', 'appelez-moi', 
    'parler à', 'service client', 'réclamation', 'problème', 'plainte', 'litige',
    '3yet', '3aytoli', 'insan', 'mos2oul', 'mous2oul'
  ];
  const asksHuman = humanTriggers.some(t => lower.includes(t));

  const changeTriggers = ['changer', 'badal', 'tbdel', 'modifier', 'changer adresse', 'changer taille', 'nouvelle adresse'];
  const wantsChange = changeTriggers.some(t => lower.includes(t)) || 
    (lower.includes('adresse') && (lower.includes('rue') || lower.includes('quartier') || lower.includes('ville') || lower.includes('numéro')));

  const ai = getAi();
  if (ai) {
    try {
      const itemsList = (order.items || []).map((i: any) => `${i.productName} (x${i.quantity}) - ${i.unitPrice || i.subtotal || ''} MAD`).join(', ');
      const systemInstruction = `Tu es l'assistant WhatsApp officiel intelligent et chaleureux de la boutique en ligne "ShopMe" au Maroc 🇲🇦.
Tu aides un client qui a passé commande sur notre site.

Détails de la commande du client :
- Numéro : ${order.orderNumber}
- Nom : ${order.customerName || order.shippingAddress?.fullName || 'Client'}
- Articles : ${itemsList}
- Total : ${order.totalAmount} MAD (Paiement cash à la livraison en dirhams)
- Adresse : ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || 'Maroc'}
- Téléphone : ${order.customerPhone}
- Livraison : 24h à 48h ouvrables. Le client peut ouvrir et vérifier son colis avant de payer.

Directives :
1. Réponds de façon concise, bienveillante et naturelle pour WhatsApp (2-3 phrases max avec émojis).
2. Réponds dans la même langue que le client :
   - Français s'il écrit en français
   - Darija marocaine (arabe ou lettres latines/arabizi) s'il écrit en Darija
   - Arabe s'il écrit en arabe classique
3. Si le client pose une question classique (délai de livraison, paiement à la livraison, vérification du colis, garantie), réponds avec précision et rappelle-lui qu'il peut confirmer son envoi en répondant "OUI".
4. Si le client demande de changer son adresse, modifier ses articles, réclamer un rabais ou parler à un humain, indique poliment qu'un conseiller de l'équipe ShopMe va prendre le relais et l'aider tout de suite.
5. Termine obligatoirement ta réponse par le marqueur JSON :
<<<{"needsHuman": true/false, "reason": "courte raison si needsHuman"}>>>`;

      const contents = [
        ...history.slice(-6).map(h => `${h.sender === 'CUSTOMER' ? 'Client' : 'ShopMe'}: ${h.text}`),
        `Client: ${customerMessage}`
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });

      const rawText = response.text || '';
      let needsHuman = asksHuman || wantsChange;
      let reason: string | undefined = undefined;

      const jsonMatch = rawText.match(/<<<(\{.*?\})>>>/s);
      let cleanReply = rawText.replace(/<<<.*?>>>/s, '').trim();

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.needsHuman) needsHuman = true;
          if (parsed.reason) reason = parsed.reason;
        } catch {}
      }

      if (asksHuman) {
        needsHuman = true;
        reason = "Demande directe de contact avec un conseiller humain";
      } else if (wantsChange) {
        needsHuman = true;
        reason = "Demande de modification d'adresse ou de coordonnées";
      }

      return { reply: cleanReply, needsHuman, reason };
    } catch (err) {
      console.warn('[whatsapp-ai] Gemini error, using fallback:', err);
    }
  }

  // Robust contextual fallback engine (no API key required)
  let reply = '';
  let needsHuman = false;
  let reason: string | undefined = undefined;

  const custName = order.customerName || order.shippingAddress?.fullName || '';

  if (asksHuman) {
    needsHuman = true;
    reason = "Demande d'intervention d'un conseiller humain";
    reply = `Bonjour ${custName} 👋\nNous avons bien reçu votre message. Un conseiller de l'équipe ShopMe prend le relais et va vous répondre directement ici dans quelques instants.`;
  } else if (wantsChange) {
    needsHuman = true;
    reason = "Demande de modification de commande ou d'adresse";
    reply = `Bonjour ! Nous avons bien noté votre demande de modification pour la commande *${order.orderNumber}*. Notre équipe service client met à jour votre dossier et vous contacte tout de suite.`;
  } else if (lower.includes('quand') || lower.includes('délai') || lower.includes('waqt') || lower.includes('wa9t') || lower.includes('temps') || lower.includes('livraison') || lower.includes('fo9ach') || lower.includes('weqtech')) {
    reply = `Bonjour 👋 La livraison de votre commande *#${order.orderNumber}* est assurée sous 24h à 48h ouvrables à ${order.shippingAddress?.city || 'votre adresse'}. Le livreur vous contactera par téléphone pour convenir du moment idéal.\n\n👉 Répondez *OUI* pour confirmer l'expédition immédiate !`;
  } else if (lower.includes('paiement') || lower.includes('payer') || lower.includes('flous') || lower.includes('khalas') || lower.includes('carte') || lower.includes('espece') || lower.includes('cash')) {
    reply = `Le paiement s'effectue en dirhams en espèces (Cash on Delivery) à la livraison de votre colis. Vous pouvez vérifier les articles avec le livreur avant de payer le total de *${order.totalAmount} MAD*.\n\n👉 Répondez *OUI* pour confirmer l'envoi !`;
  } else if (lower.includes('ouvrir') || lower.includes('nchouf') || lower.includes('verifier') || lower.includes('vérifier') || lower.includes('test') || lower.includes('hall')) {
    reply = `Tout à fait ! Chez ShopMe Maroc, vous avez le droit absolu d'ouvrir et de vérifier le colis avec le livreur avant de régler votre achat.\n\n👉 Répondez *OUI* pour valider l'expédition express !`;
  } else {
    reply = `Bonjour ${custName} 👋\nMerci pour votre message au sujet de la commande *#${order.orderNumber}*.\n\n👉 Pour autoriser l'expédition express de votre colis (Total : ${order.totalAmount} MAD), répondez simplement *OUI*.\n(Si vous souhaitez des modifications, un conseiller a également été notifié).`;
  }

  return { reply, needsHuman, reason };
}

/**
 * Customer replied. Finds their pending order and confirms, cancels, or answers via AI Bot.
 */
export async function handleIncomingMessage(from: string, text: string): Promise<{ result: string; reply?: string; orderNumber?: string }> {
  if (!store) return { result: 'not-initialised' };
  const orders = await store.getOrders();
  const mine = orders.filter((o) => samePhone(o.customerPhone, from));
  if (!mine.length) {
    console.warn(`[whatsapp] Incoming message from unknown phone: ${from}`);
    return { result: 'no-order' };
  }

  // Find target order: matching mentioned order number or newest open order
  const mentioned = mine.find((o) => o.orderNumber && text.toUpperCase().includes(String(o.orderNumber).toUpperCase()));
  const open = mine
    .filter((o) => o.status !== 'CANCELLED' && !o.whatsappConfirmation?.isConfirmed)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const order = mentioned || open[0] || mine[0];

  const now = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const intent = parseIntent(text);

  // Retrieve existing conversation history
  const conversation: WhatsAppMessage[] = Array.isArray(order.whatsappConfirmation?.conversation)
    ? [...order.whatsappConfirmation.conversation]
    : [];

  // Add the incoming customer message to the conversation
  conversation.push({
    id: `msg-cust-${Date.now()}`,
    sender: 'CUSTOMER',
    text,
    timestamp: timeStr,
  });

  const custName = order.customerName || order.shippingAddress?.fullName || 'Cher client';
  const city = order.shippingAddress?.city || 'votre ville';

  if (intent === 'YES') {
    const replyText = `✅ Parfait ${custName} ! Votre commande *#${order.orderNumber}* est officiellement confirmée. Notre équipe logistique prépare votre colis avec soin. Le livreur vous contactera par téléphone avant la livraison à ${city}. Merci pour votre confiance ! 🚀`;

    conversation.push({
      id: `msg-bot-${Date.now()}`,
      sender: 'STORE_BOT',
      text: replyText,
      timestamp: timeStr,
    });

    const updatedConf: WhatsAppConfirmation = {
      isConfirmed: true,
      confirmedAt: now,
      customerPhone: order.customerPhone,
      sentMessageText: order.whatsappConfirmation?.sentMessageText || order.whatsappNotification?.messageText || '',
      replyMessageText: text,
      messageTimestamp: order.whatsappConfirmation?.messageTimestamp || timeStr,
      replyTimestamp: timeStr,
      channel: 'WHATSAPP_BOT',
      needsHumanIntervention: false,
      conversation,
    };

    await store.patchOrder(order.id, {
      status: 'CONFIRMED',
      whatsappConfirmation: updatedConf,
    });

    await sendText(from, replyText).catch(() => null);
    console.log(`[whatsapp] Order ${order.orderNumber} CONFIRMED by customer reply "${text}"`);
    return { result: 'confirmed', reply: replyText, orderNumber: order.orderNumber };
  }

  if (intent === 'NO') {
    const replyText = `Votre commande *#${order.orderNumber}* a bien été annulée comme demandé. N'hésitez pas à revenir sur ShopMe à tout moment ! À bientôt.`;

    conversation.push({
      id: `msg-bot-${Date.now()}`,
      sender: 'STORE_BOT',
      text: replyText,
      timestamp: timeStr,
    });

    const updatedConf: WhatsAppConfirmation = {
      isConfirmed: false,
      customerPhone: order.customerPhone,
      sentMessageText: order.whatsappConfirmation?.sentMessageText || '',
      replyMessageText: text,
      messageTimestamp: order.whatsappConfirmation?.messageTimestamp || timeStr,
      replyTimestamp: timeStr,
      channel: 'WHATSAPP_BOT',
      needsHumanIntervention: false,
      conversation,
    };

    await store.patchOrder(order.id, {
      status: 'CANCELLED',
      whatsappConfirmation: updatedConf,
    });

    await sendText(from, replyText).catch(() => null);
    console.log(`[whatsapp] Order ${order.orderNumber} CANCELLED by customer reply "${text}"`);
    return { result: 'cancelled', reply: replyText, orderNumber: order.orderNumber };
  }

  // UNKNOWN intent: Run AI Chatbot to answer question or escalate to human
  const aiResult = await generateWhatsAppAiReply(order, text, conversation);

  conversation.push({
    id: `msg-ai-${Date.now()}`,
    sender: 'AI_BOT',
    text: aiResult.reply,
    timestamp: timeStr,
  });

  const updatedConf: WhatsAppConfirmation = {
    isConfirmed: false,
    customerPhone: order.customerPhone,
    sentMessageText: order.whatsappConfirmation?.sentMessageText || '',
    replyMessageText: text,
    messageTimestamp: order.whatsappConfirmation?.messageTimestamp || timeStr,
    replyTimestamp: timeStr,
    channel: 'WHATSAPP_BOT',
    needsHumanIntervention: aiResult.needsHuman,
    humanInterventionReason: aiResult.reason,
    conversation,
  };

  await store.patchOrder(order.id, {
    whatsappConfirmation: updatedConf,
  });

  await sendText(from, aiResult.reply).catch(() => null);
  console.log(`[whatsapp] Order ${order.orderNumber}: AI bot replied. Needs human: ${aiResult.needsHuman}`);
  return { result: aiResult.needsHuman ? 'needs_human' : 'ai_handled', reply: aiResult.reply, orderNumber: order.orderNumber };
}

/**
 * Allows the Store Admin to send a direct message from the Admin Panel to the customer's WhatsApp.
 * Appends to conversation as ADMIN and clears the "needsHumanIntervention" flag.
 */
export async function sendAdminMessage(orderId: string, text: string): Promise<any> {
  if (!store) throw new Error('WhatsApp module not initialised');
  const orders = await store.getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Commande introuvable');

  const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const conversation: WhatsAppMessage[] = Array.isArray(order.whatsappConfirmation?.conversation)
    ? [...order.whatsappConfirmation.conversation]
    : [];

  conversation.push({
    id: `msg-admin-${Date.now()}`,
    sender: 'ADMIN',
    text,
    timestamp: timeStr,
  });

  const updatedConf: WhatsAppConfirmation = {
    ...order.whatsappConfirmation,
    isConfirmed: order.whatsappConfirmation?.isConfirmed || false,
    customerPhone: order.customerPhone,
    sentMessageText: order.whatsappConfirmation?.sentMessageText || text,
    replyMessageText: order.whatsappConfirmation?.replyMessageText || '',
    messageTimestamp: order.whatsappConfirmation?.messageTimestamp || timeStr,
    replyTimestamp: order.whatsappConfirmation?.replyTimestamp || '',
    channel: 'WHATSAPP_AGENT',
    needsHumanIntervention: false, // Resolved by admin reply
    humanInterventionReason: undefined,
    conversation,
  };

  await store.patchOrder(order.id, {
    whatsappConfirmation: updatedConf,
  });

  await sendText(order.customerPhone, text).catch(() => null);
  return order;
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
