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
        <div class="header-content">
          <h1>Settlements</h1>
          <p class="page-subtitle">{{ settlements().length }} settlement{{ settlements().length !== 1 ? 's' : '' }}</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          <span>Record settlement</span>
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
              <span>Record settlement</span>
            </button>
          </div>
        } @else {
          <div class="table-wrapper">
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
          </div>
        }
      }
    </div>

    <ng-template #createDialog>
      <div class="dialog-content">
        <h2 mat-dialog-title>Record settlement</h2>
        <mat-dialog-content>
          <form [formGroup]="form" class="dialog-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>From</mat-label>
              <mat-select formControlName="fromMemberId">
                @for (m of members(); track m.id) { <mat-option [value]="m.id">{{ m.displayName }}</mat-option> }
              </mat-select>
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>To</mat-label>
              <mat-select formControlName="toMemberId">
                @for (m of members(); track m.id) { <mat-option [value]="m.id">{{ m.displayName }}</mat-option> }
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
    .settlement-list-container { padding: var(--space-2) 0; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .header-content { display: flex; flex-direction: column; gap: var(--space-1); }
    .header-content h1 { margin: 0; font-size: 28px; font-weight: 500; letter-spacing: -0.02em; }
    .page-subtitle { margin: 0; color: var(--text-secondary); font-size: 14px; font-weight: 400; }

    .loading-table { display: flex; flex-direction: column; gap: var(--space-2); }
    .skeleton-row { display: flex; gap: var(--space-4); padding: var(--space-4); background: var(--bg-raised); border-radius: var(--radius-md); }
    .skeleton { height: 18px; border-radius: var(--radius-sm); }
    .skeleton-col { flex: 2; }
    .skeleton-col-short { flex: 1; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: var(--space-16) var(--space-6); gap: var(--space-4);
    }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; opacity: 0.3; color: var(--text-muted); }
    .empty-state h2 { margin: 0; font-size: 20px; font-weight: 500; }
    .empty-state p { margin: 0; color: var(--text-secondary); font-size: 14px; line-height: 1.5; }
    .empty-state button { margin-top: var(--space-2); height: 44px; }

    .settlement-table { width: 100%; min-width: 720px; }
    .settlement-table th { font-weight: 500; color: var(--text-secondary); font-size: 12px; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-hairline); }
    .settlement-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-hairline); }
    .settlement-table tr:last-child td { border-bottom: none; }
    .settlement-table tr:hover td { background: var(--bg-raised); }

    .table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: calc(var(--space-4) * -1) calc(var(--space-6) * -1); padding: var(--space-4) var(--space-6); }

    .dialog-content { min-width: 420px; }
    .dialog-form { display: flex; flex-direction: column; gap: var(--space-4); min-width: 360px; margin-top: var(--space-2); }
    .full-width { width: 100%; }
    .row { display: flex; gap: var(--space-4); }
    .half-width { flex: 1; }

    @media (max-width: 599px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .header-content h1 { font-size: 24px; }
      .page-header button { width: 100%; }
      .row { flex-direction: column; gap: var(--space-3); }
      .half-width { width: 100%; }
    }
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

  ngOnInit(): void { this.loadData(); }

  async loadData(): Promise<void> { this.loading.set(false); }

  openCreateDialog(): void { this.dialog.open(this.createDialog); }

  async createSettlement(): Promise<void> {
    if (this.form.invalid) return;
    this.creating.set(true);
    this.creating.set(false);
  }

  async deleteSettlement(id: string): Promise<void> { }
}