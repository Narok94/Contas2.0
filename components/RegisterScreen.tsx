import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Lock, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

interface RegisterScreenProps {
  onRegister: (name: string, username: string, password: string) => Promise<boolean>;
  onNavigateToLogin: () => void;
}

const TatuIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 65C20 45 35 35 50 35C65 35 80 45 80 65H20Z" className="fill-slate-800 dark:fill-slate-200" />
    <path d="M32 38C38 36 44 35 50 35C56 35 62 36 68 38L65 65H35L32 38Z" className="fill-slate-700 dark:fill-slate-300" />
    <path d="M40 36V65M50 35V65M60 36V65" className="stroke-slate-600 dark:stroke-slate-400" strokeWidth="1.5" />
    <path d="M15 55C15 50 22 50 25 55V65H15V55Z" className="fill-primary" />
    <circle cx="20" cy="58" r="1.5" fill="#ffffff" />
    <path d="M80 60L88 65H80V60Z" className="fill-primary" />
    <rect x="30" y="65" width="10" height="5" rx="1" className="fill-primary" />
    <rect x="60" y="65" width="10" height="5" rx="1" className="fill-primary" />
  </svg>
);

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
    <div className="relative min-h-[100dvh] bg-white text-slate-900 overflow-hidden font-sans selection:bg-primary selection:text-white flex items-center justify-center p-4 sm:p-6">
      {/* Refined Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#059669]/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[480px] bg-white border border-slate-100 rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_70px_-12px_rgba(0,0,0,0.08)]"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-5">
            <TatuIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase text-slate-900">
            JOIN<span className="text-[#059669]">.</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Criar nova conta premium</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#059669] transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 focus:border-[#059669]/50 focus:bg-white focus:ring-[6px] focus:ring-[#059669]/5 rounded-2xl outline-none transition-all text-base font-medium placeholder:text-slate-300 text-slate-900"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Usuário</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#059669] transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 focus:border-[#059669]/50 focus:bg-white focus:ring-[6px] focus:ring-[#059669]/5 rounded-2xl outline-none transition-all text-base font-medium placeholder:text-slate-300 text-slate-900"
                placeholder="Ex: joao_silva"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#059669] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 focus:border-[#059669]/50 focus:bg-white focus:ring-[6px] focus:ring-[#059669]/5 rounded-2xl outline-none transition-all text-sm font-medium placeholder:text-slate-300 text-slate-900"
                  placeholder="••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirma</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#059669] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 focus:border-[#059669]/50 focus:bg-white focus:ring-[6px] focus:ring-[#059669]/5 rounded-2xl outline-none transition-all text-sm font-medium placeholder:text-slate-300 text-slate-900"
                  placeholder="••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-slate-50 border border-danger/20 text-danger text-[11px] font-bold text-center uppercase tracking-wider"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-[#059669] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#059669]/20 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Criar Minha Conta
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="pt-6 flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em]"
            >
              Já tem conta? <span className="text-[#059669]">Fazer Login</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
          &copy; 2026 Tatu Financeiro &bull; Premium Experience
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
