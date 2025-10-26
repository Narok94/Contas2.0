
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('jessica');
  const [password, setPassword] = useState('12345');
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username, password)) {
      setError('Credenciais inválidas. Tente "henrique" com senha "admin".');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[length:200%_200%] bg-gradient-to-br from-slate-100 via-sky-100 to-slate-200 dark:from-slate-900 dark:via-secondary-dark dark:to-slate-800 animate-gradient-pan relative">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/70 dark:bg-dark-background/70 backdrop-blur-xl rounded-4xl shadow-2xl ring-1 ring-black/5">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
            Bem-vindo!
          </h1>
          <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">Faça login para gerenciar suas contas.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-slate-300 bg-slate-50/80 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:z-10 sm:text-sm rounded-t-lg dark:bg-dark-surface/80 dark:border-slate-700 dark:text-dark-text-primary dark:placeholder-slate-400 dark:focus:ring-4 dark:focus:ring-secondary/20 dark:focus:border-secondary transition-all duration-300"
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
                className="appearance-none relative block w-full px-3 py-3 border border-slate-300 bg-slate-50/80 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:z-10 sm:text-sm rounded-b-lg dark:bg-dark-surface/80 dark:border-slate-700 dark:text-dark-text-primary dark:placeholder-slate-400 dark:focus:ring-4 dark:focus:ring-secondary/20 dark:focus:border-secondary transition-all duration-300"
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-primary dark:focus:ring-offset-dark-background transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-secondary/30 dark:hover:shadow-secondary/40 focus:shadow-xl focus:shadow-secondary/30 transform hover:scale-[1.02] active:scale-100"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
       <div className="absolute bottom-6">
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
    </div>
  );
};

export default LoginScreen;