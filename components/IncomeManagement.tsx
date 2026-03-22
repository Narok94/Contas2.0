import React, { useState, useEffect } from 'react';
import { type Income } from '../types';
import { Banknote, TrendingUp, Plus, Edit2, Trash2, Calendar, Repeat } from 'lucide-react';

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
        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-border-color dark:border-dark-border-color shadow-sm w-full max-w-5xl mx-auto animate-fade-in font-sans">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-success/10 text-success">
                        <TrendingUp className="w-5 h-5 sm:w-6 h-6" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif italic text-text-primary dark:text-dark-text-primary">Gerenciar Entradas<span className="text-primary">.</span></h1>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                <div className="flex flex-col order-2 lg:order-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Banknote className="w-4 h-4 text-text-muted" />
                        <h3 className="text-base sm:text-lg font-semibold text-text-secondary dark:text-dark-text-secondary">Entradas Cadastradas</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-3 bg-surface-light dark:bg-dark-surface-light p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-border-color dark:border-dark-border-color max-h-[400px] lg:max-h-none">
                        {incomes.length > 0 ? incomes.map(income => (
                            <div key={income.id} className="flex items-center justify-between p-3 sm:p-4 bg-surface dark:bg-dark-surface rounded-xl sm:rounded-2xl border border-border-color dark:border-dark-border-color shadow-sm hover:border-primary/30 transition-colors group">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                                        <Banknote className="w-4 h-4 sm:w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-text-primary dark:text-dark-text-primary text-xs sm:text-sm flex items-center gap-2 truncate">
                                            {income.name} 
                                            {income.isRecurrent && (
                                                <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                                                    <Repeat className="w-2 h-2" /> Rec
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-base sm:text-lg font-mono font-black text-success tracking-tighter">{formatCurrency(income.value)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(income)} className="p-1.5 sm:p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Editar">
                                        <Edit2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                                    </button>
                                    <button onClick={() => { if (window.confirm(`Tem certeza que deseja excluir a entrada "${income.name}"?`)) onDelete(income.id); }} className="p-1.5 sm:p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors" title="Excluir">
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 sm:py-12 flex flex-col items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 h-12 rounded-full bg-surface dark:bg-dark-surface border-2 border-dashed border-border-color dark:border-dark-border-color flex items-center justify-center text-text-muted">
                                    <Banknote className="w-5 h-5 sm:w-6 h-6 opacity-20" />
                                </div>
                                <p className="text-text-muted dark:text-dark-text-muted italic text-xs sm:text-sm">Nenhuma entrada cadastrada.</p>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 bg-surface-light dark:bg-dark-surface-light rounded-[1.5rem] sm:rounded-[2rem] space-y-5 sm:space-y-6 self-start border border-border-color dark:border-dark-border-color shadow-sm order-1 lg:order-2">
                    <div className="flex items-center gap-2">
                        {editingIncome ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                        <h3 className="text-base sm:text-lg font-semibold text-text-secondary dark:text-dark-text-secondary">{editingIncome ? 'Editando Entrada' : 'Adicionar Nova Entrada'}</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-text-muted dark:text-dark-text-muted ml-1 flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Nome da Entrada
                            </label>
                            <input type="text" placeholder="Ex: Salário" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2.5 sm:p-3 rounded-xl bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-text-primary dark:text-dark-text-primary" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-text-muted dark:text-dark-text-muted ml-1 flex items-center gap-1">
                                <Banknote className="w-3 h-3" /> Valor (R$)
                            </label>
                            <input type="number" step="0.01" placeholder="0,00" value={value} onChange={e => setValue(e.target.value)} required className="w-full p-2.5 sm:p-3 rounded-xl bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-sm text-text-primary dark:text-dark-text-primary" />
                        </div>
                    </div>
                     <div className="flex items-center p-2.5 sm:p-3 bg-surface dark:bg-dark-surface rounded-xl border border-border-color dark:border-dark-border-color hover:border-primary/30 transition-colors cursor-pointer group">
                        <input id="income-recurrent" type="checkbox" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} className="h-4 w-4 sm:h-5 sm:w-5 text-primary focus:ring-primary border-border-color dark:border-dark-border-color rounded-lg cursor-pointer bg-surface dark:bg-dark-surface" />
                        <label htmlFor="income-recurrent" className="ml-3 flex items-center gap-2 text-xs sm:text-sm font-medium text-text-secondary dark:text-dark-text-secondary cursor-pointer">
                            <Repeat className="w-3.5 h-3.5 sm:w-4 h-4 text-primary/60" /> Entrada Recorrente
                        </label>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                        {editingIncome && (
                            <button type="button" onClick={resetForm} className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase rounded-xl bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color text-text-secondary dark:text-dark-text-secondary hover:bg-surface-light dark:hover:bg-dark-surface-light transition-colors">
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase rounded-xl bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                            {editingIncome ? <><Edit2 className="w-3 h-3" /> Salvar</> : <><Plus className="w-3 h-3" /> Adicionar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IncomeManagement;
