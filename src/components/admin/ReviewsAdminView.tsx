import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Review, ReviewStatus } from '../../types/ecommerce';
import { Star, Check, X, MessageSquare, Trash2 } from 'lucide-react';

export const ReviewsAdminView: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const [reviews, setReviews] = useState<Review[]>(dbService.reviews);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filtered = reviews.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const handleModerate = (id: string, status: ReviewStatus) => {
    dbService.moderateReview(id, status, currentUser);
    setReviews([...dbService.reviews]);
    showToast(`Avis ${status === 'APPROVED' ? 'approuvé et publié' : 'rejeté'}`);
  };

  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;
    dbService.moderateReview(id, 'APPROVED', currentUser, replyText);
    setReviews([...dbService.reviews]);
    setReplyReviewId(null);
    setReplyText('');
    showToast("Réponse officielle enregistrée et publiée");
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Modération des Avis Clients</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Validation anti-spam, conformité légale et réponses officielles de l'entreprise
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="all">Tous les avis ({reviews.length})</option>
          <option value="PENDING">En attente (Pending)</option>
          <option value="APPROVED">Approuvés (Publics)</option>
          <option value="REJECTED">Rejetés</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filtered.map(rev => (
          <div
            key={rev.id}
            className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
              <div>
                <div className="font-extrabold text-sm text-white">{rev.productName}</div>
                <div className="text-xs text-slate-400">
                  Par <strong className="text-slate-200">{rev.customerName}</strong> le {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-600'}`}
                    />
                  ))}
                </div>

                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                  rev.status === 'APPROVED' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : rev.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {rev.status}
                </span>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-200">{rev.title}</div>
            <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
              "{rev.comment}"
            </p>

            {rev.adminReply && (
              <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs space-y-1">
                <div className="font-bold text-blue-400 text-[11px]">Réponse officielle :</div>
                <p className="text-slate-300 text-[11px]">{rev.adminReply}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setReplyReviewId(rev.id)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Répondre officiellement</span>
              </button>

              <div className="flex items-center gap-2">
                {rev.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleModerate(rev.id, 'APPROVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approuver</span>
                  </button>
                )}

                {rev.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleModerate(rev.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Rejeter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Reply Input Drawer */}
            {replyReviewId === rev.id && (
              <div className="pt-3 border-t border-slate-700/80 space-y-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Rédigez la réponse officielle de la boutique..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setReplyReviewId(null)}
                    className="px-3 py-1 text-slate-400 hover:text-white text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleSendReply(rev.id)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
                  >
                    Publier la réponse
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
