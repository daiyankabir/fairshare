import { Injectable, inject } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

export interface OfflineExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  exchangeRate: any;
  date: string;
  categoryId: string | null;
  payerIds: string[];
  payers: any[];
  splits: any[];
  items: any[];
  splitType: string;
  notes: string | null;
  receiptUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  isLocal: boolean;
  localId?: string;
}

export interface OfflineGroup {
  id: string;
  name: string;
  defaultCurrency: string;
  coverEmoji: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  isLocal: boolean;
  localId?: string;
}

export interface OfflineMember {
  id: string;
  groupId: string;
  userId: string | null;
  displayName: string;
  role: string;
  isGuest: boolean;
  joinedAt: string;
  defaultCurrency: string | null;
  isLocal: boolean;
}

export interface OfflineSettlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currency: string;
  date: string;
  note: string | null;
  createdBy: string;
  createdAt: string;
  isLocal: boolean;
}

@Injectable({ providedIn: 'root' })
export class DexieService extends Dexie {
  expenses!: Table<OfflineExpense, string>;
  groups!: Table<OfflineGroup, string>;
  members!: Table<OfflineMember, string>;
  settlements!: Table<OfflineSettlement, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  exchangeRates!: Table<any, string>;
  settings!: Table<any, string>;
  
  constructor() {
    super('FairShareDB');
    
    this.version(1).stores({
      expenses: 'id, groupId, date, categoryId, isLocal, localId, createdAt',
      groups: 'id, name, isArchived, isLocal, localId',
      members: 'id, groupId, userId, isGuest, isLocal',
      settlements: 'id, groupId, date, fromMemberId, toMemberId, isLocal',
      syncQueue: '++id, entityType, entityId, operation, timestamp',
      exchangeRates: 'id, from, to, date',
      settings: 'key'
    });
    
    this.version(2).stores({
      expenses: 'id, groupId, date, categoryId, isLocal, localId, createdAt, version',
      groups: 'id, name, isArchived, isLocal, localId',
      members: 'id, groupId, userId, isGuest, isLocal',
      settlements: 'id, groupId, date, fromMemberId, toMemberId, isLocal',
      syncQueue: '++id, entityType, entityId, operation, timestamp',
      exchangeRates: 'id, from, to, date',
      settings: 'key'
    }).upgrade(tx => {
      return tx.table('expenses').toCollection().modify(expense => {
        expense.version = expense.version || 1;
      });
    });
  }
  
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return this.syncQueue.orderBy('timestamp').toArray();
  }
  
  async addSyncItem(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
    return this.syncQueue.add(item as SyncQueueItem);
  }
  
  async removeSyncItem(id: number): Promise<void> {
    return this.syncQueue.delete(id);
  }
  
  async updateSyncItem(id: number, updates: Partial<SyncQueueItem>): Promise<number> {
    return this.syncQueue.update(id, updates);
  }
  
  async getExpense(id: string): Promise<OfflineExpense | undefined> {
    return this.expenses.get(id);
  }
  
  async getExpensesByGroup(groupId: string): Promise<OfflineExpense[]> {
    return this.expenses.where('groupId').equals(groupId).reverse().sortBy('date');
  }
  
  async getAllExpenses(): Promise<OfflineExpense[]> {
    return this.expenses.toArray();
  }
  
  async addExpense(expense: OfflineExpense): Promise<string> {
    return this.expenses.add(expense);
  }
  
  async updateExpense(id: string, updates: Partial<OfflineExpense>): Promise<number> {
    return this.expenses.update(id, { ...updates, updatedAt: new Date().toISOString() });
  }
  
  async deleteExpense(id: string): Promise<void> {
    return this.expenses.delete(id);
  }
  
  async getGroup(id: string): Promise<OfflineGroup | undefined> {
    return this.groups.get(id);
  }
  
  async getGroups(): Promise<OfflineGroup[]> {
    return this.groups.where('isArchived').equals(0).toArray();
  }
  
  async addGroup(group: OfflineGroup): Promise<string> {
    return this.groups.add(group);
  }
  
  async updateGroup(id: string, updates: Partial<OfflineGroup>): Promise<number> {
    return this.groups.update(id, { ...updates, updatedAt: new Date().toISOString() });
  }
  
  async deleteGroup(id: string): Promise<void> {
    return this.groups.delete(id);
  }
  
  async getMembersByGroup(groupId: string): Promise<OfflineMember[]> {
    return this.members.where('groupId').equals(groupId).toArray();
  }
  
  async addMember(member: OfflineMember): Promise<string> {
    return this.members.add(member);
  }
  
  async updateMember(id: string, updates: Partial<OfflineMember>): Promise<number> {
    return this.members.update(id, updates);
  }
  
  async deleteMember(id: string): Promise<void> {
    return this.members.delete(id);
  }
  
  async getSettlementsByGroup(groupId: string): Promise<OfflineSettlement[]> {
    return this.settlements.where('groupId').equals(groupId).reverse().sortBy('date');
  }
  
  async addSettlement(settlement: OfflineSettlement): Promise<string> {
    return this.settlements.add(settlement);
  }
  
  async updateSettlement(id: string, updates: Partial<OfflineSettlement>): Promise<number> {
    return this.settlements.update(id, updates);
  }
  
  async deleteSettlement(id: string): Promise<void> {
    return this.settlements.delete(id);
  }
  
  async getExchangeRate(from: string, to: string, date: Date): Promise<number | undefined> {
    const id = `${from}_${to}_${date.toISOString().split('T')[0]}`;
    const record = await this.exchangeRates.get(id);
    return record?.rate;
  }
  
  async setExchangeRate(from: string, to: string, rate: number, date: Date, source: 'api' | 'manual'): Promise<void> {
    const id = `${from}_${to}_${date.toISOString().split('T')[0]}`;
    await this.exchangeRates.put({ id, from, to, rate, date: date.toISOString(), source, fetchedAt: new Date().toISOString() });
  }
  
  async getSetting(key: string): Promise<any> {
    const record = await this.settings.get(key);
    return record?.value;
  }
  
  async setSetting(key: string, value: any): Promise<string> {
    return this.settings.put({ key, value });
  }
  
  async applyServerChange(change: any): Promise<void> {
    const { entityType, entityId, operation, payload, version } = change;
    
    switch (entityType) {
      case 'expenses':
        if (operation === 'delete') {
          await this.deleteExpense(entityId);
        } else {
          const local = await this.getExpense(entityId);
          if (!local || (version && local.version < version)) {
            await this.expenses.put({ ...payload, id: entityId, isLocal: false, version: version || 1 });
          }
        }
        break;
      case 'groups':
        if (operation === 'delete') {
          await this.deleteGroup(entityId);
        } else {
          await this.groups.put({ ...payload, id: entityId, isLocal: false });
        }
        break;
      case 'members':
        if (operation === 'delete') {
          await this.deleteMember(entityId);
        } else {
          await this.members.put({ ...payload, id: entityId, isLocal: false });
        }
        break;
      case 'settlements':
        if (operation === 'delete') {
          await this.deleteSettlement(entityId);
        } else {
          await this.settlements.put({ ...payload, id: entityId, isLocal: false });
        }
        break;
    }
  }
  
  async updateEntity(entityType: string, entityId: string, payload: any): Promise<void> {
    const version = payload.version ? payload.version + 1 : 2;
    const data = { ...payload, id: entityId, version, updatedAt: new Date().toISOString() };
    
    switch (entityType) {
      case 'expenses':
        await this.expenses.put(data);
        break;
      case 'groups':
        await this.groups.put(data);
        break;
      case 'members':
        await this.members.put(data);
        break;
      case 'settlements':
        await this.settlements.put(data);
        break;
    }
  }
  
  async clearAll(): Promise<void> {
    await this.transaction('rw', this.expenses, this.groups, this.members, this.settlements, this.syncQueue, async () => {
      await this.expenses.clear();
      await this.groups.clear();
      await this.members.clear();
      await this.settlements.clear();
      await this.syncQueue.clear();
    });
  }
}

export const dexieService = new DexieService();