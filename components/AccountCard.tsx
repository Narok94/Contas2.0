import React from 'react';
import { motion } from 'framer-motion';
import { type Account, AccountStatus } from '../types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onToggleStatus: (accountId: string) => void;
}

const getCategoryStyles = (category: string) => {
    switch (category) {
        case 'Moradia': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
        case 'Alimentação': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
        case 'Transporte': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
        case 'Saúde': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'Luz': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
};

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete, onToggleStatus }) => {
  const isPaid = account.status === AccountStatus.PAID;
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -2 }}
        className={`group relative p-3 rounded-2xl border transition-all duration-300 ${
            isPaid 
                ? 'bg-white dark:bg-slate-900/40 border-emerald-500/30 shadow-sm' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm'
        }`}
    >
        {/* Badge de Status Pago (Sutil) */}
        {isPaid && (
            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full shadow-md z-10">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
        )}

        <div className="flex justify-between items-start">
            <div className="space-y-1.5 flex-1 pr-2">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase inline-block ${getCategoryStyles(account.category)}`}>
                    {account.category}
                </span>
                
                <div>
                    <h3 className={`font-black text-sm tracking-tight leading-tight ${isPaid ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {account.name}
                    </h3>
                    <p className={`text-base font-black mt-0.5 tracking-tight ${isPaid ? 'text-emerald-600/70' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {formatCurrency(account.value)}
                    </p>
                </div>
            </div>
            
            <button 
                onClick={() => onToggleStatus(account.id)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isPaid 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' 
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-400 hover:bg-indigo-600 hover:text-white'
                }`}
                title={isPaid ? "Marcar como pendente" : "Marcar como pago"}
            >
                {isPaid ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ) : (
                    <div className="w-5 h-5 border-2 border-current rounded-md opacity-30 group-hover:opacity-100 transition-opacity" />
                )}
            </button>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
                {account.isInstallment && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {account.currentInstallment}/{account.totalInstallments}
                    </span>
                )}
            </div>

            <div className="flex gap-1.5">
                <button 
                    onClick={() => onEdit(account)} 
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button 
                    onClick={() => { if(window.confirm('Apagar esta conta?')) onDelete(account.id); }} 
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>
        </div>
    </motion.div>
  );
};

export default AccountCard;