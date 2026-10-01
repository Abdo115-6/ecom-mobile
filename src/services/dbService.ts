import {
  Product,
  Category,
  Order,
  Review,
  Coupon,
  Banner,
  HomepageSection,
  InventoryMovement,
  User,
  AuditLog,
  StoreSettings,
  Customer
} from '../types/ecommerce';

// Initial Seed Data tailored for Moroccan E-Commerce (Hommes & Femmes)
const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat-homme",
    name: "Mode & Style Homme",
    slug: "homme",
    description: "Montres de prestige, parfumerie masculine, prêt-à-porter et soins barbiers",
    imageUrl: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80",
    displayOrder: 1,
    isActive: true,
    subcategories: [
      {
        id: "cat-homme-montres",
        parentId: "cat-homme",
        name: "Montres & Horlogerie Homme",
        slug: "montres-homme",
        description: "Chronographes de luxe, bracelets acier et cuir véritable",
        imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
        displayOrder: 1,
        isActive: true,
      },
      {
        id: "cat-homme-vetements",
        parentId: "cat-homme",
        name: "Vêtements & Streetwear Homme",
        slug: "vetements-homme",
        description: "T-shirts boxy en coton bio et ensembles urbains",
        imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
        displayOrder: 2,
        isActive: true,
      },
      {
        id: "cat-homme-soins",
        parentId: "cat-homme",
        name: "Tondeuses & Soins Barbier",
        slug: "soins-homme",
        description: "Tondeuses professionnelles haute précision et entretien barbe",
        imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80",
        displayOrder: 3,
        isActive: true,
      }
    ]
  },
  {
    id: "cat-femme",
    name: "Mode & Beauté Femme",
    slug: "femme",
    description: "Sacs de luxe, caftans modernes, parfums précieux et coiffure ionique",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    displayOrder: 2,
    isActive: true,
    subcategories: [
      {
        id: "cat-femme-sacs",
        parentId: "cat-femme",
        name: "Sacs & Maroquinerie Femme",
        slug: "sacs-femme",
        description: "Sacs à main en cuir italien et pochettes de soirée",
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
        displayOrder: 1,
        isActive: true,
      },
      {
        id: "cat-femme-caftans",
        parentId: "cat-femme",
        name: "Caftans & Robes Modernes",
        slug: "caftans-robes",
        description: "Caftans contemporains en satin de soie et broderies raffinées",
        imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80",
        displayOrder: 2,
        isActive: true,
      },
      {
        id: "cat-femme-coiffure",
        parentId: "cat-femme",
        name: "Coiffure & Soins Ioniques",
        slug: "coiffure-soins",
        description: "Brosses 5-en-1 ioniques et boucleurs multifonctions",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        displayOrder: 3,
        isActive: true,
      }
    ]
  },
  {
    id: "cat-perfumes",
    name: "Parfumerie & Oud Royal",
    slug: "parfums-oud",
    description: "Extraits de parfum orientaux, musc pur et sillage intense 24h",
    imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "cat-elec",
    name: "Électronique & High-Tech",
    slug: "electronique",
    description: "Casques audio ANC, écouteurs sans fil et coques magnétiques Kevlar",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    displayOrder: 4,
    isActive: true,
  }
];

