import { createReducer, on, Action } from '@ngrx/store';
import * as ExpensesActions from './expenses.actions';
import { ExpenseState } from './expenses.actions';

export const initialExpenseState: ExpenseState = {
  expenses: [],
  currentExpense: null,
  loading: false,
  error: null,
  filters: {}
};

export const expensesReducer = createReducer(
  initialExpenseState,
  on(ExpensesActions.loadExpenses, state => ({ ...state, loading: true, error: null })),
  on(ExpensesActions.loadExpensesSuccess, (state, { expenses }) => ({
    ...state,
    expenses,
    loading: false,
    error: null
  })),
  on(ExpensesActions.loadExpensesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(ExpensesActions.loadExpense, state => ({ ...state, loading: true, error: null })),
  on(ExpensesActions.loadExpenseSuccess, (state, { expense }) => ({
    ...state,
    currentExpense: expense,
    loading: false,
    error: null
  })),
  on(ExpensesActions.loadExpenseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(ExpensesActions.createExpense, state => ({ ...state, loading: true, error: null })),
  on(ExpensesActions.createExpenseSuccess, (state, { expense }) => ({
    ...state,
    expenses: [expense, ...state.expenses],
    loading: false,
    error: null
  })),
  on(ExpensesActions.createExpenseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(ExpensesActions.updateExpense, state => ({ ...state, loading: true, error: null })),
  on(ExpensesActions.updateExpenseSuccess, (state, { expense }) => ({
    ...state,
    expenses: state.expenses.map(e => e.id === expense.id ? expense : e),
    currentExpense: state.currentExpense?.id === expense.id ? expense : state.currentExpense,
    loading: false,
    error: null
  })),
  on(ExpensesActions.updateExpenseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(ExpensesActions.deleteExpense, state => ({ ...state, loading: true, error: null })),
  on(ExpensesActions.deleteExpenseSuccess, (state, { expenseId }) => ({
    ...state,
    expenses: state.expenses.filter(e => e.id !== expenseId),
    currentExpense: state.currentExpense?.id === expenseId ? null : state.currentExpense,
    loading: false,
    error: null
  })),
  on(ExpensesActions.deleteExpenseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(ExpensesActions.clearError, state => ({ ...state, error: null })),
  on(ExpensesActions.setCurrentExpense, (state, { expense }) => ({
    ...state,
    currentExpense: expense
  }))
);

export function reducer(state: ExpenseState | undefined, action: Action): ExpenseState {
  return expensesReducer(state, action);
}