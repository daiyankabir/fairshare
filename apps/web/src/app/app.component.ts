import { Component, signal, computed, effect, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil, filter } from 'rxjs';

import { AuthStore } from './core/store/auth/auth.store';
import { SyncService } from './core/services/sync.service';
import { ThemeService } from './core/services/theme.service';
import { routes } from './app.routes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatListModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container" [class.has-bottom-nav]="isMobile()">
      <mat-sidenav
        #sidenav
        mode="side"
        [opened]="!isMobile() && isAuthenticated()"
        [class.mobile-sidenav]="isMobile()"
        fixedInViewport="true"
        fixedTopGap="64"
      >
        <mat-nav-list class="nav-list">
          @for (route of navigationRoutes(); track route.path) {
            <a
              mat-list-item
              [routerLink]="route.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: route.exact }"
              (click)="sidenav.close()"
              [matTooltip]="route.label"
              matTooltipPosition="right"
            >
              <mat-icon matListItemIcon>{{ route.icon }}</mat-icon>
              <span class="nav-label">{{ route.label }}</span>
            </a>
          }
        </mat-nav-list>
        
        <mat-divider />
        
        <mat-nav-list class="nav-list">
          <a mat-list-item [routerLink]="['/settings']" (click)="sidenav.close()">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span class="nav-label">Settings</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <mat-sidenav-content class="sidenav-content">
        <header class="toolbar-header" [class.mobile-toolbar]="isMobile()">
          <mat-toolbar color="primary" class="main-toolbar">
            <button
              mat-icon-button
              (click)="sidenav.toggle()"
              [attr.aria-label]="'Toggle menu'"
              *ngIf="isMobile()"
            >
              <mat-icon>menu</mat-icon>
            </button>
            
            <a routerLink="/groups" class="toolbar-brand" aria-label="FairShare Home">
              <mat-icon class="brand-icon">account_balance_wallet</mat-icon>
              <span class="brand-text">FairShare</span>
            </a>
            
            <span class="toolbar-spacer"></span>
            
            @if (isAuthenticated()) {
              <div class="toolbar-actions">
                <button
                  mat-icon-button
                  [matMenuTriggerFor]="syncMenu"
                  matTooltip="Sync status"
                  matTooltipPosition="below"
                  class="sync-button"
                >
                  <mat-icon [class.syncing]="syncService.isSyncing()">sync</mat-icon>
                </button>
                <mat-menu #syncMenu="matMenu">
                  <div class="sync-menu-content">
                    <div class="sync-status" [class]="'status-' + syncService.syncStatus()">
                      <mat-icon>{{ syncService.syncStatusIcon() }}</mat-icon>
                      <span>{{ syncService.syncStatusLabel() }}</span>
                    </div>
                    @if (syncService.lastSynced(); as lastSynced) {
                      <div class="sync-last-synced">
                        Last synced: {{ lastSynced | date:'short' }}
                      </div>
                    }
                    <button mat-menu-item (click)="syncService.forceSync()">
                      <mat-icon>sync</mat-icon>
                      <span>Sync now</span>
                    </button>
                  </div>
                </mat-menu>
                
                <button
                  mat-icon-button
                  [matMenuTriggerFor]="themeMenu"
                  matTooltip="Theme"
                  matTooltipPosition="below"
                >
                  <mat-icon>{{ themeService.isDark() ? 'dark_mode' : 'light_mode' }}</mat-icon>
                </button>
                <mat-menu #themeMenu="matMenu">
                  <button mat-menu-item (click)="themeService.setTheme('light')">
                    <mat-icon>light_mode</mat-icon>
                    <span>Light</span>
                  </button>
                  <button mat-menu-item (click)="themeService.setTheme('dark')">
                    <mat-icon>dark_mode</mat-icon>
                    <span>Dark</span>
                  </button>
                  <button mat-menu-item (click)="themeService.setTheme('system')">
                    <mat-icon>settings_brightness</mat-icon>
                    <span>System</span>
                  </button>
                </mat-menu>
                
                <button
                  mat-icon-button
                  [matMenuTriggerFor]="userMenu"
                  matTooltip="Account"
                  matTooltipPosition="below"
                  class="user-menu-trigger"
                >
                  <div class="user-avatar" [style.background-color]="authStore.currentUserColor()">
                    {{ authStore.currentUserInitials() }}
                  </div>
                </button>
                <mat-menu #userMenu="matMenu">
                  <div class="user-menu-header">
                    <div class="user-avatar large" [style.background-color]="authStore.currentUserColor()">
                      {{ authStore.currentUserInitials() }}
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ authStore.currentUserName() }}</span>
                      <span class="user-email">{{ authStore.currentUserEmail() }}</span>
                    </div>
                  </div>
                  <mat-divider />
                  <button mat-menu-item [routerLink]="['/profile']">
                    <mat-icon>person</mat-icon>
                    <span>Profile</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/settings']">
                    <mat-icon>settings</mat-icon>
                    <span>Settings</span>
                  </button>
                  <mat-divider />
                  <button mat-menu-item (click)="authStore.logout()">
                    <mat-icon>logout</mat-icon>
                    <span>Sign out</span>
                  </button>
                </mat-menu>
              </div>
            } @else {
              <div class="toolbar-auth">
                <a mat-button routerLink="/login">Sign in</a>
                <a mat-flat-button color="accent" routerLink="/register">Get started</a>
              </div>
            }
          </mat-toolbar>
        </header>
        
        <main class="main-content" [class.has-bottom-nav]="isMobile()">
          <router-outlet />
        </main>
        
        @if (isMobile()) {
          <nav class="mobile-bottom-nav" role="navigation" aria-label="Main navigation">
            @for (route of mobileNavRoutes(); track route.path) {
              <button
                mat-button
                [routerLink]="route.path"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: route.exact }"
                class="nav-button"
                [class.active]="isActiveRoute(route.path)"
              >
                <mat-icon>{{ route.icon }}</mat-icon>
                <span>{{ route.label }}</span>
              </button>
            }
          </nav>
        }
      </mat-sidenav-content>
    </mat-sidenav-container>
    
    @if (syncService.isSyncing()) {
      <div class="loading-overlay" aria-live="polite" aria-label="Syncing data">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
    }
  `,
  styles: [`
    .sidenav-container {
      height: 100%;
      background: var(--mat-sys-surface-container-lowest);
    }
    
    .mobile-sidenav {
      width: 280px;
    }
    
    .nav-list {
      padding: 8px 0;
    }
    
    .nav-list a.mat-list-item {
      border-radius: 0 24px 24px 0;
      margin: 4px 16px 4px 0;
      padding: 0 16px;
      
      &.active {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        
        mat-icon {
          color: var(--mat-sys-primary);
        }
      }
      
      &:hover:not(.active) {
        background: var(--mat-sys-surface-container);
      }
    }
    
    .nav-label {
      font-weight: 500;
      font-size: 15px;
    }
    
    .toolbar-header {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .mobile-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
    }
    
    .main-toolbar {
      height: 64px;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--mat-sys-on-primary);
      padding: 4px 8px;
      border-radius: 8px;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
    
    .brand-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    
    .brand-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .toolbar-spacer {
      flex: 1;
    }
    
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .sync-button {
      position: relative;
      
      mat-icon.syncing {
        animation: spin 1s linear infinite;
      }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .sync-menu-content {
      min-width: 220px;
      padding: 8px;
    }
    
    .sync-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 500;
      
      &.status-online {
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
      }
      
      &.status-offline {
        background: var(--mat-sys-tertiary-container);
        color: var(--mat-sys-on-tertiary-container);
      }
      
      &.status-syncing {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }
    }
    
    .sync-last-synced {
      padding: 4px 12px;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }
    
    .user-menu-trigger {
      width: 40px;
      height: 40px;
      padding: 0;
    }
    
    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }
    
    .user-avatar.large {
      width: 48px;
      height: 48px;
      font-size: 18px;
    }
    
    .user-menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
    }
    
    .user-name {
      font-weight: 600;
      font-size: 14px;
    }
    
    .user-email {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }
    
    .toolbar-auth {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .main-content {
      padding: 24px;
      min-height: calc(100vh - 64px);
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    
    .main-content.has-bottom-nav {
      padding-bottom: 100px;
    }
    
    .mobile-bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 8px 0;
      background: var(--mat-sys-surface-container);
      border-top: 1px solid var(--mat-sys-outline-variant);
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .nav-button {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      background: transparent;
      border: none;
      color: var(--mat-sys-on-surface-variant);
      font-size: 11px;
      font-weight: 500;
      min-width: 0;
      
      &.active {
        color: var(--mat-sys-primary);
      }
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  
  readonly authStore = inject(AuthStore);
  readonly syncService = inject(SyncService);
  readonly themeService = inject(ThemeService);
  
  readonly isMobile = signal(false);
  readonly currentRoute = signal('');
  
  readonly navigationRoutes = computed(() => [
    { path: '/groups', label: 'Groups', icon: 'groups', exact: true },
    { path: '/expenses', label: 'Expenses', icon: 'receipt_long', exact: false },
    { path: '/balances', label: 'Balances', icon: 'balance', exact: false },
    { path: '/reports', label: 'Reports', icon: 'analytics', exact: false }
  ]);
  
  readonly mobileNavRoutes = computed(() => [
    { path: '/groups', label: 'Groups', icon: 'groups', exact: true },
    { path: '/expenses', label: 'Expenses', icon: 'receipt_long', exact: false },
    { path: '/balances', label: 'Balances', icon: 'balance', exact: false }
  ]);
  
  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
    
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.urlAfterRedirects);
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  isAuthenticated(): boolean {
    return this.authStore.isAuthenticated();
  }
  
  isActiveRoute(path: string): boolean {
    return this.currentRoute().startsWith(path);
  }
}