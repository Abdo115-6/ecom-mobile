import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { UnifiedEventPayload, TrackingStats } from '../../types/tracking';
import { CHANNEL_LABELS } from '../../services/trafficSource';
import {
  Activity,
  ShieldCheck,
  Check,
  Copy,
  Radio,
  RefreshCw,
  Users,
  Eye,
  MousePointerClick,
  Clock,
  Globe,
  Trash2,
  Search,
  Share2,
  Megaphone,
  Link2,
  MessageCircle,
  Mail,
  ShoppingBag,
  Smartphone
} from 'lucide-react';

type Range = 'today' | '24h' | '7d' | '30d';

const RANGE_LABELS: Record<Range, string> = {
  today: "Aujourd'hui",
  '24h': '24 heures',
  '7d': '7 jours',
  '30d': '30 jours'
};

const CHANNEL_STYLE: Record<string, { icon: React.ElementType; color: string }> = {
  ads: { icon: Megaphone, color: 'bg-amber-500' },
  search: { icon: Search, color: 'bg-blue-500' },
  social: { icon: Share2, color: 'bg-pink-500' },
  whatsapp: { icon: MessageCircle, color: 'bg-emerald-500' },
  email: { icon: Mail, color: 'bg-violet-500' },
  referral: { icon: Link2, color: 'bg-cyan-500' },
  direct: { icon: Globe, color: 'bg-slate-400' }
};

const STATUS_STYLE: Record<string, string> = {
  SENT: 'text-emerald-400 bg-emerald-500/10',
  FAILED: 'text-rose-400 bg-rose-500/10',
  NOT_CONFIGURED: 'text-slate-400 bg-slate-700/50',
  SKIPPED: 'text-slate-500 bg-slate-800'
};

