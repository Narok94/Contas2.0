
import { MOCK_USERS, MOCK_GROUPS, MOCK_ACCOUNTS, ACCOUNT_CATEGORIES, MOCK_INCOMES } from '../utils/mockData';
import { User, Group, Account, Income, AppSettings, AccountStatus } from '../types';

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
    this.ensureJessicaCustomAccounts();
    this.init();
    window.addEventListener('storage', this.handleCrossTabSync);
  }

  private ensureJessicaCustomAccounts() {
    const customSpecs = [
      { name: 'Pet love', value: 133.79, category: '📦 Outros', type: 'installment', current: 2, total: 2 },
      { name: 'Época', value: 74.88, category: '📦 Outros', type: 'installment', current: 6, total: 8 },
      { name: 'Centauro', value: 99.99, category: '📦 Outros', type: 'installment', current: 7, total: 10 },
      { name: 'Stanley', value: 22.80, category: '📦 Outros', type: 'installment', current: 7, total: 10 },
      { name: 'Celular Jessica', value: 323.81, category: '📦 Outros', type: 'installment', current: 17, total: 21 },
      { name: 'Farmácia', value: 60.13, category: '🏥 Saúde', type: 'installment', current: 2, total: 3 },
      { name: 'Disney', value: 46.90, category: '🎮 Lazer', type: 'recurrent' },
      { name: 'Academia Jessica', value: 129.90, category: '🏥 Saúde', type: 'recurrent' },
      { name: 'Havan', value: 29.99, category: '📦 Outros', type: 'installment', current: 9, total: 10 },
      { name: 'Compras bh', value: 242.40, category: '🍱 Alimentação', type: 'installment', current: 3, total: 3 },
      { name: 'Farmácia minas master', value: 39.50, category: '🏥 Saúde', type: 'installment', current: 1, total: 2 },
      { name: 'Big sup', value: 55.00, category: '🍱 Alimentação', type: 'installment', current: 1, total: 2 },
      { name: 'Loja 61', value: 81.68, category: '📦 Outros', type: 'installment', current: 1, total: 3 },
      { name: 'Farmácia minas master 2', value: 63.28, category: '🏥 Saúde', type: 'installment', current: 1, total: 3 },
      { name: 'Dragaria americana', value: 64.52, category: '🏥 Saúde', type: 'installment', current: 1, total: 3 },
      { name: 'Araújo', value: 88.00, category: '🏥 Saúde', type: 'installment', current: 1, total: 3 }
    ];

    const targetGroup = 'jessica-personal'; 
    const hasPetLove = this.db.accounts.some(a => a.groupId === targetGroup && a.name.toLowerCase() === 'pet love');

    if (!hasPetLove) {
      console.log('[RealtimeService] Restaurando contas perdidas da Jessica...');
      
      const namesToFilter = customSpecs.map(s => s.name.toLowerCase());
      
      let filteredAccounts = this.db.accounts.filter(a => {
        if (a.groupId === targetGroup) {
          const lowerName = a.name.toLowerCase();
          return !namesToFilter.some(filterName => lowerName === filterName);
        }
        return true;
      });

      const newAccounts: Account[] = [];

      customSpecs.forEach(spec => {
        if (spec.type === 'installment') {
          const installmentId = `series-${spec.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          
          for (let i = 1; i <= spec.total!; i++) {
            // Se "current" era o status em Junho (mês 5), então mês de pagamento inicial é 5 - current + 1
            // Vamos apenas adicionar as parcelas e ajustar o status
            const isPaid = i < spec.current!;
            const monthOffset = i - spec.current!;
            // Set payment date correctly (Junho é mês 5). Mês atual é julho (6), então vamos adicionar + 1 no monthOffset ou manter Junho (5) como a parcela atual
            const paymentDate = new Date(2026, 5 + monthOffset, 15, 12, 0, 0);

            newAccounts.push({
              id: `acc-${spec.name.toLowerCase().replace(/\s+/g, '-')}-${i}`,
              groupId: targetGroup,
              name: spec.name,
              category: spec.category,
              value: spec.value,
              status: isPaid ? AccountStatus.PAID : AccountStatus.PENDING,
              isRecurrent: false,
              isInstallment: true,
              currentInstallment: i,
              totalInstallments: spec.total!,
              installmentId: installmentId,
              paymentDate: paymentDate.toISOString()
            });
          }
        } else if (spec.type === 'recurrent') {
          newAccounts.push({
            id: `acc-${spec.name.toLowerCase().replace(/\s+/g, '-')}-template`,
            groupId: targetGroup,
            name: spec.name,
            category: spec.category,
            value: spec.value,
            status: AccountStatus.PENDING,
            isRecurrent: true,
            isInstallment: false
          });
        }
      });

      this.db.accounts = [...filteredAccounts, ...newAccounts];
      this.saveLocal();
    }
  }

  private loadAndArmorData(): Db {
    const defaultSettings: AppSettings = { appName: 'TATU.' };
    let recoveredAccounts: Account[] = [];
    let recoveredIncomes: Income[] = [];
    let recoveredUsers: User[] = [];
    let recoveredGroups: Group[] = [];
    let recoveredSettings: AppSettings = defaultSettings;
    let recoveredCategories: string[] = ACCOUNT_CATEGORIES;

    [DB_MAIN_KEY, DB_BACKUP_KEY, ...LEGACY_KEYS].forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            const data = parsed.db || parsed;
            
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

    const db = {
      users: recoveredUsers.length ? recoveredUsers : MOCK_USERS,
      groups: recoveredGroups.length ? recoveredGroups : MOCK_GROUPS,
      accounts: recoveredAccounts.length ? recoveredAccounts : (hasAnyData ? [] : MOCK_ACCOUNTS),
      categories: recoveredCategories,
      incomes: recoveredIncomes.length ? recoveredIncomes : (hasAnyData ? [] : MOCK_INCOMES),
      settings: recoveredSettings,
    };

    db.accounts = db.accounts.map(a => this.normalizeAccount(a));

    return db;
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
    localStorage.setItem(DB_BACKUP_KEY, payload);
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
    this.setSyncStatus('synced');
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
    // No remote sync
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

  // BLINDAGEM: Normalização forçada de tipos em todas as operações de escrita
  private normalizeAccount(acc: Account): Account {
      return {
          ...acc,
          id: acc.id || `acc-recovered-${Date.now()}-${Math.random()}`,
          value: Number(acc.value) || 0,
          totalInstallments: acc.totalInstallments ? Number(acc.totalInstallments) : undefined,
          currentInstallment: acc.currentInstallment ? Number(acc.currentInstallment) : undefined,
          isRecurrent: Boolean(acc.isRecurrent),
          isInstallment: Boolean(acc.isInstallment)
      };
  }

  public updateAccount = async (acc: Account) => { 
      const normalized = this.normalizeAccount(acc);
      this.db.accounts = this.db.accounts.map(a => a.id === normalized.id ? normalized : a); 
      this.notify('accounts'); this.saveLocal(); this.persistRemote(); 
  }

  public updateAccountAndSeries = async (acc: Account) => {
      const normalized = this.normalizeAccount(acc);
      const updatedTotal = normalized.totalInstallments || 0;

      if (normalized.isInstallment && normalized.installmentId) {
          this.db.accounts = this.db.accounts.map(a => {
              if (a.installmentId === normalized.installmentId) {
                  return { 
                      ...a, 
                      name: normalized.name, 
                      totalInstallments: updatedTotal,
                      category: normalized.category,
                      value: a.id === normalized.id ? normalized.value : a.value 
                  };
              }
              return a.id === normalized.id ? normalized : a;
          });
      } else {
          this.db.accounts = this.db.accounts.map(a => a.id === normalized.id ? normalized : a);
      }
      this.notify('accounts'); this.saveLocal(); this.persistRemote();
  }

  public addAccount = async (acc: Account) => { 
      const normalized = this.normalizeAccount(acc);
      this.db.accounts = [...this.db.accounts, normalized]; 
      this.notify('accounts'); this.saveLocal(); this.persistRemote(); 
  }
  
  public deleteAccount = async (id: string) => { this.db.accounts = this.db.accounts.filter(a => a.id !== id); this.notify('accounts'); this.saveLocal(); this.persistRemote(); }
  public updateMultipleAccounts = async (accs: Account[]) => {
    const accsMap = new Map(accs.map(a => [a.id, this.normalizeAccount(a)]));
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
  }

  public exportData = () => this.db;
  public importData = (data: Partial<Db> | any) => { 
      const parsedData = data.db || data;
      this.db = {
          users: parsedData.users || this.db.users,
          groups: parsedData.groups || this.db.groups,
          accounts: (parsedData.accounts || this.db.accounts).map((a: Account) => this.normalizeAccount(a)),
          incomes: parsedData.incomes || this.db.incomes,
          categories: parsedData.categories || this.db.categories,
          settings: parsedData.settings || this.db.settings
      };
      this.notifyAll(); 
      this.saveLocal(); 
      this.persistRemote(); 
  }
}

export default new RealtimeService();
