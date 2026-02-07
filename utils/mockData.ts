
import { Role, AccountStatus, type User, type Group, type Account, type Income } from '../types';

const today = new Date();
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 10);

export const ACCOUNT_CATEGORIES: string[] = [
    '🏠 Moradia',
    '🍱 Alimentação',
    '🚗 Transporte',
    '🏥 Saúde',
    '🎮 Lazer',
    '🎓 Educação',
    '🌐 Internet',
    '💳 Cartão',
    '💡 Luz',
    '💧 Água',
    '🧸 Manuela',
    '📦 Outros',
].sort((a, b) => a.localeCompare(b));


export const MOCK_GROUPS: Group[] = [
  { id: 'group-1', name: 'Família Silva', password: 'silva' },
  { id: 'group-2', name: 'República Coders', password: 'coders' },
  { id: 'group-3', name: 'Família Tatu', password: 'tatu' },
];

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Henrique', username: 'henrique', password: 'admin9860', role: Role.ADMIN, groupIds: ['group-1', 'group-3'] },
  { id: 'user-2', name: 'João Silva', username: 'joao', password: '123', role: Role.USER, groupIds: ['group-1'] },
  { id: 'user-3', name: 'Maria Dev', username: 'maria', password: '123', role: Role.USER, groupIds: ['group-2'] },
  { id: 'user-4', name: 'Jessica', username: 'jessica', password: '12345', role: Role.USER, groupIds: ['group-3'] },
  { id: 'user-5', name: 'Admin', username: 'admin', password: 'admin', role: Role.ADMIN, groupIds: ['group-1', 'group-2', 'group-3'] },
];

export const MOCK_ACCOUNTS: Account[] = [
  // --- Group 1: Família Silva ---
  { id: 'acc-s1', groupId: 'group-1', name: 'Aluguel', category: '🏠 Moradia', value: 1800.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-s2', groupId: 'group-1', name: 'Supermercado', category: '🍱 Alimentação', value: 950.50, status: AccountStatus.PAID, isRecurrent: false, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-s3', groupId: 'group-1', name: 'Conta de Luz', category: '💡 Luz', value: 210.70, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  
  // --- Group 3: Família Tatu ---
  { id: 'acc-j1', groupId: 'group-3', name: 'Loja100 + Tomarello', category: '📦 Outros', value: 526.35, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j3', groupId: 'group-3', name: 'Unimed', category: '🧸 Manuela', value: 348.69, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j6', groupId: 'group-3', name: 'Cartão', category: '💳 Cartão', value: 0.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-j9', groupId: 'group-3', name: 'Cemig', category: '💡 Luz', value: 0.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-j10', groupId: 'group-3', name: 'Copasa', category: '💧 Água', value: 0.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
];

export const MOCK_INCOMES: Income[] = [
  { id: 'inc-s1', groupId: 'group-1', name: 'Salário Henrique', value: 6500, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-j1', groupId: 'group-3', name: 'Salário Jessica', value: 7500, date: lastMonth.toISOString(), isRecurrent: true },
];
