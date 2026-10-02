import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Product, ProductVariant, ProductImage, ProductStatus, TechnicalSpecs, PromoPack } from '../../types/ecommerce';
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
  AlertCircle
} from 'lucide-react';

export const ProductsAdminView: React.FC = () => {
  const { currentUser, formatMoney, showToast, navigateToProduct, getProductShareUrl } = useApp();
  const [products, setProducts] = useState<Product[]>(dbService.products);
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
  const [formStock, setFormStock] = useState<number>(20);
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
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

  const categories = dbService.categories;

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

  // Filtered products list
  const filtered = products.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    }
    return true;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`);
    setFormBrand('ShopMe');
    const firstCat = categories[0];
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
    setFormCategoryId(p.categoryId);
    setFormCategoryName(p.categoryName || '');
    setFormSubcategoryId(p.subcategoryId || '');
    setFormSubcategoryName(p.subcategoryName || '');
    setIsCustomSubcategory(false);
    setCustomSubcategoryInput('');
    setFormPrice(p.price);
    setFormComparePrice(p.compareAtPrice || 0);
    setFormCostPrice(p.costPrice || 0);
    setFormStock(p.stockQuantity);
    setFormShortDesc(p.shortDescription);
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
      stockQuantity: totalVariantStock,
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
      variants: formVariants,
      promoPacks: formPromoPacks,
      technicalSpecs,
      rating: editingProduct?.rating || 5.0,
      reviewsCount: editingProduct?.reviewsCount || 0,
      viewCount: editingProduct?.viewCount || 0,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbService.saveProduct(saved, currentUser);
    setProducts([...dbService.products]);
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
            placeholder="Rechercher par nom, SKU ou marque..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Catégorie</th>
                <th className="py-3 px-4 font-semibold">Prix (DH)</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Variantes</th>
                <th className="py-3 px-4 font-semibold">Fiche Technique</th>
                <th className="py-3 px-4 font-semibold">Statut</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(p => (
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
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{p.sku}</td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="font-semibold text-white">{p.categoryName}</div>
                    {p.subcategoryName && (
                      <div className="text-[10px] text-blue-400 font-medium">↳ {p.subcategoryName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-black text-white">{formatMoney(p.price)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      p.stockQuantity > 10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {p.stockQuantity} en stock
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {p.variants.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold text-[10px]">
                        {p.variants.length} variantes
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Unique</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {p.technicalSpecs?.warranty ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Fiche Renseignée</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Standard</span>
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
              ))}
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
                      placeholder="Ex: Montre Royal Chronographe Homme"
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
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Catégorie *</label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        setFormCategoryId(newCatId);
                        const selectedCat = categories.find(c => c.id === newCatId);
                        setFormCategoryName(selectedCat?.name || '');
                        if (selectedCat?.subcategories && selectedCat.subcategories.length > 0) {
                          setFormSubcategoryId(selectedCat.subcategories[0].id);
                          setFormSubcategoryName(selectedCat.subcategories[0].name);
                          setIsCustomSubcategory(false);
                        } else {
                          setFormSubcategoryId('');
                          setFormSubcategoryName('');
                        }
                      }}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
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
                        placeholder="Ex: Smartwatches, Écouteurs sans fil, Parfums Oud..."
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
                            setFormSubcategoryId(val);
                            const found = categories.find(c => c.id === formCategoryId)?.subcategories?.find(s => s.id === val);
                            setFormSubcategoryName(found?.name || '');
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

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Description Complète</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Fiche technique détaillée, conseils d'utilisation, matières et finitions..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
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
              </div>

              {/* SECTION 3: Packs Promotionnels & Offres Quantité (Packs COD) */}
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
