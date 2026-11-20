export type CurrencyCode = string;

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface ExchangeRate {
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  readonly rate: number;
  readonly source: 'api' | 'manual';
  readonly fetchedAt: Date;
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'itemized';

export interface ExpenseSplit {
  readonly memberId: string;
  readonly amount: number;
  readonly percentage?: number;
  readonly shares?: number;
}

export interface ExpensePayer {
  readonly memberId: string;
  readonly amount: number;
}

export interface ExpenseItem {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly assignedTo: readonly string[];
  readonly splits: readonly ExpenseSplit[];
}

export interface Expense {
  readonly id: string;
  readonly groupId: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly exchangeRate: ExchangeRate | null;
  readonly date: Date;
  readonly categoryId: string | null;
  readonly payerIds: readonly string[];
  readonly payers: readonly ExpensePayer[];
  readonly splits: readonly ExpenseSplit[];
  readonly items: readonly ExpenseItem[];
  readonly splitType: SplitType;
  readonly notes: string | null;
  readonly receiptUrl: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
}

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly defaultCurrency: CurrencyCode;
  readonly coverEmoji: string | null;
  readonly isArchived: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type MemberRole = 'owner' | 'member' | 'guest';

export interface Membership {
  readonly id: string;
  readonly groupId: string;
  readonly userId: string | null;
  readonly displayName: string;
  readonly role: MemberRole;
  readonly isGuest: boolean;
  readonly joinedAt: Date;
  readonly defaultCurrency: CurrencyCode | null;
}

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly defaultCurrency: CurrencyCode;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Settlement {
  readonly id: string;
  readonly groupId: string;
  readonly fromMemberId: string;
  readonly toMemberId: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly date: Date;
  readonly note: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
}

export interface Category {
  readonly id: string;
  readonly groupId: string | null;
  readonly name: string;
  readonly icon: string | null;
  readonly color: string | null;
  readonly isDefault: boolean;
}

export interface SavedFilter {
  readonly id: string;
  readonly groupId: string;
  readonly userId: string | null;
  readonly name: string;
  readonly filters: ExpenseFilters;
  readonly createdAt: Date;
}

export interface ExpenseFilters {
  readonly categoryIds?: readonly string[];
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
  readonly payerIds?: readonly string[];
  readonly participantIds?: readonly string[];
  readonly amountMin?: number;
  readonly amountMax?: number;
  readonly currencies?: readonly CurrencyCode[];
  readonly searchText?: string;
}

export interface ActivityLogEntry {
  readonly id: string;
  readonly groupId: string;
  readonly entityType: 'expense' | 'settlement' | 'group' | 'member';
  readonly entityId: string;
  readonly action: 'created' | 'updated' | 'deleted';
  readonly changedBy: string;
  readonly changes: Record<string, { from: unknown; to: unknown }>;
  readonly timestamp: Date;
}

export interface InviteToken {
  readonly token: string;
  readonly groupId: string;
  readonly role: MemberRole;
  readonly expiresAt: Date | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly usedAt: Date | null;
  readonly usedBy: string | null;
}

export interface SyncQueueItem {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly operation: 'create' | 'update' | 'delete';
  readonly payload: unknown;
  readonly timestamp: Date;
  readonly retryCount: number;
  readonly lastError: string | null;
}

export interface Balance {
  readonly memberId: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface SimplifiedTransfer {
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface DebtGraph {
  readonly balances: readonly Balance[];
  readonly transfers: readonly SimplifiedTransfer[];
  readonly originalTransfers: readonly SimplifiedTransfer[];
}