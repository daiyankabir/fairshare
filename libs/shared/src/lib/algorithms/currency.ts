import type { ExchangeRate, CurrencyCode } from '../models';
import { getCurrencyDecimals } from './splits';

export interface ExchangeRateProvider {
  getRate(from: CurrencyCode, to: CurrencyCode, date?: Date): Promise<number>;
  getRateSnapshot(from: CurrencyCode, to: CurrencyCode, date: Date): Promise<ExchangeRate>;
}

export class ManualRateProvider implements ExchangeRateProvider {
  constructor(private readonly rates: Map<string, number>) {}

  async getRate(from: CurrencyCode, to: CurrencyCode, _date?: Date): Promise<number> {
    if (from === to) return 1;
    const key = `${from}_${to}`;
    const rate = this.rates.get(key);
    if (!rate) throw new Error(`No manual rate for ${key}`);
    return rate;
  }

  async getRateSnapshot(from: CurrencyCode, to: CurrencyCode, date: Date): Promise<ExchangeRate> {
    const rate = await this.getRate(from, to, date);
    return {
      from,
      to,
      rate,
      source: 'manual',
      fetchedAt: date
    };
  }
}

export class CachedRateProvider implements ExchangeRateProvider {
  private cache = new Map<string, { rate: number; expiresAt: number }>();
  private readonly ttlMs: number;

  constructor(
    private readonly primary: ExchangeRateProvider,
    ttlHours = 24
  ) {
    this.ttlMs = ttlHours * 60 * 60 * 1000;
  }

  async getRate(from: CurrencyCode, to: CurrencyCode, date?: Date): Promise<number> {
    if (from === to) return 1;

    const key = `${from}_${to}_${date?.toISOString() || 'latest'}`;
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.rate;
    }

    const rate = await this.primary.getRate(from, to, date);
    this.cache.set(key, { rate, expiresAt: Date.now() + this.ttlMs });
    return rate;
  }

  async getRateSnapshot(from: CurrencyCode, to: CurrencyCode, date: Date): Promise<ExchangeRate> {
    const rate = await this.getRate(from, to, date);
    return {
      from,
      to,
      rate,
      source: 'api',
      fetchedAt: new Date()
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * All monetary amounts in this module are represented as integer minor units.
 * Examples: USD cents (100 = $1.00), JPY yen (1000 = ¥1000), EUR cents (100 = €1.00).
 * Never use floating-point numbers for money.
 */

export { getCurrencyDecimals };

export function formatCurrency(amountMinorUnits: number, currency: CurrencyCode, locale = 'en-US'): string {
  const decimals = getCurrencyDecimals(currency);
  const majorAmount = amountMinorUnits / Math.pow(10, decimals);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(majorAmount);
  } catch {
    return `${majorAmount.toFixed(decimals)} ${currency}`;
  }
}

export function parseCurrency(input: string, currency: CurrencyCode): number | null {
  const decimals = getCurrencyDecimals(currency);
  // Remove currency symbols, spaces, and thousands separators
  let cleaned = input.replace(/[^\d.,-]/g, '');
  
  // For zero-decimal currencies, commas are always thousands separators
  if (decimals === 0) {
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Determine if comma or dot is the decimal separator
    // If both exist, the last one is typically the decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Comma is decimal separator, remove dots (thousands separators)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
      // Dot is decimal separator, remove commas (thousands separators)
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // No separators or only one type - remove commas (assume thousands separator)
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;

  // Convert to minor units
  return Math.round(value * Math.pow(10, decimals));
}