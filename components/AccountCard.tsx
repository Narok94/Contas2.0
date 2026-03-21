import React from 'react';
import { motion } from 'framer-motion';
import { type Account, AccountStatus } from '../types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onToggleStatus: (account: Account) => void;
  onNotifyWhatsApp?: (account: Account) => void;
  whatsappEnabled?: boolean;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete, onToggleStatus, onNotifyWhatsApp, whatsappEnabled }) => {
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
        className={`group relative p-1.5 sm:p-3 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer select-none overflow-hidden h-full flex flex-col justify-between active:scale-[0.98] ${
            isPaid 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 shadow-inner ring-1 ring-emerald-400/20' 
                : 'bg-white dark:bg-dark-surface border-border-color dark:border-dark-border-color shadow-sm hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary/5'
        }`}
    >
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-20">
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
                className={`p-1 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 ${isPaid ? 'text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-800/50' : 'text-primary hover:text-primary-dark dark:hover:text-primary-light hover:bg-primary/10'}`}
                title="Editar"
            >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); if(window.confirm('Apagar?')) onDelete(account.id); }} 
                className={`p-1 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 ${isPaid ? 'text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-800/50' : 'text-danger hover:text-danger-dark dark:hover:text-danger-light hover:bg-danger/10'}`}
                title="Excluir"
            >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {!isPaid && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse sm:group-hover:hidden" />
            )}
        </div>

        <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1">
                <span className={`text-[6px] sm:text-[8px] font-black px-1 py-0.5 rounded uppercase truncate max-w-full border ${isPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-primary/10 text-primary border-primary/20'}`}>
                    {account.category.split(' ')[1] || account.category}
                </span>
            </div>
            
            <div className="min-w-0 overflow-hidden">
                <h3 className={`font-bold text-[9px] sm:text-xs truncate leading-tight ${isPaid ? 'text-emerald-900 line-through decoration-emerald-500/50' : 'text-slate-900 dark:text-white'}`}>
                    {account.name}
                </h3>
                <p className={`text-[10px] sm:text-base font-mono font-black tracking-tighter ${isPaid ? 'text-emerald-700' : 'text-primary'}`}>
                    {formatCurrency(account.value)}
                </p>
            </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {account.isInstallment && (
                        <span className={`text-[6px] sm:text-[8px] font-black uppercase flex items-center gap-0.5 ${isPaid ? 'text-emerald-600' : 'text-primary/60'}`}>
                            <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            {account.currentInstallment}/{account.totalInstallments}
                        </span>
                    )}
                    {account.isRecurrent && !account.isInstallment && (
                        <div className={`w-1 h-1 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-primary/40'}`} title="Recorrente" />
                    )}
                </div>
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(account); }}
                className={`w-full py-1.5 sm:py-2 rounded-xl flex items-center justify-center gap-2 transition-all flex-shrink-0 border font-black text-[8px] sm:text-[10px] uppercase tracking-widest active:scale-95 ${
                    isPaid 
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                        : 'bg-white dark:bg-dark-surface text-primary border-primary/30 hover:bg-primary/10'
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

            {isPaid && whatsappEnabled && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onNotifyWhatsApp?.(account); }}
                    className="w-full py-1.5 sm:py-2 rounded-xl flex items-center justify-center gap-2 transition-all flex-shrink-0 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white active:scale-95"
                >
                    <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span>Notificar</span>
                </button>
            )}
        </div>

    </motion.div>
  );
};

export default AccountCard;
