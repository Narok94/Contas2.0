
import React, { useRef } from 'react';
import realtimeService from '../services/realtimeService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onExportData: () => void;
    onImportData: (file: File) => void;
    onExportToCsv: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, toggleTheme, onExportData, onImportData, onExportToCsv }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (window.confirm("Restaurar um backup substituirá todos os dados atuais localmente. Deseja continuar?")) {
                onImportData(file);
            }
        }
        if(event.target) event.target.value = '';
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-surface dark:bg-dark-surface rounded-2xl shadow-xl p-6 w-full max-md animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Configurações</h2>
                    <button onClick={onClose} className="text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary text-3xl">&times;</button>
                </div>

                <div className="space-y-6">
                     <div>
                        <h3 className="text-lg font-semibold mb-2 text-text-primary dark:text-dark-text-primary">Aparência</h3>
                        <div className="flex items-center justify-between p-3 bg-surface-light dark:bg-dark-surface-light rounded-lg">
                            <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Tema Escuro</span>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-text-primary dark:text-dark-text-primary">Dados e Backup</h3>
                         <div className="space-y-2">
                            <button onClick={onExportData} className="w-full flex items-center justify-between p-3 bg-surface-light dark:bg-dark-surface-light rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color/50 transition-colors text-left">
                                <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Fazer Backup (JSON)</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                            <button onClick={handleImportClick} className="w-full flex items-center justify-between p-3 bg-surface-light dark:bg-dark-surface-light rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color/50 transition-colors text-left">
                                <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Restaurar Backup (JSON)</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </button>
                             <button onClick={onExportToCsv} className="w-full flex items-center justify-between p-3 bg-surface-light dark:bg-dark-surface-light rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color/50 transition-colors text-left">
                                <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Exportar Contas (CSV)</span>
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                 <div className="flex justify-end pt-6 mt-6 border-t border-border-color dark:border-dark-border-color">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
