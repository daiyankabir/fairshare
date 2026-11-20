import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

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
          Add Expense
        </a>
      </header>

      @if (loading()) {
        <div class="loading-grid">
          @for (i of [1,2,3]; track i) {
            <mat-card class="skeleton-card">
              <mat-card-content>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-value"></div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else {
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-label">Total Expenses</div>
              <div class="stat-value">{{ totalExpenses() | currency: currency() }}</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-label">Your Balance</div>
              <div class="stat-value" [class.positive]="balance() >= 0" [class.negative]="balance() < 0">
                {{ balance() | currency: currency() }}
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-label">Pending Settlements</div>
              <div class="stat-value">{{ pendingSettlements() }}</div>
            </mat-card-content>
          </mat-card>
        </div>

        <section class="recent-expenses">
          <h2>Recent Expenses</h2>
          @if (recentExpenses().length === 0) {
            <p class="empty">No expenses yet</p>
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
          <a mat-button routerLink="../expenses" color="primary">View All Expenses</a>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard { padding: 8px 0; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .dashboard-header h1 { margin: 0; }
    .loading-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .skeleton-card { padding: 24px; }
    .skeleton { background: linear-gradient(90deg, var(--mat-sys-surface-container) 25%, var(--mat-sys-surface-container-high) 50%, var(--mat-sys-surface-container) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
    .skeleton-title { height: 16px; width: 60%; margin-bottom: 8px; }
    .skeleton-value { height: 32px; width: 40%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { text-align: center; }
    .stat-label { font-size: 14px; color: var(--mat-sys-on-surface-variant); margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: 600; }
    .stat-value.positive { color: var(--mat-sys-tertiary); }
    .stat-value.negative { color: var(--mat-sys-error); }
    .recent-expenses h2 { margin: 0 0 16px; font-size: 18px; }
    .expense-list { display: flex; flex-direction: column; gap: 12px; }
    .expense-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--mat-sys-surface-container-low); border-radius: 8px; }
    .expense-info { display: flex; flex-direction: column; gap: 4px; }
    .expense-name { font-weight: 500; }
    .expense-meta { font-size: 12px; color: var(--mat-sys-on-surface-variant); }
    .expense-amount { font-weight: 600; font-variant-numeric: tabular-nums; }
    .empty { color: var(--mat-sys-on-surface-variant); text-align: center; padding: 32px; }
  `]
})
export class GroupDashboardComponent {
  loading = signal(true);
  totalExpenses = signal(0);
  balance = signal(0);
  pendingSettlements = signal(0);
  recentExpenses = signal<Array<any>>([]);
  currency = signal('USD');
}