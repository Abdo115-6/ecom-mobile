import React from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { RoleName } from '../../types/ecommerce';
import { ShieldCheck, UserCheck, ShieldAlert, KeyRound } from 'lucide-react';

export const UsersAdminView: React.FC = () => {
  const { currentUser, switchUserRole } = useApp();
  const users = dbService.users;

  const rolesMatrix: Array<{
    role: RoleName;
    title: string;
    description: string;
    permissions: string[];
  }> = [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Administrateur',
      description: 'Accès illimité absolu : gestion financière, utilisateurs admin, configuration store',
      permissions: ['all', 'users:admin', 'settings:write', 'audit:read']
    },
    {
      role: 'PRODUCT_MANAGER',
      title: 'Gestionnaire Catalogue',
      description: 'Création et mise à jour des fiches produits, prix, SEO et upload WebP',
      permissions: ['products:read', 'products:create', 'products:update', 'products:delete', 'categories:write']
    },
    {
      role: 'ORDER_MANAGER',
      title: 'Responsable Commandes & Expéditions',
      description: 'Traitement des commandes, transition des statuts et ajustement logistique du stock',
      permissions: ['orders:read', 'orders:update', 'inventory:adjust']
    },
    {
      role: 'MARKETING_MANAGER',
      title: 'Responsable Marketing & Acquisition',
      description: 'Création de coupons promos, gestion des bannières et analytics de conversion',
      permissions: ['marketing:manage', 'coupons:write', 'banners:write', 'analytics:read']
    },
    {
      role: 'ANALYST',
      title: 'Analyste BI & Data Mining',
      description: 'Lecture seule des métriques de vente, attribution UTM, segmentation RFM et exports',
      permissions: ['analytics:read', 'events:read', 'reports:export']
    },
    {
      role: 'SUPPORT',
      title: 'Support Client & Modérateur',
      description: 'Consultation des fiches clients, suivi des livraisons et réponses aux avis',
      permissions: ['orders:read', 'reviews:moderate', 'reviews:reply']
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl sm:text-2xl font-black text-white">Utilisateurs Administrateurs & Matrice RBAC</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Contrôle strict des accès fondé sur les rôles (Role-Based Access Control)
        </p>
      </div>

      {/* Current Active Role Switcher */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-amber-300 font-bold block">Rôle de session actuellement simulé :</span>
          <span className="text-white font-mono font-bold text-sm">{currentUser.role}</span>
          <span className="text-slate-400 block text-[11px] mt-0.5">
            Connecté en tant que {currentUser.firstName} {currentUser.lastName} ({currentUser.email})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['SUPER_ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'MARKETING_MANAGER', 'ANALYST', 'SUPPORT'] as RoleName[]).map(role => (
            <button
              key={role}
              onClick={() => switchUserRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentUser.role === role
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* RBAC Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rolesMatrix.map(item => (
          <div
            key={item.role}
            className={`p-5 rounded-3xl border transition-all space-y-3 ${
              currentUser.role === item.role
                ? 'bg-slate-800/90 border-amber-500/50 shadow-md'
                : 'bg-slate-800/60 border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-white font-mono">{item.role}</span>
              <KeyRound className="w-4 h-4 text-slate-400" />
            </div>

            <div className="text-xs font-bold text-slate-200">{item.title}</div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

            <div className="pt-2 border-t border-slate-700/80">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                Privilèges accordés
              </div>
              <div className="flex flex-wrap gap-1">
                {item.permissions.map(perm => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded-md font-mono text-[10px]"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
