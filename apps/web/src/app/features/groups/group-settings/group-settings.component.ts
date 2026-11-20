import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
const EMOJIS = ['🏠', '✈️', '🍕', '🍻', '🎮', '🎓', '💼', '🏖️', '🎂', '🎄', '🏔️', '🏝️', '🚗', '🛒', '💰', '📱'];

@Component({
  selector: 'app-group-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule, MatDividerModule],
  template: `
    <div class="settings-container">
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Group Settings</mat-card-title>
          <mat-card-subtitle>Manage your group details</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Group Name</mat-label>
              <input matInput formControlName="name" maxlength="100" />
              <mat-icon matPrefix>group</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Default Currency</mat-label>
              <mat-select formControlName="defaultCurrency">
                @for (c of currencies; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
              </mat-select>
              <mat-icon matPrefix>attach_money</mat-icon>
            </mat-form-field>
            
            <div class="field">
              <label>Cover Emoji</label>
              <div class="emoji-picker">
                @for (emoji of emojis; track emoji) {
                  <button type="button" class="emoji-btn" [class.selected]="form.get('coverEmoji')?.value === emoji" (click)="form.get('coverEmoji')?.setValue(form.get('coverEmoji')?.value === emoji ? '' : emoji)">
                    {{ emoji }}
                  </button>
                }
                <input type="text" formControlName="coverEmoji" class="hidden-input" />
              </div>
            </div>
            
            <mat-divider class="section-divider" />
            
            <h3>Danger Zone</h3>
            <p class="danger-text">Archive or delete this group. This action cannot be undone.</p>
            
            <div class="danger-actions">
              <button mat-stroked-button color="warn" type="button" (click)="archiveGroup()">
                <mat-icon>archive</mat-icon>
                Archive Group
              </button>
              <button mat-stroked-button color="warn" type="button" (click)="deleteGroup()" class="delete-btn">
                <mat-icon>delete_forever</mat-icon>
                Delete Group
              </button>
            </div>
            
            <div class="form-actions">
              <button mat-button type="button" routerLink="../">Cancel</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                @if (submitting()) { <mat-spinner diameter="20"></mat-spinner> } @else { Save Changes }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { display: flex; align-items: flex-start; justify-content: center; min-height: 100vh; padding: 48px 24px; }
    .settings-card { width: 100%; max-width: 600px; }
    .form { display: flex; flex-direction: column; gap: 20px; margin-top: 8px; }
    .full-width { width: 100%; }
    .field { display: flex; flex-direction: column; gap: 8px; }
    .field label { font-size: 14px; font-weight: 500; color: var(--mat-sys-on-surface-variant); }
    .emoji-picker { display: flex; flex-wrap: wrap; gap: 8px; }
    .emoji-btn { width: 48px; height: 48px; border: 2px solid var(--mat-sys-outline-variant); border-radius: 12px; background: var(--mat-sys-surface-container-low); font-size: 24px; cursor: pointer; transition: all 0.2s; }
    .emoji-btn:hover { border-color: var(--mat-sys-primary); transform: scale(1.05); }
    .emoji-btn.selected { border-color: var(--mat-sys-primary); background: var(--mat-sys-primary-container); }
    .hidden-input { display: none; }
    .section-divider { margin: 24px 0; }
    .danger-text { margin: 0 0 16px; color: var(--mat-sys-on-surface-variant); font-size: 14px; }
    .danger-actions { display: flex; gap: 12px; }
    .delete-btn { color: var(--mat-sys-error); border-color: var(--mat-sys-error); }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; padding-top: 8px; }
  `]
})
export class GroupSettingsComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  
  currencies = CURRENCIES;
  emojis = EMOJIS;
  submitting = signal(false);
  groupId = signal<string>('');
  
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    defaultCurrency: ['USD', Validators.required],
    coverEmoji: ['']
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
    } finally {
      this.submitting.set(false);
    }
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