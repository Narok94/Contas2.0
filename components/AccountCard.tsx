
import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { type Account, AccountStatus } from '../types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onToggleStatus: (accountId: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete, onToggleStatus }) => {
  const isPaid = account.status === AccountStatus.PAID;
  const cardBorderColor = isPaid ? 'border-success' : 'border-danger';
  const bgColor = 'bg-surface dark:bg-dark-surface';
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      onToggleStatus(account.id);
    } else if (info.offset.x < -swipeThreshold) {
      if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
        onDelete(account.id);
      }
    }
  };

  return (
    <div className="relative w-full">
       {/* Background actions for Swipe */}
       <div className="absolute inset-0 flex items-center justify-between px-4 bg-gray-100 dark:bg-dark-surface-light rounded-2xl">
        <div className="flex items-center space-x-2 text-success">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          <span className="text-xs font-bold uppercase">{isPaid ? 'Estornar' : 'Pagar'}</span>
        </div>
        <div className="flex items-center space-x-2 text-danger">
          <span className="text-xs font-bold uppercase">Apagar</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        </div>
      </div>

       <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className={`relative rounded-2xl shadow-sm p-3.5 border-l-[6px] ${cardBorderColor} ${bgColor} transition-all active:scale-[0.97] cursor-grab active:cursor-grabbing select-none group h-full flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`text-xs font-black uppercase tracking-tight line-clamp-2 leading-tight ${isPaid ? 'text-text-muted line-through opacity-70' : 'text-text-primary dark:text-dark-text-primary'}`}>
                {account.name}
              </h3>
              {!isPaid && (
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0 mt-0.5"></div>
              )}
          </div>
          
          <p className={`text-lg font-black tracking-tighter ${isPaid ? 'text-text-muted opacity-60' : 'text-primary'}`}>
            {formatCurrency(account.value)}
          </p>

          <div className="mt-2 flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 bg-surface-light dark:bg-dark-surface-light text-[9px] font-bold text-text-muted rounded-md uppercase">
                {account.category}
            </span>
            {account.isRecurrent && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-md uppercase">Recorrente</span>
            )}
            {account.isInstallment && (
                <span className="px-1.5 py-0.5 bg-secondary/10 text-secondary text-[9px] font-bold rounded-md uppercase">{account.currentInstallment}/{account.totalInstallments}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-color/30 dark:border-dark-border-color/30">
            <button
                onClick={(e) => { e.stopPropagation(); onToggleStatus(account.id); }}
                className={`text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all ${
                    isPaid 
                        ? 'bg-success/10 text-success hover:bg-success hover:text-white' 
                        : 'bg-danger text-white hover:bg-danger-dark shadow-sm shadow-danger/20'
                }`}
            >
                {isPaid ? 'Pago ✅' : 'Pagar'}
            </button>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(account); }}
                    className="p-1.5 text-text-muted hover:text-primary transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); if(window.confirm('Excluir conta?')) onDelete(account.id); }}
                    className="p-1.5 text-text-muted hover:text-danger transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountCard;
