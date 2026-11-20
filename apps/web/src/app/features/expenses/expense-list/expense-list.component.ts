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
import { AuthStore } from '../../../core/store/auth/auth.store';

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
        <div class="header-content">
          <h1>Expenses</h1>
          <p class="page-subtitle">{{ expenses().length }} expense{{ expenses().length !== 1 ? 's' : '' }}</p>
        </div>
        <a mat-flat-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          <span>Add expense</span>
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
              <span>Add expense</span>
            </a>
          </div>
        } @else {
          <div class="table-wrapper">
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
                <th mat-header-cell *matHeaderCellDef>Split type</th>
                <td mat-cell *matCellDef="let expense">
                  <span class="split-badge">{{ expense.splitType }}</span>
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
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .expense-list-container { padding: var(--space-2) 0; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 400;
    }

    .page-header a { height: 44px; }

    .loading-table { display: flex; flex-direction: column; gap: var(--space-2); }
    .skeleton-row { display: flex; gap: var(--space-4); padding: var(--space-4); background: var(--bg-raised); border-radius: var(--radius-md); }
    .skeleton { height: 18px; border-radius: var(--radius-sm); }
    .skeleton-col { flex: 2; }
    .skeleton-col-short { flex: 1; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: var(--space-16) var(--space-6);
      gap: var(--space-4);
    }

    .empty-state mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      opacity: 0.3;
      color: var(--text-muted);
    }

    .empty-state h2 { margin: 0; font-size: 20px; font-weight: 500; }
    .empty-state p { margin: 0; color: var(--text-secondary); font-size: 14px; line-height: 1.5; }
    .empty-state a { margin-top: var(--space-2); height: 44px; }

    .expense-table { width: 100%; min-width: 720px; }

    .expense-table th {
      font-weight: 500;
      color: var(--text-secondary);
      font-size: 12px;
      text-transform: none;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-hairline);
    }

    .expense-table td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-hairline);
      white-space: nowrap;
    }

    .expense-table tr:last-child td { border-bottom: none; }
    .expense-table tr:hover td { background: var(--bg-raised); }

    .split-badge {
      display: inline-block;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--bg-raised);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }

    @media (max-width: 599px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .page-header a { width: 100%; justify-content: center; }
      .page-header h1 { font-size: 24px; }
    }
  `]
})
export class ExpenseListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  loading = signal(true);
  expenses = signal<Expense[]>([]);
  displayedColumns = ['description', 'date', 'amount', 'splitType', 'actions'];

  ngOnInit(): void {
    this.loadExpenses();
  }

  async loadExpenses(): Promise<void> {
    if (this.authStore.demoMode()) {
      setTimeout(() => {
        this.expenses.set([
          { id: '1', description: 'Dinner at Mario\'s', amount: 84.50, currency: 'USD', date: new Date(Date.now() - 86400000).toISOString(), category: 'Food', splitType: 'equal', payerName: 'Alex' },
          { id: '2', description: 'Uber to airport', amount: 32.00, currency: 'USD', date: new Date(Date.now() - 172800000).toISOString(), category: 'Transport', splitType: 'equal', payerName: 'Sam' },
          { id: '3', description: 'Groceries', amount: 127.30, currency: 'USD', date: new Date(Date.now() - 259200000).toISOString(), category: 'Shopping', splitType: 'percentage', payerName: 'You' },
          { id: '4', description: 'Hotel stay', amount: 245.00, currency: 'USD', date: new Date(Date.now() - 345600000).toISOString(), category: 'Accommodation', splitType: 'shares', payerName: 'Jordan' },
          { id: '5', description: 'Coffee & snacks', amount: 18.75, currency: 'USD', date: new Date(Date.now() - 432000000).toISOString(), category: 'Food', splitType: 'exact', payerName: 'You' }
        ]);
        this.loading.set(false);
      }, 300);
      return;
    }

    try {
      // Placeholder - would call API
      this.loading.set(false);
    } catch (err) {
      this.loading.set(false);
    }
  }
}