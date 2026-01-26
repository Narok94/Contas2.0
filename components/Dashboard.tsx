
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User } from '../types';
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
  onOpenBatchModal: () => void;
  currentUser: User | null;
  onOpenMoveModal: () => void;
}

const SummaryItem: React.FC<{ title: string; value: string; icon: React.ReactNode; valueColor?: string }> = ({ title, value, icon, valueColor = 'text-text-primary dark:text-dark-text-primary' }) => (
    <motion.div
        className="bg-surface dark:bg-dark-surface p-4 rounded-xl border border-border-color/50 dark:border-dark-border-color/50"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    >
        <div className="flex items-center text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
            {icon}
            <span className="ml-2">{title}</span>
        </div>
        <p className={`mt-2 text-2xl font-bold truncate ${valueColor}`}>
            {value}
        </p>
    </motion.div>
);


const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, onEditAccount, onDeleteAccount, onToggleStatus, selectedDate, setSelectedDate, onOpenBatchModal, currentUser, onOpenMoveModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'ALL'>('ALL');
  
  const accountsForMonth = useMemo(() => {
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    
    const monthlyAccountMap = new Map<string, Account>();

    for (const account of accounts) {
      if (account.isRecurrent || (new Date(account.paymentDate || 0).getFullYear() === selectedYear && new Date(account.paymentDate || 0).getMonth() === selectedMonth)) {
        let status = account.status;
        let paymentDate = account.paymentDate;

        const paidInSelectedMonth = account.status === AccountStatus.PAID && paymentDate && new Date(paymentDate).getFullYear() === selectedYear && new Date(paymentDate).getMonth() === selectedMonth;

        if (account.isRecurrent && !paidInSelectedMonth) {
          status = AccountStatus.PENDING;
          paymentDate = undefined;
        }
        
        if (!monthlyAccountMap.has(account.id) || paidInSelectedMonth) {
           monthlyAccountMap.set(account.id, { ...account, status, paymentDate });
        }
      } else if (account.status === AccountStatus.PENDING) {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Olá, {currentUser?.name?.split(' ')[0]}! 👋</h1>
        </motion.div>
        
        <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <SummaryItem
                title="Saldo Atual"
                value={formatCurrency(stats.balance)}
                valueColor={stats.balance >= 0 ? 'text-success' : 'text-danger'}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m12 0V6a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 6v3" /></svg>}
            />
            <SummaryItem
                title="Entradas"
                value={formatCurrency(stats.totalIncome)}
                valueColor="text-success"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>}
            />
            <SummaryItem
                title="Contas Pagas"
                value={formatCurrency(stats.paidThisMonth)}
                valueColor="text-danger"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>}
            />
            <SummaryItem
                title="Pendente"
                value={formatCurrency(stats.pending)}
                valueColor="text-amber-500"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
        </motion.div>


      {/* Control Bar: Month & Search */}
      <div className="bg-surface/80 dark:bg-dark-surface/80 p-3 rounded-2xl shadow-sm border border-border-color/50 dark:border-dark-border-color/50 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-20 backdrop-blur-md">
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
            <div className="h-4 w-px bg-border-color dark:bg-dark-border-color mx-1"></div>
            <button 
                onClick={onOpenMoveModal}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-dark-surface shadow-sm transition-all text-text-secondary"
                title="Mover contas entre meses"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
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
      </div>


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
