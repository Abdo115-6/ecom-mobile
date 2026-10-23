import React, { useEffect, useState } from 'react';
import { Truck, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface OzonStatus {
  configured: boolean;
  source: 'admin' | 'env' | 'none';
  customerId: string;
  apiKeyHint: string;
}

/** Ozon Express ID + API key: checked with Ozon by the server, then stored server-side (the key is never sent back) */
export const OzonSettingsCard: React.FC = () => {
  const { showToast } = useApp();
  const [status, setStatus] = useState<OzonStatus | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ozon/status')
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        setStatus(data);
        setCustomerId(data.customerId || '');
      })
      .catch(() => null);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/ozon/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customerId.trim(), apiKey: apiKey.trim() })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setStatus(data);
      setApiKey('');
      showToast('✓ Ozon Express connecté');
    } catch (err: any) {
      setError(err.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Ozon Express (livraison)</h2>
            <p className="text-xs text-slate-400">Ozon → Mon compte → API : copiez « Votre ID » et « Votre clé API »</p>
          </div>
        </div>
        {status?.configured ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTÉ {status.apiKeyHint}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold shrink-0">NON CONFIGURÉ</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Votre ID</label>
          <input
            type="text"
            inputMode="numeric"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            placeholder="101756"
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Votre clé API</label>
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx"
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
            required
          />
        </div>
      </div>

      {error && <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">{error}</div>}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        <span>Vérifier & enregistrer</span>
      </button>
    </form>
  );
};