const INITIAL_PRODUCTS: Product[] = [
  // --- PRODUITS HOMME ---
  {
    id: "prod-oud-royal",
    categoryId: "cat-perfumes",
    categoryName: "Parfumerie & Oud Royal",
    name: "Parfum Oud Royal Noir 100ml – Eau de Parfum Intense Homme",
    slug: "parfum-oud-royal-noir-intense-homme",
    sku: "AURA-OUD-M",
    shortDescription: "Sillage royal longue durée 24h, bois d'agar précieux, ambre noir et cuir oriental.",
    description: "Une création d'exception pour l'homme charismatique. Conçu avec des essences pures de bois de Oud cambodgien, relevé par des notes de cardamome épicée, d'ambre sombre et de musc sauvage. Tenue remarquable garantie sur la peau et les vêtements tout au long de la journée.",
    brand: "Aura Oud Royal",
    price: 449.00,
    compareAtPrice: 690.00,
    costPrice: 180.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Parfum Oud Royal Noir 100ml Homme – Sillage Intense 24h Maroc",
    seoDescription: "Commandez le Parfum Oud Royal Noir Intense au Maroc. Livraison rapide 24h et paiement à la livraison.",
    rating: 4.9,
    reviewsCount: 74,
    viewCount: 3410,
    stockQuantity: 18,
    images: [
      {
        id: "img-oud-1",
        productId: "prod-oud-royal",
        imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
        altText: "Parfum Oud Royal Noir Flacon Prestige",
        displayOrder: 1,
        isPrimary: true,
      },
      {
        id: "img-oud-2",
        productId: "prod-oud-royal",
        imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
        altText: "Coffret Cadeau Oud Royal Homme",
        displayOrder: 2,
        isPrimary: false,
      }
    ],
    variants: [
      {
        id: "var-oud-100",
        productId: "prod-oud-royal",
        sku: "OUD-ROY-100ML",
        title: "Flacon 100ml Intense",
        sizeOption: "100ml",
        price: 449.00,
        compareAtPrice: 690.00,
        stockQuantity: 18,
      },
      {
        id: "var-oud-pack",
        productId: "prod-oud-royal",
        sku: "OUD-ROY-PACK2",
        title: "Pack 2 Flacons (-20% Remise Extra)",
        sizeOption: "Pack 2 x 100ml",
        price: 749.00,
        compareAtPrice: 1380.00,
        stockQuantity: 10,
      }
    ],
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-09-29T12:00:00Z"
  },
  {
    id: "prod-pro-trimmer",
    categoryId: "cat-homme-soins",
    categoryName: "Tondeuses & Soins Barbier",
    name: "Tondeuse Sans Fil Pro Gold Métal Barbe & Cheveux",
    slug: "tondeuse-sans-fil-pro-gold-barbe-cheveux",
    sku: "AURA-TRIM-GOLD",
    shortDescription: "Corps 100% métal gravé or, moteur 7000 RPM silencieux, lame T zéro coupure et écran LCD.",
    description: "La tondeuse de finition préférée des barbiers professionnels au Maroc. Lame en acier carbone ultra-tranchante pour contours nets de barbe, dégradés précis et rasage de près sans irritation cutanée. Batterie lithium 1500mAh offrant 3h d'autonomie continue avec recharge USB-C.",
    brand: "Aura Barber Pro",
    price: 279.00,
    compareAtPrice: 420.00,
    costPrice: 110.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Tondeuse Professionnelle Gold Métal – Barbe & Contours Maroc",
    seoDescription: "Tondeuse de barbier pro dorée en métal au Maroc. Rasage précis zéro millimètre, paiement à la livraison.",
    rating: 4.8,
    reviewsCount: 52,
    viewCount: 2950,
    stockQuantity: 28,
    images: [
      {
        id: "img-trim-1",
        productId: "prod-pro-trimmer",
        imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80",
        altText: "Tondeuse Barbier Pro Gold Métal",
        displayOrder: 1,
        isPrimary: true,
      }
    ],
    variants: [
      {
        id: "var-trim-gold",
        productId: "prod-pro-trimmer",
        sku: "TRIM-GLD-STD",
        title: "Édition Or Vintage + 4 Sabots",
        colorOption: "Or Métallique",
        price: 279.00,
        compareAtPrice: 420.00,
        stockQuantity: 28,
      }
    ],
    createdAt: "2026-08-10T10:00:00Z",
    updatedAt: "2026-09-28T15:00:00Z"
  },
  {
    id: "prod-4",
    categoryId: "cat-homme-montres",
    categoryName: "Montres & Horlogerie Homme",
    name: "Montre Chronographe Automatique Apex 41mm",
    slug: "montre-chronographe-apex-41mm",
    sku: "AURA-WATCH-APEX",
    shortDescription: "Mouvement automatique haute précision, verre saphir inrayable et acier inoxydable 316L.",
    description: "Chef-d'œuvre d'horlogerie contemporaine avec cadran soleillé bleu nuit, réserve de marche de 42h, étanchéité 10 ATM (100 mètres) et fond de boîtier transparent révélant le balancier mécanique. Livrée dans son coffret luxe.",
    brand: "Aura Horlogerie",
    price: 1290.00,
    compareAtPrice: 1890.00,
    costPrice: 650.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Montre Chronographe Apex 41mm Homme – Automatique Verre Saphir",
    seoDescription: "Montre automatique pour homme avec boîtier acier 316L, cadran bleu soleillé et étanchéité 100m.",
    rating: 5.0,
    reviewsCount: 39,
    viewCount: 3200,
    stockQuantity: 12,
    images: [
      {
        id: "img-4-1",
        productId: "prod-4",
        imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
        altText: "Montre Chronographe Apex Cadran Bleu",
        displayOrder: 1,
        isPrimary: true,
      },
      {
        id: "img-4-2",
        productId: "prod-4",
        imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
        altText: "Montre Apex Bracelet Acier",
        displayOrder: 2,
        isPrimary: false,
      }
    ],
    variants: [
      {
        id: "var-4-silver",
        productId: "prod-4",
        sku: "WATCH-APX-SLV",
        title: "Cadran Bleu Nuit / Bracelet Acier 316L",
        colorOption: "Bleu / Acier",
        price: 1290.00,
        compareAtPrice: 1890.00,
        stockQuantity: 12,
      }
    ],
    createdAt: "2026-07-10T08:00:00Z",
    updatedAt: "2026-09-20T16:00:00Z"
  },
  {
    id: "prod-2",
    categoryId: "cat-homme-vetements",
    categoryName: "Vêtements & Streetwear Homme",
    name: "T-Shirt Minimaliste Coton Bio 240g Coupe Boxy",
    slug: "t-shirt-minimaliste-coton-bio",
    sku: "AURA-TSHIRT-BIO",
    shortDescription: "Coton biologique lourd certifié GOTS, col indéformable et coupe décontractée.",
    description: "Confectionné dans un jersey de coton peigné 240 GSM ultra-durable, ce t-shirt allie tombé impeccable, finitions premium aux surpiqûres doublées et confort thermique absolu pour le climat marocain.",
    brand: "Aura Apparel",
    price: 249.00,
    compareAtPrice: 320.00,
    costPrice: 95.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "T-Shirt Homme Coton Bio 240g – Coupe Boxy & Durable Maroc",
    seoDescription: "Découvrez notre T-Shirt minimaliste en coton biologique 240 GSM. Finition premium et coupe streetwear décontractée.",
    rating: 4.9,
    reviewsCount: 64,
    viewCount: 2890,
    stockQuantity: 45,
    images: [
      {
        id: "img-2-1",
        productId: "prod-2",
        imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        altText: "T-Shirt Coton Bio Blanc",
        displayOrder: 1,
        isPrimary: true,
      },
      {
        id: "img-2-2",
        productId: "prod-2",
        imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
        altText: "T-Shirt Coton Bio Noir",
        displayOrder: 2,
        isPrimary: false,
      }
    ],
    variants: [
      {
        id: "var-2-m-blk",
        productId: "prod-2",
        sku: "TSH-BLK-M",
        title: "Taille M / Noir Profond",
        sizeOption: "M",
        colorOption: "Noir",
        price: 249.00,
        stockQuantity: 18,
      },
      {
        id: "var-2-l-blk",
        productId: "prod-2",
        sku: "TSH-BLK-L",
        title: "Taille L / Noir Profond",
        sizeOption: "L",
        colorOption: "Noir",
        price: 249.00,
        stockQuantity: 12,
      },
      {
        id: "var-2-m-wht",
        productId: "prod-2",
        sku: "TSH-WHT-M",
        title: "Taille M / Blanc Écru",
        sizeOption: "M",
        colorOption: "Blanc",
        price: 249.00,
        stockQuantity: 15,
      }
    ],
    createdAt: "2026-08-20T12:00:00Z",
    updatedAt: "2026-09-25T09:15:00Z"
  },

  // --- PRODUITS FEMME ---
  {
    id: "prod-rose-musc",
    categoryId: "cat-perfumes",
    categoryName: "Parfumerie & Oud Royal",
    name: "Coffret Royal Musc Blanc & Rose Damascena 100ml Femme",
    slug: "coffret-royal-musc-blanc-rose-damascena-femme",
    sku: "AURA-MUSC-F",
    shortDescription: "Eau de parfum envoûtante aux pétales de rose fraîche et musc de soie + brume corps offerte.",
    description: "Une symphonie florale noble et sensuelle. Infusé aux véritables extraits de rose de Damas, jasmin blanc de nuit et musc poudré cristallin. Parfum féminin d'une délicatesse irrésistible, plébiscité pour son sillage doux et longue tenue.",
    brand: "Aura Parfums Femme",
    price: 399.00,
    compareAtPrice: 590.00,
    costPrice: 150.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Coffret Musc Blanc & Rose Damascena Femme 100ml – Parfum Luxe Maroc",
    seoDescription: "Achetez le parfum royal Musc Blanc et Rose de Damas pour femme au Maroc. Coffret cadeau avec livraison gratuite.",
    rating: 4.9,
    reviewsCount: 88,
    viewCount: 4120,
    stockQuantity: 22,
    images: [
      {
        id: "img-musc-1",
        productId: "prod-rose-musc",
        imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
        altText: "Flacon Parfum Rose Damascena",
        displayOrder: 1,
        isPrimary: true,
      },
      {
        id: "img-musc-2",
        productId: "prod-rose-musc",
        imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
        altText: "Coffret Parfum Femme Prestige",
        displayOrder: 2,
        isPrimary: false,
      }
    ],
    variants: [
      {
        id: "var-musc-single",
        productId: "prod-rose-musc",
        sku: "MUSC-F-100",
        title: "Coffret 100ml + Brume Corps",
        sizeOption: "100ml + Brume",
        price: 399.00,
        compareAtPrice: 590.00,
        stockQuantity: 22,
      },
      {
        id: "var-musc-duo",
        productId: "prod-rose-musc",
        sku: "MUSC-F-DUO",
        title: "Duo Coffrets (Cadeau Idéal -25%)",
        sizeOption: "2x Coffrets",
        price: 649.00,
        compareAtPrice: 1180.00,
        stockQuantity: 12,
      }
    ],
    createdAt: "2026-08-15T10:00:00Z",
    updatedAt: "2026-09-28T16:00:00Z"
  },
  {
    id: "prod-leather-bag",
    categoryId: "cat-femme-sacs",
    categoryName: "Sacs & Maroquinerie Femme",
    name: "Sac Cabas Cuir Italien Finition Dorée – Élégance Femme",
    slug: "sac-cabas-cuir-italien-finition-doree",
    sku: "AURA-BAG-LUX",
    shortDescription: "Cuir pleine fleur grainé souple, fermeture zippée sécurisée et bandoulière amovible.",
    description: "Le sac intemporel par excellence pour la femme active et élégante. Conçu pour accueillir un ordinateur portable 13 pouces, vos accessoires de maquillage et vos effets personnels. Bijouterie métallique dorée inoxydable haute résistance.",
    brand: "Aura Maroquinerie",
    price: 499.00,
    compareAtPrice: 750.00,
    costPrice: 220.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Sac à Main Cuir Italien Femme – Finition Dorée Luxe Maroc",
    seoDescription: "Sac cabas en cuir pleine fleur italien pour femme. Livraison express à Casablanca, Rabat et partout au Maroc.",
    rating: 4.8,
    reviewsCount: 46,
    viewCount: 3100,
    stockQuantity: 16,
    images: [
      {
        id: "img-bag-1",
        productId: "prod-leather-bag",
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
        altText: "Sac Cuir Italien Camel",
        displayOrder: 1,
        isPrimary: true,
      },
      {
        id: "img-bag-2",
        productId: "prod-leather-bag",
        imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
        altText: "Sac Cuir Italien Noir",
        displayOrder: 2,
        isPrimary: false,
      }
    ],
    variants: [
      {
        id: "var-bag-camel",
        productId: "prod-leather-bag",
        sku: "BAG-CAMEL",
        title: "Camel Cuir Grainé",
        colorOption: "Camel",
        price: 499.00,
        compareAtPrice: 750.00,
        stockQuantity: 9,
      },
      {
        id: "var-bag-noir",
        productId: "prod-leather-bag",
        sku: "BAG-NOIR",
        title: "Noir Intense Finition Or",
        colorOption: "Noir",
        price: 499.00,
        compareAtPrice: 750.00,
        stockQuantity: 7,
      }
    ],
    createdAt: "2026-08-25T11:00:00Z",
    updatedAt: "2026-09-29T10:00:00Z"
  },
  {
    id: "prod-hair-styler",
    categoryId: "cat-femme-coiffure",
    categoryName: "Coiffure & Soins Ioniques",
    name: "Brosse Coiffante Ionique 5-en-1 Multifonction Sèche-cheveux & Boucleur",
    slug: "brosse-coiffante-ionique-5-en-1-multifonction",
    sku: "AURA-STYLER-5IN1",
    shortDescription: "Technologie ionique anti-frisottis, brushing salon en 10 minutes sans abîmer les cheveux.",
    description: "Appareil tout-en-un révolutionnaire doté de 5 embouts interchangeables : séchoir de précision, brosse lissante ronde volumisante, 2 rouleaux boucleurs à effet d'air Coanda et peigne démêlant. Contrôle thermique intelligent pour préserver la brillance naturelle de vos cheveux.",
    brand: "Aura Beauty Care",
    price: 389.00,
    compareAtPrice: 590.00,
    costPrice: 160.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Brosse Soufflante 5 en 1 Multifonction – Boucleur & Séchoir Cheveux Maroc",
    seoDescription: "Brosse coiffante ionique 5 en 1 pour brushing rapide à domicile au Maroc. Paiement à la livraison après test du colis.",
    rating: 4.9,
    reviewsCount: 115,
    viewCount: 5600,
    stockQuantity: 34,
    images: [
      {
        id: "img-styler-1",
        productId: "prod-hair-styler",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        altText: "Brosse Soufflante Ionique 5 en 1",
        displayOrder: 1,
        isPrimary: true,
      }
    ],
    variants: [
      {
        id: "var-styler-rose",
        productId: "prod-hair-styler",
        sku: "STYLER-PNK",
        title: "Rose Gold Prestige (Kit Complet)",
        colorOption: "Rose Gold",
        price: 389.00,
        compareAtPrice: 590.00,
        stockQuantity: 34,
      }
    ],
    createdAt: "2026-08-18T14:00:00Z",
    updatedAt: "2026-09-29T14:00:00Z"
  },
  {
    id: "prod-caftan-silk",
    categoryId: "cat-femme-caftans",
    categoryName: "Caftans & Robes Modernes",
    name: "Robe Caftan Moderne Satin de Soie avec Ceinture Perles",
    slug: "robe-caftan-moderne-satin-soie",
    sku: "AURA-CAFTAN-MOD",
    shortDescription: "Satin de soie duchesse ultra-fluide, broderie artisanale sfifa dorée et ceinture ornée de perles.",
    description: "La rencontre subtile entre l'artisanat marocain d'excellence et la coupe contemporaine épurée. Tissu doux et respirant ne se froissant pas, manches évasées à bordure dorée travaillée à la main. Idéal pour les réceptions, soirées et fêtes familiales.",
    brand: "Aura Couture Maroc",
    price: 690.00,
    compareAtPrice: 990.00,
    costPrice: 320.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Caftan Moderne Satin de Soie Femme – Haute Couture Marocaine",
    seoDescription: "Sublime caftan moderne en satin de soie avec broderies sfifa or. Livraison à domicile partout au Maroc.",
    rating: 5.0,
    reviewsCount: 31,
    viewCount: 2400,
    stockQuantity: 14,
    images: [
      {
        id: "img-caftan-1",
        productId: "prod-caftan-silk",
        imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
        altText: "Caftan Moderne Satin Émeraude",
        displayOrder: 1,
        isPrimary: true,
      }
    ],
    variants: [
      {
        id: "var-caftan-green-m",
        productId: "prod-caftan-silk",
        sku: "CAFT-GRN-M",
        title: "Taille M / Vert Émeraude Royal",
        sizeOption: "M",
        colorOption: "Vert Émeraude",
        price: 690.00,
        compareAtPrice: 990.00,
        stockQuantity: 8,
      },
      {
        id: "var-caftan-green-l",
        productId: "prod-caftan-silk",
        sku: "CAFT-GRN-L",
        title: "Taille L / Vert Émeraude Royal",
        sizeOption: "L",
        colorOption: "Vert Émeraude",
        price: 690.00,
        compareAtPrice: 990.00,
        stockQuantity: 6,
      }
    ],
    createdAt: "2026-09-02T10:00:00Z",
    updatedAt: "2026-09-28T17:00:00Z"
  },

  // --- AUDIO & TECH ---
  {
    id: "prod-1",
    categoryId: "cat-elec",
    categoryName: "Électronique & High-Tech",
    name: "Casque Sans Fil Aura ANC Ultra",
    slug: "casque-sans-fil-aura-anc-ultra",
    sku: "AURA-ANC-01",
    shortDescription: "Réduction active du bruit hybride, 40h d'autonomie et son spatial studio.",
    description: "Le casque Aura ANC Ultra redéfinit l'expérience audio nomade avec ses transducteurs en béryllium de 40mm, sa charge ultra-rapide USB-C (5h d'écoute en 10 minutes) et ses coussinets à mémoire de forme ultra-respirants.",
    brand: "Aura Audio",
    price: 899.00,
    compareAtPrice: 1199.00,
    costPrice: 420.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Casque Sans Fil Aura ANC Ultra – Son Studio & Réduction Bruit",
    seoDescription: "Achetez le Casque Sans Fil Aura ANC Ultra avec réduction active de bruit, Bluetooth 5.3 et livraison express 24h.",
    rating: 4.8,
    reviewsCount: 38,
    viewCount: 1420,
    stockQuantity: 24,
    images: [
      {
        id: "img-1-1",
        productId: "prod-1",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        altText: "Casque Aura ANC Ultra Noir Mat",
        displayOrder: 1,
        isPrimary: true,
      }
    ],
    variants: [
      {
        id: "var-1-black",
        productId: "prod-1",
        sku: "AURA-ANC-BLK",
        title: "Noir Mat",
        colorOption: "Noir",
        price: 899.00,
        stockQuantity: 15,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
      }
    ],
    createdAt: "2026-08-15T10:00:00Z",
    updatedAt: "2026-09-28T14:30:00Z"
  }
];

const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [];

const INITIAL_ORDERS: Order[] = [];

const INITIAL_REVIEWS: Review[] = [];

const INITIAL_COUPONS: Coupon[] = [
  {
    id: "coup-1",
    code: "WELCOME10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minCartValue: 200.00,
    usageLimit: 500,
    usageCount: 142,
    isActive: true,
  },
  {
    id: "coup-2",
    code: "FLASH50",
    discountType: "FIXED_AMOUNT",
    discountValue: 50.00,
    minCartValue: 500.00,
    usageLimit: 100,
    usageCount: 47,
    isActive: true,
  },
  {
    id: "coup-3",
    code: "FREESHIP",
    discountType: "FREE_SHIPPING",
    discountValue: 0.00,
    minCartValue: 150.00,
    usageCount: 89,
    isActive: true,
  }
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: "ban-1",
    title: "Nouvelle Collection Automne 2026",
    subtitle: "Son Studio & Minimalisme Urbain – Livraison Gratuite dès 400 DH",
    imageDesktopUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    imageMobileUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    ctaText: "Découvrir la Sélection",
    ctaUrl: "/catalog",
    displayOrder: 1,
    isActive: true,
  }
];

const INITIAL_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: "sec-hero", sectionType: "HERO_BANNER", title: "Bannière Principale", displayOrder: 1, isActive: true },
  { id: "sec-cats", sectionType: "FEATURED_CATEGORIES", title: "Explorer par Catégorie", displayOrder: 2, isActive: true },
  { id: "sec-best", sectionType: "BEST_SELLERS", title: "Nos Meilleurs Ventes", displayOrder: 3, isActive: true },
  { id: "sec-prom", sectionType: "PROMOTION", title: "Offre Spéciale Limitée", displayOrder: 4, isActive: true },
  { id: "sec-wa", sectionType: "WHATSAPP_CTA", title: "Assistance & Commande WhatsApp", displayOrder: 5, isActive: true },
  { id: "sec-test", sectionType: "TESTIMONIALS", title: "Avis Clients Certifiés", displayOrder: 6, isActive: true },
];

