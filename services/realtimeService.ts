import { MOCK_USERS, MOCK_GROUPS, MOCK_ACCOUNTS, ACCOUNT_CATEGORIES, MOCK_INCOMES } from '../utils/mockData';
import { User, Group, Account, Income, AppSettings } from '../types';

type CollectionKey = 'users' | 'groups' | 'accounts' | 'categories' | 'incomes' | 'settings';
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'local';

type Db = {
  users: User[];
  groups: Group[];
  accounts: Account[];
  categories: string[];
  incomes: Income[];
  settings: AppSettings;
};

type ListenerCallback<T> = (data: T) => void;
type SyncStatusCallback = (status: SyncStatus, lastSync?: Date) => void;

const DB_STORAGE_KEY = 'ricka_local_db_v3'; // Versão incrementada para migração
const RETRY_DELAY = 15000;
const GLOBAL_SETTINGS_IDENTIFIER = 'tatu_global_settings_v1'; // Shared identifier for settings

class RealtimeService {
  private db: Db;
  private listeners: { [K in CollectionKey]?: ListenerCallback<any>[] } = {};
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
    const defaultSettings: AppSettings = { appName: 'TATU.' };
    const stored = localStorage.getItem(DB_STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.db) {
            return {
                users: parsed.db.users || MOCK_USERS,
                groups: parsed.db.groups || MOCK_GROUPS,
                accounts: parsed.db.accounts || MOCK_ACCOUNTS,
                categories: parsed.db.categories || ACCOUNT_CATEGORIES,
                incomes: parsed.db.incomes || MOCK_INCOMES,
                settings: parsed.db.settings || defaultSettings,
            };
        }
      } catch (e) {
          console.error("Erro ao carregar DB local", e);
      }
    }
    return {
      users: MOCK_USERS,
      groups: MOCK_GROUPS,
      accounts: MOCK_ACCOUNTS,
      categories: ACCOUNT_CATEGORIES,
      incomes: MOCK_INCOMES,
      settings: defaultSettings,
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
      if (username) this.syncWithRemote();
      else this.setSyncStatus('local');
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
    if (this.currentSyncStatus === 'syncing') return;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.setSyncStatus('syncing');

    try {
        // Fetch global settings
        const settingsRes = await fetch(`/api/db?identifier=${GLOBAL_SETTINGS_IDENTIFIER}`);
        const remoteSettingsData = settingsRes.ok ? await settingsRes.json() : null;

        let userDataToPersist: Omit<Db, 'settings'> | null = null;
        
        // Fetch user-specific data if a user is logged in
        if (this.currentUserIdentifier) {
            const userRes = await fetch(`/api/db?identifier=${encodeURIComponent(this.currentUserIdentifier)}`);
            const remoteUserData = userRes.ok ? await userRes.json() : null;
            
            // Merge remote user data with defaults from local/mock
            const mergedUserData = {
                users: remoteUserData?.users || this.db.users,
                groups: remoteUserData?.groups || this.db.groups,
                accounts: remoteUserData?.accounts || this.db.accounts,
                categories: remoteUserData?.categories || this.db.categories,
                incomes: remoteUserData?.incomes || this.db.incomes,
            };
            this.db = { ...mergedUserData, settings: remoteSettingsData?.settings || this.db.settings };
            
            // If user had no data on remote, mark their current local data to be pushed up
            if (!remoteUserData) {
                userDataToPersist = mergedUserData;
            }
        } else {
            // No user logged in, just load global settings
            this.db.settings = remoteSettingsData?.settings || this.db.settings;
        }

        this.saveLocal();
        this.notifyAll();
        
        // After syncing, check if we need to create initial records on remote
        if (!remoteSettingsData) {
            console.log("No remote settings found. Creating initial record.");
            this.updateSettings(this.db.settings); // This will persist the default/local settings
        }
        if (userDataToPersist) {
            console.log("No remote user data found. Creating initial record for user.");
            this.persistRemote(); // This will persist the local/mock data for the new user
        }

        this.lastSyncTime = new Date();
        this.setSyncStatus('synced');

    } catch (e) { this.handleSyncError(); }
  }


  private handleSyncError() {
    this.setSyncStatus('error');
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = window.setTimeout(() => this.syncWithRemote(), RETRY_DELAY);
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
            const { settings, ...userData } = this.db;
            await fetch(`/api/db?identifier=${encodeURIComponent(this.currentUserIdentifier!)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            this.lastSyncTime = new Date();
            this.setSyncStatus('synced');
        } catch (e) { this.handleSyncError(); }
    }, 2000);
  }

  private notifyAll() {
    (['users', 'groups', 'accounts', 'categories', 'incomes', 'settings'] as CollectionKey[]).forEach(k => this.notify(k));
  }

  private notify<K extends CollectionKey>(k: K) {
    const callbacks = this.listeners[k];
    if (callbacks) {
      const data = this.db[k];
      const copy = Array.isArray(data) ? [...data] : { ...data };
      callbacks.forEach(cb => cb(copy));
    }
  }

  public subscribe<K extends CollectionKey>(k: K, cb: ListenerCallback<Db[K]>) {
    if (!this.listeners[k]) this.listeners[k] = [];
    this.listeners[k]!.push(cb);
    const data = this.db[k];
    const copy = Array.isArray(data) ? [...data] : { ...data };
    cb(copy as Db[K]);
    return () => {
      this.listeners[k] = this.listeners[k]!.filter(c => c !== cb);
    };
  }

  public forceSync() { this.syncWithRemote(); }
  public getCurrentUserIdentifier() { return this.currentUserIdentifier; }

  public getSettings = () => this.db.settings || { appName: 'TATU.' };
  public updateSettings = async (settings: AppSettings) => {
    this.db.settings = settings;
    this.notify('settings');
    this.saveLocal();
    
    // Persist settings remotely immediately, no debounce
    this.setSyncStatus('syncing');
    try {
        const settingsPayload = { settings };
        await fetch(`/api/db?identifier=${GLOBAL_SETTINGS_IDENTIFIER}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsPayload)
        });
        this.lastSyncTime = new Date();
        this.setSyncStatus('synced');
    } catch (e) {
        this.handleSyncError();
    }
  }

  public getAccounts = () => this.db.accounts;
  public updateAccount = async (acc: Account) => { this.db.accounts = this.db.accounts.map(a => a.id === acc.id ? acc : a); this.notify('accounts'); this.saveLocal(); this.persistRemote(); }
  public addAccount = async (acc: Account) => { this.db.accounts = [...this.db.accounts, acc]; this.notify('accounts'); this.saveLocal(); this.persistRemote(); }
  public deleteAccount = async (id: string) => { this.db.accounts = this.db.accounts.filter(a => a.id !== id); this.notify('accounts'); this.saveLocal(); this.persistRemote(); }

  // Fix: Added updateMultipleAccounts method to handle batch updates
  public updateMultipleAccounts = async (accs: Account[]) => {
    const accsMap = new Map(accs.map(a => [a.id, a]));
    this.db.accounts = this.db.accounts.map(a => accsMap.has(a.id) ? accsMap.get(a.id)! : a);
    this.notify('accounts');
    this.saveLocal();
    this.persistRemote();
  }

  public getUsers = () => this.db.users;
  public addUser = async (u: Omit<User, 'id'>) => { const newUser = { ...u, id: `user-${Date.now()}` } as User; this.db.users = [...this.db.users, newUser]; this.notify('users'); this.saveLocal(); this.persistRemote(); return newUser; }
  public updateUser = async (u: User) => { this.db.users = this.db.users.map(old => old.id === u.id ? u : old); this.notify('users'); this.saveLocal(); this.persistRemote(); return u; }
  public deleteUser = async (id: string) => { this.db.users = this.db.users.filter(u => u.id !== id); this.notify('users'); this.saveLocal(); this.persistRemote(); }

  public getGroups = () => this.db.groups;
  public addGroup = async (g: Omit<Group, 'id'>) => { const newGroup = { ...g, id: `group-${Date.now()}` } as Group; this.db.groups = [...this.db.groups, newGroup]; this.notify('groups'); this.saveLocal(); this.persistRemote(); return newGroup; }
  public updateGroup = async (g: Group) => { this.db.groups = this.db.groups.map(old => old.id === g.id ? g : old); this.notify('groups'); this.saveLocal(); this.persistRemote(); return g; }
  public deleteGroup = async (id: string) => { this.db.groups = this.db.groups.filter(g => g.id !== id); this.notify('groups'); this.saveLocal(); this.persistRemote(); }
  
  public getIncomes = () => this.db.incomes;
  public addIncome = async (i: Income) => { this.db.incomes = [...this.db.incomes, i]; this.notify('incomes'); this.saveLocal(); this.persistRemote(); }
  public updateIncome = async (inc: Income) => { this.db.incomes = this.db.incomes.map(i => i.id === inc.id ? inc : i); this.notify('incomes'); this.saveLocal(); this.persistRemote(); return inc; }
  public deleteIncome = async (id: string) => { this.db.incomes = this.db.incomes.filter(i => i.id !== id); this.notify('incomes'); this.saveLocal(); this.persistRemote(); }

  public getCategories = () => this.db.categories;
  public saveCategories = async (cats: string[]) => { this.db.categories = cats; this.notify('categories'); this.saveLocal(); this.persistRemote(); }

  public exportData = () => this.db;
  public importData = (data: Db) => {
    this.db = data;
    this.notifyAll();
    this.saveLocal();
    
    // Persist imported data to remote
    const { settings, ...userData } = data;
    if (this.currentUserIdentifier) {
        fetch(`/api/db?identifier=${encodeURIComponent(this.currentUserIdentifier)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
    }
    fetch(`/api/db?identifier=${GLOBAL_SETTINGS_IDENTIFIER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
    });
  }
}

export default new RealtimeService();