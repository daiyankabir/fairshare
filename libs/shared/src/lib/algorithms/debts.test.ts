import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  simplifyDebts,
  calculateNetBalances,
  calculateOriginalTransfers,
  computeDebtGraph,
  validateSimplification
} from './debts';

describe('Debt simplification algorithms', () => {
  describe('simplifyDebts', () => {
    it('simplifies simple two-person debt (minor units)', () => {
      const balances = [
        { memberId: 'a', amount: 10000 },
        { memberId: 'b', amount: -10000 }
      ];
      const result = simplifyDebts(balances);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ from: 'b', to: 'a', amount: 10000, currency: '' });
    });

    it('simplifies three-person chain (minor units)', () => {
      const balances = [
        { memberId: 'a', amount: 10000 },
        { memberId: 'b', amount: -5000 },
        { memberId: 'c', amount: -5000 }
      ];
      const result = simplifyDebts(balances);
      expect(result).toHaveLength(2);
      expect(result.map(t => `${t.from}->${t.to}:${t.amount}`).sort()).toEqual(
        ['b->a:5000', 'c->a:5000'].sort()
      );
    });

    it('simplifies circle debt (minor units)', () => {
      const balances = [
        { memberId: 'a', amount: 5000 },
        { memberId: 'b', amount: 5000 },
        { memberId: 'c', amount: -10000 }
      ];
      const result = simplifyDebts(balances);
      expect(result).toHaveLength(2);
    });

    it('handles zero balances', () => {
      const balances = [
        { memberId: 'a', amount: 10000 },
        { memberId: 'b', amount: -10000 },
        { memberId: 'c', amount: 0 }
      ];
      const result = simplifyDebts(balances);
      expect(result).toHaveLength(1);
    });

    it('returns empty for all zero balances', () => {
      const balances = [
        { memberId: 'a', amount: 0 },
        { memberId: 'b', amount: 0 }
      ];
      const result = simplifyDebts(balances);
      expect(result).toHaveLength(0);
    });

    it('property: net balances preserved after simplification (minor units)', () => {
      fc.assert(fc.property(
        fc.array(
          fc.record({
            memberId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: -1_000_000, max: 1_000_000 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (balances) => {
          const nonZero = balances.filter(b => b.amount !== 0);
          if (nonZero.length < 2) return true;

          const sum = nonZero.reduce((s, b) => s + b.amount, 0);
          if (sum !== 0) return true;

          const simplified = simplifyDebts(nonZero);

          const originalNet = new Map<string, number>();
          const simplifiedNet = new Map<string, number>();

          for (const b of nonZero) {
            originalNet.set(b.memberId, b.amount);
            simplifiedNet.set(b.memberId, 0);
          }

          for (const t of simplified) {
            simplifiedNet.set(t.from, (simplifiedNet.get(t.from) || 0) - t.amount);
            simplifiedNet.set(t.to, (simplifiedNet.get(t.to) || 0) + t.amount);
          }

          for (const [memberId, amount] of originalNet) {
            if ((simplifiedNet.get(memberId) || 0) !== amount) {
              return false;
            }
          }

          return true;
        }
      ));
    });

    it('property: minimal number of transfers', () => {
      fc.assert(fc.property(
        fc.array(
          fc.record({
            memberId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: -1_000_000, max: 1_000_000 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (balances) => {
          const nonZero = balances.filter(b => b.amount !== 0);
          if (nonZero.length < 2) return true;

          const sum = nonZero.reduce((s, b) => s + b.amount, 0);
          if (sum !== 0) return true;

          const simplified = simplifyDebts(nonZero);
          const creditorCount = nonZero.filter(b => b.amount > 0).length;
          const debtorCount = nonZero.filter(b => b.amount < 0).length;

          return simplified.length <= creditorCount + debtorCount - 1;
        }
      ));
    });
  });

  describe('calculateNetBalances', () => {
    it('calculates net balances from expenses (minor units)', () => {
      const expenses = [
        {
          payers: [{ memberId: 'a', amount: 10000 }],
          splits: [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 5000 }]
        }
      ];
      const result = calculateNetBalances(expenses, ['a', 'b']);
      expect(result.find(b => b.memberId === 'a')?.amount).toBe(5000);
      expect(result.find(b => b.memberId === 'b')?.amount).toBe(-5000);
    });

    it('handles multiple expenses', () => {
      const expenses = [
        {
          payers: [{ memberId: 'a', amount: 10000 }],
          splits: [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 5000 }]
        },
        {
          payers: [{ memberId: 'b', amount: 5000 }],
          splits: [{ memberId: 'a', amount: 2500 }, { memberId: 'b', amount: 2500 }]
        }
      ];
      const result = calculateNetBalances(expenses, ['a', 'b']);
      expect(result.find(b => b.memberId === 'a')?.amount).toBe(2500);
      expect(result.find(b => b.memberId === 'b')?.amount).toBe(-2500);
    });

    it('filters out zero balances', () => {
      const expenses = [
        {
          payers: [{ memberId: 'a', amount: 10000 }],
          splits: [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 5000 }]
        }
      ];
      const result = calculateNetBalances(expenses, ['a', 'b', 'c']);
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateOriginalTransfers', () => {
    it('calculates pairwise transfers (minor units)', () => {
      const expenses = [
        {
          payers: [{ memberId: 'a', amount: 10000 }],
          splits: [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 5000 }]
        }
      ];
      const result = calculateOriginalTransfers(expenses, ['a', 'b']);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ from: 'b', to: 'a', amount: 5000, currency: '' });
    });

    it('nets out reverse transfers', () => {
      const expenses = [
        {
          payers: [{ memberId: 'a', amount: 10000 }],
          splits: [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 5000 }]
        },
        {
          payers: [{ memberId: 'b', amount: 10000 }],
          splits: [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 5000 }]
        }
      ];
      const result = calculateOriginalTransfers(expenses, ['a', 'b']);
      expect(result).toHaveLength(0);
    });
  });

  describe('computeDebtGraph', () => {
    it('returns complete debt graph (minor units)', () => {
      const expenses = [
        {
          payers: [{ memberId: 'a', amount: 10000 }],
          splits: [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 5000 }]
        }
      ];
      const result = computeDebtGraph(expenses, ['a', 'b'], 'USD');
      expect(result.balances).toHaveLength(2);
      expect(result.transfers).toHaveLength(1);
      expect(result.originalTransfers).toHaveLength(1);
    });
  });

  describe('validateSimplification', () => {
    it('returns true for valid simplification', () => {
      const original = [
        { from: 'b', to: 'a', amount: 5000, currency: 'USD' },
        { from: 'c', to: 'a', amount: 5000, currency: 'USD' }
      ];
      const simplified = [
        { from: 'b', to: 'a', amount: 5000, currency: 'USD' },
        { from: 'c', to: 'a', amount: 5000, currency: 'USD' }
      ];
      expect(validateSimplification(original, simplified, ['a', 'b', 'c'])).toBe(true);
    });

    it('returns false for invalid simplification', () => {
      const original = [
        { from: 'b', to: 'a', amount: 5000, currency: 'USD' }
      ];
      const simplified = [
        { from: 'b', to: 'a', amount: 3000, currency: 'USD' }
      ];
      expect(validateSimplification(original, simplified, ['a', 'b'])).toBe(false);
    });

    it('property: simplified debts preserve net balances (minor units)', () => {
      fc.assert(fc.property(
        fc.array(
          fc.record({
            memberId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: -1_000_000, max: 1_000_000 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (balances) => {
          const nonZero = balances.filter(b => b.amount !== 0);
          if (nonZero.length < 2) return true;

          const sum = nonZero.reduce((s, b) => s + b.amount, 0);
          if (sum !== 0) return true;

          const originalTransfers = nonZero.flatMap(b =>
            b.amount < 0 ? [{ from: b.memberId, to: 'creditor', amount: -b.amount, currency: '' }] : []
          );
          const simplified = simplifyDebts(nonZero);

          return validateSimplification(originalTransfers, simplified, nonZero.map(b => b.memberId));
        }
      ));
    });
  });
});