import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { trackingService } from '../../services/trackingService';
import { UnifiedEventPayload } from '../../types/tracking';
import { 
  Activity, 
  ShieldCheck, 
  Layers, 
  Send, 
  Eye, 
  Check, 
  Copy, 
  Zap, 
  Database, 
  Radio, 
  RefreshCw 
} from 'lucide-react';

export const TrackingInspectorView: React.FC = () => {
  const { showToast } = useApp();
  const [events, setEvents] = useState<UnifiedEventPayload[]>(trackingService.getHistory());
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEventPayload | null>(events[0] || null);
  const [activePlatformTab, setActivePlatformTab] = useState<'meta' | 'ga4' | 'tiktok' | 'snapchat' | 'bigquery'>('meta');
  const [copied, setCopied] = useState(false);

  // Subscribe to live tracking events
  useEffect(() => {
    const unsubscribe = trackingService.subscribe((newEvent) => {
      setEvents(prev => [newEvent, ...prev]);
      if (!selectedEvent) setSelectedEvent(newEvent);
    });
    return () => unsubscribe();
  }, [selectedEvent]);

  // Trigger test events for demonstration
  const handleFireTestEvent = (eventName: any) => {
    const triggered = trackingService.track(eventName, {
      value: 649.00,
      currency: 'MAD',
      orderId: 'ORD-TEST-' + Math.floor(1000 + Math.random() * 9000),
      items: [{
        id: "AURA-ANC-BLK",
        name: "Casque Sans Fil Aura ANC Ultra",
        price: 649.00,
        quantity: 1,
        variant: "Noir Mat"
      }],
      metadata: { testTrigger: true }
    });
    setSelectedEvent(triggered);
    showToast(`Événement test "${eventName}" généré avec deduplication CAPI !`);
  };

  const handleCopyPayload = () => {
    if (selectedEvent) {
      navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-black text-white">Live Event Tracking Inspector & Déduplication CAPI</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Architecture multi-plateforme : GA4, Meta Conversions API (CAPI), TikTok Events API, Snapchat CAPI et BigQuery Stream
          </p>
        </div>

        {/* Test event generators */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleFireTestEvent('view_item')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            + Test view_item
          </button>
          <button
            onClick={() => handleFireTestEvent('add_to_cart')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            + Test add_to_cart
          </button>
          <button
            onClick={() => handleFireTestEvent('purchase')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>+ Test purchase</span>
          </button>
        </div>
      </div>

      {/* Deduplication Architecture Indicator */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Garantie Zéro Doublon (Deduplication Strategy via \`event_id\`)</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Chaque action génère un UUID déterministe unique. L'événement est expédié en parallèle par le navigateur (client-side pixel) et par le serveur (Meta CAPI / TikTok Events API). Les serveurs de Facebook et TikTok fusionnent les deux flux grâce au même <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded-sm">event_id</code>, neutralisant les bloqueurs de publicité tout en évitant de compter deux fois un même achat.
        </p>
      </div>

      {/* Main Layout: Events Stream + Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Stream Table (Left 5 cols) */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Flux d'Événements Récents</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{events.length} captés</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {events.map(ev => {
              const isSelected = selectedEvent?.eventId === ev.eventId;
              return (
                <div
                  key={ev.eventId}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected 
                      ? 'bg-slate-900 border-blue-500 shadow-md' 
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-white font-mono">{ev.eventName}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-bold">
                      {ev.deduplicationStatus}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    ID: {ev.eventId}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Source: {ev.utm.source || 'direct'}</span>
                    <span>{new Date(ev.timestamp).toLocaleTimeString('fr-FR')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payload Inspector (Right 7 cols) */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4">
          {selectedEvent ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{selectedEvent.eventName}</h3>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-mono">
                      {selectedEvent.deviceType}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    event_id: {selectedEvent.eventId}
                  </div>
                </div>

                <button
                  onClick={handleCopyPayload}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié' : 'Copier JSON'}</span>
                </button>
              </div>

              {/* Platform Output Simulator Tabs */}
              <div className="flex border-b border-slate-700 text-xs">
                <button
                  onClick={() => setActivePlatformTab('meta')}
                  className={`pb-2 px-3 font-bold border-b-2 transition-colors cursor-pointer ${
                    activePlatformTab === 'meta'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Meta CAPI & Pixel
                </button>
                <button
                  onClick={() => setActivePlatformTab('ga4')}
                  className={`pb-2 px-3 font-bold border-b-2 transition-colors cursor-pointer ${
                    activePlatformTab === 'ga4'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  GA4 / GTM
                </button>
                <button
                  onClick={() => setActivePlatformTab('tiktok')}
                  className={`pb-2 px-3 font-bold border-b-2 transition-colors cursor-pointer ${
                    activePlatformTab === 'tiktok'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  TikTok Events API
                </button>
                <button
                  onClick={() => setActivePlatformTab('snapchat')}
                  className={`pb-2 px-3 font-bold border-b-2 transition-colors cursor-pointer ${
                    activePlatformTab === 'snapchat'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Snapchat CAPI
                </button>
                <button
                  onClick={() => setActivePlatformTab('bigquery')}
                  className={`pb-2 px-3 font-bold border-b-2 transition-colors cursor-pointer ${
                    activePlatformTab === 'bigquery'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  BigQuery Row
                </button>
              </div>

              {/* Platform specific formatted preview */}
              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-80">
                {activePlatformTab === 'meta' && (
                  <pre>
{JSON.stringify({
  event_name: selectedEvent.eventName === 'purchase' ? 'Purchase' : selectedEvent.eventName === 'add_to_cart' ? 'AddToCart' : 'ViewContent',
  event_time: Math.floor(new Date(selectedEvent.timestamp).getTime() / 1000),
  event_id: selectedEvent.eventId,
  event_source_url: selectedEvent.pageUrl,
  action_source: "website",
  user_data: {
    client_ip_address: "196.200.***.***",
    client_user_agent: navigator.userAgent,
    fbp: selectedEvent.anonymousId,
    fbc: selectedEvent.utm.fbclid ? `fb.1.${Date.now()}.${selectedEvent.utm.fbclid}` : undefined
  },
  custom_data: {
    currency: selectedEvent.currency,
    value: selectedEvent.value,
    order_id: selectedEvent.orderId,
    contents: selectedEvent.items?.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price }))
  }
}, null, 2)}
                  </pre>
                )}

                {activePlatformTab === 'ga4' && (
                  <pre>
{JSON.stringify({
  event: selectedEvent.eventName,
  event_id: selectedEvent.eventId,
  client_id: selectedEvent.anonymousId,
  session_id: selectedEvent.sessionId,
  ecommerce: {
    currency: selectedEvent.currency,
    value: selectedEvent.value,
    transaction_id: selectedEvent.orderId,
    campaign_source: selectedEvent.utm.source,
    campaign_medium: selectedEvent.utm.medium,
    items: selectedEvent.items
  }
}, null, 2)}
                  </pre>
                )}

                {activePlatformTab === 'tiktok' && (
                  <pre>
{JSON.stringify({
  pixel_code: "C1234567890ABCDEFGH",
  event: selectedEvent.eventName === 'purchase' ? 'CompletePayment' : 'ViewContent',
  event_id: selectedEvent.eventId,
  timestamp: selectedEvent.timestamp,
  context: {
    ad: { callback: selectedEvent.utm.ttclid },
    user: { anonymous_id: selectedEvent.anonymousId }
  },
  properties: {
    currency: selectedEvent.currency,
    value: selectedEvent.value,
    contents: selectedEvent.items?.map(i => ({ content_id: i.id, content_type: "product", price: i.price }))
  }
}, null, 2)}
                  </pre>
                )}

                {activePlatformTab === 'snapchat' && (
                  <pre>
{JSON.stringify({
  pixel_id: "snap-pix-9821381",
  event_type: selectedEvent.eventName === 'purchase' ? 'PURCHASE' : 'PAGE_VIEW',
  event_tag: selectedEvent.eventId,
  timestamp: selectedEvent.timestamp,
  price: selectedEvent.value,
  currency: selectedEvent.currency,
  transaction_id: selectedEvent.orderId
}, null, 2)}
                  </pre>
                )}

                {activePlatformTab === 'bigquery' && (
                  <pre>
{JSON.stringify({
  dataset: "ecommerce_analytics",
  table: "raw_events_stream",
  partition_date: selectedEvent.timestamp.split('T')[0],
  record: {
    event_id: selectedEvent.eventId,
    event_name: selectedEvent.eventName,
    anonymous_id: selectedEvent.anonymousId,
    session_id: selectedEvent.sessionId,
    utm_source: selectedEvent.utm.source,
    utm_campaign: selectedEvent.utm.campaign,
    value: selectedEvent.value,
    currency: selectedEvent.currency,
    items_count: selectedEvent.items?.length || 0
  }
}, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Sélectionnez un événement dans le flux pour afficher la charge utile.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
