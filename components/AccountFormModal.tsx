import React, { useState, useEffect } from 'react';
import { type Account } from '../types';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: any) => void;
  account: Account | null;
  categories: string[];
  onManageCategories: () => void;
}

const AccountFormModal: React.FC<AccountFormModalProps> = ({ isOpen, onClose, onSubmit, account, categories, onManageCategories }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [value, setValue] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('2');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setCategory(account.category);
      setValue(String(account.value));
      setIsRecurrent(account.isRecurrent);
      setIsInstallment(account.isInstallment);
      setTotalInstallments(String(account.totalInstallments || 2));
    } else {
      // Reset form
      setName('');
      setCategory(categories[0] || '');
      setValue('');
      setIsRecurrent(false);
      setIsInstallment(false);
      setTotalInstallments('2');
    }
  }, [account, isOpen, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: account?.id,
      name,
      category,
      value: parseFloat(value),
      isRecurrent,
      isInstallment,
      totalInstallments: isInstallment ? parseInt(totalInstallments, 10) : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-surface dark:bg-dark-surface rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-full overflow-y-auto animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{account ? 'Editar Conta' : 'Adicionar Nova Conta'}</h2>
          <button onClick={onClose} className="text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary text-3xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Nome da Conta</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="value" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Valor (R$)</label>
                <input type="number" id="value" value={value} onChange={e => setValue(e.target.value)} required step="0.01" className="mt-1 block w-full bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
             <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Categoria</label>
                 <div className="flex items-center gap-2 mt-1">
                    <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="block w-full bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary h-[42px]">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button type="button" onClick={onManageCategories} title="Gerenciar categorias" className="flex-shrink-0 p-2 rounded-md bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color transition-colors h-[42px]">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex items-center">
              <input id="recurrent" type="checkbox" checked={isRecurrent} onChange={e => { setIsRecurrent(e.target.checked); if(e.target.checked) setIsInstallment(false); }} className="h-4 w-4 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded" />
              <label htmlFor="recurrent" className="ml-2 block text-sm text-text-secondary dark:text-dark-text-secondary">Conta Recorrente</label>
            </div>
            <div className="flex items-center">
              <input id="installment" type="checkbox" checked={isInstallment} onChange={e => { setIsInstallment(e.target.checked); if(e.target.checked) setIsRecurrent(false); }} className="h-4 w-4 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded" />
              <label htmlFor="installment" className="ml-2 block text-sm text-text-secondary dark:text-dark-text-secondary">Conta Parcelada</label>
            </div>
          </div>
          {isInstallment && (
            <div className="animate-fade-in">
              <label htmlFor="totalInstallments" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Total de Parcelas</label>
              <input type="number" id="totalInstallments" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} min="2" className="mt-1 block w-full bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-surface-light dark:bg-dark-surface-light text-text-secondary dark:text-dark-text-secondary hover:bg-border-color dark:hover:bg-dark-border-color transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark transition-all">{account ? 'Salvar Alterações' : 'Adicionar Conta'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountFormModal;
