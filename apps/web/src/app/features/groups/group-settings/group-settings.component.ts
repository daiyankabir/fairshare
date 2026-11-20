import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
const ICONS = ['groups', 'flight', 'restaurant', 'local_bar', 'sports_esports', 'school', 'work', 'beach_access', 'cake', 'ac_unit', 'terrain', 'island', 'directions_car', 'shopping_cart', 'attach_money', 'smartphone'];

@Component({
  selector: 'app-group-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule, MatDividerModule],
  template: `
    <div class="settings-container">
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Group details</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Group name</mat-label>
              <input matInput formControlName="name" maxlength="100" />
              <mat-icon matPrefix>group</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Default currency</mat-label>
              <mat-select formControlName="defaultCurrency">
                @for (c of currencies; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
              </mat-select>
              <mat-icon matPrefix>attach_money</mat-icon>
            </mat-form-field>

            <div class="field">
              <label>Cover icon</label>
              <div class="icon-picker">
                @for (icon of icons; track icon) {
                  <button type="button" class="icon-btn" [class.selected]="form.get('coverIcon')?.value === icon" (click)="form.get('coverIcon')?.setValue(form.get('coverIcon')?.value === icon ? '' : icon)">
                    <mat-icon>{{ icon }}</mat-icon>
                  </button>
                }
                <input type="text" formControlName="coverIcon" class="hidden-input" />
              </div>
            </div>

            <mat-divider class="section-divider" />

            <h3>Danger zone</h3>
            <p class="danger-text">Archive or delete this group. This action cannot be undone.</p>

            <div class="danger-actions">
              <button mat-stroked-button color="warn" type="button" (click)="archiveGroup()">
                <mat-icon>archive</mat-icon>
                Archive group
              </button>
              <button mat-stroked-button color="warn" type="button" (click)="deleteGroup()" class="delete-btn">
                <mat-icon>delete_forever</mat-icon>
                Delete group
              </button>
            </div>

            <div class="form-actions">
              <button mat-button type="button" routerLink="../">Cancel</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                @if (submitting()) { <mat-spinner diameter="20"></mat-spinner> } @else { Save changes }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { display: flex; align-items: flex-start; justify-content: center; min-height: 100vh; padding: var(--space-8) var(--space-4); }
    .settings-card { width: 100%; max-width: 640px; box-shadow: none; border: 1px solid var(--border-hairline); }
    .form { display: flex; flex-direction: column; gap: var(--space-5); margin-top: var(--space-2); }
    .full-width { width: 100%; }

    .field { display: flex; flex-direction: column; gap: var(--space-2); }
    .field label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }

    .icon-picker { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .icon-btn {
      width: 48px; height: 48px;
      border: 1px solid var(--border-hairline); border-radius: var(--radius-md);
      background: var(--bg-raised); font-size: 22px; cursor: pointer;
      transition: border-color 160ms, background 160ms;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary);

      &:hover { border-color: var(--accent); background: var(--bg-card); }
      &.selected { border-color: var(--accent); background: var(--accent-container); color: var(--accent-on-container); }
    }

    .hidden-input { display: none; }

    .section-divider { margin: var(--space-6) 0; }

    .danger-text { margin: 0 0 var(--space-4); color: var(--text-secondary); font-size: 14px; line-height: 1.5; }

    .danger-actions { display: flex; gap: var(--space-3); }

    .delete-btn { color: var(--error); border-color: var(--error); }

    .form-actions {
      display: flex; justify-content: flex-end; gap: var(--space-3);
      margin-top: var(--space-3); padding-top: var(--space-4);
      border-top: 1px solid var(--border-hairline);
    }

    @media (max-width: 599px) {
      .settings-container { padding: var(--space-6) var(--space-3); align-items: stretch; }
      .settings-card { max-width: none; }
      .danger-actions { flex-direction: column; }
      .danger-actions button { width: 100%; }
      .form-actions { flex-direction: column-reverse; }
      .form-actions button { width: 100%; }
    }
  `]
})
export class GroupSettingsComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  currencies = CURRENCIES;
  icons = ICONS;
  submitting = signal(false);
  groupId = signal<string>('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    defaultCurrency: ['USD', Validators.required],
    coverIcon: ['']
  });

  ngOnInit(): void {
    this.groupId.set(this.route.snapshot.paramMap.get('id') || '');
    this.loadGroup();
  }

  async loadGroup(): Promise<void> {
    // placeholder
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting.set(true);
    try {
      this.snackBar.open('Settings saved', 'Dismiss', { duration: 3000 });
    } catch (err) {
      this.snackBar.open('Failed to save', 'Dismiss', { duration: 5000 });
    } finally { this.submitting.set(false); }
  }

  async archiveGroup(): Promise<void> {
    if (!confirm('Archive this group?')) return;
    this.snackBar.open('Group archived', 'Dismiss', { duration: 3000 });
  }

  async deleteGroup(): Promise<void> {
    if (!confirm('Delete this group? This cannot be undone!')) return;
    this.snackBar.open('Group deleted', 'Dismiss', { duration: 3000 });
    this.router.navigate(['/groups']);
  }
}