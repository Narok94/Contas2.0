import { Role, AccountStatus, type User, type Group, type Account, type Income } from '../types';

const today = new Date();
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);

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
  { id: 'jessica-personal', name: 'Controle de Contas' },
];

export const MOCK_USERS: User[] = [
  { id: 'user-4', name: 'Jéssica', username: 'jessica', password: '123', role: Role.USER, groupIds: ['jessica-personal'] },
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc-pai', groupId: 'jessica-personal', name: 'PAI', category: '📦 Outros', value: 648.90, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-mae', groupId: 'jessica-personal', name: 'MÃE', category: '📦 Outros', value: 150.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-cartao-caixa', groupId: 'jessica-personal', name: 'CARTÃO CAIXA', category: '💳 Cartão', value: 200.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-celular-unimed', groupId: 'jessica-personal', name: 'CELULAR+ UNIMED', category: '🏥 Saúde', value: 470.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-agua', groupId: 'jessica-personal', name: 'AGUA', category: '💧 Água', value: 160.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-luz', groupId: 'jessica-personal', name: 'LUZ', category: '💡 Luz', value: 0.00, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
  { id: 'acc-internet', groupId: 'jessica-personal', name: 'INTERNET', category: '🌐 Internet', value: 89.90, status: AccountStatus.PENDING, isRecurrent: true, isInstallment: false },
];

export const MOCK_INCOMES: Income[] = [
  { id: 'inc-j1', groupId: 'jessica-personal', name: 'Salário Jéssica', value: 7500, date: lastMonth.toISOString(), isRecurrent: true },
];
