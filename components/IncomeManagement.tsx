import React, { useState, useEffect } from 'react';
import { type Income } from '../types';

interface IncomeManagementProps {
    incomes: Income[];
    onAddOrUpdate: (incomeData: Omit<Income, 'id' | 'date'> & { id?: string }) => void;
    onDelete: (incomeId: string) => void;
    activeGroupId: string | null;
}

const IncomeManagement: React.FC<IncomeManagementProps> = ({ incomes, onAddOrUpdate, onDelete, activeGroupId }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [isRecurrent, setIsRecurrent] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [groupId, setGroupId] = useState(activeGroupId || '');

    useEffect(() => {
        if (editingIncome) {
            setGroupId(editingIncome.groupId);
        } else if (activeGroupId) {
            setGroupId(activeGroupId);
        }
    }, [editingIncome, activeGroupId]);

    const resetForm = () => {
        setName('');
        setValue('');
        setIsRecurrent(false);
        setEditingIncome(null);
        setGroupId(activeGroupId || '');
    };
    
    const handleEditClick = (income: Income) => {
        setEditingIncome(income);
        setName(income.name);
        setValue(String(income.value));
        setIsRecurrent(income.isRecurrent);
        setGroupId(income.groupId);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddOrUpdate({
            id: editingIncome?.id,
            name,
            value: parseFloat(value),
            isRecurrent,
            groupId,
        });
        resetForm();
    };

    // Removido maximumFractionDigits para precisão
    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-8 rounded-[3rem] border border-border-color dark:border-dark-border-color shadow-sm w-full max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif italic text-slate-900 dark:text-white">Gerenciar Entradas<span className="text-primary">.</span></h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Entradas Cadastradas</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 bg-surface-light dark:bg-dark-surface-light p-4 rounded-[2rem] border border-border-color dark:border-dark-border-color">
                        {incomes.length > 0 ? incomes.map(income => (
                            <div key={income.id} className="flex items-center justify-between p-4 bg-surface dark:bg-dark-surface rounded-2xl border border-border-color dark:border-dark-border-color shadow-sm hover:border-primary/30 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{income.name} {income.isRecurrent && <span className="text-[10px] font-black uppercase text-primary ml-1">Recorrente</span>}</p>
                                    <p className="text-lg font-mono font-black text-success tracking-tighter">{formatCurrency(income.value)}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button onClick={() => handleEditClick(income)} className="text-xs font-black uppercase text-primary hover:text-primary-dark transition-colors">Editar</button>
                                    <button onClick={() => { if (window.confirm(`Tem certeza que deseja excluir a entrada "${income.name}"?`)) onDelete(income.id); }} className="text-xs font-black uppercase text-danger hover:text-danger-dark transition-colors">Excluir</button>
                                </div>
                            </div>
                        )) : <p className="text-center text-slate-400 py-12 italic">Nenhuma entrada cadastrada.</p>}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 bg-surface-light dark:bg-dark-surface-light rounded-[2rem] space-y-6 self-start border border-border-color dark:border-dark-border-color">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{editingIncome ? 'Editando Entrada' : 'Adicionar Nova Entrada'}</h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome da Entrada</label>
                            <input type="text" placeholder="Ex: Salário" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 rounded-xl bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor (R$)</label>
                            <input type="number" step="0.01" placeholder="0,00" value={value} onChange={e => setValue(e.target.value)} required className="w-full p-3 rounded-xl bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono" />
                        </div>
                    </div>
                     <div className="flex items-center p-2 bg-surface dark:bg-dark-surface rounded-xl border border-border-color dark:border-dark-border-color">
                        <input id="income-recurrent" type="checkbox" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} className="h-5 w-5 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded-lg cursor-pointer" />
                        <label htmlFor="income-recurrent" className="ml-3 block text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer">Entrada Recorrente</label>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                        {editingIncome && <button type="button" onClick={resetForm} className="px-6 py-3 text-xs font-black uppercase rounded-xl bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>}
                        <button type="submit" className="px-6 py-3 text-xs font-black uppercase rounded-xl bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all active:scale-95">{editingIncome ? 'Salvar Alterações' : 'Adicionar Entrada'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IncomeManagement;
