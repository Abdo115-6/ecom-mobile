// Cookie consent (Loi 09-08 / CNDP). The choice is kept in a first-party cookie for 1 year.
// Meta and TikTok pixels start in "consent held" mode (see index.html) and are released on accept.

export type ConsentChoice = 'granted' | 'denied' | 'pending';

const COOKIE_NAME = 'shopme_consent';
const ONE_YEAR = 60 * 60 * 24 * 365;

type Listener = (choice: ConsentChoice) => void;

export function readCookie(name: string): string | undefined {
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

export function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
  } catch {
    // cookies blocked
  }
}

class ConsentService {
  private choice: ConsentChoice;
  private listeners = new Set<Listener>();

  constructor() {
    const saved = typeof document !== 'undefined' ? readCookie(COOKIE_NAME) : undefined;
    this.choice = saved === 'granted' || saved === 'denied' ? saved : 'pending';
  }

  public get(): ConsentChoice {
    return this.choice;
  }

  public set(choice: 'granted' | 'denied') {
    this.choice = choice;
    writeCookie(COOKIE_NAME, choice, ONE_YEAR);

    const win = window as unknown as {
      fbq?: (...args: unknown[]) => void;
      ttq?: { grantConsent?: () => void; revokeConsent?: () => void };
      shopmeLoadAnalytics?: () => void;
    };
    if (choice === 'granted') {
      win.fbq?.('consent', 'grant');
      win.ttq?.grantConsent?.();
      win.shopmeLoadAnalytics?.();
    } else {
      win.fbq?.('consent', 'revoke');
      win.ttq?.revokeConsent?.();
    }
    this.listeners.forEach(fn => fn(choice));
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const consentService = new ConsentService();
