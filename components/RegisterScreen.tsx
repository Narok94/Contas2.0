
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
    <div className="flex items-center justify-center min-h-[100dvh] bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary relative overflow-hidden transition-colors duration-500 p-4 font-sans">
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-primary/20 dark:bg-primary/30 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[45rem] h-[45rem] bg-secondary/20 dark:bg-secondary/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md"
        >
            <div className="bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-border-color/50 dark:border-dark-border-color/50 p-8 sm:p-12">
                
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif italic font-black text-text-primary dark:text-dark-text-primary tracking-tight">Começar agora<span className="text-primary">.</span></h1>
                    <p className="text-text-secondary dark:text-dark-text-secondary font-medium mt-2 text-sm">Junte-se a TATU e domine sua grana.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1">Nome Completo</label>
                            <input
                                type="text"
                                required
                                className="w-full px-5 py-4 bg-surface-light dark:bg-dark-surface-light border border-transparent focus:border-primary rounded-2xl outline-none transition-all text-text-primary dark:text-dark-text-primary font-medium"
                                placeholder="Seu nome completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1">Usuário</label>
                            <input
                                type="text"
                                required
                                className="w-full px-5 py-4 bg-surface-light dark:bg-dark-surface-light border border-transparent focus:border-primary rounded-2xl outline-none transition-all text-text-primary dark:text-dark-text-primary font-medium"
                                placeholder="Nome de usuário (@exemplo)"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-text-muted ml-1">Senha</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-5 py-4 bg-surface-light dark:bg-dark-surface-light border border-transparent focus:border-primary rounded-2xl outline-none transition-all text-text-primary dark:text-dark-text-primary font-medium"
                                    placeholder="Senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-text-muted ml-1">Confirma</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-5 py-4 bg-surface-light dark:bg-dark-surface-light border border-transparent focus:border-primary rounded-2xl outline-none transition-all text-text-primary dark:text-dark-text-primary font-medium"
                                    placeholder="Confirma"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-danger text-[10px] font-black uppercase tracking-wider text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4.5 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-50 text-xs uppercase tracking-[0.2em]"
                    >
                         {isLoading ? "Criando conta..." : "Criar minha conta"}
                    </button>
                    
                    <div className="text-center pt-2">
                        <button 
                            type="button"
                            onClick={onNavigateToLogin}
                            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors"
                        >
                            Já tenho conta, <span className="text-primary">quero entrar</span>
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    </div>
  );
};

export default RegisterScreen;
