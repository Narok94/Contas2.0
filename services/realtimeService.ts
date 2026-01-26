
import { MOCK_USERS, MOCK_GROUPS, MOCK_ACCOUNTS, ACCOUNT_CATEGORIES, MOCK_INCOMES } from '../utils/mockData';
import { User, Group, Account, Income } from '../types';

type CollectionKey = 'users' | 'groups' | 'accounts' | 'categories' | 'incomes';

type Db = {
  users: User[];
  groups: Group[];
  accounts: Account[];
  categories: string[];
  incomes: Income[];
};

type ListenerCallback<T> = (data: T) => void;

const DB_STORAGE_KEY = 'ricka_local_db_v2';

class RealtimeService {
  private db: Db;
  private listeners: { [K in CollectionKey]?: ListenerCallback<Db[K]>[] } = {};
  private currentUserIdentifier: string | null = null;

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

  private init() {
    const userStr = sessionStorage.getItem('app_currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserIdentifier = user.username;
    }
    this.notifyAll();
  }

  public setUser(username: string) {
    this.currentUserIdentifier = username;
  }

  private handleCrossTabSync = (e: StorageEvent) => {
    if (e.key === DB_STORAGE_KEY && e.newValue) {
      try {
        this.db = JSON.parse(e.newValue).db;
        this.notifyAll();
      } catch (err) {}
    }
  }

  private saveLocal() {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify({ db: this.db, timestamp: Date.now() }));
  }

  private notifyAll() {
    (Object.keys(this.db) as CollectionKey[]).forEach(k => this.notify(k));
  }

  private notify<K extends CollectionKey>(k: K) {
    const callbacks = this.listeners[k] as any[] | undefined;
    if (callbacks) callbacks.forEach(cb => cb(this.db[k]));
  }

  public subscribe<K extends CollectionKey>(k: K, cb: ListenerCallback<Db[K]>) {
    if (!this.listeners[k]) {
      (this.listeners as any)[k] = [];
    }
    const currentListeners = this.listeners[k] as any[];
    currentListeners.push(cb);
    cb(this.db[k]);
  }

  public unsubscribe<K extends CollectionKey>(k: K, cb: ListenerCallback<Db[K]>) {
    if (this.listeners[k]) {
      const currentListeners = this.listeners[k] as any[];
      (this.listeners as any)[k] = currentListeners.filter(c => c !== cb);
    }
  }

  public getCurrentUserIdentifier() {
    return this.currentUserIdentifier;
  }

  private async write() {
    this.saveLocal();
  }

  public getAccounts = () => this.db.accounts;
  public updateAccount = async (acc: Account) => {
    this.db.accounts = this.db.accounts.map(a => a.id === acc.id ? acc : a);
    this.notify('accounts');
    this.write();
  }
  public addAccount = async (acc: Account) => {
    this.db.accounts.push(acc);
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
    this.db.users.push(newUser);
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
    this.db.groups.push(newGroup);
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
    this.db.incomes.push(i);
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
