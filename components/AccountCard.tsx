
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
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className={`relative p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-[135px] sm:h-[155px] ${
            isPaid 
                ? 'bg-status-paid-light dark:bg-status-paid-dark border-emerald-200 dark:border-emerald-500/20' 
                : 'bg-status-unpaid-light dark:bg-status-unpaid-dark border-rose-200 dark:border-rose-500/20 shadow-sm'
        }`}
    >
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between">
            <span className={`text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tight ${
                isPaid 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
            }`}>
                {account.category.split(' ')[1] || account.category}
            </span>
            
            <div className="flex gap-0.5">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
                    className="p-1 text-slate-400 hover:text-primary transition-colors"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5} /></svg>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); if(window.confirm('Excluir?')) onDelete(account.id); }} 
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                </button>
            </div>
        </div>

        {/* Informações Principais */}
        <div className="flex-1 flex flex-col justify-center py-1">
            <h3 className={`text-[9px] sm:text-[11px] font-bold truncate leading-tight ${isPaid ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {account.name}
            </h3>
            <p className={`text-sm sm:text-xl font-black tracking-tighter leading-none m-0 shadow-none ${
                isPaid ? 'text-emerald-700/40 dark:text-emerald-500/30' : 'text-slate-900 dark:text-white'
            }`}>
                {formatCurrency(account.value)}
            </p>
            {account.isInstallment && (
                <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">
                    {account.currentInstallment}/{account.totalInstallments}
                </span>
            )}
        </div>

        {/* Botão de Ação Inferior */}
        <div className="mt-1">
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(account.id); }}
                className={`w-full py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all font-bold text-[9px] uppercase tracking-wider active:scale-95 border ${
                    isPaid 
                        ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400' 
                        : 'bg-primary text-white border-primary shadow-sm hover:brightness-110'
                }`}
            >
                {isPaid ? (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>
                        <span>Voltar</span>
                    </>
                ) : (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        <span>Pagar Agora</span>
                    </>
                )}
            </button>
        </div>
    </motion.div>
  );
};

export default AccountCard;
