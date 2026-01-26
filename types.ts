
export type View = 'login' | 'register' | 'dashboard' | 'admin' | 'history' | 'income' | 'groupSelection';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum AccountStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // Plaintext for this mock app
  role: Role;
  groupIds: string[];
  mustChangePassword?: boolean;
}

export interface Group {
  id:string;
  name: string;
  password?: string;
}

export interface Account {
  id: string;
  groupId: string;
  name: string;
  category: string;
  value: number;
  status: AccountStatus;
  isRecurrent: boolean;
  isInstallment: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
  installmentId?: string; // To group installments together
  paymentDate?: string; // ISO string date
}

export interface Income {
  id: string;
  groupId: string;
  name: string;
  value: number;
  date: string; // ISO string date for when it was received
  isRecurrent: boolean;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

// Added Goal interface to fix the import error in GoalTracker.tsx
export interface Goal {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
}