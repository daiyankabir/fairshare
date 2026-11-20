import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';

import { AuthStore } from '../../../core/store/auth/auth.store';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Group {
  id: string;
  name: string;
  defaultCurrency: string;
  coverEmoji: string | null;
  isArchived: boolean;
  myRole: string;
  isGuest: boolean;
  _count: { expenses: number; memberships: number };
  memberships: Array<{ displayName: string; user: { name: string } | null }>;
}

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule
  ],
  template: `
    <div class="group-list-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Groups</h1>
          <p class="page-subtitle">{{ groups().length }} group{{ groups().length !== 1 ? 's' : '' }}</p>
        </div>
        <button mat-flat-button color="primary" routerLink="/groups/new">
          <mat-icon>add</mat-icon>
          <span>New group</span>
        </button>
      </header>

      @if (loading()) {
        <div class="loading-grid">
          @for (i of [1,2,3,4]; track i) {
            <mat-card class="skeleton-card">
              <div class="card-header skeleton" style="aspect-ratio: 16/9; border-radius: var(--radius-lg) var(--radius-lg) 0 0;"></div>
              <mat-card-content class="skeleton-content">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-subtitle"></div>
                <div class="skeleton skeleton-subtitle"></div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else if (groups().length === 0) {
        <div class="empty-state">
          <mat-icon>groups</mat-icon>
          <h2>No groups yet</h2>
          <p>Create your first group to start splitting expenses with friends</p>
          <button mat-flat-button color="primary" routerLink="/groups/new">
            <mat-icon>add</mat-icon>
            <span>Create group</span>
          </button>
        </div>
      } @else {
        <div class="groups-grid">
          @for (group of groups(); track group.id) {
            <mat-card class="group-card" [class.archived]="group.isArchived">
              <div class="card-header" [style.background-color]="group.coverEmoji ? 'transparent' : 'var(--accent-container)'">
                @if (group.coverEmoji) {
                  <span class="cover-emoji">{{ group.coverEmoji }}</span>
                } @else {
                  <mat-icon class="group-icon">account_balance_wallet</mat-icon>
                }
              </div>

              <mat-card-content>
                <h3 class="group-name">{{ group.name }}</h3>
                <div class="group-meta">
                  <span class="currency-badge">{{ group.defaultCurrency }}</span>
                  <span class="member-count">
                    <mat-icon>person</mat-icon>
                    {{ group._count.memberships }} member{{ group._count.memberships !== 1 ? 's' : '' }}
                  </span>
                </div>
                <div class="group-stats">
                  {{ group._count.expenses }} expense{{ group._count.expenses !== 1 ? 's' : '' }}
                </div>
              </mat-card-content>

              <mat-card-actions>
                <a mat-button [routerLink]="['/groups', group.id]" color="primary">Open</a>
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Group options">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <a mat-menu-item [routerLink]="['/groups', group.id, 'dashboard']">
                    <mat-icon>dashboard</mat-icon>
                    <span>Dashboard</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/groups', group.id, 'expenses']">
                    <mat-icon>receipt_long</mat-icon>
                    <span>Expenses</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/groups', group.id, 'balances']">
                    <mat-icon>balance</mat-icon>
                    <span>Balances</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/groups', group.id, 'settlements']">
                    <mat-icon>payments</mat-icon>
                    <span>Settlements</span>
                  </a>
                  <mat-divider />
                  @if (group.myRole === 'OWNER') {
                    <button mat-menu-item (click)="openSettings(group.id)">
                      <mat-icon>settings</mat-icon>
                      <span>Settings</span>
                    </button>
                    <button mat-menu-item (click)="openMembers(group.id)">
                      <mat-icon>group</mat-icon>
                      <span>Members</span>
                    </button>
                    <mat-divider />
                    <button mat-menu-item (click)="archiveGroup(group)">
                      <mat-icon>{{ group.isArchived ? 'unarchive' : 'archive' }}</mat-icon>
                      <span>{{ group.isArchived ? 'Unarchive' : 'Archive' }}</span>
                    </button>
                    <button mat-menu-item (click)="deleteGroup(group)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  }
                </mat-menu>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .group-list-container {
      padding: var(--space-2) 0;
    }

    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .header-content h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .page-subtitle {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 400;
    }

    .page-header button { height: 44px; }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--space-4);
    }

    .skeleton-card {
      padding: 0;
      overflow: hidden;
    }

    .skeleton-content { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .skeleton-title { height: 20px; width: 60%; border-radius: var(--radius-sm); }
    .skeleton-subtitle { height: 14px; width: 40%; border-radius: var(--radius-sm); }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-16) var(--space-6);
      text-align: center;
      gap: var(--space-4);
    }

    .empty-state mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      opacity: 0.3;
      color: var(--text-muted);
    }

    .empty-state h2 { margin: 0; color: var(--text-primary); font-size: 20px; font-weight: 500; }
    .empty-state p { margin: 0; color: var(--text-secondary); max-width: 300px; font-size: 14px; line-height: 1.5; }
    .empty-state button { margin-top: var(--space-2); height: 44px; }

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--space-4);
    }

    .group-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1), border-color 160ms;
      border: 1px solid var(--border-hairline);
    }

    .group-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border-color: var(--accent);
    }

    .group-card.archived {
      opacity: 0.5;
    }

    .card-header {
      aspect-ratio: 16/9;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      margin: -1px -1px 0 -1px;
      font-size: 40px;
      line-height: 1;
    }

    .cover-emoji { font-size: 40px; line-height: 1; }

    .group-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--accent-on-container);
    }

    .group-name {
      margin: 0 0 var(--space-2);
      font-size: 16px;
      font-weight: 500;
      line-height: 1.3;
      word-break: break-word;
    }

    .group-meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: var(--space-1);
      flex-wrap: wrap;
    }

    .currency-badge {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--bg-raised);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .member-count {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .member-count mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--text-muted);
    }

    .group-stats {
      font-size: 12px;
      color: var(--text-muted);
    }

    .delete-action { color: var(--error); }

    @media (max-width: 599px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .page-header button { width: 100%; }
      .groups-grid { grid-template-columns: 1fr; }
      .loading-grid { grid-template-columns: 1fr; }
      .header-content h1 { font-size: 24px; }
    }
  `]
})
export class GroupListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly groups = signal<Group[]>([]);

  ngOnInit(): void {
    this.loadGroups();
  }

  async loadGroups(): Promise<void> {
    if (this.authStore.demoMode()) {
      // Demo mode - show sample groups
      setTimeout(() => {
        this.groups.set([
          {
            id: 'demo-group-1',
            name: 'Weekend Trip',
            defaultCurrency: 'USD',
            coverEmoji: null,
            isArchived: false,
            myRole: 'OWNER',
            isGuest: false,
            _count: { expenses: 12, memberships: 4 },
            memberships: [
              { displayName: 'You', user: { name: 'You' } },
              { displayName: 'Alex', user: { name: 'Alex' } },
              { displayName: 'Sam', user: { name: 'Sam' } },
              { displayName: 'Jordan', user: { name: 'Jordan' } }
            ]
          },
          {
            id: 'demo-group-2',
            name: 'Apartment Expenses',
            defaultCurrency: 'USD',
            coverEmoji: null,
            isArchived: false,
            myRole: 'MEMBER',
            isGuest: false,
            _count: { expenses: 28, memberships: 3 },
            memberships: [
              { displayName: 'You', user: { name: 'You' } },
              { displayName: 'Morgan', user: { name: 'Morgan' } },
              { displayName: 'Casey', user: { name: 'Casey' } }
            ]
          }
        ]);
        this.loading.set(false);
      }, 500);
      return;
    }

    try {
      const response = await this.http.get<{ groups: Group[] }>(`${environment.apiUrl}/groups`).toPromise();
      this.groups.set(response?.groups ?? []);
    } catch (err) {
      console.error('Failed to load groups', err);
      this.groups.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  openSettings(groupId: string): void {
    this.router.navigate(['/groups', groupId, 'settings']);
  }

  openMembers(groupId: string): void {
    this.router.navigate(['/groups', groupId, 'members']);
  }

  async archiveGroup(group: Group): Promise<void> {
    try {
      await this.http.patch(`${environment.apiUrl}/groups/${group.id}`, { isArchived: !group.isArchived }).toPromise();
      this.loadGroups();
    } catch (err) {
      console.error('Failed to archive group', err);
    }
  }

  async deleteGroup(group: Group): Promise<void> {
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;

    try {
      await this.http.delete(`${environment.apiUrl}/groups/${group.id}`).toPromise();
      this.loadGroups();
    } catch (err) {
      console.error('Failed to delete group', err);
    }
  }
}