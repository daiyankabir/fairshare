import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatTabsModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <div class="group-detail">
      <header class="group-header">
        <div class="group-info">
          <h1>{{ groupName() }}</h1>
          <span class="currency">{{ groupCurrency() }}</span>
        </div>
        <nav mat-tab-nav-bar class="tab-nav">
          <a mat-tab-link routerLink="dashboard" routerLinkActive>Dashboard</a>
          <a mat-tab-link routerLink="expenses" routerLinkActive>Expenses</a>
          <a mat-tab-link routerLink="balances" routerLinkActive>Balances</a>
          <a mat-tab-link routerLink="settlements" routerLinkActive>Settlements</a>
          <a mat-tab-link routerLink="settings" routerLinkActive>Settings</a>
          <a mat-tab-link routerLink="members" routerLinkActive>Members</a>
        </nav>
      </header>
      <main class="tab-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .group-detail { height: 100%; display: flex; flex-direction: column; }

    .group-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4) 0;
    }

    .group-info { display: flex; align-items: baseline; gap: var(--space-3); }

    .group-info h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 500;
      letter-spacing: -0.02em;
    }

    .currency {
      font-size: 13px;
      color: var(--text-secondary);
      padding: var(--space-1) var(--space-3);
      background: var(--bg-raised);
      border-radius: var(--radius-sm);
      font-variant-numeric: tabular-nums;
    }

    .tab-nav { border-bottom: 1px solid var(--border-hairline); }

    .tab-content { flex: 1; padding: var(--space-4) 0; }

    @media (max-width: 599px) {
      .group-header { padding: var(--space-3) 0; gap: var(--space-3); }
      .group-info h1 { font-size: 18px; }
      .currency { font-size: 12px; padding: var(--space-1) var(--space-2); }
    }
  `]
})
export class GroupDetailComponent {
  groupName = signal('Loading…');
  groupCurrency = signal('USD');
}