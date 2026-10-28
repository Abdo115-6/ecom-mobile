// Nightly ad spend import for the margin page: Facebook (Meta Marketing API) and TikTok (Business API).
// Tokens stay in the host's environment variables, never in the admin panel or the database:
//   META_ACCESS_TOKEN + META_AD_ACCOUNT_IDS (comma separated, without "act_")
//   TIKTOK_ACCESS_TOKEN + TIKTOK_ADVERTISER_IDS (comma separated)
//   USD_TO_MAD (default 10) converts accounts billed in dollars

export interface AdSpendDay {
  id: string;        // one line per platform and day: re-importing a day replaces it
  date: string;
  platform: 'facebook' | 'tiktok';
  campaign: string;
  amount: number;    // DH
}

export interface AdSyncStatus {
  meta: boolean;
  tiktok: boolean;
  usdToMad: number;
  lastRunAt?: string;
  lastOkDate?: string;
  lastResult?: string;
  lastError?: string;
}

const list = (v?: string) => String(v || '').split(',').map(s => s.trim().replace(/^act_/, '')).filter(Boolean);
const usdToMad = () => Number(process.env.USD_TO_MAD) || 10;
const toMad = (amount: number, currency: string) => (String(currency).toUpperCase() === 'USD' ? amount * usdToMad() : amount);
const round = (n: number) => Math.round(n * 100) / 100;

const status: AdSyncStatus = { meta: false, tiktok: false, usdToMad: 10 };

export function adSyncStatus(): AdSyncStatus {
  return {
    ...status,
    meta: !!(process.env.META_ACCESS_TOKEN && list(process.env.META_AD_ACCOUNT_IDS).length),
    tiktok: !!(process.env.TIKTOK_ACCESS_TOKEN && list(process.env.TIKTOK_ADVERTISER_IDS).length),
    usdToMad: usdToMad()
  };
}

async function metaSpend(since: string, until: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return out;
  for (const account of list(process.env.META_AD_ACCOUNT_IDS)) {
    const url = new URL(`https://graph.facebook.com/v21.0/act_${account}/insights`);
    url.searchParams.set('fields', 'spend,account_currency');
    url.searchParams.set('time_increment', '1');
    url.searchParams.set('time_range', JSON.stringify({ since, until }));
    url.searchParams.set('limit', '100');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
    const data: any = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error(`Facebook ${account}: ${data?.error?.message || `HTTP ${res.status}`}`);
    for (const row of data.data || []) {
      const amount = toMad(Number(row.spend) || 0, row.account_currency || 'USD');
      out.set(row.date_start, (out.get(row.date_start) || 0) + amount);
    }
  }
  return out;
}

async function tiktokSpend(since: string, until: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) return out;
  const currency = process.env.TIKTOK_CURRENCY || 'MAD';
  for (const advertiser of list(process.env.TIKTOK_ADVERTISER_IDS)) {
    const url = new URL('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/');
    url.searchParams.set('advertiser_id', advertiser);
    url.searchParams.set('report_type', 'BASIC');
    url.searchParams.set('data_level', 'AUCTION_ADVERTISER');
    url.searchParams.set('dimensions', JSON.stringify(['advertiser_id', 'stat_time_day']));
    url.searchParams.set('metrics', JSON.stringify(['spend']));
    url.searchParams.set('start_date', since);
    url.searchParams.set('end_date', until);
    url.searchParams.set('page_size', '100');
    const res = await fetch(url, { headers: { 'Access-Token': token }, signal: AbortSignal.timeout(20000) });
    const data: any = await res.json().catch(() => null);
    if (!res.ok || !data || data.code !== 0) throw new Error(`TikTok ${advertiser}: ${data?.message || `HTTP ${res.status}`}`);
    for (const row of data.data?.list || []) {
      const day = String(row.dimensions?.stat_time_day || '').slice(0, 10);
      if (!day) continue;
      out.set(day, (out.get(day) || 0) + toMad(Number(row.metrics?.spend) || 0, currency));
    }
  }
  return out;
}

/** Morocco date (YYYY-MM-DD) n days before today */
const moroccoDay = (daysAgo: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date(Date.now() - daysAgo * 86400000));

/**
 * Imports the last `days` complete days (today is skipped: its spend is still growing).
 * Days with no spend are not written, so manual lines for other days are untouched.
 */
export async function syncAdSpend(save: (entries: AdSpendDay[]) => Promise<void>, days = 7): Promise<string> {
  const since = moroccoDay(days);
  const until = moroccoDay(1);
  status.lastRunAt = new Date().toISOString();
  const entries: AdSpendDay[] = [];
  const errors: string[] = [];

  const collect = async (platform: 'facebook' | 'tiktok', fetcher: typeof metaSpend, label: string) => {
    try {
      (await fetcher(since, until)).forEach((amount, date) => {
        if (amount > 0) {
          const short = platform === 'facebook' ? 'fb' : 'tt';
          entries.push({ id: `ad-${short}-${date}`, date, platform, campaign: `${label} (synchro auto)`, amount: round(amount) });
        }
      });
    } catch (err: any) {
      errors.push(err.message);
    }
  };

  const s = adSyncStatus();
  if (s.meta) await collect('facebook', metaSpend, 'Facebook');
  if (s.tiktok) await collect('tiktok', tiktokSpend, 'TikTok');

  if (entries.length) await save(entries);
  status.lastResult = `${entries.length} jour(s) importé(s) du ${since} au ${until}`;
  status.lastError = errors.join(' · ') || undefined;
  if (!errors.length) status.lastOkDate = moroccoDay(0);
  return status.lastResult + (status.lastError ? ` — ${status.lastError}` : '');
}

/** Once a day after 01:00 Morocco time, plus once shortly after start */
export function scheduleAdSpendSync(save: (entries: AdSpendDay[]) => Promise<void>) {
  const run = () => {
    const s = adSyncStatus();
    if (!s.meta && !s.tiktok) return;
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Casablanca', hour: '2-digit', hour12: false }).format(new Date()));
    if (status.lastOkDate === moroccoDay(0) || hour < 1) return;
    syncAdSpend(save).then(r => console.log('[AdSpend]', r)).catch(err => console.warn('[AdSpend] sync error:', err.message));
  };
  setTimeout(run, 60_000).unref();
  setInterval(run, 60 * 60 * 1000).unref();
}
