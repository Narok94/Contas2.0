
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

interface DashboardProps {
  accounts: Account[];
  incomes: Income[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, selectedDate, setSelectedDate }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'trends' | 'history'>('summary');
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
                <div className="flex bg-surface-light dark:bg-dark-surface-light p-1 rounded-xl border border-border-color dark:border-dark-border-color">
                    <button onClick={() => setActiveTab('summary')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'summary' ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm' : 'text-text-muted dark:text-dark-text-muted'}`}>Resumo</button>
                    <button onClick={() => setActiveTab('trends')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'trends' ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm' : 'text-text-muted dark:text-dark-text-muted'}`}>Tendências</button>
                    <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm' : 'text-text-muted dark:text-dark-text-muted'}`}>Histórico</button>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'Entradas', value: stats.totalIncome, icon: <TrendingUp className="w-5 h-5" />, color: 'text-success', bg: 'bg-success/10 dark:bg-success/20', gradient: 'from-success/10 to-transparent' },
                            { label: 'Saídas Pagas', value: stats.paid, icon: <TrendingDown className="w-5 h-5" />, color: 'text-danger', bg: 'bg-danger/10 dark:bg-danger/20', gradient: 'from-danger/10 to-transparent' },
                            { label: 'Pendentes (Mês)', value: stats.pending, icon: <Calendar className="w-5 h-5" />, color: 'text-warning', bg: 'bg-warning/10 dark:bg-warning/20', gradient: 'from-warning/10 to-transparent' },
                            { label: 'Total a Pagar', value: stats.totalPendingGlobal, icon: <AlertCircle className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', gradient: 'from-orange-500/10 to-transparent' },
                            { label: 'Saldo Final', value: stats.balance, icon: <DollarSign className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', gradient: 'from-primary/10 to-transparent' },
                        ].map((stat, i) => (
                            <div key={i} className={`relative bg-surface dark:bg-dark-surface p-4 sm:p-6 rounded-[2.5rem] border border-border-color dark:border-dark-border-color shadow-sm overflow-hidden ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
                                <div className="relative z-10">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4`}>
                                        {stat.icon}
                                    </div>
                                    <p className="text-text-secondary dark:text-dark-text-secondary text-[8px] sm:text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h2 className="text-sm sm:text-2xl font-black text-text-primary dark:text-dark-text-primary tracking-tighter">{formatCurrency(stat.value)}</h2>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Chart */}
                        <div className="bg-surface dark:bg-dark-surface p-6 rounded-[2.5rem] border border-border-color dark:border-dark-border-color shadow-sm">
                            <h3 className="font-serif italic text-lg text-text-primary dark:text-dark-text-primary flex items-center gap-2 mb-6">
                                <PieIcon className="w-4 h-4 text-primary" />
                                Gastos por Categoria
                            </h3>
                            <div className="h-[250px] w-full flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-2 ml-4">
                                    {categoryData.slice(0, 4).map((cat, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-[9px] font-bold text-text-secondary dark:text-dark-text-secondary truncate max-w-[80px]">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick History */}
                        <div className="bg-surface dark:bg-dark-surface p-6 rounded-[2.5rem] border border-border-color dark:border-dark-border-color shadow-sm">
                            <h3 className="font-serif italic text-lg text-text-primary dark:text-dark-text-primary flex items-center gap-2 mb-6">
                                <History className="w-4 h-4 text-primary" />
                                Últimas Transações
                            </h3>
                            <div className="space-y-3">
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
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-light dark:bg-dark-surface-light border border-border-color/50 dark:border-dark-border-color/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${'date' in item ? 'bg-success/10 dark:bg-success/20 text-success' : 'bg-danger/10 dark:bg-danger/20 text-danger'}`}>
                                                    {'date' in item ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                </div>
                                                <span className="text-[10px] font-bold text-text-primary dark:text-dark-text-primary truncate max-w-[100px]">{item.name}</span>
                                            </div>
                                            <span className={`text-[10px] font-mono font-black ${'date' in item ? 'text-success' : 'text-danger'}`}>{formatCurrency(item.value)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
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
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
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
                                            className="dark:!bg-slate-900 dark:!text-white"
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
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
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
                                            className="dark:!bg-slate-900 dark:!text-white"
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
