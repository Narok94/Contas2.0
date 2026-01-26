
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

    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await onRegister(name, username, password);
    if (!success) {
      setError('O identificador já está em uso.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-[#0b0f1a] relative overflow-hidden transition-colors duration-700">
        {/* Camada Tecnológica de Fundo */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <div className="absolute bottom-[-5%] left-[-5%] w-[40rem] h-[40rem] bg-secondary/10 rounded-full blur-[120px] animate-float-blob opacity-60"></div>
             <div className="absolute top-[-5%] right-[-5%] w-[35rem] h-[35rem] bg-accent/10 rounded-full blur-[100px] animate-float-blob opacity-50" style={{animationDelay: '2s'}}></div>
             
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-[28rem] p-6"
        >
            <div className="bg-white/70 dark:bg-[#161b2c]/60 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/40 dark:border-white/10 p-8 sm:p-10 relative">
                
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Registro Digital</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Inicie sua jornada financeira</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <div className="relative">
                             <input
                                id="reg-name"
                                type="text"
                                required
                                className="peer w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/40 border border-transparent focus:border-secondary/50 rounded-2xl outline-none transition-all text-sm text-slate-800 dark:text-white placeholder-transparent"
                                placeholder="Nome Completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <label htmlFor="reg-name" className="absolute left-4 top-3 text-slate-400 text-xs transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:top-[-8px] peer-focus:text-[10px] peer-focus:text-secondary peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-[10px]">Nome Completo</label>
                        </div>

                        <div className="relative">
                             <input
                                id="reg-username"
                                type="text"
                                required
                                className="peer w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/40 border border-transparent focus:border-secondary/50 rounded-2xl outline-none transition-all text-sm text-slate-800 dark:text-white placeholder-transparent"
                                placeholder="Usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <label htmlFor="reg-username" className="absolute left-4 top-3 text-slate-400 text-xs transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:top-[-8px] peer-focus:text-[10px] peer-focus:text-secondary peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-[10px]">Identificador Único</label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <input
                                    id="reg-password"
                                    type="password"
                                    required
                                    className="peer w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/40 border border-transparent focus:border-secondary/50 rounded-2xl outline-none transition-all text-sm text-slate-800 dark:text-white placeholder-transparent"
                                    placeholder="Senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <label htmlFor="reg-password" className="absolute left-4 top-3 text-slate-400 text-xs transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:top-[-8px] peer-focus:text-[10px] peer-focus:text-secondary peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-[10px]">Senha</label>
                            </div>
                            <div className="relative">
                                <input
                                    id="reg-confirm"
                                    type="password"
                                    required
                                    className="peer w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/40 border border-transparent focus:border-secondary/50 rounded-2xl outline-none transition-all text-sm text-slate-800 dark:text-white placeholder-transparent"
                                    placeholder="Confirmar"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <label htmlFor="reg-confirm" className="absolute left-4 top-3 text-slate-400 text-xs transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:top-[-8px] peer-focus:text-[10px] peer-focus:text-secondary peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-[10px]">Confirmar</label>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-danger text-[10px] text-center font-bold uppercase tracking-tight">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-secondary to-primary text-white font-bold rounded-2xl shadow-xl shadow-secondary/20 hover:shadow-secondary/40 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
                    >
                         {isLoading ? "Validando..." : "Finalizar Registro"}
                    </button>
                    
                    <div className="text-center">
                        <button 
                            type="button"
                            onClick={onNavigateToLogin}
                            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
                        >
                            Já possui conta? Acessar Hub →
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    </div>
  );
};

export default RegisterScreen;
