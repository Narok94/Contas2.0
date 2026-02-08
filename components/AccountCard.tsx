import React from 'react';
import { motion } from 'framer-motion';
import { type Account, AccountStatus } from '../types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onToggleStatus: (accountId: string) => void;
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
        onDoubleClick={() => onToggleStatus(account.id)}
        className={`group relative p-1.5 sm:p-3 rounded-xl sm:rounded-[1.5rem] border-2 transition-colors duration-200 cursor-pointer select-none overflow-hidden h-full flex flex-col justify-between ${
            isPaid 
                ? 'bg-slate-50/40 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800 opacity-60' 
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 border-l-[4px] border-l-rose-500 shadow-sm hover:shadow-md hover:border-slate-400 dark:hover:border-slate-500'
        }`}
    >
        {!isPaid && (
            <div className="absolute top-1 right-1 flex gap-0.5">
                <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-rose-500 animate-pulse" />
            </div>
        )}

        <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1">
                <span className={`text-[6px] sm:text-[8px] font-black px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 uppercase truncate max-w-full border border-slate-200 dark:border-slate-600`}>
                    {account.category.split(' ')[1] || account.category}
                </span>
            </div>
            
            <div className="min-w-0 overflow-hidden">
                <h3 className={`font-bold text-[9px] sm:text-xs truncate leading-tight ${isPaid ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                    {account.name}
                </h3>
                <p className={`text-[10px] sm:text-base font-black tracking-tighter ${isPaid ? 'text-emerald-600/50' : 'text-slate-900 dark:text-white'}`}>
                    {formatCurrency(account.value)}
                </p>
            </div>
        </div>

        <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-1">
                {account.isInstallment && (
                    <span className="text-[6px] sm:text-[8px] font-black text-slate-400 uppercase flex items-center gap-0.5">
                        <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {account.currentInstallment}/{account.totalInstallments}
                    </span>
                )}
                {account.isRecurrent && !account.isInstallment && (
                    <div className="w-1 h-1 rounded-full bg-indigo-400" title="Recorrente" />
                )}
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(account.id); }}
                className={`w-5 h-5 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm border border-transparent active:scale-90 ${
                    isPaid 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
            >
                {isPaid ? (
                    <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                ) : (
                    <svg className="w-2 h-2 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                )}
            </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 py-1 bg-slate-900/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto border-t border-slate-700">
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
                className="p-1 text-white hover:text-indigo-400 transition-colors"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); if(window.confirm('Apagar?')) onDelete(account.id); }} 
                className="p-1 text-rose-400 transition-colors"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
        </div>
    </motion.div>
  );
};

export default AccountCard;