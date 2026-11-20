import type { Balance, SimplifiedTransfer } from '../models';

/**
 * All monetary amounts in this module are represented as integer minor units.
 * Examples: USD cents (100 = $1.00), JPY yen (1000 = ¥1000), EUR cents (100 = €1.00).
 * Never use floating-point numbers for money.
 */

export interface MemberBalance {
  readonly memberId: string;
  readonly amount: number; // integer minor units
}

export function simplifyDebts(balances: readonly MemberBalance[]): readonly SimplifiedTransfer[] {
  const creditors: MemberBalance[] = [];
  const debtors: MemberBalance[] = [];

  for (const balance of balances) {
    if (balance.amount > 0) {
      creditors.push({ memberId: balance.memberId, amount: balance.amount });
    } else if (balance.amount < 0) {
      debtors.push({ memberId: balance.memberId, amount: -balance.amount });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SimplifiedTransfer[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const transferAmount = Math.min(creditor.amount, debtor.amount);

    transfers.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount: transferAmount,
      currency: ''
    });

    creditors[creditorIndex] = { ...creditor, amount: creditor.amount - transferAmount };
    debtors[debtorIndex] = { ...debtor, amount: debtor.amount - transferAmount };

    if (creditors[creditorIndex].amount === 0) creditorIndex++;
    if (debtors[debtorIndex].amount === 0) debtorIndex++;
  }

  return transfers;
}

export function calculateNetBalances(
  expenses: readonly { payers: readonly { memberId: string; amount: number }[]; splits: readonly { memberId: string; amount: number }[] }[],
  memberIds: readonly string[]
): readonly MemberBalance[] {
  const balances = new Map<string, number>();

  for (const memberId of memberIds) {
    balances.set(memberId, 0);
  }

  for (const expense of expenses) {
    for (const payer of expense.payers) {
      balances.set(payer.memberId, (balances.get(payer.memberId) || 0) + payer.amount);
    }
    for (const split of expense.splits) {
      balances.set(split.memberId, (balances.get(split.memberId) || 0) - split.amount);
    }
  }

  return Array.from(balances.entries())
    .map(([memberId, amount]) => ({ memberId, amount }))
    .filter(b => b.amount !== 0);
}

export function calculateOriginalTransfers(
  expenses: readonly { payers: readonly { memberId: string; amount: number }[]; splits: readonly { memberId: string; amount: number }[] }[],
  memberIds: readonly string[]
): readonly SimplifiedTransfer[] {
  const pairwiseBalances = new Map<string, Map<string, number>>();

  for (const memberId of memberIds) {
    pairwiseBalances.set(memberId, new Map());
  }

  for (const expense of expenses) {
    for (const payer of expense.payers) {
      for (const split of expense.splits) {
        if (payer.memberId === split.memberId) continue;

        const debtor = split.memberId;
        const creditor = payer.memberId;

        const debtorMap = pairwiseBalances.get(debtor)!;
        debtorMap.set(creditor, (debtorMap.get(creditor) || 0) + split.amount);
      }
    }
  }

  const transfers: SimplifiedTransfer[] = [];

  for (const [debtor, creditors] of pairwiseBalances) {
    for (const [creditor, amount] of creditors) {
      if (amount > 0) {
        const reverseAmount = pairwiseBalances.get(creditor)?.get(debtor) || 0;
        const netAmount = amount - reverseAmount;

        if (netAmount > 0) {
          transfers.push({ from: debtor, to: creditor, amount: netAmount, currency: '' });
        }
      }
    }
  }

  return transfers;
}

export function computeDebtGraph(
  expenses: readonly { payers: readonly { memberId: string; amount: number }[]; splits: readonly { memberId: string; amount: number }[] }[],
  memberIds: readonly string[],
  currency: string
): { balances: readonly Balance[]; transfers: readonly SimplifiedTransfer[]; originalTransfers: readonly SimplifiedTransfer[] } {
  const netBalances = calculateNetBalances(expenses, memberIds);
  const simplified = simplifyDebts(netBalances);
  const original = calculateOriginalTransfers(expenses, memberIds);

  return {
    balances: netBalances.map(b => ({ memberId: b.memberId, amount: b.amount, currency })),
    transfers: simplified.map(t => ({ ...t, currency })),
    originalTransfers: original.map(t => ({ ...t, currency }))
  };
}

export function validateSimplification(
  originalTransfers: readonly SimplifiedTransfer[],
  simplifiedTransfers: readonly SimplifiedTransfer[],
  memberIds: readonly string[]
): boolean {
  const originalNet = new Map<string, number>();
  const simplifiedNet = new Map<string, number>();

  for (const memberId of memberIds) {
    originalNet.set(memberId, 0);
    simplifiedNet.set(memberId, 0);
  }

  for (const t of originalTransfers) {
    originalNet.set(t.from, (originalNet.get(t.from) || 0) - t.amount);
    originalNet.set(t.to, (originalNet.get(t.to) || 0) + t.amount);
  }

  for (const t of simplifiedTransfers) {
    simplifiedNet.set(t.from, (simplifiedNet.get(t.from) || 0) - t.amount);
    simplifiedNet.set(t.to, (simplifiedNet.get(t.to) || 0) + t.amount);
  }

  for (const memberId of memberIds) {
    if (originalNet.get(memberId) !== simplifiedNet.get(memberId)) {
      return false;
    }
  }

  return true;
}