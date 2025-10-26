
import { Role, AccountStatus, type User, type Group, type Account, type Income } from '../types';

const today = new Date();
const lastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
lastMonth.setDate(lastMonth.getDate() - 15); // middle of last month
const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 10);


export const MOCK_GROUPS: Group[] = [
  { id: 'group-1', name: 'Família Silva' },
  { id: 'group-2', name: 'República Coders' },
  { id: 'group-3', name: 'Família Tatu' },
];

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Henrique', username: 'henrique', password: 'admin', role: Role.ADMIN, groupId: 'group-1' },
  { id: 'user-2', name: 'João Silva', username: 'joao', password: '123', role: Role.USER, groupId: 'group-1' },
  { id: 'user-3', name: 'Maria Dev', username: 'maria', password: '123', role: Role.USER, groupId: 'group-2' },
  { id: 'user-4', name: 'Jessica', username: 'jessica', password: '12345', role: Role.USER, groupId: 'group-3' },
];

export const MOCK_ACCOUNTS: Account[] = [
  // Accounts for Jessica in Group 3, based on the provided image
  { id: 'acc-j1', groupId: 'group-3', name: 'Loja100 + Tomarello', category: 'Outros', value: 526.35, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
  { id: 'acc-j2', groupId: 'group-3', name: 'Celular', category: 'Outros', value: 347.71, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
  { id: 'acc-j3', groupId: 'group-3', name: 'Unimed', category: 'Manuela', value: 348.69, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
  { id: 'acc-j4', groupId: 'group-3', name: 'Van', category: 'Manuela', value: 310.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
  { id: 'acc-j5', groupId: 'group-3', name: 'Academia', category: 'Outros', value: 196.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
  { id: 'acc-j6', groupId: 'group-3', name: 'Cartão', category: 'Cartão', value: 2118.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
  { id: 'acc-j7', groupId: 'group-3', name: 'Master', category: 'Internet', value: 85.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
  { id: 'acc-j8', groupId: 'group-3', name: 'Copasa', category: 'Água', value: 162.18, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
  { id: 'acc-j9', groupId: 'group-3', name: 'Cemig', category: 'Luz', value: 178.41, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: new Date('2025-10-23T12:00:00Z').toISOString() },
];

export const MOCK_INCOMES: Income[] = [
  { id: 'inc-1', groupId: 'group-3', name: 'Salário Principal', value: 7500, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-2', groupId: 'group-3', name: 'Vale Alimentação', value: 800, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-3', groupId: 'group-1', name: 'Salário Maria', value: 4500, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-4', groupId: 'group-2', name: 'Freelance', value: 1200, date: twoMonthsAgo.toISOString(), isRecurrent: false },
];

export const ACCOUNT_CATEGORIES = ['Moradia', 'Utilidades', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Eletrônicos', 'Outros', 'Manuela', 'Cartão', 'Internet', 'Água', 'Luz'];