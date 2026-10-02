import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { InventoryMovementType, InventoryMovement } from '../../types/ecommerce';
import { 
  Boxes, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  AlertTriangle, 
  Search, 
  Plus, 
  X,
  History
} from 'lucide-react';

export const InventoryAdminView: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const [products, setProducts] = useState(dbService.products);
  const [movements, setMovements] = useState<InventoryMovement[]>(dbService.inventoryMovements);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [movementType, setMovementType] = useState<InventoryMovementType>('IN');
  const [quantityChanged, setQuantityChanged] = useState<number>(10);
  const [reason, setReason] = useState('Réception commande fournisseur');

  // Inventory Aggregations
  const totalAvailable = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const lowStockCount = products.filter(p => p.stockQuantity <= 10 && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const product = dbService.getProductById(selectedProductId);
    if (!product) return;

    const qty = (movementType === 'OUT' || movementType === 'RESERVATION') 
      ? -Math.abs(quantityChanged) 
      : Math.abs(quantityChanged);

    dbService.recordInventoryMovement(
      selectedProductId,
      product.variants[0]?.title || 'Standard',
      movementType,
      qty,
      reason,
      `${currentUser.firstName} (${currentUser.role})`
    );

    setProducts([...dbService.products]);
    setMovements([...dbService.inventoryMovements]);
    setAdjustModalOpen(false);
    showToast(`Mouvement de stock (${movementType}) enregistré avec succès`);
  };

  const filteredMovements = movements.filter(m => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return m.productName.toLowerCase().includes(q) || m.reason.toLowerCase().includes(q) || m.performedBy.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Gestion des Stocks & Grand Livre des Mouvements</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Traçabilité intégrale des flux d'entrées, sorties, ajustements physiques et réservations
          </p>
        </div>

        <button
          onClick={() => setAdjustModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajuster le Stock</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
          <div className="text-xs text-slate-400">Stock Total Disponible</div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">{totalAvailable} pièces</div>
          <div className="text-[10px] text-emerald-400 mt-1">Tous produits confondus</div>
        </div>

        <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
          <div className="text-xs text-slate-400">Stock Réservé (Paniers)</div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 mt-1">4 pièces</div>
          <div className="text-[10px] text-slate-400 mt-1">Commandes en cours</div>
        </div>

        <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
          <div className="text-xs text-slate-400">Articles en Stock Faible</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{lowStockCount}</div>
          <div className="text-[10px] text-amber-400 mt-1">Seuil critique &le; 10</div>
        </div>

        <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
          <div className="text-xs text-slate-400">Ruptures Totales</div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1">{outOfStockCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Nécessite réassort</div>
        </div>
      </div>

      {/* Movement Ledger Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xs space-y-3 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Grand Livre Immuable des Mouvements (Audit Trail)</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrer les mouvements..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-3 font-semibold">Date & Heure</th>
                <th className="py-3 px-3 font-semibold">Produit</th>
                <th className="py-3 px-3 font-semibold">Type</th>
                <th className="py-3 px-3 font-semibold">Avant</th>
                <th className="py-3 px-3 font-semibold">Mouvement</th>
                <th className="py-3 px-3 font-semibold">Après</th>
                <th className="py-3 px-3 font-semibold">Motif / Justificatif</th>
                <th className="py-3 px-3 font-semibold">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredMovements.map(mov => (
                <tr key={mov.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(mov.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {mov.productName}
                    {mov.variantTitle && <span className="block text-[10px] text-slate-400">{mov.variantTitle}</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      mov.movementType === 'IN' || mov.movementType === 'RETURN'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : mov.movementType === 'OUT' || mov.movementType === 'RESERVATION'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {mov.movementType}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-mono">{mov.quantityBefore}</td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span className={mov.quantityChanged > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {mov.quantityChanged > 0 ? `+${mov.quantityChanged}` : mov.quantityChanged}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white font-mono font-bold">{mov.quantityAfter}</td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{mov.reason}</td>
                  <td className="py-3 px-3 text-slate-400">{mov.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Enregistrer un Mouvement de Stock</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Sélectionner le Produit</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock actuel: {p.stockQuantity})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Type de Mouvement</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as InventoryMovementType)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  <option value="IN">IN (Réception Fournisseur / Entrée Stock)</option>
                  <option value="OUT">OUT (Sortie Vente / Perte)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Régularisation Inventaire Physique)</option>
                  <option value="RETURN">RETURN (Retour Client)</option>
                  <option value="RESERVATION">RESERVATION (Blocage temporaire)</option>
                  <option value="RELEASE">RELEASE (Libération réservation)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Quantité</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantityChanged}
                  onChange={(e) => setQuantityChanged(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Justificatif / Motif</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Bon de livraison BL-9812 ou casse emballage"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Valider le Mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
