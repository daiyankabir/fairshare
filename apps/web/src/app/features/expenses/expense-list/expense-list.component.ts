import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category: string | null;
  splitType: string;
  payerName: string;
}

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, RouterLink, MatChipsModule],
  template: `
    <div class="expense-list-container">
      <header class="page-header">
        <h1>Expenses</h1>
        <a mat-flat-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          Add Expense
        </a>
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
        @if (expenses().length === 0) {
          <div class="empty-state">
            <mat-icon>receipt_long</mat-icon>
            <h2>No expenses yet</h2>
            <p>Add your first expense to start tracking</p>
            <a mat-flat-button color="primary" routerLink="new">
              <mat-icon>add</mat-icon>
              Add Expense
            </a>
          </div>
        } @else {
          <table mat-table [dataSource]="expenses()" class="expense-table">
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let expense">{{ expense.description }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let expense">{{ expense.date | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let expense">{{ expense.amount | currency: expense.currency }}</td>
            </ng-container>
            <ng-container matColumnDef="splitType">
              <th mat-header-cell *matHeaderCellDef>Split Type</th>
              <td mat-cell *matCellDef="let expense">
                <mat-chip>{{ expense.splitType }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let expense">
                <a mat-icon-button [routerLink]="['', expense.id]" matTooltip="View">
                  <mat-icon>visibility</mat-icon>
                </a>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        }
      }
    </div>
  `,
  styles: [`
    .expense-list-container { padding: 8px 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .loading-table { display: flex; flex-direction: column; gap: 8px; }
    .skeleton-row { display: flex; gap: 16px; padding: 16px; background: var(--mat-sys-surface-container_low); border-radius: 8px; }
    .skeleton { background: linear-gradient(90deg, var(--mat-sys-surface-container) 25%, var(--mat-sys-surface-container-high) 50%, var(--mat-sys-surface-container) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; height: 20px; }
    .skeleton-col { flex: 2; }
    .skeleton-col-short { flex: 1; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; gap: 16px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; opacity: 0.3; }
    .empty-state h2 { margin: 0; }
    .empty-state p { margin: 0; color: var(--mat-sys-on-surface-variant); }
    .expense-table { width: 100%; }
    .expense-table th { font-weight: 600; color: var(--mat-sys-on-surface-variant); }
    .expense-table td { white-space: nowrap; }
  `]
})
export class ExpenseListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  
  loading = signal(true);
  expenses = signal<Expense[]>([]);
  displayedColumns = ['description', 'date', 'amount', 'splitType', 'actions'];

  ngOnInit(): void {
    this.loadExpenses();
  }

  async loadExpenses(): Promise<void> {
    try {
      // Placeholder - would call API
      this.loading.set(false);
    } catch (err) {
      this.loading.set(false);
    }
  }
}