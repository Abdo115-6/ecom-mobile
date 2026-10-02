// Shared catalogue data used by both seed scripts:
//   scripts/seed.mjs      - writes straight into Postgres (run inside Railway's network)
//   scripts/seed-api.mjs  - posts to the running app's HTTP API (works from anywhere)

export const categories = [
  { id: 'cat-femme', name: 'Mode Femme', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-homme', name: 'Mode Homme', imageUrl: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-parfum', name: 'Parfumerie & Oud', imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-montre', name: 'Montres', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-electronique', name: 'Électronique', imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-beaute', name: 'Beauté & Soins', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-maison', name: 'Maison & Déco', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
];

const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

const img = (u) => [{ id: 'img-1', imageUrl: u, altText: '', displayOrder: 0, isPrimary: true }];

const variants = (pid, sizes, price) =>
  sizes.map((s, i) => ({
    id: `${pid}-v${i + 1}`, sku: `${pid.toUpperCase()}-${String(s).toUpperCase()}`,
    title: s, sizeOption: String(s), price, stockQuantity: 10 + i * 3, isActive: true,
  }));

const slugify = (name) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// id, categoryId, name, sku, price, compareAt, shortDescription, material, image, sizes, featured, rating, reviews, views, stock
const rows = [
  ['prd-1001', 'cat-femme', 'Robe imprimée fleurie', 'SM-RDB-1001', 349, 499, 'Robe midi en viscose, imprimé floral exclusif.', 'Viscose', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80', ['S','M','L','XL'], true, 4.8, 62, 1840, 24],
  ['prd-1002', 'cat-femme', 'Manteau long en laine', 'SM-MNT-1002', 899, 1290, 'Manteau droit double face, coupe oversize.', '80% laine, 20% cachemire', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80', ['S','M','L'], true, 4.9, 41, 1210, 12],
  ['prd-1003', 'cat-femme', 'Sac à main en cuir naturel', 'SM-SAC-1003', 649, null, 'Sac structuré en cuir pleine fleur, bandoulière réglable.', 'Cuir pleine fleur', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', ['Noisette','Noir'], true, 4.7, 28, 870, 9],
  ['prd-1004', 'cat-homme', 'Chemise Oxford coton', 'SM-CHM-1004', 289, 379, 'Chemise Oxford coupe régulière, dispose de boutons corozo.', '100% coton', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', ['M','L','XL','XXL'], false, 4.6, 95, 2310, 40],
  ['prd-1005', 'cat-homme', 'Veste blazer structurée', 'SM-BLZ-1005', 749, 999, 'Blazer demi-toilé, épaules légèrement tombantes.', 'Laine mélangée', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', ['46','48','50','52'], true, 4.8, 33, 1420, 15],
  ['prd-1006', 'cat-homme', 'Jean slim délavé', 'SM-JNS-1006', 399, null, 'Denim stretch délavé, taille basse.', '98% coton, 2% élasthanne', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80', ['30','32','34','36','38'], false, 4.5, 74, 1980, 33],
  ['prd-2001', 'cat-parfum', 'Oud Cambodi intense', 'SM-OUD-2001', 1290, 1690, 'Huile de oud Cambodian 12 ans, concentration extrait.', 'Extrait 30%', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80', ['6ml','12ml','25ml'], true, 5.0, 51, 3120, 7],
  ['prd-2002', 'cat-parfum', 'Eau de Parfum Musc Blanc', 'SM-MSC-2002', 590, null, 'Musc blanc powdery, tenue 10h.', 'EDP 18%', 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=800&q=80', ['50ml','100ml'], true, 4.7, 39, 1650, 18],
  ['prd-3001', 'cat-montre', 'Montre automatique acier', 'SM-MNT-3001', 2490, 3190, 'Automatique 41mm, bracelet acier, saphir.', 'Acier', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80', ['Acier','Cuir noir'], true, 4.9, 22, 2410, 5],
  ['prd-3002', 'cat-montre', 'Montre connectée Pulse', 'SM-MNT-3002', 1199, 1499, 'GPS, SpO2, 14 jours d autonomie.', 'Verre saphir', 'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=800&q=80', ['Noir','Bleu'], true, 4.4, 87, 3320, 21],
  ['prd-4001', 'cat-electronique', 'Écouteurs sans fil Pro', 'SM-AUD-4001', 899, 1199, 'Réduction de bruit active, 40h de lecture.', 'Bluetooth 5.3', 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80', ['Noir','Blanc'], true, 4.6, 145, 4820, 30],
  ['prd-4002', 'cat-electronique', 'Smartphone Nova 5G 256Go', 'SM-PHO-4002', 4299, 4999, 'Écran AMOLED 120Hz, 256Go, 8Go RAM.', '6.7" AMOLED 120Hz', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80', ['256Go Noir','256Go Bleu'], true, 4.7, 112, 6140, 14],
  ['prd-5001', 'cat-beaute', 'Sérum visage Vitamine C', 'SM-SKN-5001', 279, 349, 'Sérum illuminateur 15% vitamine C.', 'Vitamine C 15%', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', ['30ml','50ml'], false, 4.8, 210, 5230, 55],
  ['prd-5002', 'cat-beaute', 'Coffret Hammam', 'SM-SKN-5002', 349, null, 'Savon noir, ghassoul, argile blanche et gant.', 'Ghassoul de Marrakech', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=800&q=80', [], false, 4.9, 76, 2140, 28],
  ['prd-6001', 'cat-maison', 'Tapis berbère tissé main', 'SM-TAP-6001', 1890, 2490, 'Tapis 100% laine, tissé main à Fès.', '100% laine', 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=800&q=80', ['160x230','200x300'], true, 5.0, 18, 1520, 4],
  ['prd-6002', 'cat-maison', 'Lanterne marocaine en laiton', 'SM-LAN-6002', 449, null, 'Lanterne ajourée en laiton massif.', 'Laiton massif', 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80', ['Moyen','Grand'], false, 4.8, 44, 1180, 19],
];

export const products = rows.map(
  ([id, categoryId, name, sku, price, compareAtPrice, shortDescription, material, imageUrl, sizes, isFeatured, rating, reviewsCount, viewCount, stockQuantity], i) => ({
    id,
    categoryId,
    categoryName: catName[categoryId],
    name,
    slug: slugify(name),
    sku,
    shortDescription,
    description: `${shortDescription} Article ShopMe - fabrication et garantie assurées.`,
    brand: 'ShopMe',
    price,
    compareAtPrice,
    costPrice: Math.round(price * 0.55),
    status: 'PUBLISHED',
    isFeatured,
    isVisible: true,
    rating,
    reviewsCount,
    viewCount,
    stockQuantity,
    images: img(imageUrl),
    variants: variants(id, sizes, price),
    technicalSpecs: { material, origin: 'Maroc' },
    daysAgo: (rows.length - i) * 3,
  })
);

export const settings = {
  storeName: 'ShopMe',
  defaultCurrency: 'MAD',
  defaultLanguage: 'fr',
  taxRatePercent: 20,
  freeShippingThreshold: 500,
  standardShippingFee: 30,
  isFreeShippingPromoActive: true,
  cityShippingRates: { Casablanca: 25, Rabat: 30, Marrakech: 40, Fes: 40, Tanger: 45, Agadir: 55 },
  whatsappPhoneNumber: '+212600112233',
  whatsappOrderConfirmationTemplate:
    'Salam {{customer_name}} ! 👋\nMerci pour votre commande sur *ShopMe Maroc* 🇲🇦.\n\n📋 *Détails de votre commande #{{order_number}}* :\n• {{items}}\n\n💰 *Total à régler* : *{{total}}* (Paiement Cash à la livraison)\n📍 *Adresse* : {{address}}\n📞 *Téléphone* : {{phone}}\n🚚 *Expédition* : Livraison express 24h-48h avec ouverture du colis avant paiement.\n\n👉 *Veuillez répondre « OUI » ou « CONFIRMER » pour valider l\'expédition.*',
  whatsappShippingTemplate: 'Bonjour {{customer_name}}, votre commande *{{order_number}}* est en route.',
  metaPixelId: '', googleAnalyticsId: '', tiktokPixelId: '', snapchatPixelId: '',
};
