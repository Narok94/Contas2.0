import React, { useState, useEffect, useRef } from 'react';
import { type Account } from '../types';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: any) => void;
  account: Account | null;
  categories: string[];
  onManageCategories: () => void;
  activeGroupId: string | null;
  selectedDate: Date;
}

// Define a specific type for the form's state to improve type safety.
type AccountFormData = {
  name: string;
  category: string;
  value: string;
  isRecurrent: boolean;
  isInstallment: boolean;
  totalInstallments: string;
  paymentDate: string;
  groupId: string;
};

const AccountFormModal: React.FC<AccountFormModalProps> = ({ isOpen, onClose, onSubmit, account, categories, onManageCategories, activeGroupId, selectedDate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('2');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const initialStateRef = useRef<AccountFormData | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialGroupId = account?.groupId || activeGroupId || '';
      
      // Use selectedDate for new accounts to default to the viewed month
      const defaultDate = new Date(selectedDate);
      // Set to 10th of the month by default as per existing logic in App.tsx
      defaultDate.setDate(10);
      const defaultDateStr = defaultDate.toISOString().split('T')[0];

      const initialState: AccountFormData = account
        ? {
            name: account.name,
            category: account.category,
            value: String(account.value),
            isRecurrent: account.isRecurrent,
            isInstallment: account.isInstallment,
            totalInstallments: String(account.totalInstallments || 2),
            paymentDate: account.paymentDate ? account.paymentDate.split('T')[0] : defaultDateStr,
            groupId: initialGroupId,
          }
        : {
            name: '',
            category: categories[0] || '',
            value: '',
            isRecurrent: false,
            isInstallment: false,
            totalInstallments: '2',
            paymentDate: defaultDateStr,
            groupId: initialGroupId,
          };
      
      initialStateRef.current = initialState;
      
      setName(initialState.name);
      setCategory(initialState.category);
      setValue(initialState.value);
      setIsRecurrent(initialState.isRecurrent);
      setIsInstallment(initialState.isInstallment);
      setTotalInstallments(initialState.totalInstallments);
      setPaymentDate(initialState.paymentDate);
      setShowConfirmDialog(false); // Reset confirmation on open
    }
  }, [isOpen, account, categories, activeGroupId]);

  const hasUnsavedChanges = () => {
    if (!isOpen || !initialStateRef.current) {
        return false;
    }
    
    if (initialStateRef.current.name !== name) return true;
    if (initialStateRef.current.category !== category) return true;
    if (initialStateRef.current.value !== value) return true;
    if (initialStateRef.current.isRecurrent !== isRecurrent) return true;
    if (initialStateRef.current.isInstallment !== isInstallment) return true;
    if (isInstallment && initialStateRef.current.totalInstallments !== totalInstallments) return true;
    if (initialStateRef.current.paymentDate !== paymentDate) return true;
    
    return false;
  };
  
  const handleAttemptClose = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };
  
  const handleConfirmDiscard = () => {
    setShowConfirmDialog(false);
    onClose();
  };
  
  const handleCancelDiscard = () => {
    setShowConfirmDialog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value || !category || !activeGroupId) return;

    onSubmit({
      id: account?.id,
      name,
      category,
      value: parseFloat(value),
      isRecurrent,
      isInstallment,
      totalInstallments: isInstallment ? parseInt(totalInstallments, 10) : undefined,
      paymentDate: paymentDate ? `${paymentDate}T12:00:00Z` : undefined,
      currentInstallment: account?.currentInstallment,
      installmentId: account?.installmentId,
      groupId: account?.groupId || activeGroupId,
    });
    onClose(); 
  };
  
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" 
        onClick={handleAttemptClose}
    >
      <div 
          className="relative bg-surface dark:bg-dark-surface rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg animate-fade-in-up border border-border-color dark:border-dark-border-color" 
          onClick={e => e.stopPropagation()}
      >
        {showConfirmDialog && (
            <div className="absolute inset-0 bg-surface/90 dark:bg-dark-surface/90 backdrop-blur-md flex flex-col justify-center items-center z-10 rounded-[2.5rem] p-8 animate-fade-in text-center">
                <h3 className="text-2xl font-serif italic text-text-primary dark:text-dark-text-primary mb-4">Descartar Alterações?</h3>
                <p className="text-text-secondary dark:text-dark-text-secondary mb-8">
                    Você tem alterações não salvas. Tem certeza que quer sair e perdê-las?
                </p>
                <div className="flex flex-col w-full gap-3">
                    <button 
                        onClick={handleCancelDiscard} 
                        className="w-full py-4 rounded-2xl bg-surface-light dark:bg-dark-surface-light text-text-primary dark:text-dark-text-primary font-black uppercase text-xs tracking-widest hover:bg-surface dark:hover:bg-dark-surface transition-colors"
                    >
                        Continuar Editando
                    </button>
                    <button 
                        onClick={handleConfirmDiscard} 
                        className="w-full py-4 rounded-2xl bg-danger text-white font-black uppercase text-xs tracking-widest hover:bg-danger-dark transition-colors shadow-lg shadow-danger/20"
                    >
                        Descartar e Sair
                    </button>
                </div>
            </div>
        )}
        
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif italic text-text-primary dark:text-dark-text-primary">{account ? 'Editar Conta' : 'Nova Conta'}<span className="text-primary">.</span></h2>
            <button onClick={handleAttemptClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light dark:bg-dark-surface-light text-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="account-name" className="text-[10px] font-black uppercase text-text-muted dark:text-dark-text-muted ml-1">Nome</label>
              <input id="account-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 rounded-xl bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-text-primary dark:text-dark-text-primary" />
            </div>
            <div className="space-y-1">
              <label htmlFor="account-value" className="text-[10px] font-black uppercase text-text-muted dark:text-dark-text-muted ml-1">Valor (R$)</label>
              <input id="account-value" type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} required className="w-full p-3 rounded-xl bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-mono text-text-primary dark:text-dark-text-primary" />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="account-date" className="text-[10px] font-black uppercase text-text-muted dark:text-dark-text-muted ml-1">Data</label>
            <input id="account-date" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="w-full p-3 rounded-xl bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-text-primary dark:text-dark-text-primary" />
          </div>

          <div className="space-y-1">
            <label htmlFor="account-category" className="text-[10px] font-black uppercase text-text-muted dark:text-dark-text-muted ml-1">Categoria</label>
            <div className="flex items-center space-x-3">
                <select id="account-category" value={category} onChange={e => setCategory(e.target.value)} required className="w-full p-3 rounded-xl bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none cursor-pointer text-text-primary dark:text-dark-text-primary">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button type="button" onClick={onManageCategories} className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Gerenciar Categorias">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-4 sm:space-y-0 p-4 bg-surface-light dark:bg-dark-surface-light rounded-2xl border border-border-color dark:border-dark-border-color">
            <div className="flex items-center">
              <input id="account-recurrent" type="checkbox" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} disabled={isInstallment} className="h-5 w-5 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded-lg cursor-pointer bg-surface dark:bg-dark-surface" />
              <label htmlFor="account-recurrent" className="ml-3 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary cursor-pointer">Recorrente</label>
            </div>
            <div className="flex items-center">
              <input id="account-installment" type="checkbox" checked={isInstallment} onChange={e => { setIsInstallment(e.target.checked); if (e.target.checked) setIsRecurrent(false); }} className="h-5 w-5 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded-lg cursor-pointer bg-surface dark:bg-dark-surface" />
              <label htmlFor="account-installment" className="ml-3 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary cursor-pointer">Parcelada</label>
            </div>
          </div>

          {isInstallment && (
            <div className="animate-fade-in space-y-1">
              <label htmlFor="account-total-installments" className="text-[10px] font-black uppercase text-text-muted dark:text-dark-text-muted ml-1">Total de Parcelas</label>
              <input id="account-total-installments" type="number" min="2" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} required={isInstallment} className="w-full p-3 rounded-xl bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-text-primary dark:text-dark-text-primary" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border-color dark:border-dark-border-color">
            <button type="button" onClick={handleAttemptClose} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surface-light dark:bg-dark-surface-light text-text-secondary dark:text-dark-text-secondary font-black uppercase text-[10px] tracking-widest hover:bg-surface dark:hover:bg-dark-surface transition-colors">Cancelar</button>
            <button type="submit" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95">{account ? 'Salvar Alterações' : 'Adicionar Conta'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountFormModal;
