

import { Role, AccountStatus, type User, type Group, type Account, type Income } from '../types';

const today = new Date();
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 10);

export const ACCOUNT_CATEGORIES: string[] = [
    'Moradia',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Lazer',
    'Educação',
    'Internet',
    'Cartão',
    'Luz',
    'Água',
    'Manuela', // Specific category from original data
    'Outros',
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
  // --- Group 1: Família Silva (for Admin view) ---
  { id: 'acc-s1', groupId: 'group-1', name: 'Aluguel', category: 'Moradia', value: 1800.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-s2', groupId: 'group-1', name: 'Supermercado', category: 'Alimentação', value: 950.50, status: AccountStatus.PAID, isRecurrent: false, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-s3', groupId: 'group-1', name: 'Conta de Luz', category: 'Luz', value: 210.70, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-s4', groupId: 'group-1', name: 'Internet', category: 'Internet', value: 99.90, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-s5', groupId: 'group-1', name: 'Escola das Crianças', category: 'Educação', value: 1200.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },


  // --- Group 2: República Coders (for Admin view) ---
  { id: 'acc-c1', groupId: 'group-2', name: 'Aluguel Apto', category: 'Moradia', value: 2500.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-c2', groupId: 'group-2', name: 'Energia', category: 'Luz', value: 150.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-c3', groupId: 'group-2', name: 'Compras do Mês', category: 'Alimentação', value: 1100.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-c4', groupId: 'group-2', name: 'Netflix', category: 'Lazer', value: 55.90, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-c5', groupId: 'group-2', name: 'Curso Online', category: 'Educação', value: 350.00, status: AccountStatus.PENDING, isRecurrent: false, isInstallment: true, currentInstallment: 2, totalInstallments: 6, installmentId: 'curso-udemy-123' },


  // --- Group 3: Família Tatu (Original data for Jessica, with corrected dates) ---
  { id: 'acc-j1', groupId: 'group-3', name: 'Loja100 + Tomarello', category: 'Outros', value: 526.35, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j2', groupId: 'group-3', name: 'Celular', category: 'Outros', value: 347.71, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j3', groupId: 'group-3', name: 'Unimed', category: 'Manuela', value: 348.69, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j4', groupId: 'group-3', name: 'Van', category: 'Manuela', value: 310.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j5', groupId: 'group-3', name: 'Academia', category: 'Outros', value: 196.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j6', groupId: 'group-3', name: 'Cartão', category: 'Cartão', value: 2118.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j7', groupId: 'group-3', name: 'Master', category: 'Internet', value: 85.00, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j8', groupId: 'group-3', name: 'Copasa', category: 'Água', value: 162.18, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
  { id: 'acc-j9', groupId: 'group-3', name: 'Cemig', category: 'Luz', value: 178.41, status: AccountStatus.PAID, isRecurrent: true, isInstallment: false, paymentDate: lastMonth.toISOString() },
];


export const MOCK_INCOMES: Income[] = [
  // --- Group 1: Família Silva ---
  { id: 'inc-s1', groupId: 'group-1', name: 'Salário Henrique', value: 6500, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-s2', groupId: 'group-1', name: 'Salário João', value: 4200, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-s3', groupId: 'group-1', name: 'Bônus Henrique', value: 1500, date: twoMonthsAgo.toISOString(), isRecurrent: false },

  // --- Group 2: República Coders ---
  { id: 'inc-c1', groupId: 'group-2', name: 'Salário Maria', value: 8000, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-c2', groupId: 'group-2', name: 'Projeto Freelance', value: 2300, date: lastMonth.toISOString(), isRecurrent: false },
  
  // --- Group 3: Família Tatu ---
  { id: 'inc-j1', groupId: 'group-3', name: 'Salário Jessica', value: 7500, date: lastMonth.toISOString(), isRecurrent: true },
  { id: 'inc-j2', groupId: 'group-3', name: 'Vale Alimentação', value: 800, date: lastMonth.toISOString(), isRecurrent: true },
];
