import React, { useMemo } from 'react';
import { type Account, AccountStatus, type Income } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';

interface DashboardProps {
  accounts: Account[];
  incomes: Income[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onToggleStatus: (accountId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: AccountStatus | 'ALL';
  setFilterStatus: (status: AccountStatus | 'ALL') => void;
}

const StatCard: React.FC<{ title: string; value: string | number; colorClass: string; }> = ({ title, value, colorClass }) => (
    <div className={`bg-surface dark:bg-dark-surface p-4 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 active:scale-95 border-t-4 ${colorClass}`}>
        <p className="text-2xl lg:text-3xl font-bold text-text-primary dark:text-dark-text-primary truncate">{value}</p>
        <p className="text-sm text-text-muted dark:text-dark-text-muted mt-1">{title}</p>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, onEditAccount, onDeleteAccount, onToggleStatus, searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
  
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthIncomes = incomes.filter(inc => {
        const incomeDate = new Date(inc.date);
        return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
    });
    const totalIncome = currentMonthIncomes.reduce((sum, inc) => sum + inc.value, 0);

    const paidThisMonthValue = accounts
        .filter(acc => {
            if (acc.status !== AccountStatus.PAID || !acc.paymentDate) return false;
            const paymentDate = new Date(acc.paymentDate);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, acc) => sum + acc.value, 0);

    const balance = totalIncome - paidThisMonthValue;
    
    const pendingValue = accounts
        .filter(acc => acc.status === AccountStatus.PENDING)
        .reduce((sum, acc) => sum + acc.value, 0);

    return {
        totalIncome,
        paidThisMonth: paidThisMonthValue,
        balance,
        pending: pendingValue,
    };
  }, [accounts, incomes]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Entradas (Mês)" value={formatCurrency(stats.totalIncome)} colorClass="border-success" />
        <StatCard title="Despesas Pagas (Mês)" value={formatCurrency(stats.paidThisMonth)} colorClass="border-accent" />
        <StatCard title="Saldo (Mês)" value={formatCurrency(stats.balance)} colorClass={stats.balance >= 0 ? "border-primary" : "border-danger"} />
        <StatCard title="Pendente (Total)" value={formatCurrency(stats.pending)} colorClass="border-warning" />
      </div>

      <div>
        <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
        />
        {accounts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 mt-4">
            {accounts.map(acc => (
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
            <p className="mt-2 max-w-sm">Tente ajustar seus filtros de busca ou adicione uma nova conta para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;