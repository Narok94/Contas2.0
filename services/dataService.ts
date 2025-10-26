import { Role, AccountStatus, type User, type Group, type Account, type Income } from '../types';
import { MOCK_USERS, MOCK_GROUPS, MOCK_ACCOUNTS, ACCOUNT_CATEGORIES, MOCK_INCOMES } from '../utils/mockData';

// --- Helper Functions ---

const DB_KEYS = {
    USERS: 'app_users',
    GROUPS: 'app_groups',
    ACCOUNTS: 'app_accounts',
    CATEGORIES: 'app_categories',
    INCOMES: 'app_incomes',
};

// Simula chamadas de API assíncronas
const simulateApiCall = <T>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), 50));
};

const initializeDatabase = () => {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(MOCK_USERS));
        localStorage.setItem(DB_KEYS.GROUPS, JSON.stringify(MOCK_GROUPS));
        localStorage.setItem(DB_KEYS.ACCOUNTS, JSON.stringify(MOCK_ACCOUNTS));
        localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(ACCOUNT_CATEGORIES));
        localStorage.setItem(DB_KEYS.INCOMES, JSON.stringify(MOCK_INCOMES));
    }
};

initializeDatabase();

const getData = <T>(key: string): T => {
    const data = localStorage.getItem(key);
    if (!data) {
        if (key === DB_KEYS.USERS) return MOCK_USERS as any;
        if (key === DB_KEYS.GROUPS) return MOCK_GROUPS as any;
        if (key === DB_KEYS.ACCOUNTS) return MOCK_ACCOUNTS as any;
        if (key === DB_KEYS.CATEGORIES) return ACCOUNT_CATEGORIES as any;
        if (key === DB_KEYS.INCOMES) return MOCK_INCOMES as any;
        return [] as any;
    }
    return JSON.parse(data);
};

const saveData = <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- API ---

// Users
export const getUsers = (): Promise<User[]> => simulateApiCall(getData<User[]>(DB_KEYS.USERS));
export const updateUser = async (updatedUser: User): Promise<User> => {
    const users = await getUsers();
    const newUsers = users.map(u => (u.id === updatedUser.id ? updatedUser : u));
    saveData(DB_KEYS.USERS, newUsers);
    return simulateApiCall(updatedUser);
};
export const addUser = async (newUser: Omit<User, 'id'>): Promise<User> => {
    const users = await getUsers();
    const userWithId = { ...newUser, id: `user-${Date.now()}` };
    const newUsers = [...users, userWithId];
    saveData(DB_KEYS.USERS, newUsers);
    return simulateApiCall(userWithId);
};
export const deleteUser = async (userId: string): Promise<{ success: true }> => {
    const users = await getUsers();
    const newUsers = users.filter(u => u.id !== userId);
    saveData(DB_KEYS.USERS, newUsers);
    return simulateApiCall({ success: true });
};

// Groups
export const getGroups = (): Promise<Group[]> => simulateApiCall(getData<Group[]>(DB_KEYS.GROUPS));
export const updateGroup = async (updatedGroup: Group): Promise<Group> => {
    const groups = await getGroups();
    const newGroups = groups.map(g => (g.id === updatedGroup.id ? updatedGroup : g));
    saveData(DB_KEYS.GROUPS, newGroups);
    return simulateApiCall(updatedGroup);
};
export const addGroup = async (newGroup: Omit<Group, 'id'>): Promise<Group> => {
    const groups = await getGroups();
    const groupWithId = { ...newGroup, id: `group-${Date.now()}` };
    const newGroups = [...groups, groupWithId];
    saveData(DB_KEYS.GROUPS, newGroups);
    return simulateApiCall(groupWithId);
};
export const deleteGroup = async (groupId: string): Promise<{ success: true }> => {
    const groups = await getGroups();
    const newGroups = groups.filter(g => g.id !== groupId);
    saveData(DB_KEYS.GROUPS, newGroups);
    return simulateApiCall({ success: true });
};

// Accounts
export const getAccounts = (): Promise<Account[]> => simulateApiCall(getData<Account[]>(DB_KEYS.ACCOUNTS));
export const updateAccount = async (updatedAccount: Account): Promise<Account> => {
    const accounts = await getAccounts();
    const newAccounts = accounts.map(a => (a.id === updatedAccount.id ? updatedAccount : a));
    saveData(DB_KEYS.ACCOUNTS, newAccounts);
    return simulateApiCall(updatedAccount);
};
export const addAccount = async (newAccount: Account): Promise<Account> => {
    const accounts = await getAccounts();
    const newAccounts = [...accounts, newAccount];
    saveData(DB_KEYS.ACCOUNTS, newAccounts);
    return simulateApiCall(newAccount);
};
export const deleteAccount = async (accountId: string): Promise<{ success: true }> => {
    const accounts = await getAccounts();
    const newAccounts = accounts.filter(a => a.id !== accountId);
    saveData(DB_KEYS.ACCOUNTS, newAccounts);
    return simulateApiCall({ success: true });
};
export const updateMultipleAccounts = async (updatedAccounts: Account[]): Promise<Account[]> => {
    saveData(DB_KEYS.ACCOUNTS, updatedAccounts);
    return simulateApiCall(updatedAccounts);
};


// Incomes
export const getIncomes = (): Promise<Income[]> => simulateApiCall(getData<Income[]>(DB_KEYS.INCOMES));
export const updateIncome = async (updatedIncome: Income): Promise<Income> => {
    const incomes = await getIncomes();
    const newIncomes = incomes.map(i => (i.id === updatedIncome.id ? updatedIncome : i));
    saveData(DB_KEYS.INCOMES, newIncomes);
    return simulateApiCall(updatedIncome);
};
export const addIncome = async (newIncome: Income): Promise<Income> => {
    const incomes = await getIncomes();
    const newIncomes = [...incomes, newIncome];
    saveData(DB_KEYS.INCOMES, newIncomes);
    return simulateApiCall(newIncome);
};
export const deleteIncome = async (incomeId: string): Promise<{ success: true }> => {
    const incomes = await getIncomes();
    const newIncomes = incomes.filter(i => i.id !== incomeId);
    saveData(DB_KEYS.INCOMES, newIncomes);
    return simulateApiCall({ success: true });
};


// Categories
export const getCategories = (): Promise<string[]> => simulateApiCall(getData<string[]>(DB_KEYS.CATEGORIES));
export const saveCategories = async (categories: string[]): Promise<string[]> => {
    saveData(DB_KEYS.CATEGORIES, categories);
    return simulateApiCall(categories);
}

// Data Import/Export
export const exportData = async () => {
    const users = await getUsers();
    const groups = await getGroups();
    const accounts = await getAccounts();
    const categories = await getCategories();
    const incomes = await getIncomes();
    return { users, groups, accounts, categories, incomes };
};

export const importData = async (data: { users: User[], groups: Group[], accounts: Account[], categories: string[], incomes: Income[] }) => {
    saveData(DB_KEYS.USERS, data.users);
    saveData(DB_KEYS.GROUPS, data.groups);
    saveData(DB_KEYS.ACCOUNTS, data.accounts);
    saveData(DB_KEYS.CATEGORIES, data.categories);
    saveData(DB_KEYS.INCOMES, data.incomes);
    return simulateApiCall({ success: true });
};
