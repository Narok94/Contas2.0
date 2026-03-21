
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';
import MonthPicker from './MonthPicker';
import FloatingCalculator from './FloatingCalculator';
import { getMonthlyAccounts } from '../utils/accountUtils';

interface AccountsViewProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onToggleStatus: (account: Account) => void;
  onNotifyWhatsApp?: (account: Account) => void;
  whatsappEnabled?: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onOpenMoveModal: () => void;
  categories: string[];
}

const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onEditAccount, onDeleteAccount, onToggleStatus, onNotifyWhatsApp, whatsappEnabled, selectedDate, setSelectedDate, onOpenMoveModal, categories }) => {
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
    const allForMonth = getMonthlyAccounts(accounts, safeDate);
    
    return allForMonth
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
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 sm:space-y-5 max-w-7xl mx-auto py-1 font-sans"
    >
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-2 sm:px-0">
            <div>
              <p className="text-text-muted dark:text-dark-text-muted font-black text-[9px] uppercase tracking-[0.25em] mb-0.5">Gestão de Pagamentos</p>
              <h1 className="text-3xl font-serif italic text-text-primary dark:text-dark-text-primary tracking-tight">
                Minhas Contas<span className="text-primary">.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <MonthPicker selectedDate={safeDate} onSelectDate={setSelectedDate} />
                <button onClick={onOpenMoveModal} className="p-2 rounded-xl bg-surface dark:bg-dark-surface border-2 border-border-color dark:border-dark-border-color text-text-muted hover:text-primary transition-all shadow-sm active:scale-95" title="Mover Contas">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 gap-4 pb-24 px-2 sm:px-0">
            <div className="space-y-4">
                <div className="bg-surface-light dark:bg-dark-surface-light p-2 sm:p-3 rounded-2xl sm:rounded-[2rem] border-2 border-border-color dark:border-dark-border-color">
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
                    <AnimatePresence mode="popLayout">
                        {currentMonthAccounts.map(acc => (
                            <AccountCard 
                                key={acc.id} 
                                account={acc} 
                                onEdit={onEditAccount} 
                                onDelete={onDeleteAccount} 
                                onToggleStatus={onToggleStatus} 
                                onNotifyWhatsApp={onNotifyWhatsApp}
                                whatsappEnabled={whatsappEnabled}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
                
                {currentMonthAccounts.length === 0 && (
                    <div className="text-center py-12 bg-surface-light dark:bg-dark-surface-light rounded-[2.5rem] border-2 border-dashed border-border-color dark:border-dark-border-color">
                        <p className="text-text-muted dark:text-dark-text-muted font-black text-[10px] uppercase tracking-widest">Nada por aqui</p>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
  );
};

export default AccountsView;
