
import React, { useMemo, useState } from 'react';
import { type Account, AccountStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface AccountHistoryProps {
    accounts: Account[];
}

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
    
    return (
        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                 <h1 className="text-3xl font-bold mb-2 sm:mb-0">Histórico de Despesas</h1>
                 {availableMonths.length > 0 && (
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="p-2 rounded-md bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-primary focus:border-primary"
                    >
                        {availableMonths.map(month => (
                            <option key={month} value={month}>{monthDisplayFormat(month)}</option>
                        ))}
                    </select>
                )}
            </div>

            {chartData.length > 0 ? (
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={chartData}
                            margin={{ top: 5, right: 20, left: 20, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color, #e2e8f0)"/>
                            <XAxis dataKey="category" type="category" interval={0} angle={-45} textAnchor="end" height={80} stroke="var(--text-muted, #94a3b8)" />
                            <YAxis tickFormatter={formatCurrency} stroke="var(--text-muted, #94a3b8)" />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                            <Bar dataKey="value" name="Total Gasto" barSize={30}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                 <div className="text-center text-text-muted dark:text-dark-text-muted py-16">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-dark-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Nenhum dado para o mês selecionado</h2>
                    <p className="mt-2 max-w-md mx-auto">Parece que não há contas pagas registradas para este período. Tente selecionar outro mês ou marque algumas contas como pagas.</p>
                </div>
            )}
        </div>
    );
};

export default AccountHistory;
