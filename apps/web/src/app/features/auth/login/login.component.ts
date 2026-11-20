import { Component, signal, computed, inject } from '@angular/core';
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

import { AuthStore } from '../../../core/store/auth/auth.store';

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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Welcome back</mat-card-title>
          <mat-card-subtitle>Sign in to your FairShare account</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
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
              <mat-icon>error</mat-icon>
              <span>{{ authStore.error() }}</span>
            </div>
          }
        </mat-card-content>
        
        <mat-card-actions class="auth-footer">
          <p>Don't have an account? <a routerLink="/register">Create one</a></p>
        </mat-card-actions>
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
      max-width: 400px;
      padding: 8px;
    }
    
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .submit-btn {
      height: 48px;
      margin-top: 8px;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      border-radius: 8px;
      margin-top: 16px;
      font-size: 14px;
    }
    
    .auth-footer {
      display: flex;
      justify-content: center;
      padding: 16px 0 8px;
      margin: 0 -8px;
    }
    
    .auth-footer p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
    
    .auth-footer a {
      color: var(--mat-sys-primary);
      font-weight: 500;
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
    password: ['', [Validators.required, Validators.minLength(8)]]
  });
  
  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    
    const { email, password } = this.form.getRawValue();
    this.authStore.login(email, password);
  }
}