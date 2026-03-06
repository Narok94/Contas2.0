
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';
import MonthPicker from './MonthPicker';
import FloatingCalculator from './FloatingCalculator';

const VARIABLE_CATEGORIES = ['💧 Água', '💡 Luz', '💳 Cartão'];
const isVariableExpense = (acc: Partial<Account>) => {
    if (!acc) return false;
    const nameMatch = acc.name?.toLowerCase().includes('cartão');
    const categoryMatch = acc.category && (VARIABLE_CATEGORIES.includes(acc.category) || acc.category.includes('Água') || acc.category.includes('Luz'));
    return nameMatch || categoryMatch;
};

interface AccountsViewProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onToggleStatus: (account: Account) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onOpenMoveModal: () => void;
  categories: string[];
}

const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onEditAccount, onDeleteAccount, onToggleStatus, selectedDate, setSelectedDate, onOpenMoveModal, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterRecurrent, setFilterRecurrent] = useState(false);
  const [filterInstallment, setFilterInstallment] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
  const safeDate = useMemo(() => {
    return selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
  }, [selectedDate]);

  const currentMonthAccounts = useMemo(() => {
    const selectedYear = safeDate.getFullYear();
    const selectedMonth = safeDate.getMonth();
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    
    const physicalRecords = accounts.filter(acc => acc.paymentDate?.startsWith(monthKey));
    const orphanAccounts = accounts.filter(acc => !acc.paymentDate && !acc.isRecurrent && !acc.isInstallment);

    const recurrentTemplates = accounts.filter(acc => 
        acc.isRecurrent && 
        !acc.paymentDate &&
        !physicalRecords.some(p => p.name === acc.name && p.category === acc.category)
    ).map(acc => {
        if (isVariableExpense(acc)) return { ...acc, value: 0 };
        return acc;
    });

    const projectedInstallments: Account[] = [];
    const seriesAnchors = new Map<string, Account>();
    
    accounts.forEach(acc => {
        if (acc.isInstallment && acc.paymentDate) {
            const anchorKey = acc.installmentId || `legacy-${acc.name}`;
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
            
            const maxTotalInSeries = Math.max(
                Number(acc.totalInstallments || 0),
                ...accounts.filter(a => a.installmentId === acc.installmentId).map(a => Number(a.totalInstallments || 0))
            );

            if (targetInstallment <= maxTotalInSeries) {
                const alreadyExists = physicalRecords.some(p => 
                    p.installmentId === acc.installmentId && 
                    Number(p.currentInstallment) === targetInstallment
                );

                if (!alreadyExists) {
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

    return [...physicalRecords, ...orphanAccounts, ...recurrentTemplates, ...projectedInstallments]
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

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in-up max-w-7xl mx-auto py-1">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-2 sm:px-0">
            <div>
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.25em] mb-0.5">Gestão de Pagamentos</p>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                Minhas Contas<span className="text-indigo-600">.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <MonthPicker selectedDate={safeDate} onSelectDate={setSelectedDate} />
                <button onClick={onOpenMoveModal} className="p-2 rounded-xl bg-white dark:bg-dark-surface border-2 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95" title="Mover Contas">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 gap-4 pb-24 px-2 sm:px-0">
            <div className="space-y-4">
                <div className="bg-slate-50/50 dark:bg-slate-900/40 p-2 sm:p-3 rounded-2xl sm:rounded-[2rem] border-2 border-slate-200 dark:border-slate-700">
                    <SearchBar 
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
                        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        filterRecurrent={filterRecurrent} setFilterRecurrent={setFilterRecurrent}
                        filterInstallment={filterInstallment} setFilterInstallment={setFilterInstallment}
                        onOpenCalculator={() => setIsCalculatorOpen(true)}
                        categories={categories}
                    />
                </div>
                
                <FloatingCalculator 
                    isOpen={isCalculatorOpen} 
                    onClose={() => setIsCalculatorOpen(false)} 
                />
                
                <motion.div 
                    layout
                    className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4"
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
                    <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-900/10 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nada por aqui</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AccountsView;
