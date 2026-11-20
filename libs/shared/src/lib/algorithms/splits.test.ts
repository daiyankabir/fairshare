import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  splitEqual,
  splitByPercent,
  splitByShares,
  splitExact,
  splitItemized,
  validateSplitsEqualTotal,
  toMinorUnits,
  fromMinorUnits,
  getCurrencyDecimals,
  roundToMinorUnits,
  convertAmount
} from './splits';

describe('Currency utilities', () => {
  describe('getCurrencyDecimals', () => {
    it('returns 2 for most currencies', () => {
      expect(getCurrencyDecimals('USD')).toBe(2);
      expect(getCurrencyDecimals('EUR')).toBe(2);
      expect(getCurrencyDecimals('GBP')).toBe(2);
    });

    it('returns 0 for zero-decimal currencies', () => {
      expect(getCurrencyDecimals('JPY')).toBe(0);
      expect(getCurrencyDecimals('KRW')).toBe(0);
      expect(getCurrencyDecimals('VND')).toBe(0);
    });

    it('is case insensitive', () => {
      expect(getCurrencyDecimals('usd')).toBe(2);
      expect(getCurrencyDecimals('jpy')).toBe(0);
    });
  });

  describe('roundToMinorUnits', () => {
    it('rounds minor units to nearest integer', () => {
      expect(roundToMinorUnits(1012.3, 'USD')).toBe(1012);
      expect(roundToMinorUnits(1012.5, 'USD')).toBe(1013);
      expect(roundToMinorUnits(1012.6, 'USD')).toBe(1013);
    });

    it('works for zero-decimal currencies', () => {
      expect(roundToMinorUnits(1000.5, 'JPY')).toBe(1001);
      expect(roundToMinorUnits(1000.4, 'JPY')).toBe(1000);
    });
  });

  describe('toMinorUnits / fromMinorUnits', () => {
    it('converts correctly for USD', () => {
      expect(toMinorUnits(10.50, 'USD')).toBe(1050);
      expect(fromMinorUnits(1050, 'USD')).toBe(10.50);
    });

    it('converts correctly for JPY', () => {
      expect(toMinorUnits(1000, 'JPY')).toBe(1000);
      expect(fromMinorUnits(1000, 'JPY')).toBe(1000);
    });

    it('round-trip property', () => {
      fc.assert(fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        fc.constant('USD'),
        (amount, currency) => {
          const minor = toMinorUnits(amount, currency);
          const back = fromMinorUnits(minor, currency);
          return Math.abs(back - amount) < 0.01;
        }
      ));
    });
  });

  describe('convertAmount', () => {
    it('converts USD to EUR at rate 0.9 (minor units)', () => {
      // 10000 cents USD * 0.9 = 9000 cents EUR
      expect(convertAmount(10000, 'USD', 'EUR', 0.9)).toBe(9000);
    });

    it('handles JPY conversion (minor units)', () => {
      // 10000 yen * 0.007 = 70 USD = 7000 cents
      expect(convertAmount(10000, 'JPY', 'USD', 0.007)).toBe(7000);
    });

    it('identity conversion returns same amount', () => {
      expect(convertAmount(10000, 'USD', 'USD', 1)).toBe(10000);
    });
  });
});

