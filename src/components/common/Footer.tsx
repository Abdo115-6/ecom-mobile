import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
import { whatsappService } from '../../services/whatsappService';
import { 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  MessageCircle, 
  PhoneCall, 
  MapPin, 
  Clock 
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-850 mt-12 pb-24 md:pb-12 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Assurances Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Livraison 24h - 48h</div>
              <div className="text-xs text-slate-400 mt-0.5">Partout au Maroc avec suivi de colis direct</div>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Paiement à la Livraison</div>
              <div className="text-xs text-slate-400 mt-0.5">Payez en espèces après vérification du colis</div>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Garantie & Échange</div>
              <div className="text-xs text-slate-400 mt-0.5">Satisfaction garantie avec échange facile 7 jours</div>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Support WhatsApp 7j/7</div>
              <div className="text-xs text-slate-400 mt-0.5">Conseillers dédiés pour vos commandes</div>
            </div>
          </div>
        </div>

        {/* Links & Brand Description */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-5 space-y-4">
            <Logo size="lg" variant="dark" subtitleText="BOUTIQUE OFFICIELLE MAROC" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              ShopMe Maroc est votre destination shopping de référence pour la mode masculine & féminine, l'horlogerie de luxe, les parfums orientaux raffinés et le high-tech tendance.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Casablanca · Expéditions Nationales</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Support 9h - 21h</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-white">Collections</div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setCurrentView('catalog')} className="hover:text-white transition-colors cursor-pointer">
                  Mode & Style Homme 👔
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('catalog')} className="hover:text-white transition-colors cursor-pointer">
                  Mode & Beauté Femme 👗
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('catalog')} className="hover:text-white transition-colors cursor-pointer">
                  Parfumerie Oud & Musc Royal ✨
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('catalog')} className="hover:text-white transition-colors cursor-pointer">
                  Montres Chronographes Automatiques ⌚
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-white">Service Client & Commande Directe</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Une question sur un produit ou sur votre livraison ? Contactez notre équipe directement sur WhatsApp :
            </p>
            <div>
              <a
                href={whatsappService.generateSupportLink('Salam ShopMe Maroc, je souhaite une information sur mes commandes')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Écrire sur WhatsApp (+212 6 00 00 00 00)</span>
              </a>
            </div>
            <div className="text-[11px] text-slate-500">
              Paiement à la livraison garanti · Pas besoin de carte bancaire
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} <strong>ShopMe Maroc</strong>. Tous droits réservés.
          </div>
          <div className="text-[11px] text-slate-400">
            Livraison Express dans toutes les villes : Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Oujda...
          </div>
        </div>

      </div>
    </footer>
  );
};
