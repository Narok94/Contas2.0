import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, ShieldCheck, TrendingUp, Smartphone } from 'lucide-react';
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

  return (    <div className="relative min-h-[100dvh] bg-white text-slate-900 overflow-hidden font-sans selection:bg-primary selection:text-white flex flex-col lg:flex-row">
      {/* Left Side: Immersive Brand Area */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-20 overflow-hidden border-r border-slate-50 bg-white">
        {/* Atmospheric Background with more vibrant colors */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-[#059669]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-emerald-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '15s' }} />
          <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-amber-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.01)_0%,transparent_70%)]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center backdrop-blur-sm">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <TatuIcon className="w-6 h-6" />
              )}
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-slate-900">Tatu<span className="text-[#059669]">.</span></span>
          </div>

          <h1 className="text-6xl xl:text-8xl font-black leading-[0.85] tracking-tighter mb-8 max-w-md text-slate-900">
            CONTROLE <br />
            TOTAL<span className="text-[#059669]">.</span> <br />
            <span className="text-slate-200">SEM ESFORÇO.</span>
          </h1>
          
          <p className="text-lg text-slate-500 max-w-sm font-medium leading-relaxed">
            A plataforma definitiva para quem busca clareza financeira e liberdade para crescer.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 flex flex-wrap gap-4"
        >
          {[
            { label: 'Segurança Bancária', icon: <ShieldCheck className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Relatórios em Tempo Real', icon: <TrendingUp className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Multi-dispositivo', icon: <Smartphone className="w-3 h-3" />, color: 'text-sky-600', bg: 'bg-sky-50' }
          ].map((feature, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full ${feature.bg} border border-slate-100 shadow-sm hover:scale-105 transition-transform cursor-default`}>
              <span className={feature.color}>{feature.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{feature.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 right-[-5%] w-32 h-32 border border-slate-100 rounded-full" />
        <div className="absolute bottom-1/4 right-10 w-16 h-16 border border-slate-200 rounded-full animate-bounce" style={{ animationDuration: '4s' }} />
      </div>

      {/* Right Side: Login Form Area */}
      <div className="relative flex-1 flex items-center justify-center p-6 sm:p-12 xl:p-24 bg-white">
        {/* Mobile Background Elements with more colors */}
        <div className="absolute inset-0 z-0 lg:hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#059669]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[100px]" />
          <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[440px] p-10 rounded-[3rem] bg-white border border-slate-100 shadow-[0_20px_70px_-12px_rgba(0,0,0,0.08)]"
        >
          <div className="lg:hidden flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-6">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <TatuIcon className="w-10 h-10" />
              )}
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase text-slate-900">
              TATU<span className="text-[#059669]">.</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Gestão Financeira Premium</p>
          </div>

          <div className="mb-10 hidden lg:block text-center lg:text-left">
            <h2 className="text-4xl font-black tracking-tight mb-3 text-slate-900">Bem-vindo<span className="text-[#059669]">.</span></h2>
            <p className="text-slate-500 text-base font-medium">Insira suas credenciais para acessar sua conta.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Usuário</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#059669] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  autoCapitalize="none"
                  required
                  className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-200 focus:border-[#059669]/50 focus:bg-white focus:ring-[6px] focus:ring-[#059669]/5 rounded-2xl outline-none transition-all text-base font-medium placeholder:text-slate-300 text-slate-900"
                  placeholder="Seu nome de usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Senha</label>
                <button type="button" className="text-[10px] font-bold text-[#059669]/60 hover:text-[#059669] transition-colors uppercase tracking-wider">Esqueceu?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#059669] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-200 focus:border-[#059669]/50 focus:bg-white focus:ring-[6px] focus:ring-[#059669]/5 rounded-2xl outline-none transition-all text-base font-medium placeholder:text-slate-300 text-slate-900"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-slate-50 border border-danger/20 text-danger text-xs font-bold text-center uppercase tracking-wider"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full py-5 bg-[#059669] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl overflow-hidden transition-all hover:shadow-[0_20px_40px_-10px_rgba(5,150,105,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-[#059669]/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Acessar Painel
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>

            <div className="pt-8 flex flex-col items-center gap-8">
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-[0.2em]"
              >
                Novo por aqui? <span className="text-[#059669]">Crie sua conta</span>
              </button>
              
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Conexão Segura & Ativa</span>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Footer for Mobile */}
        <div className="absolute bottom-8 left-0 right-0 text-center lg:hidden">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">
            &copy; 2026 Tatu Financeiro
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
