import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie } from 'lucide-react';
import { consentService } from '../../services/consentService';

export const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  // Shown shortly after landing so it does not compete with the first paint
  useEffect(() => {
    if (consentService.get() !== 'pending') return;
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const choose = (choice: 'granted' | 'denied') => {
    consentService.set(choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Cookies"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed inset-x-3 bottom-20 md:bottom-6 md:left-6 md:right-auto md:max-w-sm z-[60] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-900 text-sm mb-1">Votre expérience, en mieux</p>
              Nous utilisons des cookies pour mémoriser votre panier, mesurer l'audience et vous montrer des offres adaptées sur Facebook, Instagram et TikTok.
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => choose('denied')}
              data-track="cookies_refuse"
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Refuser
            </button>
            <button
              onClick={() => choose('granted')}
              data-track="cookies_accept"
              className="flex-[2] px-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Accepter et continuer
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
