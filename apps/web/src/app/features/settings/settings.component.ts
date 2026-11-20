import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService } from '../../core/services/theme.service';
import { AuthStore } from '../../core/store/auth/auth.store';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatSlideToggleModule, MatDividerModule, MatProgressSpinnerModule],
  template: `
    <div class="settings-container">
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Appearance</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="appearanceForm" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Theme</mat-label>
              <mat-select formControlName="theme">
                <mat-option value="system">System default</mat-option>
                <mat-option value="light">Light</mat-option>
                <mat-option value="dark">Dark</mat-option>
              </mat-select>
              <mat-icon matPrefix>palette</mat-icon>
            </mat-form-field>

            <div class="form-actions">
              <button mat-flat-button color="primary" type="button" (click)="saveAppearance()" [disabled]="savingAppearance()">
                @if (savingAppearance()) { <mat-spinner diameter="20"></mat-spinner> } @else { Save theme }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Preferences</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="preferencesForm" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Default currency</mat-label>
              <mat-select formControlName="defaultCurrency">
                @for (c of currencies; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
              </mat-select>
              <mat-icon matPrefix>attach_money</mat-icon>
            </mat-form-field>

            <mat-slide-toggle formControlName="compactMode">Compact mode</mat-slide-toggle>
            <mat-slide-toggle formControlName="animationsEnabled">Enable animations</mat-slide-toggle>

            <div class="form-actions">
              <button mat-flat-button color="primary" type="button" (click)="savePreferences()" [disabled]="savingPreferences()">
                @if (savingPreferences()) { <mat-spinner diameter="20"></mat-spinner> } @else { Save preferences }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Data & privacy</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="data-actions">
            <div class="data-action">
              <div class="data-info">
                <h4>Export data</h4>
                <p>Download all your data in JSON format</p>
              </div>
              <button mat-stroked-button color="primary" (click)="exportData()">
                <mat-icon>download</mat-icon>
                Export
              </button>
            </div>
            <mat-divider />
            <div class="data-action danger">
              <div class="data-info">
                <h4>Delete account</h4>
                <p>Permanently delete your account and all data</p>
              </div>
              <button mat-stroked-button color="warn" (click)="confirmDeleteAccount()">
                <mat-icon>delete_forever</mat-icon>
                Delete account
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { display: flex; flex-direction: column; align-items: center; padding: var(--space-6) var(--space-4); gap: var(--space-4); max-width: 640px; margin: 0 auto; width: 100%; }
    .settings-card { width: 100%; box-shadow: none; border: 1px solid var(--border-hairline); }
    .form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-2); }
    .full-width { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; margin-top: var(--space-2); }
    .form-actions button { min-width: 140px; }

    .data-actions { display: flex; flex-direction: column; gap: var(--space-4); }
    .data-action { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) 0; }
    .data-action.danger { color: var(--error); }
    .data-info h4 { margin: 0 0 var(--space-1); font-size: 15px; font-weight: 500; }
    .data-info p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.5; }

    @media (max-width: 599px) {
      .settings-container { padding: var(--space-4) var(--space-3); }
      .data-action { flex-direction: column; align-items: stretch; gap: var(--space-3); }
      .data-action button { width: 100%; }
    }
  `]
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  readonly themeService = inject(ThemeService);
  readonly authStore = inject(AuthStore);

  currencies = CURRENCIES;
  savingAppearance = signal(false);
  savingPreferences = signal(false);

  appearanceForm = this.fb.nonNullable.group({
    theme: ['system', Validators.required]
  });

  preferencesForm = this.fb.nonNullable.group({
    defaultCurrency: ['USD', Validators.required],
    compactMode: [false],
    animationsEnabled: [true]
  });

  ngOnInit(): void {
    const user = this.authStore.user();
    if (user) { this.preferencesForm.patchValue({ defaultCurrency: user.defaultCurrency }); }
    this.appearanceForm.patchValue({ theme: this.themeService.currentTheme() });
  }

  async saveAppearance(): Promise<void> {
    this.savingAppearance.set(true);
    this.themeService.setTheme(this.appearanceForm.value.theme as 'light' | 'dark' | 'system');
    this.snackBar.open('Theme saved', 'Dismiss', { duration: 3000 });
    this.savingAppearance.set(false);
  }

  async savePreferences(): Promise<void> {
    this.savingPreferences.set(true);
    const { defaultCurrency } = this.preferencesForm.getRawValue();
    this.authStore.updateProfile({ defaultCurrency });
    this.snackBar.open('Preferences saved', 'Dismiss', { duration: 3000 });
    this.savingPreferences.set(false);
  }

  async exportData(): Promise<void> {
    this.snackBar.open('Export functionality coming soon', 'Dismiss', { duration: 3000 });
  }

  async confirmDeleteAccount(): Promise<void> {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone!')) return;
    if (!confirm('This will permanently delete ALL your data. Type "DELETE" to confirm.')) return;
    this.snackBar.open('Account deletion coming soon', 'Dismiss', { duration: 3000 });
  }
}