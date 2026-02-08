
import React from 'react';
import { View, Role } from '../types';

interface BottomNavBarProps {
    activeView: View;
    onViewChange: (view: View) => void;
    onAddClick: () => void;
    isAdmin: boolean;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full transition-all duration-300 relative ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
        <div className={`mb-0.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
            {icon}
        </div>
        <span className={`text-[6px] font-black uppercase tracking-[0.25em] ${isActive ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
        {isActive && (
            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
        )}
    </button>
);

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange, onAddClick, isAdmin }) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
            <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-full shadow-premium h-14 px-3 grid grid-cols-5 items-center border border-slate-100 dark:border-white/5">
                <NavItem 
                    label="Home"
                    icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                    isActive={activeView === 'dashboard'}
                    onClick={() => onViewChange('dashboard')}
                />
                 <NavItem 
                    label="Hist"
                    icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    isActive={activeView === 'history'}
                    onClick={() => onViewChange('history')}
                />

                <div className="flex items-center justify-center">
                    <button 
                        onClick={onAddClick}
                        className="w-11 h-11 rounded-full bg-slate-900 dark:bg-primary text-white flex items-center justify-center shadow-lg transform transition-all hover:scale-110 active:scale-95 -mt-8 border-4 border-white dark:border-background-dark"
                        aria-label="Adicionar"
                    >
                         <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                 <NavItem 
                    label="Renda"
                    icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>}
                    isActive={activeView === 'income'}
                    onClick={() => onViewChange('income')}
                />
                
                {isAdmin ? (
                    <NavItem 
                        label="Gest"
                        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>}
                        isActive={activeView === 'admin'}
                        onClick={() => onViewChange('admin')}
                    />
                ) : (
                    <div className="w-full h-1" />
                )}
            </div>
        </div>
    );
};

export default BottomNavBar;
