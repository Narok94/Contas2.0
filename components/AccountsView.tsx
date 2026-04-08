
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User } from '../types';
import SearchBar from './SearchBar';
import MonthPicker from './MonthPicker';
import FloatingCalculator from './FloatingCalculator';
import { getMonthlyAccounts } from '../utils/accountUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { format } from 'date-fns';
import { Tag, Search, Calendar, DollarSign, Repeat, CheckCircle2, Edit2, Trash2, Receipt, Calculator, ArrowRightLeft } from 'lucide-react';

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

    const sortFn = (a: Account, b: Account) => {
        if (filterInstallment) {
            const remainingA = (a.totalInstallments || 0) - (a.currentInstallment || 0);
            const remainingB = (b.totalInstallments || 0) - (b.currentInstallment || 0);
            if (remainingA !== remainingB) {
                return remainingA - remainingB;
            }
        }
        return a.name.localeCompare(b.name);
    };

    return {
        pendingAccounts: filtered.filter(acc => acc.status === AccountStatus.PENDING).sort(sortFn),
        paidAccounts: filtered.filter(acc => acc.status === AccountStatus.PAID).sort(sortFn)
    };
  }, [accounts, safeDate, searchTerm, filterStatus, filterCategory, filterRecurrent, filterInstallment]);

  const renderAccounts = (accountsList: Account[], title: string, colorClass: string) => {
    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <div className={`w-1.5 h-4 rounded-full ${colorClass}`} />
                <h2 className="text-base font-bold text-text-primary dark:text-dark-text-primary">
                    {title} <span className="text-[10px] font-medium opacity-50 ml-1">({accountsList.length})</span>
                </h2>
            </div>
            
            {accountsList.length === 0 ? (
                <div className="bg-surface dark:bg-dark-surface rounded-xl p-4 text-center border border-dashed border-border-color dark:border-dark-border-color">
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Vazio</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 px-1 sm:px-0">
                    <AnimatePresence mode="popLayout">
                        {accountsList.map((acc) => {
                                        const isPaid = acc.status === AccountStatus.PAID;
                                        return (
                                            <motion.div 
                                                key={acc.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="bg-surface dark:bg-dark-surface p-2.5 rounded-xl border border-border-color dark:border-dark-border-color shadow-sm relative flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between mb-1.5">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${isPaid ? 'bg-text-muted/10 text-text-muted' : 'bg-primary/10 text-primary'}`}>
                                                                {getCategoryIcon(acc.category)}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <h3 className={`font-bold text-xs truncate ${isPaid ? 'text-text-muted line-through' : 'text-text-primary dark:text-white'}`}>{acc.name}</h3>
                                                                <p className="text-[9px] font-medium text-text-muted dark:text-dark-text-muted">
                                                                    {(() => {
                                                                        try {
                                                                            const d = new Date(acc.paymentDate);
                                                                            return isNaN(d.getTime()) ? 'Data Inválida' : format(d, 'dd/MM/yyyy');
                                                                        } catch (e) {
                                                                            return 'Data Inválida';
                                                                        }
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => onToggleStatus(acc)}
                                                            className={`w-6 h-6 shrink-0 rounded-lg border flex items-center justify-center transition-all ${
                                                                isPaid 
                                                                    ? 'bg-success border-success text-white' 
                                                                    : 'border-primary/30 dark:border-primary/50 hover:border-primary'
                                                            }`}
                                                            title={isPaid ? "Marcar como pendente" : "Marcar como pago"}
                                                        >
                                                            {isPaid && <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} />}
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm font-bold ${isPaid ? 'text-success/70' : 'text-primary'}`}>
                                                            {formatCurrency(acc.value)}
                                                        </p>
                                                        <div className="flex gap-1">
                                                            {acc.isInstallment && (
                                                                <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-primary/5 text-primary/70">
                                                                    {acc.currentInstallment}/{acc.totalInstallments}
                                                                </span>
                                                            )}
                                                            {acc.isRecurrent && !acc.isInstallment && (
                                                                <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-primary/5 text-primary/70">Recorrente</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border-color/30 dark:border-dark-border-color/20">
                                                    <button 
                                                        onClick={() => onEditAccount(acc)}
                                                        className="flex-1 py-1 rounded-lg bg-surface-light dark:bg-dark-surface-light text-text-secondary dark:text-dark-text-secondary text-[9px] font-bold uppercase border border-border-color dark:border-dark-border-color hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Edit2 className="w-2.5 h-2.5" /> Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => { if(window.confirm('Apagar esta conta?')) onDeleteAccount(acc.id); }}
                                                        className="flex-1 py-1 rounded-lg bg-danger/5 text-danger text-[9px] font-bold uppercase border border-danger/10 hover:bg-danger/10 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" /> Excluir
                                                    </button>
                                                    {isPaid && whatsappEnabled && (
                                                        <button 
                                                            onClick={() => onNotifyWhatsApp?.(acc)}
                                                            className="p-1 rounded-lg bg-success/5 text-success border border-success/10 hover:bg-success/10 transition-colors"
                                                            title="Notificar WhatsApp"
                                                        >
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                    </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                </div>
            )}
        </div>
    );
};


  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 sm:space-y-5 max-w-7xl mx-auto py-1 font-sans"
    >
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-2 sm:px-0">
            <div>
              <p className="text-text-muted dark:text-dark-text-muted font-black text-[9px] uppercase tracking-[0.25em] mb-0.5">Gestão de Pagamentos</p>
              <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary tracking-tight">
                Minhas Contas<span className="text-primary">.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <MonthPicker selectedDate={safeDate} onSelectDate={setSelectedDate} />
                <button onClick={onOpenMoveModal} className="p-2 rounded-xl bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color text-text-muted hover:text-primary transition-all shadow-sm active:scale-95" title="Mover Contas">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 gap-6 pb-24 px-2 sm:px-0">
            <div className="space-y-6">
                <div className="bg-surface dark:bg-dark-surface p-2 rounded-xl border border-border-color dark:border-dark-border-color shadow-sm">
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
                
                {renderAccounts(pendingAccounts, 'A Pagar', 'bg-primary')}
                
                {renderAccounts(paidAccounts, 'Pago', 'bg-success')}
                
                {pendingAccounts.length === 0 && paidAccounts.length === 0 && (
                    <div className="text-center py-12 bg-surface dark:bg-dark-surface rounded-2xl border border-dashed border-border-color dark:border-dark-border-color">
                        <p className="text-text-muted dark:text-dark-text-muted font-bold text-[10px] uppercase tracking-widest">Nada por aqui</p>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
  );
};

export default AccountsView;
