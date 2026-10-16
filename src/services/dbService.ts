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

// Initial Seed Data tailored for ShopMe (Produits Digitaux & Services)
const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat-hommes",
    name: "Collection Hommes",
    slug: "hommes",
    description: "Montres chronographes, accessoires de luxe, gadgets high-tech et maroquinerie",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
    displayOrder: 1,
    isActive: true,
    badge: "TENDANCE ⚡",
    subcategories: [
      {
        id: "subcat-h-montres",
        parentId: "cat-hommes",
        name: "Montres & Chronographes",
        slug: "montres-hommes",
        description: "Boîte simple ou avec coffret cadeau luxe",
        imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
        displayOrder: 1,
        isActive: true
      },
      {
        id: "subcat-h-hightech",
        parentId: "cat-hommes",
        name: "High-Tech & Gadgets Auto",
        slug: "hightech-hommes",
        description: "Chargeurs 5-en-1, accessoires connectés",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        displayOrder: 2,
        isActive: true
      },
      {
        id: "subcat-h-maro",
        parentId: "cat-hommes",
        name: "Maroquinerie & Ceintures",
        slug: "maroquinerie-hommes",
        description: "Ceintures cuir et portefeuilles anti-RFID",
        imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80",
        displayOrder: 3,
        isActive: true
      }
    ]
  },
  {
    id: "cat-femmes",
    name: "Collection Femmes",
    slug: "femmes",
    description: "Montres élégantes, sacs à main luxueux, porte-monnaie et accessoires",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
    displayOrder: 2,
    isActive: true,
    badge: "ÉLÉGANCE ✨",
    subcategories: [
      {
        id: "subcat-f-montres",
        parentId: "cat-femmes",
        name: "Montres & Coffrets Femmes",
        slug: "montres-femmes",
        description: "Boîte simple ou coffret cadeau luxe",
        imageUrl: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=600&q=80",
        displayOrder: 1,
        isActive: true
      },
      {
        id: "subcat-f-sacs",
        parentId: "cat-femmes",
        name: "Sacs à Main & Sacoches",
        slug: "sacs-femmes",
        description: "Sacs de ville et pochettes élégantes",
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
        displayOrder: 2,
        isActive: true
      },
      {
        id: "subcat-f-portemonnaie",
        parentId: "cat-femmes",
        name: "Porte-Monnaie & Accessoires",
        slug: "portemonnaie-femmes",
        description: "Porte-monnaie zippés et accessoires",
        imageUrl: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=600&q=80",
        displayOrder: 3,
        isActive: true
      }
    ]
  },
  {
    id: "cat-digital",
    name: "Produits Digitaux & Abonnements",
    slug: "produits-digitaux",
    description: "Abonnements IA & SVOD, clés de jeux, recharges in-game et licences logicielles",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    displayOrder: 3,
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
    displayOrder: 2,
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

const INITIAL_PRODUCTS: any[] = [
  {
    id: "prod-h-montre",
    name: "Montre Chronographe Quartz Homme - Édition Royale",
    slug: "montre-chronographe-homme-royale",
    brand: "ShopMe Luxury",
    sku: "W-MEN-ROYAL-01",
    categoryId: "cat-hommes",
    price: 299.00,
    compareAtPrice: 450.00,
    costPrice: 120.00,
    stock: 45,
    lowStockThreshold: 5,
    rating: 4.9,
    reviewsCount: 78,
    status: "PUBLISHED",
    images: [
      {
        id: "img-m1",
        productId: "prod-h-montre",
        imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
        isPrimary: true,
        displayOrder: 1
      },
      {
        id: "img-m2",
        productId: "prod-h-montre",
        imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
        isPrimary: false,
        displayOrder: 2
      }
    ],
    promotionalPacks: [
      {
        id: "pack-m1",
        productId: "prod-h-montre",
        quantity: 1,
        title: "1 Pièce (Boîte Simple)",
        packPrice: 299.00,
        unitPrice: 299.00,
        isPopular: false
      },
      {
        id: "pack-m2",
        productId: "prod-h-montre",
        quantity: 2,
        title: "Pack 2 Pièces (Économique - Livr. Gratuite)",
        packPrice: 499.00,
        unitPrice: 249.50,
        badgeText: "LE PLUS VENDU 🔥",
        isPopular: true
      },
      {
        id: "pack-m3",
        productId: "prod-h-montre",
        quantity: 3,
        title: "Pack 3 Pièces (Coffret Cadeau Luxe)",
        packPrice: 699.00,
        unitPrice: 233.00,
        badgeText: "MEILLEURE OFFRE ⭐",
        isPopular: false
      }
    ],
    variants: [
      {
        id: "var-m-cadran-noir",
        productId: "prod-h-montre",
        title: "Cadran Noir & Bracelet Argent",
        sku: "W-MEN-BK-SL",
        price: 299.00,
        stock: 25,
        imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "var-m-cadran-bleu",
        productId: "prod-h-montre",
        title: "Cadran Bleu Océan & Bracelet Acier",
        sku: "W-MEN-BL-SL",
        price: 299.00,
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"
      }
    ],
    productKind: "PHYSICAL",
    description: "Montre de haute précision avec mouvement chronographe à quartz, verre saphir inrayable et étanchéité 3 ATM. Livrée dans son écrin de protection avec garantie 1 an. Paiement cash à la livraison partout au Maroc après vérification du colis."
  },
  {
    id: "prod-h-chargeur",
    name: "Chargeur Voiture Rapide 5-en-1 Starlight LED",
    slug: "chargeur-voiture-5in1-starlight",
    brand: "ShopMe Tech",
    sku: "TECH-CAR-01",
    categoryId: "cat-hommes",
    price: 199.00,
    compareAtPrice: 299.00,
    costPrice: 65.00,
    stock: 60,
    lowStockThreshold: 10,
    rating: 4.8,
    reviewsCount: 124,
    status: "PUBLISHED",
    images: [
      {
        id: "img-c1",
        productId: "prod-h-chargeur",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        isPrimary: true,
        displayOrder: 1
      }
    ],
    promotionalPacks: [
      {
        id: "pack-c1",
        productId: "prod-h-chargeur",
        quantity: 1,
        title: "1 Pièce",
        packPrice: 199.00,
        unitPrice: 199.00,
        isPopular: false
      },
      {
        id: "pack-c2",
        productId: "prod-h-chargeur",
        quantity: 2,
        title: "Pack 2 Pièces (Livraison Gratuite)",
        packPrice: 349.00,
        unitPrice: 174.50,
        badgeText: "POPULAIRE 🔥",
        isPopular: true
      }
    ],
    productKind: "PHYSICAL",
    description: "Chargeur allume-cigare ultra rapide 5-en-1 avec double câble rétractable (Type-C et Lightning) et affichage LED du voltage en direct. Compatible avec toutes les voitures."
  },
  {
    id: "prod-f-montre",
    name: "Montre Femme Élégance Argentée avec Bracelet Assorti",
    slug: "montre-femme-elegance-argente",
    brand: "ShopMe Luxury",
    sku: "W-WOM-ELEG-01",
    categoryId: "cat-femmes",
    price: 279.00,
    compareAtPrice: 390.00,
    costPrice: 90.00,
    stock: 35,
    lowStockThreshold: 5,
    rating: 4.9,
    reviewsCount: 92,
    status: "PUBLISHED",
    images: [
      {
        id: "img-wf1",
        productId: "prod-f-montre",
        imageUrl: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80",
        isPrimary: true,
        displayOrder: 1
      }
    ],
    promotionalPacks: [
      {
        id: "pack-wf1",
        productId: "prod-f-montre",
        quantity: 1,
        title: "1 Pièce (Boîte Simple)",
        packPrice: 279.00,
        unitPrice: 279.00,
        isPopular: false
      },
      {
        id: "pack-wf2",
        productId: "prod-f-montre",
        quantity: 2,
        title: "Pack 2 Pièces (Avec Coffret Cadeau)",
        packPrice: 479.00,
        unitPrice: 239.50,
        badgeText: "COFFRET CADEAU ✨",
        isPopular: true
      }
    ],
    productKind: "PHYSICAL",
    description: "Montre féminine raffinée avec cadran nacre et bracelet maille milanaise argentée. Livrée dans son coffret bijou. Idéale pour sublimer vos tenues au quotidien."
  },
  {
    id: "prod-f-sac",
    name: "Sac à Main Cuir Luxueux Sacoche Ville & Soirée",
    slug: "sac-a-main-cuir-ville",
    brand: "ShopMe Bag",
    sku: "BAG-WOM-01",
    categoryId: "cat-femmes",
    price: 349.00,
    compareAtPrice: 490.00,
    costPrice: 130.00,
    stock: 28,
    lowStockThreshold: 4,
    rating: 4.9,
    reviewsCount: 64,
    status: "PUBLISHED",
    images: [
      {
        id: "img-bag1",
        productId: "prod-f-sac",
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
        isPrimary: true,
        displayOrder: 1
      }
    ],
    promotionalPacks: [
      {
        id: "pack-bag1",
        productId: "prod-f-sac",
        quantity: 1,
        title: "1 Pièce",
        packPrice: 349.00,
        unitPrice: 349.00,
        isPopular: true
      }
    ],
    productKind: "PHYSICAL",
    description: "Sac à main structuré en cuir synthétique de première qualité avec finitions dorées, double poignée et bandoulière amovible. Spacieux et chic."
  },
  {
    id: "prod-f-portemonnaie",
    name: "Porte-Monnaie Zippé Compact Tendance",
    slug: "porte-monnaie-zippe-compact",
    brand: "ShopMe Bag",
    sku: "WAL-WOM-01",
    categoryId: "cat-femmes",
    price: 149.00,
    compareAtPrice: 220.00,
    costPrice: 50.00,
    stock: 50,
    lowStockThreshold: 10,
    rating: 4.7,
    reviewsCount: 43,
    status: "PUBLISHED",
    images: [
      {
        id: "img-wal1",
        productId: "prod-f-portemonnaie",
        imageUrl: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80",
        isPrimary: true,
        displayOrder: 1
      }
    ],
    productKind: "PHYSICAL",
    description: "Porte-monnaie compact avec multiples compartiments pour cartes, billets et monnaie. Fermeture zippée fluide et sécurisée."
  },
  {
    id: "prod-dig-netflix",
    name: "Abonnement Netflix Premium 4K UHD (Compte Privé)",
    slug: "abonnement-netflix-premium-4k",
    brand: "Netflix Official",
    sku: "SUB-NETFLIX-01",
    categoryId: "cat-digital",
    price: 49.00,
    compareAtPrice: 75.00,
    costPrice: 20.00,
    stock: 999,
    lowStockThreshold: 50,
    rating: 5.0,
    reviewsCount: 310,
    status: "PUBLISHED",
    images: [
      {
        id: "img-net1",
        productId: "prod-dig-netflix",
        imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80",
        isPrimary: true,
        displayOrder: 1
      }
    ],
    productKind: "DIGITAL",
    digitalSpecs: {
      digitalType: "ACCOUNT",
      deliveryMethod: "AUTO_WHATSAPP",
      warrantyDays: 30,
      durationOptions: [
        { id: "dur-1m", label: "1 Mois", days: 30, price: 49.00, isDefault: true },
        { id: "dur-3m", label: "3 Mois", days: 90, price: 129.00 },
        { id: "dur-6m", label: "6 Mois", days: 180, price: 239.00 }
      ]
    },
    description: "Compte Netflix Premium 4K Ultra HD avec profil privé verrouillé par code PIN. Accès immédiat via WhatsApp avec garantie complète pendant toute la durée."
  },
  {
    id: "prod-dig-chatgpt",
    name: "Abonnement ChatGPT Plus GPT-4o & Canvas (Compte Privé)",
    slug: "abonnement-chatgpt-plus",
    brand: "OpenAI",
    sku: "SUB-CHATGPT-01",
    categoryId: "cat-digital",
    price: 99.00,
    compareAtPrice: 150.00,
    costPrice: 40.00,
    stock: 999,
    lowStockThreshold: 50,
    rating: 4.9,
    reviewsCount: 185,
    status: "PUBLISHED",
    images: [
      {
        id: "img-gpt1",
        productId: "prod-dig-chatgpt",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        isPrimary: true,
        displayOrder: 1
      }
    ],
    productKind: "DIGITAL",
    digitalSpecs: {
      digitalType: "ACCOUNT",
      deliveryMethod: "AUTO_WHATSAPP",
      warrantyDays: 30,
      durationOptions: [
        { id: "dur-gpt-1m", label: "1 Mois", days: 30, price: 99.00, isDefault: true }
      ]
    },
    description: "Compte ChatGPT Plus officiel avec accès illimité à GPT-4o, génération d'images DALL-E 3 et Canvas. Réception instantanée sur WhatsApp."
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
  metaPixelId: "1937322180765245",
  googleAnalyticsId: "G-9K8L7M6N5P",
  tiktokPixelId: "C1234567890ABCDEFGH",
  snapchatPixelId: "snap-pix-9821381"
};

// State Store Holder
class DatabaseStore {
  categories: Category[] = INITIAL_CATEGORIES;
  products: Product[] = [];
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

  private productListeners: Array<(products: Product[]) => void> = [];

  subscribeProducts(listener: (products: Product[]) => void): () => void {
    this.productListeners.push(listener);
    // Call immediately with current state
    try {
      listener([...this.products]);
    } catch (e) {
      console.warn('Initial product listener error:', e);
    }
    return () => {
      this.productListeners = this.productListeners.filter(l => l !== listener);
    };
  }

  notifyProductsChange() {
    this.productListeners.forEach(listener => {
      try {
        listener([...this.products]);
      } catch (err) {
        console.warn('Product listener error:', err);
      }
    });
  }

  // Persistence helpers
  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      this.syncFromBackend();
    }
  }

  // Helper to filter out any fake template products
  private isFakeProduct(p: any): boolean {
    if (!p) return true;
    const name = (p.name || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    const id = (p.id || '').toLowerCase();

    // Check for fake template products
    if (brand.includes('aura') || brand.includes('aura apparel') || brand.includes('aura oud')) return true;
    if (name.includes('parfum oud royal') || name.includes('tondeuse sans fil pro gold') || name.includes('montre chronographe automatique') || name.includes('t-shirt minimaliste coton bio') || name.includes('sac à main cuir')) return true;
    if (id === 'prod-oud-royal' || id === 'prod-barber-gold' || id === 'prod-watch-apex' || id === 'prod-tshirt-boxy') return true;

    return false;
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
        if (pData.success && Array.isArray(pData.products)) {
          const cleanProducts: Product[] = pData.products.filter((p: any) => !this.isFakeProduct(p));
          if (cleanProducts.length > 0) {
            this.products = cleanProducts;
            this.saveToStorage();
            this.notifyProductsChange();
          } else if (this.products.length > 0) {
            // Push valid local products added by user in admin panel to backend
            for (const p of this.products) {
              fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(p)
              }).catch(() => {});
            }
          } else {
            this.products = [];
            this.saveToStorage();
            this.notifyProductsChange();
          }
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
      if (typeof window === 'undefined') return;

      // 1. Instantly purge all legacy "aura_" template keys from user's browser
      try {
        localStorage.removeItem("aura_products");
        localStorage.removeItem("aura_categories");
        localStorage.removeItem("aura_orders");
        localStorage.removeItem("aura_reviews");
        localStorage.removeItem("aura_settings");
      } catch {}

      // 2. Load genuine products created by the user from shopme_products_v3
      const savedProducts = localStorage.getItem("shopme_products_v3");
      if (savedProducts) {
        try {
          const loaded: Product[] = JSON.parse(savedProducts);
          if (Array.isArray(loaded)) {
            this.products = loaded.filter(p => !this.isFakeProduct(p));
          } else {
            this.products = [];
          }
        } catch {
          this.products = [];
        }
      } else {
        this.products = [];
      }

      const savedCategories = localStorage.getItem("shopme_categories_v3");
      if (savedCategories) {
        try {
          this.categories = JSON.parse(savedCategories);
        } catch {}
      }

      const savedOrders = localStorage.getItem("shopme_orders_v3");
      if (savedOrders) {
        try {
          this.orders = JSON.parse(savedOrders);
        } catch {}
      }

      const savedReviews = localStorage.getItem("shopme_reviews_v3");
      if (savedReviews) {
        try {
          this.reviews = JSON.parse(savedReviews);
        } catch {}
      }

      const savedSettings = localStorage.getItem("shopme_settings_v3");
      if (savedSettings) {
        try {
          this.settings = JSON.parse(savedSettings);
        } catch {}
      }
    } catch {
      // Fallback
    }
  }

  public saveToStorage() {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem("shopme_products_v3", JSON.stringify(this.products));
      localStorage.setItem("shopme_categories_v3", JSON.stringify(this.categories));
      localStorage.setItem("shopme_orders_v3", JSON.stringify(this.orders));
      localStorage.setItem("shopme_reviews_v3", JSON.stringify(this.reviews));
      localStorage.setItem("shopme_settings_v3", JSON.stringify(this.settings));
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
    this.notifyProductsChange();
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
    this.notifyProductsChange();
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
