import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { ReviewStatus } from '../../types/ecommerce';
import { Star, Check, X, MessageSquare, Trash2, RefreshCw, ShieldCheck, Plus } from 'lucide-react';

// Reviews live on the server (sent from the product page, or added here from a WhatsApp message).
// Nothing is public until it is approved here.

interface ServerReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  city?: string;
  phone?: string;
  rating: number;
  comment: string;
  verified?: boolean;
  status: ReviewStatus;
  adminReply?: string;
  source?: 'site' | 'whatsapp';
  createdAt: string;
}

export const ReviewsAdminView: React.FC = () => {
  const { showToast } = useApp();
  const [reviews, setReviews] = useState<ServerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', customerName: '', city: '', phone: '', rating: 5, comment: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(res.status === 401 ? 'Session admin expirée' : data.message || `HTTP ${res.status}`);
      setReviews([...(data.review || [])].sort((a: ServerReview, b: ServerReview) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err: any) {
      showToast(`Avis non chargés : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const save = async (review: ServerReview): Promise<boolean> => {
    try {
      const res = await fetch('/api/finance/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
      setReviews(prev => [data.entry, ...prev.filter(r => r.id !== data.entry.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      return true;
    } catch (err: any) {
      showToast(`Enregistrement impossible : ${err.message}`);
      return false;
    }
  };

  const handleModerate = async (rev: ServerReview, status: ReviewStatus) => {
    if (await save({ ...rev, status })) showToast(`Avis ${status === 'APPROVED' ? 'approuvé et publié' : 'rejeté'}`);
  };

  const handleSendReply = async (rev: ServerReview) => {
    if (!replyText.trim()) return;
    if (await save({ ...rev, status: 'APPROVED', adminReply: replyText.trim() })) {
      setReplyReviewId(null);
      setReplyText('');
      showToast('Réponse publiée');
    }
  };

  const handleVerify = async (rev: ServerReview) => {
    const res = await fetch(`/api/reviews/${encodeURIComponent(rev.id)}/verify`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!data.success) return showToast('Vérification impossible');
    setReviews(prev => prev.map(r => (r.id === rev.id ? data.entry : r)));
    showToast(data.entry.verified ? '✓ Achat vérifié (commande livrée trouvée)' : 'Aucune commande livrée avec ce téléphone pour ce produit');
  };

  const handleDelete = async (rev: ServerReview) => {
    const res = await fetch(`/api/finance/review/${encodeURIComponent(rev.id)}`, { method: 'DELETE' });
    if (!res.ok) return showToast('Suppression impossible');
    setReviews(prev => prev.filter(r => r.id !== rev.id));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = dbService.getProductById(form.productId);
    if (!product || !form.customerName.trim() || !form.comment.trim()) return showToast('Produit, prénom et avis obligatoires');
    const ok = await save({
      id: `rev-wa-${Date.now().toString(36)}`,
      productId: product.id,
      productName: product.name,
      customerName: form.customerName.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      rating: form.rating,
      comment: form.comment.trim(),
      verified: false,
      status: 'PENDING',
      source: 'whatsapp',
      createdAt: new Date().toISOString()
    });
    if (ok) {
      showToast('Avis ajouté : vérifiez l\'achat puis approuvez-le');
      setForm(f => ({ ...f, customerName: '', city: '', phone: '', comment: '', rating: 5 }));
      setAddOpen(false);
    }
  };

  const filtered = reviews.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const pending = reviews.filter(r => r.status === 'PENDING').length;
  const field = 'w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Avis clients</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Un avis n'est publié qu'après votre approbation. « Achat vérifié » s'affiche seulement si le téléphone correspond à une commande livrée.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setAddOpen(o => !o)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            <span>Avis reçu sur WhatsApp</span>
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les avis ({reviews.length})</option>
            <option value="PENDING">En attente ({pending})</option>
            <option value="APPROVED">Publiés</option>
            <option value="REJECTED">Rejetés</option>
          </select>
          <button onClick={load} className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 cursor-pointer" aria-label="Actualiser">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {addOpen && (
        <form onSubmit={handleAdd} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
          <p className="text-[11px] text-slate-400">Copiez ici l'avis qu'un vrai client vous a envoyé (WhatsApp, Instagram…), en darija ou en français, avec son accord.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select required value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} className={field}>
              <option value="">Produit…</option>
              {dbService.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setForm(f => ({ ...f, rating: star }))} className="p-0.5 cursor-pointer" aria-label={`${star} étoiles`}>
                  <Star className={`w-5 h-5 ${star <= form.rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
            <input required placeholder="Prénom du client" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className={field} />
            <input placeholder="Ville" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={field} />
            <input placeholder="Téléphone (pour « Achat vérifié », jamais publié)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={`${field} sm:col-span-2`} />
            <textarea required dir="auto" rows={3} placeholder="Avis du client (darija ou français)" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} className={`${field} sm:col-span-2`} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddOpen(false)} className="px-3 py-1.5 text-slate-400 text-xs cursor-pointer">Annuler</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer">Ajouter</button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {!loading && filtered.length === 0 && <div className="text-xs text-slate-500 text-center py-10">Aucun avis.</div>}
        {filtered.map(rev => (
          <div key={rev.id} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-white truncate">{rev.productName}</div>
                <div className="text-xs text-slate-400">
                  Par <strong className="text-slate-200">{rev.customerName}</strong>{rev.city ? ` (${rev.city})` : ''} le {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                  {' · '}{rev.source === 'whatsapp' ? 'ajouté depuis WhatsApp' : 'envoyé sur le site'}
                  {rev.phone ? ` · ${rev.phone}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                  ))}
                </div>
                {rev.verified && <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-500/20 text-emerald-400">Achat vérifié</span>}
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                  rev.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : rev.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {rev.status === 'APPROVED' ? 'Publié' : rev.status === 'PENDING' ? 'En attente' : 'Rejeté'}
                </span>
              </div>
            </div>

            <p dir="auto" className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 whitespace-pre-line">{rev.comment}</p>

            {rev.adminReply && (
              <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs space-y-1">
                <div className="font-bold text-blue-400 text-[11px]">Votre réponse :</div>
                <p dir="auto" className="text-slate-300 text-[11px]">{rev.adminReply}</p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => { setReplyReviewId(rev.id); setReplyText(rev.adminReply || ''); }} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Répondre</span>
                </button>
                {rev.phone && !rev.verified && (
                  <button onClick={() => handleVerify(rev)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Vérifier l'achat</span>
                  </button>
                )}
                <button onClick={() => handleDelete(rev)} className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer" aria-label="Supprimer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {rev.status !== 'APPROVED' && (
                  <button onClick={() => handleModerate(rev, 'APPROVED')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                    <span>Publier</span>
                  </button>
                )}
                {rev.status !== 'REJECTED' && (
                  <button onClick={() => handleModerate(rev, 'REJECTED')} className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                    <span>Rejeter</span>
                  </button>
                )}
              </div>
            </div>

            {replyReviewId === rev.id && (
              <div className="pt-3 border-t border-slate-700/80 space-y-2">
                <textarea
                  rows={2}
                  dir="auto"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Votre réponse publique (darija ou français)…"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setReplyReviewId(null)} className="px-3 py-1 text-slate-400 hover:text-white text-xs cursor-pointer">Annuler</button>
                  <button onClick={() => handleSendReply(rev)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer">Publier la réponse</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
