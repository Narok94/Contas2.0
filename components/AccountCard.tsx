
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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -1 }}
        className={`group relative p-2.5 rounded-xl border-2 transition-all duration-300 ${
            isPaid 
                ? 'bg-white/80 dark:bg-slate-900/40 border-emerald-500/10 shadow-sm' 
                : 'bg-white dark:bg-slate-800 border-rose-500/20 border-l-[3px] shadow-sm'
        }`}
    >
        {/* Badge de Alerta para Pendentes mais discreto */}
        {!isPaid && (
            <div className="absolute -top-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full shadow-md z-10 animate-pulse">
                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
        )}

        <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase tracking-tight`}>
                        {account.category.split(' ')[0]}
                    </span>
                    <h3 className={`font-bold text-[11px] truncate ${isPaid ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                        {account.name}
                    </h3>
                </div>
                
                <p className={`text-sm font-black tracking-tight ${isPaid ? 'text-emerald-600/60' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(account.value)}
                </p>
            </div>
            
            <div className="flex items-center gap-1">
                <button 
                    onClick={() => onToggleStatus(account.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isPaid 
                            ? 'text-emerald-500' 
                            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white'
                    }`}
                >
                    {isPaid ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    ) : (
                        <div className="font-black text-[9px]">OK</div>
                    )}
                </button>

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button onClick={() => onEdit(account)} className="p-1 text-slate-400 hover:text-indigo-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button onClick={() => { if(window.confirm('Apagar?')) onDelete(account.id); }} className="p-1 text-slate-400 hover:text-rose-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </div>
        </div>

        {(account.isInstallment || account.isRecurrent) && (
            <div className="mt-1 flex items-center gap-2">
                {account.isInstallment && (
                    <span className="text-[7px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-1 rounded uppercase">
                        PARC {account.currentInstallment}/{account.totalInstallments}
                    </span>
                )}
                {account.isRecurrent && (
                    <span className="text-[7px] font-black text-indigo-400/60 uppercase">Fixa</span>
                )}
            </div>
        )}
    </motion.div>
  );
};

export default AccountCard;
