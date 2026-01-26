
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

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gerenciar Entradas</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col">
                    <h3 className="text-xl font-semibold mb-2">Entradas Cadastradas</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 bg-surface-light dark:bg-dark-surface-light p-3 rounded-lg">
                        {incomes.length > 0 ? incomes.map(income => (
                            <div key={income.id} className="flex items-center justify-between p-3 bg-surface dark:bg-dark-surface rounded-lg">
                                <div>
                                    <p className="font-semibold">{income.name} {income.isRecurrent && <span className="text-xs text-primary">(Recorrente)</span>}</p>
                                    <p className="text-sm text-success">{formatCurrency(income.value)}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button onClick={() => handleEditClick(income)} className="text-primary-light hover:text-primary">Editar</button>
                                    <button onClick={() => onDelete(income.id)} className="text-danger hover:text-pink-700">Excluir</button>
                                </div>
                            </div>
                        )) : <p className="text-center text-text-muted py-8">Nenhuma entrada cadastrada.</p>}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 bg-surface-light dark:bg-dark-surface-light rounded-lg space-y-4 self-start">
                    <h3 className="text-xl font-semibold">{editingIncome ? 'Editando Entrada' : 'Adicionar Nova Entrada'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" placeholder="Nome (ex: Salário)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 rounded bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color" />
                        <input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} required className="w-full p-2 rounded bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color" />
                    </div>
                     <div className="flex items-center">
                        <input id="income-recurrent" type="checkbox" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded" />
                        <label htmlFor="income-recurrent" className="ml-2 block text-sm text-text-secondary dark:text-dark-text-secondary">Entrada Recorrente</label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        {editingIncome && <button type="button" onClick={resetForm} className="px-4 py-2 text-sm rounded-md bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color">Cancelar Edição</button>}
                        <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-dark transition-colors">{editingIncome ? 'Salvar Alterações' : 'Adicionar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IncomeManagement;
