import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import realtimeService from '../services/realtimeService';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
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

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const settings = realtimeService.getSettings();
    if (settings) setLogoUrl(settings.logoUrl);

    const unsub = realtimeService.subscribe('settings', (newSettings) => {
        if (newSettings) setLogoUrl(newSettings.logoUrl);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const success = await onLogin(email, password);
    if (!success) {
      setError('Acesso negado. Verifique usuário e senha.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#050505] text-white overflow-hidden font-sans selection:bg-primary selection:text-white flex items-center justify-center p-4 sm:p-6">
      {/* Refined Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] bg-zinc-900/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 sm:p-10 shadow-2xl shadow-black/50"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <TatuIcon className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-3xl font-serif italic font-black tracking-tighter mb-1">
            TATU<span className="text-primary">.</span>
          </h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Gestão Financeira</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Usuário</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoCapitalize="none"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 focus:border-primary/40 focus:ring-1 focus:ring-primary/40 rounded-xl outline-none transition-all text-sm font-medium placeholder:text-white/10"
                placeholder="Seu usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 focus:border-primary/40 focus:ring-1 focus:ring-primary/40 rounded-xl outline-none transition-all text-sm font-medium placeholder:text-white/10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[10px] font-black text-center uppercase tracking-wider"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-4 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest"
            >
              Não tem conta? <span className="text-primary">Cadastre-se</span>
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <ShieldCheck className="w-3 h-3 text-success/60" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Ambiente Criptografado</span>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
          &copy; 2026 Tatu Financeiro &bull; Premium Experience
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
