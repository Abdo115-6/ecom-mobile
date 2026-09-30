import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  Server, 
  Database, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const AdminLoginView: React.FC = () => {
  const { adminLogin, setCurrentView } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await adminLogin(email, password);
      setLoading(false);
      if (!success) {
        setError("Identifiants incorrects. Accès strictement réservé à abdo@store.com.");
      }
    } catch {
      setLoading(false);
      setError("Erreur de connexion au serveur d'authentification.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between z-10">
        <button
          onClick={() => {
            window.history.pushState(null, '', '/');
            setCurrentView('home');
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-2 rounded-xl bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la Boutique ShopMe</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
          <Lock className="w-3.5 h-3.5" />
          <span>Accès Restreint : /adminonly</span>
        </div>
      </div>

      {/* Center Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10 space-y-6">
        
        {/* Crest & Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="xl" variant="dark" subtitleText="BACK-OFFICE & DATA INTELLIGENCE" />
          </div>
          <p className="text-xs text-slate-400">
            Portail de pilotage e-commerce & Data Mining · Accès Privé
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Adresse E-mail Administrateur</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@store.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Mot de Passe</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Accéder au Back-Office ShopMe</span>
                </>
              )}
            </button>
          </form>

            {/* Security Notice for Fetchers and Crawlers */}
            <div className="pt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session chiffrée SSL · Accès réservé et tracé</span>
            </div>
          </div>

        {/* Database & Architecture Specification Badge */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Moteur Relationnel & Mining Actif</span>
          </div>
          <p className="leading-relaxed">
            <strong className="text-white">PostgreSQL 16</strong> combiné au moteur de détection des abandons de formulaires en direct et capture des leads non finalisés.
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-[11px] text-slate-500 z-10 py-2">
        ShopMe Maroc · Back-Office Sécurisé Réservé au Personnel Autorisé
      </div>

    </div>
  );
};
