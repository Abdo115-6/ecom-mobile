# Automatic WhatsApp order confirmation

## Quick start with Meta test number + sample template (already set in `.env`)
1. Meta > API Setup > **Generate new token**, paste it in `.env` as `WHATSAPP_TOKEN=`.
2. Check it works without placing an order: `node scripts/test-whatsapp.mjs 0668381916`
3. `npm install && npm run dev`, place an order with a number you added under **To** in Meta.
4. The message arrives automatically. The temporary token lasts ~24h; for production create a
   System User permanent token and your own approved template (French, with OUI / NON).
   Update `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG=fr` and `WHATSAPP_TEMPLATE_PARAMS`
   (the variables {{1}} {{2}} ... in order, e.g. `customer_name,order_number,total,city`).
5. To receive replies (OUI/NON) Meta needs a public URL: webhook `https://YOUR-DOMAIN/api/whatsapp/webhook`,
   verify token = `WHATSAPP_VERIFY_TOKEN`. On localhost use ngrok.

## Easiest: your own WhatsApp via QR code (no Meta account)
1. `npm install` then in `.env`:
   ```
   WHATSAPP_PROVIDER=baileys
   WHATSAPP_QR_KEY=choose-a-secret-word
   ```
2. `npm run dev`, open `http://localhost:3000/api/whatsapp/qr?key=choose-a-secret-word`
   (admin > WhatsApp also shows the status).
3. On the phone: WhatsApp > Settings > Linked devices > Link a device > scan the QR.
4. Done. Every new order now gets a message with the order number; the client replies OUI / NON.
   Orders placed while the bot is disconnected are sent automatically after you reconnect.

Notes
- Unofficial method: use a dedicated number (not your personal one). WhatsApp may restrict numbers that spam;
  this app only messages people who just ordered and spaces messages 3-6 s apart.
- The login is saved in `data/wa-session/` (git-ignored). On hosts with a temporary disk (Render free plan)
  it is lost at every redeploy and you must scan again. Use a persistent disk (`WHATSAPP_SESSION_DIR`) or a VPS.
- Needs a long-running server. Not suitable for serverless hosting.

---
(Alternative methods below)


When a client places an order, the server now sends a WhatsApp message containing the
order number and asking them to reply **OUI** (confirm) or **NON** (cancel).
The reply is handled automatically: the order becomes `CONFIRMED` / `CANCELLED`.
Failed sends are retried every minute (5 attempts). The admin > Orders table shows the status
(sent / failed / not configured) with a **Renvoyer** button.

## Option A: Official Meta WhatsApp Cloud API (recommended, free tier, no ban risk)
1. https://developers.facebook.com > create an app > add **WhatsApp**.
2. Copy the **Phone number ID** and create a permanent **System User token**.
3. Create a message template (category *Utility*, language `fr`), body e.g.:
   `Bonjour {{1}}, merci pour votre commande {{2}} d'un montant de {{3}} ({{4}}). Répondez OUI pour confirmer ou NON pour annuler.`
   Wait for approval. **A template is required to message a customer who has not written to you in the last 24h.**
4. Set env vars (see `.env.example`):
   `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_VERIFY_TOKEN` (any secret string), `WHATSAPP_APP_SECRET`.
5. In Meta > WhatsApp > Configuration > Webhook:
   Callback URL `https://YOUR-DOMAIN/api/whatsapp/webhook`, Verify token = `WHATSAPP_VERIFY_TOKEN`,
   subscribe to the **messages** field.

## Option B: Any other bot/gateway (e.g. a Baileys-based bot like whatsapp-chatbot)
Set `WHATSAPP_PROVIDER=gateway` and `WHATSAPP_GATEWAY_URL`.
- Outgoing: server does `POST WHATSAPP_GATEWAY_URL` with `{ "to": "2126...", "message": "..." }`
  (+ `Authorization: Bearer WHATSAPP_GATEWAY_TOKEN` if set).
- Incoming: have the bot `POST https://YOUR-DOMAIN/api/whatsapp/incoming` with
  `{ "from": "2126...", "text": "oui" }` and header `x-webhook-secret: WHATSAPP_GATEWAY_TOKEN`.
Adapt the field names in `sendText()` (server/whatsapp.ts) if your bot expects different ones.

## Notes
- Moroccan numbers like `06 12 34 56 78` are normalised to `212612345678` automatically.
- Edit the message in Admin > WhatsApp. Variables: `{{customer_name}} {{order_number}} {{total}} {{city}} {{address}} {{items}}`.
  The order number and the OUI/NON instruction are always included.
- Without the env vars the order is marked "Non envoyé (WhatsApp non configuré)" and sent automatically
  once you configure them.
