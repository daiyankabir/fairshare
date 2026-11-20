import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  payers: Array<{ memberId: string; amount: number; displayName: string }>;
  splits: Array<{ memberId: string; amount: number; displayName: string }>;
  items: Array<{ description: string; amount: number; assignedTo: string[] }>;
}

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule],
  template: `
    <div class="expense-detail">
      @if (loading()) {
        <mat-card class="skeleton-card">
          <mat-card-content>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-subtitle"></div>
          </mat-card-content>
        </mat-card>
      } @else {
        @let exp = expense();
        @if (exp) {
          <mat-card class="detail-card">
            <mat-card-header>
              <mat-card-title>{{ exp.description }}</mat-card-title>
              <mat-card-subtitle>{{ exp.date | date:'medium' }} · {{ exp.amount | currency: exp.currency }}</mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="detail-section">
                <h3>Details</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Split type</span>
                    <span class="detail-value"><span class="split-badge">{{ exp.splitType }}</span></span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Category</span>
                    <span class="detail-value">{{ exp.category || '—' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Paid by</span>
                    <span class="detail-value">{{ exp.payerName }}</span>
                  </div>
                </div>
              </div>

              <mat-divider />

              <div class="detail-section">
                <h3>Splits</h3>
                <div class="splits-list">
                  @for (split of exp.splits; track split.memberId) {
                    <div class="split-item">
                      <span>{{ split.displayName }}</span>
                      <span class="split-amount">{{ split.amount | currency: exp.currency }}</span>
                    </div>
                  }
                </div>
              </div>

              @if (exp.items && exp.items.length > 0) {
                <mat-divider />

                <div class="detail-section">
                  <h3>Items</h3>
                  <div class="items-list">
                    @for (item of exp.items; track item.description) {
                      <div class="item-row">
                        <span>{{ item.description }}</span>
                        <span>{{ item.amount | currency: exp.currency }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </mat-card-content>

            <mat-card-actions>
              <button mat-button routerLink="../">Back to list</button>
            </mat-card-actions>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .expense-detail { padding: var(--space-2) 0; max-width: 720px; }

    .skeleton-card { padding: var(--space-6); }
    .skeleton { border-radius: var(--radius-sm); }
    .skeleton-title { height: 22px; width: 40%; margin-bottom: var(--space-2); }
    .skeleton-subtitle { height: 14px; width: 60%; }

    .detail-card { box-shadow: none; border: 1px solid var(--border-hairline); }

    .detail-section { padding: var(--space-4) 0; }
    .detail-section h3 { margin: 0 0 var(--space-4); font-size: 15px; font-weight: 500; }

    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); }
    .detail-item { display: flex; flex-direction: column; gap: var(--space-1); }
    .detail-label { font-size: 12px; color: var(--text-muted); font-weight: 500; letter-spacing: 0.02em; text-transform: none; }
    .detail-value { font-size: 14px; color: var(--text-primary); }

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

    .splits-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .split-item { display: flex; justify-content: space-between; padding: var(--space-3) var(--space-4); background: var(--bg-raised); border-radius: var(--radius-md); }
    .split-amount { font-weight: 500; font-variant-numeric: tabular-nums; font-size: 14px; }

    .items-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .item-row { display: flex; justify-content: space-between; padding: var(--space-3) var(--space-4); background: var(--bg-raised); border-radius: var(--radius-md); }

    mat-card-actions { padding: var(--space-3) var(--space-4); border-top: 1px solid var(--border-hairline); }
  `]
})
export class ExpenseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  loading = signal(true);
  expense = signal<Expense | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('expenseId');
    if (id) { this.loadExpense(id); }
  }

  async loadExpense(id: string): Promise<void> {
    try {
      // Placeholder
      this.loading.set(false);
    } catch (err) { this.loading.set(false); }
  }
}