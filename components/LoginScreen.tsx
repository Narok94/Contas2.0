
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('henrique');
  const [password, setPassword] = useState('admin9860');
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username, password)) {
      setError('Usuário ou senha inválidos.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[length:200%_200%] bg-gradient-to-br from-slate-100 via-sky-100 to-slate-200 dark:from-slate-900 dark:via-secondary-dark dark:to-slate-800 animate-gradient-pan relative overflow-hidden p-4">
        {/* Decorative Blobs */}
        <div className="absolute top-10 -left-20 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl opacity-50 animate-float-blob"></div>
        <div className="absolute bottom-10 -right-20 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-float-blob" style={{animationDelay: '5s'}}></div>

        <div className="absolute top-4 right-4 z-20">
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-200/50 dark:bg-dark-surface/50 text-text-secondary dark:text-dark-text-secondary hover:bg-slate-300/80 dark:hover:bg-dark-surface-light/80 transition-colors backdrop-blur-sm"
                aria-label={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
                title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
            >
                {theme === 'light' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
            </button>
        </div>

        <div className="relative z-10 w-full max-w-sm">
            <div className="w-full p-6 space-y-4 bg-white/60 dark:bg-dark-background/60 backdrop-blur-2xl rounded-3xl shadow-2xl ring-1 ring-black/5">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-primary/10 rounded-full mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                        Acesse sua Conta
                    </h1>
                    <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Bem-vindo de volta!</p>
                </div>
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div className="rounded-lg -space-y-px">
                    <div>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        className="appearance-none relative block w-full px-3 py-2.5 border border-slate-300 bg-slate-50/80 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:z-10 text-sm rounded-t-lg dark:bg-dark-surface/80 dark:border-slate-700 dark:text-dark-text-primary dark:placeholder-slate-400 dark:focus:ring-4 dark:focus:ring-secondary/20 dark:focus:border-secondary transition-all duration-300"
                        placeholder="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    </div>
                    <div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="appearance-none relative block w-full px-3 py-2.5 border border-slate-300 bg-slate-50/80 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:z-10 text-sm rounded-b-lg dark:bg-dark-surface/80 dark:border-slate-700 dark:text-dark-text-primary dark:placeholder-slate-400 dark:focus:ring-4 dark:focus:ring-secondary/20 dark:focus:border-secondary transition-all duration-300"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    </div>
                </div>
                {error && <p className="text-danger text-sm text-center pt-2">{error}</p>}
                <div>
                    <button
                    type="submit"
                    className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-primary dark:focus:ring-offset-dark-background transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-secondary/30 dark:hover:shadow-secondary/40 focus:shadow-xl focus:shadow-secondary/30 transform hover:scale-[1.02] active:scale-100"
                    >
                    Entrar
                    </button>
                </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;
