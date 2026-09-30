import React, { useState, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { Category } from '../../types/ecommerce';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Laptop, 
  Link as LinkIcon,
  Layers,
  CheckCircle2,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CategoriesAdminView: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const [categories, setCategories] = useState<Category[]>(dbService.categories);
  
  // Modals & Selection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ cat: Category; parentId?: string } | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formParentId, setFormParentId] = useState<string>(''); // empty string = main root category
  
  // Picture Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read file from laptop
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Convert image to optimized WebP format
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

  // Upload handler for laptop images (PNG/JPG)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];
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

      setFormImageUrl(finalImageUrl);
      showToast("✓ Photo PNG/JPG convertie en WebP et téléversée avec succès");
    } catch (err) {
      console.error('Category image upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open Create Modal
  const openCreateModal = (parentId = '') => {
    setEditingCategory(null);
    setFormParentId(parentId);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormImageUrl("https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80");
    setFormDisplayOrder(parentId ? 1 : categories.length + 1);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit ("Modifier") Modal
  const openEditModal = (cat: Category, parentId = '') => {
    setEditingCategory(cat);
    setFormParentId(parentId || cat.parentId || '');
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDesc(cat.description || '');
    setFormImageUrl(cat.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80");
    setFormDisplayOrder(cat.displayOrder || 1);
    setFormIsActive(cat.isActive ?? true);
    setIsModalOpen(true);
  };

  // Save Category (Create or Update)
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const slug = formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const catId = editingCategory ? editingCategory.id : `cat-${Date.now()}`;

    const catData: Category = {
      id: catId,
      parentId: formParentId || null,
      name: formName.trim(),
      slug,
      description: formDesc.trim(),
      imageUrl: formImageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      displayOrder: Number(formDisplayOrder),
      isActive: formIsActive,
      subcategories: editingCategory?.subcategories || []
    };

    dbService.saveCategory(catData, currentUser);
    setCategories([...dbService.categories]);
    setIsModalOpen(false);
    showToast(editingCategory ? `Catégorie « ${catData.name} » modifiée avec succès` : `Nouvelle catégorie « ${catData.name} » créée`);
  };

  // Delete Category (Confirm Execution)
  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    const { cat, parentId } = categoryToDelete;

    dbService.deleteCategory(cat.id, parentId, currentUser);
    setCategories([...dbService.categories]);
    setCategoryToDelete(null);
    showToast(`✓ Catégorie « ${cat.name} » supprimée`);
  };

  // Quick Toggle Active
  const handleToggleActive = (cat: Category, parentId = '') => {
    const updated = { ...cat, isActive: !cat.isActive };
    dbService.saveCategory(updated, currentUser);
    setCategories([...dbService.categories]);
    showToast(`Catégorie « ${cat.name} » ${updated.isActive ? 'activée' : 'désactivée'}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-blue-500" />
            <span>Gestion de l'Arborescence des Catégories</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hiérarchie multi-niveaux, sous-catégories et ordre d'affichage sur mobile
          </p>
        </div>

        <button
          onClick={() => openCreateModal('')}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Catégorie Principale</span>
        </button>
      </div>

      {/* Main Categories Tree List */}
      <div className="space-y-4">
        {categories.map((cat, idx) => (
          <div key={cat.id} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm hover:border-slate-600 transition-all">
            
            {/* Category Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative group shadow-inner">
                  <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 bg-slate-950/80 text-[8px] font-mono text-emerald-400 px-1 rounded-tl">
                    WebP
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-sm sm:text-base">{cat.name}</h3>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md text-[10px] font-mono font-bold">
                      Ordre #{cat.displayOrder || idx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      cat.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {cat.isActive ? 'Active' : 'Masquée'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-md line-clamp-1">{cat.description || 'Aucune description'}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">slug: /{cat.slug}</p>
                </div>
              </div>

              {/* Action Buttons for Main Category */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={() => openCreateModal(cat.id)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                  title="Ajouter une sous-catégorie sous ce parent"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Sous-catégorie</span>
                </button>

                <button
                  onClick={() => handleToggleActive(cat)}
                  className="p-2 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 cursor-pointer"
                  title={cat.isActive ? "Masquer sur mobile" : "Afficher sur mobile"}
                >
                  {cat.isActive ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                <button
                  onClick={() => openEditModal(cat)}
                  className="p-2 bg-slate-900 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700 cursor-pointer"
                  title="Modifier la catégorie et changer sa photo WebP"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button
                  onClick={() => setCategoryToDelete({ cat })}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors border border-rose-500/20 cursor-pointer"
                  title="Supprimer la catégorie"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Subcategories (Hiérarchie multi-niveaux) */}
            {cat.subcategories && cat.subcategories.length > 0 ? (
              <div className="pl-4 sm:pl-6 pt-3 border-t border-slate-700/50 space-y-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>Sous-catégories associées ({cat.subcategories.length}) :</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {cat.subcategories.map(sub => (
                    <div 
                      key={sub.id} 
                      className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-2 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                          <img src={sub.imageUrl || cat.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-200 text-xs truncate">{sub.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">/{sub.slug}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(sub, cat.id)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Modifier la sous-catégorie"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete({ cat: sub, parentId: cat.id })}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la sous-catégorie"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pl-4 pt-2 border-t border-slate-700/40 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Aucune sous-catégorie. Cette catégorie est affichée directement au premier niveau sur mobile.</span>
                <button
                  onClick={() => openCreateModal(cat.id)}
                  className="text-blue-400 hover:underline text-[11px] cursor-pointer"
                >
                  + Ajouter sous-catégorie
                </button>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* CREATE & EDIT MODAL (Photo upload, WebP, hierarchy & order) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingCategory ? 'Modifier la Catégorie' : (formParentId ? 'Créer une Sous-Catégorie' : 'Créer une Catégorie Principale')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestion photo WebP, ordre d'affichage sur mobile et arborescence
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              
              {/* Parent Category Selector */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Type d'arborescence *</label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none cursor-pointer"
                >
                  <option value="">📁 Catégorie Principale (Niveau 1)</option>
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        ↳ Sous-catégorie de : {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nom de la catégorie *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Montres & Horlogerie"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="Ex: montres-horlogerie"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description (Sous-titre mobile)</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Chronographes de prestige, bracelets cuir et acier inoxydable..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              {/* Picture Upload & WebP optimization */}
              <div className="space-y-3 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Photo de la catégorie (Upload Laptop PNG/JPG vers WebP)</span>
                  </label>
                </div>

                {/* Upload from Laptop button & dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="category-image-upload"
                />

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 relative shadow-inner">
                    <img src={formImageUrl} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-slate-900/90 text-[8px] font-mono text-emerald-400 px-1">
                      WebP
                    </span>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label
                      htmlFor="category-image-upload"
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      {isUploading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isUploading ? 'Conversion WebP...' : 'Importer Photo Laptop (PNG / JPG)'}</span>
                    </label>

                    {/* Or URL */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={customImageUrl}
                          onChange={(e) => setCustomImageUrl(e.target.value)}
                          placeholder="Ou coller une URL d'image web..."
                          className="w-full py-1.5 pl-7 pr-2 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-200"
                        />
                        <LinkIcon className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (customImageUrl.trim()) {
                            setFormImageUrl(customImageUrl.trim());
                            setCustomImageUrl('');
                            showToast("Photo mise à jour");
                          }
                        }}
                        disabled={!customImageUrl.trim()}
                        className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[11px] font-bold border border-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Ordre d'affichage mobile</label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Visibilité sur la boutique</label>
                  <select
                    value={formIsActive ? 'true' : 'false'}
                    onChange={(e) => setFormIsActive(e.target.value === 'true')}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Masquée (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCategory ? 'Enregistrer les Modifications' : 'Créer la Catégorie'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Safe for iframes & mobile) */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Supprimer cette Catégorie ?</h3>
                <p className="text-xs text-slate-400">Cette action retirera la catégorie de la boutique</p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700">
                <img src={categoryToDelete.cat.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">{categoryToDelete.cat.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">slug: /{categoryToDelete.cat.slug}</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Voulez-vous vraiment supprimer « <strong className="text-white">{categoryToDelete.cat.name}</strong> » ? 
              {categoryToDelete.cat.subcategories && categoryToDelete.cat.subcategories.length > 0 && (
                <span className="text-rose-400 block mt-1 font-semibold">
                  Attention : Ses {categoryToDelete.cat.subcategories.length} sous-catégories seront également supprimées.
                </span>
              )}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
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
