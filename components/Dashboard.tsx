
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income } from '../types';
import MonthPicker from './MonthPicker';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, History, AlertCircle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMonthlyAccounts } from '../utils/accountUtils';
import { getCategoryIcon } from '../utils/categoryIcons';

interface DashboardProps {
  accounts: Account[];
  incomes: Income[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, selectedDate, setSelectedDate }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'trends' | 'history' | 'detailed'>('summary');
  const formatCurrency = (val: number) => (
    <span className="font-mono tracking-tighter">
        {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </span>
  );

  // 1. Stats for the selected month
  const stats = useMemo(() => {
    const m = selectedDate.getMonth();
    const y = selectedDate.getFullYear();
    
    const monthIncomes = incomes.filter(inc => {
        const d = new Date(inc.date);
        return d.getMonth() === m && d.getFullYear() === y;
    });
    
    const monthAccounts = getMonthlyAccounts(accounts, selectedDate);

    const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.value, 0);
    const paid = monthAccounts.filter(acc => acc.status === AccountStatus.PAID).reduce((sum, acc) => sum + acc.value, 0);
    const pending = monthAccounts.filter(acc => acc.status === AccountStatus.PENDING).reduce((sum, acc) => sum + acc.value, 0);
    
    // Total geral pendente (todas as contas pendentes no sistema)
    const totalPendingGlobal = accounts
        .filter(acc => acc.status === AccountStatus.PENDING)
        .reduce((sum, acc) => sum + acc.value, 0);
    
    return { totalIncome, paid, pending, balance: totalIncome - (paid + pending), totalPendingGlobal };
  }, [accounts, incomes, selectedDate]);