const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}min`;
  return m > 0 ? `${m}min ${s.toString().padStart(2, '0')}s` : `${s}s`;
};

const pathOf = (url: string) => {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
};

export const TrackingInspectorView: React.FC = () => {
  const { showToast, formatMoney } = useApp();
  const [range, setRange] = useState<Range>('today');
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [events, setEvents] = useState<UnifiedEventPayload[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEventPayload | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'page_view' | 'click' | 'conversions'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch(`/api/track/stats?range=${range}`),
        fetch('/api/track/events?limit=300')
      ]);
      if (statsRes.status === 401 || eventsRes.status === 401) {
        setLoadError('Session admin expirée : reconnectez-vous pour voir le tracking');
        return;
      }
      const statsJson = await statsRes.json();
      const eventsJson = await eventsRes.json();
      if (statsJson.success) setStats(statsJson.stats);
      if (eventsJson.success) setEvents(eventsJson.events);
      setLoadError(statsJson.success ? null : statsJson.message || 'Erreur de chargement du tracking');
    } catch {
      setLoadError('Serveur de tracking injoignable');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  // Live refresh every 10 seconds
  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const handleClear = async () => {
    if (!window.confirm('Supprimer définitivement toutes les données de visites et de clics ?')) return;
    await fetch('/api/track/events', { method: 'DELETE' }).catch(() => null);
    setSelectedEvent(null);
    showToast('Données de tracking supprimées');
    load();
  };

  const handleCopyPayload = () => {
    if (selectedEvent) {
      navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredEvents = events.filter(ev => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'conversions') return !['page_view', 'click', 'heartbeat'].includes(ev.eventName);
    return ev.eventName === eventFilter;
  });

  const totalChannelSessions = stats?.channels.reduce((s, c) => s + c.sessions, 0) || 0;
  const maxTimelineVisitors = Math.max(1, ...(stats?.timeline.map(t => t.visitors) || [1]));

  const kpis = stats ? [
    { label: 'Visiteurs uniques', value: stats.uniqueVisitors.toLocaleString('fr-FR'), icon: Users, accent: 'text-blue-400' },
    { label: 'En ligne maintenant', value: stats.liveVisitors.toLocaleString('fr-FR'), icon: Radio, accent: 'text-emerald-400' },
    { label: 'Visites (sessions)', value: stats.sessions.toLocaleString('fr-FR'), icon: Activity, accent: 'text-cyan-400' },
    { label: 'Pages vues', value: stats.pageViews.toLocaleString('fr-FR'), icon: Eye, accent: 'text-violet-400' },
    { label: 'Clics', value: stats.clicks.toLocaleString('fr-FR'), icon: MousePointerClick, accent: 'text-pink-400' },
    { label: 'Durée moyenne / visite', value: formatDuration(stats.avgSessionSeconds), icon: Clock, accent: 'text-amber-400' },
    { label: 'Taux de rebond', value: `${stats.bounceRatePercent}%`, icon: Activity, accent: 'text-rose-400' },
    { label: 'Commandes · conversion', value: `${stats.purchases} · ${stats.conversionRatePercent}%`, icon: ShoppingBag, accent: 'text-emerald-400' }
  ] : [];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-black text-white">Live Event Tracking Inspector & Déduplication CAPI</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visiteurs réels, provenance (recherche, réseaux sociaux, pubs, liens), clics et temps passé · Meta CAPI, TikTok Events API, Snapchat CAPI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(RANGE_LABELS) as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                range === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
          <button
            onClick={load}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClear}
            className="p-2 bg-slate-800 hover:bg-rose-600/30 text-rose-300 rounded-lg border border-slate-700 cursor-pointer"
            title="Vider les données"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">{loadError}</div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
              <k.icon className={`w-3.5 h-3.5 ${k.accent}`} />
              <span>{k.label}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">{k.value}</div>
          </div>
        ))}
      </div>

      {stats && stats.sessions === 0 && (
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 leading-relaxed">
          Aucune visite enregistrée sur cette période. Les visites de l'administrateur (pages /adminonly et navigateur connecté à l'admin) ne sont pas comptées :
          ouvrez la boutique dans une fenêtre de navigation privée pour tester.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Traffic sources */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">D'où viennent vos visiteurs</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Détecté à partir du lien d'arrivée (UTM, fbclid, ttclid, gclid) et du site précédent</p>
          </div>

          <div className="space-y-3">
            {stats?.channels.map(c => {
              const style = CHANNEL_STYLE[c.channel] || CHANNEL_STYLE.direct;
              const pct = totalChannelSessions ? Math.round((c.sessions / totalChannelSessions) * 100) : 0;
              return (
                <div key={c.channel} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold">
                      <style.icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.label}</span>
                    </div>
                    <div className="text-slate-400 font-mono">
                      <span className="text-white font-bold">{c.sessions}</span> visites · {pct}%
                      {c.purchases > 0 && <span className="text-emerald-400"> · {c.purchases} cmd</span>}
                    </div>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${style.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {stats && stats.channels.length === 0 && <div className="text-xs text-slate-500">Pas encore de données.</div>}
          </div>

          {stats && stats.sources.length > 0 && (
            <div className="border-t border-slate-700/80 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Détail par source</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 text-left">
                    <th className="font-semibold pb-1">Source</th>
                    <th className="font-semibold pb-1 text-right">Visiteurs</th>
                    <th className="font-semibold pb-1 text-right">Visites</th>
                    <th className="font-semibold pb-1 text-right">Cmd</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sources.map(s => (
                    <tr key={s.source} className="border-t border-slate-800">
                      <td className="py-1.5 text-slate-200">
                        {s.source}
                        <span className="text-[10px] text-slate-500 ml-1">({CHANNEL_LABELS[s.channel as keyof typeof CHANNEL_LABELS] || s.channel})</span>
                      </td>
                      <td className="py-1.5 text-right font-mono text-slate-300">{s.visitors}</td>
                      <td className="py-1.5 text-right font-mono text-white font-bold">{s.sessions}</td>
                      <td className="py-1.5 text-right font-mono text-emerald-400">{s.purchases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {stats && stats.referrers.length > 0 && (
            <div className="border-t border-slate-700/80 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Sites qui envoient des visiteurs</div>
              <div className="flex flex-wrap gap-1.5">
                {stats.referrers.map(r => (
                  <span key={r.host} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-300 font-mono">
                    {r.host} <span className="text-white font-bold">{r.sessions}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline + live visitors */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Visiteurs par {range === 'today' || range === '24h' ? 'heure' : 'jour'}
              </h3>
              <span className="text-[10px] text-slate-500">Heure du Maroc</span>
            </div>
            <div className="flex items-end gap-1 h-36">
              {stats?.timeline.map(t => (
                <div key={t.bucket} className="flex-1 min-w-0 h-full flex flex-col justify-end group relative">
                  <div
                    className="bg-blue-500 hover:bg-blue-400 rounded-t-sm transition-colors"
                    style={{ height: `${Math.max(3, (t.visitors / maxTimelineVisitors) * 100)}%` }}
                    title={`${t.bucket} · ${t.visitors} visiteurs · ${t.pageViews} pages vues · ${t.clicks} clics`}
                  />
                </div>
              ))}
            </div>
            {stats && stats.timeline.length > 0 && (
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>{stats.timeline[0].bucket}</span>
                <span>{stats.timeline[stats.timeline.length - 1].bucket}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visiteurs en direct (5 dernières minutes)</h3>
            </div>
            {stats && stats.liveSessions.length === 0 && <div className="text-xs text-slate-500">Personne sur le site en ce moment.</div>}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {stats?.liveSessions.map(s => (
                <div key={s.sessionId} className="flex items-center justify-between gap-3 p-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">{s.page}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Smartphone className="w-3 h-3" />
                      <span>{s.device}</span>
                      <span>·</span>
                      <span>{s.source}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-emerald-400 font-mono font-bold">{formatDuration(s.secondsOnSite)}</div>
                    <div className="text-[10px] text-slate-500">{s.events} actions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clicks + pages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Clics les plus fréquents</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[420px]">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="font-semibold pb-2">Élément cliqué</th>
                  <th className="font-semibold pb-2">Page</th>
                  <th className="font-semibold pb-2 text-right">Clics</th>
                  <th className="font-semibold pb-2 text-right">Dernier clic</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topClicks.map(c => (
                  <tr key={`${c.label}-${c.page}`} className="border-t border-slate-800">
                    <td className="py-1.5 text-slate-200 max-w-[220px] truncate">{c.label || '(sans texte)'}</td>
                    <td className="py-1.5 text-slate-400 font-mono text-[11px] max-w-[160px] truncate">{c.page}</td>
                    <td className="py-1.5 text-right font-mono text-white font-bold">{c.count}</td>
                    <td className="py-1.5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(c.lastAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats && stats.topClicks.length === 0 && <div className="text-xs text-slate-500 pt-2">Aucun clic enregistré.</div>}
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pages les plus vues</h3>
          <div className="space-y-1.5">
            {stats?.topPages.map(p => (
              <div key={p.path} className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
                <span className="text-slate-300 font-mono text-[11px] truncate">{p.path}</span>
                <span className="text-white font-bold font-mono shrink-0 ml-2">{p.views}</span>
              </div>
            ))}
          </div>
          {stats && stats.devices.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {stats.devices.map(d => (
                <span key={d.device} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-300">
                  {d.device} <span className="text-white font-bold">{d.sessions}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversions API status */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Conversions API côté serveur & déduplication via event_id</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Chaque événement reçoit un <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded-sm">event_id</code> unique, envoyé à la fois par le pixel du navigateur et par le serveur.
          Meta, TikTok et Snapchat fusionnent les deux envois : l'achat n'est compté qu'une fois, même si le navigateur bloque le pixel.
          {stats && stats.revenue > 0 && <> Chiffre d'affaires suivi sur la période : <span className="text-white font-bold">{formatMoney(stats.revenue)}</span>.</>}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            ['meta', 'Meta Conversions API', 'META_PIXEL_ID + META_ACCESS_TOKEN'],
            ['tiktok', 'TikTok Events API', 'TIKTOK_PIXEL_ID + TIKTOK_ACCESS_TOKEN'],
            ['snapchat', 'Snapchat CAPI', 'SNAP_PIXEL_ID + SNAP_ACCESS_TOKEN']
          ] as const).map(([key, label, envVars]) => {
            const configured = stats?.configured[key];
            const counts = stats?.serverDispatch[key];
            return (
              <div key={key} className="p-3 bg-slate-900/60 border border-slate-700 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${configured ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                    {configured ? 'ACTIF' : 'NON CONFIGURÉ'}
                  </span>
                </div>
                {configured ? (
                  <div className="text-[11px] text-slate-400 font-mono">
                    <span className="text-emerald-400">{counts?.sent || 0} envoyés</span> · <span className="text-rose-400">{counts?.failed || 0} échecs</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500">Ajoutez <code className="text-slate-300">{envVars}</code> dans les variables d'environnement du serveur.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event stream + payload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Flux d'événements</h3>
            </div>
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value as typeof eventFilter)}
              className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200 px-2 py-1"
            >
              <option value="all">Tous</option>
              <option value="page_view">Pages vues</option>
              <option value="click">Clics</option>
              <option value="conversions">Conversions</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredEvents.map(ev => {
              const isSelected = selectedEvent?.eventId === ev.eventId;
              return (
                <div
                  key={ev.eventId}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                    isSelected ? 'bg-slate-900 border-blue-500 shadow-md' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-extrabold text-white font-mono">{ev.eventName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${ev.deduplicationStatus === 'DEDUPLICATED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-700/50'}`}>
                      {ev.deduplicationStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {ev.eventName === 'click' ? `« ${ev.click?.label || ''} »` : pathOf(ev.pageUrl)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{ev.trafficSource || 'Direct'} · {ev.deviceType}</span>
                    <span>{new Date(ev.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
            {filteredEvents.length === 0 && <div className="text-xs text-slate-500 text-center py-6">Aucun événement.</div>}
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4">
          {selectedEvent ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{selectedEvent.eventName}</h3>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-mono">{selectedEvent.deviceType}</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5 truncate">event_id: {selectedEvent.eventId}</div>
                </div>
                <button
                  onClick={handleCopyPayload}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié' : 'Copier JSON'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900/60 rounded-xl"><span className="text-slate-500">Source : </span><span className="text-white font-semibold">{selectedEvent.trafficSource}</span></div>
                <div className="p-2 bg-slate-900/60 rounded-xl"><span className="text-slate-500">Temps sur le site : </span><span className="text-white font-semibold">{formatDuration(selectedEvent.secondsOnSite || 0)}</span></div>
                <div className="p-2 bg-slate-900/60 rounded-xl col-span-2 truncate"><span className="text-slate-500">Arrivé depuis : </span><span className="text-white font-mono">{selectedEvent.landingReferrer || '(aucun site précédent)'}</span></div>
              </div>

              {selectedEvent.serverDispatch && Object.keys(selectedEvent.serverDispatch).length > 0 && (
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className={`px-2 py-1 rounded-md font-bold ${selectedEvent.dispatchedTo?.browserMetaPixel ? STATUS_STYLE.SENT : STATUS_STYLE.SKIPPED}`}>Pixel Meta navigateur</span>
                  <span className={`px-2 py-1 rounded-md font-bold ${selectedEvent.dispatchedTo?.browserTikTokPixel ? STATUS_STYLE.SENT : STATUS_STYLE.SKIPPED}`}>Pixel TikTok navigateur</span>
                  {Object.entries(selectedEvent.serverDispatch).map(([platform, status]) => (
                    <span key={platform} className={`px-2 py-1 rounded-md font-bold ${STATUS_STYLE[status] || STATUS_STYLE.SKIPPED}`}>
                      Serveur {platform} : {status}
                    </span>
                  ))}
                </div>
              )}

              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-96">
                <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Sélectionnez un événement dans le flux pour afficher le détail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
