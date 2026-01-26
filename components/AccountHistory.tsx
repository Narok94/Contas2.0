import React, { useMemo, useState } from 'react';
import { type Account, AccountStatus } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#f43f5e'];

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl text-xs">
                <p className="font-black mb-1">{label}</p>
                <p className="text-indigo-500 font-bold">{formatCurrency(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const TrendAnalysis: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const trendData = useMemo(() => {
        const paidAccounts = accounts.filter(acc => acc.status === AccountStatus.PAID && acc.paymentDate);
        const monthlyTotals = paidAccounts.reduce((acc, account) => {
            const monthKey = new Date(account.paymentDate!).toISOString().slice(0, 7);
            acc[monthKey] = (acc[monthKey] || 0) + account.value;
            return acc;
        }, {} as Record<string, number>);

        const last12Months: { month: string; name: string; total: number }[] = [];
        const today = new Date();
        today.setDate(1);

        for (let i = 0; i < 12; i++) {
            const monthKey = today.toISOString().slice(0, 7);
            const monthName = today.toLocaleString('pt-BR', { month: 'short' });
            last12Months.push({
                month: monthKey,
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                total: monthlyTotals[monthKey] || 0,
            });
            today.setMonth(today.getMonth() - 1);
        }
        return last12Months.reverse();
    }, [accounts]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tighter">Tendência de Gastos</h2>
            <div className="h-80 bg-white dark:bg-slate-800/20 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5}/>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v) => `R$${v}`} stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const MonthlyAnalysis: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
    
    const monthlyData = useMemo(() => {
        const paidAccounts = accounts.filter(acc => acc.status === AccountStatus.PAID && acc.paymentDate);
        return paidAccounts.reduce((acc, account) => {
            const monthKey = new Date(account.paymentDate!).toISOString().slice(0, 7);
            if (!acc[monthKey]) acc[monthKey] = [];
            acc[monthKey].push(account);
            return acc;
        }, {} as { [key: string]: Account[] });
    }, [accounts]);

    const availableMonths = useMemo(() => Object.keys(monthlyData).sort().reverse(), [monthlyData]);
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');

    const { chartData, totalSpent, paidCount, topCategory } = useMemo(() => {
        if (!selectedMonth || !monthlyData[selectedMonth]) return { chartData: [], totalSpent: 0, paidCount: 0, topCategory: 'N/A' };
        
        const monthAccounts = monthlyData[selectedMonth];
        const categoryTotals = monthAccounts.reduce((acc, account) => {
            acc[account.category] = (acc[account.category] || 0) + account.value;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(categoryTotals)
            .map(([category, value]) => ({ category, value }))
            .sort((a, b) => Number(b.value) - Number(a.value));

        const totalSpent = monthAccounts.reduce((sum, acc) => sum + acc.value, 0);
        return { chartData, totalSpent, paidCount: monthAccounts.length, topCategory: chartData[0]?.category || 'N/A' };
    }, [selectedMonth, monthlyData]);

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black tracking-tighter">Análise Mensal</h2>
            {availableMonths.length > 0 && (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-2 focus:ring-2 focus:ring-indigo-500">
                    {availableMonths.map(month => (
                        <option key={month} value={month}>
                            {new Date(`${month}-02`).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </option>
                    ))}
                </select>
            )}
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Pago" value={formatCurrency(totalSpent)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="Quantidade" value={paidCount.toString()} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="Categoria Top" value={topCategory} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard title="Média" value={formatCurrency(paidCount > 0 ? totalSpent / paidCount : 0)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
        </div>

        <div className="bg-white dark:bg-slate-800/20 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3}/>
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    );
};

const AccountHistory: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const [view, setView] = useState<'monthly' | 'trend'>('monthly');

    return (
        <div className="max-w-4xl mx-auto space-y-10 py-6 px-2 animate-fade-in-up">
            <header className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <h1 className="text-4xl font-black tracking-tighter">Histórico<span className="text-indigo-600">.</span></h1>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    <button 
                        onClick={() => setView('monthly')} 
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        MENSAL
                    </button>
                    <button 
                        onClick={() => setView('trend')} 
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'trend' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        TENDÊNCIA
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {view === 'monthly' ? <MonthlyAnalysis accounts={accounts} /> : <TrendAnalysis accounts={accounts} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AccountHistory;