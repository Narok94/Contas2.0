import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import realtimeService from '../services/realtimeService';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
}

const TatuIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Corpo/Casco do Tatu */}
    <path d="M20 65C20 45 35 35 50 35C65 35 80 45 80 65H20Z" className="fill-slate-800 dark:fill-slate-200" />
    <path d="M32 38C38 36 44 35 50 35C56 35 62 36 68 38L65 65H35L32 38Z" className="fill-slate-700 dark:fill-slate-300" />
    {/* Segmentos do Casco */}
    <path d="M40 36V65M50 35V65M60 36V65" className="stroke-slate-600 dark:stroke-slate-400" strokeWidth="1.5" />
    {/* Cabeça */}
    <path d="M15 55C15 50 22 50 25 55V65H15V55Z" className="fill-primary" />
    {/* Olho */}
    <circle cx="20" cy="58" r="1.5" fill="#ffffff" />
    {/* Rabo */}
    <path d="M80 60L88 65H80V60Z" className="fill-primary" />
    {/* Patas */}
    <rect x="30" y="65" width="10" height="5" rx="1" className="fill-primary" />
    <rect x="60" y="65" width="10" height="5" rx="1" className="fill-primary" />
  </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="relative flex items-center justify-center min-h-[100dvh] bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary overflow-hidden p-4 font-sans">
      {/* Background Minimalista e Profissional */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-200/[0.5] dark:bg-grid-slate-800/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 dark:bg-secondary/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[440px]"
      >
          {/* Logo Container */}
          <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-surface dark:bg-dark-surface rounded-2xl shadow-xl flex items-center justify-center mb-4 border border-border-color dark:border-dark-border-color">
                  {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                  ) : (
                      <TatuIcon className="w-10 h-10" />
                  )}
              </div>
              <h1 className="text-3xl font-serif italic font-black tracking-tight text-text-primary dark:text-dark-text-primary">
                TATU<span className="text-primary">.</span>
              </h1>
              <p className="text-text-secondary dark:text-dark-text-secondary text-xs font-bold uppercase tracking-[0.2em] mt-1">
                Gestão Financeira Profissional
              </p>
          </div>

          <div className="bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-xl rounded-[2.5rem] border border-border-color dark:border-dark-border-color shadow-2xl p-8 sm:p-10">
              <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                      <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-text-muted ml-1">Usuário</label>
                           <input
                               type="text"
                               autoCapitalize="none"
                               required
                               className="w-full px-4 py-3.5 bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl outline-none transition-all text-text-primary dark:text-dark-text-primary font-medium"
                               placeholder="Seu nome de usuário"
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                           />
                      </div>
                      <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-text-muted ml-1">Senha</label>
                           <input
                               type="password"
                               required
                               className="w-full px-4 py-3.5 bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl outline-none transition-all text-text-primary dark:text-dark-text-primary font-medium"
                               placeholder="••••••••"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                           />
                      </div>
                  </div>
                  
                  {error && (
                      <p className="text-[10px] text-center text-danger font-black uppercase tracking-wider bg-danger/5 py-2.5 rounded-xl border border-danger/20">
                        {error}
                      </p>
                  )}

                  <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 text-xs uppercase tracking-widest shadow-primary/20 hover:shadow-glow-primary"
                  >
                       {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                      ) : "Acessar Dashboard"}
                  </button>
                  
                  <div className="text-center pt-2">
                      <button 
                          type="button"
                          onClick={onNavigateToRegister}
                          className="text-xs font-bold text-text-muted hover:text-primary transition-colors"
                      >
                          Não tem uma conta? <span className="text-primary">Cadastre-se</span>
                      </button>
                  </div>
              </form>
          </div>
          
          <p className="text-center mt-8 text-text-muted text-[9px] font-black uppercase tracking-[0.2em]">
              &copy; 2026 Tatu Financeiro &bull; Profissional
          </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
