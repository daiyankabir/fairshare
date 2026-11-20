import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Balance {
  memberId: string;
  displayName: string;
  amount: number;
  currency: string;
}

interface Transfer {
  from: string;
  to: string;
  amount: number;
  currency: string;
  fromName: string;
  toName: string;
}

@Component({
  selector: 'app-balance-view',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, MatTabsModule],
  template: `
    <div class="balance-view">
      <header class="page-header">
        <h1>Balances</h1>
      </header>

      <mat-tab-group>
        <mat-tab label="Balances">
          @if (loading()) {
            <div class="loading-state">
              <mat-spinner diameter="48"></mat-spinner>
              <p>Loading balances...</p>
            </div>
          } @else {
            <div class="balances-grid">
              @for (balance of balances(); track balance.memberId) {
                <mat-card class="balance-card" [class.positive]="balance.amount >= 0" [class.negative]="balance.amount < 0">
                  <mat-card-content>
                    <div class="balance-name">{{ balance.displayName }}</div>
                    <div class="balance-amount">{{ balance.amount | currency: balance.currency }}</div>
                    <div class="balance-label">{{ balance.amount >= 0 ? 'is owed' : 'owes' }}</div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          }
        </mat-tab>

        <mat-tab label="Simplified Transfers">
          @if (loading()) {
            <div class="loading-state">
              <mat-spinner diameter="48"></mat-spinner>
            </div>
          } @else if (transfers().length === 0) {
            <div class="empty-state">
              <mat-icon>check_circle</mat-icon>
              <h3>All settled up!</h3>
              <p>No transfers needed at the moment.</p>
            </div>
          } @else {
            <table mat-table [dataSource]="transfers()" class="transfers-table">
              <ng-container matColumnDef="from">
                <th mat-header-cell *matHeaderCellDef>From</th>
                <td mat-cell *matCellDef="let t">{{ t.fromName }}</td>
              </ng-container>
              <ng-container matColumnDef="to">
                <th mat-header-cell *matHeaderCellDef>To</th>
                <td mat-cell *matCellDef="let t">{{ t.toName }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let t">{{ t.amount | currency: t.currency }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="transferColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: transferColumns"></tr>
            </table>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .balance-view { padding: 8px 0; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 24px; gap: 16px; }
    .balances-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .balance-card { text-align: center; padding: 24px; }
    .balance-name { font-weight: 600; margin-bottom: 8px; }
    .balance-amount { font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .balance-card.positive .balance-amount { color: var(--mat-sys-tertiary); }
    .balance-card.negative .balance-amount { color: var(--mat-sys-error); }
    .balance-label { font-size: 12px; color: var(--mat-sys-on-surface-variant); margin-top: 4px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; gap: 16px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: var(--mat-sys-tertiary); }
    .empty-state h3 { margin: 0; }
    .empty-state p { margin: 0; color: var(--mat-sys-on-surface-variant); }
    .transfers-table { width: 100%; }
    .transfers-table th { font-weight: 600; color: var(--mat-sys-on-surface-variant); }
  `]
})
export class BalanceViewComponent {
  loading = signal(true);
  balances = signal<Balance[]>([]);
  transfers = signal<Transfer[]>([]);
  transferColumns = ['from', 'to', 'amount'];
}