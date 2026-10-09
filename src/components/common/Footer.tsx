import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
import { whatsappService } from '../../services/whatsappService';
import { MessageCircle } from 'lucide-react';
import { dbService } from '../../services/dbService';

export const Footer: React.FC = () => {
  const { setCurrentView, setSelectedCategorySlug } = useApp();
  const categories = dbService.categories;

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-16 pb-20 md:pb-10 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Logo size="md" variant="dark" />
            <span className="text-[10px] tracking-widest uppercase text-slate-500 font-bold mt-2">
              BOUTIQUE OFFICIELLE MAROC
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategorySlug(cat.slug);
                  setCurrentView('catalog');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div>
            <a
              href={whatsappService.generateSupportLink('Salam ShopMe Maroc, je souhaite passer une commande.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp (+212 668-381916)</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} ShopMe Maroc. Tous droits réservés.
          </div>
          <div className="text-[11px] text-slate-400">
            Livraison 24h-48h partout au Maroc · Paiement Cash à la Livraison
          </div>
        </div>

      </div>
    </footer>
  );
};
