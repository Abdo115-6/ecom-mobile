import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { clientMovementService, ClientSessionMovement } from '../../services/clientMovementService';
import {
  BrainCircuit,
  Lightbulb,
  Filter,
  Package,
  Globe,
  MapPin,
  Users,
  AlertTriangle,
  MousePointerClick,
  RefreshCw,
  MessageCircle,
  Phone,
  Zap,
  Check,
  Search,
  Database
} from 'lucide-react';

// Report computed by the server (server/dataMining.ts) from real visits, orders and abandoned order forms
type Report = any;

type Tab = 'optimize' | 'funnel' | 'sources' | 'cities' | 'customers' | 'leads' | 'clicks';

const PRIORITY_STYLE: Record<string, string> = {
  haute: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  moyenne: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
};

const fmtDuration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${s % 60 ? `${s % 60} s` : ''}` : `${s} s`);

const Card: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; hint?: string }> = ({ title, icon, children, hint }) => (
  <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
    <div>
      <h3 className="text-sm font-bold text-white flex items-center gap-2">{icon}<span>{title}</span></h3>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
    {children}
  </div>
);

const Kpi: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }> = ({ label, value, sub, tone = 'text-white' }) => (
  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
    <div className="text-[11px] font-bold text-slate-400">{label}</div>
    <div className={`text-xl font-black mt-1 ${tone}`}>{value}</div>
    {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-xs text-slate-400 py-6 text-center">{text}</div>
);

/** Horizontal bar used for funnels and distributions */
const Bar: React.FC<{ value: number; max: number; color?: string }> = ({ value, max, color = 'bg-amber-400' }) => (
  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
    <div className={`h-full ${color} rounded-full`} style={{ width: `${max > 0 ? Math.max(2, (value / max) * 100) : 0}%` }} />
  </div>
);

const Table: React.FC<{ head: string[]; rows: React.ReactNode[][]; empty: string }> = ({ head, rows, empty }) =>
  rows.length === 0 ? <Empty text={empty} /> : (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700/80">
            {head.map(h => <th key={h} className="py-2 px-2 font-bold whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-700/30">
              {r.map((c, j) => <td key={j} className="py-2 px-2 text-slate-200 whitespace-nowrap">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

function waRecoveryLink(lead: any): string {
  let phone = String(lead.phone || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '212' + phone.slice(1);
  else if (!phone.startsWith('212')) phone = '212' + phone;
  const hello = lead.name ? `السلام ${lead.name.split(' ')[0]}` : 'السلام عليكم';
  const pack = lead.pack > 1 ? ` (${lead.pack} حبات)` : '';
  const text = `${hello} 😊 معاك ShopMe Maroc.\nشفنا بلي كنتي غادي تطلب ${lead.productName || 'المنتوج'}${pack}${lead.value ? ` ب ${Math.round(lead.value)} درهم` : ''}.\nواش نأكدو ليك الطلب؟ الخلاص عند الاستلام 📦`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export const DataMiningView: React.FC = () => {
  const { formatMoney, showToast } = useApp();
  const [tab, setTab] = useState<Tab>('optimize');
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadQuery, setLeadQuery] = useState('');
  const [showRecovered, setShowRecovered] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/datamining?days=${days}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || `Erreur ${res.status}`);
      setReport(json.report);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le rapport');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const markContacted = (lead: any) => {
    clientMovementService.markLeadContacted(lead.id, 'Relancé sur WhatsApp / téléphone');
    setReport((r: Report) => r && { ...r, leads: r.leads.map((l: any) => (l.id === lead.id ? { ...l, isContacted: true } : l)) });
  };

  const convertLead = (lead: any) => {
    const asSession = {
      id: lead.id, sessionId: lead.id, ipCity: lead.city, deviceType: lead.device || 'mobile', referrerSource: lead.source,
      firstSeenAt: lead.lastInputAt, lastActiveAt: lead.lastInputAt, status: 'ABANDONED_INPUT',
      productId: lead.productId, productName: lead.productName, selectedPack: lead.pack, potentialRevenue: lead.value,
      capturedInputs: {
        fullName: lead.name, phone: lead.phone, city: lead.city, address: lead.address,
        lastInputAt: lead.lastInputAt, completedFieldsCount: lead.fieldsFilled
      },
      timeline: [], isContacted: true
    } as ClientSessionMovement;
    const orderNumber = clientMovementService.convertLeadToConfirmedOrder(asSession);
    if (!orderNumber) {
      showToast('Produit introuvable pour ce formulaire : créez la commande manuellement.');
      return;
    }
    showToast(`Commande ${orderNumber} créée à partir du formulaire abandonné`);
    setReport((r: Report) => r && { ...r, leads: r.leads.map((l: any) => (l.id === lead.id ? { ...l, status: 'PURCHASED', isContacted: true, orderNumber } : l)) });
  };

  const k = report?.kpis;
  const openLeads = (report?.leads || []).filter((l: any) => l.status !== 'PURCHASED');
  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'optimize', label: 'Optimisations', icon: <Lightbulb className="w-3.5 h-3.5" />, badge: report?.recommendations.filter((r: any) => r.priority === 'haute').length },
    { id: 'funnel', label: 'Entonnoir & Produits', icon: <Filter className="w-3.5 h-3.5" /> },
    { id: 'sources', label: 'Sources & Appareils', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'cities', label: 'Villes & Horaires', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'customers', label: 'Clients & Paniers', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'leads', label: 'Formulaires abandonnés', icon: <AlertTriangle className="w-3.5 h-3.5" />, badge: openLeads.length },
    { id: 'clicks', label: 'Clics', icon: <MousePointerClick className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Data Mining & Optimisation</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyse des vraies visites, commandes et formulaires abandonnés de la boutique
              {report && <> · mis à jour {new Date(report.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${days === d ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                {d} jours
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50" title="Actualiser">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-2xl p-4 text-xs">
          Rapport indisponible : {error}
        </div>
      )}
      {!report && !error && <Empty text="Analyse des données en cours…" />}

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Kpi label="Visites" value={k.sessions} sub={`Rebond ${k.bounceRate} % · ${fmtDuration(k.avgSessionSeconds)}`} />
            <Kpi label="Conversion visite → commande" value={`${k.conversion} %`} tone="text-emerald-400" />
            <Kpi label="Commandes" value={k.orders} sub={`${k.validOrders} valides · ${k.cancelRate} % annulées`} />
            <Kpi label="Chiffre d'affaires" value={formatMoney(k.revenue)} sub={`Panier moyen ${formatMoney(k.averageOrderValue)}`} tone="text-emerald-400" />
            <Kpi label="Taux de livraison" value={k.deliveryRate ? `${k.deliveryRate} %` : '—'} sub={`${formatMoney(k.deliveredRevenue)} livrés`} />
            <Kpi label="Formulaires à relancer" value={k.openLeads} sub={`${formatMoney(k.openLeadValue)} potentiels`} tone="text-amber-400" />
          </div>

          <div className="flex flex-wrap gap-1.5 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 text-xs">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold cursor-pointer ${tab === t.id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                {t.icon}<span>{t.label}</span>
                {!!t.badge && <span className={`px-1.5 rounded-full text-[10px] font-black ${tab === t.id ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'}`}>{t.badge}</span>}
              </button>
            ))}
          </div>

          {tab === 'optimize' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
                <Database className="w-4 h-4 shrink-0 text-slate-500" />
                <span>
                  Basé sur {report.coverage.sessions} visites, {report.coverage.orders} commandes et {report.coverage.leads} formulaires sur {report.rangeDays} jours
                  {report.coverage.firstEventAt && <> (suivi des visites depuis le {new Date(report.coverage.firstEventAt).toLocaleDateString('fr-FR')})</>}.
                  Les visites de l'admin ne sont pas comptées.
                </span>
              </div>
              {report.recommendations.length === 0 ? (
                <Empty text="Aucun point faible détecté sur cette période." />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {report.recommendations.map((r: any, i: number) => (
                    <div key={i} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase ${PRIORITY_STYLE[r.priority]}`}>{r.priority}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{r.area}</span>
                      </div>
                      <div className="text-sm font-bold text-white">{r.title}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{r.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'funnel' && (
            <div className="space-y-4">
              <Card title="Entonnoir de conversion (visites uniques)" icon={<Filter className="w-4 h-4 text-amber-400" />}
                hint="Chaque étape compte les visites qui l'ont atteinte ; le pourcentage est la perte par rapport à l'étape précédente.">
                <div className="space-y-3">
                  {report.funnel.map((f: any, i: number) => {
                    const prev = i > 0 ? report.funnel[i - 1].sessions : 0;
                    const drop = i > 0 && prev > 0 ? Math.round((1 - f.sessions / prev) * 100) : null;
                    return (
                      <div key={f.stage} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-200 font-semibold">{f.stage}</span>
                          <span className="text-white font-black">{f.sessions}
                            {drop !== null && <span className={`ml-2 font-bold ${drop > 60 ? 'text-rose-400' : 'text-slate-400'}`}>−{drop} %</span>}
                          </span>
                        </div>
                        <Bar value={f.sessions} max={report.funnel[0].sessions} />
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card title="Performance par produit" icon={<Package className="w-4 h-4 text-amber-400" />}
                hint="Vues = visiteurs ayant ouvert la fiche. Conv. = part de ces visiteurs qui ont commandé.">
                <Table
                  head={['Produit', 'Vues', 'Formulaire', 'Achats', 'Conv.', 'Commandes', 'Annulées', 'Pièces', 'CA']}
                  empty="Aucune donnée produit sur la période."
                  rows={report.products.map((p: any) => [
                    <span className="flex items-center gap-2 max-w-[220px] truncate">
                      {p.image && <img src={p.image} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />}
                      <span className="truncate font-semibold">{p.name}</span>
                    </span>,
                    p.views, p.checkouts, p.purchases,
                    <span className={p.views >= 20 && p.purchases === 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{p.viewToOrder} %</span>,
                    p.orders,
                    <span className={p.cancelRate >= 35 ? 'text-rose-400 font-bold' : ''}>{p.cancelled} ({p.cancelRate} %)</span>,
                    p.units, formatMoney(p.revenue)
                  ])}
                />
              </Card>
              <Card title="Pages d'arrivée" hint="Première page vue par le visiteur.">
                <Table head={['Page', 'Visites', 'Rebond', 'Formulaire', 'Conv.']} empty="Aucune visite."
                  rows={report.landings.map((l: any) => [<span className="max-w-[260px] truncate block">{l.key}</span>, l.sessions, `${l.bounceRate} %`, `${l.checkoutRate} %`, `${l.conversion} %`])} />
              </Card>
            </div>
          )}

          {tab === 'sources' && (
            <div className="space-y-4">
              <Card title="Sources de trafic" icon={<Globe className="w-4 h-4 text-amber-400" />}
                hint="Détectées par UTM, identifiants de clic publicitaire (fbclid, ttclid, gclid) et site d'origine.">
                <Table head={['Source', 'Visites', 'Rebond', 'Formulaire', 'Achats', 'Conv.', 'CA']} empty="Aucune visite."
                  rows={report.sources.map((s: any) => [s.key, s.sessions, `${s.bounceRate} %`, `${s.checkoutRate} %`, s.purchases,
                    <span className="text-emerald-400 font-bold">{s.conversion} %</span>, formatMoney(s.revenue)])} />
              </Card>
              <Card title="Source enregistrée sur les commandes" hint="Inclut les commandes WhatsApp (Salma) et celles passées hors site.">
                <Table head={['Source', 'Commandes', 'Valides', 'CA']} empty="Aucune commande."
                  rows={report.orderSources.map((s: any) => [s.source, s.orders, s.valid, formatMoney(s.revenue)])} />
              </Card>
              <Card title="Appareils">
                <Table head={['Appareil', 'Visites', 'Rebond', 'Formulaire', 'Conv.']} empty="Aucune visite."
                  rows={report.devices.map((d: any) => [d.key, d.sessions, `${d.bounceRate} %`, `${d.checkoutRate} %`, `${d.conversion} %`])} />
              </Card>
            </div>
          )}

          {tab === 'cities' && (
            <div className="space-y-4">
              <Card title="Villes" icon={<MapPin className="w-4 h-4 text-amber-400" />} hint="Taux d'annulation élevé = confirmer par appel avant d'expédier.">
                <Table head={['Ville', 'Commandes', 'Valides', 'Livrées', 'Annulées', 'CA']} empty="Aucune commande."
                  rows={report.cities.map((c: any) => [c.city, c.orders, c.valid, `${c.delivered} (${c.deliveryRate} %)`,
                    <span className={c.orders >= 5 && c.cancelRate >= 40 ? 'text-rose-400 font-bold' : ''}>{c.cancelled} ({c.cancelRate} %)</span>, formatMoney(c.revenue)])} />
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Heures (heure du Maroc)" hint="Barre jaune = visites, verte = commandes.">
                  <div className="space-y-1">
                    {report.hours.map((h: any) => {
                      const maxV = Math.max(1, ...report.hours.map((x: any) => x.visits));
                      const maxO = Math.max(1, ...report.hours.map((x: any) => x.orders));
                      return (
                        <div key={h.hour} className="grid grid-cols-[34px_1fr_1fr_60px] items-center gap-2 text-[11px]">
                          <span className="text-slate-400">{h.hour}h</span>
                          <Bar value={h.visits} max={maxV} />
                          <Bar value={h.orders} max={maxO} color="bg-emerald-400" />
                          <span className="text-slate-300 text-right">{h.visits} / {h.orders}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
                <Card title="Jours de la semaine">
                  <Table head={['Jour', 'Visites', 'Commandes']} empty="—"
                    rows={report.weekdays.map((d: any) => [d.day, d.visits, d.orders])} />
                </Card>
              </div>
            </div>
          )}

          {tab === 'customers' && (
            <div className="space-y-4">
              <Card title="Segments clients (RFM)" icon={<Users className="w-4 h-4 text-amber-400" />}
                hint={`${k.customers} clients identifiés par téléphone, ${k.repeatCustomers} ont commandé plusieurs fois. Calculé sur tout l'historique.`}>
                <Table head={['Segment', 'Clients', 'Part', 'Commandes moy.', 'Dépense moy.', 'Dernier achat', 'Action conseillée']} empty="Aucun client."
                  rows={report.segments.map((s: any) => [<span className="font-bold">{s.segment}</span>, s.count, `${s.share} %`, s.avgOrders,
                    formatMoney(s.avgSpent), s.count ? `${s.avgRecencyDays} j` : '—', <span className="text-slate-400">{s.action}</span>])} />
              </Card>
              <Card title="Meilleurs clients">
                <Table head={['Client', 'Téléphone', 'Ville', 'Commandes', 'Total', 'Dernier achat', 'Segment']} empty="Aucun client."
                  rows={report.topCustomers.map((c: any) => [c.name || '—', <span className="font-mono">{c.phone}</span>, c.city, c.orders, formatMoney(c.spent), `il y a ${c.recencyDays} j`, c.segment])} />
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Achetés ensemble (analyse de panier)" hint={`${report.multiItemOrders} commande(s) contiennent plusieurs produits.`}>
                  <Table head={['Produit A', 'Produit B', 'Commandes', 'Confiance', 'Lift']} empty="Pas encore de commande avec plusieurs produits."
                    rows={report.basket.map((b: any) => [b.a, b.b, b.orders, `${b.confidence} %`, b.lift])} />
                </Card>
                <Card title="Regardés ensemble" hint="Produits consultés pendant la même visite : idées de bundle ou de suggestion.">
                  <Table head={['Produit A', 'Produit B', 'Visites']} empty="Pas encore de visite avec plusieurs produits vus."
                    rows={report.coViews.map((c: any) => [c.a, c.b, c.sessions])} />
                </Card>
              </div>
              <Card title="Packs choisis" hint="Nombre de pièces par ligne de commande.">
                <Table head={['Pièces', 'Lignes', 'Part']} empty="Aucune commande."
                  rows={report.packs.map((p: any) => [p.pieces, p.count, `${p.share} %`])} />
              </Card>
            </div>
          )}

          {tab === 'leads' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-800/80 to-slate-900 border border-amber-500/30 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="text-xs text-slate-300 max-w-2xl">
                  <div className="text-amber-400 font-extrabold text-sm mb-1">Visiteurs ayant tapé leurs coordonnées sans envoyer la commande</div>
                  Enregistré depuis le téléphone du visiteur pendant qu'il remplit le formulaire. Si la même personne commande ensuite, le formulaire passe automatiquement en « a commandé ».
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input value={leadQuery} onChange={e => setLeadQuery(e.target.value)} placeholder="Nom, téléphone, produit…"
                      className="bg-slate-900 border border-slate-700 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-48" />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={showRecovered} onChange={e => setShowRecovered(e.target.checked)} />
                    Afficher ceux qui ont commandé
                  </label>
                </div>
              </div>
              {(() => {
                const q = leadQuery.trim().toLowerCase();
                const list = (report.leads as any[])
                  .filter(l => showRecovered || l.status !== 'PURCHASED')
                  .filter(l => !q || [l.name, l.phone, l.productName, l.city].some((v: string) => String(v || '').toLowerCase().includes(q)));
                if (list.length === 0) return <Empty text="Aucun formulaire abandonné sur la période." />;
                return (
                  <div className="space-y-3">
                    {list.map(lead => {
                      const hasPhone = String(lead.phone).replace(/\D/g, '').length >= 9;
                      const done = lead.status === 'PURCHASED';
                      return (
                        <div key={lead.id} className={`bg-slate-800/90 border rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${done ? 'border-emerald-500/30 opacity-80' : lead.isContacted ? 'border-slate-700/80' : 'border-amber-500/40'}`}>
                          <div className="flex items-start gap-3">
                            {lead.productImage
                              ? <img src={lead.productImage} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0" />
                              : <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-slate-500" /></div>}
                            <div className="space-y-0.5 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-white text-sm">{lead.name || 'Sans nom'}</span>
                                <span className="font-mono text-emerald-400 font-bold">{lead.phone || '—'}</span>
                                {done && <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">A commandé {lead.orderNumber || ''}</span>}
                                {!done && lead.isContacted && <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1"><Check className="w-3 h-3" />Relancé</span>}
                              </div>
                              <div className="text-slate-300">
                                {lead.productName || 'Produit inconnu'}{lead.pack > 1 ? ` · pack ${lead.pack}` : ''} · <span className="text-amber-400 font-bold">{formatMoney(lead.value)}</span>
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {lead.city}{lead.address ? ` · ${lead.address}` : ''} · {lead.fieldsFilled}/4 champs · {lead.source || 'source inconnue'} · {lead.lastInputAt ? new Date(lead.lastInputAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                            </div>
                          </div>
                          {!done && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {hasPhone && (
                                <a href={waRecoveryLink(lead)} target="_blank" rel="noopener noreferrer" onClick={() => markContacted(lead)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">
                                  <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                                </a>
                              )}
                              {hasPhone && (
                                <a href={`tel:${String(lead.phone).replace(/\D/g, '')}`} onClick={() => markContacted(lead)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700">
                                  <Phone className="w-3.5 h-3.5 text-sky-400" />Appeler
                                </a>
                              )}
                              {lead.productId && hasPhone && (
                                <button onClick={() => convertLead(lead)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer">
                                  <Zap className="w-3.5 h-3.5" />Créer la commande
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {tab === 'clicks' && (
            <Card title="Éléments les plus cliqués" icon={<MousePointerClick className="w-4 h-4 text-amber-400" />}
              hint="Tous les clics des visiteurs (boutons, liens, images, champs). Un bouton important peu cliqué est mal placé ou peu visible.">
              <Table head={['Élément', 'Page', 'Clics', 'Visiteurs']} empty="Aucun clic sur la période."
                rows={report.topClicks.map((c: any) => [<span className="max-w-[260px] truncate block font-semibold">{c.label}</span>,
                  <span className="max-w-[220px] truncate block text-slate-400">{c.page}</span>, c.count, c.sessions])} />
            </Card>
          )}
        </>
      )}
    </div>
  );
};
