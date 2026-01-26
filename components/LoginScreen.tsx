
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
      setError('Credenciais inválidas. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-[#0b0f1a] relative overflow-hidden transition-colors duration-700">
        {/* Camada Tecnológica de Fundo */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px] animate-float-blob opacity-60"></div>
             <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-accent/10 rounded-full blur-[100px] animate-float-blob opacity-50" style={{animationDelay: '3s'}}></div>
             <div className="absolute top-[30%] right-[10%] w-[20rem] h-[20rem] bg-secondary/10 rounded-full blur-[80px] animate-float-blob opacity-40" style={{animationDelay: '6s'}}></div>
             
             {/* Grid sutil */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>

        {/* Botão de Tema */}
        <div className="absolute top-8 right-8 z-20">
            <button 
                onClick={toggleTheme}
                className="p-3 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:scale-110 transition-all shadow-xl"
            >
                {theme === 'light' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
            </button>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-[26rem] p-6"
        >
            <div className="bg-white/70 dark:bg-[#161b2c]/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/40 dark:border-white/10 p-10 relative">
                
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent mb-6 shadow-2xl shadow-primary/30">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Financial Hub</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Gestão inteligente e segura</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div className="relative">
                             <input
                                id="username"
                                type="text"
                                required
                                className="peer w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800/40 border border-transparent focus:border-primary/50 rounded-2xl outline-none transition-all text-slate-800 dark:text-white placeholder-transparent"
                                placeholder="Usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <label 
                                htmlFor="username"
                                className="absolute left-5 top-4 text-slate-400 dark:text-slate-500 transition-all pointer-events-none peer-focus:text-xs peer-focus:top-[-10px] peer-focus:text-primary peer-focus:bg-white dark:peer-focus:bg-[#1c2237] peer-focus:px-2 peer-focus:rounded-full peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-[#1c2237] peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:rounded-full"
                            >
                                Identificador
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type="password"
                                required
                                className="peer w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800/40 border border-transparent focus:border-primary/50 rounded-2xl outline-none transition-all text-slate-800 dark:text-white placeholder-transparent"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <label 
                                htmlFor="password"
                                className="absolute left-5 top-4 text-slate-400 dark:text-slate-500 transition-all pointer-events-none peer-focus:text-xs peer-focus:top-[-10px] peer-focus:text-primary peer-focus:bg-white dark:peer-focus:bg-[#1c2237] peer-focus:px-2 peer-focus:rounded-full peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-[#1c2237] peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:rounded-full"
                            >
                                Senha de Acesso
                            </label>
                        </div>
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger text-xs text-center font-medium bg-danger/10 py-2 rounded-lg">{error}</motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
                    >
                         {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : "Entrar no Hub"}
                    </button>
                    
                    <div className="text-center">
                        <button 
                            type="button"
                            onClick={onNavigateToRegister}
                            className="text-xs font-semibold text-primary hover:text-accent transition-colors"
                        >
                            Criar nova conta digital →
                        </button>
                    </div>
                </form>
            </div>
             <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-10 uppercase tracking-widest font-bold">
                Criptografia de Ponta a Ponta
            </p>
        </motion.div>
    </div>
  );
};

export default LoginScreen;
