
import React, { useState, useEffect, useRef } from 'react';
import { type Account, type User, type Group } from '../types';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: any) => void;
  account: Account | null;
  categories: string[];
  onManageCategories: () => void;
  currentUser: User | null;
  groups: Group[];
}

// Define a specific type for the form's state to improve type safety.
type AccountFormData = {
  name: string;
  category: string;
  value: string;
  isRecurrent: boolean;
  isInstallment: boolean;
  totalInstallments: string;
  groupId: string;
};

const AccountFormModal: React.FC<AccountFormModalProps> = ({ isOpen, onClose, onSubmit, account, categories, onManageCategories, currentUser, groups }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('2');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [groupId, setGroupId] = useState('');
  
  const initialStateRef = useRef<AccountFormData | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialGroupId = account?.groupId || (currentUser?.groupIds?.[0] || '');
      setGroupId(initialGroupId);

      const initialState: AccountFormData = account
        ? {
            name: account.name,
            category: account.category,
            value: String(account.value),
            isRecurrent: account.isRecurrent,
            isInstallment: account.isInstallment,
            totalInstallments: String(account.totalInstallments || 2),
            groupId: initialGroupId,
          }
        : {
            name: '',
            category: categories[0] || '',
            value: '',
            isRecurrent: false,
            isInstallment: false,
            totalInstallments: '2',
            groupId: initialGroupId,
          };
      
      initialStateRef.current = initialState;
      
      setName(initialState.name);
      setCategory(initialState.category);
      setValue(initialState.value);
      setIsRecurrent(initialState.isRecurrent);
      setIsInstallment(initialState.isInstallment);
      setTotalInstallments(initialState.totalInstallments);
      setShowConfirmDialog(false); // Reset confirmation on open
    }
  }, [isOpen, account, categories, currentUser]);

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
    if (initialStateRef.current.groupId !== groupId) return true;
    
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
    if (!name || !value || !category || !groupId) return;

    onSubmit({
      id: account?.id,
      name,
      category,
      value: parseFloat(value),
      isRecurrent,
      isInstallment,
      totalInstallments: isInstallment ? parseInt(totalInstallments, 10) : undefined,
      currentInstallment: account?.currentInstallment,
      installmentId: account?.installmentId,
      groupId,
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
          className="relative bg-surface dark:bg-dark-surface rounded-2xl shadow-xl p-6 w-full max-w-lg animate-fade-in-up" 
          onClick={e => e.stopPropagation()}
      >
        {showConfirmDialog && (
            <div className="absolute inset-0 bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm flex flex-col justify-center items-center z-10 rounded-2xl p-4 animate-fade-in">
                <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Descartar Alterações?</h3>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-6 max-w-xs">
                        Você tem alterações não salvas. Tem certeza que quer sair e perdê-las?
                    </p>
                    <div className="flex justify-center space-x-4">
                        <button 
                            onClick={handleCancelDiscard} 
                            className="px-6 py-2 rounded-md bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color transition-colors font-semibold"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirmDiscard} 
                            className="px-6 py-2 rounded-md bg-danger text-white hover:opacity-90 transition-opacity font-semibold"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{account ? 'Editar Conta' : 'Nova Conta'}</h2>
            <button onClick={handleAttemptClose} className="text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary text-3xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="account-name" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Nome</label>
              <input id="account-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label htmlFor="account-value" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Valor (R$)</label>
              <input id="account-value" type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} required className="mt-1 w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary" />
            </div>
          </div>
           {currentUser && currentUser.groupIds.length > 1 && (
                <div>
                    <label htmlFor="account-group" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Grupo</label>
                    <select id="account-group" value={groupId} onChange={e => setGroupId(e.target.value)} required className="mt-1 w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary">
                        {currentUser.groupIds.map(gid => {
                            const group = groups.find(g => g.id === gid);
                            return group ? <option key={gid} value={gid}>{group.name}</option> : null;
                        })}
                    </select>
                </div>
            )}
          <div>
            <label htmlFor="account-category" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Categoria</label>
            <div className="flex items-center space-x-2 mt-1">
                <select id="account-category" value={category} onChange={e => setCategory(e.target.value)} required className="w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button type="button" onClick={onManageCategories} className="p-2 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors" title="Gerenciar Categorias">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <input id="account-recurrent" type="checkbox" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} disabled={isInstallment} className="h-4 w-4 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded" />
              <label htmlFor="account-recurrent" className="ml-2 block text-sm text-text-secondary dark:text-dark-text-secondary">Conta Recorrente</label>
            </div>
            <div className="flex items-center">
              <input id="account-installment" type="checkbox" checked={isInstallment} onChange={e => { setIsInstallment(e.target.checked); if (e.target.checked) setIsRecurrent(false); }} className="h-4 w-4 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded" />
              <label htmlFor="account-installment" className="ml-2 block text-sm text-text-secondary dark:text-dark-text-secondary">É Parcelada?</label>
            </div>
          </div>
          {isInstallment && (
            <div className="animate-fade-in">
              <label htmlFor="account-total-installments" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Total de Parcelas</label>
              <input id="account-total-installments" type="number" min="2" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} required={isInstallment} className="mt-1 w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:ring-1 focus:ring-primary focus:border-primary" />
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-border-color dark:border-dark-border-color">
            <button type="button" onClick={handleAttemptClose} className="px-4 py-2 rounded-md bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity">{account ? 'Salvar Alterações' : 'Adicionar Conta'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountFormModal;