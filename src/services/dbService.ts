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
    productKind: "PHYSICAL"
  },
  {
    id: "cat-digital",
    name: "Produits Digitaux & Abonnements",
    slug: "produits-digitaux",
    description: "Abonnements IA & SVOD, clés de jeux, recharges in-game et licences logicielles",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    displayOrder: 5,
    isActive: true,
    productKind: "DIGITAL",
    badge: "INSTANT ⚡",
    subcategories: [
      {
        id: "subcat-dig-sub",
        parentId: "cat-digital",
        name: "Abonnements IA & Streaming (SVOD)",
        slug: "abonnements-streaming-ai",
        description: "YouTube Premium, Netflix, Higgsfield AI, ChatGPT Plus, Midjourney, Canva Pro, Apple TV...",
        imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80",
        displayOrder: 1,
        isActive: true,
        productKind: "DIGITAL"
      },
      {
        id: "subcat-dig-topup",
        parentId: "cat-digital",
        name: "Recharges & Diamants de Jeux (Top-Ups)",
        slug: "top-ups-gaming",
        description: "Recharges directes Free Fire, PUBG Mobile UC, Roblox Robux, Valorant VP, Brawl Stars...",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
        displayOrder: 2,
        isActive: true,
        productKind: "DIGITAL"
      },
      {
        id: "subcat-dig-keys",
        parentId: "cat-digital",
        name: "Clés de Jeux & CD Keys (Steam, Epic, Console)",
        slug: "cles-jeux-cd-keys",
        description: "Clés officielles Steam, GTA V, Minecraft, EA Sports FC, Xbox, PlayStation...",
        imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
        displayOrder: 3,
        isActive: true,
        productKind: "DIGITAL"
      },
      {
        id: "subcat-dig-acc",
        parentId: "cat-digital",
        name: "Comptes de Jeux & Gaming Accounts",
        slug: "comptes-jeux",
        description: "Comptes vérifiés avec skins rares GTA 5, Valorant, Clash of Clans, Roblox, Fortnite...",
        imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80",
        displayOrder: 4,
        isActive: true,
        productKind: "DIGITAL"
      },
      {
        id: "subcat-dig-soft",
        parentId: "cat-digital",
        name: "Logiciels & Licences (Windows, Office...)",
        slug: "logiciels-licences",
        description: "Licences authentiques Windows 11 Pro, Office 365, Antivirus, VPN, Adobe...",
        imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
        displayOrder: 5,
        isActive: true,
        productKind: "DIGITAL"
      },
      {
        id: "subcat-dig-gift",
        parentId: "cat-digital",
        name: "Cartes Cadeaux & Gift Cards",
        slug: "cartes-cadeaux",
        description: "Cartes cadeaux Steam, PlayStation Network, Apple Store, Google Play, Razer Gold...",
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
        displayOrder: 6,
        isActive: true,
        productKind: "DIGITAL"
      }
    ]
  },
  {
    id: "cat-services",
    name: "Services & Prestations",
    slug: "services-prestations",
    description: "Gaming boost & coaching, développement web, design graphique et support tech",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
    displayOrder: 6,
    isActive: true,
    productKind: "SERVICE",
    badge: "PRO 🛠️",
    subcategories: [
      {
        id: "subcat-serv-boost",
        parentId: "cat-services",
        name: "Gaming Boost & Coaching E-Sport",
        slug: "coaching-gaming",
        description: "Rank boost sécurisé, coaching 1-sur-1 Discord et optimisation de gameplay",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
        displayOrder: 1,
        isActive: true,
        productKind: "SERVICE"
      },
      {
        id: "subcat-serv-design",
        parentId: "cat-services",
        name: "Design Graphique & Création de Marque",
        slug: "design-graphique",
        description: "Logos professionnels, chartes graphiques, bannières publicitaires et miniatures",
        imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
        displayOrder: 2,
        isActive: true,
        productKind: "SERVICE"
      },
      {
        id: "subcat-serv-dev",
        parentId: "cat-services",
        name: "Développement Web & E-Commerce",
        slug: "dev-web",
        description: "Création de boutiques en ligne, intégration WhatsApp et tracking publicitaire",
        imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
        displayOrder: 3,
        isActive: true,
        productKind: "SERVICE"
      },
      {
        id: "subcat-serv-tech",
        parentId: "cat-services",
        name: "Installation & Support Serveurs Tech",
        slug: "support-tech",
        description: "Configuration VPS, serveurs de jeux, bots Discord et sécurité",
        imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
        displayOrder: 4,
        isActive: true,
        productKind: "SERVICE"
      }
    ]
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
    description: "Une création d'exception pour l'homme charismatique. Conçu avec des essences pures de bois de Oud cambodgien, relevé par des notes de cardamome épicée, d'ambre sombre et de musc sauvage. Tenue remarquable garantie sur la peau et les vêtements tout au long de la journée.\n\n[gif: https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80 | Flacon Prestige & Vaporisation Brume Fine 360°]\n\n## Pyramide Olfactive Royale\n• Notes de Tête : Cardamome noire, Safran d'Orient et Bergamote sauvage\n• Notes de Cœur : Bois d'Agar (Oud précieux), Rose fumée et Cuir noble\n• Notes de Fond : Ambre impérial, Musc blanc et Bois de Cèdre de l'Atlas\n\n[image: https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80 | Coffret Cadeau de Protection & Carte d'Authenticité Numérotée]\n\n## Démonstration & Conseils d'Application\n[video: https://www.youtube.com/watch?v=kJQP7kiw5Fk | Rituel d'application pour un sillage intense et durable 24h]",
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
    description: "Le casque Aura ANC Ultra redéfinit l'expérience audio nomade avec ses transducteurs en béryllium de 40mm, sa charge ultra-rapide USB-C (5h d'écoute en 10 minutes) et ses coussinets à mémoire de forme ultra-respirants.\n\n[gif: https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80 | Rotation 360° & Finition Noir Mat Micro-Sablé]\n\n## Performances Audio & Technologies Studio\n• Réduction Active du Bruit Hybride (ANC) -42dB\n• Transducteurs de 40mm Beryllium High-Resolution\n• Autonomie record de 40 heures avec charge rapide USB-C\n• Double microphone Beamforming pour des appels limpides\n\n[image: https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80 | Étui de Transport Rigide & Câble Audio Jack 3.5mm Tressé Inclus]\n\n## Démonstration & Test Sonore en Direct\n[video: https://www.youtube.com/watch?v=kJQP7kiw5Fk | Démonstration officielle du mode Transparence et Réduction Active]",
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
  },

  // --- PRODUITS DIGITAUX (Abonnements, Clés, Comptes, Top-Ups & Logiciels) ---
  {
    id: "prod-higgsfield",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-sub",
    subcategoryName: "Abonnements IA & Streaming (SVOD)",
    name: "Higgsfield Starter 200 Credits | 1 Mois Accès Complet | Nano Banana Pro + Kling 3.0",
    slug: "higgsfield-starter-ai-credits-1-month",
    sku: "DIG-HIGGS-01",
    shortDescription: "1 mois d'accès Higgsfield Starter pour génération d'images et vidéos IA haute définition avec modèles Kling 3.0 et Seedance.",
    description: "Obtenez 1 mois d'accès complet au service Higgsfield Starter pour générer des vidéos et images par intelligence artificielle avec les outils de création les plus avancés du marché.\n\n[image: https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80 | Interface Higgsfield Studio IA & Modèles Génératifs Ultra-HD]\n\n## Fonctionnalités Incluses\n• Accès prioritaire Nano Banana 2 & Nano Banana Pro\n• Modèle vidéo de pointe Kling 3.0 ultra-réaliste\n• Seedance 2.0 Fast & Seedance 2.0 Mini\n• Génération parallèle jusqu'à 2 vidéos et 4 images simultanées\n• Accès supercalculateur cloud sans file d'attente\n• Droits commerciaux complets sur toutes vos créations",
    brand: "Higgsfield AI",
    price: 129.00,
    compareAtPrice: 199.00,
    costPrice: 85.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Higgsfield Starter AI 200 Credits – Accès Complet 1 Mois Maroc",
    seoDescription: "Achetez votre abonnement Higgsfield Starter AI au Maroc. Livraison instantanée ⚡ et paiement sécurisé.",
    rating: 4.9,
    reviewsCount: 112,
    viewCount: 2840,
    stockQuantity: 99,
    images: [
      {
        id: "img-higgs-1",
        productId: "prod-higgsfield",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        altText: "Higgsfield Starter AI 200 Credits",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "SUBSCRIPTION",
      sharingMethod: "FULL_ACCESS",
      deliveryTime: "⚡ Livraison Instantanée (Moins de 2 minutes)",
      warrantyPeriod: "Garantie intégrale 30 jours (Remplacement ou remboursement)",
      regionRestriction: "Maroc & International (Activation directe sans VPN)",
      supportedDevices: ["PC", "Mac", "iOS", "Android"],
      durationOptions: [
        { id: "dur-h1", label: "1 Mois", durationValue: "1m", price: 129, compareAtPrice: 199, isDefault: true },
        { id: "dur-h3", label: "3 Mois", durationValue: "3m", price: 349, compareAtPrice: 597, badge: "POPULAIRE 🔥 -25%" },
        { id: "dur-h12", label: "12 Mois", durationValue: "12m", price: 999, compareAtPrice: 2388, badge: "MEILLEUR PRIX 🌟 -60%" }
      ],
      includedFeatures: [
        "200 Crédits mensuels rechargeables",
        "Nano Banana 2 access & Nano Banana Pro",
        "Kling 3.0 access pour vidéos cinématiques",
        "Seedance 2.0 Fast & Seedance 2.0 Mini access",
        "Génération parallèle : jusqu'à 2 vidéos + 4 images",
        "Accès Supercomputer prioritaire haute vitesse",
        "Téléchargements illimités en résolution 4K"
      ],
      keysPool: ["HIGGS-2026-STARTER-AURA99", "HIGGS-2026-STARTER-AURA88"],
      instantDeliveryNotice: "Vos identifiants et le guide d'activation vous sont transmis immédiatement par Email et WhatsApp après validation."
    },
    createdAt: "2026-10-10T10:00:00Z",
    updatedAt: "2026-10-12T15:00:00Z"
  },
  {
    id: "prod-freefire-diamonds",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-topup",
    subcategoryName: "Recharges & Diamants de Jeux (Top-Ups)",
    name: "Free Fire Diamants – Recharge Directe Instantanée UID (Maroc & MENA)",
    slug: "free-fire-diamants-recharge-directe-uid",
    sku: "DIG-FF-TOPUP",
    shortDescription: "Recharge officielle rapide de diamants Free Fire par Player ID (UID). Créditation sous 5 minutes 100% sécurisée.",
    description: "Rechargez votre compte Free Fire instantanément et au meilleur tarif au Maroc. Indiquez simplement votre ID Joueur (UID) lors de la commande.\n\n[image: https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80 | Recharge Directe Free Fire Maroc & MENA]\n\n## Avantages de la Recharge Officielle\n• Créditation directe et automatique sur votre compte sans mot de passe requis\n• Conforme aux directives Garena (Zéro risque de ban)\n• Débloquez instantanément le Pass Élite, les roulettes d'armes et les événements saisonniers\n• Support WhatsApp marocain disponible 24h/24",
    brand: "Garena Free Fire",
    price: 10.00,
    compareAtPrice: 15.00,
    costPrice: 7.50,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Recharge Diamants Free Fire Maroc – Pas Cher & Instantané",
    seoDescription: "Achetez des diamants Free Fire au Maroc par ID UID. Livraison immédiate 24/7.",
    rating: 4.95,
    reviewsCount: 340,
    viewCount: 8900,
    stockQuantity: 999,
    images: [
      {
        id: "img-ff-1",
        productId: "prod-freefire-diamonds",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
        altText: "Free Fire Recharge Diamants Maroc",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "GAME_TOPUP",
      sharingMethod: "DIRECT_TOPUP",
      deliveryTime: "⚡ Recharge Éclair (Moins de 5 minutes par UID)",
      warrantyPeriod: "Garantie Officielle Garena 100%",
      regionRestriction: "Serveurs Maroc, MENA & Europe",
      supportedDevices: ["Android", "iOS", "PC Emulateur"],
      topUpDenominations: [
        { id: "ff-100", amountLabel: "100 Diamants", price: 10.00, compareAtPrice: 12.00, bonus: "+10 Bonus" },
        { id: "ff-310", amountLabel: "310 Diamants", price: 32.00, compareAtPrice: 38.00, bonus: "+31 Bonus", isPopular: true },
        { id: "ff-520", amountLabel: "520 Diamants", price: 49.00, compareAtPrice: 60.00, discountBadge: "-18%" },
        { id: "ff-1060", amountLabel: "1060 Diamants", price: 99.00, compareAtPrice: 120.00, discountBadge: "-22%" },
        { id: "ff-2180", amountLabel: "2180 Diamants", price: 189.00, compareAtPrice: 240.00, discountBadge: "-25%" },
        { id: "ff-5600", amountLabel: "5600 Diamants", price: 479.00, compareAtPrice: 600.00, discountBadge: "-30%" },
        { id: "ff-weekly", amountLabel: "Pass Hebdomadaire (Weekly)", price: 22.00, compareAtPrice: 28.00, bonus: "450 Diamants cumulés" },
        { id: "ff-monthly", amountLabel: "Pass Mensuel (Monthly)", price: 89.00, compareAtPrice: 110.00, bonus: "2600 Diamants cumulés" }
      ],
      includedFeatures: [
        "Créditation instantanée via UID (ID Joueur)",
        "Aucun mot de passe ni identifiant sensible requis",
        "100% Sécurisé et officiel",
        "Assistance WhatsApp instantanée"
      ],
      instantDeliveryNotice: "Précisez votre UID joueur Free Fire dans les notes de commande ou sur WhatsApp pour validation immédiate."
    },
    createdAt: "2026-10-11T12:00:00Z",
    updatedAt: "2026-10-12T18:00:00Z"
  },
  {
    id: "prod-youtube-premium",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-sub",
    subcategoryName: "Abonnements IA & Streaming (SVOD)",
    name: "YouTube Premium – 3 Mois / 12 Mois Sans Pub & YouTube Music Inclus",
    slug: "youtube-premium-abonnement-maroc",
    sku: "DIG-YT-PREM",
    shortDescription: "Profitez de YouTube sans aucune publicité, lecture en arrière-plan et YouTube Music Premium en haute qualité.",
    description: "Éliminez toutes les publicités agaçantes et écoutez votre musique même écran éteint. Activation simple et sécurisée directement sur votre compte Gmail personnel.\n\n[image: https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80 | YouTube Premium sans publicité & YouTube Music]\n\n## Atouts de l'Abonnement Premium\n• Zéro publicité avant, pendant et après vos vidéos\n• Lecture en arrière-plan pendant que vous utilisez d'autres applications\n• Téléchargement de vidéos hors-connexion en qualité originale 1080p et 4K\n• YouTube Music Premium inclus avec millions de titres sans interruption\n• Fonctionne sur Smartphone, PC, TV connectée, PlayStation et Xbox",
    brand: "YouTube",
    price: 59.00,
    compareAtPrice: 120.00,
    costPrice: 30.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "YouTube Premium Maroc – Abonnement Pas Cher sans Pub",
    seoDescription: "Abonnement YouTube Premium au Maroc. Sans pub, arrière-plan et YouTube Music inclus.",
    rating: 4.9,
    reviewsCount: 210,
    viewCount: 5400,
    stockQuantity: 150,
    images: [
      {
        id: "img-yt-1",
        productId: "prod-youtube-premium",
        imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80",
        altText: "YouTube Premium Maroc",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "SUBSCRIPTION",
      sharingMethod: "FAMILY_INVITE",
      deliveryTime: "⚡ Recharge Éclair sous 1 heure (Lien d'invitation)",
      warrantyPeriod: "Garantie intégrale pendant toute la durée choisie",
      regionRestriction: "Maroc & International (Sans VPN)",
      supportedDevices: ["PC", "Mac", "Android", "iOS", "Smart TV", "PS5", "Xbox"],
      durationOptions: [
        { id: "yt-1m", label: "1 Mois", durationValue: "1m", price: 25, compareAtPrice: 40 },
        { id: "yt-3m", label: "3 Mois", durationValue: "3m", price: 59, compareAtPrice: 120, badge: "LE PLUS POPULAIRE 🔥", isDefault: true },
        { id: "yt-6m", label: "6 Mois", durationValue: "6m", price: 99, compareAtPrice: 240, badge: "-30%" },
        { id: "yt-12m", label: "12 Mois", durationValue: "12m", price: 169, compareAtPrice: 480, badge: "MEILLEURE OFFRE 🌟" }
      ],
      includedFeatures: [
        "Suppression totale de toutes les publicités",
        "Lecture en arrière-plan et écran verrouillé",
        "YouTube Music Premium haute fidélité inclus",
        "Téléchargements hors ligne illimités",
        "Activation officielle sur votre propre compte Gmail"
      ],
      instantDeliveryNotice: "Un lien d'invitation officiel est envoyé sur votre email/WhatsApp pour activer votre abonnement en 1 clic."
    },
    createdAt: "2026-10-10T14:00:00Z",
    updatedAt: "2026-10-12T19:00:00Z"
  },
  {
    id: "prod-apple-access",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-sub",
    subcategoryName: "Abonnements IA & Streaming (SVOD)",
    name: "Apple TV+ & Apple One 1 Mois – Accès Complet Sécurisé",
    slug: "apple-tv-apple-one-1-mois-acces-complet",
    sku: "DIG-APL-01",
    shortDescription: "Accès complet aux séries et films originaux primés Apple TV+ en qualité 4K Dolby Vision et Dolby Atmos.",
    description: "Profitez de toutes les productions originales Apple TV+ (Ted Lasso, Severance, The Morning Show) en qualité 4K HDR sans restriction.\n\n[image: https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80 | Apple TV+ Qualité 4K HDR]\n\n## Caractéristiques & Avantages\n• Streaming 4K HDR avec son spatial Dolby Atmos\n• Téléchargements pour lecture hors-ligne sur iPhone, iPad et Mac\n• Compatible TV connectées Samsung, LG, Android TV et consoles de salon\n• Accès garanti et renouvelable chaque mois",
    brand: "Apple",
    price: 29.00,
    compareAtPrice: 69.00,
    costPrice: 15.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Apple TV+ 1 Mois Maroc – Accès Complet Pas Cher",
    seoDescription: "Abonnement Apple TV+ au Maroc avec livraison rapide et support dédié.",
    rating: 4.85,
    reviewsCount: 88,
    viewCount: 1950,
    stockQuantity: 60,
    images: [
      {
        id: "img-apl-1",
        productId: "prod-apple-access",
        imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
        altText: "Apple TV+ Accès Complet",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "SUBSCRIPTION",
      sharingMethod: "FULL_ACCESS",
      deliveryTime: "⚡ Instant Delivery (Moins de 5 minutes)",
      warrantyPeriod: "Garantie intégrale 30 jours (Assistance 7j/7)",
      regionRestriction: "Maroc & International (Sans VPN)",
      supportedDevices: ["iPhone", "iPad", "Mac", "Apple TV", "Smart TV", "PC"],
      durationOptions: [
        { id: "ap-1m", label: "1 Mois", durationValue: "1m", price: 29, compareAtPrice: 69, isDefault: true },
        { id: "ap-3m", label: "3 Mois", durationValue: "3m", price: 69, compareAtPrice: 199, badge: "-25%" }
      ],
      includedFeatures: [
        "Accès illimité à toutes les séries Apple Originals",
        "Qualité vidéo 4K UHD avec Dolby Vision",
        "Son immersif Dolby Atmos",
        "Profil privé protégé par code PIN"
      ]
    },
    createdAt: "2026-10-11T09:00:00Z",
    updatedAt: "2026-10-12T16:00:00Z"
  },
  {
    id: "prod-windows-11",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-soft",
    subcategoryName: "Logiciels & Licences (Windows, Office...)",
    name: "Windows 11 Professionnel 64-bit – Clé d'Activation Licence Authentique À Vie (Retail)",
    slug: "windows-11-pro-cle-activation-licence-authentique",
    sku: "DIG-WIN11-PRO",
    shortDescription: "Clé d'activation officielle Microsoft Windows 11 Pro Retail à vie. Activation directe en ligne et mises à jour garanties.",
    description: "Activez votre système d'exploitation Windows 11 Pro en toute légalité et débloquez toutes les fonctionnalités professionnelles (BitLocker, Bureau à distance, Sandbox, Hyper-V).\n\n[image: https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80 | Clé d'Activation Officielle Windows 11 Pro]\n\n## Points Forts de la Licence Windows 11 Pro\n• Clé Retail authentique 25 caractères pour 1 PC à vie\n• Activation instantanée en ligne auprès des serveurs officiels Microsoft\n• Mises à jour de sécurité Windows Update automatiques et gratuites\n• Compatible installation propre ou mise à niveau depuis Windows 11 Famille",
    brand: "Microsoft",
    price: 89.00,
    compareAtPrice: 1990.00,
    costPrice: 40.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Clé Windows 11 Pro Maroc – Licence À Vie Authentique Pas Cher",
    seoDescription: "Achetez votre clé Windows 11 Pro authentique au Maroc. Activation immédiate garantie.",
    rating: 4.95,
    reviewsCount: 165,
    viewCount: 4200,
    stockQuantity: 200,
    images: [
      {
        id: "img-win-1",
        productId: "prod-windows-11",
        imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        altText: "Windows 11 Pro Licence Maroc",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "SOFTWARE",
      sharingMethod: "LICENSE_KEY",
      deliveryTime: "⚡ Envoi Immédiat par Email & WhatsApp (Moins de 2 minutes)",
      warrantyPeriod: "Garantie Activation Permanente À Vie",
      regionRestriction: "Mondiale (Multilingue dont Français et Arabe)",
      supportedDevices: ["PC Fixe", "PC Portable"],
      includedFeatures: [
        "Clé officielle Retail 25 caractères authentique",
        "Activation permanente à vie liée à votre carte mère",
        "Mises à jour de sécurité régulières",
        "Guide d'installation pas-à-pas en français inclus"
      ],
      keysPool: ["W11PRO-SHOPME-MAROC-KEY01", "W11PRO-SHOPME-MAROC-KEY02"]
    },
    createdAt: "2026-10-11T16:00:00Z",
    updatedAt: "2026-10-12T20:00:00Z"
  },

  // --- PRESTATIONS DE SERVICES ---
  {
    id: "prod-service-ecommerce",
    productKind: "SERVICE",
    categoryId: "cat-services",
    categoryName: "Services & Prestations",
    subcategoryId: "subcat-serv-dev",
    subcategoryName: "Développement Web & E-Commerce",
    name: "Création de Boutique E-Commerce Clé en Main & Setup Publicitaire (Livraison 48h)",
    slug: "creation-boutique-ecommerce-cle-en-main-maroc",
    sku: "SRV-WEB-ECOM",
    shortDescription: "Boutique en ligne moderne haute conversion avec catalogue, commandes WhatsApp, suivi de livraison et tracking multi-plateformes.",
    description: "Lancez votre activité de commerce électronique au Maroc en toute sérénité. Nous concevons votre boutique sur-mesure optimisée pour mobile, connectée directement à votre WhatsApp professionnel et prête à générer des ventes dès le premier jour.\n\n[image: https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80 | Développement de Boutiques E-Commerce Haute Performance]\n\n## Ce qui est Inclus dans la Prestation\n• Boutique web ultra-rapide adaptée aux smartphones marocains (85%+ du trafic)\n• Module de commande en 1 clic par formulaire express et WhatsApp\n• Intégration complète des pixels de suivi (Meta Pixel CAPI, TikTok, Google Analytics 4)\n• Ajout de vos premiers produits avec photos WebP optimisées et fiches descriptives\n• Formation personnalisée en visio pour apprendre à gérer vos commandes et clients",
    brand: "ShopMe Services",
    price: 799.00,
    compareAtPrice: 1499.00,
    costPrice: 200.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Création Boutique E-Commerce Maroc – Clé en Main 48h",
    seoDescription: "Faites créer votre site e-commerce au Maroc avec paiement à la livraison et WhatsApp. Devis gratuit.",
    rating: 5.0,
    reviewsCount: 42,
    viewCount: 1680,
    stockQuantity: 10,
    images: [
      {
        id: "img-srv-1",
        productId: "prod-service-ecommerce",
        imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        altText: "Création Boutique E-Commerce Maroc",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    serviceSpecs: {
      serviceType: "Développement Web & E-Commerce Mobile-First",
      turnaroundTime: "48 heures chrono",
      revisions: "Révisions illimitées jusqu'à validation finale",
      deliverables: [
        "Boutique web complète opérationnelle",
        "Système de commande WhatsApp & tickets de livraison",
        "Pixels Meta & TikTok configurés",
        "Session d'accompagnement 30 min"
      ],
      clientRequirements: "Nom de votre marque, logo (si disponible) et liste des produits à intégrer",
      guaranteeText: "Satisfait ou remboursé. Assistance technique gratuite offerte pendant 30 jours."
    },
    createdAt: "2026-10-12T08:00:00Z",
    updatedAt: "2026-10-12T17:00:00Z"
  },
  {
    id: "prod-service-gaming",
    productKind: "SERVICE",
    categoryId: "cat-services",
    categoryName: "Services & Prestations",
    subcategoryId: "subcat-serv-boost",
    subcategoryName: "Gaming Boost & Coaching E-Sport",
    name: "Coaching Personnalisé & Rank Boost E-Sport Gaming Pro (Valorant / LoL / Free Fire)",
    slug: "coaching-gaming-esport-rank-boost-pro",
    sku: "SRV-GAME-COACH",
    shortDescription: "Améliorez vos compétences ou montez en rang avec l'aide de joueurs professionnels certifiés. Session 1-sur-1 Discord.",
    description: "Atteignez le rang de vos rêves grâce à un accompagnement bienveillant et professionnel par nos coachs e-sport certifiés.\n\n[image: https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80 | Coaching E-Sport 1-sur-1]\n\n## Déroulement de la Prestation\n• Analyse de vos parties enregistrées et détection des axes d'amélioration\n• Conseils sur la visée, le positionnement, la gestion de ressources et la communication\n• Session en direct avec le coach sur Discord en salon privé vocal",
    brand: "ShopMe E-Sport",
    price: 149.00,
    compareAtPrice: 250.00,
    costPrice: 50.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Coaching Gaming E-Sport Maroc – Pro Rank Boost",
    seoDescription: "Séance de coaching gaming e-sport avec des experts compétitifs au Maroc.",
    rating: 4.95,
    reviewsCount: 56,
    viewCount: 1100,
    stockQuantity: 20,
    images: [
      {
        id: "img-srv-2",
        productId: "prod-service-gaming",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
        altText: "Coaching Gaming E-Sport Pro",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    serviceSpecs: {
      serviceType: "Coaching & Boosting E-Sport",
      turnaroundTime: "Séance planifiée sous 24h sur Discord",
      revisions: "Compte-rendu écrit et fiche d'entraînement inclus",
      deliverables: [
        "1h30 de coaching vocal en direct",
        "Feuille de route d'exercices d'entraînement personnalisée",
        "Accès au Discord VIP pour poser vos questions"
      ],
      clientRequirements: "Votre pseudo de jeu, votre rang actuel et vos disponibilités",
      guaranteeText: "Progression garantie ou session de rattrapage offerte."
    },
    createdAt: "2026-10-12T10:00:00Z",
    updatedAt: "2026-10-12T18:00:00Z"
  },

  // --- CLÉS DE JEUX (GAME KEYS) ---
  {
    id: "prod-gtav-steam",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-keys",
    subcategoryName: "Clés de Jeux & CD Keys (Steam, Epic, Console)",
    name: "Grand Theft Auto V: Premium Edition – Clé CD Steam Officielle (Rockstar Global)",
    slug: "gta-5-premium-edition-cle-cd-steam-officielle",
    sku: "DIG-KEY-GTA5",
    shortDescription: "Clé CD Steam 100% officielle avec mode Histoire complet, GTA Online et Pack d'entrée dans le monde du crime (1,000,000 $ bonus).",
    description: "Explorez Los Santos et Blaine County dans l'expérience ultime de GTA V. Clé d'activation officielle Steam livrée instantanément après validation de votre commande.\n\n[image: https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80 | Clé Steam Officielle GTA V Premium]\n\n## Ce que Contient cette Édition Premium\n• Jeu complet Grand Theft Auto V (Mode Histoire solo)\n• Accès illimité à GTA Online et toutes ses mises à jour\n• Pack d'entrée dans le monde du crime avec 1,000,000 $ GTA bonus à dépenser en ligne\n• Activation directe sur votre compte Steam personnel (Sans VPN, Région Globale)",
    brand: "Rockstar Games",
    price: 139.00,
    compareAtPrice: 349.00,
    costPrice: 85.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Clé CD GTA 5 Steam Maroc – Activation Immédiate Pas Cher",
    seoDescription: "Achetez votre clé Steam GTA V Premium au Maroc. Envoi du code en 2 minutes par WhatsApp et Email.",
    rating: 4.96,
    reviewsCount: 184,
    viewCount: 5200,
    stockQuantity: 45,
    images: [
      {
        id: "img-gta-1",
        productId: "prod-gtav-steam",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
        altText: "GTA 5 Premium Edition Steam Key",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "GAME_KEY",
      sharingMethod: "LICENSE_KEY",
      deliveryTime: "⚡ Envoi Immédiat par Email & WhatsApp (Moins de 2 minutes)",
      warrantyPeriod: "Garantie Activation 100% Officielle Permanente",
      regionRestriction: "Global (Monde Entier, Sans VPN)",
      supportedDevices: ["PC (Steam)"],
      includedFeatures: [
        "Clé officielle Steam authentique",
        "Mode Histoire + GTA Online inclus",
        "1,000,000 $ GTA cash in-game offert",
        "Tutoriel d'activation Steam fourni"
      ],
      keysPool: [
        "STEAM-GTA5-MA-9821-XKQW",
        "STEAM-GTA5-MA-4512-VBNM",
        "STEAM-GTA5-MA-7834-LKJH"
      ],
      instantDeliveryNotice: "Votre clé CD Steam vous est transmise instantanément par WhatsApp et Email avec le guide d'activation en 3 clics."
    },
    createdAt: "2026-10-12T11:00:00Z",
    updatedAt: "2026-10-12T19:00:00Z"
  },
  {
    id: "prod-eafc24-key",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-keys",
    subcategoryName: "Clés de Jeux & CD Keys (Steam, Epic, Console)",
    name: "EA SPORTS FC 24 – Clé d'Activation PC Officielle (EA App Global)",
    slug: "ea-sports-fc-24-cle-pc-ea-app-officielle",
    sku: "DIG-KEY-FC24",
    shortDescription: "La nouvelle ère du football virtuel avec HyperMotionV, Ultimate Team et mode Carrière complet. Clé officielle EA App.",
    description: "Vivez le football le plus réaliste avec plus de 19 000 joueurs sous licence, 700 équipes et 30 compétitions officielles.\n\n[image: https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80 | EA SPORTS FC 24 Clé PC]\n\n## Fonctionnalités Principales\n• Clé d'activation officielle EA App pour PC\n• Ultimate Team complet avec cartes masculines et féminines\n• Matchs en ligne stables avec serveurs officiels EA",
    brand: "EA Sports",
    price: 199.00,
    compareAtPrice: 599.00,
    costPrice: 120.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Clé EA FC 24 PC Maroc – EA Sports FC 24 Pas Cher",
    seoDescription: "Achetez la clé officielle EA FC 24 PC au Maroc. Livraison rapide par WhatsApp.",
    rating: 4.88,
    reviewsCount: 92,
    viewCount: 3100,
    stockQuantity: 28,
    images: [
      {
        id: "img-fc-1",
        productId: "prod-eafc24-key",
        imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
        altText: "EA Sports FC 24 PC Key",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "GAME_KEY",
      sharingMethod: "LICENSE_KEY",
      deliveryTime: "⚡ Envoi Immédiat par WhatsApp & Email (Moins de 2 minutes)",
      warrantyPeriod: "Garantie Activation Permanente",
      regionRestriction: "Global (Sans VPN)",
      supportedDevices: ["PC (EA App)"],
      includedFeatures: [
        "Clé CD originale EA App",
        "Multijoueur en ligne Ultimate Team",
        "Mises à jour des effectifs en direct"
      ],
      keysPool: [
        "EAFC24-MA-PC-1192-QWER",
        "EAFC24-MA-PC-8831-TYUI"
      ]
    },
    createdAt: "2026-10-12T12:00:00Z",
    updatedAt: "2026-10-12T19:30:00Z"
  },

  // --- COMPTES GAMING (ACCOUNTS) ---
  {
    id: "prod-valorant-acc",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-acc",
    subcategoryName: "Comptes de Jeux & Gaming Accounts",
    name: "Compte Valorant Vérifié – Couteau Papillon + Vandal Prime (Full Access Email Inclus)",
    slug: "compte-valorant-verifie-couteau-papillon-vandal-prime",
    sku: "DIG-ACC-VALO",
    shortDescription: "Compte Riot Games vérifié prêt pour les ranked (Niveau 75+, Platine II) avec skins convoités et changement d'email total garanti.",
    description: "Obtenez directement un compte Valorant prestigieux équipé des meilleurs skins du jeu sans attendre ni dépenser des milliers de points.\n\n[image: https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80 | Compte Valorant Vérifié Full Access]\n\n## Caractéristiques du Compte\n• Couteau Papillon (Butterfly Knife) animé niveau max\n• Vandal Prime avec finitions audio et finisher laser\n• Phantom Oni et Operator Ion débloqués\n• Niveau 75+ · Rang Platine II (MMR sain)\n• Accès complet (Full Access) : vous changez l'adresse email et le mot de passe immédiatement",
    brand: "Riot Games",
    price: 349.00,
    compareAtPrice: 890.00,
    costPrice: 200.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Acheter Compte Valorant Maroc – Vandal Prime & Couteau Papillon",
    seoDescription: "Compte Valorant à vendre au Maroc avec skins exclusifs et full access garanti.",
    rating: 4.97,
    reviewsCount: 67,
    viewCount: 4100,
    stockQuantity: 8,
    images: [
      {
        id: "img-valo-1",
        productId: "prod-valorant-acc",
        imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
        altText: "Compte Valorant Full Access Maroc",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "ACCOUNT",
      sharingMethod: "FULL_ACCESS",
      deliveryTime: "⚡ Remise Sécurisée en 5 minutes par WhatsApp & Email",
      warrantyPeriod: "Garantie Anti-Récupération & Remplacement 30 Jours",
      regionRestriction: "Région EU / MENA (Serveurs Maroc 20-30ms ping)",
      supportedDevices: ["PC Riot Client"],
      includedFeatures: [
        "Identifiants Riot (Username + Mot de passe)",
        "Accès à l'adresse email d'origine avec lien de transfert",
        "Aucun bannissement ni avertissement (Compte Clean)",
        "Assistance WhatsApp dédiée pour la sécurisation"
      ],
      instantDeliveryNotice: "Vos identifiants et le guide pour changer l'email à votre nom vous sont envoyés directement sur WhatsApp."
    },
    createdAt: "2026-10-12T13:00:00Z",
    updatedAt: "2026-10-12T20:00:00Z"
  },
  {
    id: "prod-gta5-modded",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-acc",
    subcategoryName: "Comptes de Jeux & Gaming Accounts",
    name: "Compte GTA 5 Online Moddé – 1 Milliard $ + Déblocages Complets & Voitures Rares (PC)",
    slug: "compte-gta-5-online-modde-1-milliard-deblocages-complets",
    sku: "DIG-ACC-GTA5M",
    shortDescription: "Jouez sans aucune limite avec 1 Milliard de dollars en banque, niveau 250, tous les bunkers, complexes, tenues moddées et garages pleins.",
    description: "Le compte ultime pour dominer GTA Online sans passer des mois à farmer. Système 100% sécurisé et protégé contre tout bannissement.\n\n[image: https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80 | Compte GTA 5 Moddé 1 Milliard]\n\n## Caractéristiques du Compte Moddé\n• 1 000 000 000 $ en cash liquide et banque\n• Niveau 250 avec toutes les compétences maxées (Tir, Conduite, Vol, Force)\n• Toutes les armes débloquées avec finitions spéciales\n• 50+ supersportives moddées avec roues F1 et peintures nacrées rares\n• Garages 50 places, Yacht de luxe et boîte de nuit achetés",
    brand: "Rockstar Games",
    price: 249.00,
    compareAtPrice: 590.00,
    costPrice: 130.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Compte GTA 5 Moddé Maroc – 1 Milliard Cash PC",
    seoDescription: "Achetez un compte GTA 5 Online moddé au Maroc. Sécurité garantie et livraison rapide.",
    rating: 4.93,
    reviewsCount: 112,
    viewCount: 3800,
    stockQuantity: 12,
    images: [
      {
        id: "img-gtam-1",
        productId: "prod-gta5-modded",
        imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
        altText: "Compte GTA 5 Modde 1 Milliard",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "ACCOUNT",
      sharingMethod: "FULL_ACCESS",
      deliveryTime: "⚡ Livraison en 5 minutes par WhatsApp",
      warrantyPeriod: "Garantie Sécurité Anti-Ban 30 Jours",
      regionRestriction: "Global (Monde Entier)",
      supportedDevices: ["PC (Steam / Rockstar)"],
      includedFeatures: [
        "1 Milliard de dollars in-game garantis",
        "Niveau 250 & Déblocages 100%",
        "Changement d'email et mot de passe immédiat",
        "Support WhatsApp 7j/7 pour vous aider"
      ]
    },
    createdAt: "2026-10-12T14:00:00Z",
    updatedAt: "2026-10-12T20:30:00Z"
  },

  // --- LOGICIELS (SOFTWARES) ---
  {
    id: "prod-office-365",
    productKind: "DIGITAL",
    categoryId: "cat-digital",
    categoryName: "Produits Digitaux & Abonnements",
    subcategoryId: "subcat-dig-soft",
    subcategoryName: "Logiciels & Licences (Windows, Office...)",
    name: "Microsoft Office 365 Pro Plus – Licence 5 Appareils (PC/Mac/Mobile) + 1 To Cloud OneDrive",
    slug: "microsoft-office-365-pro-plus-5-appareils-1to-onedrive",
    sku: "DIG-SOFT-O365",
    shortDescription: "Pack complet Word, Excel, PowerPoint, Outlook, Access avec 1 To de stockage cloud sécurisé OneDrive sur 5 appareils simultanés.",
    description: "Profitez de la suite bureautique la plus puissante au monde sur tous vos appareils en version toujours à jour.\n\n[image: https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80 | Microsoft Office 365 Pro Plus]\n\n## Applications Incluses\n• Word, Excel, PowerPoint, Outlook, OneNote, Teams\n• 1 000 Go (1 To) d'espace de stockage cloud OneDrive ultra-rapide\n• Utilisable sur 5 appareils simultanément : PC Windows, Mac, iPad, iPhone, tablettes Android\n• Mises à jour automatiques des fonctionnalités",
    brand: "Microsoft",
    price: 119.00,
    compareAtPrice: 699.00,
    costPrice: 50.00,
    status: "PUBLISHED",
    isFeatured: true,
    isVisible: true,
    seoTitle: "Acheter Office 365 Maroc – 5 Appareils + 1 To Cloud Pas Cher",
    seoDescription: "Licence officielle Microsoft Office 365 au Maroc. Activation immédiate garantie.",
    rating: 4.94,
    reviewsCount: 138,
    viewCount: 4600,
    stockQuantity: 150,
    images: [
      {
        id: "img-o365-1",
        productId: "prod-office-365",
        imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
        altText: "Office 365 Pro Plus 5 Appareils",
        displayOrder: 1,
        isPrimary: true
      }
    ],
    variants: [],
    digitalSpecs: {
      digitalType: "SOFTWARE",
      sharingMethod: "FULL_ACCESS",
      deliveryTime: "⚡ Envoi Immédiat par Email & WhatsApp (Moins de 2 minutes)",
      warrantyPeriod: "Garantie 1 An Renouvelable",
      regionRestriction: "Global (Multilingue dont Français & Arabe)",
      supportedDevices: ["Windows 10/11", "macOS", "iPad / iOS", "Android"],
      includedFeatures: [
        "Compte officiel Microsoft avec licence Pro Plus",
        "Installation autorisée sur 5 appareils en même temps",
        "1 To de stockage OneDrive privé",
        "Mises à jour Microsoft officielles incluses"
      ],
      instantDeliveryNotice: "Vos identifiants de connexion et le lien officiel de téléchargement Microsoft vous sont envoyés immédiatement."
    },
    createdAt: "2026-10-12T15:00:00Z",
    updatedAt: "2026-10-12T21:00:00Z"
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

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-init",
    userId: "usr-abdo",
    userName: "Abdo Store Admin",
    userRole: "SUPER_ADMIN",
    action: "CREATE",
    entityName: "Store",
    entityId: "store-shopme",
    summary: "Boutique ShopMe initialisée et prête pour le lancement en ligne",
    ipAddress: "127.0.0.1",
    createdAt: new Date().toISOString()
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
  whatsappOrderConfirmationTemplate: "Bonjour {{customer_name}} 👋\nMerci pour votre commande *{{order_number}}* sur ShopMe.\n📦 {{items}}\n💰 Total : {{total}} (paiement à la livraison)\n📍 {{address}}\n\nRépondez *OUI* pour confirmer votre commande ou *NON* pour l'annuler.",
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
      if (savedCategories) {
        const loadedCats: Category[] = JSON.parse(savedCategories);
        this.categories = INITIAL_CATEGORIES.map(initCat => {
          const existing = loadedCats.find(lc => lc.id === initCat.id);
          if (!existing) return initCat;
          if (initCat.subcategories && (!existing.subcategories || existing.subcategories.length < initCat.subcategories.length)) {
            return { ...existing, subcategories: initCat.subcategories, productKind: initCat.productKind || existing.productKind };
          }
          return existing;
        });
        const extraCats = loadedCats.filter(lc => !INITIAL_CATEGORIES.some(ic => ic.id === lc.id));
        this.categories = [...this.categories, ...extraCats];
      }

      const savedProducts = localStorage.getItem("aura_products");
      if (savedProducts) {
        const loaded: Product[] = JSON.parse(savedProducts);
        const missingProducts = INITIAL_PRODUCTS.filter(ip => !loaded.some(lp => lp.id === ip.id));
        const merged = [...loaded, ...missingProducts];

        // Ensure showcase products receive rich descriptions if missing media tags
        this.products = merged.map(p => {
          if (p.id === 'prod-oud-royal' && !p.description.includes('[gif:')) {
            const initialOud = INITIAL_PRODUCTS.find(ip => ip.id === 'prod-oud-royal');
            if (initialOud) return { ...p, description: initialOud.description };
          }
          if (p.id === 'prod-1' && !p.description.includes('[gif:')) {
            const initialAudio = INITIAL_PRODUCTS.find(ip => ip.id === 'prod-1');
            if (initialAudio) return { ...p, description: initialAudio.description };
          }
          return p;
        });
      }

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

  // --- WhatsApp Order Confirmation ---
  confirmOrderViaWhatsApp(orderId: string, customReply?: string, user?: User): Order | undefined {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const reply = customReply || "Salam ShopMe ! Oui je confirme ma commande avec grand plaisir. Merci d'envoyer le livreur au plus vite 🙏✅";

    const itemsSummary = order.items.map(i => `${i.productName} (x${i.quantity})`).join('\n• ');
    const initialSent = order.whatsappConfirmation?.sentMessageText || 
      `Salam ${order.shippingAddress.fullName} ! 👋\nMerci pour votre commande sur *ShopMe Maroc* 🇲🇦.\n\n📋 *Détails de votre commande #${order.orderNumber}* :\n• ${itemsSummary}\n\n💰 *Total à régler* : *${order.totalAmount.toFixed(2)} MAD* (Paiement cash à la livraison)\n📍 *Adresse* : ${order.shippingAddress.street}, ${order.shippingAddress.city}\n📞 *Téléphone* : ${order.customerPhone}\n🚚 *Expédition* : Livraison express 24h-48h avec ouverture et vérification du colis avant paiement.\n\n👉 *Veuillez répondre « OUI » ou « CONFIRMER » pour valider l'expédition express.*`;

    const conv = Array.isArray(order.whatsappConfirmation?.conversation) ? [...order.whatsappConfirmation.conversation] : [];
    if (conv.length === 0) {
      conv.push({
        id: `msg-init-${Date.now()}`,
        sender: 'STORE_BOT',
        text: initialSent,
        timestamp: timeStr
      });
    }

    conv.push({
      id: `msg-cust-${Date.now()}`,
      sender: 'CUSTOMER',
      text: reply,
      timestamp: timeStr
    });

    const botAck = `✅ Parfait ${order.shippingAddress.fullName} ! Votre commande *#${order.orderNumber}* est validée. Notre équipe prépare votre colis pour expédition à ${order.shippingAddress.city}. Le livreur vous contactera par téléphone avant la livraison. Merci pour votre confiance ! 🚀`;
    conv.push({
      id: `msg-bot-ack-${Date.now()}`,
      sender: 'STORE_BOT',
      text: botAck,
      timestamp: timeStr
    });

    order.status = 'CONFIRMED';
    order.whatsappConfirmation = {
      isConfirmed: true,
      confirmedAt: now.toISOString(),
      customerPhone: order.customerPhone,
      sentMessageText: initialSent,
      replyMessageText: reply,
      messageTimestamp: timeStr,
      replyTimestamp: timeStr,
      channel: 'WHATSAPP_BOT',
      needsHumanIntervention: false,
      conversation: conv
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

  async sendAdminWhatsAppMessage(orderId: string, text: string, user?: User): Promise<Order | undefined> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const conv = Array.isArray(order.whatsappConfirmation?.conversation) ? [...order.whatsappConfirmation.conversation] : [];

    conv.push({
      id: `msg-admin-${Date.now()}`,
      sender: 'ADMIN',
      text,
      timestamp: timeStr
    });

    order.whatsappConfirmation = {
      ...order.whatsappConfirmation,
      isConfirmed: order.whatsappConfirmation?.isConfirmed || false,
      customerPhone: order.customerPhone,
      sentMessageText: order.whatsappConfirmation?.sentMessageText || text,
      replyMessageText: order.whatsappConfirmation?.replyMessageText || '',
      messageTimestamp: order.whatsappConfirmation?.messageTimestamp || timeStr,
      replyTimestamp: order.whatsappConfirmation?.replyTimestamp || '',
      channel: 'WHATSAPP_AGENT',
      needsHumanIntervention: false,
      humanInterventionReason: undefined,
      conversation: conv
    };
    order.updatedAt = new Date().toISOString();

    if (user) {
      this.addAuditLog(user, 'UPDATE', 'Order', order.id, `Message WhatsApp agent envoyé au client #${order.orderNumber}`);
    }
    this.saveToStorage();

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/whatsapp/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, text })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.order?.whatsappConfirmation) {
            order.whatsappConfirmation = data.order.whatsappConfirmation;
            this.saveToStorage();
          }
        }
      } catch (e) {
        console.warn('sendAdminWhatsAppMessage fetch error:', e);
      }
    }

    return order;
  }

  async simulateCustomerWhatsAppReply(orderId: string, text: string): Promise<Order | undefined> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/whatsapp/simulate-incoming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, phone: order.customerPhone, text })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            const idx = this.orders.findIndex(o => o.id === order.id);
            if (idx >= 0) {
              this.orders[idx] = { ...this.orders[idx], ...data.order };
              this.saveToStorage();
              return this.orders[idx];
            }
          }
        }
      } catch (e) {
        console.warn('simulateCustomerWhatsAppReply fetch error:', e);
      }
    }

    return this.confirmOrderViaWhatsApp(orderId, text);
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
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const itemsSummary = (orderData.items || []).map(i => {
      const v = i.variantTitle ? ` (${i.variantTitle})` : '';
      return `${i.productName}${v} x${i.quantity} [${Number(i.unitPrice || i.subtotal || 0).toFixed(0)} MAD]`;
    }).join('\n• ');

    const initialSentMsg = `Salam ${orderData.shippingAddress.fullName} ! 👋\nMerci pour votre commande sur *ShopMe Maroc* 🇲🇦.\n\n📋 *Détails de votre commande #${orderNumber}* :\n• ${itemsSummary}\n\n💰 *Total à régler* : *${orderData.totalAmount.toFixed(2)} MAD* (Paiement cash à la livraison)\n📍 *Adresse* : ${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}\n📞 *Téléphone* : ${orderData.customerPhone}\n🚚 *Expédition* : Livraison express 24h-48h avec ouverture et vérification du colis avant paiement.\n\n👉 Répondez *OUI* pour confirmer votre commande ✅ ou *NON* pour l'annuler ❌.`;

    const newOrder: Order = {
      ...orderData,
      id: "ord-" + Date.now(),
      orderNumber,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      whatsappConfirmation: {
        isConfirmed: false,
        customerPhone: orderData.customerPhone,
        sentMessageText: initialSentMsg,
        replyMessageText: '',
        messageTimestamp: timeStr,
        replyTimestamp: '',
        channel: 'WHATSAPP_BOT',
        needsHumanIntervention: false,
        conversation: [
          {
            id: `msg-${Date.now()}`,
            sender: 'STORE_BOT',
            text: initialSentMsg,
            timestamp: timeStr,
          }
        ]
      }
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

    // Trigger Baileys AI WhatsApp Bot for automatic confirmation from +212 668-381916
    if (typeof window !== 'undefined') {
      import('./baileysBotService').then(({ baileysBotService }) => {
        baileysBotService.handleNewOrder(newOrder);
      }).catch(err => console.warn('Baileys bot trigger notice:', err));
    }

    if (typeof window !== 'undefined') {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(err => console.warn('Backend createOrder notice:', err));
    }
    return newOrder;
  }

  deleteOrder(orderId: string, user: User) {
    const order = this.orders.find(o => o.id === orderId);
    const orderNum = order ? order.orderNumber : orderId;
    this.orders = this.orders.filter(o => o.id !== orderId);
    this.addAuditLog(user, 'DELETE', 'Order', orderId, `Suppression de la commande #${orderNum}`);
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      fetch(`/api/orders/${orderId}`, { method: 'DELETE' }).catch(err => console.warn('Backend deleteOrder notice:', err));
    }
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

  // --- Clean Database for Production Launch ---
  clearAllForProduction(user?: User) {
    this.orders = [];
    this.customers = [];
    this.inventoryMovements = [];
    this.reviews = [];
    const actingUser = user || this.users[0];
    this.auditLogs = [
      {
        id: "aud-launch-" + Date.now(),
        userId: actingUser.id,
        userName: `${actingUser.firstName} ${actingUser.lastName}`,
        userRole: actingUser.role,
        action: "UPDATE",
        entityName: "Database",
        entityId: "prod-db-clean",
        summary: "Base de données nettoyée avec succès pour la mise en ligne du site",
        ipAddress: "127.0.0.1",
        createdAt: new Date().toISOString()
      }
    ];
    this.saveToStorage();

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('shopme_orders');
        localStorage.removeItem('shopme_customers');
        localStorage.removeItem('shopme_inventory_movements');
        localStorage.removeItem('shopme_reviews');
        localStorage.removeItem('shopme_baileys_conversations');
        localStorage.removeItem('shopme_client_movements_v1');
        localStorage.removeItem('shopme_pixel_clicks_v1');
      } catch (e) {
        console.warn('Storage cleanup notice:', e);
      }
      fetch('/api/admin/clean-database', { method: 'POST' }).catch(() => {});
    }
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
