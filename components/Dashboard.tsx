
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

const StatCard: React.FC<{ title: string; value: string | number; colorClass: string; }> = ({ title, value, colorClass }) => (
    <div className={`bg-surface dark:bg-dark-surface p-4 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 active:scale-95 border-t-4 ${colorClass}`}>
        <p className="text-2xl lg:text-3xl font-bold text-text-primary dark:text-dark-text-primary truncate">{value}</p>
        <p className="text-sm text-text-muted dark:text-dark-text-muted mt-1">{title}</p>
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

    // This Map will store the definitive version of an account for the selected month.
    const monthlyAccountMap = new Map<string, Account>();

    // First, add all paid accounts that match the selected month.
    // This also handles recurring accounts that were paid in this month.
    for (const account of accounts) {
        if (account.status === AccountStatus.PAID && account.paymentDate) {
            const paymentDate = new Date(account.paymentDate);
            if (paymentDate.getFullYear() === selectedYear && paymentDate.getMonth() === selectedMonth) {
                monthlyAccountMap.set(account.id, account);
            }
        }
    }

    // Now, add recurring accounts that haven't been paid this month as PENDING.
    for (const account of accounts) {
        if (account.isRecurrent && !monthlyAccountMap.has(account.id)) {
            // For future months, zero out variable bills, but keep fixed ones.
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

    // Finally, add one-off PENDING accounts ONLY if viewing the current month.
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

    // Use the processed accountsForMonth list for month-specific stats
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
  
  const iconVariants = {
    open: { rotate: 0 },
    closed: { rotate: 180 },
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(1); // Avoid issues with different month lengths
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

  const MonthNavigator = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
        <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color transition-colors"
            aria-label="Mês anterior"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
        <h3 className="text-lg sm:text-xl font-bold text-center w-36 sm:w-48 capitalize">
            {selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <button 
            onClick={handleNextMonth} 
            disabled={isNextMonthDisabled}
            className="p-2 rounded-full bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Próximo mês"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MonthNavigator />
        <button
            onClick={() => setIsStatsVisible(!isStatsVisible)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-light/50 dark:hover:bg-dark-surface-light/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-expanded={isStatsVisible}
            aria-controls="stats-content"
            title={isStatsVisible ? 'Esconder resumo' : 'Mostrar resumo'}
        >
            <span className="font-semibold text-sm">Resumo</span>
            <motion.div
                variants={iconVariants}
                animate={isStatsVisible ? 'open' : 'closed'}
                transition={{ duration: 0.2 }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </motion.div>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {isStatsVisible && (
            <motion.div
                 id="stats-content"
                 key="stats-grid"
                 initial="collapsed"
                 animate="open"
                 exit="collapsed"
                 variants={{
                     open: { opacity: 1, height: 'auto', y: 0 },
                     collapsed: { opacity: 0, height: 0, y: -20 }
                 }}
                 transition={{ duration: 0.3, ease: 'easeInOut' }}
                 className="overflow-hidden"
            >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Entradas no Mês" value={formatCurrency(stats.totalIncome)} colorClass="border-success" />
                    <StatCard title="Pago no Mês" value={formatCurrency(stats.paidThisMonth)} colorClass="border-accent" />
                    <StatCard title="Saldo do Mês" value={formatCurrency(stats.balance)} colorClass={stats.balance >= 0 ? "border-primary" : "border-danger"} />
                    <StatCard title="Pendente no Mês" value={formatCurrency(stats.pending)} colorClass="border-warning" />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div>
        <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
        />
        {filteredAccountsForDisplay.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 mt-4">
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
          <div className="bg-surface dark:bg-dark-surface p-8 rounded-2xl text-center text-text-muted dark:text-dark-text-muted flex flex-col items-center justify-center min-h-[300px] mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-dark-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Nenhuma conta encontrada</h3>
            <p className="mt-2 max-w-sm">
                Não há contas para o mês selecionado. Tente ajustar seus filtros ou adicione uma nova conta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
