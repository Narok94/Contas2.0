
import React, { useState, useRef, useEffect } from 'react';
import { type User } from '../types';
import realtimeService, { type SyncStatus } from '../services/realtimeService';
import { useTheme } from '../hooks/useTheme';

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
                return { color: 'bg-primary animate-pulse' };
            case 'synced':
                return { color: 'bg-emerald-500' };
            case 'error':
                return { color: 'bg-rose-500' };
            default:
                return { color: 'bg-slate-300' };
        }
    };

    const { color } = getStatusInfo();

    return (
        <div className={`w-2 h-2 rounded-full ${color} shadow-sm`} title={`Status: ${status}`} />
    );
};

interface HeaderProps {
  currentUser: User;
  onSettingsClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onSettingsClick, onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-primary flex items-center justify-center text-white">
                    <span className="font-black text-xs">T</span>
                </div>
                <h1 className="text-lg font-black tracking-tighter hidden sm:block">TATU.</h1>
            </div>
            <SyncStatusIndicator />
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button - Discreto no Topo Direito */}
            <button 
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all active:scale-90"
            >
                {theme === 'dark' ? (
                   <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth={2.5}/></svg>
                ) : (
                   <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth={2.5}/></svg>
                )}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-9 h-9 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center font-black text-xs transition-transform active:scale-90"
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-premium py-2 border border-slate-100 dark:border-slate-800">
                  <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800">
                    <p className="text-xs font-black truncate">{currentUser.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@{currentUser.username}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => { onSettingsClick(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      Configurações
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      Sair da Conta
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
