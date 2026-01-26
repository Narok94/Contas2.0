
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

const DB_STORAGE_KEY = 'ricka_local_db_v2';
const RETRY_DELAY = 15000; // 15 segundos

class RealtimeService {
  private db: Db;
  private listeners: { [K in CollectionKey]?: ListenerCallback<Db[K]>[] } = {};
  private syncListeners: SyncStatusCallback[] = [];
  private currentSyncStatus: SyncStatus = 'local';
  private currentUserIdentifier: string | null = null;
  private lastSyncTime: Date | undefined = undefined;
  private syncDebounceTimer: number | null = null;
  private retryTimer: number | null = null;

  constructor() {
    this.db = this.loadInitialDb();
    this.init();
    window.addEventListener('storage', this.handleCrossTabSync);
  }

  private loadInitialDb(): Db {
    const stored = localStorage.getItem(DB_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.db) return parsed.db;
      } catch (e) {}
    }
    return {
      users: MOCK_USERS,
      groups: MOCK_GROUPS,
      accounts: MOCK_ACCOUNTS,
      categories: ACCOUNT_CATEGORIES,
      incomes: MOCK_INCOMES,
    };
  }

  private async init() {
    const userStr = sessionStorage.getItem('app_currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserIdentifier = user.username;
      this.syncWithRemote();
    }
    this.notifyAll();
  }

  public setUser(username: string) {
    if (this.currentUserIdentifier !== username) {
      this.currentUserIdentifier = username;
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.retryTimer = null;
      
      if (username) {
        this.syncWithRemote();
      } else {
        this.setSyncStatus('local');
      }
    }
  }

  private handleCrossTabSync = (e: StorageEvent) => {
    if (e.key === DB_STORAGE_KEY && e.newValue) {
      try {
        this.db = JSON.parse(e.newValue).db;
        this.notifyAll();
      } catch (err) {}
    }
  }

  public async syncWithRemote() {
    if (!this.currentUserIdentifier || this.currentSyncStatus === 'syncing') return;
    
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;

    this.setSyncStatus('syncing');
    try {
      const res = await fetch(`/api/db?identifier=${encodeURIComponent(this.currentUserIdentifier)}`);
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData && remoteData.users) {
          this.db = remoteData;
          this.saveLocal();
          this.notifyAll();
        }
        this.lastSyncTime = new Date();
        this.setSyncStatus('synced');
        if (!remoteData) {
          this.persistRemote(); // Primeira sincronização para um novo usuário
        }
      } else {
        this.handleSyncError();
      }
    } catch (e) {
      this.handleSyncError();
    }
  }

  private handleSyncError() {
      this.setSyncStatus('error');
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.retryTimer = window.setTimeout(() => {
          this.syncWithRemote();
      }, RETRY_DELAY);
  }

  private setSyncStatus(status: SyncStatus) {
    this.currentSyncStatus = status;
    this.syncListeners.forEach(cb => cb(status, this.lastSyncTime));
  }

  public subscribeToSyncStatus(cb: SyncStatusCallback) {
    this.syncListeners.push(cb);
    cb(this.currentSyncStatus, this.lastSyncTime);
    return () => { this.syncListeners = this.syncListeners.filter(c => c !== cb); };
  }

  private saveLocal() {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify({ db: this.db, timestamp: Date.now() }));
  }

  private async persistRemote() {
    if (!this.currentUserIdentifier) return;
    
    if (this.syncDebounceTimer) window.clearTimeout(this.syncDebounceTimer);
    
    this.syncDebounceTimer = window.setTimeout(async () => {
      this.setSyncStatus('syncing');
      try {
        const res = await fetch(`/api/db?identifier=${encodeURIComponent(this.currentUserIdentifier!)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.db)
        });
        if (res.ok) {
          this.lastSyncTime = new Date();
          this.setSyncStatus('synced');
        } else {
          this.handleSyncError();
        }
      } catch (e) {
        this.handleSyncError();
      }
    }, 2000);
  }

  private notifyAll() {
    (Object.keys(this.db) as CollectionKey[]).forEach(k => this.notify(k));
  }

  private notify<K extends CollectionKey>(k: K) {
    const callbacks = this.listeners[k] as any[] | undefined;
    if (callbacks) {
        const data = this.db[k];
        const dataToSend = Array.isArray(data) ? [...data] : data;
        callbacks.forEach(cb => cb(dataToSend));
    }
  }

  public subscribe<K extends CollectionKey>(k: K, cb: ListenerCallback<Db[K]>) {
    if (!this.listeners[k]) {
      (this.listeners as any)[k] = [];
    }
    const currentListeners = this.listeners[k] as any[];
    currentListeners.push(cb);
    const data = this.db[k];
    const dataToSend = Array.isArray(data) ? [...data] : data;
    // FIX: Cast the argument to Db[K] to resolve a type inference issue where TypeScript
    // widens the type of the cloned array to a union of all possible element types,
    // which is not compatible with the specific array type expected by the callback.
    cb(dataToSend as Db[K]);
  }

  public unsubscribe<K extends CollectionKey>(k: K, cb: ListenerCallback<Db[K]>) {
    if (this.listeners[k]) {
      const currentListeners = this.listeners[k] as any[];
      (this.listeners as any)[k] = currentListeners.filter(c => c !== cb);
    }
  }

  public forceSync() {
    this.syncWithRemote();
  }

  public getCurrentUserIdentifier() {
    return this.currentUserIdentifier;
  }

  private async write() {
    this.saveLocal();
    this.persistRemote();
  }

  public getAccounts = () => this.db.accounts;
  public updateAccount = async (acc: Account) => {
    this.db.accounts = this.db.accounts.map(a => a.id === acc.id ? acc : a);
    this.notify('accounts');
    this.write();
  }
  public addAccount = async (acc: Account) => {
    this.db.accounts = [...this.db.accounts, acc];
    this.notify('accounts');
    this.write();
  }
  public deleteAccount = async (id: string) => {
    this.db.accounts = this.db.accounts.filter(a => a.id !== id);
    this.notify('accounts');
    this.write();
  }
  public updateMultipleAccounts = async (accs: Account[]) => {
    this.db.accounts = this.db.accounts.map(a => {
        const updated = accs.find(ua => ua.id === a.id);
        return updated || a;
    });
    this.notify('accounts');
    this.write();
  }

  public getUsers = () => this.db.users;
  public addUser = async (u: Omit<User, 'id'>) => {
    const newUser = { ...u, id: `user-${Date.now()}` } as User;
    this.db.users = [...this.db.users, newUser];
    this.notify('users');
    this.write();
    return newUser;
  }
  public updateUser = async (u: User) => {
    this.db.users = this.db.users.map(old => old.id === u.id ? u : old);
    this.notify('users');
    this.write();
    return u;
  }
  public deleteUser = async (id: string) => {
    this.db.users = this.db.users.filter(u => u.id !== id);
    this.notify('users');
    this.write();
  }

  public getGroups = () => this.db.groups;
  public addGroup = async (g: Omit<Group, 'id'>) => {
    const newGroup = { ...g, id: `group-${Date.now()}` } as Group;
    this.db.groups = [...this.db.groups, newGroup];
    this.notify('groups');
    this.write();
    return newGroup;
  }
  public updateGroup = async (g: Group) => {
    this.db.groups = this.db.groups.map(old => old.id === g.id ? g : old);
    this.notify('groups');
    this.write();
    return g;
  }
  public deleteGroup = async (id: string) => {
    this.db.groups = this.db.groups.filter(g => g.id !== id);
    this.notify('groups');
    this.write();
  }
  
  public getIncomes = () => this.db.incomes;
  public addIncome = async (i: Income) => {
    this.db.incomes = [...this.db.incomes, i];
    this.notify('incomes');
    this.write();
  }
  public updateIncome = async (inc: Income) => {
    this.db.incomes = this.db.incomes.map(i => i.id === inc.id ? inc : i);
    this.notify('incomes');
    this.write();
    return inc;
  }
  public deleteIncome = async (id: string) => {
    this.db.incomes = this.db.incomes.filter(i => i.id !== id);
    this.notify('incomes');
    this.write();
  }

  public getCategories = () => this.db.categories;
  public saveCategories = async (cats: string[]) => {
    this.db.categories = cats;
    this.notify('categories');
    this.write();
  }

  public exportData = () => this.db;
  public importData = (data: Db) => {
    this.db = data;
    this.notifyAll();
    this.write();
  }
}

export default new RealtimeService();