const INITIAL_USERS: User[] = [
  {
    id: "usr-abdo",
    email: "abdo@store.com",
    firstName: "Abdo",
    lastName: "Store Admin",
    role: "SUPER_ADMIN",
    permissions: ["all"],
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "usr-2",
    email: "products@auracommerce.com",
    firstName: "Nadia",
    lastName: "Tazi",
    role: "PRODUCT_MANAGER",
    permissions: ["products:read", "products:create", "products:update", "products:delete", "categories:read", "categories:write"],
    isActive: true,
    createdAt: "2026-03-15T00:00:00Z"
  },
  {
    id: "usr-3",
    email: "orders@auracommerce.com",
    firstName: "Omar",
    lastName: "Mansouri",
    role: "ORDER_MANAGER",
    permissions: ["orders:read", "orders:update", "inventory:adjust"],
    isActive: true,
    createdAt: "2026-04-10T00:00:00Z"
  },
  {
    id: "usr-4",
    email: "analyst@auracommerce.com",
    firstName: "Sofia",
    lastName: "Chraibi",
    role: "ANALYST",
    permissions: ["analytics:read", "events:read", "reports:export"],
    isActive: true,
    createdAt: "2026-05-01T00:00:00Z"
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    email: "karim.benj@example.com",
    firstName: "Karim",
    lastName: "Benjelloun",
    phone: "+212 661 234567",
    isGuest: false,
    totalSpent: 2840.00,
    ordersCount: 4,
    rfmRecencyScore: 5,
    rfmFrequencyScore: 4,
    rfmMonetaryScore: 5,
    segmentLabel: "Champions",
    createdAt: "2026-04-12T10:00:00Z"
  },
  {
    id: "cust-2",
    email: "sara.alaoui@example.com",
    firstName: "Sara",
    lastName: "Alaoui",
    phone: "+212 665 987654",
    isGuest: false,
    totalSpent: 1120.00,
    ordersCount: 2,
    rfmRecencyScore: 4,
    rfmFrequencyScore: 3,
    rfmMonetaryScore: 3,
    segmentLabel: "Loyal Customers",
    createdAt: "2026-07-22T14:30:00Z"
  },
  {
    id: "cust-3",
    email: "mehdi.tazi@example.com",
    firstName: "Mehdi",
    lastName: "Tazi",
    phone: "+212 663 112233",
    isGuest: true,
    totalSpent: 199.00,
    ordersCount: 1,
    rfmRecencyScore: 5,
    rfmFrequencyScore: 1,
    rfmMonetaryScore: 1,
    segmentLabel: "New Customers",
    createdAt: "2026-09-29T15:00:00Z"
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-1",
    userId: "usr-1",
    userName: "Amine El Idrissi",
    userRole: "SUPER_ADMIN",
    action: "UPDATE",
    entityName: "Product",
    entityId: "prod-1",
    summary: "Prix promo mis à jour de 999 DH à 899 DH",
    oldValue: "price: 999.00",
    newValue: "price: 899.00",
    ipAddress: "196.200.142.12",
    createdAt: "2026-09-28T14:30:00Z"
  },
  {
    id: "aud-2",
    userId: "usr-2",
    userName: "Nadia Tazi",
    userRole: "PRODUCT_MANAGER",
    action: "CREATE",
    entityName: "ProductVariant",
    entityId: "var-3-16pro",
    summary: "Création variante iPhone 16 Pro pour Coque Kevlar",
    newValue: "sku: CASE-KEV-16P, stock: 18",
    ipAddress: "196.200.142.18",
    createdAt: "2026-09-29T11:00:00Z"
  },
  {
    id: "aud-3",
    userId: "usr-1",
    userName: "Amine El Idrissi",
    userRole: "SUPER_ADMIN",
    action: "APPROVE",
    entityName: "Review",
    entityId: "rev-1",
    summary: "Approbation avis client 5 étoiles sur Casque Aura ANC Ultra",
    ipAddress: "196.200.142.12",
    createdAt: "2026-09-29T12:00:00Z"
  }
];

