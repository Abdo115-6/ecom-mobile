// Shared (browser + server) classification of where a visitor came from.

export type TrafficChannel = 'ads' | 'search' | 'social' | 'whatsapp' | 'email' | 'referral' | 'direct';

export interface TrafficSource {
  channel: TrafficChannel;
  source: string;      // e.g. "Google", "Facebook", "TikTok Ads", "Direct"
  medium?: string;
  campaign?: string;
  referrerHost?: string;
}

export interface TrafficSourceInput {
  referrer?: string;
  landingUrl?: string;
  ownHost?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    fbclid?: string;
    ttclid?: string;
    gclid?: string;
  };
}

export const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  ads: 'Publicité payante',
  search: 'Recherche (Google…)',
  social: 'Réseaux sociaux',
  whatsapp: 'WhatsApp',
  email: 'Email',
  referral: 'Lien depuis un autre site',
  direct: 'Direct / lien partagé'
};

const SEARCH_ENGINES: Array<[RegExp, string]> = [
  [/(^|\.)google\./, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)yahoo\./, 'Yahoo'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)yandex\./, 'Yandex'],
  [/(^|\.)ecosia\.org$/, 'Ecosia'],
  [/(^|\.)qwant\.com$/, 'Qwant'],
  [/(^|\.)baidu\.com$/, 'Baidu']
];

const SOCIAL_NETWORKS: Array<[RegExp, string]> = [
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, 'Facebook'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)snapchat\.com$/, 'Snapchat'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'X / Twitter'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'],
  [/(^|\.)pinterest\./, 'Pinterest'],
  [/(^|\.)reddit\.com$/, 'Reddit'],
  [/(^|\.)threads\.net$/, 'Threads'],
  [/(^|\.)telegram\.(org|me)$|(^|\.)t\.me$/, 'Telegram']
];

const SOCIAL_UTM: Array<[RegExp, string]> = [
  [/^(fb|facebook|meta)/i, 'Facebook'],
  [/^(ig|insta)/i, 'Instagram'],
  [/^(tiktok|tt)/i, 'TikTok'],
  [/^snap/i, 'Snapchat'],
  [/^(yt|youtube)/i, 'YouTube'],
  [/^(google|adwords|gads)/i, 'Google']
];

function hostOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function prettyUtmSource(raw: string): string {
  for (const [re, name] of SOCIAL_UTM) {
    if (re.test(raw)) return name;
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function classifyTrafficSource(input: TrafficSourceInput): TrafficSource {
  const utm = input.utm || {};
  const refHost = hostOf(input.referrer);
  const ownHost = input.ownHost?.toLowerCase().replace(/^www\./, '');
  const externalRef = refHost && refHost !== ownHost ? refHost : undefined;
  const medium = (utm.medium || '').toLowerCase();
  const campaign = utm.campaign;

  // 1. Paid click identifiers are the most reliable signal
  if (utm.gclid) return { channel: 'ads', source: 'Google Ads', medium: 'cpc', campaign, referrerHost: externalRef };
  if (utm.fbclid && /(cpc|paid|ads?|cpm)/.test(medium)) return { channel: 'ads', source: 'Facebook / Instagram Ads', medium, campaign, referrerHost: externalRef };
  if (utm.ttclid) return { channel: 'ads', source: 'TikTok Ads', medium: medium || 'cpc', campaign, referrerHost: externalRef };

  // 2. Explicit UTM tags
  if (utm.source && utm.source !== 'direct') {
    const src = prettyUtmSource(utm.source);
    if (/(cpc|ppc|paid|ads?|cpm|sponsored)/.test(medium)) {
      return { channel: 'ads', source: `${src} Ads`, medium, campaign, referrerHost: externalRef };
    }
    if (/whatsapp/i.test(utm.source) || medium === 'whatsapp') return { channel: 'whatsapp', source: 'WhatsApp', medium, campaign, referrerHost: externalRef };
    if (/e-?mail|newsletter/.test(medium)) return { channel: 'email', source: src, medium, campaign, referrerHost: externalRef };
    if (/(social|bio|story|post|reel)/.test(medium) || SOCIAL_UTM.some(([re]) => re.test(utm.source!))) {
      return { channel: 'social', source: src, medium, campaign, referrerHost: externalRef };
    }
    if (medium === 'organic') return { channel: 'search', source: src, medium, campaign, referrerHost: externalRef };
    return { channel: 'referral', source: src, medium, campaign, referrerHost: externalRef };
  }

  // 3. Referrer analysis
  if (externalRef) {
    for (const [re, name] of SEARCH_ENGINES) {
      if (re.test(externalRef)) return { channel: 'search', source: name, medium: 'organic', referrerHost: externalRef };
    }
    if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(externalRef)) return { channel: 'whatsapp', source: 'WhatsApp', referrerHost: externalRef };
    for (const [re, name] of SOCIAL_NETWORKS) {
      if (re.test(externalRef)) {
        // fbclid without paid medium = organic Facebook/Instagram post click
        return { channel: 'social', source: name, medium: 'social', referrerHost: externalRef };
      }
    }
    if (/(mail\.|outlook\.|gmail)/.test(externalRef)) return { channel: 'email', source: externalRef, medium: 'email', referrerHost: externalRef };
    return { channel: 'referral', source: externalRef, medium: 'referral', referrerHost: externalRef };
  }

  // fbclid present but no referrer (in-app browser) = Facebook/Instagram click
  if (utm.fbclid) return { channel: 'social', source: 'Facebook / Instagram', medium: 'social', campaign };

  // 4. Nothing at all: typed URL, bookmark, or link opened from an app that hides the referrer (WhatsApp, SMS…)
  return { channel: 'direct', source: 'Direct', medium: 'none' };
}
