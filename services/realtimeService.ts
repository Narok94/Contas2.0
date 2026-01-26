
import { MOCK_USERS, MOCK_GROUPS, MOCK_ACCOUNTS, ACCOUNT_CATEGORIES, MOCK_INCOMES } from '../utils/mockData';
import { User, Group, Account, Income } from '../types';

type CollectionKey = 'users' | 'groups' | 'accounts' | 'categories' | 'incomes';
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'local';

type Db = {
  users: User[];
  groups: Group[];
  accounts: Account[];
  categories: string[];
  incomes: Income[];
};

type ListenerCallback<T> = (data: T) => void;
type SyncStatusCallback = (status: SyncStatus, lastSync?: Date) => void;

const DB_STORAGE_KEY = 'controle_contas_db';

class RealtimeService {
  private db: Db;
  private listeners: { [K in CollectionKey]?: ListenerCallback<Db[K]>[] } = {};
  private syncListeners: SyncStatusCallback[] = [];
  private currentSyncStatus: SyncStatus = 'local';
  private currentUserIdentifier: string | null = null;
  private lastSyncTime: Date | undefined = undefined;
  private syncTimeout: number | null = null;
  private pollingInterval: number | null = null;

  constructor() {
    this.db = this.getDefaultDb();
    
    const storedUser = sessionStorage.getItem('app_currentUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            this.currentUserIdentifier = String(user.username);
        } catch (e) {}
    }