const INITIAL_SETTINGS: StoreSettings = {
  storeName: "ShopMe Maroc",
  defaultCurrency: "MAD",
  defaultLanguage: "fr",
  taxRatePercent: 0,
  freeShippingThreshold: 500.00,
  standardShippingFee: 25.00,
  isFreeShippingPromoActive: false,
  cityShippingRates: {
    'Casablanca': 20.00,
    'Rabat': 25.00,
    'Marrakech': 30.00,
    'Tanger': 35.00,
    'Fès': 30.00,
    'Agadir': 35.00,
    'Oujda': 40.00,
    'Autre ville': 35.00
  },
  whatsappPhoneNumber: "+212600000000",
  whatsappOrderConfirmationTemplate: "Bonjour {{customer_name}}, votre commande #{{order_number}} d'un montant de {{total}} a bien été enregistrée et sera livrée à {{city}}. Merci pour votre confiance !",
  whatsappShippingTemplate: "Bonjour {{customer_name}}, votre colis pour la commande #{{order_number}} est en cours d'acheminement par notre livreur. Numéro de suivi : {{tracking_number}}.",
  metaPixelId: "982348273619284",
  googleAnalyticsId: "G-9K8L7M6N5P",
  tiktokPixelId: "C1234567890ABCDEFGH",
  snapchatPixelId: "snap-pix-9821381"
};

