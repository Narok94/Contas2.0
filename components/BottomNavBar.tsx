
import React from 'react';
import { View, Role } from '../types';
import { LayoutDashboard, Receipt, PlusCircle, Banknote, ShieldCheck } from 'lucide-react';

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
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-text-muted dark:text-dark-text-muted'}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">{label}</span>
    </button>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange, onAddClick, isAdmin }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-lg border-t border-border-color/50 dark:border-dark-border-color/50 z-40">
            <div className="max-w-7xl mx-auto h-full grid grid-cols-5 items-center">
                <NavItem 
                    label="Início"
                    icon={<LayoutDashboard className="h-4 w-4" strokeWidth={activeView === 'dashboard' ? 2.5 : 1.5} />}
                    isActive={activeView === 'dashboard'}
                    onClick={() => onViewChange('dashboard')}
                />
                 <NavItem 
                    label="Contas"
                    icon={<Receipt className="h-4 w-4" strokeWidth={activeView === 'accounts' ? 2.5 : 1.5} />}
                    isActive={activeView === 'accounts'}
                    onClick={() => onViewChange('accounts')}
                />

                <div className="flex items-center justify-center">
                    <button 
                        onClick={onAddClick}
                        className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:shadow-glow-primary transform transition-all hover:scale-105 active:scale-95"
                        aria-label="Adicionar conta"
                    >
                         <PlusCircle className="h-6 w-6" strokeWidth={2} />
                    </button>
                </div>

                 <NavItem 
                    label="Entradas"
                    icon={<Banknote className="h-4 w-4" strokeWidth={activeView === 'income' ? 2.5 : 1.5} />}
                    isActive={activeView === 'income'}
                    onClick={() => onViewChange('income')}
                />
                
                {isAdmin ? (
                    <NavItem 
                        label="Admin"
                        icon={<ShieldCheck className="h-4 w-4" strokeWidth={activeView === 'admin' ? 2.5 : 1.5} />}
                        isActive={activeView === 'admin'}
                        onClick={() => onViewChange('admin')}
                    />
                ) : (
                    <div /> // Placeholder to keep the layout consistent
                )}
            </div>
        </div>
    );
};

export default BottomNavBar;
