import { Account, Income, AccountStatus } from '../types';

let accountsCache: Account[] = [];
let incomesCache: Income[] = [];

type Listener = () => void;
const listeners: { accounts: Listener[], incomes: Listener[] } = { accounts: [], incomes: [] };

export const subscribe = (collection: 'accounts' | 'incomes', callback: Listener) => {
    listeners[collection].push(callback);
    return () => { listeners[collection] = listeners[collection].filter(cb => cb !== callback); };
};

const notify = (collection: 'accounts' | 'incomes') => {
    listeners[collection].forEach(cb => cb());
};

export const getCachedAccounts = () => accountsCache;
export const getCachedIncomes = () => incomesCache;

function mapAccountFromDB(row: any): Account {
    return {
        id: row.id,
        name: row.name,
        value: parseFloat(row.amount),
        category: row.category,
        paymentDate: row.due_date,
        status: row.status as AccountStatus,
        isRecurrent: row.type === 'recurring',
        isInstallment: row.type === 'installment',
        currentInstallment: row.installment_current || undefined,
        totalInstallments: row.installment_total || undefined,
        installmentId: row.installment_id || undefined,
    };
}

function mapAccountToDB(acc: Partial<Account>): any {
    return {
        id: acc.id,
        name: acc.name,
        amount: acc.value,
        due_date: acc.paymentDate,
        category: acc.category,
        status: acc.status || 'PENDING',
        type: acc.isInstallment ? 'installment' : acc.isRecurrent ? 'recurring' : 'single',
        installment_current: acc.currentInstallment || null,
        installment_total: acc.totalInstallments || null,
        installment_id: acc.installmentId || null
    };
}

function mapIncomeFromDB(row: any): Income {
    return {
        id: row.id,
        name: row.name,
        value: parseFloat(row.amount),
        category: row.category || '',
        date: row.date,
        isRecurrent: false
    };
}

function mapIncomeToDB(inc: Partial<Income>): any {
    return {
        id: inc.id,
        name: inc.name,
        amount: inc.value,
        date: inc.date,
        category: inc.category || null
    };
}

export const fetchAccounts = async (): Promise<Account[]> => {
    const response = await fetch('/api/accounts');
    if (!response.ok) return [];
    const data = await response.json();
    accountsCache = (data || []).map(mapAccountFromDB);
    notify('accounts');
    return accountsCache;
};

export const createAccount = async (account: Account): Promise<void> => {
    accountsCache.push(account); notify('accounts');
    await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapAccountToDB(account))
    });
    fetchAccounts();
};

export const updateAccount = async (account: Account): Promise<void> => {
    accountsCache = accountsCache.map(a => a.id === account.id ? account : a); notify('accounts');
    await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapAccountToDB(account))
    });
    fetchAccounts();
};

export const deleteAccount = async (id: string): Promise<void> => {
    accountsCache = accountsCache.filter(a => a.id !== id); notify('accounts');
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    fetchAccounts();
};

export const fetchIncomes = async (): Promise<Income[]> => {
    const response = await fetch('/api/incomes');
    if (!response.ok) return [];
    const data = await response.json();
    incomesCache = (data || []).map(mapIncomeFromDB);
    notify('incomes');
    return incomesCache;
};

export const createIncome = async (income: Income): Promise<void> => {
    incomesCache.push(income); notify('incomes');
    await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapIncomeToDB(income))
    });
    fetchIncomes();
};

export const updateIncome = async (income: Income): Promise<void> => {
    incomesCache = incomesCache.map(i => i.id === income.id ? income : i); notify('incomes');
    await fetch(`/api/incomes/${income.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapIncomeToDB(income))
    });
    fetchIncomes();
};

export const deleteIncome = async (id: string): Promise<void> => {
    incomesCache = incomesCache.filter(i => i.id !== id); notify('incomes');
    await fetch(`/api/incomes/${id}`, { method: 'DELETE' });
    fetchIncomes();
};

export const runMigration = async (accounts: Account[], incomes: Income[]): Promise<void> => {
    try {
        await fetch('/api/migration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accounts: accounts.map(mapAccountToDB),
                incomes: incomes.map(mapIncomeToDB)
            })
        });
    } catch (e) {
        console.error('Migration failed', e);
    }
};

let syncListener: (isSyncing: boolean) => void = () => {};
export const setSyncListener = (cb: (isSyncing: boolean) => void) => { syncListener = cb; };

export const pollData = async () => {
    syncListener(true);
    await Promise.all([fetchAccounts(), fetchIncomes()]);
    syncListener(false);
};
