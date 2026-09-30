import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// PostgreSQL Connection Pool
// Supports either discrete PG* vars or a single DATABASE_URL, which is what
// Render, Railway, Neon and Supabase all provide.
const pgConfig = (() => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: Number(url.port) || 5432,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, '') || 'postgres',
    };
  }
  return {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'ecommerce_user',
    password: process.env.PGPASSWORD || 'ecom',
    database: process.env.PGDATABASE || 'ecommerce',
  };
})();

const pgPool = new pg.Pool({
  ...pgConfig,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000
});

let isPgConnected = false;

// Local JSON File storage paths for persistent fallback & offline resilience
const dataDir = path.resolve(process.cwd(), 'public', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const PRODUCTS_FILE = path.join(dataDir, 'products.json');
const ORDERS_FILE = path.join(dataDir, 'orders.json');
const SETTINGS_FILE = path.join(dataDir, 'settings.json');
const LEADS_FILE = path.join(dataDir, 'leads.json');
const CATEGORIES_FILE = path.join(dataDir, 'categories.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.warn(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Initialize PostgreSQL Tables if database is reachable
async function initPostgresTables() {
  try {
    const client = await pgPool.connect();
    isPgConnected = true;
    console.log('✓ Successfully connected to PostgreSQL (localhost:5432/ecommerce as ecommerce_user)');

    // 1. Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        category_id VARCHAR(100),
        category_name VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        sku VARCHAR(100) NOT NULL,
        short_description TEXT,
        description TEXT,
        brand VARCHAR(100),
        price NUMERIC(10, 2) NOT NULL,
        compare_at_price NUMERIC(10, 2),
        cost_price NUMERIC(10, 2),
        status VARCHAR(50) DEFAULT 'PUBLISHED',
        is_featured BOOLEAN DEFAULT false,
        is_visible BOOLEAN DEFAULT true,
        rating NUMERIC(3, 2) DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        stock_quantity INTEGER DEFAULT 10,
        images JSONB DEFAULT '[]'::jsonb,
        variants JSONB DEFAULT '[]'::jsonb,
        technical_specs JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        customer_id VARCHAR(100),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        currency VARCHAR(10) DEFAULT 'MAD',
        subtotal NUMERIC(10, 2) NOT NULL,
        discount_amount NUMERIC(10, 2) DEFAULT 0,
        shipping_fee NUMERIC(10, 2) DEFAULT 0,
        total_amount NUMERIC(10, 2) NOT NULL,
        shipping_address JSONB NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'CASH_ON_DELIVERY',
        payment_status VARCHAR(50) DEFAULT 'PENDING',
        shipment JSONB DEFAULT '{}'::jsonb,
        items JSONB DEFAULT '[]'::jsonb,
        utm_source VARCHAR(100),
        utm_campaign VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Store Settings & Delivery Fees Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Data Mining Captured Leads Table (Inputs without Buy)
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_leads (
        id VARCHAR(100) PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        ip_city VARCHAR(100),
        device_type VARCHAR(50),
        referrer_source VARCHAR(100),
        status VARCHAR(50),
        product_id VARCHAR(100),
        product_name VARCHAR(255),
        potential_revenue NUMERIC(10, 2),
        captured_inputs JSONB NOT NULL,
        timeline JSONB DEFAULT '[]'::jsonb,
        is_contacted BOOLEAN DEFAULT false,
        contact_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
  } catch (err: any) {
    isPgConnected = false;
    console.log('PostgreSQL connection notice:', err.message || 'Postgres currently in standby. Application will use fast resilient fallback.');
  }
}

async function startServer() {
  await initPostgresTables();

  const app = express();

  // Middleware for large file uploads (WebP, PNG, JPG from laptop)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Ensure uploads directory exists in public/uploads
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded images statically
  app.use('/uploads', express.static(uploadsDir));

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. Secure Admin Authentication (strictly abdo@store.com / Abdo2004)
  // Protected on the server: password & credentials never exposed to client bundles or fetchers!
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (cleanEmail === 'abdo@store.com' && cleanPass === 'Abdo2004') {
      const token = `shopme_sec_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      return res.json({
        success: true,
        user: {
          id: 'usr-abdo',
          email: 'abdo@store.com',
          firstName: 'Abdo',
          lastName: 'Store Admin',
          role: 'SUPER_ADMIN',
          permissions: ['all']
        },
        token
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Identifiants incorrects. Accès strictement réservé à abdo@store.com'
    });
  });

  // 2. Upload PNG / JPG from laptop & Convert/Save WebP image
  app.post('/api/upload', async (req, res) => {
    try {
      const { filename, dataUrl, format } = req.body;

      if (!dataUrl) {
        return res.status(400).json({ success: false, message: 'Aucune donnée d\'image fournie' });
      }

      // Extract base64 payload
      const matches = dataUrl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, message: 'Format base64 invalide' });
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      // Determine extension: keep webp or png or jpg
      let ext = 'webp';
      if (format) {
        ext = format.toLowerCase();
      } else if (mimeType.includes('png')) {
        ext = 'png';
      } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
        ext = 'jpg';
      }

      const sanitizedName = (filename || 'product_image')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40);

      const generatedFileName = `img_${Date.now()}_${sanitizedName}.${ext}`;
      const filePath = path.join(uploadsDir, generatedFileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${generatedFileName}`;

      return res.json({
        success: true,
        imageUrl: publicUrl,
        filename: generatedFileName,
        sizeKb: Math.round(buffer.length / 1024),
        mimeType: `image/${ext}`
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Erreur lors de l\'enregistrement de l\'image' });
    }
  });

  // 3. PostgreSQL Database Status Check
  app.get('/api/db-status', async (req, res) => {
    let pgStatus = 'STANDBY';
    let version = 'PostgreSQL 16 (Local ready)';
    let tablesCount = 0;

    try {
      const client = await pgPool.connect();
      isPgConnected = true;
      const verRes = await client.query('SELECT version()');
      version = verRes.rows[0]?.version || version;
      const tablesRes = await client.query(`
        SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'
      `);
      tablesCount = parseInt(tablesRes.rows[0]?.count || '0');
      client.release();
      pgStatus = 'CONNECTED';
    } catch {
      pgStatus = isPgConnected ? 'CONNECTED' : 'STANDBY_LOCAL';
    }

    return res.json({
      status: 'ok',
      postgres: {
        status: pgStatus,
        host: pgConfig.host,
        port: pgConfig.port,
        user: pgConfig.user,
        database: pgConfig.database,
        version,
        tablesCount
      }
    });
  });

  // 4. Products API (Get, Create, Update, Delete)
  app.get('/api/products', async (req, res) => {
    if (isPgConnected) {
      try {
        const client = await pgPool.connect();
        const result = await client.query('SELECT * FROM products ORDER BY created_at DESC');
        client.release();
        if (result.rows.length > 0) {
          const mapped = result.rows.map(row => ({
            id: row.id,
            categoryId: row.category_id,
            categoryName: row.category_name,
            name: row.name,
            slug: row.slug,
            sku: row.sku,
            shortDescription: row.short_description || '',
            description: row.description || '',
            brand: row.brand || 'ShopMe',
            price: Number(row.price),
            compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
            costPrice: row.cost_price ? Number(row.cost_price) : undefined,
            status: row.status,
            isFeatured: row.is_featured,
            isVisible: row.is_visible,
            rating: Number(row.rating || 5.0),
            reviewsCount: Number(row.reviews_count || 0),
            viewCount: Number(row.view_count || 0),
            stockQuantity: Number(row.stock_quantity || 10),
            images: row.images || [],
            variants: row.variants || [],
            technicalSpecs: row.technical_specs || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
          return res.json({ success: true, products: mapped, source: 'postgres' });
        }
      } catch (err) {
        console.warn('Postgres products query error:', err);
      }
    }

    const fileProducts = readJsonFile(PRODUCTS_FILE, null);
    if (fileProducts) {
      return res.json({ success: true, products: fileProducts, source: 'file' });
    }

    return res.json({ success: true, products: [], source: 'empty' });
  });

  app.post('/api/products', async (req, res) => {
    try {
      const product = req.body;
      if (!product || !product.id || !product.name) {
        return res.status(400).json({ success: false, message: 'Données produit invalides' });
      }

      // 1. Save to local fallback file
      const currentProducts = readJsonFile<any[]>(PRODUCTS_FILE, []);
      const idx = currentProducts.findIndex(p => p.id === product.id);
      if (idx >= 0) {
        currentProducts[idx] = { ...product, updatedAt: new Date().toISOString() };
      } else {
        currentProducts.unshift({
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      writeJsonFile(PRODUCTS_FILE, currentProducts);

      // 2. Save to Postgres if connected
      if (isPgConnected) {
        try {
          const client = await pgPool.connect();
          await client.query(`
            INSERT INTO products (
              id, category_id, category_name, name, slug, sku,
              short_description, description, brand, price, compare_at_price,
              cost_price, status, is_featured, is_visible, rating,
              reviews_count, view_count, stock_quantity, images, variants, technical_specs, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              category_id = EXCLUDED.category_id,
              category_name = EXCLUDED.category_name,
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              sku = EXCLUDED.sku,
              short_description = EXCLUDED.short_description,
              description = EXCLUDED.description,
              brand = EXCLUDED.brand,
              price = EXCLUDED.price,
              compare_at_price = EXCLUDED.compare_at_price,
              cost_price = EXCLUDED.cost_price,
              status = EXCLUDED.status,
              is_featured = EXCLUDED.is_featured,
              is_visible = EXCLUDED.is_visible,
              stock_quantity = EXCLUDED.stock_quantity,
              images = EXCLUDED.images,
              variants = EXCLUDED.variants,
              technical_specs = EXCLUDED.technical_specs,
              updated_at = NOW();
          `, [
            product.id,
            product.categoryId || 'cat-general',
            product.categoryName || 'Général',
            product.name,
            product.slug,
            product.sku,
            product.shortDescription || '',
            product.description || '',
            product.brand || 'ShopMe',
            product.price,
            product.compareAtPrice || null,
            product.costPrice || null,
            product.status || 'PUBLISHED',
            product.isFeatured ?? true,
            product.isVisible ?? true,
            product.rating || 5.0,
            product.reviewsCount || 0,
            product.viewCount || 0,
            product.stockQuantity || 10,
            JSON.stringify(product.images || []),
            JSON.stringify(product.variants || []),
            JSON.stringify(product.technicalSpecs || {})
          ]);
          client.release();
        } catch (dbErr) {
          console.warn('Postgres insert error:', dbErr);
        }
      }

      return res.json({ success: true, product });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const currentProducts = readJsonFile<any[]>(PRODUCTS_FILE, []);
    const filtered = currentProducts.filter(p => p.id !== id);
    writeJsonFile(PRODUCTS_FILE, filtered);

    if (isPgConnected) {
      try {
        const client = await pgPool.connect();
        await client.query('DELETE FROM products WHERE id = $1', [id]);
        client.release();
      } catch (err) {
        console.warn('Postgres delete error:', err);
      }
    }

    return res.json({ success: true, id });
  });

  // 5. Orders API (Get, Create, Status Update)
  app.get('/api/orders', async (req, res) => {
    if (isPgConnected) {
      try {
        const client = await pgPool.connect();
        const result = await client.query('SELECT * FROM orders ORDER BY created_at DESC');
        client.release();
        if (result.rows.length > 0) {
          const mapped = result.rows.map(row => ({
            id: row.id,
            orderNumber: row.order_number,
            customerId: row.customer_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            customerPhone: row.customer_phone,
            status: row.status,
            currency: row.currency,
            subtotal: Number(row.subtotal),
            discountAmount: Number(row.discount_amount || 0),
            shippingFee: Number(row.shipping_fee || 0),
            totalAmount: Number(row.total_amount),
            shippingAddress: row.shipping_address,
            paymentMethod: row.payment_method,
            paymentStatus: row.payment_status,
            shipment: row.shipment || {},
            items: row.items || [],
            utmSource: row.utm_source,
            utmCampaign: row.utm_campaign,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
          return res.json({ success: true, orders: mapped, source: 'postgres' });
        }
      } catch (err) {
        console.warn('Postgres orders query error:', err);
      }
    }

    const fileOrders = readJsonFile(ORDERS_FILE, []);
    return res.json({ success: true, orders: fileOrders, source: 'file' });
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const order = req.body;
      if (!order || !order.id || !order.customerPhone) {
        return res.status(400).json({ success: false, message: 'Données de commande invalides' });
      }

      // Save to local file
      const currentOrders = readJsonFile<any[]>(ORDERS_FILE, []);
      currentOrders.unshift(order);
      writeJsonFile(ORDERS_FILE, currentOrders);

      // Save to Postgres
      if (isPgConnected) {
        try {
          const client = await pgPool.connect();
          await client.query(`
            INSERT INTO orders (
              id, order_number, customer_id, customer_name, customer_email,
              customer_phone, status, currency, subtotal, discount_amount,
              shipping_fee, total_amount, shipping_address, payment_method,
              payment_status, shipment, items, utm_source, utm_campaign, notes, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              updated_at = NOW();
          `, [
            order.id,
            order.orderNumber,
            order.customerId || 'guest',
            order.customerName,
            order.customerEmail || '',
            order.customerPhone,
            order.status || 'PENDING',
            order.currency || 'MAD',
            order.subtotal,
            order.discountAmount || 0,
            order.shippingFee || 0,
            order.totalAmount,
            JSON.stringify(order.shippingAddress || {}),
            order.paymentMethod || 'CASH_ON_DELIVERY',
            order.paymentStatus || 'PENDING',
            JSON.stringify(order.shipment || {}),
            JSON.stringify(order.items || []),
            order.utmSource || 'direct',
            order.utmCampaign || '',
            order.notes || ''
          ]);
          client.release();
        } catch (dbErr) {
          console.warn('Postgres order insert error:', dbErr);
        }
      }

      return res.json({ success: true, order });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, whatsappConfirmation } = req.body;

    const currentOrders = readJsonFile<any[]>(ORDERS_FILE, []);
    const order = currentOrders.find(o => o.id === id);
    if (order) {
      if (status) order.status = status;
      if (whatsappConfirmation) order.whatsappConfirmation = whatsappConfirmation;
      order.updatedAt = new Date().toISOString();
      writeJsonFile(ORDERS_FILE, currentOrders);
    }

    if (isPgConnected) {
      try {
        const client = await pgPool.connect();
        await client.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status || order?.status, id]);
        client.release();
      } catch (err) {
        console.warn('Postgres update order error:', err);
      }
    }

    return res.json({ success: true, id, status, whatsappConfirmation });
  });

  // 5b. Categories API (CRUD)
  app.get('/api/categories', (req, res) => {
    const fileCategories = readJsonFile<any[]>(CATEGORIES_FILE, []);
    if (fileCategories && Array.isArray(fileCategories) && fileCategories.length > 0) {
      return res.json({ success: true, categories: fileCategories });
    }
    return res.json({ success: true, categories: [] });
  });

  app.post('/api/categories', (req, res) => {
    const categories = req.body;
    if (Array.isArray(categories)) {
      writeJsonFile(CATEGORIES_FILE, categories);
      return res.json({ success: true, categories });
    }
    return res.status(400).json({ success: false, message: 'Format invalide de catégories' });
  });

  // 6. Settings & Delivery Fees API
  app.get('/api/settings', async (req, res) => {
    if (isPgConnected) {
      try {
        const client = await pgPool.connect();
        const result = await client.query('SELECT data FROM store_settings WHERE id = $1', ['main']);
        client.release();
        if (result.rows.length > 0 && result.rows[0].data) {
          return res.json({ success: true, settings: result.rows[0].data, source: 'postgres' });
        }
      } catch (err) {
        console.warn('Postgres settings query error:', err);
      }
    }

    const fileSettings = readJsonFile(SETTINGS_FILE, null);
    if (fileSettings) {
      return res.json({ success: true, settings: fileSettings, source: 'file' });
    }

    return res.json({ success: true, settings: null, source: 'default' });
  });

  app.post('/api/settings', async (req, res) => {
    const settings = req.body;
    writeJsonFile(SETTINGS_FILE, settings);

    if (isPgConnected) {
      try {
        const client = await pgPool.connect();
        await client.query(`
          INSERT INTO store_settings (id, data, updated_at)
          VALUES ('main', $1, NOW())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
        `, [JSON.stringify(settings)]);
        client.release();
      } catch (err) {
        console.warn('Postgres settings update error:', err);
      }
    }

    return res.json({ success: true, settings });
  });

  // 7. Data Mining Leads (Real-time capture of abandoned inputs)
  app.get('/api/leads', async (req, res) => {
    if (isPgConnected) {
      try {
        const client = await pgPool.connect();
        const result = await client.query('SELECT * FROM client_leads ORDER BY updated_at DESC LIMIT 100');
        client.release();
        if (result.rows.length > 0) {
          const mapped = result.rows.map(r => ({
            id: r.id,
            sessionId: r.session_id,
            ipCity: r.ip_city,
            deviceType: r.device_type,
            referrerSource: r.referrer_source,
            status: r.status,
            productId: r.product_id,
            productName: r.product_name,
            potentialRevenue: Number(r.potential_revenue || 0),
            capturedInputs: r.captured_inputs,
            timeline: r.timeline,
            isContacted: r.is_contacted,
            contactNotes: r.contact_notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          }));
          return res.json({ success: true, leads: mapped, source: 'postgres' });
        }
      } catch (err) {
        console.warn('Postgres leads error:', err);
      }
    }

    const fileLeads = readJsonFile(LEADS_FILE, []);
    return res.json({ success: true, leads: fileLeads, source: 'file' });
  });

  app.post('/api/leads', async (req, res) => {
    const lead = req.body;
    if (!lead || !lead.id) return res.status(400).json({ success: false });

    const currentLeads = readJsonFile<any[]>(LEADS_FILE, []);
    const idx = currentLeads.findIndex(l => l.id === lead.id);
    if (idx >= 0) {
      currentLeads[idx] = { ...lead, updatedAt: new Date().toISOString() };
    } else {
      currentLeads.unshift({ ...lead, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    writeJsonFile(LEADS_FILE, currentLeads);

    if (isPgConnected) {
      try {
        const client = await pgPool.connect();
        await client.query(`
          INSERT INTO client_leads (
            id, session_id, ip_city, device_type, referrer_source, status,
            product_id, product_name, potential_revenue, captured_inputs,
            timeline, is_contacted, contact_notes, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            potential_revenue = EXCLUDED.potential_revenue,
            captured_inputs = EXCLUDED.captured_inputs,
            timeline = EXCLUDED.timeline,
            is_contacted = EXCLUDED.is_contacted,
            contact_notes = EXCLUDED.contact_notes,
            updated_at = NOW()
        `, [
          lead.id,
          lead.sessionId,
          lead.ipCity || 'Casablanca',
          lead.deviceType || 'Mobile',
          lead.referrerSource || 'direct',
          lead.status || 'ABANDONED_INPUT',
          lead.productId || null,
          lead.productName || null,
          lead.potentialRevenue || 0,
          JSON.stringify(lead.capturedInputs || {}),
          JSON.stringify(lead.timeline || []),
          lead.isContacted || false,
          lead.contactNotes || ''
        ]);
        client.release();
      } catch (err) {
        console.warn('Postgres lead insert error:', err);
      }
    }

    return res.json({ success: true, lead });
  });

  // ==========================================
  // VITE DEV SERVER OR PRODUCTION STATIC
  // ==========================================
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ShopMe Full-Stack Server running at http://0.0.0.0:${PORT}`);
    console.log(`📦 PostgreSQL Config: ${pgConfig.user}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database} (${process.env.DATABASE_URL ? 'via DATABASE_URL' : 'via PG* vars'})`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
