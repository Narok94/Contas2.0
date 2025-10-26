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

class RealtimeService {
  private db: Db = {
    users: MOCK_USERS,
    groups: MOCK_GROUPS,
    accounts: MOCK_ACCOUNTS,
    categories: ACCOUNT_CATEGORIES,
    incomes: MOCK_INCOMES,
  };

  private listeners: { [K in CollectionKey]?: ListenerCallback<Db[K]>[] } = {};

  private simulateApiCall<T>(data: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(data), 50));
  }

  private notify<K extends CollectionKey>(collection: K) {
    const data = this.db[collection];
    // FIX: TypeScript cannot correlate the generic key `K` with the correct listener array type.
    // Casting `this.listeners[collection]` to the specific type `ListenerCallback<Db[K]>[]` resolves this.
    const listeners = this.listeners[collection] as ListenerCallback<Db[K]>[] | undefined;
    (listeners || []).forEach(callback => callback(data));
  }

  subscribe<K extends CollectionKey>(collection: K, callback: ListenerCallback<Db[K]>) {
    if (!this.listeners[collection]) {
      this.listeners[collection] = [];
    }
    // FIX: This is the error reported. The issue is that `push` on a union of array types is not safe.
    // Casting to the specific array type `ListenerCallback<Db[K]>[]` makes it safe.
    (this.listeners[collection] as ListenerCallback<Db[K]>[]).push(callback);
    // Immediately provide the current data to the new subscriber
    callback(this.db[collection]);
  }
  
  unsubscribe<K extends CollectionKey>(collection: K, callback: ListenerCallback<Db[K]>) {
    if (this.listeners[collection]) {
      // FIX: Similar to `subscribe`, we need to cast to the specific array type for `filter`.
      const listeners = this.listeners[collection] as ListenerCallback<Db[K]>[];
      // The assignment is also problematic, so we cast the target to `any` as a workaround for the indexed access limitation.
      (this.listeners as any)[collection] = listeners.filter(cb => cb !== callback);
    }
  }

  // --- API Methods ---
  
  // Users
  getUsers = () => this.simulateApiCall(this.db.users);
  updateUser = async (updatedUser: User) => {
    this.db.users = this.db.users.map(u => (u.id === updatedUser.id ? updatedUser : u));
    this.notify('users');
    return this.simulateApiCall(updatedUser);
  };
  addUser = async (newUser: Omit<User, 'id'>) => {
    const userWithId = { ...newUser, id: `user-${Date.now()}` };
    this.db.users.push(userWithId);
    this.notify('users');
    return this.simulateApiCall(userWithId);
  };
  deleteUser = async (userId: string) => {
    this.db.users = this.db.users.filter(u => u.id !== userId);
    this.notify('users');
    return this.simulateApiCall({ success: true });
  };

  // Groups
  getGroups = () => this.simulateApiCall(this.db.groups);
  updateGroup = async (updatedGroup: Group) => {
    this.db.groups = this.db.groups.map(g => (g.id === updatedGroup.id ? updatedGroup : g));
    this.notify('groups');
    return this.simulateApiCall(updatedGroup);
  };
  addGroup = async (newGroup: Omit<Group, 'id'>) => {
    const groupWithId = { ...newGroup, id: `group-${Date.now()}` };
    this.db.groups.push(groupWithId);
    this.notify('groups');
    return this.simulateApiCall(groupWithId);
  };
  deleteGroup = async (groupId: string) => {
    this.db.groups = this.db.groups.filter(g => g.id !== groupId);
    this.notify('groups');
    return this.simulateApiCall({ success: true });
  };
  
  // Accounts
  getAccounts = () => this.simulateApiCall(this.db.accounts);
  updateAccount = async (updatedAccount: Account) => {
    this.db.accounts = this.db.accounts.map(a => (a.id === updatedAccount.id ? updatedAccount : a));
    this.notify('accounts');
    return this.simulateApiCall(updatedAccount);
  };
  addAccount = async (newAccount: Account) => {
    this.db.accounts.push(newAccount);
    this.notify('accounts');
    return this.simulateApiCall(newAccount);
  };
  deleteAccount = async (accountId: string) => {
    this.db.accounts = this.db.accounts.filter(a => a.id !== accountId);
    this.notify('accounts');
    return this.simulateApiCall({ success: true });
  };
  updateMultipleAccounts = async (allAccounts: Account[]) => {
      this.db.accounts = allAccounts;
      this.notify('accounts');
      return this.simulateApiCall(allAccounts);
  };

  // Incomes
  getIncomes = () => this.simulateApiCall(this.db.incomes);
  updateIncome = async (updatedIncome: Income) => {
    this.db.incomes = this.db.incomes.map(i => (i.id === updatedIncome.id ? updatedIncome : i));
    this.notify('incomes');
    return this.simulateApiCall(updatedIncome);
  };
  addIncome = async (newIncome: Income) => {
    this.db.incomes.push(newIncome);
    this.notify('incomes');
    return this.simulateApiCall(newIncome);
  };
  deleteIncome = async (incomeId: string) => {
    this.db.incomes = this.db.incomes.filter(i => i.id !== incomeId);
    this.notify('incomes');
    return this.simulateApiCall({ success: true });
  };
  
  // Categories
  getCategories = () => this.simulateApiCall(this.db.categories);
  saveCategories = async (categories: string[]) => {
    this.db.categories = categories;
    this.notify('categories');
    return this.simulateApiCall(categories);
  }
  
  // Data Import/Export (these can bypass the realtime updates and just replace the whole DB)
  exportData = async () => {
    return this.simulateApiCall(this.db);
  };

  importData = async (data: Db) => {
    this.db = data;
    // Notify all listeners about the massive change
    (Object.keys(this.listeners) as CollectionKey[]).forEach(collection => {
      this.notify(collection);
    });
    return this.simulateApiCall({ success: true });
  };
}

const realtimeService = new RealtimeService();
export default realtimeService;
