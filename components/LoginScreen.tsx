
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { motion } from 'framer-motion';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await onLogin(username, password);
    if (!success) {
      setError('Credenciais inválidas. Verifique os dados e tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
        {/* Background Decors */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
             
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.02]"></div>
        </div>

        {/* Theme Switcher */}
        <div className="absolute top-6 right-6 z-20">
            <button 
                onClick={toggleTheme}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
            >
                {theme === 'light' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
            </button>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-md px-6"
        >
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 p-8 sm:p-12">
                
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 mb-6 shadow-xl shadow-indigo-500/20">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Ricka<span className="text-indigo-600">.</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Sua vida financeira, simplificada.</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="group">
                             <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Identificador</label>
                             <input
                                type="text"
                                required
                                autoFocus
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                placeholder="Seu nome de usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                            <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">{error}</p>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
                    >
                         {isLoading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Conectando...</span>
                            </div>
                        ) : "Entrar na conta"}
                    </button>
                    
                    <div className="text-center pt-2">
                        <button 
                            type="button"
                            onClick={onNavigateToRegister}
                            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                        >
                            Ainda não é membro? Comece agora
                        </button>
                    </div>
                </form>
            </div>
            <div className="flex justify-center mt-8 space-x-6 text-slate-400 dark:text-slate-600 font-medium text-xs uppercase tracking-widest">
                <span>Segurança Bancária</span>
                <span>•</span>
                <span>Suporte 24/7</span>
            </div>
        </motion.div>
    </div>
  );
};

export default LoginScreen;
