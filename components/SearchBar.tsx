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
        { label: 'Pendentes', value: AccountStatus.PENDING },
        { label: 'Pagos', value: AccountStatus.PAID },
    ];

    return (
        <div className="bg-surface dark:bg-dark-surface p-4 rounded-2xl shadow-md mb-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:flex-1">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                    type="text"
                    placeholder="Buscar por nome ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-light dark:bg-dark-surface-light border border-transparent focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
            </div>
            <div className="flex items-center space-x-2 bg-surface-light dark:bg-dark-surface-light p-1 rounded-lg">
                {filters.map(filter => (
                    <button
                        key={filter.value}
                        onClick={() => setFilterStatus(filter.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            filterStatus === filter.value
                                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow'
                                : 'text-text-secondary dark:text-dark-text-secondary hover:bg-border-color dark:hover:bg-dark-border-color/50'
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