describe('Split algorithms', () => {
  describe('splitEqual', () => {
    it('splits equally among participants (minor units)', () => {
      // 10000 cents = $100.00 split 3 ways
      const result = splitEqual(10000, ['a', 'b', 'c'], 'USD');
      expect(result.splits).toHaveLength(3);
      // 3333 + 3333 + 3334 = 10000
      const amounts = result.splits.map(s => s.amount).sort();
      expect(amounts).toEqual([3333, 3333, 3334]);
      expect(result.splits.reduce((sum, s) => sum + s.amount, 0)).toBe(10000);
    });

    it('distributes remainder cents deterministically', () => {
      // 1000 cents = $10.00 split 3 ways
      const result = splitEqual(1000, ['a', 'b', 'c'], 'USD');
      const amounts = result.splits.map(s => s.amount).sort();
      expect(amounts).toEqual([333, 333, 334]);
    });

    it('handles single participant', () => {
      const result = splitEqual(5000, ['only'], 'USD');
      expect(result.splits[0].amount).toBe(5000);
    });

    it('handles JPY (no cents)', () => {
      const result = splitEqual(1000, ['a', 'b'], 'JPY');
      expect(result.splits[0].amount).toBe(500);
      expect(result.splits[1].amount).toBe(500);
    });

    it('throws on zero participants', () => {
      expect(() => splitEqual(10000, [], 'USD')).toThrow('Cannot split among zero participants');
    });

    it('property: splits always sum to total (minor units)', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 10_000_000 }),
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
        fc.constant('USD'),
        (total, participants, currency) => {
          const result = splitEqual(total, participants, currency);
          const sum = result.splits.reduce((s, split) => s + split.amount, 0);
          return sum === total;
        }
      ));
    });
  });

  describe('splitByPercent', () => {
    it('splits by percentage (minor units)', () => {
      const result = splitByPercent(10000, [
        { memberId: 'a', percentage: 50 },
        { memberId: 'b', percentage: 30 },
        { memberId: 'c', percentage: 20 }
      ], 'USD');
      expect(result.splits.find(s => s.memberId === 'a')?.amount).toBe(5000);
      expect(result.splits.find(s => s.memberId === 'b')?.amount).toBe(3000);
      expect(result.splits.find(s => s.memberId === 'c')?.amount).toBe(2000);
    });

    it('handles remainder cents', () => {
      const result = splitByPercent(1000, [
        { memberId: 'a', percentage: 33.33 },
        { memberId: 'b', percentage: 33.33 },
        { memberId: 'c', percentage: 33.34 }
      ], 'USD');
      const sum = result.splits.reduce((s, split) => s + split.amount, 0);
      expect(sum).toBe(1000);
    });

    it('throws if percentages do not sum to 100', () => {
      expect(() => splitByPercent(10000, [
        { memberId: 'a', percentage: 50 },
        { memberId: 'b', percentage: 30 }
      ], 'USD')).toThrow('Percentages must sum to 100');
    });

    it('property: splits always sum to total (minor units)', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 10_000_000 }),
        fc.array(
          fc.record({ memberId: fc.string({ minLength: 1 }), percentage: fc.double({ min: 0.01, max: 100, noNaN: true }) }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constant('USD'),
        (total, splits, currency) => {
          const sumPercent = splits.reduce((s, p) => s + p.percentage, 0);
          if (Math.abs(sumPercent - 100) > 0.0001) return true;

          const result = splitByPercent(total, splits, currency);
          const sum = result.splits.reduce((s, split) => s + split.amount, 0);
          return sum === total;
        }
      ));
    });
  });

  describe('splitByShares', () => {
    it('splits by shares (minor units)', () => {
      const result = splitByShares(10000, [
        { memberId: 'a', shares: 2 },
        { memberId: 'b', shares: 1 },
        { memberId: 'c', shares: 1 }
      ], 'USD');
      expect(result.splits.find(s => s.memberId === 'a')?.amount).toBe(5000);
      expect(result.splits.find(s => s.memberId === 'b')?.amount).toBe(2500);
      expect(result.splits.find(s => s.memberId === 'c')?.amount).toBe(2500);
    });

    it('handles fractional shares', () => {
      const result = splitByShares(10000, [
        { memberId: 'a', shares: 1.5 },
        { memberId: 'b', shares: 1 }
      ], 'USD');
      const sum = result.splits.reduce((s, split) => s + split.amount, 0);
      expect(sum).toBe(10000);
    });

    it('throws on zero total shares', () => {
      expect(() => splitByShares(10000, [
        { memberId: 'a', shares: 0 },
        { memberId: 'b', shares: 0 }
      ], 'USD')).toThrow('Total shares must be positive');
    });

    it('property: splits always sum to total (minor units)', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 10_000_000 }),
        fc.array(
          fc.record({ memberId: fc.string({ minLength: 1 }), shares: fc.double({ min: 0.01, max: 100, noNaN: true }) }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constant('USD'),
        (total, splits, currency) => {
          const sumShares = splits.reduce((s, p) => s + p.shares, 0);
          if (sumShares <= 0) return true;

          const result = splitByShares(total, splits, currency);
          const sum = result.splits.reduce((s, split) => s + split.amount, 0);
          return sum === total;
        }
      ));
    });
  });

  describe('splitExact', () => {
    it('validates exact amounts sum to total (minor units)', () => {
      const result = splitExact(10000, [
        { memberId: 'a', amount: 4000 },
        { memberId: 'b', amount: 3500 },
        { memberId: 'c', amount: 2500 }
      ], 'USD');
      expect(result.splits).toHaveLength(3);
    });

    it('throws if sum does not match total', () => {
      expect(() => splitExact(10000, [
        { memberId: 'a', amount: 5000 },
        { memberId: 'b', amount: 3000 }
      ], 'USD')).toThrow('Exact splits sum to 8000, expected 10000');
    });
  });

  describe('splitItemized', () => {
    it('splits itemized expenses (minor units)', () => {
      const items = [
        {
          id: '1',
          description: 'Item 1',
          amount: 6000,
          currency: 'USD',
          assignedTo: ['a', 'b'],
          splits: []
        },
        {
          id: '2',
          description: 'Item 2',
          amount: 4000,
          currency: 'USD',
          assignedTo: ['b', 'c'],
          splits: []
        }
      ];
      const result = splitItemized(items, ['a', 'b', 'c'], 'USD');
      expect(result.splits.find(s => s.memberId === 'a')?.amount).toBe(3000);
      expect(result.splits.find(s => s.memberId === 'b')?.amount).toBe(5000);
      expect(result.splits.find(s => s.memberId === 'c')?.amount).toBe(2000);
    });

    it('property: splits always sum to total (minor units)', () => {
      fc.assert(fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            description: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1, max: 1_000_000 }),
            currency: fc.constant('USD'),
            assignedTo: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
            splits: fc.constant([])
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
        fc.constant('USD'),
        (items, participants, currency) => {
          // Ensure all assignedTo members are in participants
          const allAssigned = new Set(items.flatMap(i => i.assignedTo));
          const validParticipants = [...new Set([...participants, ...allAssigned])];
          
          const result = splitItemized(items, validParticipants, currency);
          const sum = result.splits.reduce((s, split) => s + split.amount, 0);
          const expectedTotal = items.reduce((s, item) => s + item.amount, 0);
          return sum === expectedTotal;
        }
      ));
    });
  });

  describe('validateSplitsEqualTotal', () => {
    it('returns true for valid splits', () => {
      expect(validateSplitsEqualTotal(
        [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 5000 }],
        10000,
        'USD'
      )).toBe(true);
    });

    it('returns false for invalid splits', () => {
      expect(validateSplitsEqualTotal(
        [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 4000 }],
        10000,
        'USD'
      )).toBe(false);
    });
  });
});