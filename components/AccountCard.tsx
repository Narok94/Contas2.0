import React from 'react';
import { motion } from 'framer-motion';
import { type Account, AccountStatus } from '../types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onToggleStatus: (account: Account) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete, onToggleStatus }) => {
  const isPaid = account.status === AccountStatus.PAID;
  // Removido maximumFractionDigits: 0 para mostrar centavos
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const springConfig = { 
    type: "spring", 
    stiffness: 700, 
    damping: 45, 
    mass: 0.8 
  };

  return (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
        transition={springConfig}
        onClick={() => onToggleStatus(account)}
        className={`group relative p-1.5 sm:p-3 rounded-xl sm:rounded-[1.5rem] border-2 transition-all duration-300 cursor-pointer select-none overflow-hidden h-full flex flex-col justify-between active:scale-[0.98] ${
            isPaid 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 shadow-inner ring-1 ring-emerald-400/20' 
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/30'
        }`}
    >
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-20">
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
                className={`p-1 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 ${isPaid ? 'text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-800/50' : 'text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'}`}
                title="Editar"
            >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); if(window.confirm('Apagar?')) onDelete(account.id); }} 
                className={`p-1 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 ${isPaid ? 'text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-800/50' : 'text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'}`}
                title="Excluir"
            >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {!isPaid && (
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse sm:group-hover:hidden" />
            )}
        </div>

        <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1">
                <span className={`text-[6px] sm:text-[8px] font-black px-1 py-0.5 rounded uppercase truncate max-w-full border ${isPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'}`}>
                    {account.category.split(' ')[1] || account.category}
                </span>
            </div>
            
            <div className="min-w-0 overflow-hidden">
                <h3 className={`font-bold text-[9px] sm:text-xs truncate leading-tight ${isPaid ? 'text-emerald-900 line-through decoration-emerald-500/50' : 'text-rose-900 dark:text-rose-100'}`}>
                    {account.name}
                </h3>
                <p className={`text-[10px] sm:text-base font-mono font-black tracking-tighter ${isPaid ? 'text-emerald-700' : 'text-rose-700 dark:text-rose-400'}`}>
                    {formatCurrency(account.value)}
                </p>
            </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {account.isInstallment && (
                        <span className={`text-[6px] sm:text-[8px] font-black uppercase flex items-center gap-0.5 ${isPaid ? 'text-emerald-600' : 'text-rose-400'}`}>
                            <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            {account.currentInstallment}/{account.totalInstallments}
                        </span>
                    )}
                    {account.isRecurrent && !account.isInstallment && (
                        <div className={`w-1 h-1 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-rose-400'}`} title="Recorrente" />
                    )}
                </div>
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(account); }}
                className={`w-full py-1.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-all flex-shrink-0 border font-black text-[8px] sm:text-[10px] uppercase tracking-widest active:scale-95 ${
                    isPaid 
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                        : 'bg-white dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/50'
                }`}
            >
                {isPaid ? (
                    <>
                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        <span>Pago</span>
                    </>
                ) : (
                    <>
                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        <span>Pagar</span>
                    </>
                )}
            </button>
        </div>

    </motion.div>
  );
};

export default AccountCard;