import { Decimal } from 'decimal.js';
import type { ExpenseSplit, ExpensePayer, ExpenseItem, SplitType, Money } from '../models';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * All monetary amounts in this module are represented as integer minor units.
 * Examples: USD cents (100 = $1.00), JPY yen (1000 = ¥1000), EUR cents (100 = €1.00).
 * Never use floating-point numbers for money.
 */

export function getCurrencyDecimals(currency: string): number {
  const zeroDecimalCurrencies = [
    'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
  ];
  return zeroDecimalCurrencies.includes(currency.toUpperCase()) ? 0 : 2;
}

export function toMinorUnits(amount: number, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  return new Decimal(amount).mul(Math.pow(10, decimals)).toNumber();
}

export function fromMinorUnits(minorUnits: number, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  return new Decimal(minorUnits).div(Math.pow(10, decimals)).toNumber();
}

/**
 * Rounds a minor unit amount to the nearest integer minor unit.
 * Useful after multiplication/division that may produce fractional minor units.
 */
export function roundToMinorUnits(amountMinorUnits: number, _currency: string): number {
  return Math.round(amountMinorUnits);
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add different currencies: ${a.currency} + ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot subtract different currencies: ${a.currency} - ${b.currency}`);
  }
  return { amount: a.amount - b.amount, currency: a.currency };
}

export function multiplyMoney(money: Money, factor: number): Money {
  return { amount: roundToMinorUnits(money.amount * factor, money.currency), currency: money.currency };
}

export function divideMoney(money: Money, divisor: number): Money {
  return { amount: roundToMinorUnits(money.amount / divisor, money.currency), currency: money.currency };
}

/**
 * Converts an amount from one currency to another using the given exchange rate.
 * All amounts are in integer minor units.
 * @param amountMinorUnits - Amount in minor units of fromCurrency
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param rate - Exchange rate (1 unit of fromCurrency = rate units of toCurrency)
 * @returns Amount in minor units of toCurrency
 */
export function convertAmount(amountMinorUnits: number, fromCurrency: string, toCurrency: string, rate: number): number {
  const fromDecimals = getCurrencyDecimals(fromCurrency);
  const toDecimals = getCurrencyDecimals(toCurrency);

  // Convert from minor units of fromCurrency to major units, apply rate, convert to minor units of toCurrency
  const fromMajor = new Decimal(amountMinorUnits).div(Math.pow(10, fromDecimals));
  const toMajor = fromMajor.mul(rate);
  const toMinor = toMajor.mul(Math.pow(10, toDecimals));

  return toMinor.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export interface SplitResult {
  readonly splits: readonly ExpenseSplit[];
  readonly total: number; // in minor units
}

function distributeCents(totalCents: number, shares: readonly number[]): readonly number[] {
  const totalShares = shares.reduce((a, b) => a + b, 0);
  const baseShares = shares.map(s => Math.floor((s / totalShares) * totalCents));
  let remainder = totalCents - baseShares.reduce((a, b) => a + b, 0);

  const fractionalParts = shares.map((s, i) => ({
    index: i,
    fraction: (s / totalShares) * totalCents - baseShares[i]
  })).sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i++) {
    baseShares[fractionalParts[i].index]++;
  }

  return baseShares;
}

export function splitEqual(totalAmountMinor: number, participantIds: readonly string[], currency: string): SplitResult {
  if (participantIds.length === 0) {
    throw new Error('Cannot split among zero participants');
  }

  const count = participantIds.length;
  const baseShare = Math.floor(totalAmountMinor / count);
  const remainder = totalAmountMinor % count;

  const splits: ExpenseSplit[] = participantIds.map((memberId, index) => ({
    memberId,
    amount: baseShare + (index < remainder ? 1 : 0)
  }));

  return { splits, total: totalAmountMinor };
}

export function splitByPercent(totalAmountMinor: number, splits: readonly { memberId: string; percentage: number }[], currency: string): SplitResult {
  const totalPercent = splits.reduce((sum, s) => sum + s.percentage, 0);
  if (Math.abs(totalPercent - 100) > 0.0001) {
    throw new Error(`Percentages must sum to 100, got ${totalPercent}`);
  }

  const amounts = splits.map(s => Math.round(totalAmountMinor * s.percentage / 100));
  const diff = totalAmountMinor - amounts.reduce((a, b) => a + b, 0);

  if (diff !== 0) {
    const fractionalParts = splits.map((s, i) => ({
      index: i,
      fraction: (totalAmountMinor * s.percentage / 100) - amounts[i]
    })).sort((a, b) => Math.abs(b.fraction) - Math.abs(a.fraction));

    for (let i = 0; i < Math.abs(diff); i++) {
      amounts[fractionalParts[i].index] += diff > 0 ? 1 : -1;
    }
  }

  const resultSplits: ExpenseSplit[] = splits.map((s, i) => ({
    memberId: s.memberId,
    amount: amounts[i],
    percentage: s.percentage
  }));

  return { splits: resultSplits, total: totalAmountMinor };
}

export function splitByShares(totalAmountMinor: number, splits: readonly { memberId: string; shares: number }[], currency: string): SplitResult {
  const totalShares = splits.reduce((sum, s) => sum + s.shares, 0);
  if (totalShares <= 0) {
    throw new Error('Total shares must be positive');
  }

  const shares = splits.map(s => s.shares);
  const distributed = distributeCents(totalAmountMinor, shares);

  const resultSplits: ExpenseSplit[] = splits.map((s, i) => ({
    memberId: s.memberId,
    amount: distributed[i],
    shares: s.shares
  }));

  return { splits: resultSplits, total: totalAmountMinor };
}

export function splitExact(totalAmountMinor: number, splits: readonly { memberId: string; amount: number }[], currency: string): SplitResult {
  const splitsMinor = splits.map(s => s.amount);
  const sumSplits = splitsMinor.reduce((a, b) => a + b, 0);

  if (sumSplits !== totalAmountMinor) {
    throw new Error(`Exact splits sum to ${sumSplits}, expected ${totalAmountMinor}`);
  }

  const resultSplits: ExpenseSplit[] = splits.map(s => ({
    memberId: s.memberId,
    amount: s.amount
  }));

  return { splits: resultSplits, total: totalAmountMinor };
}

export function splitItemized(
  items: readonly ExpenseItem[],
  allParticipantIds: readonly string[],
  currency: string
): SplitResult {
  const memberTotals = new Map<string, number>();

  for (const item of items) {
    if (item.assignedTo.length === 0) continue;

    const itemSplit = splitEqual(item.amount, item.assignedTo, currency);
    for (const split of itemSplit.splits) {
      memberTotals.set(split.memberId, (memberTotals.get(split.memberId) || 0) + split.amount);
    }
  }

  const splits: ExpenseSplit[] = allParticipantIds.map(memberId => ({
    memberId,
    amount: memberTotals.get(memberId) || 0
  }));

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return { splits, total };
}

export function validateSplitsEqualTotal(splits: readonly ExpenseSplit[], totalMinor: number, currency: string): boolean {
  const sum = splits.reduce((acc, s) => acc + s.amount, 0);
  return sum === totalMinor;
}

export function calculatePayerBalances(
  payers: readonly ExpensePayer[],
  splits: readonly ExpenseSplit[],
  currency: string
): Map<string, number> {
  const balances = new Map<string, number>();

  for (const payer of payers) {
    balances.set(payer.memberId, (balances.get(payer.memberId) || 0) + payer.amount);
  }

  for (const split of splits) {
    balances.set(split.memberId, (balances.get(split.memberId) || 0) - split.amount);
  }

  return balances;
}