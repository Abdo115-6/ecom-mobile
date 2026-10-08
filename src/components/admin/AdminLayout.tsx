import React, { useState } from 'react';
import { useApp, ActiveView } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Boxes, 
  ShoppingCart, 
  Users, 
  Star, 
  Tag, 
  Activity, 
  BrainCircuit, 
  MessageCircle, 
  ShieldAlert, 
  History, 
  Settings, 
  ArrowLeft, 
  Menu, 
  X, 
  ChevronRight, 
  ShieldCheck,
  LogOut,
  ChevronDown,
  Lock,
  Calculator
} from 'lucide-react';
import { RoleName } from '../../types/ecommerce';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { currentView, setCurrentView, currentUser, switchUserRole, adminLogout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navigationItems: Array<{
    id: ActiveView;
    label: string;
    icon: React.ReactNode;
    category: string;
    badge?: string;
  }> = [
    // Dashboard
    { id: 'admin-dashboard', label: 'Vue Générale', icon: <LayoutDashboard className="w-4 h-4" />, category: 'Pilotage' },
    
    // Catalog & Stock
    { id: 'admin-products', label: 'Produits & Variantes', icon: <Package className="w-4 h-4" />, category: 'Catalogue' },
    { id: 'admin-categories', label: 'Catégories', icon: <FolderTree className="w-4 h-4" />, category: 'Catalogue' },
    { id: 'admin-inventory', label: 'Stock & Mouvements', icon: <Boxes className="w-4 h-4" />, category: 'Catalogue', badge: 'Audit IN/OUT' },
    { id: 'admin-calculation', label: 'Calculation (Rentabilité)', icon: <Calculator className="w-4 h-4 text-emerald-400" />, category: 'Catalogue', badge: 'Marge & Profit' },
    
    // Sales
    { id: 'admin-orders', label: 'Commandes', icon: <ShoppingCart className="w-4 h-4" />, category: 'Ventes' },
    { id: 'admin-customers', label: 'Clients & Base', icon: <Users className="w-4 h-4" />, category: 'Ventes' },
    { id: 'admin-reviews', label: 'Modération Avis', icon: <Star className="w-4 h-4" />, category: 'Engagement' },

    // Marketing & Tracking
    { id: 'admin-marketing', label: 'Coupons & Bannières', icon: <Tag className="w-4 h-4" />, category: 'Marketing' },
    { id: 'admin-tracking', label: 'Tracking & Déduplication', icon: <Activity className="w-4 h-4 text-emerald-400" />, category: 'Marketing', badge: 'Live CAPI' },
    { id: 'admin-datamining', label: 'Data Mining & Mouvements Clients', icon: <BrainCircuit className="w-4 h-4 text-amber-400" />, category: 'Intelligence & BI', badge: '⚡ Leads Perdus' },
    { id: 'admin-whatsapp', label: 'WhatsApp Bot Baileys (IA)', icon: <MessageCircle className="w-4 h-4 text-emerald-400" />, category: 'Canaux', badge: 'QR Bot 🇲🇦' },

    // System & RBAC
    { id: 'admin-users', label: 'Utilisateurs & Rôles', icon: <ShieldAlert className="w-4 h-4" />, category: 'Administration' },
    { id: 'admin-audit', label: 'Journal des Audits', icon: <History className="w-4 h-4" />, category: 'Administration' },
    { id: 'admin-settings', label: 'Paramètres du Store', icon: <Settings className="w-4 h-4" />, category: 'Administration' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size="sm" variant="dark" subtitleText="BACK-OFFICE" />
        </div>

        <button
          onClick={() => {
            window.history.pushState(null, '', '/');
            setCurrentView('home');
          }}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Boutique</span>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200
        md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Brand & Secret URL Badge */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="dark" subtitleText="BACK-OFFICE MAROC" />
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Admin User Badge & RBAC Role Switcher */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white text-xs">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="text-[10px] text-amber-400 font-semibold">{currentUser.role}</div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/20">
              En ligne
            </span>
          </div>

          {/* Quick RBAC Simulator inside Admin */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] font-medium border border-slate-700/60 cursor-pointer"
            >
              <span>Changer rôle : <strong>{currentUser.role}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1.5 z-50 text-xs">
                {(['SUPER_ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'MARKETING_MANAGER', 'SUPPORT', 'ANALYST'] as RoleName[]).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      switchUserRole(role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors cursor-pointer text-[11px] ${
                      currentUser.role === role ? 'font-bold text-white bg-blue-600' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigationItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Return to Storefront & Logout */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => {
              window.history.pushState(null, '', '/');
              setCurrentView('home');
            }}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voir la Boutique en Direct</span>
          </button>

          <button
            onClick={adminLogout}
            className="w-full py-2 px-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-rose-500/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion Sécurisée</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-900 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

    </div>
  );
};
