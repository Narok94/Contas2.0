
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User, type Goal } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';
import MonthPicker from './MonthPicker';

interface DashboardProps {
  accounts: Account[];
  incomes: Income[];
  goals?: Goal[];
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

const VARIABLE_UTILITIES = ['Água', 'Luz', 'Internet'];

const SummaryItem: React.FC<{ title: string; value: string; icon: React.ReactNode; valueColor?: string; isMain?: boolean }> = ({ title, value, icon, valueColor = 'text-text-primary dark:text-dark-text-primary', isMain = false }) => (
    <motion.div
        className={`${isMain ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-glow-primary' : 'bg-surface dark:bg-dark-surface'} p-5 rounded-[2rem] border border-border-color/50 dark:border-dark-border-color/50 relative overflow-hidden group`}
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    >
        {!isMain && <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>}
        <div className={`flex items-center text-xs font-bold uppercase tracking-widest ${isMain ? 'text-white/80' : 'text-text-secondary dark:text-dark-text-secondary'}`}>
            {icon}
            <span className="ml-2">{title}</span>
        </div>
        <p className={`mt-2 text-2xl font-black truncate ${isMain ? 'text-white' : valueColor}`}>
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
    return selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date(2026, 0, 1);
  }, [selectedDate]);

  const accountsForMonth = useMemo(() => {
    const selectedYear = safeDate.getFullYear();
    const selectedMonth = safeDate.getMonth();
    
    const monthlyAccountMap = new Map<string, Account>();

    for (const account of accounts) {
      const isVariableUtility = VARIABLE_UTILITIES.includes(account.category) && account.isRecurrent;
      
      if (account.isRecurrent || (account.paymentDate && new Date(account.paymentDate).getFullYear() === selectedYear && new Date(account.paymentDate).getMonth() === selectedMonth)) {
        let status = account.status;
        let paymentDate = account.paymentDate;
        let displayValue = account.value;

        const paidInSelectedMonth = account.status === AccountStatus.PAID && paymentDate && new Date(paymentDate).getFullYear() === selectedYear && new Date(paymentDate).getMonth() === selectedMonth;

        if (account.isRecurrent && !paidInSelectedMonth) {
          status = AccountStatus.PENDING;
          paymentDate = undefined;
          // Se for uma utilidade variável e não estiver paga neste mês, forçamos o valor para 0 na exibição
          if (isVariableUtility) {
            displayValue = 0;
          }
        }
        
        // Priorizamos o registro pago do mês se houver duplicata por causa da recorrência
        if (!monthlyAccountMap.has(account.id) || paidInSelectedMonth) {
           monthlyAccountMap.set(account.id, { ...account, status, paymentDate, value: displayValue });
        }
      } else if (account.status === AccountStatus.PENDING) {
         // Mantém contas pendentes de meses anteriores visíveis
         monthlyAccountMap.set(account.id, account);
      }
    }
    return Array.from(monthlyAccountMap.values()).filter(acc => {
       if (acc.status === AccountStatus.PAID && acc.paymentDate) {
         const d = new Date(acc.paymentDate);
         return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
       }
       return true;
    });
  }, [accounts, safeDate]);
  
  const filteredAccountsForDisplay = useMemo(() => {
    return accountsForMonth
      .filter(acc => {
        const matchesStatus = filterStatus === 'ALL' || acc.status === filterStatus;
        const matchesSearch = searchTerm === '' || acc.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || acc.category === filterCategory;
        const matchesRecurrent = !filterRecurrent || acc.isRecurrent;
        const matchesInstallment = !filterInstallment || acc.isInstallment;
        
        return matchesStatus && matchesSearch && matchesCategory && matchesRecurrent && matchesInstallment;
      })
      .sort((a, b) => {
        if (a.status === AccountStatus.PENDING && b.status !== AccountStatus.PENDING) return -1;
        if (a.status !== AccountStatus.PENDING && b.status === AccountStatus.PENDING) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [accountsForMonth, searchTerm, filterStatus, filterCategory, filterRecurrent, filterInstallment]);
  
  const stats = useMemo(() => {
    const selectedMonth = safeDate.getMonth();
    const selectedYear = safeDate.getFullYear();

    const monthIncomes = incomes.filter(inc => {
        const incomeDate = new Date(inc.date);
        return incomeDate.getMonth() === selectedMonth && incomeDate.getFullYear() === selectedYear;
    });
    const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.value, 0);

    const paidInMonthValue = accountsForMonth
        .filter(acc => acc.status === AccountStatus.PAID)
        .reduce((sum, acc) => sum + acc.value, 0);

    const balance = totalIncome - paidInMonthValue;
    
    const pendingInMonth = accountsForMonth
        .filter(acc => acc.status === AccountStatus.PENDING)
        .reduce((sum, acc) => sum + acc.value, 0);

    return {
        totalIncome,
        paidThisMonth: paidInMonthValue,
        balance,
        pending: pendingInMonth,
    };
  }, [incomes, safeDate, accountsForMonth]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-end px-1 mb-2">
            <div>
              <p className="text-text-secondary dark:text-dark-text-secondary font-medium text-sm">Bem-vindo de volta,</p>
              <h1 className="text-3xl font-black text-text-primary dark:text-dark-text-primary leading-tight">{currentUser?.name?.split(' ')[0]}! 👋</h1>
            </div>
        </motion.div>
        
        {/* Sumário Financeiro */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryItem
                title="Saldo Livre"
                value={formatCurrency(stats.balance)}
                isMain={true}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m12 0V6a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 6v3" /></svg>}
            />
            <SummaryItem
                title="A Pagar"
                value={formatCurrency(stats.pending)}
                valueColor="text-danger"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <SummaryItem
                title="Rendas"
                value={formatCurrency(stats.totalIncome)}
                valueColor="text-success"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>}
            />
            <SummaryItem
                title="Já Pago"
                value={formatCurrency(stats.paidThisMonth)}
                valueColor="text-text-primary"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>}
            />
        </div>

        <div className="space-y-6 pb-10">
            {/* Seção de Contas com Seletor de Mês Integrado */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                    <div className="flex items-center gap-3">
                         <h2 className="text-xl font-black text-text-primary dark:text-dark-text-primary tracking-tight">Contas do Mês</h2>
                         <MonthPicker selectedDate={safeDate} onSelectDate={setSelectedDate} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onOpenMoveModal}
                            className="p-2 rounded-xl bg-surface-light dark:bg-dark-surface-light hover:bg-white dark:hover:bg-dark-surface shadow-sm transition-all text-text-secondary border border-border-color/30"
                            title="Mover contas entre meses"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="bg-surface/60 dark:bg-dark-surface/60 p-2 sm:p-3 rounded-2xl border border-border-color/50 dark:border-dark-border-color/50 backdrop-blur-md">
                    <SearchBar 
                        searchTerm={searchTerm} 
                        setSearchTerm={setSearchTerm} 
                        filterStatus={filterStatus} 
                        setFilterStatus={setFilterStatus}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        filterRecurrent={filterRecurrent}
                        setFilterRecurrent={setFilterRecurrent}
                        filterInstallment={filterInstallment}
                        setFilterInstallment={setFilterInstallment}
                        categories={categories}
                    />
                </div>

                {/* Grid otimizado */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredAccountsForDisplay.map(acc => (
                        <motion.div
                            key={acc.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            layout
                            className="h-full"
                        >
                            <AccountCard account={acc} onEdit={onEditAccount} onDelete={onDeleteAccount} onToggleStatus={onToggleStatus} />
                        </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredAccountsForDisplay.length === 0 && (
                    <div className="py-20 text-center bg-surface/30 dark:bg-dark-surface/30 rounded-[2.5rem] border-2 border-dashed border-border-color dark:border-dark-border-color">
                        <p className="text-text-muted italic">Nenhuma conta encontrada para os filtros aplicados.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
