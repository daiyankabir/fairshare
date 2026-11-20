import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AuthStore } from '../../../core/store/auth/auth.store';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    ThemeToggleComponent
  ],
  template: `
    <header class="auth-header">
      <a routerLink="/groups" class="auth-brand" aria-label="FairShare Home">
        <mat-icon>account_balance_wallet</mat-icon>
        <span>FairShare</span>
      </a>
      <div class="auth-header-actions">
        <app-theme-toggle></app-theme-toggle>
        <a routerLink="/register" class="auth-link">Create account</a>
      </div>
    </header>

    <main class="auth-main">
      <div class="auth-container">
        <mat-card class="auth-card">
          <mat-card-content>
            <div class="auth-card-header">
              <h1>Sign in</h1>
              <p>Welcome back to your expense groups</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email" />
                <mat-icon matPrefix>email</mat-icon>
                @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
                @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                  <mat-error>Enter a valid email</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" autocomplete="current-password" />
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())" [attr.aria-label]="'Toggle password visibility'">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                  <mat-error>Password is required</mat-error>
                }
              </mat-form-field>

              <div class="form-options">
                <label class="checkbox-wrapper">
                  <input type="checkbox" formControlName="rememberMe" />
                  <span>Remember me</span>
                </label>
                <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
              </div>

              <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="form.invalid || authStore.isLoading()">
                @if (authStore.isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <span>Sign in</span>
                }
              </button>
            </form>

            @if (authStore.error()) {
              <div class="error-message" role="alert">
                <mat-icon>error_outline</mat-icon>
                <span>{{ authStore.error() }}</span>
              </div>
            }
          </mat-card-content>

          <mat-card-actions class="auth-footer">
            <p>No account? <a routerLink="/register">Create one</a></p>
          </mat-card-actions>
        </mat-card>
      </div>
    </main>
  `,
  styles: [`
    .auth-header {
      height: 64px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--space-4);
      background: var(--bg-page);
      border-bottom: 1px solid var(--border-hairline);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .auth-brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 16px;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      transition: background 160ms;

      &:hover {
        background: var(--bg-raised);
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--accent);
      }
    }

    .auth-header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .auth-link {
      color: var(--accent);
      font-weight: 500;
      text-decoration: none;
      font-size: 14px;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      transition: background 160ms;

      &:hover {
        background: var(--accent-container);
        text-decoration: none;
      }
    }

    .auth-main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-6) var(--space-4);
      width: 100%;
      min-height: calc(100dvh - 64px);
    }

    .auth-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 400px;
    }

    .auth-card {
      width: 100%;
      padding: 0;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
    }

    .auth-card-header {
      text-align: left;
      margin-bottom: var(--space-6);
      width: 100%;

      h1 {
        margin: 0 0 var(--space-1);
        font-size: 24px;
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.2;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
        line-height: 1.5;
      }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6);
    }

    .full-width { width: 100%; }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: calc(var(--space-2) * -1);
    }

    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--accent);
      }
    }

    .forgot-link {
      font-size: 13px;
      color: var(--accent);
      text-decoration: none;
      font-weight: 500;

      &:hover { text-decoration: underline; }
    }

    .submit-btn {
      height: 44px;
      margin-top: var(--space-2);
      font-size: 15px;
      font-weight: 600;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--error);
      color: var(--text-inverse);
      border-radius: var(--radius-md);
      margin-top: var(--space-2);
      font-size: 13px;
      word-break: break-word;
    }

    .auth-footer {
      display: flex;
      justify-content: center;
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--border-hairline);
      margin: 0;

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
      }

      a {
        color: var(--accent);
        font-weight: 500;
        text-decoration: none;

        &:hover { text-decoration: underline; }
      }
    }

    @media (max-width: 599px) {
      .auth-header {
        padding: 0 var(--space-3);
      }

      .auth-main {
        padding: var(--space-4) var(--space-3);
        align-items: flex-start;
      }

      .auth-container {
        width: 100%;
      }

      .auth-form {
        padding: var(--space-5);
        gap: var(--space-3);
      }

      .form-options { flex-direction: column; gap: var(--space-2); align-items: flex-start; }
      .forgot-link { align-self: flex-start; }

      .auth-footer { padding: var(--space-3) var(--space-5); }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly authStore = inject(AuthStore);

  readonly hidePassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false]
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    this.authStore.login(email, password);
  }
}