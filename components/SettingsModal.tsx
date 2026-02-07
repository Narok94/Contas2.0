import React, { useRef, useState, useEffect } from 'react';
import realtimeService, { SyncStatus } from '../services/realtimeService';
import { User, Role, AppSettings } from '../types';

const CategoryManager: React.FC = () => {
    const [categories, setCategories] = useState<string[]>([]);
    const [newEmoji, setNewEmoji] = useState('📦');
    const [newName, setNewName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const unsub = realtimeService.subscribe('categories', (cats) => {
            setCategories(cats);
        });
        return () => unsub();
    }, []);

    const handleAdd = () => {
        if (!newName.trim()) return;
        const newCategory = `${newEmoji} ${newName.trim()}`;
        if (categories.includes(newCategory)) {
            alert('Esta categoria já existe!');
            return;
        }
        const updated = [...categories, newCategory].sort((a, b) => a.localeCompare(b));
        realtimeService.saveCategories(updated);
        setNewName('');
        setNewEmoji('📦');
        setIsAdding(false);
    };

    const handleRemove = (cat: string) => {
        if (window.confirm(`Tem certeza que deseja remover a categoria "${cat}"? Contas existentes não serão apagadas.`)) {
            const updated = categories.filter(c => c !== cat);
            realtimeService.saveCategories(updated);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black tracking-tight text-text-primary dark:text-dark-text-primary">Categorias</h3>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:underline">+ Adicionar</button>
                )}
            </div>
            
            {isAdding && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col gap-3 animate-fade-in">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="🚀"
                            value={newEmoji} 
                            onChange={(e) => setNewEmoji(e.target.value)}
                            className="w-12 p-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-center"
                        />
                        <input 
                            type="text" 
                            placeholder="Nome da categoria"
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 p-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsAdding(false)} className="flex-1 py-2 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                        <button onClick={handleAdd} className="flex-1 py-2 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">Salvar</button>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat, idx) => (
                    <div key={idx} className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-all hover:border-rose-300">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{cat}</span>
                        <button onClick={() => handleRemove(cat)} className="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CloudStatusCard: React.FC = () => {
    const [status, setStatus] = useState<SyncStatus>('local');
    const [lastSync, setLastSync] = useState<Date | undefined>();
    const userIdentifier = realtimeService.getCurrentUserIdentifier();

    useEffect(() => {
        const unsubscribe = realtimeService.subscribeToSyncStatus((syncStatus, lastSyncTime) => {
            setStatus(syncStatus);
            setLastSync(lastSyncTime);
        });
        return () => unsubscribe();
    }, []);

    const getStatusInfo = () => {
        switch (status) {
            case 'syncing': return { text: 'Sincronizando...', color: 'text-primary', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z' };
            case 'synced': return { text: 'Conectado e Sincronizado', color: 'text-success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' };
            case 'error': return { text: 'Falha na conexão', color: 'text-danger', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
            default: return { text: 'Dados salvos localmente', color: 'text-text-muted', icon: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z' };
        }
    };
    
    const { text, color, icon } = getStatusInfo();

    return (
        <div>
            <h3 className="text-lg font-black tracking-tight mb-2 text-text-primary dark:text-dark-text-primary">Status da Nuvem</h3>
            <div className="p-4 bg-surface-light dark:bg-dark-surface-light rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                    <span className={`font-black text-xs uppercase tracking-widest ${color}`}>{text}</span>
                </div>
                <div className="text-[10px] text-text-secondary dark:text-dark-text-secondary space-y-1 font-bold uppercase">
                    <p>ID: {userIdentifier || 'N/A'}</p>
                    <p>Última Sinc: {lastSync ? lastSync.toLocaleString('pt-BR') : 'Nunca'}</p>
                </div>
                 <button 
                    onClick={() => realtimeService.forceSync()}
                    disabled={status === 'syncing'}
                    className="w-full text-[10px] font-black uppercase py-2.5 px-4 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
                >
                    {status === 'syncing' ? 'Aguarde...' : 'Sincronizar Agora'}
                </button>
            </div>
        </div>
    )
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onExportData: () => void;
    onImportData: (file: File) => void;
    onExportToCsv: () => void;
    currentUser: User | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, toggleTheme, onExportData, onImportData, onExportToCsv, currentUser }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
    const isAdmin = currentUser?.role === Role.ADMIN;

    useEffect(() => {
        if (!isOpen) return;
        const currentSettings = realtimeService.getSettings();
        setLogoUrl(currentSettings?.logoUrl);

        const unsub = realtimeService.subscribe('settings', (newSettings) => {
            if (newSettings) setLogoUrl(newSettings.logoUrl);
        });
        return () => unsub();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 128;
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedLogo = canvas.toDataURL('image/jpeg', 0.7);
                    realtimeService.updateSettings({ ...realtimeService.getSettings(), logoUrl: compressedLogo });
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-surface dark:bg-dark-surface rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg animate-fade-in-up max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-50 dark:border-slate-800">
                    <h2 className="text-3xl font-black tracking-tighter text-text-primary dark:text-dark-text-primary">Configurações</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400">&times;</button>
                </div>

                <div className="space-y-8 pb-4">
                    {isAdmin && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-black tracking-tight text-text-primary dark:text-dark-text-primary">Visual da Marca</h3>
                            <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/30">
                                <div className="w-20 h-20 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-lg border border-slate-100">
                                    {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-3xl">🦔</span>}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <button onClick={() => logoInputRef.current?.click()} className="text-[10px] font-black uppercase py-2.5 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all w-full shadow-md">Mudar Logo</button>
                                    {logoUrl && <button onClick={() => realtimeService.updateSettings({...realtimeService.getSettings(), logoUrl: undefined})} className="text-[9px] text-rose-500 font-black uppercase w-full tracking-widest">Remover</button>}
                                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                </div>
                            </div>
                        </div>
                    )}

                    <CategoryManager />

                    <CloudStatusCard />

                    <div>
                        <h3 className="text-lg font-black tracking-tight mb-3 text-text-primary dark:text-dark-text-primary">Personalização</h3>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-text-secondary dark:text-dark-text-secondary">Modo Escuro</span>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-lg font-black tracking-tight text-text-primary dark:text-dark-text-primary">Dados</h3>
                        <button onClick={onExportData} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all">
                            <span className="text-sm font-bold text-text-secondary dark:text-dark-text-secondary">Backup (JSON)</span>
                            <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2.5"/></svg>
                        </button>
                        <button onClick={onExportToCsv} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all">
                            <span className="text-sm font-bold text-text-secondary dark:text-dark-text-secondary">Exportar (CSV)</span>
                             <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2.5"/></svg>
                        </button>
                    </div>
                </div>

                 <div className="flex justify-center pt-4">
                    <button onClick={onClose} className="px-10 py-3 text-xs font-black uppercase rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 tracking-[0.2em] transition-all active:scale-95">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;