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
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading balances…</p>
            </div>
          } @else {
            <div class="balances-grid" role="list" aria-label="Member balances">
              @for (balance of balances(); track balance.memberId) {
                <mat-card class="balance-card" [class.positive]="balance.amount >= 0" [class.negative]="balance.amount < 0" role="listitem">
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

        <mat-tab label="Simplified transfers">
          @if (loading()) {
            <div class="loading-state">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (transfers().length === 0) {
            <div class="empty-state">
              <mat-icon>check_circle</mat-icon>
              <h3>All settled up</h3>
              <p>No transfers needed at the moment.</p>
            </div>
          } @else {
            <div class="table-wrapper">
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
            </div>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .balance-view { padding: var(--space-2) 0; }
    .page-header { margin-bottom: var(--space-6); }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 500; letter-spacing: -0.02em; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-6); gap: var(--space-4); }
    .loading-state p { margin: 0; color: var(--text-secondary); }

    .balances-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-4); }
    .balance-card { text-align: center; padding: var(--space-5); }
    .balance-name { font-weight: 500; margin-bottom: var(--space-2); word-break: break-word; font-size: 14px; }
    .balance-amount { font-size: 28px; font-weight: 500; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; word-break: break-word; line-height: 1.2; }
    .balance-card.positive .balance-amount { color: var(--success); }
    .balance-card.negative .balance-amount { color: var(--error); }
    .balance-label { font-size: 12px; color: var(--text-muted); margin-top: var(--space-1); }

    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: var(--space-16) var(--space-6); gap: var(--space-4); }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--success); }
    .empty-state h3 { margin: 0; font-size: 18px; font-weight: 500; }
    .empty-state p { margin: 0; color: var(--text-secondary); font-size: 14px; line-height: 1.5; }

    .transfers-table { width: 100%; min-width: 640px; }
    .transfers-table th { font-weight: 500; color: var(--text-secondary); font-size: 12px; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-hairline); }
    .transfers-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-hairline); }
    .transfers-table tr:last-child td { border-bottom: none; }
    .transfers-table tr:hover td { background: var(--bg-raised); }

    .table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: calc(var(--space-4) * -1) calc(var(--space-6) * -1); padding: var(--space-4) var(--space-6); }

    @media (max-width: 599px) {
      .balances-grid { grid-template-columns: 1fr; }
      .balance-card { padding: var(--space-4); }
      .balance-amount { font-size: 24px; }
      .page-header h1 { font-size: 24px; }
    }
  `]
})
export class BalanceViewComponent {
  loading = signal(true);
  balances = signal<Balance[]>([]);
  transfers = signal<Transfer[]>([]);
  transferColumns = ['from', 'to', 'amount'];
}