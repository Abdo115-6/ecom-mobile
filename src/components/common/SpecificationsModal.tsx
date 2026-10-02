import React, { useState } from 'react';
import { ARCHITECTURE_SPECS, SpecDocument } from '../../docs/allSpecs';
import { X, FileText, Check, Copy, ChevronRight, Layers, Database, Shield, Server, Activity } from 'lucide-react';

interface SpecificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecificationsModal: React.FC<SpecificationsModalProps> = ({ isOpen, onClose }) => {
  const [selectedSpecId, setSelectedSpecId] = useState<string>('architecture');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSpec = ARCHITECTURE_SPECS.find(s => s.id === selectedSpecId) || ARCHITECTURE_SPECS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSpec.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Architecture')) return <Layers className="w-4 h-4 text-blue-500" />;
    if (category.includes('Données')) return <Database className="w-4 h-4 text-emerald-500" />;
    if (category.includes('Sécurité')) return <Shield className="w-4 h-4 text-amber-500" />;
    if (category.includes('Marketing')) return <Activity className="w-4 h-4 text-rose-500" />;
    return <Server className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Cahier des Charges & Spécifications Techniques</h2>
              <p className="text-xs text-slate-400">Architecture, ERD 24+ tables, API Spring Boot, Tracking CAPI & Data Mining</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 overflow-y-auto p-3 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
              10 Spécifications Clés
            </div>
            {ARCHITECTURE_SPECS.map(spec => (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecId(spec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                  selectedSpecId === spec.id 
                    ? 'bg-slate-900 text-white shadow-xs font-semibold' 
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <div className="mt-0.5">{getCategoryIcon(spec.category)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{spec.title}</div>
                  <div className={`text-[10px] truncate ${selectedSpecId === spec.id ? 'text-slate-300' : 'text-slate-400'}`}>
                    {spec.category}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-50 mt-1" />
              </button>
            ))}
          </div>

          {/* Document Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Spec Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {currentSpec.category}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">{currentSpec.title}</h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            {/* Spec Text Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-mono">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl font-sans text-xs text-amber-900">
                <strong>Résumé exécutif :</strong> {currentSpec.summary}
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap font-mono">
                {currentSpec.content}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Plateforme Aura Commerce – Mobile First & Marketing Intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