  // 2. Spending by Category (Pie Chart)
  const categoryData = useMemo(() => {
    const monthAccounts = getMonthlyAccounts(accounts, selectedDate);

    const categoriesMap = new Map<string, number>();
    monthAccounts.forEach(acc => {
        const current = categoriesMap.get(acc.category) || 0;
        categoriesMap.set(acc.category, current + acc.value);
    });

    return Array.from(categoriesMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [accounts, selectedDate]);

  // 3. Last 6 Months Trend (Area Chart)
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const targetDate = subMonths(selectedDate, i);
        const m = targetDate.getMonth();
        const y = targetDate.getFullYear();
        const monthKey = format(targetDate, 'MMM', { locale: ptBR });

        const monthIncomes = incomes.filter(inc => {
            const d = new Date(inc.date);
            return d.getMonth() === m && d.getFullYear() === y;
        }).reduce((sum, inc) => sum + inc.value, 0);

        const monthExpenses = getMonthlyAccounts(accounts, targetDate).reduce((sum, acc) => sum + acc.value, 0);

        data.push({ name: monthKey, entradas: monthIncomes, saidas: monthExpenses });
    }
    return data;
  }, [accounts, incomes, selectedDate]);

  // 4. Detailed Category Breakdown
  const detailedData = useMemo(() => {
    const monthAccounts = getMonthlyAccounts(accounts, selectedDate);
    const categoriesMap = new Map<string, { total: number; items: Account[] }>();
    
    monthAccounts.forEach(acc => {
        const current = categoriesMap.get(acc.category) || { total: 0, items: [] };
        categoriesMap.set(acc.category, {
            total: current.total + acc.value,
            items: [...current.items, acc].sort((a, b) => b.value - a.value)
        });
    });

    const totalExpenses = monthAccounts.reduce((sum, acc) => sum + acc.value, 0);

    return Array.from(categoriesMap.entries())
        .map(([name, data]) => ({
            name,
            total: data.total,
            items: data.items,
            percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);
  }, [accounts, selectedDate]);

  // 5. Installment and Category Textual Summary
  const textualSummary = useMemo(() => {
    const monthAccounts = getMonthlyAccounts(accounts, selectedDate);
    const installments = monthAccounts.filter(acc => acc.isInstallment && acc.status === AccountStatus.PENDING);
    
    // Sort installments by due date (assuming they are for the current month)
    // In this app, installments are generated for the month, so we can just look at them.
    const nextInstallment = installments.length > 0 ? installments[0] : null;

    const categorySpendingText = detailedData.map(cat => 
        `${cat.name}: ${cat.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${cat.percentage.toFixed(1)}%)`
    ).join(' | ');

    return {
        installmentCount: installments.length,
        nextInstallment,
        categorySpendingText
    };
  }, [accounts, selectedDate, detailedData]);

  return (
    <div className="space-y-6 animate-fade-in pb-20 font-sans">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-serif italic text-text-primary dark:text-dark-text-primary tracking-tight">
                    Dashboard<span className="text-primary">.</span>
                </h1>
                <p className="text-text-secondary dark:text-dark-text-secondary font-medium text-sm">Visão analítica de {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex bg-surface-light dark:bg-dark-surface-light p-1 rounded-xl border border-border-color dark:border-dark-border-color overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('summary')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'summary' ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm' : 'text-text-muted dark:text-dark-text-muted'}`}>Resumo</button>
                    <button onClick={() => setActiveTab('detailed')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'detailed' ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm' : 'text-text-muted dark:text-dark-text-muted'}`}>Detalhamento</button>
                    <button onClick={() => setActiveTab('trends')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'trends' ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm' : 'text-text-muted dark:text-dark-text-muted'}`}>Tendências</button>
                    <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm' : 'text-text-muted dark:text-dark-text-muted'}`}>Histórico</button>
                </div>
                <MonthPicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>
        </header>

        <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
                <motion.div 
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        {[
                            { label: 'Entradas', value: stats.totalIncome, icon: <TrendingUp className="w-4 h-4 sm:w-5 h-5" />, color: 'text-success', bg: 'bg-success/20 dark:bg-success/30', gradient: 'from-success/20 to-transparent' },
                            { label: 'Saídas Pagas', value: stats.paid, icon: <TrendingDown className="w-4 h-4 sm:w-5 h-5" />, color: 'text-danger', bg: 'bg-danger/20 dark:bg-danger/30', gradient: 'from-danger/20 to-transparent' },
                            { label: 'Pendentes (Mês)', value: stats.pending, icon: <Calendar className="w-4 h-4 sm:w-5 h-5" />, color: 'text-warning', bg: 'bg-warning/20 dark:bg-warning/30', gradient: 'from-warning/20 to-transparent' },
                            { label: 'Saldo Final', value: stats.balance, icon: <DollarSign className="w-4 h-4 sm:w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/20 dark:bg-primary/30', gradient: 'from-primary/20 to-transparent' },
                        ].map((stat, i) => (
                            <div key={i} className="relative bg-surface dark:bg-dark-surface p-3 sm:p-6 rounded-3xl sm:rounded-[2.5rem] border border-border-color dark:border-primary/20 shadow-sm overflow-hidden">
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60 dark:opacity-40`} />
                                <div className="relative z-10">
                                    <div className={`w-7 h-7 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 shadow-lg shadow-current/10`}>
                                        {stat.icon}
                                    </div>
                                    <p className="text-text-secondary dark:text-dark-text-secondary text-[7px] sm:text-xs font-bold uppercase tracking-widest mb-0.5 sm:mb-1">{stat.label}</p>
                                    <h2 className="text-xs sm:text-2xl font-black text-text-primary dark:text-white tracking-tighter truncate">{formatCurrency(stat.value)}</h2>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Chart */}
                        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-border-color dark:border-dark-border-color shadow-sm">
                            <h3 className="font-serif italic text-base sm:text-lg text-text-primary dark:text-dark-text-primary flex items-center gap-2 mb-4 sm:mb-6">
                                <PieIcon className="w-4 h-4 text-primary" />
                                Gastos por Categoria
                            </h3>
                            <div className="h-[200px] sm:h-[250px] w-full flex flex-col sm:flex-row items-center gap-4">
                                <div className="h-full w-full sm:w-2/3">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 w-full sm:w-1/3">
                                    {categoryData.slice(0, 4).map((cat, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-surface-light dark:bg-dark-surface-light p-1.5 rounded-lg border border-border-color/30">
                                            <div className="w-5 h-5 rounded-md bg-white dark:bg-dark-surface flex items-center justify-center text-primary/70 shrink-0">
                                                {getCategoryIcon(cat.name)}
                                            </div>
                                            <span className="text-[8px] font-bold text-text-secondary dark:text-dark-text-secondary truncate">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick History */}
                        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-border-color dark:border-dark-border-color shadow-sm">
                            <h3 className="font-serif italic text-base sm:text-lg text-text-primary dark:text-dark-text-primary flex items-center gap-2 mb-4 sm:mb-6">
                                <History className="w-4 h-4 text-primary" />
                                Últimas Transações
                            </h3>
                            <div className="space-y-2 sm:space-y-3">
                                {[...getMonthlyAccounts(accounts, selectedDate), ...incomes.filter(inc => {
                                    const d = new Date(inc.date);
                                    return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                                })]
                                    .sort((a, b) => {
                                        const dateA = new Date(('paymentDate' in a ? a.paymentDate : 'date' in a ? a.date : null) || selectedDate.toISOString());
                                        const dateB = new Date(('paymentDate' in b ? b.paymentDate : 'date' in b ? b.date : null) || selectedDate.toISOString());
                                        return dateB.getTime() - dateA.getTime();
                                    })
                                    .slice(0, 4)
                                    .map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-surface-light dark:bg-dark-surface-light border border-border-color/50 dark:border-dark-border-color/50">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${'date' in item ? 'bg-success/10 dark:bg-success/20 text-success' : 'bg-danger/10 dark:bg-danger/20 text-danger'}`}>
                                                    {'date' in item ? <DollarSign className="w-4 h-4" /> : getCategoryIcon((item as Account).category)}
                                                </div>
                                                <span className="text-[9px] sm:text-[10px] font-bold text-text-primary dark:text-dark-text-primary truncate max-w-[80px] sm:max-w-[120px]">{item.name}</span>
                                            </div>
                                            <span className={`text-[9px] sm:text-[10px] font-mono font-black ${'date' in item ? 'text-success' : 'text-danger'}`}>{formatCurrency(item.value)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'detailed' && (
                <motion.div 
                    key="detailed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    {/* Textual Summary Section */}
                    <div className="bg-surface dark:bg-dark-surface p-8 rounded-[3rem] border-2 border-primary/20 shadow-xl shadow-primary/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-serif italic text-text-primary dark:text-dark-text-primary">Análise Detalhada do Mês</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted">Parcelas Pendentes</p>
                                <p className="text-3xl font-black text-primary tracking-tighter">
                                    {textualSummary.installmentCount} <span className="text-sm font-medium text-text-muted">vencendo este mês</span>
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted">Próxima Parcela</p>
                                {textualSummary.nextInstallment ? (
                                    <div className="flex flex-col">
                                        <p className="text-xl font-bold text-text-primary dark:text-white truncate">{textualSummary.nextInstallment.name}</p>
                                        <p className="text-sm font-mono font-black text-danger">
                                            {formatCurrency(textualSummary.nextInstallment.value)}
                                            <span className="ml-2 text-[10px] uppercase font-black opacity-50">({textualSummary.nextInstallment.currentInstallment}/{textualSummary.nextInstallment.totalInstallments})</span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-text-muted italic">Nenhuma parcela pendente</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted">Gastos por Categoria</p>
                                <div className="flex flex-wrap gap-2">
                                    {detailedData.map((cat, i) => (
                                        <div key={i} className="px-3 py-1.5 rounded-xl bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color flex items-center gap-2">
                                            <div className="text-primary/60">
                                                {getCategoryIcon(cat.name)}
                                            </div>
                                            <span className="text-[11px] font-bold text-text-primary dark:text-dark-text-primary">{cat.name}:</span>
                                            <span className="text-[11px] font-mono font-black text-primary">{formatCurrency(cat.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border-color dark:border-dark-border-color">
                            <p className="text-xs text-text-muted dark:text-dark-text-muted leading-relaxed italic">
                                <strong>Resumo de Categorias:</strong> {textualSummary.categorySpendingText}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {detailedData.map((category, idx) => (
                            <div key={idx} className="bg-surface dark:bg-dark-surface p-6 rounded-[2.5rem] border border-border-color dark:border-dark-border-color shadow-sm flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            {getCategoryIcon(category.name)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-serif italic text-text-primary dark:text-dark-text-primary">{category.name}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted">{category.items.length} itens</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-primary font-mono">{formatCurrency(category.total)}</p>
                                        <p className="text-[10px] font-bold text-text-muted dark:text-dark-text-muted">{category.percentage.toFixed(1)}% do total</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-2 bg-surface-light dark:bg-dark-surface-light rounded-full mb-6 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${category.percentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                    />
                                </div>

                                {/* Items List */}
                                <div className="space-y-2 flex-grow">
                                    {category.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-light/50 dark:bg-dark-surface-light/30 border border-border-color/30 dark:border-dark-border-color/20">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.status === AccountStatus.PAID ? 'bg-success' : 'bg-warning animate-pulse'}`} />
                                                <span className="text-[11px] font-bold text-text-primary dark:text-dark-text-primary truncate max-w-[150px]">{item.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[11px] font-mono font-black text-text-secondary dark:text-dark-text-secondary">{formatCurrency(item.value)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {detailedData.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-surface-light dark:bg-dark-surface-light rounded-full flex items-center justify-center mb-4 border border-border-color dark:border-dark-border-color">
                                <PieIcon className="w-10 h-10 text-text-muted opacity-20" />
                            </div>
                            <h3 className="text-xl font-serif italic text-text-primary dark:text-dark-text-primary">Nenhum gasto registrado</h3>
                            <p className="text-sm text-text-muted dark:text-dark-text-muted max-w-xs mx-auto mt-2">Você ainda não possui contas registradas para este mês.</p>
                        </div>
                    )}
                </motion.div>
            )}

            {activeTab === 'trends' && (
                <motion.div 
                    key="trends"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-surface dark:bg-dark-surface p-8 rounded-[3rem] border border-border-color dark:border-dark-border-color shadow-sm"
                >
                    <h3 className="font-serif italic text-2xl text-text-primary dark:text-dark-text-primary flex items-center gap-2 mb-8">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Fluxo de Caixa (6 Meses)
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="h-[400px] w-full bg-surface-light dark:bg-dark-surface-light p-6 rounded-[2.5rem] border border-border-color/50 dark:border-dark-border-color/50">
                            <h4 className="text-xs font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted mb-6">Fluxo de Caixa (Entradas vs Saídas)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border-color dark:text-dark-border-color" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '1.25rem', 
                                                border: 'none', 
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                backgroundColor: 'var(--tw-bg-opacity, #fff)',
                                            }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                            className="dark:!bg-dark-surface dark:!text-dark-text-primary"
                                        />
                                        <Area type="monotone" dataKey="entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntradas)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="saidas" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaidas)" strokeWidth={3} />
                                    </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="h-[400px] w-full bg-surface-light dark:bg-dark-surface-light p-6 rounded-[2.5rem] border border-border-color/50 dark:border-dark-border-color/50">
                            <h4 className="text-xs font-black uppercase tracking-widest text-text-muted dark:text-dark-text-muted mb-6">Evolução Mensal de Despesas</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border-color dark:text-dark-border-color" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                            contentStyle={{ 
                                                borderRadius: '1.25rem', 
                                                border: 'none', 
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                backgroundColor: 'var(--tw-bg-opacity, #fff)',
                                            }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                            className="dark:!bg-dark-surface dark:!text-dark-text-primary"
                                        />
                                        <Bar 
                                            dataKey="saidas" 
                                            fill="#f43f5e" 
                                            radius={[10, 10, 0, 0]} 
                                            barSize={40}
                                            name="Despesas"
                                        />
                                    </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'history' && (
                <motion.div 
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-surface dark:bg-dark-surface p-8 rounded-[3rem] border border-border-color dark:border-dark-border-color shadow-sm"
                >
                    <h3 className="font-serif italic text-2xl text-text-primary dark:text-dark-text-primary mb-8">Histórico Completo do Mês</h3>
                    <div className="space-y-4">
                        {[...getMonthlyAccounts(accounts, selectedDate), ...incomes.filter(inc => {
                            const d = new Date(inc.date);
                            return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                        })]
                            .sort((a, b) => {
                                const dateA = new Date(('paymentDate' in a ? a.paymentDate : 'date' in a ? a.date : null) || selectedDate.toISOString());
                                const dateB = new Date(('paymentDate' in b ? b.paymentDate : b.date)!).getTime();
                                return dateB - dateA.getTime();
                            })
                            .map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${'date' in item ? 'bg-success/10 dark:bg-success/20 text-success' : 'bg-danger/10 dark:bg-danger/20 text-danger'}`}>
                                            {'date' in item ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary dark:text-dark-text-primary text-sm">{item.name}</p>
                                            <p className="text-[10px] text-text-muted dark:text-dark-text-muted font-bold uppercase tracking-wider">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-mono font-black text-sm ${'date' in item ? 'text-success' : 'text-danger'}`}>
                                            {'date' in item ? '+' : '-'} {formatCurrency(item.value)}
                                        </p>
                                        <p className="text-[10px] text-text-muted dark:text-dark-text-muted font-mono">
                                            {format(new Date(('paymentDate' in item ? item.paymentDate : 'date' in item ? item.date : null) || selectedDate.toISOString()), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default Dashboard;
