
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Account, AccountStatus, type Income } from '../types';
import MonthPicker from './MonthPicker';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, History } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMonthlyAccounts } from '../utils/accountUtils';
import { getCategoryIcon } from '../utils/categoryIcons';

interface DashboardProps {
  accounts: Account[];
  incomes: Income[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const COLORS = ['#6366F1', '#00DC82', '#FF4D4D', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

const Dashboard: React.FC<DashboardProps> = ({ accounts, incomes, selectedDate, setSelectedDate }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'trends' | 'detailed'>('summary');
  
  const formatCurrency = (val: number) => (
    <span className="font-mono tracking-tighter">
        {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </span>
  );

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
    
    return { totalIncome, paid, pending, balance: totalIncome - (paid + pending) };
  }, [accounts, incomes, selectedDate]);

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

  const endingInstallments = useMemo(() => {
    const monthAccounts = getMonthlyAccounts(accounts, selectedDate);
    const installments = monthAccounts.filter(acc => acc.isInstallment && acc.totalInstallments);
    
    return installments
        .map(acc => {
            const current = Number(acc.currentInstallment || 1);
            const total = Number(acc.totalInstallments || 1);
            const remaining = total - current;
            return {
                ...acc,
                current,
                total,
                remaining
            };
        })
        .sort((a, b) => a.remaining - b.remaining)
        .slice(0, 5);
  }, [accounts, selectedDate]);

  return (
    <div className="space-y-4 pb-20 font-sans max-w-[1440px] mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-2 sm:px-0">
            <div>
              <h1 className="text-xl font-black text-navy dark:text-gray-100 tracking-tighter">
                Visão Geral<span className="text-primary italic font-serif">.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-slate-50 dark:bg-dark-surface p-1 rounded-xl border border-slate-100 dark:border-white/5 shadow-none overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('summary')} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'summary' ? 'bg-white dark:bg-dark-surface-light text-primary shadow-xs' : 'text-text-muted hover:text-text-primary dark:hover:text-white'}`}>Resumo</button>
                    <button onClick={() => setActiveTab('detailed')} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'detailed' ? 'bg-white dark:bg-dark-surface-light text-primary shadow-xs' : 'text-text-muted hover:text-text-primary dark:hover:text-white'}`}>Categorias</button>
                    <button onClick={() => setActiveTab('trends')} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'trends' ? 'bg-white dark:bg-dark-surface-light text-primary shadow-xs' : 'text-text-muted hover:text-text-primary dark:hover:text-white'}`}>Tendências</button>
                </div>
                <MonthPicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>
        </header>

        <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
                <motion.div 
                    key="summary"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-4 px-2 sm:px-0"
                >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { label: 'Entradas', value: stats.totalIncome, icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', borderColor: 'border-emerald-500/20 dark:border-emerald-500/30' },
                            { label: 'Pagas', value: stats.paid, icon: <TrendingDown className="w-3.5 h-3.5" />, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20', borderColor: 'border-rose-500/20 dark:border-rose-500/30' },
                            { label: 'A Pagar', value: stats.pending, icon: <Calendar className="w-3.5 h-3.5" />, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20', borderColor: 'border-amber-500/20 dark:border-amber-500/30' },
                            { label: 'Saldo', value: stats.balance, icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', borderColor: 'border-indigo-500/20 dark:border-indigo-500/30' },
                        ].map((stat, i) => (
                            <div key={i} className={`bg-white dark:bg-dark-surface/60 p-2.5 rounded-xl border ${stat.borderColor} shadow-sm hover:shadow-md relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300`}>
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 rounded-bl-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-700" />
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform shrink-0`}>
                                        {stat.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-text-muted dark:text-gray-400 text-[8px] font-black uppercase tracking-[0.1em] mb-0.5 leading-none">{stat.label}</p>
                                        <h2 className="text-xs sm:text-sm font-black text-text-primary dark:text-white tracking-tighter truncate leading-none">{formatCurrency(stat.value)}</h2>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-dark-surface p-3.5 rounded-2xl border border-slate-100 dark:border-dark-border-color shadow-sm">
                            <h3 className="text-[10px] font-black text-text-primary dark:text-white flex items-center gap-2 mb-2.5 uppercase tracking-wider">
                                <PieIcon className="w-3.5 h-3.5 text-primary" />
                                Alocação de Gastos
                            </h3>
                            <div className="h-[140px] w-full flex flex-col sm:flex-row items-center gap-4">
                                <div className="h-full w-full sm:w-1/2 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={4} dataKey="value">
                                                {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip 
                                              contentStyle={{ backgroundColor: '#0F172A', border: '2px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                              itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full sm:w-1/2">
                                    {categoryData.slice(0, 6).map((cat, i) => (
                                        <div key={i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-surface-light p-1 rounded-lg border border-slate-100 dark:border-border-color/30 group hover:border-primary/30 transition-all">
                                            <div className="w-5 h-5 rounded bg-white dark:bg-dark-surface flex items-center justify-center text-primary shrink-0 shadow-sm border border-slate-100 dark:border-border-color/10">
                                                {getCategoryIcon(cat.name, "w-2.5 h-2.5")}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black text-text-secondary dark:text-dark-text-secondary truncate leading-tight">{cat.name}</p>
                                                <p className="text-[9px] font-black text-primary font-mono leading-none mt-0.2">{formatCurrency(cat.value)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-surface p-3.5 rounded-2xl border border-slate-100 dark:border-dark-border-color shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-[10px] font-black text-text-primary dark:text-white flex items-center gap-2 mb-2.5 uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                    Parcelamentos Próximos da Conclusão
                                </h3>
                                <div className="space-y-1.5">
                                    {endingInstallments.length === 0 ? (
                                        <div className="text-center py-10">
                                            <p className="text-[10px] font-bold text-text-muted">Nenhum parcelamento ativo neste mês.</p>
                                        </div>
                                    ) : (
                                        endingInstallments.map((item, i) => {
                                            const current = Number(item.currentInstallment || 1);
                                            const total = Number(item.totalInstallments || 1);
                                            const percent = (current / total) * 100;
                                            return (
                                                <div key={item.id || i} className="flex items-center justify-between p-2 rounded-2xl bg-slate-50/50 dark:bg-dark-surface-light border border-slate-50 hover:border-slate-100 hover:shadow-sm transition-all group shadow-sm">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                            {getCategoryIcon(item.category, "w-4 h-4")}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <p className="text-[10px] font-black text-text-primary dark:text-white truncate max-w-[120px] leading-tight">
                                                                    {item.name}
                                                                </p>
                                                                {item.remaining === 0 ? (
                                                                    <span className="text-[7px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded uppercase tracking-wider">Última!</span>
                                                                ) : item.remaining === 1 ? (
                                                                    <span className="text-[7px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded uppercase tracking-wider">Falta 1</span>
                                                                ) : (
                                                                    <span className="text-[7px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1 py-0.2 rounded uppercase tracking-wider">Faltam {item.remaining}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <p className="text-[8px] font-bold text-text-muted shrink-0">
                                                                    Parcela {current} de {total}
                                                                </p>
                                                                <div className="w-12 h-1 bg-slate-200 dark:bg-dark-surface rounded-full overflow-hidden shrink-0">
                                                                    <div 
                                                                        className="h-full bg-primary rounded-full transition-all" 
                                                                        style={{ width: `${percent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-2">
                                                        <p className="text-xs font-mono font-black tracking-tighter text-text-primary dark:text-white">
                                                            {formatCurrency(item.value)}
                                                        </p>
                                                        <p className={`text-[7px] font-black uppercase tracking-wider mt-0.5 ${item.status === AccountStatus.PAID ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                            {item.status === AccountStatus.PAID ? 'Pago' : 'Pendente'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
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
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-2 sm:px-0"
                >
                    {detailedData.map((category, idx) => (
                        <div key={idx} className="bg-white dark:bg-dark-surface p-3 rounded-xl border border-slate-100 dark:border-dark-border-color shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        {getCategoryIcon(category.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-text-primary dark:text-dark-text-primary">{category.name}</h3>
                                        <p className="text-[8px] font-bold uppercase text-text-muted">{category.items.length} itens</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-primary font-mono">{formatCurrency(category.total)}</p>
                                    <p className="text-[8px] font-bold text-text-muted">{category.percentage.toFixed(1)}%</p>
                                </div>
                            </div>

                            <div className="w-full h-1 bg-surface-light dark:bg-dark-surface-light rounded-full mb-3 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${category.percentage}%` }}
                                    className="h-full bg-primary"
                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                />
                            </div>

                            <div className="space-y-1">
                                {category.items.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-dark-surface-light/30">
                                        <span className="text-[9px] font-bold text-text-primary truncate max-w-[100px]">{item.name}</span>
                                        <span className="text-[9px] font-mono font-black text-text-secondary">{formatCurrency(item.value)}</span>
                                    </div>
                                ))}
                                {category.items.length > 3 && (
                                    <p className="text-[8px] text-center text-text-muted mt-1">+ {category.items.length - 3} outros</p>
                                )}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {activeTab === 'trends' && (
                <motion.div 
                    key="trends"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white dark:bg-dark-surface p-3.5 rounded-2xl border border-slate-100 dark:border-dark-border-color shadow-sm px-2 sm:px-0"
                >
                    <h3 className="text-[10px] font-black text-text-primary dark:text-dark-text-primary flex items-center gap-2 mb-3 uppercase tracking-wider">
                        <BarChart3 className="w-3.5 h-3.5 text-primary" />
                        Fluxo de Caixa (6 Meses)
                    </h3>
                    <div className="h-[170px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border-color/10" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ fontSize: '9px', borderRadius: '8px', border: 'none' }} />
                                    <Area type="monotone" dataKey="entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntradas)" strokeWidth={1.5} />
                                    <Area type="monotone" dataKey="saidas" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaidas)" strokeWidth={1.5} />
                                </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default Dashboard;
