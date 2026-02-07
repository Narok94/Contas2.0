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

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -2 }}
        className={`group relative p-4 rounded-3xl border-2 transition-all duration-300 ${
            isPaid 
                ? 'bg-white dark:bg-slate-900/40 border-emerald-500/20 shadow-sm' 
                : 'bg-white dark:bg-slate-800 border-rose-500/40 border-l-8 shadow-md'
        }`}
    >
        {/* Badge de Alerta para Pendentes */}
        {!isPaid && (
            <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg z-10 animate-pulse">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
        )}

        <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1 pr-2">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl tracking-wider uppercase inline-block ${
                    isPaid ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                }`}>
                    {account.category}
                </span>
                
                <div>
                    <h3 className={`font-black text-sm tracking-tight leading-tight ${isPaid ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {account.name}
                    </h3>
                    <p className={`text-lg font-black mt-1 tracking-tighter ${isPaid ? 'text-emerald-600/70' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(account.value)}
                    </p>
                </div>
            </div>
            
            <button 
                onClick={() => onToggleStatus(account.id)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isPaid 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 shadow-inner' 
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white shadow-sm'
                }`}
                title={isPaid ? "Marcar como pendente" : "Marcar como pago"}
            >
                {isPaid ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ) : (
                    <div className="w-6 h-6 border-2 border-current rounded-lg flex items-center justify-center font-black text-[10px]">OK</div>
                )}
            </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
                {account.isInstallment && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {account.currentInstallment}/{account.totalInstallments}
                    </span>
                )}
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={() => onEdit(account)} 
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button 
                    onClick={() => { if(window.confirm('Apagar esta conta?')) onDelete(account.id); }} 
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>
        </div>
    </motion.div>
  );
};

export default AccountCard;