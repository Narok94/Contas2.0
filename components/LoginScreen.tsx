
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowHint(false);
    
    await new Promise(resolve => setTimeout(resolve, 600));

    // Remove espaços extras do início e fim
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    const success = await onLogin(cleanUsername, cleanPassword);
    if (!success) {
      setError('Usuário ou senha incorretos.');
      setShowHint(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background dark:bg-dark-background relative overflow-hidden transition-colors duration-500 selection:bg-primary selection:text-white">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-float-blob mix-blend-multiply dark:mix-blend-screen opacity-60"></div>
             <div className="absolute top-[20%] right-[-20%] w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] animate-float-blob mix-blend-multiply dark:mix-blend-screen opacity-60" style={{animationDelay: '2s'}}></div>
             <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] animate-float-blob mix-blend-multiply dark:mix-blend-screen opacity-50" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="absolute top-6 right-6 z-20">
            <button 
                onClick={toggleTheme}
                className="p-3 rounded-full bg-surface/50 dark:bg-dark-surface/50 text-text-secondary dark:text-dark-text-secondary hover:bg-surface dark:hover:bg-dark-surface transition-all backdrop-blur-sm shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/10"
                aria-label="Alternar tema"
            >
                {theme === 'light' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
            </button>
        </div>

        <div className="relative z-10 w-full max-w-sm p-4 animate-fade-in-up">
            <div className="bg-white/80 dark:bg-dark-surface/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/40 dark:border-white/5 p-8 sm:p-10 relative overflow-hidden">
                
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary mb-6 shadow-xl shadow-primary/20 transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500 ease-out group cursor-default">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white transform group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-primary dark:from-white dark:to-primary-light tracking-tight mb-2">Bem-vindo</h1>
                    <p className="text-text-muted dark:text-dark-text-muted text-sm font-medium">Controle suas contas de forma inteligente</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative group">
                             <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="peer w-full pl-5 pr-12 py-4 bg-surface-light/50 dark:bg-dark-surface-light/30 border border-border-color dark:border-dark-border-color focus:border-primary dark:focus:border-primary rounded-2xl outline-none transition-all text-text-primary dark:text-dark-text-primary placeholder-transparent shadow-sm focus:shadow-md focus:bg-white dark:focus:bg-dark-surface"
                                placeholder="Usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <label 
                                htmlFor="username"
                                className="absolute left-5 transition-all pointer-events-none 
                                top-[-10px] text-xs text-primary font-bold bg-white dark:bg-dark-surface px-2 rounded-full
                                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-text-muted dark:peer-placeholder-shown:text-dark-text-muted peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:px-0
                                peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-primary peer-focus:font-bold peer-focus:bg-white dark:peer-focus:bg-dark-surface peer-focus:px-2 peer-focus:rounded-full"
                            >
                                Usuário
                            </label>
                            <div className="absolute right-4 top-4 text-text-muted/30 peer-focus:text-primary/50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                        </div>
                        <div className="relative group">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="peer w-full pl-5 pr-12 py-4 bg-surface-light/50 dark:bg-dark-surface-light/30 border border-border-color dark:border-dark-border-color focus:border-primary dark:focus:border-primary rounded-2xl outline-none transition-all text-text-primary dark:text-dark-text-primary placeholder-transparent shadow-sm focus:shadow-md focus:bg-white dark:focus:bg-dark-surface"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <label 
                                htmlFor="password"
                                className="absolute left-5 transition-all pointer-events-none
                                top-[-10px] text-xs text-primary font-bold bg-white dark:bg-dark-surface px-2 rounded-full
                                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-text-muted dark:peer-placeholder-shown:text-dark-text-muted peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:px-0
                                peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-primary peer-focus:font-bold peer-focus:bg-white dark:peer-focus:bg-dark-surface peer-focus:px-2 peer-focus:rounded-full"
                            >
                                Senha
                            </label>
                             <div className="absolute right-4 top-4 text-text-muted/30 peer-focus:text-primary/50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 flex flex-col space-y-2 animate-fade-in">
                            <div className="flex items-center space-x-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-danger flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-danger text-sm font-bold">{error}</p>
                            </div>
                            {showHint && username.toLowerCase() === 'jessica' && (
                                <p className="text-xs text-text-muted dark:text-dark-text-muted pl-8 italic">
                                    Dica: Tente a senha padrão "123"
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group w-full py-4 px-6 bg-gradient-to-r from-primary to-secondary hover:to-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 focus:ring-4 focus:ring-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center relative overflow-hidden"
                    >
                         <span className="relative z-10 flex items-center gap-2">
                             {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Entrando...</span>
                                </>
                            ) : (
                                <>
                                   <span>Acessar Conta</span>
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </>
                            )}
                         </span>
                    </button>
                </form>
            </div>
             <p className="text-center text-xs text-text-muted dark:text-dark-text-muted mt-8 opacity-60 font-medium">
                &copy; {new Date().getFullYear()} Controle de Contas Inteligente
            </p>
        </div>
    </div>
  );
};

export default LoginScreen;
