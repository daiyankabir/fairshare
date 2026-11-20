import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DexieService } from './dexie.service';
import { AuthStore } from '../store/auth/auth.store';
import { Subject, takeUntil, debounceTime, switchMap, catchError, of, tap, from } from 'rxjs';

export type SyncStatus = 'online' | 'offline' | 'syncing';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly dexie = inject(DexieService);
  private readonly authStore = inject(AuthStore);
  private readonly destroy$ = new Subject<void>();
  private readonly syncTrigger$ = new Subject<void>();
  private readonly apiUrl = '/api';

  readonly syncStatus = signal<SyncStatus>('offline');
  readonly isSyncing = signal(false);
  readonly lastSynced = signal<Date | null>(null);
  readonly pendingCount = signal(0);
  readonly lastError = signal<string | null>(null);

  readonly syncStatusIcon = computed(() => {
    switch (this.syncStatus()) {
      case 'online': return 'cloud_done';
      case 'offline': return 'cloud_off';
      case 'syncing': return 'sync';
    }
  });

  readonly syncStatusLabel = computed(() => {
    switch (this.syncStatus()) {
      case 'online': return 'Synced';
      case 'offline': return 'Offline';
      case 'syncing': return 'Syncing...';
    }
  });

  private readonly init = (() => {
    this.initOnlineDetection();
    this.initPeriodicSync();
    this.initSyncTrigger();
  })();

  private initOnlineDetection(): void {
    if (typeof window === 'undefined') return;
    
    const updateOnlineStatus = () => {
      const wasOffline = this.syncStatus() === 'offline';
      this.syncStatus.set(navigator.onLine ? 'online' : 'offline');
      
      if (wasOffline && navigator.onLine) {
        this.triggerSync();
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    });
  }

  private initPeriodicSync(): void {
    if (typeof window === 'undefined') return;
    
    setInterval(() => {
      if (this.syncStatus() === 'online' && !this.isSyncing() && this.authStore.isAuthenticated()) {
        this.triggerSync();
      }
    }, 30000);
  }

  private initSyncTrigger(): void {
    this.syncTrigger$.pipe(
      debounceTime(500),
      takeUntil(this.destroy$),
      switchMap(() => from(this.performSync()))
    ).subscribe();
  }

  triggerSync(): void {
    if (this.syncStatus() === 'online' && this.authStore.isAuthenticated()) {
      this.syncTrigger$.next();
    }
  }

  forceSync(): void {
    if (this.authStore.isAuthenticated()) {
      this.performSync();
    }
  }

  private async performSync(): Promise<void> {
    if (this.isSyncing() || !this.authStore.isAuthenticated()) return;
    
    this.isSyncing.set(true);
    this.syncStatus.set('syncing');
    this.lastError.set(null);
    
    try {
      const pending = await this.dexie.getPendingSyncItems();
      this.pendingCount.set(pending.length);
      
      for (const item of pending) {
        await this.syncItem(item);
      }
      
      const serverChanges = await this.fetchServerChanges();
      await this.applyServerChanges(serverChanges);
      
      this.lastSynced.set(new Date());
      this.syncStatus.set('online');
      this.pendingCount.set(0);
    } catch (error) {
      this.lastError.set(error instanceof Error ? error.message : 'Sync failed');
      this.syncStatus.set('online');
    } finally {
      this.isSyncing.set(false);
    }
  }

  private async syncItem(item: any): Promise<void> {
    const { entityType, entityId, operation, payload } = item;
    
    let request: any;
    switch (operation) {
      case 'create':
        request = this.http.post(`${this.apiUrl}/${entityType}`, payload);
        break;
      case 'update':
        request = this.http.patch(`${this.apiUrl}/${entityType}/${entityId}`, payload);
        break;
      case 'delete':
        request = this.http.delete(`${this.apiUrl}/${entityType}/${entityId}`);
        break;
    }
    
    await request.pipe(
      catchError(err => {
        if (err.status === 409) {
          return this.handleConflict(item, err.error);
        }
        throw err;
      })
    ).toPromise();
    
    await this.dexie.removeSyncItem(item.id);
  }

  private async handleConflict(localItem: any, serverVersion: any): Promise<void> {
    const resolution = await this.showConflictDialog(localItem.payload, serverVersion);
    
    if (resolution === 'local') {
      await this.dexie.updateEntity(localItem.entityType, localItem.entityId, localItem.payload);
      await this.dexie.removeSyncItem(localItem.id);
    } else if (resolution === 'server') {
      await this.dexie.updateEntity(localItem.entityType, localItem.entityId, serverVersion);
      await this.dexie.removeSyncItem(localItem.id);
    }
  }

  private async showConflictDialog(local: any, server: any): Promise<'local' | 'server'> {
    return new Promise(resolve => {
      if (confirm(`Conflict detected for ${local.id}. Keep local changes?`)) {
        resolve('local');
      } else {
        resolve('server');
      }
    });
  }

  private async fetchServerChanges(): Promise<any[]> {
    const since = this.lastSynced()?.toISOString() || new Date(0).toISOString();
    const response = await this.http.get<any[]>(`${this.apiUrl}/sync/changes`, {
      params: { since }
    }).toPromise();
    return response || [];
  }

  private async applyServerChanges(changes: any[]): Promise<void> {
    for (const change of changes) {
      await this.dexie.applyServerChange(change);
    }
  }

  queueForSync(entityType: string, entityId: string, operation: 'create' | 'update' | 'delete', payload: any): void {
    this.dexie.addSyncItem({
      entityType,
      entityId,
      operation,
      payload,
      timestamp: new Date(),
      retryCount: 0
    });
    this.triggerSync();
  }
}