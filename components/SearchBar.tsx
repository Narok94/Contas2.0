
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
    categories 
}) => {
    const statusFilters: { label: string; value: AccountStatus | 'ALL' }[] = [
        { label: 'Todos', value: 'ALL' },
        { label: 'Pendentes', value: AccountStatus.PENDING },
        { label: 'Pagos', value: AccountStatus.PAID },
    ];

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Primeira Linha: Busca por Nome e Status Principal */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full flex-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-surface-light dark:bg-dark-surface-light border border-transparent focus:border-primary focus:ring-1 focus:ring-primary transition shadow-inner font-medium"
                    />
                </div>
                <div className="flex items-center gap-1 bg-surface-light dark:bg-dark-surface-light p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {statusFilters.map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => setFilterStatus(filter.value)}
                            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                                filterStatus === filter.value
                                    ? 'bg-white dark:bg-dark-surface text-primary shadow-sm'
                                    : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text-primary'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Segunda Linha: Filtros de Categoria e Toggles */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {/* Seletor de Categoria */}
                <div className="relative shrink-0">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="appearance-none bg-surface-light dark:bg-dark-surface-light border-none text-[11px] font-bold py-2 pl-3 pr-8 rounded-lg text-text-secondary dark:text-dark-text-secondary focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
                    >
                        <option value="ALL">Todas Categorias</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {/* Chips de Filtro Rápido */}
                <button
                    onClick={() => setFilterRecurrent(!filterRecurrent)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border ${
                        filterRecurrent 
                            ? 'bg-primary/10 border-primary/30 text-primary' 
                            : 'bg-surface-light dark:bg-dark-surface-light border-transparent text-text-muted hover:border-border-color'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Recorrentes
                </button>

                <button
                    onClick={() => setFilterInstallment(!filterInstallment)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border ${
                        filterInstallment 
                            ? 'bg-secondary/10 border-secondary/30 text-secondary' 
                            : 'bg-surface-light dark:bg-dark-surface-light border-transparent text-text-muted hover:border-border-color'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Parceladas
                </button>

                {/* Botão de Limpar Filtros (só aparece se houver filtros ativos além do padrão) */}
                {(filterCategory !== 'ALL' || filterRecurrent || filterInstallment || searchTerm !== '' || filterStatus !== 'ALL') && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('ALL');
                            setFilterCategory('ALL');
                            setFilterRecurrent(false);
                            setFilterInstallment(false);
                        }}
                        className="shrink-0 px-2 py-2 text-[10px] font-black text-danger uppercase tracking-tight hover:underline"
                    >
                        Limpar
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
