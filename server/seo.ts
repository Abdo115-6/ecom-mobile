// Server-side SEO: sitemap, robots and per-URL meta tags injected into index.html.
// Crawlers and link-preview bots (Facebook, TikTok, WhatsApp, Google) read the raw HTML,
// so product title, image and price must be present before any JavaScript runs.

export interface SeoProduct {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  sku?: string;
  categoryName?: string;
  shortDescription?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  rating?: number;
  reviewsCount?: number;
  status?: string;
  isVisible?: boolean;
  images?: Array<{ imageUrl: string; altText?: string }>;
  updatedAt?: string;
}

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  ogType: 'website' | 'product';
  robots?: string;
  // Image shown first on the page (its largest paint): preloaded so it downloads before the JS runs
  preloadImage?: string;
  jsonLd?: Record<string, unknown>[];
  price?: number;
}

const STORE_NAME = 'ShopMe Maroc';
const DEFAULT_TITLE = 'ShopMe Maroc | Livraison 24h & Paiement à la livraison';
const DEFAULT_DESCRIPTION = 'ShopMe Maroc : commandez en ligne avec livraison express 24h partout au Maroc et paiement en espèces à la livraison après vérification du colis.';

const STATIC_PAGES: Record<string, { title: string; description: string; robots?: string }> = {
  '/': { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  '/catalog': {
    title: `Catalogue produits | ${STORE_NAME}`,
    description: 'Découvrez tous nos produits livrés en 24h partout au Maroc. Paiement à la livraison, retour facile.'
  },
  '/tracking': {
    title: `Suivi de commande | ${STORE_NAME}`,
    description: 'Suivez votre commande ShopMe Maroc en temps réel.'
  },
  '/cart': { title: `Panier | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, robots: 'noindex, follow' },
  '/checkout': { title: `Commande | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, robots: 'noindex, follow' },
  '/wishlist': { title: `Favoris | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, robots: 'noindex, follow' }
};

export const isPublicProduct = (p: SeoProduct) =>
  !!p && !!p.slug && p.status !== 'DRAFT' && p.status !== 'ARCHIVED' && p.isVisible !== false;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const escapeXml = escapeHtml;

const stripTags = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const truncate = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…');

const absoluteUrl = (base: string, url?: string) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('data:')) return undefined;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function productMeta(base: string, p: SeoProduct): PageMeta {
  const canonical = `${base}/product/${encodeURIComponent(p.slug)}`;
  // Without a custom SEO text, the snippet leads with the product, then the price and the offer
  // Moroccan shoppers search for ("prix", "DH", "livraison", "paiement à la livraison")
  const priceDh = `${Math.round(Number(p.price))} DH`;
  const summary = stripTags(p.shortDescription || p.description || '').replace(/[.\s]+$/, '');
  const description = truncate(
    stripTags(p.seoDescription || '') ||
      `${summary ? `${summary}. ` : ''}${p.name} à ${priceDh} : livraison 24-48h partout au Maroc, paiement à la livraison.`,
    160
  );
  const images = (p.images || []).map(i => absoluteUrl(base, i.imageUrl)).filter(Boolean) as string[];
  const inStock = (p.stockQuantity ?? 1) > 0;

  const productLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description,
    image: images.slice(0, 6),
    sku: p.sku || p.id,
    brand: { '@type': 'Brand', name: p.brand || 'ShopMe' },
    category: p.categoryName,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'MAD',
      price: Number(p.price).toFixed(2),
      // Google Merchant listings expect an end date for the price; it is rolled forward every year
      priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: STORE_NAME },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'MA' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' }
        }
      }
    }
  };
  if (p.rating && p.reviewsCount && p.reviewsCount > 0) {
    productLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(p.rating).toFixed(1),
      reviewCount: p.reviewsCount
    };
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Catalogue', item: `${base}/catalog` },
      { '@type': 'ListItem', position: 3, name: p.name, item: canonical }
    ]
  };

  return {
    title: truncate(p.seoTitle || `${p.name} prix Maroc ${priceDh} | ShopMe`, 70),
    description,
    canonical,
    image: images[0],
    preloadImage: images[0],
    ogType: 'product',
    jsonLd: [productLd, breadcrumbLd],
    price: Number(p.price)
  };
}

/** Store identity for Google's knowledge panel and site name in results (home page only) */
function storeJsonLd(base: string): Record<string, unknown>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      '@id': `${base}/#store`,
      name: STORE_NAME,
      url: `${base}/`,
      description: DEFAULT_DESCRIPTION,
      areaServed: { '@type': 'Country', name: 'Morocco' },
      currenciesAccepted: 'MAD',
      paymentAccepted: 'Cash on Delivery',
      contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: ['French', 'Arabic'] }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: STORE_NAME,
      url: `${base}/`,
      inLanguage: 'fr-MA',
      publisher: { '@id': `${base}/#store` }
    }
  ];
}

