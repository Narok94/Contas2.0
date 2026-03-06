
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income } from '../types';
import MonthPicker from './MonthPicker';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, History } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  accounts: Account[];
  incomes: Income[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, selectedDate, setSelectedDate }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'trends' | 'history'>('summary');
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // 1. Stats for the selected month
  const stats = useMemo(() => {
    const m = selectedDate.getMonth();
    const y = selectedDate.getFullYear();
    
    const monthIncomes = incomes.filter(inc => {
        const d = new Date(inc.date);
        return d.getMonth() === m && d.getFullYear() === y;
    });
    
    const monthAccounts = accounts.filter(acc => {
        if (!acc.paymentDate) return false;
        const d = new Date(acc.paymentDate);
        return d.getMonth() === m && d.getFullYear() === y;
    });

    const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.value, 0);
    const paid = monthAccounts.filter(acc => acc.status === AccountStatus.PAID).reduce((sum, acc) => sum + acc.value, 0);
    const pending = monthAccounts.filter(acc => acc.status === AccountStatus.PENDING).reduce((sum, acc) => sum + acc.value, 0);
    
    return { totalIncome, paid, pending, balance: totalIncome - (paid + pending) };
  }, [accounts, incomes, selectedDate]);

  // 2. Spending by Category (Pie Chart)
  const categoryData = useMemo(() => {
    const m = selectedDate.getMonth();
    const y = selectedDate.getFullYear();
    const monthAccounts = accounts.filter(acc => {
        if (!acc.paymentDate) return false;
        const d = new Date(acc.paymentDate);
        return d.getMonth() === m && d.getFullYear() === y;
    });

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

        const monthExpenses = accounts.filter(acc => {
            if (!acc.paymentDate) return false;
            const d = new Date(acc.paymentDate);
            return d.getMonth() === m && d.getFullYear() === y;
        }).reduce((sum, acc) => sum + acc.value, 0);

        data.push({ name: monthKey, entradas: monthIncomes, saidas: monthExpenses });
    }
    return data;
  }, [accounts, incomes, selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    Dashboard B.I<span className="text-indigo-600">.</span>
                </h1>
                <p className="text-slate-500 font-medium text-sm">Visão analítica de {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setActiveTab('summary')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'summary' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Resumo</button>
                    <button onClick={() => setActiveTab('trends')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'trends' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Tendências</button>
                    <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Histórico</button>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Entradas', value: stats.totalIncome, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                            { label: 'Saídas Pagas', value: stats.paid, icon: <TrendingDown className="w-5 h-5" />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                            { label: 'Saídas Pendentes', value: stats.pending, icon: <Calendar className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                            { label: 'Saldo Final', value: stats.balance, icon: <DollarSign className="w-5 h-5" />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4`}>
                                    {stat.icon}
                                </div>
                                <p className="text-slate-500 text-[8px] sm:text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                <h2 className="text-sm sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(stat.value)}</h2>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Chart */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                <PieIcon className="w-4 h-4 text-indigo-600" />
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
                                            <span className="text-[9px] font-bold text-slate-500 truncate max-w-[80px]">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick History */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                <History className="w-4 h-4 text-indigo-600" />
                                Últimas Transações
                            </h3>
                            <div className="space-y-3">
                                {[...accounts, ...incomes]
                                    .filter(item => ('paymentDate' in item ? item.paymentDate : item.date)?.startsWith(format(selectedDate, 'yyyy-MM')))
                                    .sort((a, b) => new Date(('paymentDate' in b ? b.paymentDate : b.date)!).getTime() - new Date(('paymentDate' in a ? a.paymentDate : a.date)!).getTime())
                                    .slice(0, 4)
                                    .map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${'date' in item ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {'date' in item ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{item.name}</span>
                                            </div>
                                            <span className={`text-[10px] font-black ${'date' in item ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(item.value)}</span>
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
                    className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-8">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        Fluxo de Caixa (6 Meses)
                    </h3>
                    <div className="h-[400px] w-full">
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
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntradas)" strokeWidth={3} />
                                <Area type="monotone" dataKey="saidas" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaidas)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {activeTab === 'history' && (
                <motion.div 
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                    <h3 className="font-black text-slate-900 dark:text-white mb-8">Histórico Completo do Mês</h3>
                    <div className="space-y-4">
                        {[...accounts, ...incomes]
                            .filter(item => ('paymentDate' in item ? item.paymentDate : item.date)?.startsWith(format(selectedDate, 'yyyy-MM')))
                            .sort((a, b) => new Date(('paymentDate' in b ? b.paymentDate : b.date)!).getTime() - new Date(('paymentDate' in a ? a.paymentDate : a.date)!).getTime())
                            .map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${'date' in item ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {'date' in item ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-sm ${'date' in item ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {'date' in item ? '+' : '-'} {formatCurrency(item.value)}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{format(new Date(('paymentDate' in item ? item.paymentDate : item.date)!), 'dd/MM/yyyy')}</p>
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
