import React, { useMemo, useState } from 'react';
import { type Account, AccountStatus } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, 
    PieChart, Pie, AreaChart, Area, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#f43f5e'];

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-surface/80 dark:bg-dark-surface-light/80 backdrop-blur-sm border border-border-color dark:border-dark-border-color rounded-md shadow-lg text-sm">
                <p className="font-bold text-text-primary dark:text-dark-text-primary">{label}</p>
                <p className="text-primary">{`Total: ${formatCurrency(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};

type AnalysisView = 'monthly' | 'trend';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <motion.div 
        className="bg-surface-light dark:bg-dark-surface-light p-4 rounded-xl flex items-start gap-4"
        variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
    >
        <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>
        <div>
            <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary uppercase">{title}</p>
            <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{value}</p>
        </div>
    </motion.div>
);

const TrendAnalysis: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const trendData = useMemo(() => {
        const paidAccounts = accounts.filter(acc => acc.status === AccountStatus.PAID && acc.paymentDate);
        const monthlyTotals: { [key: string]: number } = paidAccounts.reduce((acc, account) => {
            const monthKey = new Date(account.paymentDate!).toISOString().slice(0, 7);
            acc[monthKey] = (acc[monthKey] || 0) + account.value;
            return acc;
        }, {});

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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-bold mb-4">Tendência de Gastos (Últimos 12 Meses)</h2>
            <div className="h-96 bg-surface-light dark:bg-dark-surface-light p-4 rounded-2xl">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color, #e2e8f0)"/>
                        <XAxis dataKey="name" stroke="var(--text-muted, #94a3b8)" fontSize={12} />
                        {/* FIX: Explicitly cast `v` to a number before performing arithmetic operation to satisfy TypeScript. */}
                        <YAxis tickFormatter={(v) => `R$${Number(v)/1000}k`} stroke="var(--text-muted, #94a3b8)" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
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

    const { chartData, totalSpent, paidAccountsCount, averageSpent, topCategory } = useMemo(() => {
        if (!selectedMonth || !monthlyData[selectedMonth]) return { chartData: [], totalSpent: 0, paidAccountsCount: 0, averageSpent: 0, topCategory: { category: 'N/A', value: 0 }};
        
        const monthAccounts = monthlyData[selectedMonth];
        const categoryTotals = monthAccounts.reduce((acc, account) => {
            acc[account.category] = (acc[account.category] || 0) + account.value;
            return acc;
        }, {} as { [key: string]: number });

        const chartData = Object.entries(categoryTotals)
            .map(([category, value]) => ({ category, value }))
            .sort((a, b) => b.value - a.value);

        const totalSpent = monthAccounts.reduce((sum, acc) => sum + acc.value, 0);
        const paidAccountsCount = monthAccounts.length;
        const averageSpent = paidAccountsCount > 0 ? totalSpent / paidAccountsCount : 0;
        const topCategory = chartData.length > 0 ? chartData[0] : { category: 'N/A', value: 0 };
        
        return { chartData, totalSpent, paidAccountsCount, averageSpent, topCategory };
    }, [selectedMonth, monthlyData]);

    const renderChart = () => (
        <ResponsiveContainer width="100%" height={300}>
            {chartType === 'bar' ? (
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color, #e2e8f0)" />
                    <XAxis type="number" tickFormatter={formatCurrency} hide />
                    <YAxis dataKey="category" type="category" width={80} tick={{ fontSize: 12 }} stroke="var(--text-muted, #94a3b8)"/>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
                    <Bar dataKey="value" name="Total Gasto" barSize={20}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="rounded-md" />)}
                    </Bar>
                </BarChart>
            ) : (
                <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} labelLine={false}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            )}
        </ResponsiveContainer>
    );
    
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Análise do Mês</h2>
            {availableMonths.length > 0 && (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 text-sm rounded-md bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-primary focus:border-primary">
                    {availableMonths.map(month => <option key={month} value={month}>{new Date(`${month}-02`).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</option>)}
                </select>
            )}
        </div>
        
        {chartData.length > 0 ? (
            <div className="space-y-6">
                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible">
                    <StatCard title="Total Gasto" value={formatCurrency(totalSpent)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H7a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
                    <StatCard title="Contas Pagas" value={paidAccountsCount.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                    <StatCard title="Gasto Médio" value={formatCurrency(averageSpent)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                    <StatCard title="Categoria Principal" value={topCategory.category} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-surface-light dark:bg-dark-surface-light p-4 rounded-2xl">
                         <div className="flex items-center justify-end mb-2">
                            <div className="flex items-center space-x-1 bg-surface dark:bg-dark-surface p-1 rounded-lg">
                                <button onClick={() => setChartType('bar')} className={`px-2 py-1 rounded-md ${chartType === 'bar' ? 'bg-primary/10 text-primary' : 'text-text-muted'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></button>
                                <button onClick={() => setChartType('pie')} className={`px-2 py-1 rounded-md ${chartType === 'pie' ? 'bg-primary/10 text-primary' : 'text-text-muted'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg></button>
                            </div>
                        </div>
                        {renderChart()}
                    </div>
                    <div className="lg:col-span-2">
                        <h3 className="font-bold mb-2">Detalhes do Mês</h3>
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                           {monthlyData[selectedMonth].map(acc => (
                               <div key={acc.id} className="grid grid-cols-3 gap-2 text-xs p-2 rounded-md bg-surface-light dark:bg-dark-surface-light">
                                   <span className="font-semibold truncate col-span-2">{acc.name}</span>
                                   <span className="text-right font-bold">{formatCurrency(acc.value)}</span>
                                   <span className="text-text-muted col-span-3">{acc.category}</span>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="text-center text-text-muted dark:text-dark-text-muted py-16">
                <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Nenhum dado para o mês selecionado</h2>
            </div>
        )}
      </motion.div>
    );
};


const AccountHistory: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const [analysisView, setAnalysisView] = useState<AnalysisView>('monthly');

    return (
        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Histórico e Análise</h1>
                <div className="flex items-center space-x-1 bg-surface-light dark:bg-dark-surface-light p-1 rounded-lg">
                    <button onClick={() => setAnalysisView('monthly')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${analysisView === 'monthly' ? 'bg-white dark:bg-dark-surface shadow text-primary' : 'text-text-secondary'}`}>Análise Mensal</button>
                    <button onClick={() => setAnalysisView('trend')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${analysisView === 'trend' ? 'bg-white dark:bg-dark-surface shadow text-primary' : 'text-text-secondary'}`}>Tendência</button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={analysisView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {analysisView === 'monthly' ? <MonthlyAnalysis accounts={accounts} /> : <TrendAnalysis accounts={accounts} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AccountHistory;