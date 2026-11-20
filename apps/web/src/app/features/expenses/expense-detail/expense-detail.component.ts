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
                <mat-card-subtitle>{{ exp.date | date:'medium' }} • {{ exp.amount | currency: exp.currency }}</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="detail-section">
                  <h3>Details</h3>
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">Split Type</span>
                      <span class="detail-value"><mat-chip>{{ exp.splitType }}</mat-chip></span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Category</span>
                      <span class="detail-value">{{ exp.category || '—' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Paid By</span>
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
                <button mat-button routerLink="../">Back to List</button>
              </mat-card-actions>
            </mat-card>
          }
        }
    </div>
  `,
  styles: [`
    .expense-detail { padding: 8px 0; max-width: 700px; }
    .skeleton-card { padding: 24px; }
    .skeleton { background: linear-gradient(90deg, var(--mat-sys-surface-container) 25%, var(--mat-sys-surface-container-high) 50%, var(--mat-sys-surface-container) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
    .skeleton-title { height: 24px; width: 40%; margin-bottom: 8px; }
    .skeleton-subtitle { height: 16px; width: 60%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .detail-card { }
    .detail-section { padding: 16px 0; }
    .detail-section h3 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-label { font-size: 12px; color: var(--mat-sys-on-surface-variant); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 14px; }
    .splits-list { display: flex; flex-direction: column; gap: 8px; }
    .split-item { display: flex; justify-content: space-between; padding: 12px; background: var(--mat-sys-surface-container-low); border-radius: 8px; }
    .split-amount { font-weight: 500; font-variant-numeric: tabular-nums; }
    .items-list { display: flex; flex-direction: column; gap: 8px; }
    .item-row { display: flex; justify-content: space-between; padding: 12px; background: var(--mat-sys-surface-container-low); border-radius: 8px; }
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
    if (id) {
      this.loadExpense(id);
    }
  }
  
  async loadExpense(id: string): Promise<void> {
    try {
      // Placeholder
      this.loading.set(false);
    } catch (err) {
      this.loading.set(false);
    }
  }
}