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

import { AuthStore } from '../../../core/store/auth/auth.store';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-forgot-password',
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
        <a routerLink="/login" class="auth-link">Sign in</a>
      </div>
    </header>

    <main class="auth-main">
      <div class="auth-container">
        <mat-card class="auth-card">
          <mat-card-content>
            <div class="auth-card-header">
              <h1>Forgot password?</h1>
              <p>Enter your email and we'll send you a link to reset your password.</p>
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

              <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="form.invalid || submitting()">
                @if (submitting()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <span>Send reset link</span>
                }
              </button>
            </form>

            @if (submitted()) {
              <div class="success-message" role="status">
                <mat-icon>check_circle</mat-icon>
                <div>
                  <p class="success-title">Check your email</p>
                  <p class="success-subtitle">If the email exists, we've sent a password reset link.</p>
                </div>
              </div>
            }

            @if (authStore.error() && !submitted()) {
              <div class="error-message" role="alert">
                <mat-icon>error_outline</mat-icon>
                <span>{{ authStore.error() }}</span>
              </div>
            }
          </mat-card-content>

          <mat-card-actions class="auth-footer">
            <p>Remember your password? <a routerLink="/login">Sign in</a></p>
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

    .submit-btn {
      height: 44px;
      margin-top: var(--space-2);
      font-size: 15px;
      font-weight: 600;
    }

    .success-message {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--success);
      color: var(--text-inverse);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-2);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        margin-top: 2px;
      }
    }

    .success-title {
      margin: 0 0 var(--space-1);
      font-size: 15px;
      font-weight: 600;
    }

    .success-subtitle {
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
      line-height: 1.5;
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

      .auth-footer { padding: var(--space-3) var(--space-5); }
    }
  `]
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly authStore = inject(AuthStore);

  readonly submitted = signal(false);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.submitting.set(true);
    try {
      const { email } = this.form.getRawValue();
      // TODO: Call forgot password API
      // await this.authStore.forgotPassword(email);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      this.submitted.set(true);
      this.snackBar.open('If the email exists, a reset link has been sent', 'Dismiss', { duration: 5000 });
    } catch (err) {
      this.snackBar.open('Failed to send reset link', 'Dismiss', { duration: 5000 });
    } finally {
      this.submitting.set(false);
    }
  }
}