import React from 'react';
import { type User, type Group } from '../types';

interface GroupSelectionScreenProps {
  user: User;
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  onLogout: () => void;
}

const GroupSelectionScreen: React.FC<GroupSelectionScreenProps> = ({ user, groups, onSelectGroup, onLogout }) => {
    const userGroups = groups.filter(g => user.groupIds.includes(g.id));

    return (
        <div className="flex items-center justify-center min-h-[100dvh] bg-[length:200%_200%] bg-gradient-to-br from-slate-100 via-sky-100 to-slate-200 dark:from-slate-900 dark:via-secondary-dark dark:to-slate-800 animate-gradient-pan relative overflow-hidden p-4">
            {/* Decorative Blobs */}
            <div className="absolute top-10 -left-20 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl opacity-50 animate-float-blob"></div>
            <div className="absolute bottom-10 -right-20 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-float-blob" style={{animationDelay: '5s'}}></div>

            <div className="relative z-10 w-full max-w-sm">
                <div className="w-full p-6 space-y-4 bg-white/60 dark:bg-dark-background/60 backdrop-blur-2xl rounded-3xl shadow-2xl ring-1 ring-black/5">
                    <div className="flex flex-col items-center justify-center text-center">
                         <div className="p-3 bg-primary/10 rounded-full mb-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                            Selecione um Grupo
                        </h1>
                        <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
                            Olá, {user.name}! Para qual grupo você quer entrar?
                        </p>
                    </div>

                    <div className="mt-4 space-y-3 pt-4 border-t border-border-color/50 dark:border-dark-border-color/50">
                        {userGroups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => onSelectGroup(group.id)}
                                className="w-full text-left p-4 rounded-xl bg-surface/80 dark:bg-dark-surface/80 hover:bg-primary/10 dark:hover:bg-primary/20 border border-border-color dark:border-dark-border-color hover:border-primary/50 dark:hover:border-primary/50 transition-all transform hover:scale-105"
                            >
                                <p className="font-semibold text-text-primary dark:text-dark-text-primary">{group.name}</p>
                            </button>
                        ))}
                    </div>

                    <div className="text-center pt-4">
                        <button onClick={onLogout} className="text-sm text-text-muted dark:text-dark-text-muted hover:underline">
                            Voltar para o Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupSelectionScreen;
