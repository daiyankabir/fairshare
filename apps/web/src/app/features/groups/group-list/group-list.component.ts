import { Component, signal, computed, inject, OnInit } from '@angular/core';
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
        <h1>Groups</h1>
        <button mat-flat-button color="primary" routerLink="/groups/new">
          <mat-icon>add</mat-icon>
          New Group
        </button>
      </header>
      
      @if (loading()) {
        <div class="loading-grid">
          @for (i of [1,2,3,4]; track i) {
            <mat-card class="skeleton-card">
              <mat-card-content>
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
          <p>Create your first group to start splitting expenses</p>
          <button mat-flat-button color="primary" routerLink="/groups/new">
            <mat-icon>add</mat-icon>
            Create Group
          </button>
        </div>
      } @else {
        <div class="groups-grid">
          @for (group of groups(); track group.id) {
            <mat-card class="group-card" [class.archived]="group.isArchived">
              <div class="card-header" [style.background-color]="group.coverEmoji ? 'transparent' : 'var(--mat-sys-primary-container)'">
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
                    {{ group._count.memberships }} members
                  </span>
                </div>
                <div class="group-stats">
                  <span>{{ group._count.expenses }} expenses</span>
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
                    Dashboard
                  </a>
                  <a mat-menu-item [routerLink]="['/groups', group.id, 'expenses']">
                    <mat-icon>receipt_long</mat-icon>
                    Expenses
                  </a>
                  <a mat-menu-item [routerLink]="['/groups', group.id, 'balances']">
                    <mat-icon>balance</mat-icon>
                    Balances
                  </a>
                  <a mat-menu-item [routerLink]="['/groups', group.id, 'settlements']">
                    <mat-icon>payments</mat-icon>
                    Settlements
                  </a>
                  <mat-divider />
                  @if (group.myRole === 'OWNER') {
                    <button mat-menu-item (click)="openSettings(group.id)">
                      <mat-icon>settings</mat-icon>
                      Settings
                    </button>
                    <button mat-menu-item (click)="openMembers(group.id)">
                      <mat-icon>group</mat-icon>
                      Members
                    </button>
                    <mat-divider />
                    <button mat-menu-item (click)="archiveGroup(group)">
                      <mat-icon>{{ group.isArchived ? 'unarchive' : 'archive' }}</mat-icon>
                      {{ group.isArchived ? 'Unarchive' : 'Archive' }}
                    </button>
                    <button mat-menu-item (click)="deleteGroup(group)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      Delete
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
      padding: 8px 0;
    }
    
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .page-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    
    .skeleton-card {
      padding: 8px;
    }
    
    .skeleton {
      background: linear-gradient(90deg, var(--mat-sys-surface-container) 25%, var(--mat-sys-surface-container-high) 50%, var(--mat-sys-surface-container) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    
    .skeleton-title { height: 24px; width: 60%; margin-bottom: 8px; }
    .skeleton-subtitle { height: 16px; width: 40%; }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      gap: 16px;
    }
    
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.3;
    }
    
    .empty-state h2 { margin: 0; color: var(--mat-sys-on-surface); }
    .empty-state p { margin: 0; color: var(--mat-sys-on-surface-variant); max-width: 300px; }
    
    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    
    .group-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .group-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }
    
    .group-card.archived {
      opacity: 0.6;
    }
    
    .card-header {
      aspect-ratio: 16/9;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px 12px 0 0;
      margin: -8px -8px 0 -8px;
      font-size: 48px;
    }
    
    .cover-emoji {
      font-size: 48px;
      line-height: 1;
    }
    
    .group-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-on-primary-container);
    }
    
    .group-name {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.3;
    }
    
    .group-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 4px;
    }
    
    .currency-badge {
      padding: 2px 8px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-high);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    
    .member-count {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .member-count mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .group-stats {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }
    
    .delete-action {
      color: var(--mat-sys-error);
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
    try {
      const response = await this.http.get<{ groups: Group[] }>(`${environment.apiUrl}/groups`).toPromise();
      if (response) this.groups.set(response.groups);
    } catch (err) {
      console.error('Failed to load groups', err);
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