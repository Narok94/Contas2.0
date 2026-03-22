
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

  const { pendingAccounts, paidAccounts } = useMemo(() => {
    const allForMonth = getMonthlyAccounts(accounts, safeDate);
    
    const filtered = allForMonth.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || acc.status === filterStatus;
        const matchesCategory = filterCategory === 'ALL' || acc.category === filterCategory;
        const matchesRecurrent = !filterRecurrent || acc.isRecurrent;
        const matchesInstallment = !filterInstallment || acc.isInstallment;
        return matchesSearch && matchesStatus && matchesCategory && matchesRecurrent && matchesInstallment;
    });

    return {
        pendingAccounts: filtered.filter(acc => acc.status === AccountStatus.PENDING).sort((a, b) => a.name.localeCompare(b.name)),
        paidAccounts: filtered.filter(acc => acc.status === AccountStatus.PAID).sort((a, b) => a.name.localeCompare(b.name))
    };
  }, [accounts, safeDate, searchTerm, filterStatus, filterCategory, filterRecurrent, filterInstallment]);

  const renderTable = (accountsList: Account[], title: string, colorClass: string) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 px-4">
            <div className={`w-2 h-6 rounded-full ${colorClass}`} />
            <h2 className="text-lg font-serif italic text-text-primary dark:text-dark-text-primary">
                {title} <span className="text-xs font-mono opacity-50 ml-2">({accountsList.length})</span>
            </h2>
        </div>
        <div className="bg-surface dark:bg-dark-surface rounded-2xl sm:rounded-[2rem] border-2 border-border-color dark:border-dark-border-color shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-surface-light dark:bg-dark-surface-light border-b-2 border-border-color dark:border-dark-border-color sticky top-0 z-10">
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted border-r border-border-color dark:border-dark-border-color w-12 text-center">#</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted border-r border-border-color dark:border-dark-border-color w-24">Status</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted border-r border-border-color dark:border-dark-border-color">Nome da Conta</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted border-r border-border-color dark:border-dark-border-color w-40 text-right">Valor</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted w-40 text-center">Categoria</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted w-32 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color dark:divide-dark-border-color">
                        <AnimatePresence mode="popLayout">
                            {accountsList.map((acc, index) => {
                                const isPaid = acc.status === AccountStatus.PAID;
                                return (
                                    <motion.tr 
                                        key={acc.id}
                                        layout
                                        initial={{ opacity: 0, x: isPaid ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className={`group transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 ${index % 2 === 0 ? 'bg-surface dark:bg-dark-surface' : 'bg-surface-light/30 dark:bg-dark-surface-light/30'}`}
                                    >
                                        <td className="p-3 border-r border-border-color dark:border-dark-border-color text-center text-[10px] font-mono text-text-muted">
                                            {index + 1}
                                        </td>
                                        <td className="p-3 border-r border-border-color dark:border-dark-border-color text-center">
                                            <button 
                                                onClick={() => onToggleStatus(acc)}
                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mx-auto transition-all ${
                                                    isPaid 
                                                        ? 'bg-success border-success text-white shadow-lg shadow-success/20' 
                                                        : 'border-primary/30 dark:border-primary/50 hover:border-primary'
                                                }`}
                                            >
                                                {isPaid && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                                            </button>
                                        </td>
                                        <td className="p-3 border-r border-border-color dark:border-dark-border-color">
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-sm ${isPaid ? 'text-text-muted dark:text-dark-text-muted line-through' : 'text-text-primary dark:text-white'}`}>
                                                    {acc.name}
                                                </span>
                                                <div className="flex gap-2">
                                                    {acc.isInstallment && (
                                                        <span className="text-[8px] font-black uppercase text-text-muted dark:text-dark-text-secondary">
                                                            Parcela {acc.currentInstallment}/{acc.totalInstallments}
                                                        </span>
                                                    )}
                                                    {acc.isRecurrent && !acc.isInstallment && (
                                                        <span className="text-[8px] font-black uppercase text-primary/60">Recorrente</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 border-r border-border-color dark:border-dark-border-color font-mono font-black text-sm tracking-tighter text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={isPaid ? 'text-success/70' : 'text-primary dark:text-primary-light'}>
                                                    {acc.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                {acc.isInstallment && acc.totalValue && (
                                                    <span className="text-[9px] font-bold text-text-muted dark:text-dark-text-muted opacity-60">
                                                        Total: {acc.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 border-r border-border-color dark:border-dark-border-color text-center">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded uppercase border inline-block ${
                                                isPaid 
                                                    ? 'bg-success/10 text-success border-success/20' 
                                                    : 'bg-primary/10 text-primary dark:text-primary-light border-primary/20 dark:border-primary/40'
                                            }`}>
                                                {acc.category}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => onEditAccount(acc)} 
                                                    className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </button>
                                                <button 
                                                    onClick={() => { if(window.confirm('Apagar?')) onDeleteAccount(acc.id); }} 
                                                    className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </button>
                                                {isPaid && whatsappEnabled && (
                                                    <button 
                                                        onClick={() => onNotifyWhatsApp?.(acc)}
                                                        className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors"
                                                        title="Notificar WhatsApp"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

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

        <div className="grid grid-cols-1 gap-8 pb-24 px-2 sm:px-0">
            <div className="space-y-8">
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
                
                {renderTable(pendingAccounts, 'A Pagar', 'bg-primary')}
                
                {renderTable(paidAccounts, 'Pago', 'bg-success')}
                
                {pendingAccounts.length === 0 && paidAccounts.length === 0 && (
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