    this.init();
    window.addEventListener('storage', this.handleStorageChange);
  }

  private getDefaultDb(): Db {
      return {
          users: MOCK_USERS,
          groups: MOCK_GROUPS,
          accounts: MOCK_ACCOUNTS,
          categories: ACCOUNT_CATEGORIES,
          incomes: MOCK_INCOMES,
      };
  }

  private async init() {
    await this.loadDb();
    this.startPolling();
    this.notifyAll();
  }

  private startPolling() {
    if (this.pollingInterval) window.clearInterval(this.pollingInterval);
    this.pollingInterval = window.setInterval(() => {
        if (this.currentUserIdentifier && this.currentSyncStatus !== 'syncing' && this.currentSyncStatus !== 'error') {
            this.loadDb();
        }
    }, 30000);
  }

  public setUser(username: string) {
      if (this.currentUserIdentifier !== String(username)) {
          this.currentUserIdentifier = String(username);
          this.lastSyncTime = undefined;
          this.loadDb();
      }
  }

  public forceSync = async () => {
      console.log("[RealtimeService] Iniciando sincronização forçada com Neon Postgres...");
      await this.loadDb();
      await this._saveDb();
  };

  public getCurrentUserIdentifier = () => this.currentUserIdentifier;
  public getLastSyncTime = () => this.lastSyncTime;

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key === DB_STORAGE_KEY && event.newValue) {
        try {
            const parsedData = JSON.parse(event.newValue);
            if (parsedData.db) {
                this.db = parsedData.db;
                this.notifyAll();
            }
        } catch (error) {}
    }
  }

  private async loadDb() {
    this.loadFromLocal();
    
    if (!this.currentUserIdentifier) {
        this.setSyncStatus('local');
        return;
    }

    this.setSyncStatus('syncing');
    try {
      const id = encodeURIComponent(this.currentUserIdentifier);
      const response = await fetch(`/api/db?identifier=${id}`);
      
      if (response.ok) {
        const remoteDb = await response.json();
        if (remoteDb && (remoteDb.users || remoteDb.accounts)) {
          this.db = remoteDb;
          this.saveToLocalOnly();
          this.lastSyncTime = new Date();
          this.setSyncStatus('synced');
          this.notifyAll();
          console.log("[RealtimeService] Dados recuperados da tabela 'operacoes'.");
        } else {
          this.setSyncStatus('synced');
        }
      } else {
        console.error(`[RealtimeService] Erro na API: ${response.status}`);
        this.setSyncStatus('error');
      }
    } catch (error) {
      console.error('[RealtimeService] Falha de conexão:', error);
      this.setSyncStatus('error');
    }
  }

  private loadFromLocal() {
    const storedDataString = localStorage.getItem(DB_STORAGE_KEY);
    if (storedDataString) {
      try {
        const storedData = JSON.parse(storedDataString);
        if (storedData.db) {
          this.db = storedData.db;
          return;
        }
      } catch (e) {}
    }
  }

  private setSyncStatus(status: SyncStatus) {
    this.currentSyncStatus = status;
    this.syncListeners.forEach(callback => callback(status, this.lastSyncTime));
  }

  public subscribeToSyncStatus(callback: SyncStatusCallback) {
    this.syncListeners.push(callback);
    callback(this.currentSyncStatus, this.lastSyncTime);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  private saveToLocalOnly() {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify({ db: this.db }));
    } catch (e) {}
  }

  private async _saveDb() {
    this.saveToLocalOnly();
    
    if (!this.currentUserIdentifier) return;

    if (this.syncTimeout) window.clearTimeout(this.syncTimeout);

    this.syncTimeout = window.setTimeout(async () => {
        this.setSyncStatus('syncing');
        try {
          const id = encodeURIComponent(this.currentUserIdentifier!);
          const response = await fetch(`/api/db?identifier=${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.db)
          });
          
          if (response.ok) {
            this.lastSyncTime = new Date();
            this.setSyncStatus('synced');
            console.log("[RealtimeService] Dados salvos com sucesso na tabela 'operacoes'.");
          } else {
            this.setSyncStatus('error');
          }
        } catch (error) {
          this.setSyncStatus('error');
        }
    }, 2000);
  }

  private simulateApiCall<T>(data: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(data), 5));
  }

  private notify<K extends CollectionKey>(collection: K) {
    const data = this.db[collection];
    const listeners = this.listeners[collection] as ListenerCallback<Db[K]>[] | undefined;
    (listeners || []).forEach(callback => callback(data));
  }

  private notifyAll() {
    (Object.keys(this.db) as CollectionKey[]).forEach(collection => {
      this.notify(collection);
    });
  }

  subscribe<K extends CollectionKey>(collection: K, callback: ListenerCallback<Db[K]>) {
    if (!this.listeners[collection]) {
      this.listeners[collection] = [];
    }
    (this.listeners[collection] as ListenerCallback<Db[K]>[]).push(callback);
    callback(this.db[collection]);
  }
  
  unsubscribe<K extends CollectionKey>(collection: K, callback: ListenerCallback<Db[K]>) {
    if (this.listeners[collection]) {
      const listeners = this.listeners[collection] as ListenerCallback<Db[K]>[];
      (this.listeners as any)[collection] = listeners.filter(cb => cb !== callback);
    }
  }

  getUsers = () => this.simulateApiCall(this.db.users);
  updateUser = async (updatedUser: User) => {
    this.db.users = this.db.users.map(u => (u.id === updatedUser.id ? updatedUser : u));
    await this._saveDb();
    this.notify('users');
    return updatedUser;
  };
  addUser = async (newUser: Omit<User, 'id'>): Promise<User> => {
    const userWithId = { ...newUser, id: `user-${Date.now()}` };
    this.db.users.push(userWithId);
    await this._saveDb();
    this.notify('users');
    return userWithId;
  };
  deleteUser = async (userId: string) => {
    this.db.users = this.db.users.filter(u => u.id !== userId);
    await this._saveDb();
    this.notify('users');
    return { success: true };
  };

  getGroups = () => this.simulateApiCall(this.db.groups);
  updateGroup = async (updatedGroup: Group) => {
    this.db.groups = this.db.groups.map(g => (g.id === updatedGroup.id ? updatedGroup : g));
    await this._saveDb();
    this.notify('groups');
    return updatedGroup;
  };
  addGroup = async (newGroup: Omit<Group, 'id'>): Promise<Group> => {
    const groupWithId = { ...newGroup, id: `group-${Date.now()}` };
    this.db.groups.push(groupWithId);
    await this._saveDb();
    this.notify('groups');
    return groupWithId;
  };
  deleteGroup = async (groupId: string) => {
    this.db.groups = this.db.groups.filter(u => u.id !== groupId);
    await this._saveDb();
    this.notify('groups');
    return { success: true };
  };
  
  getAccounts = () => this.simulateApiCall(this.db.accounts);
  updateAccount = async (updatedAccount: Account) => {
    this.db.accounts = this.db.accounts.map(a => (a.id === updatedAccount.id ? updatedAccount : a));
    await this._saveDb();
    this.notify('accounts');
    return updatedAccount;
  };
  addAccount = async (newAccount: Account) => {
    this.db.accounts.push(newAccount);
    await this._saveDb();
    this.notify('accounts');
    return newAccount;
  };
  deleteAccount = async (accountId: string) => {
    this.db.accounts = this.db.accounts.filter(a => a.id !== accountId);
    await this._saveDb();
    this.notify('accounts');
    return { success: true };
  };
  updateMultipleAccounts = async (allAccounts: Account[]) => {
      this.db.accounts = allAccounts;
      await this._saveDb();
      this.notify('accounts');
      return allAccounts;
  };

  getIncomes = () => this.simulateApiCall(this.db.incomes);
  updateIncome = async (updatedIncome: Income) => {
    this.db.incomes = this.db.incomes.map(i => (i.id === updatedIncome.id ? updatedIncome : i));
    await this._saveDb();
    this.notify('incomes');
    return updatedIncome;
  };
  addIncome = async (newIncome: Income) => {
    this.db.incomes.push(newIncome);
    await this._saveDb();
    this.notify('incomes');
    return newIncome;
  };
  deleteIncome = async (incomeId: string) => {
    this.db.incomes = this.db.incomes.filter(i => i.id !== incomeId);
    await this._saveDb();
    this.notify('incomes');
    return { success: true };
  };
  
  getCategories = () => this.simulateApiCall(this.db.categories);
  saveCategories = async (categories: string[]) => {
    this.db.categories = categories;
    await this._saveDb();
    this.notify('categories');
    return categories;
  }
  
  exportData = async () => this.db;

  importData = async (data: Db) => {
    this.db = data;
    await this._saveDb();
    this.notifyAll();
    return { success: true };
  };
}

const realtimeService = new RealtimeService();
export default realtimeService;
