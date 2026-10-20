import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff, Wifi } from 'lucide-react';

// Tells mobile shoppers when their connection drops (tunnel, weak 3G) and when it is back
export const ConnectionBanner: React.FC = () => {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const goOnline = () => {
      setOnline(true);
      setShowBack(true);
      timer = setTimeout(() => setShowBack(false), 2500);
    };
    const goOffline = () => {
      clearTimeout(timer);
      setShowBack(false);
      setOnline(false);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const visible = !online || showBack;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          className={`fixed top-0 inset-x-0 z-[70] pt-[env(safe-area-inset-top)] text-white text-xs font-bold ${online ? 'bg-emerald-600' : 'bg-slate-900'}`}
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4">
            {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>
              {online
                ? 'Connexion rétablie'
                : 'Pas de connexion internet. Votre panier et vos commandes sont gardés sur votre téléphone.'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
