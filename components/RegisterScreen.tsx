
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
        setError('As senhas não coincidem.');
        setIsLoading(false);
        return;
    }

    const success = await onRegister(name, username, password);
    if (!success) {
      setError('Este usuário já existe.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#fdfdfd] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
            <div className="absolute top-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-violet-200 dark:bg-violet-900 rounded-full blur-[120px] animate-mesh"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[45rem] h-[45rem] bg-sky-100 dark:bg-sky-900 rounded-full blur-[100px] animate-mesh" style={{animationDelay: '-3s'}}></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-[460px] px-6"
        >
            <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-slate-800/50 p-10 sm:p-14">
                
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Começar agora<span className="text-indigo-600">.</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-sm">Junte-se a Ricka e domine sua grana.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-white"
                            placeholder="Seu nome completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-white"
                            placeholder="Nome de usuário (@exemplo)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-white"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-white"
                                placeholder="Confirma"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                         {isLoading ? "Criando conta..." : "Criar minha conta"}
                    </button>
                    
                    <div className="text-center pt-2">
                        <button 
                            type="button"
                            onClick={onNavigateToLogin}
                            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            Já tenho conta, quero entrar
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    </div>
  );
};

export default RegisterScreen;
