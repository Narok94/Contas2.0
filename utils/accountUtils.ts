
import { type Account, AccountStatus } from '../types';

export const isVariableExpense = (acc: Partial<Account>) => {
    if (!acc) return false;
    const nameLower = acc.name?.toLowerCase() || '';
    const categoryLower = acc.category?.toLowerCase() || '';
    const isCartao = nameLower.includes('cartão') || categoryLower.includes('cartão');
    const isAgua = nameLower.includes('água') || categoryLower.includes('água');
    const isLuz = nameLower.includes('luz') || categoryLower.includes('luz');
    return isCartao || isAgua || isLuz;
};

export const getMonthlyAccounts = (accounts: Account[], date: Date) => {
    const selectedYear = date.getFullYear();
    const selectedMonth = date.getMonth();
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    
    const getSafeDateStr = (acc: any): string | null => {
        const d = acc.paymentDate || acc.dueDate || acc.date;
        if (!d) return null;
        if (typeof d === 'string') return d;
        if (d instanceof Date) return d.toISOString();
        if (typeof d === 'number') return new Date(d).toISOString();
        return String(d);
    };

    const physicalRecords = accounts.filter(acc => {
        const dateStr = getSafeDateStr(acc);
        return dateStr?.startsWith(monthKey);
    });
    
    const orphanAccounts = accounts.filter(acc => {
        const dateStr = getSafeDateStr(acc);
        return !dateStr && !acc.isRecurrent && !acc.isInstallment;
    });

    const recurrentTemplates = accounts.filter(acc => {
        const dateStr = getSafeDateStr(acc);
        return acc.isRecurrent && 
        !dateStr &&
        !physicalRecords.some(p => p.name === acc.name && p.category === acc.category);
    });

    const projectedInstallments: Account[] = [];
    const seriesAnchors = new Map<string, Account>();
    
    accounts.forEach(acc => {
        const dateStr = getSafeDateStr(acc);
        if (acc.isInstallment && dateStr) {
            const anchorKey = acc.installmentId || `legacy-${acc.name}`;
            const current = seriesAnchors.get(anchorKey);
            const currentDateStr = current ? getSafeDateStr(current) : null;
            if (!current || new Date(dateStr) > new Date(currentDateStr!)) {
                seriesAnchors.set(anchorKey, acc);
            }
        }
    });

    seriesAnchors.forEach((acc) => {
        const dateStr = getSafeDateStr(acc);
        const startDate = new Date(dateStr!);
        const monthDiff = (selectedYear - startDate.getFullYear()) * 12 + (selectedMonth - startDate.getMonth());

        if (monthDiff > 0) {
            const currentInst = Number(acc.currentInstallment || 1);
            const targetInstallment = currentInst + monthDiff;
            
            const maxTotalInSeries = Math.max(
                Number(acc.totalInstallments || 0),
                ...accounts.filter(a => a.installmentId === acc.installmentId).map(a => Number(a.totalInstallments || 0))
            );

            if (targetInstallment <= maxTotalInSeries) {
                const alreadyExists = physicalRecords.some(p => 
                    p.installmentId === acc.installmentId && 
                    Number(p.currentInstallment) === targetInstallment
                );

                if (!alreadyExists) {
                    projectedInstallments.push({
                        ...acc,
                        id: `projected-${acc.id}-${monthKey}`,
                        currentInstallment: targetInstallment,
                        totalInstallments: maxTotalInSeries,
                        status: AccountStatus.PENDING,
                        paymentDate: undefined 
                    });
                }
            }
        }
    });

    const overdueRecords = accounts.filter(acc => {
        const dateStr = getSafeDateStr(acc);
        if (!dateStr || acc.status === AccountStatus.PAID || acc.id?.toString().startsWith('projected-') || acc.isInstallment || acc.isRecurrent) return false;
        
        const accMonthKey = dateStr.substring(0, 7);
        return accMonthKey < monthKey && acc.status === AccountStatus.PENDING;
    });

    return [...overdueRecords, ...physicalRecords, ...orphanAccounts, ...recurrentTemplates, ...projectedInstallments];
};
