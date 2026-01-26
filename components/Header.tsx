
import React, { useState, useRef, useEffect } from 'react';
import { type User } from '../types';
import realtimeService, { type SyncStatus } from '../services/realtimeService';

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
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="bg-surface/70 dark:bg-dark-surface/70 backdrop-blur-lg shadow-sm sticky top-0 z-30 border-b border-border-color/50 dark:border-dark-border-color/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent leading-none">Controle de Contas</h1>
            <div className="mt-1.5">
                <SyncStatusIndicator />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform active:scale-90"
                aria-label="Abrir menu do usuário"
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface dark:bg-dark-surface rounded-2xl shadow-xl py-1 z-40 ring-1 ring-black ring-opacity-5 animate-fade-in">
                  <div className="px-4 py-2 border-b border-border-color dark:border-dark-border-color">
                    <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate">{currentUser.name}</p>
                    <p className="text-xs text-text-muted dark:text-dark-text-muted truncate">@{currentUser.username}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { onSettingsClick(); setIsUserMenuOpen(false); }}
                      className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary dark:text-dark-text-secondary hover:bg-surface-light dark:hover:bg-dark-surface-light transition-colors"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>Configurações</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary dark:text-dark-text-secondary hover:bg-surface-light dark:hover:bg-dark-surface-light transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      <span>Sair</span>
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
