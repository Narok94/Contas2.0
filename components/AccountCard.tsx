
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
    <div className="relative w-full h-full">
       <div className="absolute inset-0 flex items-center justify-between px-4 bg-gray-100 dark:bg-dark-surface-light rounded-xl">
        {/* Swipe Right Action */}
        <div className="flex items-center space-x-2 text-success">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          <span>{isPaid ? 'Desfazer' : 'Pagar'}</span>
        </div>
        {/* Swipe Left Action */}
        <div className="flex items-center space-x-2 text-danger">
          <span>Excluir</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        </div>
      </div>
       <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className={`relative rounded-xl shadow-sm p-3 border-l-4 ${cardBorderColor} ${bgColor} transition-shadow duration-300 flex flex-col justify-between cursor-grab active:cursor-grabbing active:scale-95 h-full select-none`}
      >
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm font-bold text-text-primary dark:text-dark-text-primary break-all pr-1 line-clamp-2">{account.name}</h3>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    isPaid
                      ? 'bg-success/20 text-success'
                      : 'bg-danger/10 text-danger'
                 }`}>
                  {isPaid ? 'Pago' : 'Pendente'}
               </span>
          </div>
          <p className="text-lg font-light text-text-primary dark:text-dark-text-primary mb-1">{formatCurrency(account.value)}</p>
          <div className="text-[10px] text-text-muted dark:text-dark-text-muted space-y-0.5">
            <p className="flex items-center gap-1">
                <span className="opacity-70">Cat:</span> {account.category}
            </p>
            {account.isRecurrent && <p className="font-medium text-primary/80">Recorrente</p>}
            {account.isInstallment && <p className="font-medium text-secondary/80">Parcela {account.currentInstallment}/{account.totalInstallments}</p>}
             {isPaid && account.paymentDate && (
                <p className="opacity-60 mt-0.5">
                    Pago: {new Date(account.paymentDate).toLocaleDateString('pt-BR')}
                </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-color/50 dark:border-dark-border-color/50">
           <button
             onClick={(e) => { e.stopPropagation(); onToggleStatus(account.id); }}
             className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95 ${
                isPaid
                  ? 'bg-success text-white hover:bg-success/90 shadow-success/20'
                  : 'bg-white dark:bg-dark-surface-light text-text-primary dark:text-dark-text-primary border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary'
             }`}
           >
              {isPaid ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Pago
                  </>
              ) : (
                  'Pagar'
              )}
           </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
            title="Editar" 
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-dark-surface-light text-text-secondary dark:text-dark-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
          </button>
          
           <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                if(window.confirm('Tem certeza que deseja excluir esta conta?')) {
                    onDelete(account.id); 
                }
            }} 
            title="Excluir" 
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-dark-surface-light text-text-secondary dark:text-dark-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountCard;
