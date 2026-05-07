
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

  const renderAccounts = (accountsList: Account[], title: string, colorClass: string) => {
    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
                <div className={`w-1.5 h-4 rounded-full ${colorClass}`} />
                <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">
                    {title} <span className="text-[10px] font-medium opacity-40 ml-1">({accountsList.length})</span>
                </h2>
            </div>
            
            {accountsList.length === 0 ? (
                <div className="bg-white dark:bg-dark-surface rounded-xl p-6 text-center border border-dashed border-border-color">
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest opacity-40">Nenhuma conta encontrada</p>
                </div>
            ) : (
                <div className="flex flex-col gap-1.5 px-1 sm:px-0">
                    {/* Header da Tabela */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border-color">
                        <div className="col-span-5">Conta / Categoria</div>
                        <div className="col-span-3 text-right">Valor</div>
                        <div className="col-span-3 text-center">Status</div>
                        <div className="col-span-1 text-right">Ações</div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {accountsList.map((acc) => {
                                        const isPaid = acc.status === AccountStatus.PAID;
                                        return (
                                            <motion.div 
                                                key={acc.id}
                                                layout
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                onClick={() => toggleSelection(acc.id)}
                                                className={`group bg-white dark:bg-dark-surface px-4 py-2 rounded-lg border transition-all cursor-pointer shadow-sm hover:shadow-md relative flex flex-col sm:grid sm:grid-cols-12 items-center gap-4 ${
                                                  selectedAccountIds.includes(acc.id) 
                                                    ? 'border-primary bg-primary/[0.02]' 
                                                    : 'border-border-color'
                                                }`}
                                            >
                                                {/* Nome e Identificação Visual */}
                                                <div className="col-span-5 flex items-center gap-3 w-full overflow-hidden">
                                                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm shadow-inner transition-colors ${isPaid ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                                                        {getCategoryIcon(acc.category)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h3 className={`font-bold text-[13px] truncate leading-tight ${isPaid ? 'text-text-muted line-through opacity-50' : 'text-text-primary'}`}>
                                                            {acc.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-medium text-text-muted uppercase tracking-tighter">{acc.category}</span>
                                                            {acc.isRecurrent && <Repeat className="w-2.5 h-2.5 text-text-muted opacity-50" />}
                                                            {acc.isInstallment && (
                                                                <span className="text-[10px] font-black text-primary/60">
                                                                    {acc.currentInstallment}/{acc.totalInstallments}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Valor (Mais importante) */}
                                                <div className="col-span-3 text-right w-full sm:w-auto">
                                                    <p className={`text-base font-black tracking-tight ${isPaid ? 'text-text-muted opacity-40' : 'text-black'}`}>
                                                        {formatCurrency(acc.value)}
                                                    </p>
                                                </div>

                                                {/* Status e Ação Rápida */}
                                                <div className="col-span-3 flex items-center justify-center gap-2 w-full sm:w-auto">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onToggleStatus(acc); }}
                                                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border ${
                                                            isPaid 
                                                                ? 'bg-primary text-white border-primary' 
                                                                : 'bg-white border-border-color text-text-muted hover:border-primary hover:text-primary'
                                                        }`}
                                                    >
                                                        {isPaid ? (
                                                            <>
                                                                <CheckCircle2 className="w-3 h-3" strokeWidth={3} /> Pago
                                                            </>
                                                        ) : (
                                                            'Marcar Pago'
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Menu de Ações (...) */}
                                                <div className="col-span-1 text-right relative flex justify-end">
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setOpenMenuId(openMenuId === acc.id ? null : acc.id);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-slate-50 text-text-muted transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    <AnimatePresence>
                                                        {openMenuId === acc.id && (
                                                            <div className="absolute right-0 top-full mt-1 z-50">
                                                                <motion.div 
                                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                    className="bg-white rounded-lg shadow-xl border border-border-color p-1 min-w-[120px]"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button 
                                                                        onClick={() => { onEditAccount(acc); setOpenMenuId(null); }}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-text-secondary hover:bg-slate-50 rounded"
                                                                    >
                                                                        <Edit2 className="w-3 h-3" /> Editar
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => { if(window.confirm('Apagar esta conta?')) onDeleteAccount(acc.id); setOpenMenuId(null); }}
                                                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-danger hover:bg-danger/5 rounded"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" /> Excluir
                                                                    </button>
                                                                </motion.div>
                                                                {/* Overlay para fechar ao clicar fora */}
                                                                <div 
                                                                    className="fixed inset-0 z-[-1]" 
                                                                    onClick={() => setOpenMenuId(null)}
                                                                />
                                                            </div>
                                                        )}
                                                    </AnimatePresence>
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
