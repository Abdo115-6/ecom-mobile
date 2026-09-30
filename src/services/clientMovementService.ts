import { Product } from '../types/ecommerce';
import { dbService } from './dbService';

export type ClientMovementStatus = 
  | 'ABANDONED_INPUT'   // Prospect typed phone/name but DID NOT BUY (Lost Hot Lead!)
  | 'PURCHASED'          // Bought successfully
  | 'PRODUCT_VIEWED'     // Browsed product, hesitated, didn't type inputs
  | 'CART_ABANDONED'     // Added to cart but left before checkout
  | 'BROWSING';          // Just viewing home or category

export interface CapturedInputs {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  selectedPack?: number;
  selectedVariantTitle?: string;
  lastInputAt: string;
  completedFieldsCount: number;
}

export interface ClientSessionMovement {
  id: string;
  sessionId: string;
  ipCity: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  referrerSource: string;
  firstSeenAt: string;
  lastActiveAt: string;
  status: ClientMovementStatus;
  
  // Product intent
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  categoryName?: string;
  selectedPack?: number;
  potentialRevenue: number;

  // Real-time captured form keystrokes
  capturedInputs: CapturedInputs;

  // Timeline of micro-actions
  timeline: Array<{
    action: string;
    details?: string;
    timestamp: string;
  }>;

  // Recovery tracking
  isContacted?: boolean;
  contactNotes?: string;
}

type MovementListener = (sessions: ClientSessionMovement[]) => void;

class ClientMovementService {
  private sessions: ClientSessionMovement[] = [];
  private currentSessionId: string;
  private listeners: Set<MovementListener> = new Set();

  constructor() {
    this.currentSessionId = this.initCurrentSession();
    this.loadFromStorage();
  }

  public clearAllSessions() {
    this.sessions = [];
    try {
      localStorage.removeItem('shopme_client_movements_v1');
    } catch {
      // ignore
    }
    this.notifyListeners();
  }

