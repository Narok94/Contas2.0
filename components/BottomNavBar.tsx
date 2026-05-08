
import React from 'react';
import { View, Role } from '../types';
import { LayoutDashboard, Receipt, PlusCircle, Banknote, ShieldCheck } from 'lucide-react';

import { motion } from 'framer-motion';

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
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center w-full transition-all duration-300 relative group ${
            isActive ? 'text-primary' : 'text-text-muted dark:text-gray-400 hover:text-text-primary dark:hover:text-white'
        }`}
    >
        <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 scale-50'}`}>
            {label}
        </span>
        {isActive && (
            <motion.div 
                layoutId="nav-dot"
                className="absolute -bottom-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
            />
        )}
    </button>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange, onAddClick, isAdmin }) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] sm:w-[500px] h-20 bg-surface/80 dark:bg-dark-surface/70 backdrop-blur-2xl border-2 border-border-color/30 dark:border-white/10 z-40 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="h-full flex items-center justify-around px-4">
                <NavItem 
                    label="Início"
                    icon={<LayoutDashboard className="h-5 w-5" strokeWidth={activeView === 'dashboard' ? 3 : 2} />}
                    isActive={activeView === 'dashboard'}
                    onClick={() => onViewChange('dashboard')}
                />
                 <NavItem 
                    label="Contas"
                    icon={<Receipt className="h-5 w-5" strokeWidth={activeView === 'accounts' ? 3 : 2} />}
                    isActive={activeView === 'accounts'}
                    onClick={() => onViewChange('accounts')}
                />

                <div className="relative -mt-10">
                    <button 
                        onClick={onAddClick}
                        className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-[0_10px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_25px_rgba(99,102,241,0.6)] transform transition-all hover:scale-110 active:scale-90"
                        aria-label="Adicionar conta"
                    >
                         <PlusCircle className="h-8 w-8" strokeWidth={2.5} />
                    </button>
                </div>

                 <NavItem 
                    label="Entradas"
                    icon={<Banknote className="h-5 w-5" strokeWidth={activeView === 'income' ? 3 : 2} />}
                    isActive={activeView === 'income'}
                    onClick={() => onViewChange('income')}
                />
                
                {isAdmin ? (
                    <NavItem 
                        label="Admin"
                        icon={<ShieldCheck className="h-5 w-5" strokeWidth={activeView === 'admin' ? 3 : 2} />}
                        isActive={activeView === 'admin'}
                        onClick={() => onViewChange('admin')}
                    />
                ) : (
                    <div className="w-full" /> 
                )}
            </div>
        </div>
    );
};

export default BottomNavBar;
