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

import { AuthStore } from '../../../core/store/auth/auth.store';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
    MatSelectModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        @if (loading()) {
          <mat-card-content class="loading-state">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Loading invitation...</p>
          </mat-card-content>
        } @else if (error()) {
          <mat-card-content class="error-state">
            <mat-icon>error</mat-icon>
            <h2>Invalid Invitation</h2>
            <p>{{ error() }}</p>
            <a mat-button routerLink="/login" color="primary">Go to Login</a>
          </mat-card-content>
        } @else {
          @let invite = inviteInfo();
          @if (invite) {
            <mat-card-header>
              <mat-card-title>Join "{{ invite.groupName }}"</mat-card-title>
              <mat-card-subtitle>Enter your name to participate as a guest</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Your Name</mat-label>
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
                    <span>Join Group</span>
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
                    <mat-error>Password must be at least 8 characters</mat-error>
                  }
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Default Currency</mat-label>
                  <mat-select formControlName="defaultCurrency">
                    @for (currency of currencies; track currency) {
                      <mat-option [value]="currency">{{ currency }}</mat-option>
                    }
                  </mat-select>
                  <mat-icon matPrefix>attach_money</mat-icon>
                </mat-form-field>
                
                <button mat-flat-button color="accent" type="submit" class="full-width submit-btn" [disabled]="claimForm.invalid || claiming()">
                  @if (claiming()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <span>Create Account & Join</span>
                  }
                </button>
              </form>
            </mat-card-content>
          }
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 8px;
    }
    
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      gap: 16px;
    }
    
    .error-state h2 { margin: 0; }
    .error-state p { margin: 0; color: var(--mat-sys-on-surface-variant); }
    
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
    }
    
    .claim-form {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    
    .full-width { width: 100%; }
    
    .submit-btn { height: 48px; margin-top: 8px; }
    
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      padding: 8px 0;
    }
    
    .divider {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 8px 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 13px;
    }
    
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--mat-sys-outline-variant);
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