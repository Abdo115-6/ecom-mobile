// Quick check without placing an order:  node scripts/test-whatsapp.mjs 0612345678
import 'dotenv/config';
const to = (process.argv[2] || '').replace(/[^0-9]/g, '').replace(/^0/, '212');
const { WHATSAPP_TOKEN: token, WHATSAPP_PHONE_NUMBER_ID: id, WHATSAPP_TEMPLATE_NAME: name,
  WHATSAPP_TEMPLATE_LANG: lang = 'fr', WHATSAPP_TEMPLATE_PARAMS = 'customer_name,order_number,date' } = process.env;
if (!to || !token || !id) { console.error('Usage: node scripts/test-whatsapp.mjs 06XXXXXXXX  (and fill WHATSAPP_TOKEN in .env)'); process.exit(1); }
const sample = { customer_name: 'Test Client', order_number: 'ORD-2026-TEST', total: '100.00 MAD', city: 'Casablanca',
  address: 'Rue 1, Casablanca', items: 'Produit x1', tracking_number: 'MA-000000', date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) };
const body = name
  ? { messaging_product: 'whatsapp', to, type: 'template', template: { name, language: { code: lang },
      components: [{ type: 'body', parameters: WHATSAPP_TEMPLATE_PARAMS.split(',').map((k) => ({ type: 'text', text: sample[k.trim()] || '-' })) }] } }
  : { messaging_product: 'whatsapp', to, type: 'text', text: { body: 'Test ShopMe: commande ORD-2026-TEST. Répondez OUI pour confirmer.' } };
const r = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION || 'v25.0'}/${id}/messages`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
console.log(r.status, await r.text());
