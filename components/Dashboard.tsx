import React, { useMemo } from 'react';
import { type Account, AccountStatus } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';

interface DashboardProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onToggleStatus: (accountId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: AccountStatus | 'ALL';
  setFilterStatus: (status: AccountStatus | 'ALL') => void;
}

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-surface dark:bg-dark-surface p-4 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 active:scale-95">
        <p className="text-2xl lg:text-3xl font-bold text-text-primary dark:text-dark-text-primary truncate">{value}</p>
        <p className="text-sm text-text-muted dark:text-dark-text-muted mt-1">{title}</p>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ accounts, onEditAccount, onDeleteAccount, onToggleStatus, searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
  
  const stats = useMemo(() => {
    const totalValue = accounts.reduce((sum, acc) => sum + acc.value, 0);
    const pendingValue = accounts.filter(acc => acc.status === AccountStatus.PENDING).reduce((sum, acc) => sum + acc.value, 0);
    const paidValue = totalValue - pendingValue;
    return {
      count: accounts.length,
      total: totalValue,
      pending: pendingValue,
      paid: paidValue,
    };
  }, [accounts]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Contas" value={stats.count} />
        <StatCard title="Valor Total" value={formatCurrency(stats.total)} />
        <StatCard title="Total Pendente" value={formatCurrency(stats.pending)} />
        <StatCard title="Total Pago" value={formatCurrency(stats.paid)} />
      </div>

      <div>
        <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
        />
        {accounts.length > 0 ? (
          <div className="flex flex-col space-y-4 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 xl:grid-cols-4 mt-4">
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