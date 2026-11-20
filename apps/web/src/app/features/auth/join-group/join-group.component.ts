import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthStore } from '../../../core/store/auth/auth.store';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];

interface InviteInfo {
  groupName: string;
  groupCurrency: string;
  role: string;
}

@Component({
  selector: 'app-join-group',
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
    MatSelectModule,
    MatTooltipModule,
    ThemeToggleComponent
  ],
  template: `
    <header class="auth-header">
      <a routerLink="/groups" class="auth-brand" aria-label="FairShare Home">
        <mat-icon>groups</mat-icon>
        <span>{{ inviteInfo()?.groupName || 'FairShare' }}</span>
      </a>
      <div class="auth-header-actions">
        <app-theme-toggle></app-theme-toggle>
        <a routerLink="/login" class="auth-link">Go to login</a>
      </div>
    </header>

    <main class="auth-main">
      <div class="auth-container">
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading invitation...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <mat-icon>error_outline</mat-icon>
            <h2>Invalid invitation</h2>
            <p>{{ error() }}</p>
            <a mat-button routerLink="/login" color="primary">Go to login</a>
          </div>
        } @else {
          @let invite = inviteInfo();
          @if (invite) {
            <mat-card class="auth-card">
              <mat-card-content>
                <div class="auth-card-header">
                  <h1>Join as guest</h1>
                  <p>Enter your name to participate in "{{ invite.groupName }}"</p>
                </div>

                <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Your name</mat-label>
                    <input matInput formControlName="name" autocomplete="name" />
                    <mat-icon matPrefix>person</mat-icon>
                    @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                      <mat-error>Name is required</mat-error>
                    }
                  </mat-form-field>

                  <div class="info-row">
                    <mat-icon>attach_money</mat-icon>
                    <span>Group currency: {{ invite.groupCurrency }}</span>
                  </div>

                  <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="form.invalid || submitting()">
                    @if (submitting()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <span>Join group</span>
                    }
                  </button>
                </form>

                <div class="divider">
                  <span>Or create an account</span>
                </div>

                <form [formGroup]="claimForm" (ngSubmit)="onClaim()" class="auth-form claim-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email" autocomplete="email" />
                    <mat-icon matPrefix>email</mat-icon>
                    @if (claimForm.get('email')?.hasError('required') && claimForm.get('email')?.touched) {
                      <mat-error>Email is required</mat-error>
                    }
                    @if (claimForm.get('email')?.hasError('email') && claimForm.get('email')?.touched) {
                      <mat-error>Enter a valid email</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Password</mat-label>
                    <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" autocomplete="new-password" />
                    <mat-icon matPrefix>lock</mat-icon>
                    <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())" [attr.aria-label]="'Toggle password visibility'">
                      <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (claimForm.get('password')?.hasError('required') && claimForm.get('password')?.touched) {
                      <mat-error>Password is required</mat-error>
                    }
                    @if (claimForm.get('password')?.hasError('minlength') && claimForm.get('password')?.touched) {
                      <mat-error>At least 8 characters</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Default currency</mat-label>
                    <mat-select formControlName="defaultCurrency">
                      @for (currency of currencies; track currency) {
                        <mat-option [value]="currency">{{ currency }}</mat-option>
                      }
                    </mat-select>
                    <mat-icon matPrefix>attach_money</mat-icon>
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="claimForm.invalid || claiming()">
                    @if (claiming()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <span>Create account & join</span>
                    }
                  </button>
                </form>
              </mat-card-content>
            </mat-card>
          }
        }
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
      max-width: 440px;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-10) var(--space-6);
      text-align: center;
      gap: var(--space-4);
      max-width: 400px;
      width: 100%;
    }

    .loading-state mat-spinner { color: var(--accent); }
    .loading-state p { margin: 0; color: var(--text-secondary); }

    .error-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--error);
    }
    .error-state h2 { margin: 0; font-size: 20px; font-weight: 500; }
    .error-state p { margin: 0; color: var(--text-secondary); }

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
        line-height: 1.3;
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
      margin-top: 0;
    }

    .claim-form {
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-hairline);
    }

    .full-width { width: 100%; }

    .submit-btn { height: 44px; margin-top: var(--space-2); font-size: 15px; font-weight: 600; }

    .info-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--text-secondary);
      font-size: 13px;
      padding: var(--space-2) 0;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin: var(--space-2) 0;
      color: var(--text-muted);
      font-size: 13px;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border-hairline);
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

      .auth-card-header {
        margin-bottom: var(--space-4);

        h1 { font-size: 22px; }
        p { font-size: 14px; }
      }

      .auth-form { padding: var(--space-5); gap: var(--space-3); }
      .claim-form { margin-top: var(--space-3); padding-top: var(--space-3); }
    }
  `]
})
export class JoinGroupComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  readonly authStore = inject(AuthStore);

  readonly currencies = CURRENCIES;
  readonly hidePassword = signal(true);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly claiming = signal(false);
  readonly error = signal<string | null>(null);
  readonly inviteInfo = signal<InviteInfo | null>(null);

  readonly token = computed(() => this.route.snapshot.paramMap.get('token'));

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]]
  });

  readonly claimForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    defaultCurrency: ['USD', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.loadInvite();
  }

  private async loadInvite(): Promise<void> {
    const token = this.token();
    if (!token) {
      this.error.set('No invitation token provided');
      this.loading.set(false);
      return;
    }

    try {
      const response = await this.http.get<InviteInfo>(`${environment.apiUrl}/invites/${token}/info`).toPromise();
      if (response) {
        this.inviteInfo.set(response);
      } else {
        this.error.set('Invitation not found');
      }
    } catch (err) {
      this.error.set('Invalid or expired invitation');
    } finally {
      this.loading.set(false);
    }
  }

  private passwordMatchValidator(control: any) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.token()) return;

    this.submitting.set(true);
    try {
      const { name } = this.form.getRawValue();
      await this.joinAsGuest(name, this.token()!);
      this.router.navigate(['/groups']);
    } catch (err) {
      this.snackBar.open('Failed to join group', 'Dismiss', { duration: 5000 });
    } finally {
      this.submitting.set(false);
    }
  }

  async onClaim(): Promise<void> {
    if (this.claimForm.invalid || !this.token()) return;

    this.claiming.set(true);
    try {
      const { email, password, defaultCurrency } = this.claimForm.getRawValue();
      this.authStore.claimGuestAccount(email, password, this.token()!);
    } catch (err) {
      this.snackBar.open('Failed to create account', 'Dismiss', { duration: 5000 });
    } finally {
      this.claiming.set(false);
    }
  }

  private async joinAsGuest(name: string, token: string): Promise<void> {
    await this.http.post(`${environment.apiUrl}/invites/${token}/join`, { name }).toPromise();
  }
}