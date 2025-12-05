
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';

interface DashboardProps {
  accounts: Account[];
  incomes: Income[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onToggleStatus: (accountId: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const CompactStat: React.FC<{ label: string; value: string; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
    <div className="flex items-center gap-3 bg-surface dark:bg-dark-surface p-3 rounded-xl shadow-sm border border-border-color/50 dark:border-dark-border-color/50">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
            {React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 ${color.replace('bg-', 'text-')}` })}
        </div>
        <div>
            <p className="text-xs text-text-muted dark:text-dark-text-muted font-medium uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold text-text-primary dark:text-dark-text-primary leading-tight">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, onEditAccount, onDeleteAccount, onToggleStatus, selectedDate, setSelectedDate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'ALL'>('ALL');
  const [isStatsVisible, setIsStatsVisible] = useState(true);

  const accountsForMonth = useMemo(() => {
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const isFutureView = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);
    const isCurrentMonthView = selectedYear === currentYear && selectedMonth === currentMonth;

    const monthlyAccountMap = new Map<string, Account>();

    for (const account of accounts) {
        if (account.status === AccountStatus.PAID && account.paymentDate) {
            const paymentDate = new Date(account.paymentDate);
            if (paymentDate.getFullYear() === selectedYear && paymentDate.getMonth() === selectedMonth) {
                monthlyAccountMap.set(account.id, account);
            }
        }
    }

    for (const account of accounts) {
        if (account.isRecurrent && !monthlyAccountMap.has(account.id)) {
            const accountsToZero = ['cartão', 'cemig', 'copasa'];
            const shouldZeroOut = isFutureView && accountsToZero.includes(account.name.toLowerCase());
            
            monthlyAccountMap.set(account.id, {
                ...account,
                status: AccountStatus.PENDING,
                value: shouldZeroOut ? 0 : account.value,
                paymentDate: undefined,
            });
        }
    }

    if (isCurrentMonthView) {
        for (const account of accounts) {
            if (!account.isRecurrent && account.status === AccountStatus.PENDING && !monthlyAccountMap.has(account.id)) {
                monthlyAccountMap.set(account.id, account);
            }
        }
    }

    return Array.from(monthlyAccountMap.values());
  }, [accounts, selectedDate]);
  
  const filteredAccountsForDisplay = useMemo(() => {
    return accountsForMonth
      .filter(acc => {
        const matchesStatus = filterStatus === 'ALL' || acc.status === filterStatus;
        const matchesSearch = searchTerm === '' || acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || acc.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (a.status === AccountStatus.PENDING && b.status !== AccountStatus.PENDING) return -1;
        if (a.status !== AccountStatus.PENDING && b.status === AccountStatus.PENDING) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [accountsForMonth, searchTerm, filterStatus]);
  
  const stats = useMemo(() => {
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();

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
  }, [incomes, selectedDate, accountsForMonth]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const isNextMonthDisabled = useMemo(() => {
    const today = new Date();
    return selectedDate.getFullYear() >= today.getFullYear() && selectedDate.getMonth() >= today.getMonth();
  }, [selectedDate]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Control Bar: Month & Search */}
      <div className="bg-surface dark:bg-dark-surface p-3 rounded-2xl shadow-sm border border-border-color/50 dark:border-dark-border-color/50 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-20 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          
          {/* Month Navigator */}
          <div className="flex items-center gap-2 bg-surface-light dark:bg-dark-surface-light p-1 rounded-xl w-full md:w-auto justify-between md:justify-start">
             <button 
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-dark-surface shadow-sm transition-all text-text-secondary"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-bold capitalize w-32 text-center text-text-primary dark:text-dark-text-primary">
                {selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button 
                onClick={handleNextMonth} 
                disabled={isNextMonthDisabled}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-dark-surface shadow-sm transition-all text-text-secondary disabled:opacity-30 disabled:shadow-none"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex-1 w-full md:w-auto">
             <SearchBar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
            />
          </div>
          
           <button
            onClick={() => setIsStatsVisible(!isStatsVisible)}
            className={`p-2 rounded-xl transition-all ${isStatsVisible ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-light dark:bg-dark-surface-light text-text-secondary'}`}
            title="Toggle Resumo"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </button>
      </div>

      <AnimatePresence initial={false}>
        {isStatsVisible && (
            <motion.div
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 transition={{ duration: 0.3, ease: 'easeInOut' }}
                 className="overflow-hidden"
            >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                    <CompactStat 
                        label="Entradas" 
                        value={formatCurrency(stats.totalIncome)} 
                        color="bg-success" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>}
                    />
                    <CompactStat 
                        label="Pago" 
                        value={formatCurrency(stats.paidThisMonth)} 
                        color="bg-accent" 
                         icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <CompactStat 
                        label="Saldo" 
                        value={formatCurrency(stats.balance)} 
                        color={stats.balance >= 0 ? "bg-primary" : "bg-danger"} 
                         icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <CompactStat 
                        label="Pendente" 
                        value={formatCurrency(stats.pending)} 
                        color="bg-warning" 
                         icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div>
        {filteredAccountsForDisplay.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-20">
            {filteredAccountsForDisplay.map(acc => (
              <AccountCard 
                key={acc.id} 
                account={acc} 
                onEdit={onEditAccount} 
                onDelete={onDeleteAccount} 
                onToggleStatus={onToggleStatus} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] bg-surface/50 dark:bg-dark-surface/50 rounded-3xl border-2 border-dashed border-border-color dark:border-dark-border-color m-4 animate-fade-in">
            <div className="p-4 bg-surface-light dark:bg-dark-surface-light rounded-full mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">Tudo limpo por aqui!</h3>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">Nenhuma conta encontrada para os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
