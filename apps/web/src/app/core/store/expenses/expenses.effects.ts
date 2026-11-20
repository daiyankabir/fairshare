import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';

import * as ExpensesActions from './expenses.actions';
import { environment } from '../../../../environments/environment';

@Injectable()
export class ExpensesEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  loadExpenses$ = createEffect(() => this.actions$.pipe(
    ofType(ExpensesActions.loadExpenses),
    exhaustMap(({ groupId, filters }) =>
      this.http.get<{ expenses: any[]; total: number }>(`${environment.apiUrl}/groups/${groupId}/expenses`, { params: filters }).pipe(
        map(({ expenses, total }) => ExpensesActions.loadExpensesSuccess({ expenses, total })),
        catchError(error => of(ExpensesActions.loadExpensesFailure({ error: error.error?.message || 'Failed to load expenses' })))
      )
    )
  ));

  loadExpense$ = createEffect(() => this.actions$.pipe(
    ofType(ExpensesActions.loadExpense),
    exhaustMap(({ groupId, expenseId }) =>
      this.http.get<any>(`${environment.apiUrl}/groups/${groupId}/expenses/${expenseId}`).pipe(
        map(expense => ExpensesActions.loadExpenseSuccess({ expense })),
        catchError(error => of(ExpensesActions.loadExpenseFailure({ error: error.error?.message || 'Failed to load expense' })))
      )
    )
  ));

  createExpense$ = createEffect(() => this.actions$.pipe(
    ofType(ExpensesActions.createExpense),
    exhaustMap(({ groupId, expense }) =>
      this.http.post<any>(`${environment.apiUrl}/groups/${groupId}/expenses`, expense).pipe(
        map(expense => ExpensesActions.createExpenseSuccess({ expense })),
        catchError(error => of(ExpensesActions.createExpenseFailure({ error: error.error?.message || 'Failed to create expense' })))
      )
    )
  ));

  createExpenseSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(ExpensesActions.createExpenseSuccess),
    tap(({ expense }) => this.router.navigate(['/groups', expense.groupId, 'expenses', expense.id]))
  ), { dispatch: false });

  updateExpense$ = createEffect(() => this.actions$.pipe(
    ofType(ExpensesActions.updateExpense),
    exhaustMap(({ groupId, expenseId, changes }) =>
      this.http.patch<any>(`${environment.apiUrl}/groups/${groupId}/expenses/${expenseId}`, changes).pipe(
        map(expense => ExpensesActions.updateExpenseSuccess({ expense })),
        catchError(error => of(ExpensesActions.updateExpenseFailure({ error: error.error?.message || 'Failed to update expense' })))
      )
    )
  ));

  deleteExpense$ = createEffect(() => this.actions$.pipe(
    ofType(ExpensesActions.deleteExpense),
    exhaustMap(({ groupId, expenseId }) =>
      this.http.delete(`${environment.apiUrl}/groups/${groupId}/expenses/${expenseId}`).pipe(
        map(() => ExpensesActions.deleteExpenseSuccess({ expenseId })),
        catchError(error => of(ExpensesActions.deleteExpenseFailure({ error: error.error?.message || 'Failed to delete expense' })))
      )
    )
  ));

  deleteExpenseSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(ExpensesActions.deleteExpenseSuccess),
    tap(() => this.router.navigate(['/groups']))
  ), { dispatch: false });
}