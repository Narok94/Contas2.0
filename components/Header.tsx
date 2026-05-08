import React, { useState, useRef, useEffect } from 'react';
import { type User } from '../types';
import realtimeService, { type SyncStatus } from '../services/realtimeService';

const TatuIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Corpo/Casco do Tatu */}
    <path d="M20 65C20 45 35 35 50 35C65 35 80 45 80 65H20Z" fill="#1e293b" />
    <path d="M32 38C38 36 44 35 50 35C56 35 62 36 68 38L65 65H35L32 38Z" fill="#334155" />
    {/* Segmentos do Casco */}
    <path d="M40 36V65M50 35V65M60 36V65" stroke="#475569" strokeWidth="1.5" />
    {/* Cabeça */}
    <path d="M15 55C15 50 22 50 25 55V65H15V55Z" fill="#6366f1" />
    {/* Olho */}
    <circle cx="20" cy="58" r="1.5" fill="#ffffff" />
    {/* Rabo */}
    <path d="M80 60L88 65H80V60Z" fill="#6366f1" />
    {/* Patas */}
    <rect x="30" y="65" width="10" height="5" rx="1" fill="#6366f1" />
    <rect x="60" y="65" width="10" height="5" rx="1" fill="#6366f1" />
  </svg>
);

const SyncStatusIndicator: React.FC = () => {
    const [status, setStatus] = useState<SyncStatus>('local');
    
    useEffect(() => {
        const unsubscribe = realtimeService.subscribeToSyncStatus((syncStatus) => {
            setStatus(syncStatus);
        });
        return () => unsubscribe();
    }, []);

    const getStatusInfo = () => {
        switch (status) {
            case 'syncing':
                return { text: 'Sincronizando...', color: 'text-primary dark:text-primary-light', icon: <div className="w-2 h-2 bg-primary rounded-full animate-pulse" /> };
            case 'synced':
                return { text: 'Vercel Postgres', color: 'text-success', icon: <div className="w-2 h-2 bg-success rounded-full" /> };
            case 'error':
                return { text: 'Falha na Conexão', color: 'text-danger', icon: <div className="w-2 h-2 bg-danger rounded-full" /> };
            case 'local':
            default:
                return { text: 'Modo Local (Offline)', color: 'text-text-muted dark:text-dark-text-muted', icon: <div className="w-2 h-2 bg-gray-400 rounded-full" /> };
        }
    };

    const { text, color, icon } = getStatusInfo();

    return (
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => realtimeService.forceSync()} 
                className="p-1.5 bg-surface-light dark:bg-dark-surface-light rounded-full hover:bg-border-color dark:hover:bg-dark-border-color transition-colors"
                title="Forçar Sincronização"
            >
                {status === 'syncing' ? (
                    <svg className="w-3 h-3 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
                    </svg>
                )}
            </button>
            <div className={`flex items-center space-x-1.5 text-xs font-semibold ${color}`}>
                {icon}
                <span className="hidden sm:inline">{text}</span>
            </div>
        </div>
    );
};

interface HeaderProps {
  currentUser: User;
  onSettingsClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onSettingsClick, onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const settings = realtimeService.getSettings();
    if (settings) setLogoUrl(settings.logoUrl);

    const unsub = realtimeService.subscribe('settings', (newSettings) => {
        if (newSettings) setLogoUrl(newSettings.logoUrl);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-surface/80 dark:bg-dark-background/80 backdrop-blur-2xl shadow-lg sticky top-0 z-30 border-b-2 border-border-color/30 dark:border-white/5">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-primary/20 shadow-lg border-2 border-primary/20 transform hover:scale-110 transition-transform cursor-pointer">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-7 h-7 flex items-center justify-center bg-primary rounded-lg text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                          <TatuIcon className="w-5 h-5" />
                        </div>
                    )}
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-black text-navy dark:text-gray-100 leading-none tracking-tighter">TATU<span className="text-primary italic animate-ping-slow">.</span></h1>
                  <p className="text-[8px] font-black uppercase text-text-muted dark:text-gray-400 tracking-[0.2em] mt-0.5">Gestão Financeira</p>
                </div>
            </div>
            <div className="h-8 w-px bg-border-color/50 dark:bg-white/10 hidden md:block" />
            <SyncStatusIndicator />
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="group flex items-center gap-2 bg-surface-light dark:bg-dark-surface p-1 pr-3 rounded-2xl border-2 border-transparent hover:border-primary/30 transition-all shadow-sm active:scale-95"
                aria-label="Abrir menu do usuário"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md group-hover:rotate-6 transition-transform">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[11px] font-black text-text-primary dark:text-white leading-none">{currentUser.name.split(' ')[0]}</p>
                  <p className="text-[9px] font-bold text-text-muted dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse" /> Online
                  </p>
                </div>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-surface dark:bg-dark-surface rounded-3xl shadow-2xl py-2 z-40 border-2 border-border-color/30 dark:border-white/5 animate-fade-in">
                  <div className="px-6 py-4 border-b border-border-color/20 dark:border-white/5">
                    <p className="text-sm font-black text-text-primary dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-xs font-bold text-text-muted truncate">@{currentUser.username}</p>
                  </div>
                  <div className="py-2 px-2 space-y-1">
                    <button
                      onClick={() => { onSettingsClick(); setIsUserMenuOpen(false); }}
                      className="w-full text-left flex items-center space-x-3 px-4 py-2.5 text-sm font-bold text-text-secondary dark:text-dark-text-secondary hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-xl transition-all group"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>Configurações</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left flex items-center space-x-3 px-4 py-2.5 text-sm font-bold text-danger hover:bg-danger/10 rounded-xl transition-all group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      <span>Sair do Sistema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;