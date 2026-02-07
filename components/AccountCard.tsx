
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
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Transição snappier para evitar a sensação de "agarrado"
  const springConfig = { type: "spring", stiffness: 500, damping: 40, mass: 1 };

  return (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
        transition={springConfig}
        onDoubleClick={() => onToggleStatus(account.id)}
        className={`group relative p-3.5 rounded-[1.8rem] border-2 transition-colors duration-200 cursor-pointer select-none overflow-hidden ${
            isPaid 
                ? 'bg-slate-50/50 dark:bg-slate-900/20 border-emerald-500/5 opacity-70' 
                : 'bg-white dark:bg-slate-800 border-rose-500/10 border-l-[5px] border-l-rose-500 shadow-sm hover:shadow-md'
        }`}
    >
        {/* Indicador de status no topo (discreto) */}
        {!isPaid && (
            <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
        )}

        <div className="flex justify-between items-start gap-3">
            <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg tracking-wider uppercase inline-block ${
                        isPaid ? 'bg-slate-200/50 text-slate-500 dark:bg-slate-800/50' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                    }`}>
                        {account.category.split(' ')[1] || account.category}
                    </span>
                    {account.isRecurrent && (
                        <span className="text-[9px] font-black text-indigo-500/70 uppercase">Fixo</span>
                    )}
                </div>
                
                <div className="min-w-0">
                    <h3 className={`font-bold text-sm truncate ${isPaid ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                        {account.name}
                    </h3>
                    <p className={`text-lg font-black tracking-tighter mt-0.5 ${isPaid ? 'text-emerald-600/60' : 'text-slate-900 dark:text-white'}`}>
                        {formatCurrency(account.value)}
                    </p>
                </div>
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(account.id); }}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm active:scale-90 ${
                    isPaid 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-rose-500 hover:text-white'
                }`}
            >
                {isPaid ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                )}
            </button>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100/50 dark:border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
                {account.isInstallment && (
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {account.currentInstallment}/{account.totalInstallments}
                    </span>
                )}
            </div>

            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
                    className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); if(window.confirm('Apagar esta conta?')) onDelete(account.id); }} 
                    className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>
        </div>
    </motion.div>
  );
};

export default AccountCard;
