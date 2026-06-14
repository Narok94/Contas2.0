
export type View = 'login' | 'dashboard' | 'accounts' | 'income';

export enum AccountStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface AppSettings {
  appName: string;
  logoUrl?: string;
  whatsappEnabled?: boolean;
  whatsappGroupLink?: string;
}

export interface Account {
  id: string;
  name: string;
  category: string;
  value: number;
  status: AccountStatus;
  isRecurrent: boolean;
  isInstallment: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
  totalValue?: number;
  installmentId?: string;
  paymentDate?: string; // ISO string date
}

export interface Income {
  id: string;
  name: string;
  value: number;
  date: string; // ISO string date for when it was received
  isRecurrent: boolean; // Keep for compatibility if needed
}

export interface Goal {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
}