
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
    
    const success = await onLogin(username, password);
    if (!success) {
      setError('Credenciais incorretas. Verifique seu usuário e senha.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#f9fafb] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
        {/* Decorative elements */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
             <div className="absolute -top-[10%] -left-[10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute -bottom-[10%] -right-[10%] w-[40rem] h-[40rem] bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-[440px] px-6"
        >
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/50 dark:border-slate-800/50 p-10 sm:p-14">
                
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20 mb-6">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Ricka<span className="text-indigo-600">.</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-sm leading-relaxed">Gerencie seu dinheiro com a ajuda da inteligência artificial.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="group">
                             <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Seu Identificador</label>
                             <input
                                type="text"
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                                placeholder="ex: henrique_dev"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha Segura</label>
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/10 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-3"
                    >
                         {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : "Entrar na Minha Conta"}
                    </button>
                    
                    <div className="text-center">
                        <button 
                            type="button"
                            onClick={onNavigateToRegister}
                            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity"
                        >
                            Ainda não tem conta? Clique aqui
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="mt-10 flex justify-center items-center gap-6 text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                <button onClick={toggleTheme} className="hover:text-indigo-600 transition-colors">Mudar Tema</button>
                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                <span>SSL Ativo</span>
            </div>
        </motion.div>
    </div>
  );
};

export default LoginScreen;
