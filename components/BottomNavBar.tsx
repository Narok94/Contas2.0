
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
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md border-t border-slate-100 dark:border-dark-border-color z-40">
            <div className="max-w-7xl mx-auto h-full grid grid-cols-5 items-center">
                <NavItem 
                    label="Início"
                    icon={<LayoutDashboard className="h-5 w-5" strokeWidth={activeView === 'dashboard' ? 2.5 : 1.5} />}
                    isActive={activeView === 'dashboard'}
                    onClick={() => onViewChange('dashboard')}
                />
                 <NavItem 
                    label="Contas"
                    icon={<Receipt className="h-5 w-5" strokeWidth={activeView === 'accounts' ? 2.5 : 1.5} />}
                    isActive={activeView === 'accounts'}
                    onClick={() => onViewChange('accounts')}
                />

                <div className="flex items-center justify-center -translate-y-4">
                    <button 
                        onClick={onAddClick}
                        className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_24px_-4px_rgba(5,150,105,0.5)] transform transition-all hover:scale-105 active:scale-95"
                        aria-label="Adicionar conta"
                    >
                         <PlusCircle className="h-7 w-7" strokeWidth={2} />
                    </button>
                </div>

                 <NavItem 
                    label="Entradas"
                    icon={<Banknote className="h-5 w-5" strokeWidth={activeView === 'income' ? 2.5 : 1.5} />}
                    isActive={activeView === 'income'}
                    onClick={() => onViewChange('income')}
                />
                
                {isAdmin ? (
                    <NavItem 
                        label="Admin"
                        icon={<ShieldCheck className="h-5 w-5" strokeWidth={activeView === 'admin' ? 2.5 : 1.5} />}
                        isActive={activeView === 'admin'}
                        onClick={() => onViewChange('admin')}
                    />
                ) : (
                    <div />
                )}
            </div>
        </div>
    );
};

export default BottomNavBar;