  private initCurrentSession(): string {
    try {
      let s = sessionStorage.getItem('shopme_client_session_id');
      if (!s) {
        s = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        sessionStorage.setItem('shopme_client_session_id', s);
      }
      return s;
    } catch {
      return 'sess_' + Math.random().toString(36).substring(2, 9);
    }
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem('shopme_client_movements_v1');
      if (data) {
        this.sessions = JSON.parse(data);
      }
    } catch {
      this.sessions = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('shopme_client_movements_v1', JSON.stringify(this.sessions.slice(0, 100)));
      this.notifyListeners();
    } catch (err) {
      console.warn('Storage save failed', err);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn([...this.sessions]));
  }

  public subscribe(listener: MovementListener): () => void {
    this.listeners.add(listener);
    listener([...this.sessions]);
    return () => this.listeners.delete(listener);
  }

  public getSessions(): ClientSessionMovement[] {
    return [...this.sessions];
  }

  /**
   * Get or initialize the active user session record
   */
  public getOrCreateCurrentSession(estimatedCity: string = 'Casablanca'): ClientSessionMovement {
    let session = this.sessions.find(s => s.sessionId === this.currentSessionId);
    if (!session) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const ref = typeof document !== 'undefined' ? (document.referrer || 'TikTok Ads (Campagne Maroc)') : 'Direct Ads';
      
      session = {
        id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        sessionId: this.currentSessionId,
        ipCity: estimatedCity,
        deviceType: isMobile ? 'mobile' : 'desktop',
        referrerSource: ref.includes('tiktok') ? 'TikTok Ads' : ref.includes('facebook') || ref.includes('instagram') ? 'Meta Ads' : 'Accès Direct',
        firstSeenAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'BROWSING',
        potentialRevenue: 0,
        capturedInputs: {
          fullName: '',
          phone: '',
          city: estimatedCity,
          address: '',
          lastInputAt: new Date().toISOString(),
          completedFieldsCount: 0
        },
        timeline: [
          { action: 'Visite boutique', details: 'Arrivée sur ShopMe Maroc', timestamp: new Date().toISOString() }
        ]
      };
      this.sessions.unshift(session);
      this.saveToStorage();
    }
    return session;
  }

  /**
   * Track client viewing a product
   */
  public trackProductView(product: Product, pack: number = 1, variantTitle?: string) {
    const session = this.getOrCreateCurrentSession();
    session.lastActiveAt = new Date().toISOString();
    session.productId = product.id;
    session.productName = product.name;
    session.productPrice = product.price;
    session.productImage = product.images[0]?.imageUrl;
    session.categoryName = product.categoryName;
    session.selectedPack = pack;
    session.potentialRevenue = product.price * pack;

    if (session.status !== 'PURCHASED' && session.status !== 'ABANDONED_INPUT') {
      session.status = 'PRODUCT_VIEWED';
    }

    session.timeline.unshift({
      action: 'Consultation Produit',
      details: `${product.name} (Pack ${pack}) - ${product.price} DH`,
      timestamp: new Date().toISOString()
    });

    this.saveToStorage();
  }

  /**
   * Real-time live capture of keystrokes as visitor types in COD order form
   */
  public captureFormInput(payload: {
    fullName?: string;
    phone?: string;
    city?: string;
    address?: string;
    pack?: number;
    variantTitle?: string;
    product?: Product;
  }) {
    const session = this.getOrCreateCurrentSession(payload.city || 'Casablanca');
    session.lastActiveAt = new Date().toISOString();

    if (payload.product) {
      session.productId = payload.product.id;
      session.productName = payload.product.name;
      session.productPrice = payload.product.price;
      session.productImage = payload.product.images[0]?.imageUrl;
      session.categoryName = payload.product.categoryName;
    }

    if (payload.pack) {
      session.selectedPack = payload.pack;
      const basePrice = session.productPrice || payload.product?.price || 350;
      session.potentialRevenue = payload.pack === 2 ? Math.round(basePrice * 2 * 0.8) : payload.pack === 3 ? basePrice * 2 : basePrice;
    }

    // Update fields
    if (payload.fullName !== undefined) session.capturedInputs.fullName = payload.fullName;
    if (payload.phone !== undefined) session.capturedInputs.phone = payload.phone;
    if (payload.city !== undefined) {
      session.capturedInputs.city = payload.city;
      session.ipCity = payload.city;
    }
    if (payload.address !== undefined) session.capturedInputs.address = payload.address;
    if (payload.variantTitle !== undefined) session.capturedInputs.selectedVariantTitle = payload.variantTitle;

    session.capturedInputs.lastInputAt = new Date().toISOString();

    // Count completed fields
    let count = 0;
    if (session.capturedInputs.fullName.trim().length > 2) count++;
    if (session.capturedInputs.phone.trim().length >= 8) count++;
    if (session.capturedInputs.city.trim().length > 1) count++;
    if (session.capturedInputs.address.trim().length > 3) count++;
    session.capturedInputs.completedFieldsCount = count;

    // Determine status: If phone or name entered but not purchased, flag as ABANDONED_INPUT
    if (session.status !== 'PURCHASED') {
      if (session.capturedInputs.phone.trim().length >= 6 || session.capturedInputs.fullName.trim().length >= 3) {
        session.status = 'ABANDONED_INPUT';
        
        // Log to timeline once
        const lastAction = session.timeline[0]?.action;
        if (lastAction !== 'Saisie Coordonnées COD') {
          session.timeline.unshift({
            action: 'Saisie Coordonnées COD',
            details: `Nom: "${session.capturedInputs.fullName || '...'}", Tél: "${session.capturedInputs.phone || '...'}" (${session.capturedInputs.city})`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    this.saveToStorage();
  }

  /**
   * Mark session as PURCHASED when client clicks order confirmation
   */
  public markAsPurchased(orderNumber: string, totalAmount: number) {
    const session = this.getOrCreateCurrentSession();
    session.status = 'PURCHASED';
    session.lastActiveAt = new Date().toISOString();
    session.potentialRevenue = totalAmount;
    session.timeline.unshift({
      action: 'Achat Confirmé 🎉',
      details: `Commande validée n° ${orderNumber} - Montant: ${totalAmount} DH`,
      timestamp: new Date().toISOString()
    });

    this.saveToStorage();
  }

  /**
   * Mark lead as contacted by WhatsApp or Call
   */
  public markLeadContacted(sessionId: string, notes?: string) {
    const s = this.sessions.find(x => x.sessionId === sessionId || x.id === sessionId);
    if (s) {
      s.isContacted = true;
      s.contactNotes = notes || 'Relancé par WhatsApp commercial';
      s.timeline.unshift({
        action: 'Relance Commerciale',
        details: s.contactNotes,
        timestamp: new Date().toISOString()
      });
      this.saveToStorage();
    }
  }

  /**
   * 1-Click Convert Abandoned Lead into a Real Confirmed Order in DB!
   */
  public convertLeadToConfirmedOrder(leadId: string): boolean {
    const lead = this.sessions.find(s => s.id === leadId || s.sessionId === leadId);
    if (!lead || !lead.productId) return false;

    const product = dbService.getProductById(lead.productId);
    if (!product) return false;

    const pack = lead.selectedPack || 1;
    const finalAmount = lead.potentialRevenue || product.price;

    const created = dbService.createOrder({
      customerId: "cust-recovered-" + Date.now(),
      customerName: lead.capturedInputs.fullName || 'Client Récupéré ShopMe',
      customerEmail: `${(lead.capturedInputs.phone || 'client').replace(/[^0-9]/g, '')}@client-shopme.ma`,
      customerPhone: lead.capturedInputs.phone || '0600000000',
      status: 'PROCESSING',
      currency: 'MAD',
      subtotal: finalAmount,
      discountAmount: 0,
      shippingFee: 0,
      taxAmount: 0,
      totalAmount: finalAmount,
      shippingAddress: {
        fullName: lead.capturedInputs.fullName || 'Client ShopMe',
        phone: lead.capturedInputs.phone || '0600000000',
        street: lead.capturedInputs.address || 'Adresse confirmée par téléphone',
        city: lead.capturedInputs.city || lead.ipCity || 'Casablanca',
        country: 'Maroc'
      },
      paymentMethod: 'CASH_ON_DELIVERY',
      paymentStatus: 'PENDING',
      shipment: {
        carrier: 'ShopMe Express Maroc',
        trackingNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'Commande Récupérée · En préparation'
      },
      items: [
        {
          id: "item-" + Date.now(),
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          variantTitle: `Pack ${pack} pcs (Récupération Lead)`,
          unitPrice: finalAmount / pack,
          quantity: pack,
          subtotal: finalAmount,
          imageUrl: product.images[0]?.imageUrl || ''
        }
      ],
      utmSource: lead.referrerSource,
      utmCampaign: 'lead_mining_recovery',
      notes: `Commande récupérée via Data Mining ShopMe. Client avait saisi son numéro sans valider.`
    });

    lead.status = 'PURCHASED';
    lead.isContacted = true;
    lead.contactNotes = `Converti avec succès en commande ${created.orderNumber}`;
    lead.timeline.unshift({
      action: 'Conversion en Commande',
      details: `Commande officielle ${created.orderNumber} créée`,
      timestamp: new Date().toISOString()
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Generate customized WhatsApp recovery message link
   */
  public generateWhatsAppRecoveryLink(lead: ClientSessionMovement): string {
    const name = lead.capturedInputs.fullName ? `Salam ${lead.capturedInputs.fullName}` : 'Salam';
    const prodName = lead.productName || 'votre article';
    const price = lead.potentialRevenue || lead.productPrice || 'votre sélection';
    const pack = lead.selectedPack && lead.selectedPack > 1 ? ` (Pack ${lead.selectedPack} pièces)` : '';

    const text = `${name}, c'est l'équipe ShopMe Maroc ! 🇲🇦\n\nNous avons remarqué que vous étiez sur le point de commander : *${prodName}${pack}* à *${price} DH*.\n\nSouhaitez-vous que nous vous expédions votre colis dès aujourd'hui avec *Livraison Gratuite* et *Paiement en espèces à la livraison* (après vérification du colis) ?\n\nRépondez simplement *OUI* pour confirmer votre livraison ! 📦✨`;

    // Clean phone number (remove +212 or 0)
    let phone = lead.capturedInputs.phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '212' + phone.substring(1);
    } else if (!phone.startsWith('212')) {
      phone = '212' + phone;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Seed realistic Moroccan leads for instant data mining visualization
   */
  private seedRealisticMoroccanLeads() {
    const now = Date.now();
    const min = 60 * 1000;

    const sampleLeads: ClientSessionMovement[] = [
      {
        id: 'lead-1',
        sessionId: 'sess_sample_1',
        ipCity: 'Casablanca',
        deviceType: 'mobile',
        referrerSource: 'TikTok Ads (Campagne Oud Royal)',
        firstSeenAt: new Date(now - 14 * min).toISOString(),
        lastActiveAt: new Date(now - 8 * min).toISOString(),
        status: 'ABANDONED_INPUT',
        productId: 'prod-oud-royal',
        productName: 'Parfum Oud Royal Noir 100ml Homme',
        productPrice: 449,
        productImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80',
        categoryName: 'Parfumerie & Oud Royal',
        selectedPack: 2,
        potentialRevenue: 749, // Pack 2 (-20%)
        capturedInputs: {
          fullName: 'Mohamed Tazi',
          phone: '0661458920',
          city: 'Casablanca',
          address: 'Quartier Racine, Rue Ahmed Charci',
          selectedPack: 2,
          selectedVariantTitle: 'Flacon 100ml Intense',
          lastInputAt: new Date(now - 8 * min).toISOString(),
          completedFieldsCount: 4
        },
        timeline: [
          { action: 'Clic Pub TikTok', details: 'Campagne Parfum Oud Royal Homme', timestamp: new Date(now - 14 * min).toISOString() },
          { action: 'Consultation Fiche', details: 'A passé 3m 45s sur les photos et avis', timestamp: new Date(now - 12 * min).toISOString() },
          { action: 'Choix Pack 2', details: 'A sélectionné le Pack 2 (-20% 749 DH)', timestamp: new Date(now - 10 * min).toISOString() },
          { action: 'Saisie Coordonnées COD', details: 'A tapé Nom, Tél (0661458920) et Adresse mais a quitté sans cliquer', timestamp: new Date(now - 8 * min).toISOString() }
        ],
        isContacted: false
      },
      {
        id: 'lead-2',
        sessionId: 'sess_sample_2',
        ipCity: 'Rabat',
        deviceType: 'mobile',
        referrerSource: 'Meta Ads (Instagram Stories)',
        firstSeenAt: new Date(now - 28 * min).toISOString(),
        lastActiveAt: new Date(now - 19 * min).toISOString(),
        status: 'ABANDONED_INPUT',
        productId: 'prod-hair-styler',
        productName: 'Brosse Coiffante Ionique 5-en-1 Multifonction',
        productPrice: 389,
        productImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
        categoryName: 'Coiffure & Soins Ioniques',
        selectedPack: 1,
        potentialRevenue: 389,
        capturedInputs: {
          fullName: 'Salma El Amrani',
          phone: '0672114488',
          city: 'Rabat',
          address: 'Agdal, Avenue Fal Ould Oumeir',
          selectedPack: 1,
          selectedVariantTitle: 'Rose Gold Prestige',
          lastInputAt: new Date(now - 19 * min).toISOString(),
          completedFieldsCount: 3
        },
        timeline: [
          { action: 'Clic Instagram Ad', details: 'Video Reel Démonstration 5-en-1', timestamp: new Date(now - 28 * min).toISOString() },
          { action: 'Consultation Produit', details: 'A lu les 115 avis vérifiés', timestamp: new Date(now - 24 * min).toISOString() },
          { action: 'Saisie Coordonnées COD', details: 'A tapé Salma El Amrani, 0672114488', timestamp: new Date(now - 19 * min).toISOString() }
        ],
        isContacted: false
      },
      {
        id: 'lead-3',
        sessionId: 'sess_sample_3',
        ipCity: 'Marrakech',
        deviceType: 'mobile',
        referrerSource: 'Snapchat Ads',
        firstSeenAt: new Date(now - 45 * min).toISOString(),
        lastActiveAt: new Date(now - 38 * min).toISOString(),
        status: 'ABANDONED_INPUT',
        productId: 'prod-pro-trimmer',
        productName: 'Tondeuse Sans Fil Pro Gold Métal Barbe & Cheveux',
        productPrice: 279,
        productImage: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80',
        categoryName: 'Tondeuses & Soins Barbier',
        selectedPack: 1,
        potentialRevenue: 279,
        capturedInputs: {
          fullName: 'Yassine B.',
          phone: '0700567890',
          city: 'Marrakech',
          address: 'Gueliz',
          selectedPack: 1,
          lastInputAt: new Date(now - 38 * min).toISOString(),
          completedFieldsCount: 3
        },
        timeline: [
          { action: 'Clic Snapchat Ad', details: 'Snap Story Barbier Pro', timestamp: new Date(now - 45 * min).toISOString() },
          { action: 'Saisie Coordonnées COD', details: 'Numéro 0700567890 renseigné', timestamp: new Date(now - 38 * min).toISOString() }
        ],
        isContacted: false
      },
      {
        id: 'lead-4',
        sessionId: 'sess_sample_4',
        ipCity: 'Tanger',
        deviceType: 'desktop',
        referrerSource: 'Google Search Ads',
        firstSeenAt: new Date(now - 62 * min).toISOString(),
        lastActiveAt: new Date(now - 55 * min).toISOString(),
        status: 'ABANDONED_INPUT',
        productId: 'prod-4',
        productName: 'Montre Chronographe Automatique Apex 41mm',
        productPrice: 1290,
        productImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=400&q=80',
        categoryName: 'Montres & Horlogerie Homme',
        selectedPack: 1,
        potentialRevenue: 1290,
        capturedInputs: {
          fullName: 'Anass Bennani',
          phone: '0663889900',
          city: 'Tanger',
          address: 'Malabata',
          selectedPack: 1,
          lastInputAt: new Date(now - 55 * min).toISOString(),
          completedFieldsCount: 3
        },
        timeline: [
          { action: 'Recherche Google', details: 'Mots clés: "montre automatique saphir maroc"', timestamp: new Date(now - 62 * min).toISOString() },
          { action: 'Saisie Coordonnées COD', details: 'Nom et téléphone saisis sans confirmation', timestamp: new Date(now - 55 * min).toISOString() }
        ],
        isContacted: true,
        contactNotes: 'Client contacté par WhatsApp : hésite sur la couleur du cadran.'
      },
      {
        id: 'lead-5',
        sessionId: 'sess_sample_5',
        ipCity: 'Fès',
        deviceType: 'mobile',
        referrerSource: 'TikTok Ads',
        firstSeenAt: new Date(now - 5 * min).toISOString(),
        lastActiveAt: new Date(now - 1 * min).toISOString(),
        status: 'PRODUCT_VIEWED',
        productId: 'prod-rose-musc',
        productName: 'Coffret Royal Musc Blanc & Rose Damascena 100ml Femme',
        productPrice: 399,
        productImage: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=400&q=80',
        categoryName: 'Parfumerie & Oud Royal',
        selectedPack: 2,
        potentialRevenue: 649,
        capturedInputs: {
          fullName: '',
          phone: '',
          city: 'Fès',
          address: '',
          lastInputAt: new Date(now - 1 * min).toISOString(),
          completedFieldsCount: 0
        },
        timeline: [
          { action: 'Clic Pub TikTok', details: 'Campagne Musc & Rose Damas', timestamp: new Date(now - 5 * min).toISOString() },
          { action: 'Consultation Fiche', details: 'En train de regarder les photos (en direct)', timestamp: new Date(now - 1 * min).toISOString() }
        ]
      }
    ];

    this.sessions = sampleLeads;
    this.saveToStorage();
  }
}

export const clientMovementService = new ClientMovementService();
