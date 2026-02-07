
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';
import MonthPicker from './MonthPicker';

const VARIABLE_CATEGORIES = ['💧 Água', '💡 Luz', '💳 Cartão'];
const isVariableExpense = (acc: Partial<Account>) => {
    if (!acc) return false;
    const nameMatch = acc.name?.toLowerCase().includes('cartão');
    const categoryMatch = acc.category && (VARIABLE_CATEGORIES.includes(acc.category) || acc.category.includes('Água') || acc.category.includes('Luz'));
    return nameMatch || categoryMatch;
};

interface DashboardProps {
  accounts: Account[];
  incomes: Income[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onToggleStatus: (accountId: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onOpenBatchModal: () => void;
  currentUser: User | null;
  onOpenMoveModal: () => void;
  categories: string[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; isMain?: boolean; colorClass?: string }> = ({ title, value, icon, isMain = false, colorClass = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isMain ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/15' : 'bg-surface dark:bg-dark-surface border border-slate-100 dark:border-slate-800 shadow-sm'} p-4 rounded-[2rem] relative overflow-hidden group transition-all hover:translate-y-[-3px] active:scale-[0.98] cursor-default`}
    >
        <div className={`flex items-center text-[9px] font-black uppercase tracking-[0.2em] ${isMain ? 'text-indigo-100' : 'text-slate-400'}`}>
            <span className={`p-1.5 rounded-xl bg-current/10 mr-2 ${!isMain ? colorClass : ''}`}>{icon}</span>
            <span>{title}</span>
        </div>
        <p className={`mt-2 text-xl font-black tracking-tighter truncate ${isMain ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {value}
        </p>
    </motion.div>
);

const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, onEditAccount, onDeleteAccount, onToggleStatus, selectedDate, setSelectedDate, currentUser, onOpenMoveModal, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterRecurrent, setFilterRecurrent] = useState(false);
  const [filterInstallment, setFilterInstallment] = useState(false);
  
  const safeDate = useMemo(() => {
    return selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
  }, [selectedDate]);

  const currentMonthAccounts = useMemo(() => {
    const selectedYear = safeDate.getFullYear();
    const selectedMonth = safeDate.getMonth();
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    
    const snapshots = accounts.filter(acc => acc.paymentDate?.startsWith(monthKey));
    const orphanAccounts = accounts.filter(acc => !acc.paymentDate && !acc.isRecurrent && !acc.isInstallment);

    const recurrentTemplates = accounts.filter(acc => 
        acc.isRecurrent && 
        !acc.paymentDate &&
        !snapshots.some(s => s.name === acc.name && s.category === acc.category)
    ).map(acc => {
        if (isVariableExpense(acc)) return { ...acc, value: 0 };
        return acc;
    });

    const projectedInstallments: Account[] = [];
    const seriesAnchors = new Map<string, Account>();
    accounts.forEach(acc => {
        if (acc.isInstallment && acc.paymentDate) {
            const anchorKey = acc.installmentId || `legacy-${acc.name}-${acc.groupId}`;
            const current = seriesAnchors.get(anchorKey);
            if (!current || new Date(acc.paymentDate) > new Date(current.paymentDate!)) {
                seriesAnchors.set(anchorKey, acc);
            }
        }
    });

    seriesAnchors.forEach((acc) => {
        const startDate = new Date(acc.paymentDate!);
        const monthDiff = (selectedYear - startDate.getFullYear()) * 12 + (selectedMonth - startDate.getMonth());

        if (monthDiff > 0) {
            const currentInst = Number(acc.currentInstallment || 1);
            const targetInstallment = currentInst + monthDiff;
            
            const seriesMatch = (a: Account) => 
                (acc.installmentId && a.installmentId === acc.installmentId) || 
                (!acc.installmentId && a.name === acc.name && a.groupId === acc.groupId);

            const maxTotalInSeries = Math.max(
                Number(acc.totalInstallments || 0),
                ...accounts.filter(seriesMatch).map(a => Number(a.totalInstallments || 0))
            );

            if (targetInstallment <= maxTotalInSeries) {
                const alreadyHasSnapshot = snapshots.some(s => 
                    (acc.installmentId && s.installmentId === acc.installmentId && Number(s.currentInstallment) === targetInstallment) ||
                    (!acc.installmentId && s.name === acc.name && Number(s.currentInstallment) === targetInstallment)
                );

                if (!alreadyHasSnapshot) {
                    projectedInstallments.push({
                        ...acc,
                        id: `projected-${acc.id}-${monthKey}`,
                        currentInstallment: targetInstallment,
                        totalInstallments: maxTotalInSeries,
                        status: AccountStatus.PENDING,
                        paymentDate: undefined 
                    });
                }
            }
        }
    });

    return [...snapshots, ...orphanAccounts, ...recurrentTemplates, ...projectedInstallments]
        .filter(acc => {
            const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'ALL' || acc.status === filterStatus;
            const matchesCategory = filterCategory === 'ALL' || acc.category === filterCategory;
            const matchesRecurrent = !filterRecurrent || acc.isRecurrent;
            const matchesInstallment = !filterInstallment || acc.isInstallment;
            return matchesSearch && matchesStatus && matchesCategory && matchesRecurrent && matchesInstallment;
        })
        .sort((a, b) => {
            if (a.status !== b.status) return a.status === AccountStatus.PENDING ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
  }, [accounts, safeDate, searchTerm, filterStatus, filterCategory, filterRecurrent, filterInstallment]);

  const stats = useMemo(() => {
    const m = safeDate.getMonth();
    const y = safeDate.getFullYear();
    const totalIncome = incomes
        .filter(inc => {
            const d = new Date(inc.date);
            return d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((sum, inc) => sum + inc.value, 0);
    const paid = currentMonthAccounts
        .filter(acc => acc.status === AccountStatus.PAID)
        .reduce((sum, acc) => sum + acc.value, 0);
    const pending = currentMonthAccounts
        .filter(acc => acc.status === AccountStatus.PENDING)
        .reduce((sum, acc) => sum + acc.value, 0);
    return { totalIncome, paid, pending, balance: totalIncome - (paid + pending) };
  }, [currentMonthAccounts, incomes, safeDate]);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-5 animate-fade-in-up max-w-7xl mx-auto py-1">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-4 sm:px-0">
            <div>
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.25em] mb-0.5">Visão Geral</p>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                Finanças<span className="text-indigo-600">.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <MonthPicker selectedDate={safeDate} onSelectDate={setSelectedDate} />
                <button onClick={onOpenMoveModal} className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95" title="Mover Contas">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>
            </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 sm:px-0">
            <StatCard title="Disponível" value={formatCurrency(stats.balance)} isMain={true} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="A Pagar" value={formatCurrency(stats.pending)} colorClass="text-rose-500" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="Renda" value={formatCurrency(stats.totalIncome)} colorClass="text-emerald-500" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 11l5-5m0 0l5 5m-5-5v12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="Pagas" value={formatCurrency(stats.paid)} colorClass="text-slate-400" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
        </section>

        <div className="grid grid-cols-1 gap-5 pb-24 px-4 sm:px-0">
            <div className="space-y-5">
                <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <SearchBar 
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
                        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        filterRecurrent={filterRecurrent} setFilterRecurrent={setFilterRecurrent}
                        filterInstallment={filterInstallment} setFilterInstallment={setFilterInstallment}
                        categories={categories}
                    />
                </div>
                
                <motion.div 
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {currentMonthAccounts.map(acc => (
                            <AccountCard 
                                key={acc.id} 
                                account={acc} 
                                onEdit={onEditAccount} 
                                onDelete={onDeleteAccount} 
                                onToggleStatus={onToggleStatus} 
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
                
                {currentMonthAccounts.length === 0 && (
                    <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-900/10 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nada por aqui</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
export default Dashboard;
