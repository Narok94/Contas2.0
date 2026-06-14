import React, { useRef, useState, useEffect } from 'react';

interface SettingsModalProps {
    isOpen: boolean; onClose: () => void; theme: 'light' | 'dark'; toggleTheme: () => void;
    onExportData: () => void; onImportData: (file: File) => void; onExportToCsv: () => void; onExportToExcel: () => void; currentUser: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, toggleTheme, onExportData, onImportData, onExportToCsv, onExportToExcel, currentUser }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-surface dark:bg-dark-surface rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border-color dark:border-dark-border-color">
                <div className="flex justify-between items-center mb-8 border-b border-border-color dark:border-dark-border-color pb-4">
                    <h2 className="text-3xl font-black tracking-tighter text-text-primary dark:text-dark-text-primary">Configurações</h2>
                    <button onClick={onClose} className="text-3xl text-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors">&times;</button>
                </div>
                <div className="space-y-8 pb-4">
                    <div className="flex items-center justify-between p-4 bg-surface-light dark:bg-dark-surface-light rounded-2xl">
                        <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">Modo Escuro</span>
                        <button onClick={toggleTheme} className={`relative inline-flex items-center h-7 rounded-full w-12 ${theme === 'dark' ? 'bg-primary' : 'bg-border-color dark:bg-dark-border-color'}`}>
                            <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <button onClick={onExportData} className="w-full flex items-center justify-between p-4 bg-surface-light dark:bg-dark-surface-light rounded-2xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                            <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">Exportar Backup (JSON)</span>
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4-4m0 0l-4-4m4 4V4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json';
                            input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) onImportData(file);
                            };
                            input.click();
                        }} className="w-full flex items-center justify-between p-4 bg-surface-light dark:bg-dark-surface-light rounded-2xl hover:bg-success/5 dark:hover:bg-success/10 transition-colors">
                            <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">Importar Backup (JSON)</span>
                            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={onExportToCsv} className="w-full flex items-center justify-between p-4 bg-surface-light dark:bg-dark-surface-light rounded-2xl hover:bg-accent/5 dark:hover:bg-accent/10 transition-colors">
                            <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">Exportar Relatório (CSV)</span>
                            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={onExportToExcel} className="w-full flex items-center justify-between p-4 bg-surface-light dark:bg-dark-surface-light rounded-2xl hover:bg-success/5 dark:hover:bg-success/10 transition-colors">
                            <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">Exportar Excel (por Categoria)</span>
                            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </div>
                </div>
                <div className="flex justify-center pt-4">
                    <button onClick={onClose} className="px-10 py-3 text-xs font-black uppercase rounded-2xl bg-surface-light dark:bg-dark-surface-light text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
