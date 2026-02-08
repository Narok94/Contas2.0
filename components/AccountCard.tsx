
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
        className={`relative p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between h-[145px] sm:h-[165px] ${
            isPaid 
                ? 'bg-status-paid-light dark:bg-status-paid-dark border-status-paid-border dark:border-emerald-500/20' 
                : 'bg-status-unpaid-light dark:bg-status-unpaid-dark border-status-unpaid-border dark:border-rose-500/20'
        }`}
    >
        {/* Cabeçalho do Card: Tag e Ações */}
        <div className="flex items-start justify-between">
            <span className={`text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded border-2 uppercase tracking-tight ${
                isPaid 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
            }`}>
                {account.category.split(' ')[1] || account.category}
            </span>
            
            <div className="flex gap-1">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
                    className="p-1 text-slate-500 hover:text-primary transition-colors bg-white/50 dark:bg-transparent rounded-lg"
                    title="Editar"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={3} /></svg>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); if(window.confirm('Excluir?')) onDelete(account.id); }} 
                    className="p-1 text-slate-500 hover:text-rose-600 transition-colors bg-white/50 dark:bg-transparent rounded-lg"
                    title="Excluir"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={3}/></svg>
                </button>
            </div>
        </div>

        {/* Nome e Valor */}
        <div className="flex-1 flex flex-col justify-center py-1">
            <h3 className={`text-[9px] sm:text-[11px] font-bold truncate leading-tight mb-0.5 ${isPaid ? 'text-slate-600 dark:text-slate-500' : 'text-slate-900 dark:text-slate-200'}`}>
                {account.name}
            </h3>
            <p className={`text-base sm:text-2xl font-black tracking-tighter leading-none m-0 ${
                isPaid ? 'text-emerald-700/60 dark:text-emerald-500/30 line-through' : 'text-slate-900 dark:text-white'
            }`}>
                {formatCurrency(account.value)}
            </p>
            {account.isInstallment && (
                <span className={`text-[7px] sm:text-[8px] font-black uppercase mt-1 ${isPaid ? 'text-emerald-600/50' : 'text-slate-500'}`}>
                    {account.currentInstallment}/{account.totalInstallments}
                </span>
            )}
        </div>

        {/* Botão de Ação Inferior Grande */}
        <div className="mt-1">
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(account.id); }}
                className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest active:scale-95 border-2 ${
                    isPaid 
                        ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-primary hover:text-primary'
                }`}
            >
                {isPaid ? (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>
                        <span>Voltar</span>
                    </>
                ) : (
                    <>
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Pagar Agora</span>
                    </>
                )}
            </button>
        </div>
    </motion.div>
  );
};

export default AccountCard;
