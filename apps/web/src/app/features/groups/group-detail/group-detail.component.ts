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
    .group-header { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; }
    .group-info { display: flex; align-items: baseline; gap: 12px; }
    .group-info h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .currency { font-size: 14px; color: var(--mat-sys-on-surface-variant); padding: 4px 12px; background: var(--mat-sys-surface-container-high); border-radius: 16px; }
    .tab-nav { border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .tab-content { flex: 1; padding: 16px 0; }
  `]
})
export class GroupDetailComponent {
  groupName = signal('Loading...');
  groupCurrency = signal('USD');
}