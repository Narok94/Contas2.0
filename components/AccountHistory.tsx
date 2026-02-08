
import React, { useMemo, useState } from 'react';
import { type Account, AccountStatus } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#f43f5e'];

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl text-xs">
                <p className="font-black mb-1.5 border-b pb-1 border-slate-100 dark:border-slate-700">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="font-bold flex items-center gap-2" style={{ color: entry.color || entry.fill }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                        {entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const HistoryStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; colorClass?: string; subtitle?: string }> = ({ title, value, icon, colorClass = "text-indigo-600", subtitle }) => (
    <div className="bg-white dark:bg-slate-800/40 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className={`p-2.5 w-fit rounded-xl bg-slate-50 dark:bg-slate-900/50 ${colorClass} mb-3`}>{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
        {subtitle && <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{subtitle}</p>}
    </div>
);

const TrendAnalysis: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    // No histórico, focamos no fluxo do que JÁ FOI PAGO
    const trendData = useMemo(() => {
        const monthlyStats: Record<string, { month: string; name: string; paid: number }> = {};
        
        accounts.filter(a => a.status === AccountStatus.PAID).forEach(acc => {
            const dateStr = acc.paymentDate || new Date().toISOString();
            const monthKey = dateStr.slice(0, 7);
            
            if (!monthlyStats[monthKey]) {
                const date = new Date(monthKey + '-02');
                const monthName = date.toLocaleString('pt-BR', { month: 'short' });
                monthlyStats[monthKey] = {
                    month: monthKey,
                    name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                    paid: 0
                };
            }
            monthlyStats[monthKey].paid += acc.value;
        });

        return Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
    }, [accounts]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tighter">Fluxo de Realizados</h2>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 text-indigo-500"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Total Pago</div>
                </div>
            </div>
            <div className="h-80 bg-white dark:bg-slate-900/20 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3}/>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Area name="Pago" type="monotone" dataKey="paid" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorPaid)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Sem dados de pagamento para exibir
                    </div>
                )}
            </div>
        </div>
    );
};

const MonthlyAnalysis: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const monthlyData = useMemo(() => {
        const data: Record<string, Account[]> = {};
        accounts.forEach(acc => {
            // Se for fixa sem data, ela não entra no histórico (é apenas um template)
            if (acc.isRecurrent && !acc.paymentDate) return;
            
            const dateStr = acc.paymentDate || new Date().toISOString();
            const monthKey = dateStr.slice(0, 7);
            if (!data[monthKey]) data[monthKey] = [];
            data[monthKey].push(acc);
        });
        return data;
    }, [accounts]);

    const availableMonths = useMemo(() => Object.keys(monthlyData).sort().reverse(), [monthlyData]);
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');

    const { chartData, totalPaid, totalPending, topCategory, paidCount } = useMemo(() => {
        if (!selectedMonth || !monthlyData[selectedMonth]) return { chartData: [], totalPaid: 0, totalPending: 0, topCategory: 'N/A', paidCount: 0 };
        
        const monthAccounts = monthlyData[selectedMonth];
        const paidOnly = monthAccounts.filter(a => a.status === AccountStatus.PAID);
        
        const categoryTotals = paidOnly.reduce((acc, account) => {
            acc[account.category] = (acc[account.category] || 0) + account.value;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(categoryTotals)
            .map(([category, value]) => ({ name: category, value }))
            .sort((a, b) => Number(b.value) - Number(a.value));

        const totalPaid = paidOnly.reduce((sum, acc) => sum + acc.value, 0);
        const totalPending = monthAccounts.filter(a => a.status === AccountStatus.PENDING).reduce((sum, acc) => sum + acc.value, 0);
        
        return { 
            chartData, 
            totalPaid, 
            totalPending, 
            topCategory: chartData[0]?.name || 'N/A', 
            paidCount: paidOnly.length
        };
    }, [selectedMonth, monthlyData]);

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-black tracking-tighter">Detalhamento de Gastos</h2>
            {availableMonths.length > 0 && (
                <div className="relative group w-full sm:w-auto">
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-black p-3 pr-10 appearance-none shadow-sm cursor-pointer"
                    >
                        {availableMonths.map(month => (
                            <option key={month} value={month}>
                                {new Date(month + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                </div>
            )}
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HistoryStatCard 
                title="Total Pago" 
                value={formatCurrency(totalPaid)} 
                colorClass="text-emerald-500" 
                subtitle={`${paidCount} contas liquidadas`}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} 
            />
            <HistoryStatCard 
                title="Falta Pagar" 
                value={formatCurrency(totalPending)} 
                colorClass="text-rose-500" 
                subtitle="Ainda pendente no mês"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} 
            />
            <HistoryStatCard title="Top Categoria" value={topCategory} colorClass="text-amber-500" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <HistoryStatCard 
                title="Economia Estimada" 
                value={formatCurrency(totalPaid * 0.1)} 
                colorClass="text-indigo-400" 
                subtitle="Meta de 10% de sobra"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900/20 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Contas Pagas por Categoria</h3>
                {chartData.length > 0 ? (
                    <>
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {chartData.slice(0, 4).map((entry, index) => (
                                <div key={index} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Nenhuma conta paga
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900/20 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Detalhamento do Mês (Pagos)</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {monthlyData[selectedMonth]?.filter(a => a.status === AccountStatus.PAID).sort((a,b) => b.value - a.value).map((acc, index) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                            <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-white truncate">{acc.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{acc.category}</p>
                            </div>
                            <span className="text-xs font-black text-emerald-500">{formatCurrency(acc.value)}</span>
                        </div>
                    ))}
                    {(!monthlyData[selectedMonth] || monthlyData[selectedMonth].filter(a => a.status === AccountStatus.PAID).length === 0) && (
                        <p className="text-center text-slate-400 py-10 font-bold text-[10px] uppercase tracking-widest">Nenhum registro</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
};

const AccountHistory: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const [view, setView] = useState<'monthly' | 'trend'>('monthly');

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-6 px-4 animate-fade-in-up pb-32">
            <header className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white text-center sm:text-left">
                        Histórico<span className="text-emerald-500">.</span>
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 text-center sm:text-left">Acompanhando o que já foi liquidado</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.5rem] shadow-inner border border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => setView('monthly')} 
                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black transition-all ${view === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-lg text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        MENSAL
                    </button>
                    <button 
                        onClick={() => setView('trend')} 
                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black transition-all ${view === 'trend' ? 'bg-white dark:bg-slate-700 shadow-lg text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        TENDÊNCIA
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                >
                    {view === 'monthly' ? <MonthlyAnalysis accounts={accounts} /> : <TrendAnalysis accounts={accounts} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AccountHistory;
