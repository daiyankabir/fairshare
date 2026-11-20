import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../core/store/auth/auth.store';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule, MatDividerModule],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
          <mat-card-title>Profile</mat-card-title>
          <mat-card-subtitle>Manage your account details</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="avatar-section">
            <div class="avatar" [style.background-color]="authStore.currentUserColor()">
              {{ authStore.currentUserInitials() }}
            </div>
            <p class="avatar-hint">Avatar color is generated from your user ID</p>
          </div>
          
          <mat-divider class="section-divider" />
          
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" autocomplete="name" />
              <mat-icon matPrefix>person</mat-icon>
              @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                <mat-error>Name is required</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" [disabled]="true" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-hint>Email cannot be changed</mat-hint>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Default Currency</mat-label>
              <mat-select formControlName="defaultCurrency">
                @for (c of currencies; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
              </mat-select>
              <mat-icon matPrefix>attach_money</mat-icon>
            </mat-form-field>
            
            <div class="form-actions">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                @if (submitting()) { <mat-spinner diameter="20"></mat-spinner> } @else { Save Changes }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      
      <mat-card class="profile-card">
        <mat-card-header>
          <mat-card-title>Security</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="security-note">Password changes and authentication settings are managed through your identity provider.</p>
          <button mat-stroked-button color="primary" routerLink="/settings">
            <mat-icon>settings</mat-icon>
            Go to Settings
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container { display: flex; flex-direction: column; align-items: center; padding: 24px; gap: 24px; max-width: 500px; margin: 0 auto; }
    .profile-card { width: 100%; }
    .avatar-section { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 0; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 700; }
    .avatar-hint { margin: 0; color: var(--mat-sys-on-surface-variant); font-size: 13px; }
    .section-divider { margin: 16px 0; }
    .form { display: flex; flex-direction: column; gap: 20px; margin-top: 8px; }
    .full-width { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
    .security-note { margin: 0 0 16px; color: var(--mat-sys-on-surface-variant); }
  `]
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  readonly authStore = inject(AuthStore);
  
  currencies = CURRENCIES;
  submitting = signal(false);
  
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: [{ value: '', disabled: true }],
    defaultCurrency: ['USD', Validators.required]
  });
  
  ngOnInit(): void {
    const user = this.authStore.user();
    if (user) {
      this.form.patchValue({
        name: user.name,
        email: user.email,
        defaultCurrency: user.defaultCurrency
      });
    }
  }
  
  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting.set(true);
    try {
      const { name, defaultCurrency } = this.form.getRawValue();
      this.authStore.updateProfile({ name, defaultCurrency });
      this.snackBar.open('Profile updated', 'Dismiss', { duration: 3000 });
    } catch (err) {
      this.snackBar.open('Failed to update profile', 'Dismiss', { duration: 5000 });
    } finally {
      this.submitting.set(false);
    }
  }
}