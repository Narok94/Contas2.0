
import React, { useRef, useState, useEffect } from 'react';
import realtimeService, { SyncStatus } from '../services/realtimeService';
import { User, Role, AppSettings } from '../types';
import { GoogleGenAI } from "@google/genai";

const CategoryManager: React.FC = () => {
    const [categories, setCategories] = useState<string[]>([]);
    const [newEmoji, setNewEmoji] = useState('📦');
    const [newName, setNewName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const unsub = realtimeService.subscribe('categories', setCategories);
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
        setNewName(''); setNewEmoji('📦'); setIsAdding(false);
    };

    const handleRemove = (cat: string) => {
        if (window.confirm(`Tem certeza que deseja remover a categoria "${cat}"?`)) {
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
                        <input type="text" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-12 p-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-center" />
                        <input type="text" placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 p-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold" />
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

const AiLogoGenerator: React.FC<{ onLogoGenerated: (url: string) => void }> = ({ onLogoGenerated }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const generateLogo = async () => {
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = "A modern, professional logo for a finance app called 'Tatu'. The icon should show a friendly and minimalist armadillo (tatu) related to money, savings or growth. Clean vectors, flat design, indigo and emerald color palette. White background.";
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: "1:1" } }
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const url = `data:image/png;base64,${part.inlineData.data}`;
                    setPreviewUrl(url);
                    break;
                }
            }
        } catch (e) { alert("Erro ao gerar logo."); } finally { setIsGenerating(false); }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-black tracking-tight text-text-primary dark:text-dark-text-primary">Identidade com IA</h3>
            <div className="p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/30">
                {!previewUrl ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto shadow-inner text-2xl">🎨</div>
                        <button onClick={generateLogo} disabled={isGenerating} className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50">
                            {isGenerating ? 'Criando...' : 'Gerar Logo com IA'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <img src={previewUrl} className="w-32 h-32 mx-auto rounded-3xl border-4 border-white shadow-xl" />
                        <div className="flex gap-2">
                            <button onClick={() => setPreviewUrl(null)} className="flex-1 py-3 text-[10px] font-black text-slate-400">Descartar</button>
                            <button onClick={() => { onLogoGenerated(previewUrl); setPreviewUrl(null); }} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px]">Aplicar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CloudStatusCard: React.FC = () => {
    const [status, setStatus] = useState<SyncStatus>('local');
    const [lastSync, setLastSync] = useState<Date | undefined>();
    const userIdentifier = realtimeService.getCurrentUserIdentifier();

    useEffect(() => {
        const unsubscribe = realtimeService.subscribeToSyncStatus((s, t) => { setStatus(s); setLastSync(t); });
        return () => unsubscribe();
    }, []);

    return (
        <div className="p-4 bg-surface-light dark:bg-dark-surface-light rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-3">
                <span className="font-black text-xs uppercase tracking-widest">Sincronização: {status}</span>
            </div>
            <p className="text-[10px] font-bold uppercase opacity-50">ID: {userIdentifier || 'Local'}</p>
            <button onClick={() => realtimeService.forceSync()} className="w-full text-[10px] font-black uppercase py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">Sincronizar Agora</button>
        </div>
    );
}

interface SettingsModalProps {
    isOpen: boolean; onClose: () => void; theme: 'light' | 'dark'; toggleTheme: () => void;
    onExportData: () => void; onImportData: (file: File) => void; onExportToCsv: () => void; currentUser: User | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, toggleTheme, onExportData, onExportToCsv, currentUser }) => {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
    const isAdmin = currentUser?.role === Role.ADMIN;

    useEffect(() => {
        if (!isOpen) return;
        setLogoUrl(realtimeService.getSettings()?.logoUrl);
        return realtimeService.subscribe('settings', (s) => setLogoUrl(s?.logoUrl));
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            realtimeService.updateSettings({ ...realtimeService.getSettings(), logoUrl: event.target?.result as string });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-surface dark:bg-dark-surface rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <h2 className="text-3xl font-black tracking-tighter">Configurações</h2>
                    <button onClick={onClose} className="text-3xl">&times;</button>
                </div>
                <div className="space-y-8 pb-4">
                    {isAdmin && (
                        <>
                            <div className="space-y-4">
                                <h3 className="text-lg font-black tracking-tight">Identidade Visual</h3>
                                <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-indigo-200">
                                    <div className="w-20 h-20 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-lg">
                                        {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" /> : <span className="text-3xl">🦔</span>}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <button onClick={() => logoInputRef.current?.click()} className="text-[10px] font-black uppercase py-2.5 px-4 bg-indigo-600 text-white rounded-xl w-full shadow-md">Mudar Logo</button>
                                        <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                    </div>
                                </div>
                            </div>
                            <AiLogoGenerator onLogoGenerated={(url) => realtimeService.updateSettings({ ...realtimeService.getSettings(), logoUrl: url })} />
                        </>
                    )}
                    <CategoryManager />
                    <CloudStatusCard />
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <span className="text-sm font-bold">Modo Escuro</span>
                        <button onClick={toggleTheme} className={`relative inline-flex items-center h-7 rounded-full w-12 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                            <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <button onClick={onExportData} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <span className="text-sm font-bold">Exportar JSON</span>
                        </button>
                        <button onClick={onExportToCsv} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <span className="text-sm font-bold">Exportar CSV</span>
                        </button>
                    </div>
                </div>
                <div className="flex justify-center pt-4">
                    <button onClick={onClose} className="px-10 py-3 text-xs font-black uppercase rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
