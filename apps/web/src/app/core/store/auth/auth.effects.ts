import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';

import * as AuthActions from './auth.actions';
import { environment } from '../../../../environments/environment';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  loadFromStorage$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.loadFromStorage),
    switchMap(() => {
      if (typeof window === 'undefined') return of(AuthActions.loadFromStorage({ user: null, token: null }));
      
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          return of(AuthActions.loadFromStorage({ user, token }));
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      return of(AuthActions.loadFromStorage({ user: null, token: null }));
    })
  ));

  login$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.login),
    exhaustMap(({ email, password }) =>
      this.http.post<{ user: any; token: string }>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
        map(({ user, token }) => {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
          return AuthActions.loginSuccess({ user, token });
        }),
        catchError(error => of(AuthActions.loginFailure({ error: error.error?.message || 'Login failed' })))
      )
    )
  ));

  loginSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.loginSuccess),
    tap(() => this.router.navigate(['/groups']))
  ), { dispatch: false });

  register$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.register),
    exhaustMap(({ email, password, name }) =>
      this.http.post<{ user: any; token: string }>(`${environment.apiUrl}/auth/register`, { email, password, name }).pipe(
        map(({ user, token }) => {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
          return AuthActions.registerSuccess({ user, token });
        }),
        catchError(error => of(AuthActions.registerFailure({ error: error.error?.message || 'Registration failed' })))
      )
    )
  ));

  registerSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.registerSuccess),
    tap(() => this.router.navigate(['/groups']))
  ), { dispatch: false });

  claimGuest$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.claimGuest),
    exhaustMap(({ email, password, guestToken }) =>
      this.http.post<{ user: any; token: string }>(`${environment.apiUrl}/auth/claim-guest`, { email, password, guestToken }).pipe(
        map(({ user, token }) => {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
          return AuthActions.claimGuestSuccess({ user, token });
        }),
        catchError(error => of(AuthActions.claimGuestFailure({ error: error.error?.message || 'Failed to claim account' })))
      )
    )
  ));

  claimGuestSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.claimGuestSuccess),
    tap(() => this.router.navigate(['/groups']))
  ), { dispatch: false });

  logout$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.logout),
    tap(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      this.router.navigate(['/login']);
    })
  ), { dispatch: false });

  updateProfile$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.updateProfile),
    exhaustMap(({ updates }) =>
      this.http.patch<any>(`${environment.apiUrl}/auth/profile`, updates).pipe(
        map(user => {
          localStorage.setItem('auth_user', JSON.stringify(user));
          return AuthActions.updateProfile({ updates: user });
        }),
        catchError(error => of(AuthActions.loginFailure({ error: error.error?.message || 'Failed to update profile' })))
      )
    )
  ));
}