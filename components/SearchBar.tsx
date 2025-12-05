
import React from 'react';
import { AccountStatus } from '../types';

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: AccountStatus | 'ALL';
    setFilterStatus: (status: AccountStatus | 'ALL') => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
    const filters: { label: string; value: AccountStatus | 'ALL' }[] = [
        { label: 'Todos', value: 'ALL' },
        { label: 'Pendente', value: AccountStatus.PENDING },
        { label: 'Pago', value: AccountStatus.PAID },
    ];

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="relative w-full flex-1">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-surface-light dark:bg-dark-surface-light border border-transparent focus:border-primary focus:ring-1 focus:ring-primary transition shadow-inner"
                />
            </div>
            <div className="flex items-center gap-1 bg-surface-light dark:bg-dark-surface-light p-1 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
                {filters.map(filter => (
                    <button
                        key={filter.value}
                        onClick={() => setFilterStatus(filter.value)}
                        className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
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
    );
};

export default SearchBar;
