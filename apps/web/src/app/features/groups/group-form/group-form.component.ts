import { Component, signal, inject, OnInit } from '@angular/core';
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

import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
const EMOJIS = ['🏠', '✈️', '🍕', '🍻', '🎮', '🎓', '💼', '🏖️', '🎂', '🎄', '🏔️', '🏝️', '🚗', '🛒', '💰', '📱'];

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{ isEditing() ? 'Edit Group' : 'Create Group' }}</mat-card-title>
          <mat-card-subtitle>{{ isEditing() ? 'Update group details' : 'Start splitting expenses with friends' }}</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Group Name</mat-label>
              <input matInput formControlName="name" autocomplete="off" maxlength="100" />
              <mat-icon matPrefix>group</mat-icon>
              @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                <mat-error>Group name is required</mat-error>
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
            
            <div class="field">
              <label>Cover Emoji (optional)</label>
              <div class="emoji-picker" role="group" aria-label="Select cover emoji">
                @for (emoji of emojis; track emoji) {
                  <button
                    type="button"
                    class="emoji-btn"
                    [class.selected]="form.get('coverEmoji')?.value === emoji"
                    (click)="form.get('coverEmoji')?.setValue(form.get('coverEmoji')?.value === emoji ? '' : emoji)"
                    [attr.aria-pressed]="form.get('coverEmoji')?.value === emoji"
                  >
                    {{ emoji }}
                  </button>
                }
                <input type="text" formControlName="coverEmoji" class="hidden-input" aria-hidden="true" />
              </div>
            </div>
            
            <div class="form-actions">
              <button mat-button type="button" routerLink="/groups">Cancel</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                @if (submitting()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  {{ isEditing() ? 'Save Changes' : 'Create Group' }}
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: 100vh;
      padding: 48px 24px;
    }
    
    .form-card {
      width: 100%;
      max-width: 500px;
    }
    
    .form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 8px;
    }
    
    .full-width { width: 100%; }
    
    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .field label {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
    }
    
    .emoji-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .emoji-btn {
      width: 48px;
      height: 48px;
      border: 2px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      background: var(--mat-sys-surface-container-low);
      font-size: 24px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .emoji-btn:hover {
      border-color: var(--mat-sys-primary);
      transform: scale(1.05);
    }
    
    .emoji-btn.selected {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
    }
    
    .hidden-input { display: none; }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
      padding-top: 8px;
    }
  `]
})
export class GroupFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  
  readonly currencies = CURRENCIES;
  readonly emojis = EMOJIS;
  readonly submitting = signal(false);
  readonly isEditing = signal(false);
  readonly groupId = signal<string | null>(null);
  
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    defaultCurrency: ['USD', [Validators.required]],
    coverEmoji: ['']
  });
  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.groupId.set(id);
      this.loadGroup(id);
    }
  }
  
  async loadGroup(id: string): Promise<void> {
    try {
      const group = await this.http.get<any>(`${environment.apiUrl}/groups/${id}`).toPromise();
      if (group) {
        this.form.patchValue({
          name: group.name,
          defaultCurrency: group.defaultCurrency,
          coverEmoji: group.coverEmoji || ''
        });
      }
    } catch (err) {
      this.snackBar.open('Failed to load group', 'Dismiss', { duration: 5000 });
      this.router.navigate(['/groups']);
    }
  }
  
  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    
    this.submitting.set(true);
    try {
      const data = this.form.getRawValue();
      
      if (this.isEditing() && this.groupId()) {
        await this.http.patch(`${environment.apiUrl}/groups/${this.groupId()}`, data).toPromise();
        this.snackBar.open('Group updated', 'Dismiss', { duration: 3000 });
      } else {
        const response = await this.http.post<any>(`${environment.apiUrl}/groups`, {
          ...data,
          ownerName: 'You'
        }).toPromise();
        this.snackBar.open('Group created', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/groups', response.id]);
      }
    } catch (err) {
      this.snackBar.open('Failed to save group', 'Dismiss', { duration: 5000 });
    } finally {
      this.submitting.set(false);
    }
  }
}