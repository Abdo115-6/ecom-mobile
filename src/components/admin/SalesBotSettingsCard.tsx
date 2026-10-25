import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Save, Send, RotateCcw, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BotConfig {
  enabled: boolean;
  switchSource: 'admin' | 'env';
  hasAiKey: boolean;
  followUps: boolean;
  instructions: string;
  maxInstructions: number;
}

interface TestTurn {
  role: 'client' | 'bot';
  text: string;
  note?: string;
}

// Starter text: the owner replaces every [ ... ] with the real answer before saving
const TEMPLATE = `INFOS BOUTIQUE
- Horaires de l'équipe : [ex : 9h - 21h, 7j/7]
- Villes non livrées : [ex : aucune / Dakhla, Laâyoune]
- Frais de livraison si non indiqués sur le produit : [ex : 35 DH, gratuit dès 300 DH]
- Garantie : [ex : 7 jours échange si défaut]
- Échange / retour : [ex : possible sous 3 jours, produit non utilisé]

QUESTIONS FRÉQUENTES
- "Wach kayn f [ville] ?" → [réponse]
- "Wach ori9i / original ?" → [réponse]
- "Fin l'magasin dyalkom ?" → [ex : boutique en ligne seulement, livraison partout au Maroc]

RÈGLES
- [ex : Propose toujours le pack de 2 quand le client hésite]
- [ex : Ne promets jamais une livraison le jour même]`;

/** Settings card for the WhatsApp AI sales assistant: switch, owner rules + FAQ, and a test chat (nothing is sent to WhatsApp) */
export const SalesBotSettingsCard: React.FC = () => {
  const { showToast } = useApp();
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [followUps, setFollowUps] = useState(true);
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [turns, setTurns] = useState<TestTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [testing, setTesting] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/salesbot/config')
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        setConfig(data);
        setEnabled(data.enabled);
        setFollowUps(data.followUps !== false);
        setInstructions(data.instructions || '');
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [turns]);

  const save = async (nextEnabled = enabled, nextFollowUps = followUps) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/salesbot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled, followUps: nextFollowUps, instructions })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setConfig(data);
      setEnabled(data.enabled);
      setFollowUps(data.followUps !== false);
      showToast(data.enabled ? '✓ Bot IA activé et enregistré' : '✓ Bot IA désactivé');
    } catch (err: any) {
      setError(err.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    save(next);
  };

  const sendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || testing) return;
    const next = [...turns, { role: 'client' as const, text }];
    setTurns(next);
    setDraft('');
    setTesting(true);
    try {
      const res = await fetch('/api/salesbot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(t => ({ role: t.role, text: t.text })) })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const notes: string[] = [];
      if (data.video) notes.push(`+ envoie la vidéo démo (${data.video})`);
      const note = data.order
        ? `Commande créée : ${data.order.productSlug || data.order.product || '?'} x${data.order.quantity || 1}, ${data.order.fullName || '?'}, ${data.order.city || '?'}`
        : data.needsHuman
          ? `Passe la main à l'équipe : ${data.reason || 'demande du client'}`
          : undefined;
      if (note) notes.push(note);
      setTurns([...next, { role: 'bot', text: data.reply, note: notes.join(' · ') || undefined }]);
    } catch (err: any) {
      setTurns([...next, { role: 'bot', text: '⚠ ' + (err.message || 'Test impossible') }]);
    } finally {
      setTesting(false);
    }
  };

  const dirty = config ? instructions !== config.instructions : false;

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Bot WhatsApp IA (Salma)</h2>
            <p className="text-xs text-slate-400">Répond aux clients en darija à partir de vos produits et de vos consignes</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={saving || !config}
          className={`relative w-12 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
          aria-label={enabled ? 'Désactiver le bot' : 'Activer le bot'}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="text-[11px] font-semibold flex flex-wrap gap-2">
        <span className={`px-2.5 py-1 rounded-full ${enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
          {enabled ? 'ACTIF : répond aux clients' : 'ARRÊTÉ : ne répond pas'}
        </span>
        {config && !config.hasAiKey && (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300">GEMINI_API_KEY manquante dans Railway</span>
        )}
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={followUps}
          disabled={saving || !config}
          onChange={e => {
            setFollowUps(e.target.checked);
            save(enabled, e.target.checked);
          }}
          className="mt-0.5 accent-emerald-500"
        />
        <span>
          <span className="font-semibold text-white">Relances automatiques</span> : si le client ne répond plus, Salma le relance après 1h puis après 20h (2 relances maximum, jamais après 24h).
        </span>
      </label>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-300">Consignes & FAQ (ce que Salma doit savoir)</label>
          {!instructions.trim() && (
            <button type="button" onClick={() => setInstructions(TEMPLATE)} className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Insérer un modèle
            </button>
          )}
        </div>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={10}
          maxLength={config?.maxInstructions || 6000}
          placeholder="Ex : Livraison gratuite dès 300 DH. Pas de livraison à Dakhla. Garantie 7 jours…"
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white leading-relaxed"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Écrivez seulement des infos vraies. Les prix viennent toujours de vos produits. {instructions.length}/{config?.maxInstructions || 6000}
        </p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">{error}</div>}

      <button
        type="button"
        onClick={() => save()}
        disabled={saving || !config}
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>Enregistrer les consignes{dirty ? ' *' : ''}</span>
      </button>

      {/* Test chat: replies are generated with the saved rules, nothing is sent on WhatsApp */}
      <div className="border-t border-slate-700 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white">Tester Salma (rien n'est envoyé sur WhatsApp)</h3>
          {turns.length > 0 && (
            <button type="button" onClick={() => setTurns([])} className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Nouvelle conversation
            </button>
          )}
        </div>
        {dirty && <p className="text-[11px] text-amber-400">Enregistrez d'abord les consignes pour les tester.</p>}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 h-64 overflow-y-auto space-y-2">
          {turns.length === 0 && (
            <p className="text-[11px] text-slate-500">Écrivez comme un client, ex : « slm bch7al had cable ? » ou « واش كاين التوصيل لطنجة؟ »</p>
          )}
          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === 'client' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap ${t.role === 'client' ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-100'}`} dir="auto">
                {t.text}
                {t.note && <div className="mt-1 text-[10px] font-bold text-amber-300">{t.note}</div>}
              </div>
            </div>
          ))}
          {testing && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <div ref={chatEnd} />
        </div>
        <form onSubmit={sendTest} className="flex gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Message du client…"
            dir="auto"
            className="flex-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          />
          <button type="submit" disabled={testing || !draft.trim()} className="px-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl" aria-label="Envoyer">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
