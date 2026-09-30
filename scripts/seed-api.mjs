// Seeds the catalogue through the app's own HTTP API, so it works from any
// machine - no need to be inside the provider's private network.
// Usage: BASE_URL=https://your-app.up.railway.app node scripts/seed-api.mjs

import { products, categories, settings } from './catalogue.mjs';

const BASE = (process.env.BASE_URL || 'http://localhost:3100').replace(/\/$/, '');

const post = async (path, body) => {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json().catch(() => null) };
};

console.log(`Seeding ${BASE} ...`);

const cats = await post('/api/categories', categories);
console.log(`categories: ${cats.status} ${cats.json?.success ? 'OK' : 'FAIL'}`);

let ok = 0;
const failures = [];
for (const p of products) {
  const { daysAgo, ...payload } = p;
  const r = await post('/api/products', payload);
  if (r.status === 200 && r.json?.success) ok++;
  else failures.push(`${p.id} (${r.status})`);
}
console.log(`products: ${ok}/${products.length} seeded${failures.length ? ` | failed: ${failures.join(', ')}` : ''}`);

const set = await post('/api/settings', settings);
console.log(`settings: ${set.status} ${set.json?.success ? 'OK' : 'FAIL'}`);

const verify = await fetch(`${BASE}/api/products`).then((r) => r.json());
console.log(`verify: ${verify.products?.length ?? 0} products readable (source: ${verify.source})`);

if (ok !== products.length || !cats.json?.success || !set.json?.success) process.exit(1);