// State Store Holder
class DatabaseStore {
  categories: Category[] = INITIAL_CATEGORIES;
  products: Product[] = INITIAL_PRODUCTS;
  orders: Order[] = INITIAL_ORDERS;
  reviews: Review[] = INITIAL_REVIEWS;
  coupons: Coupon[] = INITIAL_COUPONS;
  banners: Banner[] = INITIAL_BANNERS;
  homepageSections: HomepageSection[] = INITIAL_HOMEPAGE_SECTIONS;
  inventoryMovements: InventoryMovement[] = INITIAL_INVENTORY_MOVEMENTS;
  users: User[] = INITIAL_USERS;
  customers: Customer[] = INITIAL_CUSTOMERS;
  auditLogs: AuditLog[] = INITIAL_AUDIT_LOGS;
  settings: StoreSettings = INITIAL_SETTINGS;

  // Persistence helpers
  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      this.syncFromBackend();
    }
  }

  async syncFromBackend() {
    try {
      const [prodRes, ordRes, setRes, catRes] = await Promise.all([
        fetch('/api/products').catch(() => null),
        fetch('/api/orders').catch(() => null),
        fetch('/api/settings').catch(() => null),
        fetch('/api/categories').catch(() => null)
      ]);

      if (prodRes && prodRes.ok) {
        const pData = await prodRes.json();
        if (pData.success && Array.isArray(pData.products) && pData.products.length > 0) {
          this.products = pData.products;
        }
      }

      if (ordRes && ordRes.ok) {
        const oData = await ordRes.json();
        if (oData.success && Array.isArray(oData.orders) && oData.orders.length > 0) {
          this.orders = oData.orders;
        }
      }

      if (catRes && catRes.ok) {
        const cData = await catRes.json();
        if (cData.success && Array.isArray(cData.categories) && cData.categories.length > 0) {
          this.categories = cData.categories;
        }
      }

      if (setRes && setRes.ok) {
        const sData = await setRes.json();
        if (sData.success && sData.settings) {
          this.settings = { ...this.settings, ...sData.settings };
        }
      }
      this.saveToStorage();
    } catch {
      // Background sync silent failover
    }
  }

  private loadFromStorage() {
    try {
      const savedCategories = localStorage.getItem("aura_categories");
      if (savedCategories) this.categories = JSON.parse(savedCategories);

      const savedProducts = localStorage.getItem("aura_products");
      if (savedProducts) this.products = JSON.parse(savedProducts);

      const savedOrders = localStorage.getItem("aura_orders");
      if (savedOrders) this.orders = JSON.parse(savedOrders);

      const savedReviews = localStorage.getItem("aura_reviews");
      if (savedReviews) this.reviews = JSON.parse(savedReviews);

      const savedSettings = localStorage.getItem("aura_settings");
      if (savedSettings) this.settings = JSON.parse(savedSettings);
    } catch {
      // Fallback to initial seeds in SSR/sandbox
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("aura_categories", JSON.stringify(this.categories));
      localStorage.setItem("aura_products", JSON.stringify(this.products));
      localStorage.setItem("aura_orders", JSON.stringify(this.orders));
      localStorage.setItem("aura_reviews", JSON.stringify(this.reviews));
      localStorage.setItem("aura_settings", JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  // --- Categories (CRUD) ---
  saveCategory(cat: Category, user?: User): Category {
    if (cat.parentId) {
      const parent = this.categories.find(c => c.id === cat.parentId);
      if (parent) {
        if (!parent.subcategories) parent.subcategories = [];
        const subIdx = parent.subcategories.findIndex(s => s.id === cat.id);
        if (subIdx >= 0) {
          parent.subcategories[subIdx] = cat;
        } else {
          parent.subcategories.push(cat);
        }
      }
    } else {
      const idx = this.categories.findIndex(c => c.id === cat.id);
      if (idx >= 0) {
        const existing = this.categories[idx];
        this.categories[idx] = {
          ...cat,
          subcategories: cat.subcategories || existing.subcategories || []
        };
      } else {
        this.categories.push({
          ...cat,
          subcategories: cat.subcategories || []
        });
      }
    }

    if (user) {
      this.addAuditLog(user, 'UPDATE', 'Category', cat.id, `Mise à jour catégorie : ${cat.name}`);
    }
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.categories)
      }).catch(() => null);
    }
    return cat;
  }

  deleteCategory(catId: string, parentId?: string, user?: User) {
    if (parentId) {
      const parent = this.categories.find(c => c.id === parentId);
      if (parent && parent.subcategories) {
        parent.subcategories = parent.subcategories.filter(s => s.id !== catId);
      }
    } else {
      this.categories = this.categories.filter(c => c.id !== catId);
    }

    if (user) {
      this.addAuditLog(user, 'DELETE', 'Category', catId, `Suppression catégorie : ${catId}`);
    }
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.categories)
      }).catch(() => null);
    }
  }

  // --- Order deletion ---
  deleteOrder(orderId: string, user?: User): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    this.orders = this.orders.filter(o => o.id !== orderId);
    if (user) {
      this.addAuditLog(user, 'DELETE', 'Order', orderId, `Suppression commande : #${order.orderNumber}`);
    }
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      fetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' }).catch(() => null);
    }
    return true;
  }

  // --- WhatsApp Order Confirmation ---
  confirmOrderViaWhatsApp(orderId: string, customReply?: string, user?: User): Order | undefined {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (!customReply?.trim()) return order;

    const itemsSummary = order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');

    order.status = 'CONFIRMED';
    order.whatsappConfirmation = {
      isConfirmed: true,
      confirmedAt: now.toISOString(),
      customerPhone: order.customerPhone,
      sentMessageText: `Salam ${order.shippingAddress.fullName} ! Merci pour votre commande #${order.orderNumber} sur ShopMe Maroc 🇲🇦.\n📦 Articles : ${itemsSummary}\n💰 Total : ${order.totalAmount.toFixed(2)} MAD (Paiement à la livraison)\n📍 Adresse : ${order.shippingAddress.street}, ${order.shippingAddress.city}\n\nVeuillez confirmer l'expédition en répondant à ce message.`,
      replyMessageText: reply,
      messageTimestamp: timeStr,
      replyTimestamp: timeStr,
      channel: 'WHATSAPP_BOT'
    };
    order.updatedAt = now.toISOString();

    if (user) {
      this.addAuditLog(user, 'APPROVE', 'Order', order.id, `Confirmation WhatsApp validée pour commande #${order.orderNumber}`);
    }
    this.saveToStorage();

    if (typeof window !== 'undefined') {
      fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED', whatsappConfirmation: order.whatsappConfirmation })
      }).catch(() => null);
    }

    return order;
  }

  // --- Products ---
  getProducts(filter?: { categoryId?: string; search?: string; status?: string; brand?: string }): Product[] {
    return this.products.filter(p => {
      if (filter?.status && p.status !== filter.status) return false;
      if (filter?.categoryId && p.categoryId !== filter.categoryId) return false;
      if (filter?.brand && p.brand !== filter.brand) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesDesc && !matchesBrand) return false;
      }
      return true;
    });
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.products.find(p => p.slug === slug);
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  saveProduct(product: Product, user: User): Product {
    const existingIndex = this.products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      const old = this.products[existingIndex];
      this.products[existingIndex] = { ...product, updatedAt: new Date().toISOString() };
      this.addAuditLog(user, 'UPDATE', 'Product', product.id, `Mise à jour produit : ${product.name}`, JSON.stringify(old), JSON.stringify(product));
    } else {
      this.products.unshift({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      this.addAuditLog(user, 'CREATE', 'Product', product.id, `Création produit : ${product.name}`, undefined, JSON.stringify(product));
    }
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      }).catch(err => console.warn('Backend saveProduct notice:', err));
    }
    return product;
  }

  deleteProduct(id: string, user: User) {
    const prod = this.products.find(p => p.id === id);
    const prodName = prod ? prod.name : id;
    this.products = this.products.filter(p => p.id !== id);
    this.addAuditLog(user, 'DELETE', 'Product', id, `Suppression produit : ${prodName}`);
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(err => console.warn('Backend deleteProduct notice:', err));
    }
  }

  // --- Inventory Movements ---
  recordInventoryMovement(
    productId: string,
    variantTitle: string | undefined,
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'RESERVATION' | 'RELEASE',
    quantityChanged: number,
    reason: string,
    performedBy: string
  ) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const before = product.stockQuantity;
    const after = Math.max(0, before + quantityChanged);
    product.stockQuantity = after;

    const movement: InventoryMovement = {
      id: "mov-" + Date.now(),
      productId,
      productName: product.name,
      variantTitle,
      movementType: type,
      quantityChanged,
      quantityBefore: before,
      quantityAfter: after,
      reason,
      performedBy,
      createdAt: new Date().toISOString()
    };

    this.inventoryMovements.unshift(movement);
    this.saveToStorage();
  }

  // --- Orders ---
  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderData,
      id: "ord-" + Date.now(),
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Deduct stock and record movement
    for (const item of newOrder.items) {
      this.recordInventoryMovement(
        item.productId,
        item.variantTitle,
        'OUT',
        -item.quantity,
        `Vente Commande #${orderNumber}`,
        'Système Automatique'
      );
    }

    this.orders.unshift(newOrder);
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(err => console.warn('Backend createOrder notice:', err));
    }
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: Order['status'], user: User) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      const oldStatus = order.status;
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this.addAuditLog(user, 'UPDATE', 'Order', orderId, `Statut commande #${order.orderNumber} changé de ${oldStatus} à ${status}`);
      this.saveToStorage();
      if (typeof window !== 'undefined') {
        fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        }).catch(err => console.warn('Backend updateOrderStatus notice:', err));
      }
    }
  }

  // --- Reviews ---
  submitReview(reviewData: Omit<Review, 'id' | 'status' | 'createdAt'>): Review {
    const review: Review = {
      ...reviewData,
      id: "rev-" + Date.now(),
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    this.reviews.unshift(review);
    this.saveToStorage();
    return review;
  }

  moderateReview(reviewId: string, status: Review['status'], user: User, reply?: string) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.status = status;
      if (reply) {
        review.adminReply = reply;
        review.adminRepliedAt = new Date().toISOString();
      }
      this.addAuditLog(user, status === 'APPROVED' ? 'APPROVE' : 'REJECT', 'Review', reviewId, `Modération avis client : ${status}`);
      this.saveToStorage();
    }
  }

  // --- Coupons ---
  validateCoupon(code: string, cartSubtotal: number): { valid: boolean; coupon?: Coupon; error?: string } {
    const coupon = this.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
    if (!coupon) {
      return { valid: false, error: "Code promotionnel introuvable" };
    }
    if (cartSubtotal < coupon.minCartValue) {
      return { valid: false, error: `Montant minimum du panier requis : ${coupon.minCartValue} DH` };
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: "Ce code promo a atteint sa limite d'utilisation" };
    }
    return { valid: true, coupon };
  }

  // --- Audit Logging ---
  addAuditLog(
    user: User,
    action: AuditLog['action'],
    entityName: string,
    entityId: string,
    summary: string,
    oldValue?: string,
    newValue?: string
  ) {
    const log: AuditLog = {
      id: "aud-" + Date.now(),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      action,
      entityName,
      entityId,
      summary,
      oldValue,
      newValue,
      ipAddress: "196.200.142.12",
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
  }

  // --- Delivery Fee Calculation ---
  calculateDeliveryFee(city: string = 'Casablanca', subtotal: number = 0): number {
    if (this.settings.isFreeShippingPromoActive) {
      return 0;
    }
    if (this.settings.freeShippingThreshold > 0 && subtotal >= this.settings.freeShippingThreshold) {
      return 0;
    }
    if (this.settings.cityShippingRates && this.settings.cityShippingRates[city] !== undefined) {
      return this.settings.cityShippingRates[city];
    }
    return this.settings.standardShippingFee ?? 25;
  }

  // --- Settings ---
  updateSettings(newSettings: Partial<StoreSettings>, user: User) {
    this.settings = { ...this.settings, ...newSettings };
    this.addAuditLog(user, 'UPDATE', 'Settings', 'global', 'Paramètres et frais de livraison de la boutique mis à jour');
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.settings)
      }).catch(err => console.warn('Backend updateSettings notice:', err));
    }
  }
}

export const dbService = new DatabaseStore();
