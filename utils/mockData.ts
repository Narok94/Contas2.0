
import { Role, AccountStatus, type User, type Group, type Account, type Income } from '../types';

const today = new Date();
const lastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
lastMonth.setDate(lastMonth.getDate() - 15); // middle of last month
const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 10);


export const MOCK_GROUPS: Group[] = [
  { id: 'group-1', name: 'Família Silva' },
  { id: 'group-2', name: 'República Coders' },
];

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Henrique', username: 'henrique', password: 'admin', role: Role.ADMIN, groupId: 'group-1' },
  { id: 'user-2', name: 'João Silva', username: 'joao', password: '123', role: Role.USER, groupId: 'group-1' },
  { id: 'user-3', name: 'Maria Dev', username: 'maria', password: '123', role: Role.USER, groupId: 'group-2' },
];

export const MOCK_ACCOUNTS: Account[] = [
  // Group 1 Accounts
  { id: 'acc-1', groupId: 'group-1', name: 'Aluguel', category: 'Moradia', value: 1500, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-2', groupId: 'group-1', name: 'Internet', category: 'Utilidades', value: 99.90, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-3', groupId: 'group-1', name: 'Supermercado', category: 'Alimentação', value: 750.50, status: AccountStatus.PAID, isRecurrent: false, isInstallment: false, paymentDate: today.toISOString() },
  { id: 'acc-4', groupId: 'group-1', name: 'Netflix', category: 'Lazer', value: 39.90, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-x', groupId: 'group-1', name: 'Cinema', category: 'Lazer', value: 80.00, status: AccountStatus.PAID, isRecurrent: false, isInstallment: false, paymentDate: lastMonth.toISOString() },
  
  // Group 2 Accounts
  { id: 'acc-5', groupId: 'group-2', name: 'Conta de Luz', category: 'Moradia', value: 250, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-6', groupId: 'group-2', name: 'Pizza Night', category: 'Alimentação', value: 120, status: AccountStatus.PAID, isRecurrent: false, isInstallment: false, paymentDate: twoMonthsAgo.toISOString() },
  { id: 'acc-7', groupId: 'group-2', name: 'PS5 Parcela', category: 'Eletrônicos', value: 450, status: AccountStatus.PENDING, isRecurrent: false, isInstallment: true, totalInstallments: 12, currentInstallment: 3, installmentId: 'ps5-install' },
  { id: 'acc-y', groupId: 'group-2', name: 'Curso Online', category: 'Educação', value: 300, status: AccountStatus.PAID, isRecurrent: false, isInstallment: false, paymentDate: lastMonth.toISOString() },
];

export const MOCK_INCOMES: Income[] = [
  { id: 'inc-1', groupId: 'group-1', name: 'Salário Henrique', value: 5000, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-2', groupId: 'group-1', name: 'Vale Alimentação', value: 800, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-3', groupId: 'group-2', name: 'Salário Maria', value: 4500, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-4', groupId: 'group-2', name: 'Freelance', value: 1200, date: twoMonthsAgo.toISOString(), isRecurrent: false },
];

export const ACCOUNT_CATEGORIES = ['Moradia', 'Utilidades', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Eletrônicos', 'Outros'];