/** Lists the public products so crawlers discover every product page from the catalog */
function catalogJsonLd(base: string, products: SeoProduct[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.filter(isPublicProduct).slice(0, 50).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}/product/${encodeURIComponent(p.slug)}`,
      name: p.name
    }))
  };
}

export function pageMeta(base: string, pathname: string, products: SeoProduct[]): PageMeta {
  if (pathname.startsWith('/product/')) {
    let slug = pathname.slice('/product/'.length).replace(/\/+$/, '');
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // keep raw slug
    }
    const product = products.find(p => p.slug === slug && isPublicProduct(p));
    if (product) return productMeta(base, product);
  }

  const page = STATIC_PAGES[pathname] || STATIC_PAGES['/'];
  const firstImage = products.find(p => isPublicProduct(p) && p.images?.length)?.images?.[0]?.imageUrl;
  const isHome = !STATIC_PAGES[pathname] || pathname === '/';
  // The home grid opens on the first published product, so its photo is the first big image
  const firstProductImage = products.find(isPublicProduct)?.images?.[0]?.imageUrl;
  return {
    title: page.title,
    description: page.description,
    canonical: `${base}${STATIC_PAGES[pathname] ? pathname : '/'}`,
    image: absoluteUrl(base, firstImage),
    ogType: 'website',
    robots: page.robots,
    preloadImage: isHome ? absoluteUrl(base, firstProductImage) : undefined,
    jsonLd: isHome ? storeJsonLd(base) : pathname === '/catalog' ? [catalogJsonLd(base, products)] : undefined
  };
}

/** Replaces the default head tags of index.html with page-specific ones */
export function injectMeta(html: string, meta: PageMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const tags = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<meta name="robots" content="${meta.robots || 'index, follow, max-image-preview:large'}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:site_name" content="${STORE_NAME}" />`,
    `<meta property="og:locale" content="fr_MA" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`
  ];
  if (meta.preloadImage) {
    tags.push(`<link rel="preload" as="image" href="${escapeHtml(meta.preloadImage)}" fetchpriority="high" />`);
  }
  if (meta.image) {
    const img = escapeHtml(meta.image);
    tags.push(
      `<meta property="og:image" content="${img}" />`,
      `<meta property="og:image:alt" content="${t}" />`,
      `<meta name="twitter:image" content="${img}" />`
    );
  }
  if (meta.price !== undefined) {
    tags.push(
      `<meta property="product:price:amount" content="${meta.price.toFixed(2)}" />`,
      `<meta property="product:price:currency" content="MAD" />`
    );
  }
  for (const ld of meta.jsonLd || []) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
  }

  return html
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n    ${tags.join('\n    ')}\n    <!--seo:end-->`);
}

export function buildSitemap(base: string, products: SeoProduct[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls: Array<{ loc: string; lastmod: string; priority: string; changefreq: string; image?: string; imageTitle?: string }> = [
    { loc: `${base}/`, lastmod: today, priority: '1.0', changefreq: 'daily' },
    { loc: `${base}/catalog`, lastmod: today, priority: '0.9', changefreq: 'daily' }
  ];
  for (const p of products.filter(isPublicProduct)) {
    urls.push({
      loc: `${base}/product/${encodeURIComponent(p.slug)}`,
      lastmod: (p.updatedAt ? new Date(p.updatedAt) : new Date()).toISOString().slice(0, 10),
      priority: '0.8',
      changefreq: 'weekly',
      image: absoluteUrl(base, p.images?.[0]?.imageUrl),
      imageTitle: p.name
    });
  }

  const body = urls
    .map(u => {
      const image = u.image
        ? `\n    <image:image><image:loc>${escapeXml(u.image)}</image:loc><image:title>${escapeXml(u.imageTitle || '')}</image:title></image:image>`
        : '';
      return `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>${image}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

export function buildRobots(base: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /adminonly',
    'Disallow: /api/',
    'Disallow: /cart',
    'Disallow: /checkout',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    ''
  ].join('\n');
}

export interface GoogleTagConfig {
  measurementId?: string; // GA4, e.g. G-XXXXXXX
  adsId?: string; // Google Ads, e.g. AW-123456789
  adsPurchaseLabel?: string; // conversion label of the "Purchase" action
}

/**
 * Google tag (GA4 + Google Ads) with Consent Mode v2. Storage stays denied until the visitor
 * accepts the cookie banner (consentService flips it with gtag('consent', 'update')).
 * IDs come from env vars, so nothing is loaded when they are not set.
 */
export function injectGoogleTag(html: string, cfg: GoogleTagConfig): string {
  const isId = (v?: string) => !!v && /^[A-Z]{1,3}-[A-Z0-9]+$/i.test(v);
  const ids = [cfg.measurementId, cfg.adsId].filter(isId) as string[];
  if (ids.length === 0) return html;
  const client = {
    ga4: isId(cfg.measurementId) ? cfg.measurementId : undefined,
    ads: isId(cfg.adsId) ? cfg.adsId : undefined,
    purchaseLabel: cfg.adsPurchaseLabel && /^[\w-]+$/.test(cfg.adsPurchaseLabel) ? cfg.adsPurchaseLabel : undefined
  };
  const snippet = `<script async src="https://www.googletagmanager.com/gtag/js?id=${ids[0]}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.shopmeGoogle = ${JSON.stringify(client)};
      var granted = /(?:^|; )shopme_consent=granted/.test(document.cookie) ? 'granted' : 'denied';
      gtag('consent', 'default', { ad_storage: granted, ad_user_data: granted, ad_personalization: granted, analytics_storage: granted, wait_for_update: 500 });
      gtag('set', 'url_passthrough', true);
      gtag('js', new Date());
      ${ids.map(id => `gtag('config', '${id}', { send_page_view: false });`).join('\n      ')}
      // page_view and e-commerce events are sent by trackingService
    </script>`;
  return html.replace('</head>', `    ${snippet}\n  </head>`);
}
