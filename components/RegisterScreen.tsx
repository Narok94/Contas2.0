
import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
        setError('Senhas diferentes.');
        setIsLoading(false);
        return;
    }

    const success = await onRegister(name, username, password);
    if (!success) {
      setError('Usuário indisponível.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden p-6">
        
        {/* Background Dinâmico */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-blob"></div>
            <div className="absolute -bottom-1/4 -left-1/4 w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '3s' }}></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-[420px]"
        >
            <div className="glass-effect rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-white/10">
                
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Novo por aqui?</h2>
                    <p className="text-slate-500 font-bold mt-2 text-[11px] uppercase tracking-widest">Crie sua conta em segundos</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-3.5 bg-white/5 border border-white/10 focus:border-cyan-500 rounded-2xl outline-none transition-all text-white font-bold text-sm placeholder:text-slate-600"
                            placeholder="Nome Completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-3.5 bg-white/5 border border-white/10 focus:border-cyan-500 rounded-2xl outline-none transition-all text-white font-bold text-sm placeholder:text-slate-600"
                            placeholder="Usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 focus:border-cyan-500 rounded-2xl outline-none transition-all text-white font-bold text-sm placeholder:text-slate-600"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 focus:border-cyan-500 rounded-2xl outline-none transition-all text-white font-bold text-sm placeholder:text-slate-600"
                                placeholder="Confirma"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-[10px] text-center text-rose-400 font-black uppercase tracking-widest">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl shadow-xl transition-all active:scale-[0.97] disabled:opacity-50 text-xs uppercase tracking-widest mt-2"
                    >
                         {isLoading ? "Criando..." : "Cadastrar"}
                    </button>
                    
                    <div className="text-center pt-4">
                        <button 
                            type="button"
                            onClick={onNavigateToLogin}
                            className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Já tem conta? <span className="text-cyan-400">Fazer Login</span>
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    </div>
  );
};

export default RegisterScreen;
