
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';
import AiInsightCard from './AiInsightCard';

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
  onTriggerAnalysis: () => Promise<string>;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <motion.div 
        className="bg-surface dark:bg-dark-surface p-4 rounded-3xl shadow-lg border border-border-color/50 dark:border-dark-border-color/50 flex flex-col justify-between"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    >
        <div className="flex items-center justify-between text-text-muted dark:text-dark-text-muted">
            <span className="text-sm font-semibold">{title}</span>
            <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
        </div>
        <p className="text-2xl lg:text-3xl font-bold text-text-primary dark:text-dark-text-primary mt-2">{value}</p>
    </motion.div>
);

const MonthSummaryCard: React.FC<{ totalIncome: number, paidThisMonth: number, balance: number, formatCurrency: (v: number) => string }> = ({ totalIncome, paidThisMonth, balance, formatCurrency }) => {
    const progress = totalIncome > 0 ? (paidThisMonth / totalIncome) * 100 : 0;
    const progressColor = progress > 85 ? 'bg-danger' : progress > 60 ? 'bg-warning' : 'bg-success';

    return (
        <motion.div 
            className="col-span-2 md:col-span-2 bg-gradient-to-br from-primary to-secondary p-4 rounded-3xl shadow-2xl shadow-primary/20 flex flex-col justify-between text-white"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
            <div>
                <h3 className="text-lg font-bold mb-2 text-white/90">Resumo do Mês</h3>
                <div className="flex flex-wrap justify-between items-center gap-x-6 gap-y-2">
                    <div>
                        <p className="text-xs opacity-80">Entradas</p>
                        <p className="text-xl font-bold">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div>
                        <p className="text-xs opacity-80">Saídas (Pagas)</p>
                        <p className="text-xl font-bold">{formatCurrency(paidThisMonth)}</p>
                    </div>
                    <div>
                        <p className="text-xs opacity-80">Saldo Atual</p>
                        <p className={`text-xl font-bold ${balance < 0 ? 'text-red-300' : 'text-green-300'}`}>{formatCurrency(balance)}</p>
                    </div>
                </div>
            </div>
            <div>
                <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden mt-3">
                    <motion.div
                        className={`h-full rounded-full ${progressColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
                <p className="text-right text-xs mt-1 opacity-80">{Math.min(100, Math.round(progress))}% da renda gasta</p>
            </div>
        </motion.div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, onEditAccount, onDeleteAccount, onToggleStatus, selectedDate, setSelectedDate, onOpenBatchModal, currentUser, onTriggerAnalysis }) => {
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
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Olá, {currentUser?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-text-secondary dark:text-dark-text-secondary mt-1">Bem-vindo(a) de volta, aqui está o resumo.</p>
        </motion.div>
        
        <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <MonthSummaryCard totalIncome={stats.totalIncome} paidThisMonth={stats.paidThisMonth} balance={stats.balance} formatCurrency={formatCurrency} />
            
            <motion.div 
                 className="col-span-2 md:col-span-1"
                 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
                <AiInsightCard onGenerate={onTriggerAnalysis} />
            </motion.div>

            <StatCard title="Pendente" value={formatCurrency(stats.pending)} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-warning" />
            <StatCard title="Pago" value={formatCurrency(stats.paidThisMonth)} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-accent" />
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
