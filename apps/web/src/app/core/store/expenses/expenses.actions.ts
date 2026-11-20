import { createAction, props } from '@ngrx/store';

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  exchangeRateId: string | null;
  date: string;
  categoryId: string | null;
  payerIds: string[];
  notes: string | null;
  receiptUrl: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  splitType: string;
  payers: Array<{ memberId: string; amount: number }>;
  splits: Array<{ memberId: string; amount: number; percentage?: number; shares?: number }>;
  items: Array<{ id: string; description: string; amount: number; currency: string; assignedTo: string[] }>;
}

export interface ExpenseState {
  expenses: Expense[];
  currentExpense: Expense | null;
  loading: boolean;
  error: string | null;
  filters: any;
}

export const loadExpenses = createAction('[Expenses] Load Expenses', props<{ groupId: string; filters?: any }>());
export const loadExpensesSuccess = createAction('[Expenses] Load Expenses Success', props<{ expenses: Expense[]; total: number }>());
export const loadExpensesFailure = createAction('[Expenses] Load Expenses Failure', props<{ error: string }>());

export const loadExpense = createAction('[Expenses] Load Expense', props<{ groupId: string; expenseId: string }>());
export const loadExpenseSuccess = createAction('[Expenses] Load Expense Success', props<{ expense: Expense }>());
export const loadExpenseFailure = createAction('[Expenses] Load Expense Failure', props<{ error: string }>());

export const createExpense = createAction('[Expenses] Create Expense', props<{ groupId: string; expense: any }>());
export const createExpenseSuccess = createAction('[Expenses] Create Expense Success', props<{ expense: Expense }>());
export const createExpenseFailure = createAction('[Expenses] Create Expense Failure', props<{ error: string }>());

export const updateExpense = createAction('[Expenses] Update Expense', props<{ groupId: string; expenseId: string; changes: any }>());
export const updateExpenseSuccess = createAction('[Expenses] Update Expense Success', props<{ expense: Expense }>());
export const updateExpenseFailure = createAction('[Expenses] Update Expense Failure', props<{ error: string }>());

export const deleteExpense = createAction('[Expenses] Delete Expense', props<{ groupId: string; expenseId: string }>());
export const deleteExpenseSuccess = createAction('[Expenses] Delete Expense Success', props<{ expenseId: string }>());
export const deleteExpenseFailure = createAction('[Expenses] Delete Expense Failure', props<{ error: string }>());

export const clearError = createAction('[Expenses] Clear Error');
export const setCurrentExpense = createAction('[Expenses] Set Current Expense', props<{ expense: Expense | null }>());