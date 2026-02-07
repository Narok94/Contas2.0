import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income, type User } from '../types';
import AccountCard from './AccountCard';
import SearchBar from './SearchBar';
import MonthPicker from './MonthPicker';

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
  categories: string[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; isMain?: boolean; colorClass?: string }> = ({ title, value, icon, isMain = false, colorClass = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isMain ? 'bg-indigo-600 text-white shadow-md' : 'bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color shadow-sm'} p-4 rounded-2xl relative overflow-hidden group transition-all hover:translate-y-[-2px]`}
    >
        <div className={`flex items-center text-[8px] font-black uppercase tracking-wider ${isMain ? 'text-indigo-100' : 'text-slate-400'}`}>
            <span className={`p-1 rounded-lg bg-current/10 mr-1.5 ${!isMain ? colorClass : ''}`}>{icon}</span>
            <span>{title}</span>
        </div>
        <p className={`mt-2 text-xl font-black tracking-tighter truncate ${isMain ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {value}
        </p>
    </motion.div>
);

const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, onEditAccount, onDeleteAccount, onToggleStatus, selectedDate, setSelectedDate, currentUser, onOpenMoveModal, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterRecurrent, setFilterRecurrent] = useState(false);
  const [filterInstallment, setFilterInstallment] = useState(false);
  
  const safeDate = useMemo(() => {
    return selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
  }, [selectedDate]);

  const currentMonthAccounts = useMemo(() => {
    const selectedYear = safeDate.getFullYear();
    const selectedMonth = safeDate.getMonth();
    const monthKey = safeDate.toISOString().slice(0, 7);
    
    // 1. SNAPSHOTS: Contas que já têm data de pagamento neste mês específico
    const snapshots = accounts.filter(acc => acc.paymentDate?.startsWith(monthKey));
    
    // 2. RECORRENTES: Templates de contas fixas que ainda não foram "criadas" como snapshot neste mês
    const recurrentTemplates = accounts.filter(acc => 
        acc.isRecurrent && 
        !acc.paymentDate &&
        !snapshots.some(s => s.name === acc.name && s.category === acc.category)
    );

    // 3. PROJEÇÃO DE PARCELAS: Encontra parcelas de outros meses e as projeta para o mês atual
    const projectedInstallments: Account[] = [];
    accounts.forEach(acc => {
        if (acc.isInstallment && acc.paymentDate) {
            const startDate = new Date(acc.paymentDate);
            const startYear = startDate.getFullYear();
            const startMonth = startDate.getMonth();

            // Diferença de meses entre a criação da parcela e o dashboard atual
            const monthDiff = (selectedYear - startYear) * 12 + (selectedMonth - startMonth);

            if (monthDiff > 0) {
                const targetInstallment = (acc.currentInstallment || 1) + monthDiff;
                
                // Se ainda está dentro do limite de parcelas
                if (targetInstallment <= (acc.totalInstallments || 1)) {
                    // Verifica se já não existe um snapshot real pago para esta parcela/mês
                    const alreadyHasSnapshot = snapshots.some(s => 
                        s.name === acc.name && 
                        s.category === acc.category && 
                        s.currentInstallment === targetInstallment
                    );

                    if (!alreadyHasSnapshot) {
                        projectedInstallments.push({
                            ...acc,
                            id: `projected-${acc.id}-${monthKey}`,
                            currentInstallment: targetInstallment,
                            status: AccountStatus.PENDING,
                            paymentDate: undefined // Projeção começa sempre pendente
                        });
                    }
                }
            }
        }
    });

    // Mesclagem Final
    return [...snapshots, ...recurrentTemplates, ...projectedInstallments]
        .filter(acc => {
            const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'ALL' || acc.status === filterStatus;
            const matchesCategory = filterCategory === 'ALL' || acc.category === filterCategory;
            const matchesRecurrent = !filterRecurrent || acc.isRecurrent;
            const matchesInstallment = !filterInstallment || acc.isInstallment;
            return matchesSearch && matchesStatus && matchesCategory && matchesRecurrent && matchesInstallment;
        })
        .sort((a, b) => {
            // REGRA: PENDENTES NO TOPO
            if (a.status !== b.status) return a.status === AccountStatus.PENDING ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
  }, [accounts, safeDate, searchTerm, filterStatus, filterCategory, filterRecurrent, filterInstallment]);

  const stats = useMemo(() => {
    const m = safeDate.getMonth();
    const y = safeDate.getFullYear();

    const totalIncome = incomes
        .filter(inc => {
            const d = new Date(inc.date);
            return d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((sum, inc) => sum + inc.value, 0);

    const paid = currentMonthAccounts
        .filter(acc => acc.status === AccountStatus.PAID)
        .reduce((sum, acc) => sum + acc.value, 0);

    const pending = currentMonthAccounts
        .filter(acc => acc.status === AccountStatus.PENDING)
        .reduce((sum, acc) => sum + acc.value, 0);

    return { totalIncome, paid, pending, balance: totalIncome - (paid + pending) };
  }, [currentMonthAccounts, incomes, safeDate]);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4 animate-fade-in-up max-w-7xl mx-auto py-2">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 px-4">
            <div>
              <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest mb-0.5">Finanças de {currentUser?.name}</p>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                Tatu Dashboard<span className="text-indigo-600">.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
                <MonthPicker selectedDate={safeDate} onSelectDate={setSelectedDate} />
                <button onClick={onOpenMoveModal} className="p-2 rounded-xl bg-white dark:bg-dark-surface border border-border-color dark:border-dark-border-color text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>
            </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4">
            <StatCard title="Saldo Restante" value={formatCurrency(stats.balance)} isMain={true} icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="Pendente" value={formatCurrency(stats.pending)} colorClass="text-rose-500" icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="Entradas" value={formatCurrency(stats.totalIncome)} colorClass="text-emerald-500" icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 11l5-5m0 0l5 5m-5-5v12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="Total Pago" value={formatCurrency(stats.paid)} colorClass="text-slate-400" icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
        </section>

        <div className="grid grid-cols-1 gap-4 pb-20 px-4">
            <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-border-color dark:border-dark-border-color">
                    <SearchBar 
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
                        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        filterRecurrent={filterRecurrent} setFilterRecurrent={setFilterRecurrent}
                        filterInstallment={filterInstallment} setFilterInstallment={setFilterInstallment}
                        categories={categories}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                        {currentMonthAccounts.map(acc => (
                            <AccountCard key={acc.id} account={acc} onEdit={onEditAccount} onDelete={onDeleteAccount} onToggleStatus={onToggleStatus} />
                        ))}
                    </AnimatePresence>
                </div>
                
                {currentMonthAccounts.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-slate-400 font-bold text-xs tracking-tight">Nenhuma conta para este mês.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;