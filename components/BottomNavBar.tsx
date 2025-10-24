import React from 'react';
import { View } from '../App';
import { Role } from '../types';

interface BottomNavBarProps {
    activeView: View;
    onViewChange: (view: View) => void;
    onAddClick: () => void;
    onIncomeClick: () => void;
    isAdmin: boolean;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-text-muted dark:text-dark-text-muted'}`}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
    </button>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange, onAddClick, onIncomeClick, isAdmin }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-lg border-t border-border-color/50 dark:border-dark-border-color/50 z-40">
            <div className="max-w-7xl mx-auto h-full grid grid-cols-5 items-center">
                <NavItem 
                    label="Dashboard"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    isActive={activeView === 'dashboard'}
                    onClick={() => onViewChange('dashboard')}
                />
                 <NavItem 
                    label="Histórico"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    isActive={activeView === 'history'}
                    onClick={() => onViewChange('history')}
                />

                <div className="flex items-center justify-center">
                    <button 
                        onClick={onAddClick}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent text-white flex items-center justify-center shadow-lg hover:shadow-glow-primary transform transition-all hover:scale-105 active:scale-95"
                        aria-label="Adicionar conta"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                </div>

                 <NavItem 
                    label="Entradas"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    isActive={false}
                    onClick={onIncomeClick}
                />
                
                {isAdmin ? (
                    <NavItem 
                        label="Admin"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        isActive={activeView === 'admin'}
                        onClick={() => onViewChange('admin')}
                    />
                ) : (
                     <NavItem 
                        label="Admin"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        isActive={activeView === 'admin'}
                        onClick={() => onViewChange('admin')}
                    />
                )}
            </div>
        </div>
    );
};

export default BottomNavBar;