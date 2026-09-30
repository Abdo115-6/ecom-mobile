export type CurrencyCode = 'MAD' | 'EUR' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  exchangeRateFromMAD: number; // base is MAD
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  MAD: {
    code: 'MAD',
    symbol: 'DH',
    name: 'Dirham Marocain',
    exchangeRateFromMAD: 1.0,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    exchangeRateFromMAD: 0.093,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    exchangeRateFromMAD: 0.10,
  },
};

export function formatPrice(amountInMAD: number, currency: CurrencyCode = 'MAD'): string {
  const config = CURRENCIES[currency] || CURRENCIES.MAD;
  const converted = amountInMAD * config.exchangeRateFromMAD;
  
  if (currency === 'MAD') {
    return `${converted.toFixed(2)} ${config.symbol}`;
  }
  return `${config.symbol}${converted.toFixed(2)}`;
}
