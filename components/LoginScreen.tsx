
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
      setError('E-mail ou senha incorretos.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#fdfdfd] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-200 dark:bg-indigo-900 rounded-full blur-[120px] animate-mesh"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] bg-emerald-100 dark:bg-emerald-900 rounded-full blur-[100px] animate-mesh" style={{animationDelay: '-5s'}}></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-[420px] px-6"
        >
            <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-slate-800/50 p-10 sm:p-14">
                
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-6 group hover:rotate-6 transition-transform">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Ricka<span className="text-indigo-600">.</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-sm">Finanças inteligentes para o seu dia a dia.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
                             <input
                                type="text"
                                required
                                className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                                placeholder="ex: henrique_dev"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
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
                        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-3 group"
                    >
                         {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Entrar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </>
                        )}
                    </button>
                    
                    <div className="text-center">
                        <button 
                            type="button"
                            onClick={onNavigateToRegister}
                            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            Criar uma conta nova
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="mt-12 flex justify-center items-center gap-8 text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                <button onClick={toggleTheme} className="hover:text-indigo-500 transition-colors">Trocar Tema</button>
                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-800 rounded-full"></div>
                <span>SSL Encrypted</span>
            </div>
        </motion.div>
    </div>
  );
};

export default LoginScreen;
