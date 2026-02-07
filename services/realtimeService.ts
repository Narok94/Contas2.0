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

// BLINDAGEM MÁXIMA: Chaves de redundância e legado
const DB_MAIN_KEY = 'tatu_v4_main_db';
const DB_BACKUP_KEY = 'tatu_emergency_backup';
const LEGACY_KEYS = ['ricka_local_db_v3', 'ricka_local_db_v2', 'ricka_local_db', 'app_db', 'tatu_db', 'tatu_v4_main_db'];
const GLOBAL_SETTINGS_IDENTIFIER = 'tatu_global_settings_v1';

class RealtimeService {
  private db: Db;
  private listeners: { [K in CollectionKey]?: ListenerCallback<any>[] } = {};
  private syncListeners: SyncStatusCallback[] = [];
  private currentSyncStatus: SyncStatus = 'local';
  private currentUserIdentifier: string | null = null;
  private lastSyncTime: Date | undefined = undefined;
  private syncDebounceTimer: number | null = null;

  constructor() {
    this.db = this.loadAndArmorData();
    this.init();
    window.addEventListener('storage', this.handleCrossTabSync);
  }

  private loadAndArmorData(): Db {
    const defaultSettings: AppSettings = { appName: 'TATU.' };
    
    // Objeto temporário para acumular tudo que for encontrado
    let recoveredAccounts: Account[] = [];
    let recoveredIncomes: Income[] = [];
    let recoveredUsers: User[] = [];
    let recoveredGroups: Group[] = [];
    let recoveredSettings: AppSettings = defaultSettings;
    let recoveredCategories: string[] = ACCOUNT_CATEGORIES;

    // VARREDURA TOTAL: Busca em todas as chaves possíveis já usadas no passado
    [DB_MAIN_KEY, DB_BACKUP_KEY, ...LEGACY_KEYS].forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            const data = parsed.db || parsed;
            
            // Mesclagem Unificadora (Garante que IDs únicos não se repitam mas todos sejam mantidos)
            if (data.accounts) {
                data.accounts.forEach((acc: Account) => {
                    if (!recoveredAccounts.find(a => a.id === acc.id)) recoveredAccounts.push(acc);
                });
            }
            if (data.incomes) {
                data.incomes.forEach((inc: Income) => {
                    if (!recoveredIncomes.find(i => i.id === inc.id)) recoveredIncomes.push(inc);
                });
            }
            if (data.users) {
                data.users.forEach((u: User) => {
                    if (!recoveredUsers.find(user => user.id === u.id)) recoveredUsers.push(u);
                });
            }
            if (data.groups) {
                data.groups.forEach((g: Group) => {
                    if (!recoveredGroups.find(group => group.id === g.id)) recoveredGroups.push(g);
                });
            }
            if (data.settings) recoveredSettings = { ...recoveredSettings, ...data.settings };
            if (data.categories?.length) recoveredCategories = Array.from(new Set([...recoveredCategories, ...data.categories]));
            
        } catch (e) { console.warn(`Erro ao ler chave ${key}`); }
    });

    const hasAnyData = recoveredAccounts.length > 0 || recoveredIncomes.length > 0;

    return {
      users: recoveredUsers.length ? recoveredUsers : MOCK_USERS,
      groups: recoveredGroups.length ? recoveredGroups : MOCK_GROUPS,
      accounts: recoveredAccounts.length ? recoveredAccounts : (hasAnyData ? [] : MOCK_ACCOUNTS),
      categories: recoveredCategories,
      incomes: recoveredIncomes.length ? recoveredIncomes : (hasAnyData ? [] : MOCK_INCOMES),
      settings: recoveredSettings,
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

  private saveLocal() {
    const payload = JSON.stringify({ db: this.db, timestamp: Date.now() });
    localStorage.setItem(DB_MAIN_KEY, payload);
    localStorage.setItem(DB_BACKUP_KEY, payload); // Redundância física
  }

  public setUser(username: string) {
    if (this.currentUserIdentifier !== username) {
      this.currentUserIdentifier = username;
      if (username) this.syncWithRemote();
      else this.setSyncStatus('local');
    }
  }

  private handleCrossTabSync = (e: StorageEvent) => {
    if ((e.key === DB_MAIN_KEY || e.key === DB_BACKUP_KEY) && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        this.db = parsed.db || parsed;
        this.notifyAll();
      } catch (err) {}
    }
  }

  public async syncWithRemote() {
    if (this.currentSyncStatus === 'syncing') return;
    this.setSyncStatus('syncing');

    try {
        const settingsRes = await fetch(`/api/db?identifier=${GLOBAL_SETTINGS_IDENTIFIER}`);
        const remoteSettingsData = settingsRes.ok ? await settingsRes.json() : null;

        if (this.currentUserIdentifier) {
            const userRes = await fetch(`/api/db?identifier=${encodeURIComponent(this.currentUserIdentifier)}`);
            const remoteUserData = userRes.ok ? await userRes.json() : null;
            
            if (remoteUserData) {
                this.db = { 
                    ...remoteUserData, 
                    settings: remoteSettingsData?.settings || this.db.settings 
                };
            }
        }
        this.saveLocal();
        this.notifyAll();
        this.lastSyncTime = new Date();
        this.setSyncStatus('synced');
    } catch (e) { this.setSyncStatus('error'); }
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
        } catch (e) { this.setSyncStatus('error'); }
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
    cb(this.db[k] as Db[K]);
    return () => { this.listeners[k] = this.listeners[k]!.filter(c => c !== cb); };
  }

  public forceSync() { this.syncWithRemote(); }
  public getCurrentUserIdentifier() { return this.currentUserIdentifier; }
  public getSettings = () => this.db.settings;
  public getAccounts = () => this.db.accounts;
  public getIncomes = () => this.db.incomes;
  public getCategories = () => this.db.categories;
  public getUsers = () => this.db.users;
  public getGroups = () => this.db.groups;

  public updateAccount = async (acc: Account) => { this.db.accounts = this.db.accounts.map(a => a.id === acc.id ? acc : a); this.notify('accounts'); this.saveLocal(); this.persistRemote(); }
  public addAccount = async (acc: Account) => { this.db.accounts = [...this.db.accounts, acc]; this.notify('accounts'); this.saveLocal(); this.persistRemote(); }
  public deleteAccount = async (id: string) => { this.db.accounts = this.db.accounts.filter(a => a.id !== id); this.notify('accounts'); this.saveLocal(); this.persistRemote(); }
  public updateMultipleAccounts = async (accs: Account[]) => {
    const accsMap = new Map(accs.map(a => [a.id, a]));
    this.db.accounts = this.db.accounts.map(a => accsMap.has(a.id) ? accsMap.get(a.id)! : a);
    this.notify('accounts'); this.saveLocal(); this.persistRemote();
  }

  public addUser = async (u: Omit<User, 'id'>) => { const newUser = { ...u, id: `user-${Date.now()}` } as User; this.db.users = [...this.db.users, newUser]; this.notify('users'); this.saveLocal(); this.persistRemote(); return newUser; }
  public updateUser = async (u: User) => { this.db.users = this.db.users.map(old => old.id === u.id ? u : old); this.notify('users'); this.saveLocal(); this.persistRemote(); return u; }
  public deleteUser = async (id: string) => { this.db.users = this.db.users.filter(u => u.id !== id); this.notify('users'); this.saveLocal(); this.persistRemote(); }

  public addGroup = async (g: Omit<Group, 'id'>) => { const newGroup = { ...g, id: `group-${Date.now()}` } as Group; this.db.groups = [...this.db.groups, newGroup]; this.notify('groups'); this.saveLocal(); this.persistRemote(); return newGroup; }
  public updateGroup = async (g: Group) => { this.db.groups = this.db.groups.map(old => old.id === g.id ? g : old); this.notify('groups'); this.saveLocal(); this.persistRemote(); return g; }
  public deleteGroup = async (id: string) => { this.db.groups = this.db.groups.filter(g => g.id !== id); this.notify('groups'); this.saveLocal(); this.persistRemote(); }
  
  public addIncome = async (i: Income) => { this.db.incomes = [...this.db.incomes, i]; this.notify('incomes'); this.saveLocal(); this.persistRemote(); }
  public updateIncome = async (inc: Income) => { this.db.incomes = this.db.incomes.map(i => i.id === inc.id ? inc : i); this.notify('incomes'); this.saveLocal(); this.persistRemote(); return inc; }
  public deleteIncome = async (id: string) => { this.db.incomes = this.db.incomes.filter(i => i.id !== id); this.notify('incomes'); this.saveLocal(); this.persistRemote(); }

  public saveCategories = async (cats: string[]) => { this.db.categories = cats; this.notify('categories'); this.saveLocal(); this.persistRemote(); }
  public updateSettings = async (settings: AppSettings) => { 
    this.db.settings = settings; this.notify('settings'); this.saveLocal(); 
    try {
        await fetch(`/api/db?identifier=${GLOBAL_SETTINGS_IDENTIFIER}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });
    } catch (e) {}
  }

  public exportData = () => this.db;
  public importData = (data: Db) => { this.db = data; this.notifyAll(); this.saveLocal(); this.persistRemote(); }
}

export default new RealtimeService();