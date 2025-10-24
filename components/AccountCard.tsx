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
      onDelete(account.id);
    }
  };

  return (
    <div className="relative w-full">
       <div className="absolute inset-0 flex items-center justify-between px-4 bg-gray-100 dark:bg-dark-surface-light rounded-2xl">
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
          className={`relative rounded-2xl shadow-md p-4 border-l-4 ${cardBorderColor} ${bgColor} transition-shadow duration-300 flex flex-col justify-between cursor-grab active:cursor-grabbing active:scale-95`}
      >
        <div>
          <div className="flex items-start justify-between mb-2">
              <h3 className="text-base sm:text-lg font-bold text-text-primary dark:text-dark-text-primary break-all pr-2">{account.name}</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${isPaid ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                  {isPaid ? 'PAGO' : 'PENDENTE'}
              </span>
          </div>
          <p className="text-xl sm:text-2xl font-light text-text-primary dark:text-dark-text-primary">{formatCurrency(account.value)}</p>
          <div className="text-sm text-text-muted dark:text-dark-text-muted mt-2 space-y-1">
            <p>Categoria: {account.category}</p>
            {account.isRecurrent && <p className="font-medium">Recorrente</p>}
            {account.isInstallment && <p className="font-medium">Parcela {account.currentInstallment}/{account.totalInstallments}</p>}
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-2 mt-4">
          <button onClick={() => onEdit(account)} title="Editar" className="p-2 rounded-full hover:bg-primary/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-light" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountCard;