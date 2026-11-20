import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { tap, catchError, of } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
  avatarColor?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  readonly #state = signal<AuthState>(this.loadInitialState());
  
  readonly user = computed(() => this.#state().user);
  readonly token = computed(() => this.#state().token);
  readonly isAuthenticated = computed(() => this.#state().isAuthenticated);
  readonly isLoading = computed(() => this.#state().isLoading);
  readonly error = computed(() => this.#state().error);
  
  readonly currentUserName = computed((): string => this.user()?.name || 'Guest');
  readonly currentUserEmail = computed((): string => this.user()?.email || '');
  readonly currentUserInitials = computed((): string => {
    const name = this.user()?.name || 'GU';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });
  readonly currentUserColor = computed((): string => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2',
      '#0097a7', '#c2185b', '#5d4037', '#37474f', '#1b5e20'
    ];
    const id = this.user()?.id || 'guest';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  });
  readonly currentUserCurrency = computed((): string => this.user()?.defaultCurrency || 'USD');
  
  private loadInitialState(): AuthState {
    if (typeof window === 'undefined') return initialState;
    
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        return { ...initialState, user, token, isAuthenticated: true };
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    return initialState;
  }
  
  private updateState(partial: Partial<AuthState>): void {
    this.#state.update(state => ({ ...state, ...partial }));
  }
  
  login(email: string, password: string): void {
    this.updateState({ isLoading: true, error: null });
    
    this.http.post<{ user: User; token: string }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('auth_user', JSON.stringify(response.user));
          this.updateState({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          this.router.navigate(['/groups']);
        }),
        catchError(err => {
          this.updateState({
            isLoading: false,
            error: err.error?.message || 'Login failed'
          });
          return of(null);
        })
      )
      .subscribe();
  }
  
  register(email: string, password: string, name: string): void {
    this.updateState({ isLoading: true, error: null });
    
    this.http.post<{ user: User; token: string }>(`${environment.apiUrl}/auth/register`, { email, password, name })
      .pipe(
        tap(response => {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('auth_user', JSON.stringify(response.user));
          this.updateState({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          this.router.navigate(['/groups']);
        }),
        catchError(err => {
          this.updateState({
            isLoading: false,
            error: err.error?.message || 'Registration failed'
          });
          return of(null);
        })
      )
      .subscribe();
  }
  
  claimGuestAccount(email: string, password: string, guestToken: string): void {
    this.updateState({ isLoading: true, error: null });
    
    this.http.post<{ user: User; token: string }>(`${environment.apiUrl}/auth/claim-guest`, { email, password, guestToken })
      .pipe(
        tap(response => {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('auth_user', JSON.stringify(response.user));
          this.updateState({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          this.router.navigate(['/groups']);
        }),
        catchError(err => {
          this.updateState({
            isLoading: false,
            error: err.error?.message || 'Failed to claim account'
          });
          return of(null);
        })
      )
      .subscribe();
  }
  
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.#state.set(initialState);
    this.router.navigate(['/login']);
  }
  
  updateProfile(updates: Partial<User>): void {
    const currentUser = this.user();
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    this.updateState({ user: updatedUser });
  }
  
  clearError(): void {
    this.updateState({ error: null });
  }
}