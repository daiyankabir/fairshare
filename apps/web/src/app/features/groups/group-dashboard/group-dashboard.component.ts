import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth/auth.store';

@Component({
  selector: 'app-group-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <a mat-flat-button color="primary" routerLink="../expenses/new">
          <mat-icon>add</mat-icon>
          <span>Add expense</span>
        </a>
      </header>

      @if (loading()) {
        <div class="loading-grid" role="list" aria-label="Loading stats">
          @for (i of [1,2,3]; track i) {
            <mat-card class="skeleton-card" role="listitem">
              <mat-card-content>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-value"></div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else {
        <div class="stats-grid" role="list" aria-label="Group statistics">
          <mat-card class="stat-card" role="listitem">
            <mat-card-content>
              <div class="stat-label">Total expenses</div>
              <div class="stat-value">{{ totalExpenses() | currency: currency() }}</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" role="listitem">
            <mat-card-content>
              <div class="stat-label">Your balance</div>
              <div class="stat-value" [class.positive]="balance() >= 0" [class.negative]="balance() < 0">
                {{ balance() | currency: currency() }}
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" role="listitem">
            <mat-card-content>
              <div class="stat-label">Pending settlements</div>
              <div class="stat-value">{{ pendingSettlements() }}</div>
            </mat-card-content>
          </mat-card>
        </div>

        <section class="recent-expenses">
          <div class="section-header">
            <h2>Recent expenses</h2>
            <a mat-button routerLink="../expenses" color="primary">View all</a>
          </div>
          @if (recentExpenses().length === 0) {
            <p class="empty">No expenses yet. <a routerLink="../expenses/new">Add one</a> to get started.</p>
          } @else {
            <div class="expense-list">
              @for (expense of recentExpenses(); track expense.id) {
                <div class="expense-item">
                  <div class="expense-info">
                    <span class="expense-name">{{ expense.description }}</span>
                    <span class="expense-meta">{{ expense.date | date:'short' }} • {{ expense.payerName }}</span>
                  </div>
                  <span class="expense-amount">{{ expense.amount | currency: expense.currency }}</span>
                </div>
              }
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard { padding: var(--space-2) 0; }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      letter-spacing: -0.02em;
    }

    .dashboard-header a { height: 44px; }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--space-4);
    }

    .skeleton-card { padding: var(--space-5); }
    .skeleton-title { height: 14px; width: 50%; margin-bottom: var(--space-2); border-radius: var(--radius-sm); }
    .skeleton-value { height: 28px; width: 40%; border-radius: var(--radius-sm); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      text-align: center;
      padding: var(--space-5);
    }

    .stat-label {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: var(--space-2);
      font-weight: 400;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 500;
      letter-spacing: -0.02em;
      word-break: break-word;
      line-height: 1.2;
    }

    .stat-value.positive { color: var(--success); }
    .stat-value.negative { color: var(--error); }

    .recent-expenses { margin-top: var(--space-4); }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .section-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .expense-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .expense-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--bg-raised);
      border-radius: var(--radius-md);
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .expense-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    .expense-name {
      font-weight: 500;
      font-size: 14px;
      word-break: break-word;
    }

    .expense-meta {
      font-size: 12px;
      color: var(--text-muted);
    }

    .expense-amount {
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      font-size: 14px;
    }

    .empty {
      color: var(--text-secondary);
      text-align: center;
      padding: var(--space-8) var(--space-4);
      margin: 0;
      font-size: 14px;
      line-height: 1.5;

      a { color: var(--accent); font-weight: 500; }
    }

    @media (max-width: 599px) {
      .dashboard-header { flex-direction: column; align-items: stretch; }
      .dashboard-header a { width: 100%; justify-content: center; }
      .stats-grid { grid-template-columns: 1fr; }
      .expense-item { flex-direction: column; align-items: flex-start; }
      .expense-amount { align-self: flex-end; }
    }
  `]
})
export class GroupDashboardComponent implements OnInit {
  private readonly authStore = inject(AuthStore);

  loading = signal(true);
  totalExpenses = signal(0);
  balance = signal(0);
  pendingSettlements = signal(0);
  recentExpenses = signal<Array<any>>([]);
  currency = signal('USD');

  ngOnInit(): void {
    if (this.authStore.demoMode()) {
      setTimeout(() => {
        this.totalExpenses.set(1247.50);
        this.balance.set(125.30);
        this.pendingSettlements.set(2);
        this.recentExpenses.set([
          { id: '1', description: 'Dinner at Mario\'s', amount: 84.50, currency: 'USD', date: new Date(Date.now() - 86400000), payerName: 'Alex' },
          { id: '2', description: 'Uber to airport', amount: 32.00, currency: 'USD', date: new Date(Date.now() - 172800000), payerName: 'Sam' },
          { id: '3', description: 'Groceries', amount: 127.30, currency: 'USD', date: new Date(Date.now() - 259200000), payerName: 'You' }
        ]);
        this.loading.set(false);
      }, 300);
    }
  }
}