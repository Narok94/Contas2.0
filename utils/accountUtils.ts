
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
    
    const physicalRecords = accounts.filter(acc => acc.paymentDate?.startsWith(monthKey));
    const orphanAccounts = accounts.filter(acc => !acc.paymentDate && !acc.isRecurrent && !acc.isInstallment);

    const recurrentTemplates = accounts.filter(acc => 
        acc.isRecurrent && 
        !acc.paymentDate &&
        !physicalRecords.some(p => p.name === acc.name && p.category === acc.category)
    );

    const projectedInstallments: Account[] = [];
    const seriesAnchors = new Map<string, Account>();
    
    accounts.forEach(acc => {
        if (acc.isInstallment && acc.paymentDate) {
            const anchorKey = acc.installmentId || `legacy-${acc.name}`;
            const current = seriesAnchors.get(anchorKey);
            if (!current || new Date(acc.paymentDate) > new Date(current.paymentDate!)) {
                seriesAnchors.set(anchorKey, acc);
            }
        }
    });

    seriesAnchors.forEach((acc) => {
        const startDate = new Date(acc.paymentDate!);
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

    return [...physicalRecords, ...orphanAccounts, ...recurrentTemplates, ...projectedInstallments];
};
