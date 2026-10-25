import { Product } from '../types/ecommerce';
import { dbService } from './dbService';
import { trackingService } from './trackingService';

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

export interface ClickPixelEvent {
  id: string;
  elementName: string;
  elementType: 'BUTTON' | 'PACK' | 'COLOR' | 'WHATSAPP' | 'CARD' | 'SHARE' | 'CTA';
  pageUrl: string;
  productSlug?: string;
  productName?: string;
  timestamp: string;
  coordinates?: { x: number; y: number };
  deviceType: 'mobile' | 'desktop';
  city: string;
}

type MovementListener = (sessions: ClientSessionMovement[]) => void;
type ClickListener = (clicks: ClickPixelEvent[]) => void;

class ClientMovementService {
  private sessions: ClientSessionMovement[] = [];
  private clicks: ClickPixelEvent[] = [];
  private currentSessionId: string;
  private listeners: Set<MovementListener> = new Set();
  private clickListeners: Set<ClickListener> = new Set();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

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

  public clearAllData() {
    this.sessions = [];
    this.clicks = [];
    try {
      localStorage.removeItem('shopme_client_movements_v1');
      localStorage.removeItem('shopme_pixel_clicks_v1');
    } catch {
      // ignore
    }
    this.notifyListeners();
    this.notifyClickListeners();
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
      const clickData = localStorage.getItem('shopme_pixel_clicks_v1');
      if (clickData) {
        this.clicks = JSON.parse(clickData);
      } else {
        this.clicks = [];
      }
    } catch {
      this.sessions = [];
      this.clicks = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('shopme_client_movements_v1', JSON.stringify(this.sessions.slice(0, 100)));
      localStorage.setItem('shopme_pixel_clicks_v1', JSON.stringify(this.clicks.slice(0, 150)));
      this.notifyListeners();
      this.notifyClickListeners();
    } catch (err) {
      console.warn('Storage save failed', err);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn([...this.sessions]));
  }

  private notifyClickListeners() {
    this.clickListeners.forEach(fn => fn([...this.clicks]));
  }

  public subscribe(listener: MovementListener): () => void {
    this.listeners.add(listener);
    listener([...this.sessions]);
    return () => this.listeners.delete(listener);
  }

  public subscribeClicks(listener: ClickListener): () => void {
    this.clickListeners.add(listener);
    listener([...this.clicks]);
    return () => this.clickListeners.delete(listener);
  }

  public getSessions(): ClientSessionMovement[] {
    return [...this.sessions];
  }

  public getClicks(): ClickPixelEvent[] {
    return [...this.clicks];
  }

  /**
   * Track high-precision click pixel event
   */
  public trackClick(
    elementName: string,
    elementType: ClickPixelEvent['elementType'],
    meta?: {
      productSlug?: string;
      productName?: string;
      city?: string;
      coordinates?: { x: number; y: number };
    }
  ) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const session = this.getOrCreateCurrentSession(meta?.city || 'Casablanca');
    const newClick: ClickPixelEvent = {
      id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      elementName,
      elementType,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/',
      productSlug: meta?.productSlug || session.productId,
      productName: meta?.productName || session.productName,
      timestamp: new Date().toISOString(),
      coordinates: meta?.coordinates,
      deviceType: isMobile ? 'mobile' : 'desktop',
      city: meta?.city || session.ipCity || 'Casablanca'
    };

    this.clicks.unshift(newClick);

    // Also register on current session timeline
    session.timeline.unshift({
      action: `Clic Pixel [${elementType}]`,
      details: `${elementName}${meta?.productName ? ` · ${meta.productName}` : ''}`,
      timestamp: new Date().toISOString()
    });

    this.saveToStorage();
  }

  /**
   * Get or initialize the active user session record
   */
  public getOrCreateCurrentSession(estimatedCity: string = 'Casablanca'): ClientSessionMovement {
    let session = this.sessions.find(s => s.sessionId === this.currentSessionId);
    if (!session) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      
      session = {
        id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        sessionId: this.currentSessionId,
        ipCity: estimatedCity,
        deviceType: isMobile ? 'mobile' : 'desktop',
        // Same source detection as the visitor analytics (UTM, click ids, referrer)
        referrerSource: trackingService.getTrafficSource().source,
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
    this.scheduleServerSync();

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
    this.syncToServer();
  }

  /** The shop owner's own browsing (admin, tests) is not sent */
  private isOwnerBrowser(): boolean {
    try {
      return window.location.pathname.includes('adminonly') || sessionStorage.getItem('aura_admin_auth') === 'true' || !!navigator.webdriver;
    } catch {
      return false;
    }
  }

  private scheduleServerSync() {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.syncToServer(), 1500);
  }

  /**
   * The order form being filled is sent to the server, so the admin sees every visitor's
   * abandoned form (localStorage only ever showed the admin's own browser)
   */
  private syncToServer() {
    if (this.syncTimer) { clearTimeout(this.syncTimer); this.syncTimer = null; }
    const session = this.sessions.find(s => s.sessionId === this.currentSessionId);
    if (!session || this.isOwnerBrowser()) return;
    const { fullName, phone } = session.capturedInputs;
    if (phone.replace(/\D/g, '').length < 6 && fullName.trim().length < 3) return;
    const body = JSON.stringify({ ...session, timeline: session.timeline.slice(0, 15) });
    try {
      if (session.status === 'PURCHASED' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/leads', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  /**
   * Mark lead as contacted by WhatsApp or Call
   */
  public markLeadContacted(sessionId: string, notes?: string) {
    fetch(`/api/leads/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isContacted: true, contactNotes: notes || 'Relancé par WhatsApp commercial' })
    }).catch(() => {});
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
  public convertLeadToConfirmedOrder(leadOrId: string | ClientSessionMovement): string | null {
    const lead = typeof leadOrId === 'string'
      ? this.sessions.find(s => s.id === leadOrId || s.sessionId === leadOrId)
      : leadOrId;
    if (!lead || !lead.productId) return null;

    const product = dbService.getProductById(lead.productId);
    if (!product) return null;

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
    fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PURCHASED', isContacted: true, contactNotes: lead.contactNotes })
    }).catch(() => {});
    return created.orderNumber;
  }

  /**
   * Generate customized WhatsApp recovery message link
   */
  public generateWhatsAppRecoveryLink(lead: ClientSessionMovement): string {
    const name = lead.capturedInputs.fullName ? `Salam ${lead.capturedInputs.fullName}` : 'Salam';
    const prodName = lead.productName || 'votre article';
    const price = lead.potentialRevenue || lead.productPrice || 'votre sélection';
    const pack = lead.selectedPack && lead.selectedPack > 1 ? ` (Pack ${lead.selectedPack} pièces)` : '';

    const text = `${name}, c'est l'équipe ShopMe Maroc ! 🇲🇦\n\nNous avons remarqué que vous étiez sur le point de commander : *${prodName}${pack}* à *${price} DH*.\n\nSouhaitez-vous que nous vous expédions votre colis dès aujourd'hui, avec *paiement en espèces à la livraison* (après vérification du colis) ?\n\nRépondez simplement *OUI* pour confirmer votre livraison ! 📦✨`;

    // Clean phone number (remove +212 or 0)
    let phone = lead.capturedInputs.phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '212' + phone.substring(1);
    } else if (!phone.startsWith('212')) {
      phone = '212' + phone;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
}

export const clientMovementService = new ClientMovementService();
