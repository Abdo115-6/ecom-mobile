import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { 
  Product, 
  ProductVariant, 
  ProductImage, 
  ProductStatus, 
  TechnicalSpecs, 
  PromoPack,
  ProductKind,
  DigitalType,
  SharingMethod,
  DurationOption,
  TopUpDenomination,
  DigitalSpecs,
  ServiceSpecs
} from '../../types/ecommerce';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Layers, 
  Laptop, 
  Star, 
  Link as LinkIcon, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  Tag, 
  Clock, 
  Box, 
  Share2, 
  Copy, 
  ExternalLink, 
  MessageCircle, 
  Percent, 
  Palette, 
  PackagePlus, 
  AlertCircle, 
  Film, 
  Play, 
  Eye, 
  Smartphone, 
  FileText, 
  Video,
  Zap,
  Key,
  Shield,
  Globe,
  Monitor,
  Wrench,
  Gamepad2,
  CreditCard,
  Gift,
  Users
} from 'lucide-react';
import { RichProductDescription } from '../common/RichProductDescription';
import { productKindOf, categoryKindOf } from '../../utils/productKind';

export const ProductsAdminView: React.FC = () => {
  const { currentUser, formatMoney, showToast, navigateToProduct, getProductShareUrl, products: appProducts, refreshProducts } = useApp();
  const [products, setProducts] = useState<Product[]>(appProducts);

  useEffect(() => {
    setProducts(appProducts);
  }, [appProducts]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [pgStatus, setPgStatus] = useState<string>('STANDBY');
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBrand, setFormBrand] = useState('ShopMe');
  const [formCategoryId, setFormCategoryId] = useState(dbService.categories[0]?.id || '');
  const [formCategoryName, setFormCategoryName] = useState(dbService.categories[0]?.name || '');
  const [formSubcategoryId, setFormSubcategoryId] = useState('');
  const [formSubcategoryName, setFormSubcategoryName] = useState('');
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('');
  const [formPrice, setFormPrice] = useState<number>(299.00);
  const [formComparePrice, setFormComparePrice] = useState<number>(399.00);
  const [formCostPrice, setFormCostPrice] = useState<number>(120.00);
  // Delivery: CITY = city rates from Settings, FIXED = price set here, FREE = always free
  const [formShippingMode, setFormShippingMode] = useState<'CITY' | 'FIXED' | 'FREE'>('FIXED');
  const [formShippingFee, setFormShippingFee] = useState<number>(35);
  const [formDeliveryCost, setFormDeliveryCost] = useState<number>(35);
  const [formAdCostPerOrder, setFormAdCostPerOrder] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(20);
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  // Description Rich Media Editor State (Images, GIFs, Videos)
  const [descPreviewMode, setDescPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalType, setMediaModalType] = useState<'image' | 'gif' | 'video'>('image');
  const [mediaInputUrl, setMediaInputUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaTab, setMediaTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isUploadingDescMedia, setIsUploadingDescMedia] = useState(false);
  const descMediaFileRef = useRef<HTMLInputElement>(null);
  const [formStatus, setFormStatus] = useState<ProductStatus>('PUBLISHED');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDesc, setFormSeoDesc] = useState('');
  const [formImages, setFormImages] = useState<ProductImage[]>([]);
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [formPromoPacks, setFormPromoPacks] = useState<PromoPack[]>([]);

  // Technical Specs Fields (Informations techniques)
  const [formWeight, setFormWeight] = useState('350 g');
  const [formDimensions, setFormDimensions] = useState('20 x 14 x 5 cm');
  const [formWarranty, setFormWarranty] = useState('Garantie 1 an · Échange ou remboursement 7j');
  const [formOrigin, setFormOrigin] = useState('Maroc / Confection Artisanale');
  const [formMaterial, setFormMaterial] = useState('Cuir véritable / Finitions haute précision');
  const [formBatteryLife, setFormBatteryLife] = useState('Autonomie optimale · Conçu pour usage intensif');

  // Product Kind: PHYSICAL | DIGITAL | SERVICE
  const [formProductKind, setFormProductKind] = useState<ProductKind>('PHYSICAL');

  // Digital Specific State
  const [formDigitalType, setFormDigitalType] = useState<DigitalType>('SUBSCRIPTION');
  const [formSharingMethod, setFormSharingMethod] = useState<SharingMethod>('FULL_ACCESS');
  const [formDeliveryTime, setFormDeliveryTime] = useState('⚡ Instant Delivery (Moins de 2 minutes)');
  const [formWarrantyPeriod, setFormWarrantyPeriod] = useState('Garantie intégrale 30 jours');
  const [formRegionRestriction, setFormRegionRestriction] = useState('Maroc & International (Sans VPN)');
  const [formSupportedDevices, setFormSupportedDevices] = useState<string[]>(['PC', 'Mac', 'iOS', 'Android']);
  const [formDurationOptions, setFormDurationOptions] = useState<DurationOption[]>([
    { id: 'dur-1', label: '1 Mois', durationValue: '1m', price: 99, compareAtPrice: 149, isDefault: true },
    { id: 'dur-2', label: '3 Mois', durationValue: '3m', price: 249, compareAtPrice: 399, badge: 'POPULAIRE 🔥 -25%' },
    { id: 'dur-3', label: '12 Mois', durationValue: '12m', price: 799, compareAtPrice: 1499, badge: 'MEILLEUR PRIX 🌟' }
  ]);
  const [formTopUpDenominations, setFormTopUpDenominations] = useState<TopUpDenomination[]>([]);
  const [formIncludedFeatures, setFormIncludedFeatures] = useState<string[]>([
    'Accès officiel et authentique',
    'Activation garantie sans coupure',
    'Assistance WhatsApp 7j/7'
  ]);
  const [formKeysPoolText, setFormKeysPoolText] = useState('');
  const [formInstantNotice, setFormInstantNotice] = useState('Vos accès ou codes vous sont transmis immédiatement par Email et WhatsApp après validation.');

  // Service Specific State
  const [formServiceType, setFormServiceType] = useState('Prestation de Service Sur-Mesure');
  const [formTurnaroundTime, setFormTurnaroundTime] = useState('24h à 48h');
  const [formRevisions, setFormRevisions] = useState('Révisions illimitées');
  const [formDeliverables, setFormDeliverables] = useState<string[]>([
    'Fichiers finaux haute résolution',
    'Assistance et ajustements 30 jours'
  ]);
  const [formClientRequirements, setFormClientRequirements] = useState('Détails de votre demande ou identifiants de jeu requis');
  const [formGuaranteeText, setFormGuaranteeText] = useState('Satisfait ou retravaillé jusqu\'à validation finale.');

  const categories = dbService.categories;
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Creates a category of the product type being edited (e.g. the first physical category) and selects it
  const handleCreateCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `categorie-${Date.now()}`;
    const id = categories.some(c => c.id === `cat-${slug}`) ? `cat-${slug}-${Date.now().toString().slice(-4)}` : `cat-${slug}`;
    dbService.saveCategory({
      id,
      name,
      slug,
      description: '',
      imageUrl: '',
      displayOrder: categories.length + 1,
      isActive: true,
      productKind: formProductKind,
      subcategories: []
    }, currentUser);
    setFormCategoryId(id);
    setFormCategoryName(name);
    setFormSubcategoryId('');
    setFormSubcategoryName('');
    setNewCategoryName('');
    setShowNewCategory(false);
    showToast(`✓ Catégorie « ${name} » créée`);
  };

  // Check PostgreSQL Database status from backend
  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      if (data && data.postgres) {
        setPgStatus(data.postgres.status);
      }
    } catch {
      setPgStatus('STANDBY');
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await dbService.syncFromBackend();
    setProducts([...dbService.products]);
    await checkDbStatus();
    setIsSyncing(false);
    showToast('✓ Synchronisation avec la base PostgreSQL effectuée');
  };

  const [kindFilter, setKindFilter] = useState<'all' | ProductKind>('all');

  // Filtered products list
  const filtered = products.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (kindFilter !== 'all') {
      const pKind = productKindOf(p);
      if (pKind !== kindFilter) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.categoryName || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleProductKindChange = (newKind: ProductKind) => {
    setFormProductKind(newKind);
    if (newKind === 'DIGITAL') {
      const digCat = categories.find(c => c.id === 'cat-digital');
      if (digCat) {
        setFormCategoryId(digCat.id);
        setFormCategoryName(digCat.name);
        if (digCat.subcategories?.[0]) {
          setFormSubcategoryId(digCat.subcategories[0].id);
          setFormSubcategoryName(digCat.subcategories[0].name);
        }
      }
      setFormWarranty('Garantie intégrale 30 jours (Remplacement ou remboursement)');
    } else if (newKind === 'SERVICE') {
      const srvCat = categories.find(c => c.id === 'cat-services');
      if (srvCat) {
        setFormCategoryId(srvCat.id);
        setFormCategoryName(srvCat.name);
        if (srvCat.subcategories?.[0]) {
          setFormSubcategoryId(srvCat.subcategories[0].id);
          setFormSubcategoryName(srvCat.subcategories[0].name);
        }
      }
      setFormWarranty('Garantie satisfait ou remboursé');
    } else {
      const physCat = categories.find(c => categoryKindOf(c) === 'PHYSICAL') || categories[0];
      if (physCat) {
        setFormCategoryId(physCat.id);
        setFormCategoryName(physCat.name);
        if (physCat.subcategories?.[0]) {
          setFormSubcategoryId(physCat.subcategories[0].id);
          setFormSubcategoryName(physCat.subcategories[0].name);
        }
      }
    }
    showToast(`Type de produit : ${newKind === 'DIGITAL' ? 'Produit Digital ⚡' : newKind === 'SERVICE' ? 'Prestation de Service 🛠️' : 'Produit Physique 📦'}`);
  };

  const handleCategorySelectChange = (newCatId: string) => {
    setFormCategoryId(newCatId);
    const selectedCat = categories.find(c => c.id === newCatId);
    setFormCategoryName(selectedCat?.name || '');
    
    setFormProductKind(categoryKindOf(selectedCat));

    if (selectedCat?.subcategories && selectedCat.subcategories.length > 0) {
      const firstSub = selectedCat.subcategories[0];
      setFormSubcategoryId(firstSub.id);
      setFormSubcategoryName(firstSub.name);
      setIsCustomSubcategory(false);
      
      // Auto-configure digital subtype
      if (firstSub.id.includes('keys')) setFormDigitalType('GAME_KEY');
      else if (firstSub.id.includes('acc')) setFormDigitalType('ACCOUNT');
      else if (firstSub.id.includes('soft')) setFormDigitalType('SOFTWARE');
      else if (firstSub.id.includes('topup')) setFormDigitalType('GAME_TOPUP');
      else if (firstSub.id.includes('gift')) setFormDigitalType('GIFT_CARD');
      else if (firstSub.id.includes('sub')) setFormDigitalType('SUBSCRIPTION');
    } else {
      setFormSubcategoryId('');
      setFormSubcategoryName('');
    }
  };

  const handleSubcategorySelectChange = (subId: string) => {
    setFormSubcategoryId(subId);
    const found = categories.find(c => c.id === formCategoryId)?.subcategories?.find(s => s.id === subId);
    setFormSubcategoryName(found?.name || '');
    if (subId.includes('keys')) setFormDigitalType('GAME_KEY');
    else if (subId.includes('acc')) setFormDigitalType('ACCOUNT');
    else if (subId.includes('soft')) setFormDigitalType('SOFTWARE');
    else if (subId.includes('topup')) setFormDigitalType('GAME_TOPUP');
    else if (subId.includes('gift')) setFormDigitalType('GIFT_CARD');
    else if (subId.includes('sub')) setFormDigitalType('SUBSCRIPTION');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`);
    setFormBrand('ShopMe');
    const firstCat = categories[0];
    const initialKind = categoryKindOf(firstCat);
    setFormProductKind(initialKind);
    setFormCategoryId(firstCat?.id || '');
    setFormCategoryName(firstCat?.name || '');
    const firstSub = firstCat?.subcategories?.[0];
    setFormSubcategoryId(firstSub?.id || '');
    setFormSubcategoryName(firstSub?.name || '');
    setIsCustomSubcategory(false);
    setCustomSubcategoryInput('');
    setFormPrice(299.00);
    setFormComparePrice(399.00);
    setFormCostPrice(120.00);
    setFormShippingMode('FIXED');
    setFormShippingFee(dbService.settings.standardShippingFee ?? 35);
    setFormDeliveryCost(dbService.settings.defaultDeliveryCost ?? 35);
    setFormAdCostPerOrder(0);
    setFormStock(25);
    setFormShortDesc('Qualité supérieure, finitions raffinées et livraison express partout au Maroc.');
    setFormDesc('Fiche produit confectionnée avec des matériaux nobles. Idéal pour un usage quotidien ou un cadeau d\'exception. Paiement à la livraison après inspection.');
    setFormStatus('PUBLISHED');
    setFormSeoTitle('');
    setFormSeoDesc('');
    setFormWeight('320 g');
    setFormDimensions('18 x 12 x 4 cm');
    setFormWarranty('Garantie 1 an · Échange sous 7 jours');
    setFormOrigin('Maroc / Fabrication Artisanale');
    setFormMaterial('Matériaux nobles · Finition soignée');
    setFormBatteryLife('Conçu pour durer · Testé et certifié');
    
    // Digital presets
    setFormDigitalType('SUBSCRIPTION');
    setFormSharingMethod('FULL_ACCESS');
    setFormDeliveryTime('⚡ Instant Delivery (Moins de 2 minutes)');
    setFormWarrantyPeriod('Garantie intégrale 30 jours (Remplacement ou remboursement)');
    setFormRegionRestriction('Maroc & International (Sans VPN)');
    setFormSupportedDevices(['PC', 'Mac', 'iOS', 'Android']);
    setFormDurationOptions([
      { id: 'dur-1', label: '1 Mois', durationValue: '1m', price: 99, compareAtPrice: 149, isDefault: true },
      { id: 'dur-2', label: '3 Mois', durationValue: '3m', price: 249, compareAtPrice: 399, badge: 'POPULAIRE 🔥 -25%' },
      { id: 'dur-3', label: '12 Mois', durationValue: '12m', price: 799, compareAtPrice: 1499, badge: 'MEILLEUR PRIX 🌟' }
    ]);
    setFormTopUpDenominations([]);
    setFormIncludedFeatures([
      'Accès officiel et authentique',
      'Activation garantie sans interruption',
      'Support WhatsApp 7j/7'
    ]);
    setFormKeysPoolText('');
    setFormInstantNotice('Vos accès ou codes vous sont transmis immédiatement par Email et WhatsApp après validation.');

    // Service presets
    setFormServiceType('Prestation de Service Sur-Mesure');
    setFormTurnaroundTime('24h à 48h');
    setFormRevisions('Révisions illimitées');
    setFormDeliverables([
      'Fichiers finaux haute résolution',
      'Assistance et ajustements 30 jours'
    ]);
    setFormClientRequirements('Détails de votre demande ou identifiants requis');
    setFormGuaranteeText('Satisfait ou retravaillé jusqu\'à validation finale.');

    setFormImages([
      {
        id: `img-${Date.now()}`,
        productId: '',
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        altText: "Image principale",
        displayOrder: 1,
        isPrimary: true
      }
    ]);
    setFormVariants([
      {
        id: `var-${Date.now()}-1`,
        productId: '',
        sku: `SKU-${Date.now().toString().slice(-4)}-STD`,
        title: 'Modèle Standard',
        sizeOption: 'Standard',
        colorOption: 'Noir Profond',
        colorHex: '#0f172a',
        price: 299.00,
        compareAtPrice: 399.00,
        stockQuantity: 15
      },
      {
        id: `var-${Date.now()}-2`,
        productId: '',
        sku: `SKU-${Date.now().toString().slice(-4)}-PREM`,
        title: 'Édition Prestige',
        sizeOption: 'Luxe',
        colorOption: 'Argent / Doré',
        colorHex: '#d97706',
        price: 349.00,
        compareAtPrice: 449.00,
        stockQuantity: 10
      }
    ]);
    setFormPromoPacks([
      { id: 'pack-1', quantity: 1, title: 'Pack 1 Pièce', price: 299, compareAtPrice: 399, badge: '' },
      { id: 'pack-2', quantity: 2, title: 'Pack 2 Pièces', price: 499, compareAtPrice: 598, badge: 'LE PLUS POPULAIRE 🔥 -20%' },
      { id: 'pack-3', quantity: 3, title: 'Pack 3 Pièces', price: 598, compareAtPrice: 897, badge: 'MEILLEURE OFFRE 🎁 1 GRATUIT' },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormSku(p.sku);
    setFormBrand(p.brand);
    
    const pKind = productKindOf(p);
    setFormProductKind(pKind);

    setFormCategoryId(p.categoryId);
    setFormCategoryName(p.categoryName || '');
    setFormSubcategoryId(p.subcategoryId || '');
    setFormSubcategoryName(p.subcategoryName || '');
    setIsCustomSubcategory(false);
    setCustomSubcategoryInput('');
    setFormPrice(p.price);
    setFormComparePrice(p.compareAtPrice || 0);
    setFormCostPrice(p.costPrice || 0);
    if (p.shippingFee === undefined || p.shippingFee === null) {
      setFormShippingMode('CITY');
      setFormShippingFee(dbService.settings.standardShippingFee ?? 35);
    } else if (Number(p.shippingFee) === 0) {
      setFormShippingMode('FREE');
      setFormShippingFee(0);
    } else {
      setFormShippingMode('FIXED');
      setFormShippingFee(Number(p.shippingFee));
    }
    setFormDeliveryCost(p.deliveryCost ?? dbService.settings.defaultDeliveryCost ?? 35);
    setFormAdCostPerOrder(p.adCostPerOrder ?? 0);
    setFormStock(p.stockQuantity);
    setFormShortDesc(p.shortDescription || '');
    setFormDesc(p.description);
    setFormStatus(p.status);
    setFormSeoTitle(p.seoTitle || '');
    setFormSeoDesc(p.seoDescription || '');
    setFormImages(p.images || []);
    setFormVariants(p.variants || []);
    setFormPromoPacks(p.promoPacks && p.promoPacks.length > 0 ? p.promoPacks : [
      { id: 'pack-1', quantity: 1, title: 'Pack 1 Pièce', price: p.price, compareAtPrice: p.compareAtPrice, badge: '' },
      { id: 'pack-2', quantity: 2, title: 'Pack 2 Pièces', price: Math.round(p.price * 2 * 0.8), compareAtPrice: p.price * 2, badge: 'LE PLUS POPULAIRE 🔥 -20%' },
      { id: 'pack-3', quantity: 3, title: 'Pack 3 Pièces', price: p.price * 2, compareAtPrice: p.price * 3, badge: 'MEILLEURE OFFRE 🎁 1 GRATUIT' },
    ]);

    // Load technical specs
    setFormWeight(p.technicalSpecs?.weight || '350 g');
    setFormDimensions(p.technicalSpecs?.dimensions || '20 x 14 x 5 cm');
    setFormWarranty(p.technicalSpecs?.warranty || 'Garantie 1 an · Échange 7j');
    setFormOrigin(p.technicalSpecs?.origin || 'Maroc / Confection Artisanale');
    setFormMaterial(p.technicalSpecs?.material || 'Cuir véritable / Acier');
    setFormBatteryLife(p.technicalSpecs?.batteryLife || 'Usage quotidien continu');

    // Load digital specs if available
    if (p.digitalSpecs) {
      setFormDigitalType(p.digitalSpecs.digitalType || 'SUBSCRIPTION');
      setFormSharingMethod(p.digitalSpecs.sharingMethod || 'FULL_ACCESS');
      setFormDeliveryTime(p.digitalSpecs.deliveryTime || '⚡ Instant Delivery (Moins de 2 minutes)');
      setFormWarrantyPeriod(p.digitalSpecs.warrantyPeriod || 'Garantie intégrale 30 jours');
      setFormRegionRestriction(p.digitalSpecs.regionRestriction || 'Maroc & International (Sans VPN)');
      setFormSupportedDevices(p.digitalSpecs.supportedDevices || ['PC', 'Mac', 'iOS', 'Android']);
      setFormDurationOptions(p.digitalSpecs.durationOptions || []);
      setFormTopUpDenominations(p.digitalSpecs.topUpDenominations || []);
      setFormIncludedFeatures(p.digitalSpecs.includedFeatures || [
        'Accès officiel et authentique',
        'Activation garantie sans interruption',
        'Support WhatsApp 7j/7'
      ]);
      setFormKeysPoolText((p.digitalSpecs.keysPool || []).join('\n'));
      setFormInstantNotice(p.digitalSpecs.instantDeliveryNotice || 'Vos accès ou codes vous sont transmis immédiatement par Email et WhatsApp après validation.');
    } else {
      setFormDigitalType('SUBSCRIPTION');
      setFormSharingMethod('FULL_ACCESS');
      setFormDeliveryTime('⚡ Instant Delivery (Moins de 2 minutes)');
      setFormWarrantyPeriod('Garantie intégrale 30 jours');
      setFormRegionRestriction('Maroc & International (Sans VPN)');
      setFormSupportedDevices(['PC', 'Mac', 'iOS', 'Android']);
      setFormDurationOptions([]);
      setFormTopUpDenominations([]);
      setFormIncludedFeatures(['Accès officiel et authentique', 'Support garanti']);
      setFormKeysPoolText('');
      setFormInstantNotice('');
    }

    // Load service specs if available
    if (p.serviceSpecs) {
      setFormServiceType(p.serviceSpecs.serviceType || 'Prestation de Service Sur-Mesure');
      setFormTurnaroundTime(p.serviceSpecs.turnaroundTime || '24h à 48h');
      setFormRevisions(p.serviceSpecs.revisions || 'Révisions illimitées');
      setFormDeliverables(p.serviceSpecs.deliverables || ['Livrable final']);
      setFormClientRequirements(p.serviceSpecs.clientRequirements || '');
      setFormGuaranteeText(p.serviceSpecs.guaranteeText || 'Satisfait ou retouché jusqu\'à validation finale.');
    } else {
      setFormServiceType('Prestation de Service Sur-Mesure');
      setFormTurnaroundTime('24h à 48h');
      setFormRevisions('Révisions illimitées');
      setFormDeliverables(['Fichiers finaux haute résolution', 'Assistance 30 jours']);
      setFormClientRequirements('Détails de votre demande ou identifiants requis');
      setFormGuaranteeText('Satisfait ou retravaillé jusqu\'à validation finale.');
    }

    setIsModalOpen(true);
  };

  const handleCopyProductLink = (p: Product) => {
    const url = getProductShareUrl(p.slug, true);
    navigator.clipboard.writeText(url);
    showToast(`✓ Lien direct copié pour "${p.name}" (prêt à envoyer)`);
  };

  const handleShareProductWhatsApp = (p: Product) => {
    const url = getProductShareUrl(p.slug, true);
    const msg = `Salam ! Voici le lien direct pour commander *${p.name}* (${p.price} DH) avec paiement à la livraison partout au Maroc 🇲🇦 :\n👉 ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;

    const cat = categories.find(c => c.id === formCategoryId);
    const slug = formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const effectiveSubcategoryName = isCustomSubcategory 
      ? customSubcategoryInput.trim() 
      : (cat?.subcategories?.find(s => s.id === formSubcategoryId)?.name || formSubcategoryName || '');

    const technicalSpecs: TechnicalSpecs = {
      weight: formWeight.trim(),
      dimensions: formDimensions.trim(),
      warranty: formWarranty.trim(),
      origin: formOrigin.trim(),
      material: formMaterial.trim(),
      batteryLife: formBatteryLife.trim()
    };

    // Calculate total stock from variants if variants exist
    const totalVariantStock = formVariants.length > 0 
      ? formVariants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0)
      : Number(formStock);

    const saved: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      productKind: formProductKind,
      name: formName,
      slug,
      sku: formSku,
      brand: formBrand,
      categoryId: formCategoryId,
      categoryName: cat?.name || 'Général',
      subcategoryId: isCustomSubcategory ? `subcat-${Date.now()}` : (formSubcategoryId || undefined),
      subcategoryName: effectiveSubcategoryName || undefined,
      price: Number(formPrice),
      compareAtPrice: formComparePrice > 0 ? Number(formComparePrice) : undefined,
      costPrice: formCostPrice > 0 ? Number(formCostPrice) : undefined,
      shippingFee: formProductKind !== 'PHYSICAL'
        ? 0
        : formShippingMode === 'CITY' ? undefined : formShippingMode === 'FREE' ? 0 : Math.max(0, Number(formShippingFee) || 0),
      deliveryCost: formProductKind === 'PHYSICAL' ? Math.max(0, Number(formDeliveryCost) || 0) : 0,
      adCostPerOrder: Math.max(0, Number(formAdCostPerOrder) || 0),
      stockQuantity: formProductKind === 'PHYSICAL' ? totalVariantStock : Number(formStock),
      shortDescription: formShortDesc,
      description: formDesc,
      status: formStatus,
      isFeatured: editingProduct?.isFeatured ?? true,
      isVisible: true,
      seoTitle: formSeoTitle || `${formName} – ShopMe Maroc`,
      seoDescription: formSeoDesc || formShortDesc,
      images: formImages.length > 0 ? formImages : [
        {
          id: `img-${Date.now()}`,
          productId: '',
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
          altText: formName,
          displayOrder: 1,
          isPrimary: true
        }
      ],
      variants: formProductKind === 'PHYSICAL' ? formVariants : [],
      promoPacks: formProductKind === 'PHYSICAL' ? formPromoPacks : undefined,
      technicalSpecs: formProductKind === 'PHYSICAL' ? technicalSpecs : undefined,
      digitalSpecs: formProductKind === 'DIGITAL' ? {
        digitalType: formDigitalType,
        sharingMethod: formSharingMethod,
        deliveryTime: formDeliveryTime,
        warrantyPeriod: formWarrantyPeriod,
        regionRestriction: formRegionRestriction,
        supportedDevices: formSupportedDevices,
        durationOptions: formDigitalType === 'SUBSCRIPTION' ? formDurationOptions : undefined,
        topUpDenominations: (formDigitalType === 'GAME_TOPUP' || formDigitalType === 'GIFT_CARD') ? formTopUpDenominations : undefined,
        includedFeatures: formIncludedFeatures,
        keysPool: (formDigitalType === 'GAME_KEY' || formDigitalType === 'SOFTWARE') 
          ? formKeysPoolText.split('\n').map(k => k.trim()).filter(Boolean) 
          : undefined,
        instantDeliveryNotice: formInstantNotice
      } : undefined,
      serviceSpecs: formProductKind === 'SERVICE' ? {
        serviceType: formServiceType,
        turnaroundTime: formTurnaroundTime,
        revisions: formRevisions,
        deliverables: formDeliverables,
        clientRequirements: formClientRequirements,
        guaranteeText: formGuaranteeText
      } : undefined,
      rating: editingProduct?.rating || 5.0,
      reviewsCount: editingProduct?.reviewsCount || 0,
      viewCount: editingProduct?.viewCount || 0,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbService.saveProduct(saved, currentUser);
    setProducts([...dbService.products]);
    refreshProducts();
    setIsModalOpen(false);
    showToast(editingProduct ? "Produit mis à jour avec succès dans PostgreSQL" : "Nouveau produit créé avec succès dans PostgreSQL");
  };

  const handleDeleteProduct = (p: Product) => {
    setProductToDelete(p);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;
    const targetId = productToDelete.id;
    const targetName = productToDelete.name;

    // Immediately remove from dbService and state
    dbService.deleteProduct(targetId, currentUser);
    setProducts(prev => prev.filter(p => p.id !== targetId));
    refreshProducts();
    setProductToDelete(null);
    showToast(`✓ Produit « ${targetName} » supprimé de PostgreSQL`);
  };

  // Add a new variant
  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      productId: editingProduct?.id || '',
      sku: `${formSku}-VAR-${formVariants.length + 1}`,
      title: `Variante ${formVariants.length + 1}`,
      sizeOption: 'Standard',
      colorOption: 'Classique',
      price: formPrice,
      compareAtPrice: formComparePrice,
      stockQuantity: 10
    };
    setFormVariants([...formVariants, newVar]);
  };

  // Read file from laptop
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Convert image (PNG or JPG) to high-speed WebP format using HTML5 Canvas
  const convertImageToWebP = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const webpData = canvas.toDataURL('image/webp', 0.88);
          resolve(webpData);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Real laptop image uploader: accepts PNG and JPG, converts to WebP and uploads to real server backend
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImagesList: ProductImage[] = [...formImages];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await readFileAsDataURL(file);
        const webpDataUrl = await convertImageToWebP(dataUrl);

        let finalImageUrl = webpDataUrl;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name.replace(/\.[^/.]+$/, "") + '.webp',
              dataUrl: webpDataUrl,
              format: 'webp'
            })
          });
          const json = await res.json();
          if (json.success && json.imageUrl) {
            finalImageUrl = json.imageUrl;
          }
        } catch {
          finalImageUrl = webpDataUrl;
        }

        newImagesList.push({
          id: `img-${Date.now()}-${i}`,
          productId: editingProduct?.id || '',
          imageUrl: finalImageUrl,
          altText: file.name.replace(/\.[^/.]+$/, ""),
          displayOrder: newImagesList.length + 1,
          isPrimary: newImagesList.length === 0
        });
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }

    setFormImages(newImagesList);
    setIsUploading(false);
    showToast(`✓ ${files.length} photo(s) PNG/JPG convertie(s) en WebP et enregistrée(s)`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Set primary image
  const handleSetPrimary = (imgId: string) => {
    setFormImages(formImages.map(img => ({
      ...img,
      isPrimary: img.id === imgId
    })));
    showToast("Photo principale définie pour le catalogue");
  };

  // Manual image URL add
  const handleAddUrlImage = () => {
    if (!customImageUrl.trim()) return;
    const newImg: ProductImage = {
      id: `img-${Date.now()}`,
      productId: editingProduct?.id || '',
      imageUrl: customImageUrl.trim(),
      altText: formName || "Image produit",
      displayOrder: formImages.length + 1,
      isPrimary: formImages.length === 0
    };
    setFormImages([...formImages, newImg]);
    setCustomImageUrl('');
    showToast("Photo ajoutée à la galerie");
  };

  // Open Description Media Modal for Image, GIF, or Video
  const handleOpenMediaModal = (type: 'image' | 'gif' | 'video') => {
    setMediaModalType(type);
    setMediaInputUrl('');
    setMediaCaption('');
    setMediaTab('upload');
    setIsMediaModalOpen(true);
  };

  // Upload Image, GIF, or Video directly for the Product Description
  const handleDescMediaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDescMedia(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      let payloadFormat: string | undefined = undefined;
      let finalDataUrl = dataUrl;

      // Handle format based on file type
      if (file.type.startsWith('image/') && !file.type.includes('gif')) {
        finalDataUrl = await convertImageToWebP(dataUrl);
        payloadFormat = 'webp';
      } else if (file.type.includes('gif')) {
        payloadFormat = 'gif';
      } else if (file.type.includes('mp4')) {
        payloadFormat = 'mp4';
      } else if (file.type.includes('webm')) {
        payloadFormat = 'webm';
      }

      const isVideo = file.type.startsWith('video/') || mediaModalType === 'video';
      let uploadedUrl = finalDataUrl;
      let uploadError = '';
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            dataUrl: finalDataUrl,
            format: payloadFormat
          })
        });
        const json = await res.json().catch(() => ({}));
        if (json.success && (json.url || json.imageUrl)) {
          uploadedUrl = json.url || json.imageUrl;
        } else {
          uploadError = json.message || (res.status === 413 ? 'fichier trop lourd' : `erreur serveur ${res.status}`);
        }
      } catch (err: any) {
        uploadError = err.message || 'connexion impossible';
      }
      // An embedded video would bloat the product data and cannot be sent on WhatsApp: it must be on the server
      if (uploadError && isVideo) {
        throw new Error(`vidéo non envoyée au serveur (${uploadError}, ${Math.round(file.size / 1024 / 1024)} Mo). Essayez une vidéo MP4 plus légère (moins de 30 Mo).`);
      }
      const isGif = file.type.includes('gif') || mediaModalType === 'gif';
      const tagType = isVideo ? 'video' : (isGif ? 'gif' : 'image');

      const tag = `[${tagType}: ${uploadedUrl}${mediaCaption.trim() ? ` | ${mediaCaption.trim()}` : ''}]`;

      setFormDesc(prev => {
        const spacer = prev.trim() ? '\n\n' : '';
        return `${prev.trim()}${spacer}${tag}\n`;
      });

      showToast(`✓ ${tagType === 'video' ? 'Vidéo' : (tagType === 'gif' ? 'GIF animé' : 'Image')} inséré(e) dans la description !`);
      setIsMediaModalOpen(false);
      setMediaInputUrl('');
      setMediaCaption('');
    } catch (err: any) {
      showToast("Erreur lors de l'envoi du média : " + (err.message || 'Échec'));
    } finally {
      setIsUploadingDescMedia(false);
      if (descMediaFileRef.current) descMediaFileRef.current.value = '';
    }
  };

  // Insert Media URL (Image, GIF, Video, YouTube) into Description
  const handleInsertMediaUrl = () => {
    if (!mediaInputUrl.trim()) {
      showToast("Veuillez saisir un lien URL valide");
      return;
    }

    const trimmedUrl = mediaInputUrl.trim();
    const tag = `[${mediaModalType}: ${trimmedUrl}${mediaCaption.trim() ? ` | ${mediaCaption.trim()}` : ''}]`;

    setFormDesc(prev => {
      const spacer = prev.trim() ? '\n\n' : '';
      return `${prev.trim()}${spacer}${tag}\n`;
    });

    showToast(`✓ ${mediaModalType === 'video' ? 'Vidéo' : (mediaModalType === 'gif' ? 'GIF animé' : 'Image')} inséré(e) dans la description`);
    setIsMediaModalOpen(false);
    setMediaInputUrl('');
    setMediaCaption('');
  };

  // Insert complete rich story template into Description
  const handleInsertRichTemplate = () => {
    const template = `## Présentation & Atouts Majeurs
Découvrez notre création exclusive confectionnée avec un savoir-faire d'exception. Pensé pour un confort absolu et une durabilité remarquable au quotidien.

[gif: https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80 | Déballage & Vue 360° en direct]

## Spécifications & Finitions de Luxe
• Sélection de matériaux nobles résistants et légers
• Coutures renforcées et finitions haute précision
• Contrôle qualité strict avant expédition express

[image: https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80 | Détails des textures & matières nobles]

## Démonstration & Conseils d'Utilisation
[video: https://www.youtube.com/watch?v=kJQP7kiw5Fk | Démonstration officielle du produit en conditions réelles]`;

    setFormDesc(prev => {
      const spacer = prev.trim() ? '\n\n' : '';
      return `${prev.trim()}${spacer}${template}\n`;
    });
    showToast("✓ Modèle multimédia complet inséré dans la description !");
  };

  // Extract detected media items in the current description
  const extractMediaFromDesc = (text: string) => {
    const list: { id: string; type: 'image' | 'gif' | 'video'; url: string; caption?: string; rawTag: string }[] = [];
    if (!text) return list;

    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // [video: url | caption]
      const vidMatch = trimmed.match(/^\[video:\s*([^\|\]]+)(?:\|\s*([^\]]*))?\]$/i);
      if (vidMatch) {
        list.push({
          id: `desc-media-${idx}`,
          type: 'video',
          url: vidMatch[1].trim(),
          caption: vidMatch[2]?.trim(),
          rawTag: trimmed
        });
        return;
      }
      // [gif: url | caption]
      const gifMatch = trimmed.match(/^\[gif:\s*([^\|\]]+)(?:\|\s*([^\]]*))?\]$/i);
      if (gifMatch) {
        list.push({
          id: `desc-media-${idx}`,
          type: 'gif',
          url: gifMatch[1].trim(),
          caption: gifMatch[2]?.trim(),
          rawTag: trimmed
        });
        return;
      }
      // [image: url | caption]
      const imgMatch = trimmed.match(/^\[image:\s*([^\|\]]+)(?:\|\s*([^\]]*))?\]$/i);
      if (imgMatch) {
        list.push({
          id: `desc-media-${idx}`,
          type: 'image',
          url: imgMatch[1].trim(),
          caption: imgMatch[2]?.trim(),
          rawTag: trimmed
        });
        return;
      }
      // ![alt](url)
      const mdMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (mdMatch) {
        list.push({
          id: `desc-media-${idx}`,
          type: mdMatch[2].includes('.gif') ? 'gif' : 'image',
          url: mdMatch[2].trim(),
          caption: mdMatch[1]?.trim(),
          rawTag: trimmed
        });
      }
    });
    return list;
  };

  const removeMediaTagFromDesc = (rawTag: string) => {
    setFormDesc(prev => prev.replace(rawTag, '').replace(/\n\s*\n\s*\n/g, '\n\n').trim());
    showToast("Média retiré de la description");
  };

  return (
    <div className="space-y-6">
      
      {/* Title, PostgreSQL status & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">Gestion du Catalogue Produits</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
              pgStatus === 'CONNECTED' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              <Database className="w-3 h-3" />
              <span>{pgStatus === 'CONNECTED' ? 'PostgreSQL 16 Connecté' : 'Base de données Réelle Active'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Création complète de produits avec informations techniques, gestion des variantes et galerie WebP optimisée mobile
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Synchroniser avec la base de données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, SKU, marque ou catégorie..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Kind Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setKindFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              kindFilter === 'all'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tous ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('PHYSICAL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              kindFilter === 'PHYSICAL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📦 Physiques
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('DIGITAL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              kindFilter === 'DIGITAL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Digitaux
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('SERVICE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              kindFilter === 'SERVICE'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛠️ Services
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="PUBLISHED">Publié (En ligne)</option>
            <option value="DRAFT">Brouillon</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-4 font-semibold">Produit</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Catégorie</th>
                <th className="py-3 px-4 font-semibold">Prix (DH)</th>
                <th className="py-3 px-4 font-semibold">Stock / Clés</th>
                <th className="py-3 px-4 font-semibold">Spécificités</th>
                <th className="py-3 px-4 font-semibold">Statut</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(p => {
                const pKind = productKindOf(p);
                return (
                <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700 relative">
                        <img src={p.images[0]?.imageUrl} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 bg-slate-950/80 text-[8px] text-emerald-400 font-mono px-1 rounded-tl">
                          WebP
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-white line-clamp-1">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.brand} · {p.images.length} photo(s)</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {pKind === 'DIGITAL' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ⚡ {p.digitalSpecs?.digitalType === 'GAME_KEY' ? 'CLÉ JEU' : p.digitalSpecs?.digitalType === 'ACCOUNT' ? 'COMPTE' : p.digitalSpecs?.digitalType === 'SOFTWARE' ? 'LOGICIEL' : p.digitalSpecs?.digitalType === 'SUBSCRIPTION' ? 'ABONNEMENT' : 'DIGITAL'}
                      </span>
                    )}
                    {pKind === 'SERVICE' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        🛠️ SERVICE
                      </span>
                    )}
                    {pKind === 'PHYSICAL' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        📦 PHYSIQUE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{p.sku}</td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="font-semibold text-white">{p.categoryName}</div>
                    {p.subcategoryName && (
                      <div className="text-[10px] text-blue-400 font-medium">↳ {p.subcategoryName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-black text-white">{formatMoney(p.price)}</td>
                  <td className="py-3 px-4">
                    {pKind === 'DIGITAL' && (p.digitalSpecs?.keysPool && p.digitalSpecs.keysPool.length > 0) ? (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-500/20 text-emerald-400">
                        🔑 {p.digitalSpecs.keysPool.length} clés prêtes
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        p.stockQuantity > 10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {p.stockQuantity} dispo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {pKind === 'DIGITAL' ? (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {p.digitalSpecs?.deliveryTime || '⚡ Livraison Moins 2 min'}
                      </span>
                    ) : pKind === 'SERVICE' ? (
                      <span className="text-[10px] text-purple-300 font-medium">
                        ⏱️ {p.serviceSpecs?.turnaroundTime || '24h - 48h'}
                      </span>
                    ) : p.variants.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold text-[10px]">
                        {p.variants.length} variantes
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Unique</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      p.status === 'PUBLISHED' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Direct Buy Link for Client */}
                      <button
                        type="button"
                        onClick={() => handleCopyProductLink(p)}
                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Copier le lien direct d'achat pour envoyer au client"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Share WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleShareProductWhatsApp(p)}
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Envoyer le lien par WhatsApp au client"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>

                      {/* View in Storefront */}
                      <button
                        type="button"
                        onClick={() => navigateToProduct(p.slug)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Voir la page produit sur la boutique"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors cursor-pointer"
                        title="Modifier le produit, les prix, variantes et la galerie"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p)}
                        className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer le produit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Product Creation & Edition Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{editingProduct ? 'Modifier le Produit' : 'Créer un Nouveau Produit'}</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono">
                    PostgreSQL Real Sync
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Informations techniques, variantes et galerie WebP
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              
              {/* SÉLECTEUR DU TYPE DE PRODUIT & MODÈLE COMMERCIAL */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Type de Produit & Modèle Commercial *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formProductKind === 'DIGITAL' ? '⚡ Produit Digital (Sans livraison physique)' : formProductKind === 'SERVICE' ? '🛠️ Prestation de Service' : '📦 Produit Physique (Livraison COD)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: PHYSIQUE */}
                  <button
                    type="button"
                    onClick={() => handleProductKindChange('PHYSICAL')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      formProductKind === 'PHYSICAL'
                        ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/30'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${formProductKind === 'PHYSICAL' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">📦 Produit Physique</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Mode, Montres, Parfums, High-Tech avec livraison et paiement COD</div>
                    </div>
                  </button>

                  {/* Option 2: DIGITAL */}
                  <button
                    type="button"
                    onClick={() => handleProductKindChange('DIGITAL')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      formProductKind === 'DIGITAL'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${formProductKind === 'DIGITAL' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">⚡ Produit Digital</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Abonnements, Clés de jeux, Comptes, Logiciels & Licences, Top-ups</div>
                    </div>
                  </button>

                  {/* Option 3: SERVICE */}
                  <button
                    type="button"
                    onClick={() => handleProductKindChange('SERVICE')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      formProductKind === 'SERVICE'
                        ? 'bg-purple-600/20 border-purple-500 text-white ring-2 ring-purple-500/30'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${formProductKind === 'SERVICE' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">🛠️ Prestation de Service</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Gaming Boost, Coaching E-Sport, Développement Web, Graphisme & Design</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION 1: Informations de base */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Box className="w-4 h-4 text-blue-400" />
                  <span>1. Informations de base</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Nom du Produit *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={formProductKind === 'DIGITAL' ? "Ex: Netflix 4K UHD 12 Mois ou Clé GTA V Steam" : formProductKind === 'SERVICE' ? "Ex: Coaching Valorant 1-sur-1 Discord" : "Ex: Montre Royal Chronographe Homme"}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">SKU Unique *</label>
                    <input
                      type="text"
                      required
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="Ex: SHP-CHRONO-01"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Catégorie *</label>
                      <button
                        type="button"
                        onClick={() => setShowNewCategory(v => !v)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        {showNewCategory ? '← Choisir liste' : '+ Nouvelle catégorie'}
                      </button>
                    </div>
                    {(showNewCategory || !categories.some(c => categoryKindOf(c) === formProductKind)) && (
                      <div className="mb-2 p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2">
                        {!categories.some(c => categoryKindOf(c) === formProductKind) && (
                          <p className="text-[11px] text-amber-300 font-semibold">
                            Aucune catégorie {formProductKind === 'PHYSICAL' ? 'physique' : formProductKind === 'DIGITAL' ? 'digitale' : 'service'} : créez-en une (ex : High-Tech & Accessoires).
                          </p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
                            placeholder="Nom de la catégorie"
                            className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim()}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Créer
                          </button>
                        </div>
                      </div>
                    )}
                    <select
                      value={formCategoryId}
                      onChange={(e) => handleCategorySelectChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {/* Only the categories of the chosen product type; a mismatched saved category stays visible so it can be fixed */}
                      {(categories.some(c => categoryKindOf(c) === formProductKind)
                        ? categories.filter(c => categoryKindOf(c) === formProductKind || c.id === formCategoryId)
                        : categories
                      ).map(c => (
                        <option key={c.id} value={c.id}>
                          {categoryKindOf(c) !== formProductKind
                            ? `⚠ ${c.name} (catégorie ${{ DIGITAL: 'digitale', SERVICE: 'service', PHYSICAL: 'physique' }[categoryKindOf(c)]} : à changer)`
                            : c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sous-Catégorie Section */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Sous-Catégorie</label>
                      <button
                        type="button"
                        onClick={() => setIsCustomSubcategory(!isCustomSubcategory)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        {isCustomSubcategory ? "← Choisir liste" : "+ Saisie libre"}
                      </button>
                    </div>

                    {isCustomSubcategory ? (
                      <input
                        type="text"
                        value={customSubcategoryInput}
                        onChange={(e) => {
                          setCustomSubcategoryInput(e.target.value);
                          setFormSubcategoryName(e.target.value);
                        }}
                        placeholder="Ex: Abonnements IA, Clés de jeux, Coaching..."
                        className="w-full p-2.5 bg-slate-800 border border-blue-500/50 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <select
                        value={formSubcategoryId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'CUSTOM') {
                            setIsCustomSubcategory(true);
                          } else {
                            handleSubcategorySelectChange(val);
                          }
                        }}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">(Aucune sous-catégorie)</option>
                        {(categories.find(c => c.id === formCategoryId)?.subcategories || []).map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                        <option value="CUSTOM">+ Autre sous-catégorie personnalisée...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Marque</label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="Ex: ShopMe Maroc"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Courte Description (Accroche publicitaire)</label>
                  <input
                    type="text"
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    placeholder="Points forts visibles immédiatement sur mobile..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Description Complète & Médias Riches (Images, GIFs, Vidéos) pour Mobile */}
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Description & Contenu Multimédia Mobile</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ajoutez des <strong>images HD</strong>, <strong>GIFs animés</strong> et <strong>vidéos</strong> directement dans la description. Optimisé pour l'affichage mobile.
                      </p>
                    </div>

                    {/* Mode Toggle: Éditeur / Aperçu Mobile */}
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setDescPreviewMode('edit')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          descPreviewMode === 'edit'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Éditeur</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescPreviewMode('preview')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          descPreviewMode === 'preview'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Aperçu Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Toolbar for Media insertion */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenMediaModal('image')}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenMediaModal('gif')}
                      className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>+ GIF Animé</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenMediaModal('video')}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Film className="w-3.5 h-3.5 text-rose-400" />
                      <span>+ Vidéo (MP4 / YouTube)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInsertRichTemplate}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                      title="Insérer un modèle complet avec texte, GIF et vidéo"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modèle Complet</span>
                    </button>
                  </div>

                  {/* Mode Editor */}
                  {descPreviewMode === 'edit' ? (
                    <div className="space-y-3">
                      <textarea
                        rows={6}
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Rédigez votre description ou insérez des images, GIFs et vidéos ci-dessus...&#10;&#10;Exemples de balises :&#10;• [image: https://... | Légende photo]&#10;• [gif: https://... | Animation 360°]&#10;• [video: https://... | Démonstration vidéo]"
                        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />

                      {/* Detected Media Items in Description */}
                      {extractMediaFromDesc(formDesc).length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                            <span>Médias détectés dans la description ({extractMediaFromDesc(formDesc).length}) :</span>
                            <span className="text-[10px] text-purple-400">Rendus automatiquement sur la page produit</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {extractMediaFromDesc(formDesc).map((item, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between gap-2 p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                    item.type === 'video' 
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                      : item.type === 'gif' 
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}>
                                    {item.type === 'video' ? 'Vidéo' : item.type === 'gif' ? 'GIF' : 'Image'}
                                  </span>
                                  <span className="text-slate-300 text-[11px] truncate">
                                    {item.caption || item.url}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMediaTagFromDesc(item.rawTag)}
                                  className="p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Retirer ce média"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Syntaxe acceptée : balises <code>[image: URL]</code>, <code>[gif: URL]</code>, <code>[video: URL]</code>, Markdown <code>![alt](url)</code> ou lien direct.</span>
                        <span className="font-mono">{formDesc.length} caractères</span>
                      </div>
                    </div>
                  ) : (
                    /* Mode Mobile Preview */
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-bold text-slate-300">
                          <Smartphone className="w-4 h-4 text-purple-400" />
                          <span>Simulation de l'affichage sur smartphone client</span>
                        </span>
                        <span className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700/50">
                          Rendu Temps Réel
                        </span>
                      </div>

                      {/* Smartphone Frame Wrapper */}
                      <div className="max-w-md mx-auto bg-white rounded-3xl p-5 shadow-2xl border-4 border-slate-800 text-slate-900">
                        <div className="w-16 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
                        <h4 className="text-sm font-black text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                          <span>Détails & Caractéristiques</span>
                          <span className="text-[10px] text-slate-400 font-normal">ShopMe Mobile</span>
                        </h4>
                        <RichProductDescription 
                          description={formDesc || 'Aucune description rédigée pour le moment.'} 
                          productName={formName || 'Aperçu Produit'} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Prix & Inventaire */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span>2. Contrôle des Prix & Rentabilité</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {formComparePrice > formPrice && (
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded-md">
                        Remise : -{Math.round(((formComparePrice - formPrice) / formComparePrice) * 100)}%
                      </span>
                    )}
                    {formCostPrice > 0 && formPrice > formCostPrice && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-md">
                        Marge nette : +{formPrice - formCostPrice} DH ({Math.round(((formPrice - formCostPrice) / formPrice) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Prix de vente (DH) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="any"
                      value={formPrice}
                      onChange={(e) => {
                        const newPrice = Number(e.target.value);
                        setFormPrice(newPrice);
                      }}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Prix barré / Promo (DH)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formComparePrice}
                      onChange={(e) => setFormComparePrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Prix de revient (DH)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Stock Disponible</label>
                    <input
                      type="number"
                      min={0}
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold"
                    />
                  </div>
                </div>

                {/* Livraison & coûts par produit */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  {formProductKind === 'PHYSICAL' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">🚚 Livraison client</label>
                        <select
                          value={formShippingMode}
                          onChange={(e) => setFormShippingMode(e.target.value as 'CITY' | 'FIXED' | 'FREE')}
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                        >
                          <option value="FIXED">Prix fixe pour ce produit</option>
                          <option value="CITY">Tarif par ville (Paramètres)</option>
                          <option value="FREE">Livraison gratuite</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Frais livraison client (DH)</label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          disabled={formShippingMode !== 'FIXED'}
                          value={formShippingMode === 'FREE' ? 0 : formShippingFee}
                          onChange={(e) => setFormShippingFee(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold disabled:opacity-50"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          {formShippingMode === 'CITY'
                            ? 'Selon la ville (onglet Paramètres)'
                            : formShippingMode === 'FREE'
                            ? 'Le client ne paie pas la livraison'
                            : 'Payé par le client, quelle que soit la ville'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Coût réel livreur (DH)</label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={formDeliveryCost}
                          onChange={(e) => setFormDeliveryCost(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Ce que vous payez à la société de livraison</p>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Coût pub / commande (DH)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formAdCostPerOrder}
                      onChange={(e) => setFormAdCostPerOrder(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Budget pub ÷ nombre de commandes</p>
                  </div>
                </div>

                {formCostPrice > 0 && (() => {
                  const clientFee = formProductKind !== 'PHYSICAL' || formShippingMode === 'FREE'
                    ? 0
                    : formShippingMode === 'FIXED' ? Number(formShippingFee) || 0 : (dbService.settings.standardShippingFee ?? 0);
                  const deliveryCost = formProductKind === 'PHYSICAL' ? Number(formDeliveryCost) || 0 : 0;
                  const adCost = Number(formAdCostPerOrder) || 0;
                  const net = Number(formPrice) + clientFee - Number(formCostPrice) - deliveryCost - adCost;
                  return (
                    <div className={`text-[11px] font-bold px-3 py-2 rounded-xl ${net >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      Bénéfice net estimé / commande (1 pièce) : {net.toFixed(2)} DH
                      <span className="text-slate-400 font-medium"> = vente {Number(formPrice)} + livraison client {clientFee} − achat {Number(formCostPrice)} − livreur {deliveryCost} − pub {adCost}</span>
                    </div>
                  );
                })()}
              </div>

              {/* SECTION SPÉCIFIQUE : PRODUIT DIGITAL */}
              {formProductKind === 'DIGITAL' && (
                <div className="space-y-4 border-t border-slate-800 pt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span>3. Configuration Spécifique Produit Digital & Accès</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Sélectionnez le type digital (Abonnement, Clé de Jeu, Compte, Logiciel) pour adapter automatiquement la livraison et les options.
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 font-bold font-mono">
                      Livraison Instantanée ⚡
                    </span>
                  </div>

                  {/* Digital Sub-Type Selector Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { type: 'SUBSCRIPTION', label: 'Abonnement', icon: Sparkles, desc: 'Netflix, IA, SVOD' },
                      { type: 'GAME_KEY', label: 'Clé de Jeu', icon: Key, desc: 'Steam, Epic, CD-Key' },
                      { type: 'ACCOUNT', label: 'Compte Gaming', icon: Users, desc: 'GTA 5, Valorant' },
                      { type: 'SOFTWARE', label: 'Logiciel', icon: Monitor, desc: 'Windows, Office' },
                      { type: 'GAME_TOPUP', label: 'Recharge / Top-Up', icon: Gamepad2, desc: 'Free Fire, Robux' },
                      { type: 'GIFT_CARD', label: 'Carte Cadeau', icon: Gift, desc: 'Steam, PSN Card' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = formDigitalType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setFormDigitalType(item.type as DigitalType);
                            if (item.type === 'GAME_KEY') {
                              setFormDeliveryTime('⚡ Envoi Immédiat par WhatsApp & Email (Moins de 2 minutes)');
                              setFormWarrantyPeriod('Garantie Activation 100% Officielle');
                            } else if (item.type === 'ACCOUNT') {
                              setFormDeliveryTime('⚡ Remise Sécurisée en 5 minutes');
                              setFormWarrantyPeriod('Garantie Anti-Ban & Sécurité 30 Jours');
                            } else if (item.type === 'SOFTWARE') {
                              setFormDeliveryTime('⚡ Clé officielle & lien officiel immédiat');
                              setFormWarrantyPeriod('Licence Définitive À Vie');
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-600/25 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <div className="text-xs font-bold text-white">{item.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{item.desc}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Fields for SUBSCRIPTION */}
                  {formDigitalType === 'SUBSCRIPTION' && (
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/80 space-y-4">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Paramètres de l'Abonnement (Streaming / IA / SaaS)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Méthode de Partage / Accès *</label>
                          <select
                            value={formSharingMethod}
                            onChange={(e) => setFormSharingMethod(e.target.value as SharingMethod)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          >
                            <option value="FULL_ACCESS">Accès Complet Privé (Sur l'Email du client)</option>
                            <option value="SHARED_ACCOUNT">Compte Partagé avec Profil & Code PIN dédié</option>
                            <option value="FAMILY_INVITE">Invitation Officielle Famille (Lien envoyé)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Délai d'Activation</label>
                          <input
                            type="text"
                            value={formDeliveryTime}
                            onChange={(e) => setFormDeliveryTime(e.target.value)}
                            placeholder="Ex: ⚡ Moins de 2 minutes après paiement"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Période de Garantie</label>
                          <input
                            type="text"
                            value={formWarrantyPeriod}
                            onChange={(e) => setFormWarrantyPeriod(e.target.value)}
                            placeholder="Ex: Garantie intégrale avec remplacement"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>
                      </div>

                      {/* Options de Durées pour Abonnements */}
                      <div className="space-y-2 pt-2 border-t border-slate-700/60">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                            Options de Durée Disponibles ({formDurationOptions.length} durées configurées)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const newId = `dur-${Date.now()}`;
                              setFormDurationOptions([
                                ...formDurationOptions,
                                { id: newId, label: '6 Mois', durationValue: '6m', price: Math.round(formPrice * 4.5), compareAtPrice: formPrice * 6, badge: 'ÉCONOMIE -30%' }
                              ]);
                            }}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Ajouter une Durée</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {formDurationOptions.map((opt, oIdx) => (
                            <div key={opt.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs">
                              <div className="w-28 shrink-0">
                                <label className="text-[9px] text-slate-400 block mb-0.5">Libellé</label>
                                <input
                                  type="text"
                                  value={opt.label}
                                  onChange={(e) => {
                                    const updated = [...formDurationOptions];
                                    updated[oIdx].label = e.target.value;
                                    setFormDurationOptions(updated);
                                  }}
                                  placeholder="Ex: 1 Mois"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-center"
                                />
                              </div>
                              <div className="w-24 shrink-0">
                                <label className="text-[9px] text-slate-400 block mb-0.5">Prix (DH)</label>
                                <input
                                  type="number"
                                  value={opt.price}
                                  onChange={(e) => {
                                    const updated = [...formDurationOptions];
                                    updated[oIdx].price = Number(e.target.value);
                                    setFormDurationOptions(updated);
                                  }}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-emerald-400 font-black text-center"
                                />
                              </div>
                              <div className="w-24 shrink-0">
                                <label className="text-[9px] text-slate-400 block mb-0.5">Prix Barré (DH)</label>
                                <input
                                  type="number"
                                  value={opt.compareAtPrice || 0}
                                  onChange={(e) => {
                                    const updated = [...formDurationOptions];
                                    updated[oIdx].compareAtPrice = Number(e.target.value);
                                    setFormDurationOptions(updated);
                                  }}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-400 text-center"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[9px] text-slate-400 block mb-0.5">Badge Promo</label>
                                <input
                                  type="text"
                                  value={opt.badge || ''}
                                  onChange={(e) => {
                                    const updated = [...formDurationOptions];
                                    updated[oIdx].badge = e.target.value;
                                    setFormDurationOptions(updated);
                                  }}
                                  placeholder="Ex: LE PLUS POPULAIRE 🔥"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white text-[11px]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormDurationOptions(formDurationOptions.filter((_, i) => i !== oIdx))}
                                className="self-end sm:self-center p-2 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer cette durée"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for GAME_KEY */}
                  {formDigitalType === 'GAME_KEY' && (
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/80 space-y-4">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-emerald-400" />
                        <span>Paramètres Clé de Jeu & CD-Key (Steam, Epic, Console)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Plateforme de Jeu *</label>
                          <select
                            value={formSupportedDevices[0] || 'Steam'}
                            onChange={(e) => setFormSupportedDevices([e.target.value])}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          >
                            <option value="Steam">Steam (PC)</option>
                            <option value="Epic Games">Epic Games Launcher</option>
                            <option value="PlayStation Network (PS4 / PS5)">PlayStation Network (PS4 / PS5)</option>
                            <option value="Xbox Live / Microsoft Store">Xbox Live / Microsoft Store</option>
                            <option value="EA App / Origin">EA App (FIFA / FC / Battlefield)</option>
                            <option value="Battle.net (Blizzard)">Battle.net (Activision Blizzard)</option>
                            <option value="Ubisoft Connect">Ubisoft Connect</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Région / Zone d'Activation *</label>
                          <select
                            value={formRegionRestriction}
                            onChange={(e) => setFormRegionRestriction(e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          >
                            <option value="Global (Monde Entier, Sans VPN)">Global (Monde Entier, Sans VPN)</option>
                            <option value="Europe & MENA (Maroc direct)">Europe & MENA (Maroc direct)</option>
                            <option value="Amérique du Nord (US/CA)">Amérique du Nord (US/CA)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Garantie d'Activation</label>
                          <input
                            type="text"
                            value={formWarrantyPeriod}
                            onChange={(e) => setFormWarrantyPeriod(e.target.value)}
                            placeholder="Ex: Clé 100% Officielle Garantie Permanente"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>
                      </div>

                      {/* License Keys Pool (Stock de Clés) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                            <span>Stock de Clés de Jeux Numériques (1 clé par ligne)</span>
                            <span className="text-emerald-400 font-mono text-[10px]">
                              ({formKeysPoolText.split('\n').filter(k => k.trim()).length} clés prêtes)
                            </span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            Chaque commande retire automatiquement une clé pour l'acheteur
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={formKeysPoolText}
                          onChange={(e) => setFormKeysPoolText(e.target.value)}
                          placeholder="Ex:&#10;STEAM-GTA5-XXXX-YYYY&#10;STEAM-GTA5-AAAA-BBBB&#10;STEAM-GTA5-CCCC-DDDD"
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for ACCOUNT */}
                  {formDigitalType === 'ACCOUNT' && (
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/80 space-y-4">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Paramètres Compte Gaming & Comptes Vérifiés (Valorant, GTA 5, CoC...)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Niveau d'Accès Client *</label>
                          <select
                            value={formSharingMethod}
                            onChange={(e) => setFormSharingMethod(e.target.value as SharingMethod)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          >
                            <option value="FULL_ACCESS">Accès Total (Email & Mot de passe modifiables immédiatement)</option>
                            <option value="SHARED_ACCOUNT">Accès Garanti Sécurisé (Identifiants préconfigurés)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Garantie Anti-Ban / Sécurité</label>
                          <input
                            type="text"
                            value={formWarrantyPeriod}
                            onChange={(e) => setFormWarrantyPeriod(e.target.value)}
                            placeholder="Ex: Garantie Anti-Récupération 30 Jours"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Délai de Livraison</label>
                          <input
                            type="text"
                            value={formDeliveryTime}
                            onChange={(e) => setFormDeliveryTime(e.target.value)}
                            placeholder="Ex: ⚡ Remise en 5 minutes par WhatsApp"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for SOFTWARE */}
                  {formDigitalType === 'SOFTWARE' && (
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/80 space-y-4">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-emerald-400" />
                        <span>Paramètres Logiciels & Licences (Windows 11, Office 365, Antivirus...)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Système Compatible</label>
                          <input
                            type="text"
                            value={formSupportedDevices.join(', ')}
                            onChange={(e) => setFormSupportedDevices(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="Ex: Windows 11 / 10 (32 & 64-bit)"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Type de Licence</label>
                          <select
                            value={formWarrantyPeriod.includes('Vie') ? 'LIFETIME' : 'SUBSCRIPTION'}
                            onChange={(e) => {
                              if (e.target.value === 'LIFETIME') setFormWarrantyPeriod('Licence Permanente À Vie (Retail)');
                              else setFormWarrantyPeriod('Licence 1 An Renouvelable');
                            }}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          >
                            <option value="LIFETIME">Licence Définitive À Vie (Retail 1 PC)</option>
                            <option value="SUBSCRIPTION">Abonnement 1 An Renouvelable</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Délai d'Envoi</label>
                          <input
                            type="text"
                            value={formDeliveryTime}
                            onChange={(e) => setFormDeliveryTime(e.target.value)}
                            placeholder="Ex: ⚡ Moins de 2 minutes par Email & WhatsApp"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>
                      </div>

                      {/* License Keys Pool */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                            <span>Clés de Licence Logicielles en Stock (1 par ligne)</span>
                            <span className="text-emerald-400 font-mono text-[10px]">
                              ({formKeysPoolText.split('\n').filter(k => k.trim()).length} clés prêtes)
                            </span>
                          </label>
                        </div>
                        <textarea
                          rows={3}
                          value={formKeysPoolText}
                          onChange={(e) => setFormKeysPoolText(e.target.value)}
                          placeholder="Ex:&#10;W11PRO-XXXXX-YYYYY-ZZZZZ-AAAAA&#10;W11PRO-BBBBB-CCCCC-DDDDD-EEEEE"
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for GAME_TOPUP / GIFT_CARD */}
                  {(formDigitalType === 'GAME_TOPUP' || formDigitalType === 'GIFT_CARD') && (
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/80 space-y-4">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-emerald-400" />
                        <span>Paramètres Recharges & Cartes Cadeaux (Diamants, VP, Robux)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Délai d'Envoi</label>
                          <input
                            type="text"
                            value={formDeliveryTime}
                            onChange={(e) => setFormDeliveryTime(e.target.value)}
                            placeholder="Ex: ⚡ Envoi direct sous 5 à 15 minutes"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Donnée Requise du Client</label>
                          <input
                            type="text"
                            value={formClientRequirements}
                            onChange={(e) => setFormClientRequirements(e.target.value)}
                            placeholder="Ex: ID Joueur (Player ID) ou Pseudo du jeu"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Avantages & Notice pour tous les produits digitaux */}
                  <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Avantages & Fonctionnalités Incluses (Points Clés Fiche Produit)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormIncludedFeatures([...formIncludedFeatures, 'Nouvel avantage officiel'])}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ajouter un Avantage</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formIncludedFeatures.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-1.5 bg-slate-800 p-2 rounded-xl border border-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => {
                              const updated = [...formIncludedFeatures];
                              updated[fIdx] = e.target.value;
                              setFormIncludedFeatures(updated);
                            }}
                            className="w-full bg-transparent text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setFormIncludedFeatures(formIncludedFeatures.filter((_, i) => i !== fIdx))}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Notice de Livraison Instantanée (Visible au client)</label>
                      <input
                        type="text"
                        value={formInstantNotice}
                        onChange={(e) => setFormInstantNotice(e.target.value)}
                        placeholder="Ex: Vos accès ou codes vous sont transmis immédiatement par Email et WhatsApp après validation."
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION SPÉCIFIQUE : PRESTATION DE SERVICE */}
              {formProductKind === 'SERVICE' && (
                <div className="space-y-4 border-t border-slate-800 pt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                        <Wrench className="w-4 h-4 text-purple-400" />
                        <span>3. Configuration de la Prestation de Service</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Définissez les délais de réalisation, les révisions incluses et ce que le client recevra.
                      </p>
                    </div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30 font-bold font-mono">
                      Prestation Pro 🛠️
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Type de Prestation</label>
                      <input
                        type="text"
                        value={formServiceType}
                        onChange={(e) => setFormServiceType(e.target.value)}
                        placeholder="Ex: Coaching 1-sur-1, Boost, Création Web..."
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Délai de Réalisation *</label>
                      <input
                        type="text"
                        value={formTurnaroundTime}
                        onChange={(e) => setFormTurnaroundTime(e.target.value)}
                        placeholder="Ex: 24h à 48h chrono"
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Révisions Incluses</label>
                      <input
                        type="text"
                        value={formRevisions}
                        onChange={(e) => setFormRevisions(e.target.value)}
                        placeholder="Ex: Révisions illimitées jusqu'à validation"
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Ce que le Client Reçoit (Livrables Inclus)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormDeliverables([...formDeliverables, 'Nouveau livrable inclus'])}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ajouter un Livrable</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formDeliverables.map((del, dIdx) => (
                        <div key={dIdx} className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                          <input
                            type="text"
                            value={del}
                            onChange={(e) => {
                              const updated = [...formDeliverables];
                              updated[dIdx] = e.target.value;
                              setFormDeliverables(updated);
                            }}
                            className="w-full bg-transparent text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setFormDeliverables(formDeliverables.filter((_, i) => i !== dIdx))}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Ce que le Client Doit Fournir (Prérequis)</label>
                        <input
                          type="text"
                          value={formClientRequirements}
                          onChange={(e) => setFormClientRequirements(e.target.value)}
                          placeholder="Ex: Pseudo Discord, Brief projet, identifiants..."
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Garantie & Engagement</label>
                        <input
                          type="text"
                          value={formGuaranteeText}
                          onChange={(e) => setFormGuaranteeText(e.target.value)}
                          placeholder="Ex: Satisfait ou retravaillé sans frais"
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: Packs Promotionnels & Offres Quantité (Packs COD - UNIQUEMENT PHYSIQUE) */}
              {formProductKind === 'PHYSICAL' && (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <PackagePlus className="w-4 h-4 text-amber-400" />
                      <span>3. Packs Promotionnels & Offres Quantité ({formPromoPacks.length} packs configurés)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configurez les offres 1 pièce, Pack Duo (-20%) et Pack Trio (1 offert) pour inciter les clients à commander plus.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormPromoPacks([
                          { id: 'pack-1', quantity: 1, title: 'Pack 1 Pièce (Standard)', price: formPrice, compareAtPrice: formComparePrice || Math.round(formPrice * 1.3), badge: '' },
                          { id: 'pack-2', quantity: 2, title: 'Pack Duo 2 Pièces (Recommandé)', price: Math.round(formPrice * 2 * 0.8), compareAtPrice: formPrice * 2, badge: 'LE PLUS POPULAIRE 🔥 -20%' },
                          { id: 'pack-3', quantity: 3, title: 'Pack Trio 3 Pièces (Offre Famille)', price: formPrice * 2, compareAtPrice: formPrice * 3, badge: 'MEILLEURE OFFRE 🎁 1 GRATUIT' },
                        ]);
                        showToast('✓ Packs automatiques recommandés générés');
                      }}
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold border border-amber-500/30 cursor-pointer"
                    >
                      ⚡ Auto-Générer Packs
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const nextQty = formPromoPacks.length + 1;
                        setFormPromoPacks([
                          ...formPromoPacks,
                          {
                            id: `pack-${Date.now()}`,
                            quantity: nextQty,
                            title: `Pack Spécial ${nextQty} Pièces`,
                            price: Math.round(formPrice * nextQty * 0.85),
                            compareAtPrice: formPrice * nextQty,
                            badge: `-15% Réduction`
                          }
                        ]);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un Pack</span>
                    </button>
                  </div>
                </div>

                {formPromoPacks.length === 0 ? (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                    Aucun pack promotionnel défini. Cliquez sur "Auto-Générer Packs" pour créer les offres 1, 2 et 3 pièces.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formPromoPacks.map((pack, idx) => (
                      <div key={pack.id} className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/80 space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="w-20 shrink-0">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Quantité</label>
                            <input
                              type="number"
                              min={1}
                              value={pack.quantity}
                              onChange={(e) => {
                                const updated = [...formPromoPacks];
                                updated[idx].quantity = Number(e.target.value);
                                setFormPromoPacks(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Titre du Pack</label>
                            <input
                              type="text"
                              value={pack.title}
                              onChange={(e) => {
                                const updated = [...formPromoPacks];
                                updated[idx].title = e.target.value;
                                setFormPromoPacks(updated);
                              }}
                              placeholder="Ex: Pack Duo 2 Pièces (Recommandé)"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                            />
                          </div>

                          <div className="w-28 shrink-0">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Prix Pack (DH)</label>
                            <input
                              type="number"
                              min={1}
                              value={pack.price}
                              onChange={(e) => {
                                const updated = [...formPromoPacks];
                                updated[idx].price = Number(e.target.value);
                                setFormPromoPacks(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-black"
                            />
                          </div>

                          <div className="w-28 shrink-0">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Prix Barré (DH)</label>
                            <input
                              type="number"
                              min={0}
                              value={pack.compareAtPrice || 0}
                              onChange={(e) => {
                                const updated = [...formPromoPacks];
                                updated[idx].compareAtPrice = Number(e.target.value);
                                setFormPromoPacks(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-400"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Badge Promo (Affiché sur bouton)</label>
                            <input
                              type="text"
                              value={pack.badge || ''}
                              onChange={(e) => {
                                const updated = [...formPromoPacks];
                                updated[idx].badge = e.target.value;
                                setFormPromoPacks(updated);
                              }}
                              placeholder="Ex: LE PLUS POPULAIRE 🔥 -20%"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-[11px]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setFormPromoPacks(formPromoPacks.filter((_, i) => i !== idx))}
                            className="self-end sm:self-center p-2 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer ce pack"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* SECTION 3: Informations Techniques (User Request: "Informations techniques") */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>3. Informations Techniques & Spécifications</span>
                  </div>
                  <span className="text-[10px] text-purple-400">Affichage garanti sur la fiche produit</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Garantie & SAV</label>
                    <input
                      type="text"
                      value={formWarranty}
                      onChange={(e) => setFormWarranty(e.target.value)}
                      placeholder="Ex: Garantie 1 an · Échange sous 7j"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Origine / Fabrication</label>
                    <input
                      type="text"
                      value={formOrigin}
                      onChange={(e) => setFormOrigin(e.target.value)}
                      placeholder="Ex: Maroc / Confection Artisanale"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Matière & Finition</label>
                    <input
                      type="text"
                      value={formMaterial}
                      onChange={(e) => setFormMaterial(e.target.value)}
                      placeholder="Ex: Acier 316L / Cuir véritable"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Poids</label>
                    <input
                      type="text"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      placeholder="Ex: 350 g"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Dimensions</label>
                    <input
                      type="text"
                      value={formDimensions}
                      onChange={(e) => setFormDimensions(e.target.value)}
                      placeholder="Ex: 20 x 14 x 5 cm"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Autonomie / Spécificités</label>
                    <input
                      type="text"
                      value={formBatteryLife}
                      onChange={(e) => setFormBatteryLife(e.target.value)}
                      placeholder="Ex: Batterie 48h / Testé 100%"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Galerie WebP & Upload Laptop (User Request: "galerie WebP need to upload png and jpg from my laptop") */}
              <div className="space-y-4 border-t border-slate-800 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>4. Galerie WebP & Upload Laptop (PNG / JPG)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Uploadez vos photos <strong>PNG ou JPG</strong> directement depuis votre laptop. Elles sont automatiquement converties en format <strong>WebP ultra-rapide</strong> pour mobile.
                    </p>
                  </div>

                  {/* Hidden file input supporting PNG, JPG, JPEG, WebP */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="admin-laptop-image-upload"
                  />

                  {/* Button to trigger file input */}
                  <label
                    htmlFor="admin-laptop-image-upload"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all shrink-0 active:scale-98"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choisir Photos Laptop (PNG / JPG)</span>
                  </label>
                </div>

                {/* Drag & Drop Dropzone */}
                <label
                  htmlFor="admin-laptop-image-upload"
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2 group ${
                    isUploading 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-slate-700 hover:border-emerald-500/80 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
                    {isUploading ? (
                      <span className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Laptop className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-white">
                    {isUploading 
                      ? 'Traitement en cours : Encodage WebP et enregistrement...' 
                      : 'Cliquez ou glissez-déposez vos fichiers PNG / JPG depuis votre laptop'}
                  </div>
                  <div className="text-[11px] text-slate-400 max-w-md">
                    Encodage WebP sans perte de netteté pour un chargement instantané sur mobile (4G/5G Maroc)
                  </div>
                </label>

                {/* Manual URL fallback */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="Ou coller une URL d'image web (https://...)..."
                      className="w-full py-2 pl-8 pr-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    disabled={!customImageUrl.trim()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700 cursor-pointer shrink-0"
                  >
                    Ajouter URL
                  </button>
                </div>

                {/* Gallery List with primary stars and badges */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Galerie du Produit ({formImages.length} photos WebP)</span>
                    <span className="text-[10px] text-emerald-400 font-normal">
                      ★ Cliquez sur l'étoile pour définir la photo principale
                    </span>
                  </div>

                  {formImages.length === 0 ? (
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                      Aucune photo dans la galerie. Ajoutez au moins une photo PNG ou JPG depuis votre ordinateur.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {formImages.map((img) => (
                        <div 
                          key={img.id} 
                          className={`relative rounded-2xl overflow-hidden border bg-slate-900 group transition-all ${
                            img.isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="aspect-square w-full overflow-hidden bg-slate-950">
                            <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>

                          {/* Primary Badge */}
                          {img.isPrimary && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md shadow-sm">
                              Principale
                            </span>
                          )}

                          {/* WebP Format Badge */}
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-slate-950/80 text-emerald-400 text-[8px] font-mono rounded">
                            WebP
                          </span>

                          {/* Delete Photo */}
                          <button
                            type="button"
                            onClick={() => setFormImages(formImages.filter(i => i.id !== img.id))}
                            className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-md transition-transform hover:scale-110 cursor-pointer"
                            title="Supprimer la photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Set Primary Button */}
                          {!img.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(img.id)}
                              className="absolute bottom-2 left-2 py-1 px-2 bg-slate-900/90 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Star className="w-3 h-3" />
                              <span>Définir Principale</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: Variantes (User Request: "variantes") */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>5. Variantes (Tailles, Modèles, Couleurs & Stocks)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une Variante</span>
                  </button>
                </div>

                {formVariants.length === 0 ? (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                    Aucune variante spécifique. Le produit sera vendu comme article unique. Cliquez sur "Ajouter une Variante" pour définir des tailles ou coloris.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formVariants.map((v, i) => (
                      <div key={v.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/80 text-xs">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Titre / Modèle</label>
                          <input
                            type="text"
                            value={v.title}
                            onChange={(e) => {
                              const updated = [...formVariants];
                              updated[i].title = e.target.value;
                              setFormVariants(updated);
                            }}
                            placeholder="Ex: Taille XL / Noir Mat"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                          />
                        </div>

                        <div className="w-full sm:w-28">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Taille / Option</label>
                          <input
                            type="text"
                            value={v.sizeOption || ''}
                            onChange={(e) => {
                              const updated = [...formVariants];
                              updated[i].sizeOption = e.target.value;
                              setFormVariants(updated);
                            }}
                            placeholder="Ex: L, XL, 42..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                          />
                        </div>

                        <div className="w-full sm:w-36">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] text-slate-400">Couleur</label>
                            {v.colorHex && (
                              <span 
                                className="w-2.5 h-2.5 rounded-full inline-block border border-slate-600 shadow-xs" 
                                style={{ backgroundColor: v.colorHex }}
                              />
                            )}
                          </div>
                          <input
                            type="text"
                            value={v.colorOption || ''}
                            onChange={(e) => {
                              const updated = [...formVariants];
                              updated[i].colorOption = e.target.value;
                              setFormVariants(updated);
                            }}
                            placeholder="Ex: Noir, Or, Argent..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                          />
                          {/* Quick Swatch Palette */}
                          <div className="flex items-center gap-1 mt-1">
                            {[
                              { name: 'Noir', hex: '#0f172a' },
                              { name: 'Or', hex: '#d97706' },
                              { name: 'Argent', hex: '#94a3b8' },
                              { name: 'Bleu', hex: '#1e3a8a' },
                              { name: 'Vert', hex: '#059669' },
                              { name: 'Blanc', hex: '#f8fafc' },
                            ].map((sw) => (
                              <button
                                key={sw.name}
                                type="button"
                                title={`Appliquer couleur ${sw.name}`}
                                onClick={() => {
                                  const updated = [...formVariants];
                                  updated[i].colorOption = sw.name;
                                  updated[i].colorHex = sw.hex;
                                  setFormVariants(updated);
                                }}
                                className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-125 transition-transform cursor-pointer shrink-0"
                                style={{ backgroundColor: sw.hex }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="w-full sm:w-24">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Prix (DH)</label>
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...formVariants];
                              updated[i].price = Number(e.target.value);
                              setFormVariants(updated);
                            }}
                            placeholder="Prix"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-black"
                          />
                        </div>

                        <div className="w-full sm:w-20">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] text-slate-400">Stock</label>
                            {v.stockQuantity < 5 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" title="Stock faible" />
                            )}
                          </div>
                          <input
                            type="number"
                            value={v.stockQuantity}
                            onChange={(e) => {
                              const updated = [...formVariants];
                              updated[i].stockQuantity = Number(e.target.value);
                              setFormVariants(updated);
                            }}
                            placeholder="Stock"
                            className={`w-full bg-slate-900 border rounded-lg p-2 font-bold ${
                              v.stockQuantity < 5 ? 'border-amber-500/50 text-amber-300' : 'border-slate-700 text-white'
                            }`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setFormVariants(formVariants.filter((_, idx) => idx !== i))}
                          className="self-end sm:self-center p-2 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la variante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 6: SEO & Statut */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>6. SEO & Publication</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Titre SEO (Meta Title)</label>
                    <input
                      type="text"
                      value={formSeoTitle}
                      onChange={(e) => setFormSeoTitle(e.target.value)}
                      placeholder="Titre indexable pour Google et réseaux sociaux"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Statut du Produit</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="PUBLISHED">Publié (En ligne sur la boutique)</option>
                      <option value="DRAFT">Brouillon (Non visible par les clients)</option>
                      <option value="ARCHIVED">Archivé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Enregistrer dans PostgreSQL' : 'Publier le Produit (PostgreSQL)'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Hidden input for description media uploads */}
      <input
        type="file"
        ref={descMediaFileRef}
        onChange={handleDescMediaFileSelect}
        className="hidden"
        id="desc-media-file-input"
        accept={
          mediaModalType === 'video'
            ? 'video/mp4,video/webm,video/quicktime'
            : mediaModalType === 'gif'
              ? 'image/gif'
              : 'image/png,image/jpeg,image/webp'
        }
      />

      {/* Description Rich Media Modal (Images, GIFs, Videos) */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  mediaModalType === 'video'
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    : mediaModalType === 'gif'
                      ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}>
                  {mediaModalType === 'video' ? (
                    <Film className="w-5 h-5" />
                  ) : mediaModalType === 'gif' ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {mediaModalType === 'video' 
                      ? 'Ajouter une Vidéo à la Description'
                      : mediaModalType === 'gif'
                        ? 'Ajouter un GIF Animé à la Description'
                        : 'Ajouter une Image à la Description'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sera inséré à la fin de la description et formaté pour mobile
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setMediaTab('upload')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mediaTab === 'upload' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Téléverser Fichier
              </button>
              <button
                type="button"
                onClick={() => setMediaTab('url')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mediaTab === 'url' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Lien URL / YouTube
              </button>
              <button
                type="button"
                onClick={() => setMediaTab('presets')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mediaTab === 'presets' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                3. Exemples & Préréglages
              </button>
            </div>

            {/* Tab 1: Upload from device */}
            {mediaTab === 'upload' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Légende ou Titre explicatif (optionnel)
                  </label>
                  <input
                    type="text"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder="Ex: Déballage du coffret, test en conditions réelles..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <label
                  htmlFor="desc-media-file-input"
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2 group ${
                    isUploadingDescMedia
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-700 hover:border-purple-500/80 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-purple-400 transition-colors">
                    {isUploadingDescMedia ? (
                      <span className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isUploadingDescMedia 
                        ? 'Envoi et optimisation en cours...' 
                        : `Cliquez pour choisir un fichier ${mediaModalType === 'video' ? 'vidéo (MP4, WebM)' : (mediaModalType === 'gif' ? 'GIF animé' : 'image (PNG, JPG, WebP)')}`}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Fichier local depuis votre ordinateur ou téléphone
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Tab 2: URL input */}
            {mediaTab === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {mediaModalType === 'video'
                      ? 'Lien Vidéo (YouTube, Vimeo ou lien direct MP4)'
                      : mediaModalType === 'gif'
                        ? 'Lien du GIF Animé (Giphy, Tenor, URL directe .gif)'
                        : 'Lien de l\'image (URL directe .jpg, .png, .webp)'}
                  </label>
                  <input
                    type="url"
                    value={mediaInputUrl}
                    onChange={(e) => setMediaInputUrl(e.target.value)}
                    placeholder={
                      mediaModalType === 'video'
                        ? 'https://www.youtube.com/watch?v=... ou https://.../video.mp4'
                        : mediaModalType === 'gif'
                          ? 'https://media.giphy.com/media/.../giphy.gif'
                          : 'https://images.unsplash.com/...'
                    }
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Légende sous le média (optionnelle)
                  </label>
                  <input
                    type="text"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder="Ex: Présentation vidéo officielle, Zoom sur la matière..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleInsertMediaUrl}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insérer dans la Description</span>
                </button>
              </div>
            )}

            {/* Tab 3: Presets & Templates */}
            {mediaTab === 'presets' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Sélectionnez un modèle testé pour le e-commerce mobile afin de captiver vos visiteurs :
                </p>

                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {mediaModalType === 'gif' && [
                    {
                      title: 'Rotation 360° & Détails Haute Précision',
                      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
                      caption: 'Vue interactive à 360° du produit sous tous les angles'
                    },
                    {
                      title: 'Déballage & Packaging Coffret Cadeau',
                      url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
                      caption: 'Coffret rigide de protection avec carte d\'authenticité'
                    },
                    {
                      title: 'Test de Résistance & Finition Imperméable',
                      url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
                      caption: 'Test d\'étanchéité et résistance aux chocs'
                    }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const tag = `[gif: ${p.url} | ${p.caption}]`;
                        setFormDesc(prev => `${prev.trim() ? prev.trim() + '\n\n' : ''}${tag}\n`);
                        showToast(`✓ Modèle GIF "${p.title}" inséré !`);
                        setIsMediaModalOpen(false);
                      }}
                      className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-purple-300">{p.title}</div>
                        <div className="text-[11px] text-slate-400">{p.caption}</div>
                      </div>
                      <Plus className="w-4 h-4 text-purple-400 shrink-0" />
                    </button>
                  ))}

                  {mediaModalType === 'video' && [
                    {
                      title: 'Vidéo Démonstration & Utilisation Pratique',
                      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
                      caption: 'Guide pas-à-pas et conseils d\'entretien par notre équipe'
                    },
                    {
                      title: 'Teaser Cinématique & Savoir-Faire Artisanal',
                      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                      caption: 'Coulisses de confection et finitions manuelles'
                    }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const tag = `[video: ${p.url} | ${p.caption}]`;
                        setFormDesc(prev => `${prev.trim() ? prev.trim() + '\n\n' : ''}${tag}\n`);
                        showToast(`✓ Vidéo "${p.title}" insérée !`);
                        setIsMediaModalOpen(false);
                      }}
                      className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-rose-300">{p.title}</div>
                        <div className="text-[11px] text-slate-400">{p.caption}</div>
                      </div>
                      <Plus className="w-4 h-4 text-rose-400 shrink-0" />
                    </button>
                  ))}

                  {mediaModalType === 'image' && [
                    {
                      title: 'Zoom Macro sur les Matières Nobles',
                      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
                      caption: 'Textures ultra-douces et coutures renforcées'
                    },
                    {
                      title: 'Accessoires & Contenu du Coffret',
                      url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                      caption: 'Tous les accessoires inclus dans la boîte'
                    }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const tag = `[image: ${p.url} | ${p.caption}]`;
                        setFormDesc(prev => `${prev.trim() ? prev.trim() + '\n\n' : ''}${tag}\n`);
                        showToast(`✓ Image "${p.title}" insérée !`);
                        setIsMediaModalOpen(false);
                      }}
                      className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300">{p.title}</div>
                        <div className="text-[11px] text-slate-400">{p.caption}</div>
                      </div>
                      <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Safe for sandboxed iframes & mobile) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Supprimer ce Produit ?</h3>
                <p className="text-xs text-slate-400">Action irréversible sur la base de données</p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700">
                <img 
                  src={productToDelete.images[0]?.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-xs truncate">{productToDelete.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  SKU: {productToDelete.sku} · {formatMoney(productToDelete.price)}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement « <strong className="text-white">{productToDelete.name}</strong> » du catalogue et de la base de données PostgreSQL ? Ses variantes et photos WebP associées seront également retirées.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Oui, Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
