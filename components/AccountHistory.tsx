

import * as React from 'react';
const { useMemo, useState } = React;
import { type Account, AccountStatus } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, 
    PieChart, Pie, AreaChart, Area 
} from 'recharts';

interface AccountHistoryProps {
    accounts: Account[];
}

type ChartType = 'bar' | 'pie' | 'area';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#3b82f6', '#14b8a6', '#f43f5e'];

const AccountHistory: React.FC<AccountHistoryProps> = ({ accounts }) => {
    
    const monthlyData = useMemo(() => {
        const paidAccounts = accounts.filter(acc => acc.status === AccountStatus.PAID && acc.paymentDate);
        
        const groupedByMonth: { [key: string]: Account[] } = paidAccounts.reduce((acc, account) => {
            const monthKey = new Date(account.paymentDate!).toISOString().slice(0, 7); // YYYY-MM
            if (!acc[monthKey]) {
                acc[monthKey] = [];
            }
            acc[monthKey].push(account);
            return acc;
        }, {});

        return groupedByMonth;
    }, [accounts]);

    const availableMonths = useMemo(() => Object.keys(monthlyData).sort().reverse(), [monthlyData]);
    
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');
    const [chartType, setChartType] = useState<ChartType>('bar');

    const chartData = useMemo(() => {
        if (!selectedMonth || !monthlyData[selectedMonth]) return [];

        const categoryTotals: { [key: string]: number } = monthlyData[selectedMonth].reduce((acc, account) => {
            if (!acc[account.category]) {
                acc[account.category] = 0;
            }
            acc[account.category] += account.value;
            return acc;
        }, {});

        return Object.entries(categoryTotals)
            .map(([category, value]) => ({ category, value }))
            .sort((a, b) => b.value - a.value);

    }, [selectedMonth, monthlyData]);

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-2 bg-surface dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color rounded-md shadow-lg">
                    <p className="font-bold">{`${label}`}</p>
                    <p className="text-primary">{`Total: ${formatCurrency(payload[0].value)}`}</p>
                </div>
            );
        }
        return null;
    };
    
    const monthDisplayFormat = (monthKey: string) => {
        if (!monthKey) return '';
        const [year, month] = monthKey.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }

    const chartOptions: { type: ChartType; label: string; icon: React.ReactNode }[] = [
        { type: 'bar', label: 'Barras', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg> },
        { type: 'pie', label: 'Pizza', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg> },
        { type: 'area', label: 'Área', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M1.5 6a4.5 4.5 0 014.5-4.5h9A4.5 4.5 0 0119.5 6v1.5a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5V6zm16.5 4.5a.5.5 0 00-.5-.5h-15a.5.5 0 00-.5.5V12a4.5 4.5 0 004.5 4.5h6A4.5 4.5 0 0018 12v-1.5z" clipRule="evenodd" /></svg>},
    ];
    
    const renderChart = () => {
        switch(chartType) {
            case 'pie':
                return (
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={chartData} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                if (percent < 0.05) return null;
                                return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text> );
                            }}>
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )
            case 'area':
                return (
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color, #e2e8f0)"/>
                            <XAxis dataKey="category" type="category" interval={0} angle={-45} textAnchor="end" height={80} stroke="var(--text-muted, #94a3b8)" />
                            <YAxis tickFormatter={formatCurrency} stroke="var(--text-muted, #94a3b8)" />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                            <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )
            case 'bar':
            default:
                 return (
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color, #e2e8f0)"/>
                            <XAxis dataKey="category" type="category" interval={0} angle={-45} textAnchor="end" height={80} stroke="var(--text-muted, #94a3b8)" />
                            <YAxis tickFormatter={formatCurrency} stroke="var(--text-muted, #94a3b8)" />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                            <Bar dataKey="value" name="Total Gasto" barSize={30}>
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )
        }
    }

    return (
        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <h1 className="text-3xl font-bold mb-2 sm:mb-0">Histórico de Despesas</h1>
                 <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center space-x-1 bg-surface-light dark:bg-dark-surface-light p-1 rounded-lg">
                        {chartOptions.map(option => (
                             <button
                                key={option.type}
                                onClick={() => setChartType(option.type)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                                    chartType === option.type
                                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow'
                                        : 'text-text-secondary dark:text-dark-text-secondary hover:bg-border-color dark:hover:bg-dark-border-color/50'
                                }`}
                                title={`Visualizar como Gráfico de ${option.label}`}
                            >
                                {React.cloneElement(option.icon, {className: "h-5 w-5 rotate-90"})}
                            </button>
                        ))}
                    </div>
                     {availableMonths.length > 0 && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="p-2 w-full sm:w-auto rounded-md bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-primary focus:border-primary"
                        >
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{monthDisplayFormat(month)}</option>
                            ))}
                        </select>
                    )}
                 </div>
            </div>

            {chartData.length > 0 ? (
                <div style={{ width: '100%', height: 400 }}>
                   {renderChart()}
                </div>
            ) : (
                 <div className="text-center text-text-muted dark:text-dark-text-muted py-16">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-dark-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Nenhum dado para o mês selecionado</h2>
                    <p className="mt-2 max-w-md mx-auto">Parece que não há contas pagas registradas para este período. Tente selecionar outro mês ou marque algumas contas como pagas.</p>
                </div>
            )}
        </div>
    );
};

export default AccountHistory;