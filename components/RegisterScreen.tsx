
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { motion } from 'framer-motion';

interface RegisterScreenProps {
  onRegister: (name: string, username: string, password: string) => Promise<boolean>;
  onNavigateToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem.');
        setIsLoading(false);
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await onRegister(name, username, password);
    if (!success) {
      setError('Este identificador já está sendo usado por outra pessoa.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
        {/* Decorative Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[20%] right-[-10%] w-[45rem] h-[45rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px]"></div>
             <div className="absolute bottom-[20%] left-[-10%] w-[40rem] h-[40rem] bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[100px]"></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-lg px-6 py-10"
        >
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 p-8 sm:p-12">
                
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Criar Conta<span className="text-indigo-600">.</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Preencha os dados para começar.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="group">
                             <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                             <input
                                type="text"
                                required
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl outline-none transition-all text-sm text-slate-800 dark:text-white"
                                placeholder="Ex: Maria Oliveira"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="group">
                             <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Usuário</label>
                             <input
                                type="text"
                                required
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl outline-none transition-all text-sm text-slate-800 dark:text-white"
                                placeholder="@nomeusuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl outline-none transition-all text-sm text-slate-800 dark:text-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Confirmar</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl outline-none transition-all text-sm text-slate-800 dark:text-white"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                            <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                         {isLoading ? "Processando..." : "Criar minha conta Ricka"}
                    </button>
                    
                    <div className="text-center pt-4">
                        <button 
                            type="button"
                            onClick={onNavigateToLogin}
                            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            Já tem uma conta? <span className="text-indigo-600 dark:text-indigo-400">Faça login</span>
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    </div>
  );
};

export default RegisterScreen;
