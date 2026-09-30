import React, { useState } from 'react';
import { dbService } from '../../services/dbService';
import { History, Shield, Search } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs] = useState(dbService.auditLogs);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entityName.toLowerCase().includes(q) ||
      log.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">Journal d'Audit Système (Audit Trail)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Historique immuable de chaque action administrative (CREATE, UPDATE, DELETE, APPROVE, REJECT)
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrer les audits..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-4 font-semibold">Date & Heure</th>
                <th className="py-3 px-4 font-semibold">Utilisateur</th>
                <th className="py-3 px-4 font-semibold">Rôle RBAC</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entité</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Adresse IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{log.userName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-900 text-amber-400 rounded-md font-mono text-[10px]">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      log.action === 'CREATE' || log.action === 'APPROVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : log.action === 'DELETE' || log.action === 'REJECT'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{log.entityName}</td>
                  <td className="py-3 px-4 text-slate-300 max-w-sm truncate">{log.summary}</td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
