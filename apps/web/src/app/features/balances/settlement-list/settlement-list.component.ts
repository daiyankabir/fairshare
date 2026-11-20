import { Component, signal, inject, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];

interface Settlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  fromName: string;
  toName: string;
  amount: number;
  currency: string;
  date: string;
  note: string | null;
}

@Component({
  selector: 'app-settlement-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatNativeDateModule, MatDatepickerModule],
  template: `
    <div class="settlement-list-container">
      <header class="page-header">
        <h1>Settlements</h1>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Record Settlement
        </button>
      </header>

      @if (loading()) {
        <div class="loading-table">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              <div class="skeleton skeleton-col"></div>
              <div class="skeleton skeleton-col"></div>
              <div class="skeleton skeleton-col-short"></div>
              <div class="skeleton skeleton-col-short"></div>
            </div>
          }
        </div>
      } @else {
        @if (settlements().length === 0) {
          <div class="empty-state">
            <mat-icon>payments</mat-icon>
            <h2>No settlements yet</h2>
            <p>Record when someone pays another member back</p>
            <button mat-flat-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon>
              Record Settlement
            </button>
          </div>
        } @else {
          <table mat-table [dataSource]="settlements()" class="settlement-table">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let s">{{ s.date | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="fromTo">
              <th mat-header-cell *matHeaderCellDef>From → To</th>
              <td mat-cell *matCellDef="let s">{{ s.fromName }} → {{ s.toName }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let s">{{ s.amount | currency: s.currency }}</td>
            </ng-container>
            <ng-container matColumnDef="note">
              <th mat-header-cell *matHeaderCellDef>Note</th>
              <td mat-cell *matCellDef="let s">{{ s.note || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let s">
                <button mat-icon-button (click)="deleteSettlement(s.id)" matTooltip="Delete" color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        }
      }
    </div>

    <ng-template #createDialog>
      <div class="dialog-content">
        <h2 mat-dialog-title>Record Settlement</h2>
        <mat-dialog-content>
          <form [formGroup]="form" class="dialog-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>From</mat-label>
              <mat-select formControlName="fromMemberId">
                @for (m of members(); track m.id) {
                  <mat-option [value]="m.id">{{ m.displayName }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>To</mat-label>
              <mat-select formControlName="toMemberId">
                @for (m of members(); track m.id) {
                  <mat-option [value]="m.id">{{ m.displayName }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>
            
            <div class="row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Amount</mat-label>
                <input matInput type="number" formControlName="amount" step="0.01" min="0.01" />
                @if (form.get('amount')?.hasError('required')) { <mat-error>Required</mat-error> }
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Currency</mat-label>
                <mat-select formControlName="currency">
                  @for (c of currencies; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
                </mat-select>
              </mat-form-field>
            </div>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date" />
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Note (optional)</mat-label>
              <input matInput formControlName="note" />
            </mat-form-field>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close>Cancel</button>
          <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="createSettlement()" mat-dialog-close>
            <mat-spinner *ngIf="creating()" diameter="20"></mat-spinner>
            <span *ngIf="!creating()">Record</span>
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .settlement-list-container { padding: 8px 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .loading-table { display: flex; flex-direction: column; gap: 8px; }
    .skeleton-row { display: flex; gap: 16px; padding: 16px; background: var(--mat-sys-surface-container-low); border-radius: 8px; }
    .skeleton { background: linear-gradient(90deg, var(--mat-sys-surface-container) 25%, var(--mat-sys-surface-container-high) 50%, var(--mat-sys-surface-container) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; height: 20px; }
    .skeleton-col { flex: 2; }
    .skeleton-col-short { flex: 1; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; gap: 16px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; opacity: 0.3; }
    .empty-state h2 { margin: 0; }
    .empty-state p { margin: 0; color: var(--mat-sys-on-surface-variant); }
    .settlement-table { width: 100%; }
    .settlement-table th { font-weight: 600; color: var(--mat-sys-on-surface-variant); }
    .dialog-content { min-width: 400px; }
    .dialog-form { display: flex; flex-direction: column; gap: 16px; min-width: 350px; margin-top: 8px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .half-width { flex: 1; }
  `]
})
export class SettlementListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  
  @ViewChild('createDialog') createDialog!: TemplateRef<any>;
  
  loading = signal(true);
  creating = signal(false);
  settlements = signal<Settlement[]>([]);
  members = signal<Array<{ id: string; displayName: string }>>([]);
  displayedColumns = ['date', 'fromTo', 'amount', 'note', 'actions'];
  currencies = CURRENCIES;
  
  form = this.fb.nonNullable.group({
    fromMemberId: ['', Validators.required],
    toMemberId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['USD', Validators.required],
    date: [new Date(), Validators.required],
    note: ['']
  });
  
  ngOnInit(): void {
    this.loadData();
  }
  
  async loadData(): Promise<void> {
    this.loading.set(false);
  }
  
  openCreateDialog(): void {
    this.dialog.open(this.createDialog);
  }
  
  async createSettlement(): Promise<void> {
    if (this.form.invalid) return;
    this.creating.set(true);
    // placeholder
    this.creating.set(false);
  }
  
  async deleteSettlement(id: string): Promise<void> {
    // placeholder
  }
}