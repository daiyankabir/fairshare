import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  formatCurrency,
  parseCurrency,
  ManualRateProvider,
  CachedRateProvider,
} from './currency';
import { getCurrencyDecimals } from './splits';

describe('Currency utilities', () => {
  describe('getCurrencyDecimals', () => {
    it('returns correct decimals for various currencies', () => {
      expect(getCurrencyDecimals('USD')).toBe(2);
      expect(getCurrencyDecimals('EUR')).toBe(2);
      expect(getCurrencyDecimals('JPY')).toBe(0);
      expect(getCurrencyDecimals('KRW')).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('formats USD correctly (minor units)', () => {
      // 10000 minor units = $100.00
      const formatted = formatCurrency(10000, 'USD');
      expect(formatted).toContain('100');
      // Intl returns '$' not 'USD'
      expect(formatted).toContain('$');
    });

    it('formats JPY without decimals', () => {
      // 100000 minor units = ¥100000
      expect(formatCurrency(100000, 'JPY')).toContain('100,000');
    });

    it('handles locale', () => {
      // 100050 minor units = €1000.50
      const formatted = formatCurrency(100050, 'EUR', 'de-DE');
      expect(formatted).toContain('1.000');
    });
  });

  describe('parseCurrency', () => {
    it('parses valid currency strings to minor units', () => {
      // $100.50 -> 10050 cents
      expect(parseCurrency('$100.50', 'USD')).toBe(10050);
      // € 50,00 -> 5000 cents
      expect(parseCurrency('€ 50,00', 'EUR')).toBe(5000);
      // ¥1,000 -> 1000 yen
      expect(parseCurrency('¥1,000', 'JPY')).toBe(1000);
    });

    it('returns null for invalid strings', () => {
      expect(parseCurrency('abc', 'USD')).toBeNull();
      expect(parseCurrency('', 'USD')).toBeNull();
    });
  });

  describe('ManualRateProvider', () => {
    it('returns manual rates', async () => {
      const provider = new ManualRateProvider(new Map([['USD_EUR', 0.9]]));
      const rate = await provider.getRate('USD', 'EUR');
      expect(rate).toBe(0.9);
    });

    it('returns 1 for same currency', async () => {
      const provider = new ManualRateProvider(new Map());
      const rate = await provider.getRate('USD', 'USD');
      expect(rate).toBe(1);
    });

    it('throws for missing rate', async () => {
      const provider = new ManualRateProvider(new Map());
      await expect(provider.getRate('USD', 'EUR')).rejects.toThrow('No manual rate for USD_EUR');
    });

    it('returns snapshot with metadata', async () => {
      const provider = new ManualRateProvider(new Map([['USD_EUR', 0.9]]));
      const date = new Date('2024-01-01');
      const snapshot = await provider.getRateSnapshot('USD', 'EUR', date);
      expect(snapshot.rate).toBe(0.9);
      expect(snapshot.source).toBe('manual');
      expect(snapshot.fetchedAt).toEqual(date);
    });
  });

  describe('CachedRateProvider', () => {
    it('caches rates from primary provider', async () => {
      let callCount = 0;
      const primary = {
        async getRate(from: string, to: string) {
          callCount++;
          return 0.9;
        },
        async getRateSnapshot(from: string, to: string, date: Date) {
          return { from, to, rate: 0.9, source: 'api' as const, fetchedAt: date };
        }
      };
      const cached = new CachedRateProvider(primary);

      await cached.getRate('USD', 'EUR');
      await cached.getRate('USD', 'EUR');
      await cached.getRate('USD', 'EUR');

      expect(callCount).toBe(1);
    });

    it('bypasses cache for different dates', async () => {
      let callCount = 0;
      const primary = {
        async getRate(from: string, to: string, date?: Date) {
          callCount++;
          return date ? 0.8 : 0.9;
        },
        async getRateSnapshot(from: string, to: string, date: Date) {
          return { from, to, rate: 0.9, source: 'api' as const, fetchedAt: date };
        }
      };
      const cached = new CachedRateProvider(primary);

      await cached.getRate('USD', 'EUR');
      await cached.getRate('USD', 'EUR', new Date('2024-01-01'));

      expect(callCount).toBe(2);
    });

    it('clears cache', async () => {
      let callCount = 0;
      const primary = {
        async getRate() {
          callCount++;
          return 0.9;
        },
        async getRateSnapshot(from: string, to: string, date: Date) {
          return { from, to, rate: 0.9, source: 'api' as const, fetchedAt: date };
        }
      };
      const cached = new CachedRateProvider(primary);

      await cached.getRate('USD', 'EUR');
      cached.clearCache();
      await cached.getRate('USD', 'EUR');

      expect(callCount).toBe(2);
    });
  });
});