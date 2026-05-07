
import React from 'react';
import { AccountStatus } from '../types';

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: AccountStatus | 'ALL';
    setFilterStatus: (status: AccountStatus | 'ALL') => void;
    filterCategory: string;
    setFilterCategory: (category: string) => void;
    filterRecurrent: boolean;
    setFilterRecurrent: (recurrent: boolean) => void;
    filterInstallment: boolean;
    setFilterInstallment: (installment: boolean) => void;
    onOpenCalculator: () => void;
    categories: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({ 
    searchTerm, 
    setSearchTerm, 
    filterStatus, 
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterRecurrent,
    setFilterRecurrent,
    filterInstallment,
    setFilterInstallment,
    onOpenCalculator,
    categories 
}) => {
    const statusFilters: { label: string; value: AccountStatus | 'ALL' }[] = [
        { label: 'Todos', value: 'ALL' },
        { label: 'Pendentes', value: AccountStatus.PENDING },
        { label: 'Pagos', value: AccountStatus.PAID },
    ];

    return (
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
            {/* Linha Única: Busca, Status e Filtros Rápidos */}
            <div className="relative w-full lg:flex-1">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                    type="text"
                    placeholder="Pesquisar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-surface-light dark:bg-dark-surface-light border border-transparent focus:border-primary focus:ring-1 focus:ring-primary/20 transition shadow-sm font-medium"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-1 bg-surface-light dark:bg-dark-surface-light p-1 rounded-lg">
                    {statusFilters.map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => setFilterStatus(filter.value)}
                            className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded shadow transition-all whitespace-nowrap ${
                                filterStatus === filter.value
                                    ? 'bg-white dark:bg-dark-surface text-primary'
                                    : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text-primary'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="appearance-none bg-surface-light dark:bg-dark-surface-light border-none text-[10px] font-bold py-1.5 pl-2 pr-6 rounded text-text-secondary dark:text-dark-text-secondary focus:ring-1 focus:ring-primary shadow-sm"
                        >
                            <option value="ALL">Categoria</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-text-muted">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <button
                        onClick={() => setFilterRecurrent(!filterRecurrent)}
                        className={`px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border ${
                            filterRecurrent 
                                ? 'bg-primary/10 border-primary/20 text-primary' 
                                : 'bg-surface-light dark:bg-dark-surface-light border-transparent text-text-muted'
                        }`}
                    >
                        Recorrentes
                    </button>

                    <button
                        onClick={() => setFilterInstallment(!filterInstallment)}
                        className={`px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border ${
                            filterInstallment 
                                ? 'bg-secondary/10 border-secondary/20 text-secondary' 
                                : 'bg-surface-light dark:bg-dark-surface-light border-transparent text-text-muted'
                        }`}
                    >
                        Parceladas
                    </button>

                    <button
                        onClick={onOpenCalculator}
                        className="p-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                        title="Calculadora"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </button>

                    {/* Botão de Limpar Filtros */}
                    {(filterCategory !== 'ALL' || filterRecurrent || filterInstallment || searchTerm !== '' || filterStatus !== 'ALL') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('ALL');
                                setFilterCategory('ALL');
                                setFilterRecurrent(false);
                                setFilterInstallment(false);
                            }}
                            className="p-1.5 text-danger font-bold text-[10px] uppercase hover:underline"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
