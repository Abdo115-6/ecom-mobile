// Seeds the catalogue straight into Postgres.
// Must run where the database is reachable: inside the provider's network
// (e.g. `railway ssh`) or with a publicly reachable DATABASE_URL.
// Usage: DATABASE_URL=postgresql://... node scripts/seed.mjs

import pg from 'pg';
import { products, settings } from './catalogue.mjs';

const url = process.env.DATABASE_URL;
const pool = new pg.Pool(
  url
    ? { connectionString: url, connectionTimeoutMillis: 5000 }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'ecommerce_user',
        password: process.env.PGPASSWORD || 'ecom',
        database: process.env.PGDATABASE || 'ecommerce',
        connectionTimeoutMillis: 5000,
      }
);

try {
  const check = await pool.query("select to_regclass('products') as t");
  if (!check.rows[0].t) {
    console.error("Table 'products' not found - deploy the app once first so it creates its schema.");
    process.exit(1);
  }

  for (const p of products) {
    await pool.query(
      `INSERT INTO products (id, category_id, category_name, name, slug, sku, short_description,
         description, brand, price, compare_at_price, cost_price, status, is_featured, is_visible,
         rating, reviews_count, view_count, stock_quantity, images, variants, technical_specs,
         created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PUBLISHED',$13,$14,$15,$16,$17,$18,$19,$20,$21,
         NOW() - ($22 || ' days')::interval, NOW())
       ON CONFLICT (id) DO UPDATE SET
         category_id=EXCLUDED.category_id, category_name=EXCLUDED.category_name, name=EXCLUDED.name,
         slug=EXCLUDED.slug, sku=EXCLUDED.sku, short_description=EXCLUDED.short_description,
         description=EXCLUDED.description, price=EXCLUDED.price, compare_at_price=EXCLUDED.compare_at_price,
         is_featured=EXCLUDED.is_featured, stock_quantity=EXCLUDED.stock_quantity, images=EXCLUDED.images,
         variants=EXCLUDED.variants, technical_specs=EXCLUDED.technical_specs, updated_at=NOW()`,
      [p.id, p.categoryId, p.categoryName, p.name, p.slug, p.sku, p.shortDescription,
       p.description, p.brand, p.price, p.compareAtPrice, p.costPrice, p.isFeatured, p.isVisible,
       p.rating, p.reviewsCount, p.viewCount, p.stockQuantity,
       JSON.stringify(p.images), JSON.stringify(p.variants), JSON.stringify(p.technicalSpecs),
       String(p.daysAgo)]
    );
  }

  await pool.query(
    `INSERT INTO store_settings (id, data, updated_at) VALUES ('main', $1, NOW())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(settings)]
  );

  const { rows } = await pool.query('SELECT count(*)::int AS n FROM products');
  console.log(`Seeded ${products.length} products + settings. products table now has ${rows[0].n} rows.`);
} catch (e) {
  console.error('Seed failed:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
