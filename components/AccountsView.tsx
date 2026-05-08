
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User } from '../types';
import SearchBar from './SearchBar';
import MonthPicker from './MonthPicker';
import FloatingCalculator from './FloatingCalculator';
import { getMonthlyAccounts } from '../utils/accountUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { format } from 'date-fns';
import { Tag, Search, Calendar, DollarSign, Repeat, CheckCircle2, Edit2, Trash2, Receipt, Calculator, ArrowRightLeft, MoreVertical } from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onToggleStatus: (account: Account) => void;
  onToggleMultipleStatus: (accounts: Account[]) => void;
  onNotifyWhatsApp?: (account: Account) => void;
  whatsappEnabled?: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onOpenMoveModal: () => void;
  categories: string[];
}

const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onEditAccount, onDeleteAccount, onToggleStatus, onToggleMultipleStatus, onNotifyWhatsApp, whatsappEnabled, selectedDate, setSelectedDate, onOpenMoveModal, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterRecurrent, setFilterRecurrent] = useState(false);
  const [filterInstallment, setFilterInstallment] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  
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

  const toggleSelection = (id: string) => {
    setSelectedAccountIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePaySelected = () => {
    const selectedAccounts = accounts.filter(acc => selectedAccountIds.includes(acc.id));
    if (selectedAccounts.length > 0) {
      onToggleMultipleStatus(selectedAccounts);
      setSelectedAccountIds([]);
    }
  };

  const totalSelectedValue = useMemo(() => {
    return accounts
      .filter(acc => selectedAccountIds.includes(acc.id))
      .reduce((sum, acc) => sum + Number(acc.value), 0);
  }, [accounts, selectedAccountIds]);

  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);

  const renderAccounts = (accountsList: Account[], title: string, colorClass: string) => {
    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-4 rounded-full ${colorClass}`} />
                    <h2 className="text-base font-bold text-navy dark:text-white">
                        {title}
                    </h2>
                </div>
                <span className="text-[10px] font-bold text-text-muted bg-surface-light dark:bg-dark-surface-light px-2 py-1 rounded-full border border-border-color dark:border-dark-border-color">
                    {accountsList.length} itens
                </span>
            </div>
            
            {accountsList.length === 0 ? (
                <div className="bg-surface dark:bg-dark-surface rounded-xl p-6 text-center border border-dashed border-border-color dark:border-dark-border-color">
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest italic">Nenhuma conta encontrada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 px-1 sm:px-0">
                    <AnimatePresence mode="popLayout">
                        {accountsList.map((acc) => {
                                        const isPaid = acc.status === AccountStatus.PAID;
                                        const borderColorClass = isPaid ? 'border-success' : 'border-primary';
                                        const glowClass = isPaid ? 'hover:shadow-[0_0_20px_-5px_rgba(0,220,130,0.3)]' : 'hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]';
                                        
                                        return (
                                            <motion.div 
                                                key={acc.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                onClick={() => toggleSelection(acc.id)}
                                                className={`bg-surface/90 dark:bg-dark-surface/80 backdrop-blur-md p-3 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${glowClass} group relative flex items-center justify-between gap-3 ${
                                                  selectedAccountIds.includes(acc.id) 
                                                    ? 'border-primary dark:border-primary ring-4 ring-primary/20 bg-primary/10 dark:bg-primary/20' 
                                                    : 'border-white/50 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary/40'
                                                }`}
                                            >
                                                {/* Left Section: Icon & Info */}
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                                        isPaid ? 'bg-success/20 text-success shadow-[0_0_12px_-3px_rgba(16,185,129,0.4)]' : 'bg-primary/20 text-primary shadow-[0_0_12px_-3px_rgba(99,102,241,0.4)]'
                                                    } border-2 ${isPaid ? 'border-success/30' : 'border-primary/30'} group-hover:scale-105`}>
                                                        {getCategoryIcon(acc.category, "w-5 h-5")}
                                                    </div>
                                                    
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className={`font-black text-sm tracking-tight leading-tight transition-colors ${isPaid ? 'text-text-muted line-through opacity-60' : 'text-navy dark:text-gray-100 group-hover:text-primary'}`}>
                                                            {acc.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {acc.isInstallment ? (
                                                                <span className="text-[9px] font-black text-text-muted dark:text-dark-text-secondary bg-surface-light dark:bg-dark-surface-light/50 px-1 py-0.5 rounded-md border border-border-color/10">
                                                                    {acc.currentInstallment}/{acc.totalInstallments}
                                                                </span>
                                                            ) : acc.isRecurrent ? (
                                                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 px-1 py-0.5 rounded-md border border-indigo-500/20">FIXO</span>
                                                            ) : (
                                                                <span className="text-[9px] font-black text-text-muted dark:text-dark-text-secondary bg-surface-light dark:bg-dark-surface-light/50 px-1 py-0.5 rounded-md border border-border-color/10">AVULSO</span>
                                                            )}
                                                            <span className="text-[9px] font-bold text-text-muted dark:text-dark-text-muted uppercase tracking-wider truncate max-w-[80px]">{acc.category.split(' ')[1] || acc.category}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section: Value & Checkbox & Actions */}
                                                <div className="flex items-center gap-2.5 shrink-0">
                                                    <div className="text-right">
                                                        <p className={`font-black text-base tracking-tighter ${isPaid ? 'text-success' : 'text-navy dark:text-white'}`}>
                                                            {formatCurrency(acc.value)}
                                                        </p>
                                                        {!isPaid && acc.dueDate && (
                                                            <p className="text-[8px] font-black text-danger uppercase opacity-90 leading-none mt-0.5">
                                                                Venc. {format(new Date(acc.dueDate), 'dd/MM')}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onToggleStatus(acc); }}
                                                        className={`w-8 h-8 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm ${
                                                            isPaid 
                                                                ? 'bg-success border-success text-white shadow-[0_4px_12px_rgba(16,185,129,0.4)]' 
                                                                : 'border-border-color dark:border-dark-border-color bg-surface-light dark:bg-dark-surface-light group-hover:border-primary group-hover:scale-105'
                                                        }`}
                                                    >
                                                        {isPaid ? <CheckCircle2 className="w-4 h-4" strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-border-color dark:bg-dark-border-color group-hover:bg-primary" />}
                                                    </button>

                                                    {/* Actions Menu Trigger */}
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setActiveActionsId(activeActionsId === acc.id ? null : acc.id); 
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-light dark:hover:bg-dark-surface-light text-text-muted hover:text-navy dark:hover:text-white transition-all"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {/* Simple Actions Menu Overlay */}
                                                        <AnimatePresence>
                                                            {activeActionsId === acc.id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveActionsId(null)} />
                                                                    <motion.div 
                                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                        className="absolute right-0 top-10 w-32 bg-white dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-xl shadow-xl z-50 overflow-hidden py-1"
                                                                    >
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); onEditAccount(acc); setActiveActionsId(null); }}
                                                                            className="w-full px-4 py-2 text-left text-[11px] font-bold text-text-primary dark:text-dark-text-primary hover:bg-surface-light dark:hover:bg-dark-surface-light flex items-center gap-2 transition-colors underline decoration-primary/30 underline-offset-2"
                                                                        >
                                                                            <Edit2 className="w-3 h-3" /> EDITAR
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); if(window.confirm('Apagar esta conta?')) onDeleteAccount(acc.id); setActiveActionsId(null); }}
                                                                            className="w-full px-4 py-2 text-left text-[11px] font-bold text-danger hover:bg-danger/5 flex items-center gap-2 transition-colors"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" /> EXCLUIR
                                                                        </button>
                                                                        {isPaid && whatsappEnabled && (
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); onNotifyWhatsApp?.(acc); setActiveActionsId(null); }}
                                                                                className="w-full px-4 py-2 text-left text-[11px] font-bold text-success hover:bg-success/5 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WHATSAPP
                                                                            </button>
                                                                        )}
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
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
                <AnimatePresence>
                  {selectedAccountIds.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">
                          {selectedAccountIds.length}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary leading-none">Contas selecionadas</p>
                          <p className="text-[10px] font-bold text-primary/70 mt-0.5">
                            Total: {totalSelectedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedAccountIds([])}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-text-muted hover:text-text-primary transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handlePaySelected}
                          className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold uppercase shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Pago
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
