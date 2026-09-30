export interface SpecDocument {
  id: string;
  number: number;
  title: string;
  category: string;
  summary: string;
  content: string;
}

export const ARCHITECTURE_SPECS: SpecDocument[] = [
  {
    id: "architecture",
    number: 1,
    title: "1. Architecture Complète du Projet",
    category: "Architecture & Infrastructure",
    summary: "Schéma global, séparation Storefront / Spring API / PostgreSQL / Redis / Event Bus / BigQuery.",
    content: `## Architecture Globale & Découpage Système

La plateforme est conçue selon une architecture modulaire scalable :
- **Mobile Storefront (Next.js / React 19)** : Interface ultra-optimisée mobile (PWA, sticky headers, touch-targets 44px+, navigation one-thumb).
- **Backend API (Spring Boot 3 / Java 21)** : API REST sécurisée par Spring Security et JWT, validation DTO, gestion des transactions ACID.
- **Base Relationnelle (PostgreSQL 16)** : Single source of truth pour le catalogue, les commandes, les mouvements de stock et l'audit trail.
- **Cache & Sessions (Redis 7)** : Caching des paniers anonymes, limitation de débit (rate limiting) et sessions temporaires.
- **Object Storage (MinIO / S3)** : Stockage et CDN pour les images WebP/AVIF.
- **Unified Event Pipeline** : Collecte des événements (browser + server) avec deduplication basée sur event_id.
- **Data Warehouse (BigQuery)** : Pipeline de données pour analytics avancés, data mining RFM et machine learning.`
  },
  {
    id: "database_erd",
    number: 2,
    title: "2. Schéma de Base de Données & ERD",
    category: "Base de Données",
    summary: "24+ tables PostgreSQL : users, roles, permissions, customers, products, variants, inventory, movements, orders, reviews, events, etc.",
    content: `## Schéma Relationnel PostgreSQL

Tables principales implémentées avec contraintes, clés étrangères et index :
1. **users, roles, permissions, user_roles, role_permissions** : Authentification et RBAC.
2. **customers, addresses** : Profils clients, adresses de livraison/facturation et scores RFM.
3. **categories, products, product_variants, product_images** : Catalogue multi-niveaux, variantes (taille, couleur, SKU, code-barres), galeries réordonnables.
4. **inventory, inventory_movements** : Suivi des stocks (disponible, réservé, vendu, seuil bas) et historique immuable des mouvements (IN, OUT, ADJUSTMENT, RETURN, RESERVATION, RELEASE).
5. **carts, cart_items** : Gestion des paniers connectés et anonymes avec fusion lors du login.
6. **orders, order_items, payments, shipments** : Cycle de vie des commandes (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED) et passerelles de paiement.
7. **coupons, promotions** : Moteur de réductions (pourcentage, montant fixe, livraison gratuite, panier minimum).
8. **reviews, review_replies, wishlists, wishlist_items** : Avis avec statut de modération (PENDING, APPROVED, REJECTED) et listes d'envies.
9. **banners, homepage_sections** : CMS pour la gestion modulaire de la page d'accueil sans toucher au code.
10. **sessions, marketing_attribution, events** : Tracking multi-canal avec attribution UTM et dispatch vers CAPI / BigQuery.
11. **audit_logs, settings** : Traçabilité des actions administratives et configuration du store.`
  },
  {
    id: "api_spec",
    number: 3,
    title: "3. Spécification de l'API REST",
    category: "Backend & Contrat API",
    summary: "Endpoints REST pour le storefront public, le panier, la commande et le Back Office avec sécurité RBAC.",
    content: `## Endpoints REST Spring Boot

- **Authentification** : \`POST /api/v1/auth/login\`, \`POST /api/v1/auth/register\`, \`GET /api/v1/auth/me\`
- **Catalogue Public** : \`GET /api/v1/products\`, \`GET /api/v1/products/{slug}\`, \`GET /api/v1/categories\`
- **Panier & Checkout** : \`GET /api/v1/cart\`, \`POST /api/v1/cart/items\`, \`POST /api/v1/cart/apply-coupon\`, \`POST /api/v1/orders\`
- **Tracking & Avis** : \`POST /api/v1/events\`, \`POST /api/v1/products/{id}/reviews\`
- **Back Office Admin (RBAC)** :
  - \`/api/v1/admin/products\` (CRUD + upload WebP)
  - \`/api/v1/admin/inventory/adjust\` (Mouvement de stock tracé)
  - \`/api/v1/admin/orders\` (Workflow statuts, export CSV)
  - \`/api/v1/admin/reviews\` (Modération, réponses officielles)
  - \`/api/v1/admin/coupons\` (Gestion des codes promo)
  - \`/api/v1/admin/analytics\` (KPIs, RFM, recommandations)`
  },
  {
    id: "routes",
    number: 4,
    title: "4. Structure des Routes Frontend & Admin",
    category: "Frontend & Navigation",
    summary: "Cartographie complète des routes client mobile-first et du Back Office de gestion.",
    content: `## Navigation Storefront & Back Office

- **Storefront Client** :
  - \`/\` : Accueil dynamique (Bannières, Catégories phares, Best sellers, Flash Sale)
  - \`/catalog\` : Recherche et filtres à facettes (catégories, marques, prix, tri)
  - \`/products/:slug\` : Fiche produit (galerie, sélection variantes, avis, WhatsApp)
  - \`/cart\` : Tiroir et page panier avec vérification de stock temps réel
  - \`/checkout\` : Processus de commande fluide en 4 étapes
  - \`/track-order\` : Suivi de livraison en temps réel
  - \`/account\` : Espace client, historique commandes et favoris
- **Back Office Admin** :
  - \`/admin\` : Dashboard exécutif (KPIs, graphiques des ventes, entonnoir)
  - \`/admin/catalog/products\` : Gestion du catalogue
  - \`/admin/catalog/inventory\` : Suivi des stocks et grand livre des mouvements
  - \`/admin/orders\` : Traitement des commandes
  - \`/admin/reviews\` : Modération des avis clients
  - \`/admin/marketing/coupons\` & \`/banners\` : Promotions et CMS
  - \`/admin/tracking/inspector\` : Flux live des événements marketing & déduplication
  - \`/admin/analytics/data-mining\` : Analyse RFM et règles d'association de produits
  - \`/admin/whatsapp\` : Configuration et modèles de messages WhatsApp
  - \`/admin/users\` & \`/admin/audit-logs\` : Gestion des rôles RBAC et historique des audits`
  },
  {
    id: "auth_rbac",
    number: 5,
    title: "5. Sécurité, JWT & Matrice RBAC",
    category: "Sécurité & Contrôle d'Accès",
    summary: "Tokens JWT stateless, rotation de refresh tokens, Spring Security et rôles stricts.",
    content: `## Contrôle d'Accès Basé sur les Rôles (RBAC)

Rôles prévus :
- **SUPER_ADMIN** : Accès total absolu, gestion des utilisateurs admin et paramètres globaux.
- **ADMIN** : Gestion complète du magasin sans accès à la suppression de super administrateurs.
- **MANAGER** : Supervision opérationnelle (produits, stocks, commandes, coupons).
- **PRODUCT_MANAGER** : CRUD catalogue et mise à jour des fiches techniques.
- **ORDER_MANAGER** : Traitement des commandes, expéditions et ajustement de stock.
- **MARKETING_MANAGER** : Gestion des coupons, bannières, campagnes et analytics.
- **SUPPORT** : Consultation des commandes et réponses officielles aux avis.
- **ANALYST** : Accès lecture aux données d'analytics et d'attribution (sans données bancaires).`
  },
  {
    id: "event_tracking",
    number: 6,
    title: "6. Spécification Tracking Événements & Déduplication",
    category: "Marketing & Tracking",
    summary: "Architecture unifiée, event_id dédupliqué, GA4, Meta CAPI, TikTok, Snapchat et persistance UTM.",
    content: `## Pipeline d'Événements Marketing Centralisé

Tous les événements majeurs (page_view, view_item, add_to_cart, begin_checkout, purchase, whatsapp_click) génèrent :
- Un \`event_id\` déterministe unique (ex: \`evt_01H9A...\`).
- La persistance des paramètres d'attribution UTM (\`utm_source\`, \`utm_medium\`, \`utm_campaign\`, \`fbclid\`, \`ttclid\`, \`gclid\`).
- Un double dispatching sécurisé :
  1. Côté Navigateur (GTM/GA4, Meta Pixel, TikTok Pixel, Snap Pixel)
  2. Côté Serveur (Meta Conversions API, TikTok Events API, Snap CAPI)
- Les plateformes publicitaires dédupliquent automatiquement les événements grâce à l'\`event_id\` partagé, garantissant 0 double-comptage et 100% de résilience face aux bloqueurs de pub.`
  },
  {
    id: "env_variables",
    number: 7,
    title: "7. Spécification des Variables d'Environnement",
    category: "Configuration & Déploiement",
    summary: "Template .env pour PostgreSQL, Redis, JWT, Object Storage, Meta CAPI, TikTok, Snap, WhatsApp et GA4.",
    content: `## Matrice des Variables d'Environnement

Le fichier \`.env.example\` centralise :
- Identifiants de connexion PostgreSQL et pool de connexions
- URL et mot de passe Redis
- Clé secrète de signature JWT (HMAC-SHA256)
- Tokens d'accès et IDs de pixel pour Meta (Facebook CAPI), TikTok Events API, Snapchat CAPI
- Google Measurement ID (GA4) et Google Ads Conversion IDs
- WhatsApp Cloud API Token, Phone Number ID et numéro de support
- Identifiants Object Storage (MinIO / AWS S3)`
  },
  {
    id: "docker",
    number: 8,
    title: "8. Configuration Docker & Conteneurisation",
    category: "DevOps & Docker",
    summary: "Fichier docker-compose.yml multi-services : Nginx, Frontend, Spring Boot, PostgreSQL, Redis, MinIO.",
    content: `## Déploiement Conteneurisé avec docker-compose

Services orchestrés :
- \`nginx\` : Passerelle reverse-proxy HTTPS et terminaison SSL
- \`frontend\` : Application Web Next.js/React conteneurisée sur le port 3000
- \`backend\` : API Java 21 / Spring Boot 3 conteneurisée sur le port 8080
- \`postgres\` : Base de données PostgreSQL 16 avec volumes persistants et scripts de migration
- \`redis\` : Cache en mémoire et sessions avec persistance AOF
- \`minio\` : Stockage d'objets compatible S3 pour les médias et images produits`
  },
  {
    id: "roadmap",
    number: 9,
    title: "9. Feuille de Route de Développement (11 Phases)",
    category: "Méthodologie & Phases",
    summary: "Planning incrémental en 11 phases : de la fondation au Data Mining et au SEO.",
    content: `## Les 11 Phases de Réalisation

- **Phase 1** : Architecture, schéma PostgreSQL, Docker et spécifications de sécurité
- **Phase 2** : Catalogue de produits, arborescence des catégories, recherche et panier
- **Phase 3** : Tunnel de commande mobile-first, calcul des taxes et suivi de commande
- **Phase 4** : Back Office avec RBAC, CRUD catalogue et grand livre des stocks
- **Phase 5** : Système de codes promo, CMS page d'accueil et modération des avis
- **Phase 6** : Bus d'événements unifié, persistance UTM et intégration GA4/GTM
- **Phase 7** : Meta Conversions API (CAPI), TikTok Events API, Snap CAPI et déduplication
- **Phase 8** : Intégration WhatsApp Business (boutons produits, notifications automatiques)
- **Phase 9** : Pipeline Data Warehouse BigQuery et tableaux de bord analytiques
- **Phase 10** : Data Mining (Scoring RFM 1-5, segmentation comportementale et recommandations produits)
- **Phase 11** : Optimisations PWA, OpenGraph, Schema.org, i18n (FR, AR RTL, EN) et devises (MAD, EUR, USD)`
  },
  {
    id: "data_mining",
    number: 10,
    title: "10. Data Mining, RFM & Moteur de Recommandations",
    category: "Data Science & BI",
    summary: "Calcul algorithmique RFM, segmentation comportementale et règles d'association panier.",
    content: `## Algorithmes de Data Mining Intégrés

1. **Scoring RFM (Récence, Fréquence, Montant)** :
   - Récence (R 1-5) : Délai en jours depuis le dernier achat
   - Fréquence (F 1-5) : Nombre total de commandes confirmées
   - Montant (M 1-5) : Valeur financière cumulée dépensée
   - Matrice de segmentation : Champions, Clients Fidèles, Nouveaux Prometteurs, Clients à Risque, Inactifs.

2. **Règles d'Association Panier (Market Basket Analysis)** :
   - Calcul des paires de produits fréquemment achetés ensemble
   - Génération dynamique des blocs "Souvent achetés ensemble" et "Vous pourriez aussi aimer"
   - Analyse des abandons de panier par étape du tunnel de conversion.`
  }
];
