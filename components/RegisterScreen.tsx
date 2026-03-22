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
    <div className="relative min-h-[100dvh] bg-[#0A0A0A] text-white overflow-hidden font-sans selection:bg-primary selection:text-white">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-[100dvh]">
        {/* Left Side: Branding (Hidden on mobile or stacked) */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-20 border-b lg:border-b-0 lg:border-r border-white/5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center">
                <TatuIcon className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Financeiro</span>
            </div>

            <h1 className="text-[15vw] lg:text-[120px] font-serif italic font-black leading-[0.85] tracking-tighter mb-6">
              JOIN<span className="text-primary">.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/60 font-light max-w-md leading-relaxed">
              Dê o primeiro passo para sua <span className="text-white font-medium italic">liberdade financeira</span>. Simples, rápido e seguro.
            </p>

            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Segurança Total</h4>
                  <p className="text-[10px] text-white/40">Seus dados criptografados.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Register Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-20 bg-white/[0.02] backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[440px]"
          >
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-2">Crie sua conta</h2>
              <p className="text-white/50 text-sm">Preencha os campos abaixo para começar sua jornada.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-2xl outline-none transition-all text-white font-medium placeholder:text-white/10"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Usuário</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-2xl outline-none transition-all text-white font-medium placeholder:text-white/10"
                    placeholder="Nome de usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Senha</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-2xl outline-none transition-all text-white font-medium placeholder:text-white/10"
                      placeholder="••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Confirma</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-2xl outline-none transition-all text-white font-medium placeholder:text-white/10"
                      placeholder="••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-bold text-center uppercase tracking-wider"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    CRIAR MINHA CONTA
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="pt-6 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-xs font-bold text-white/40 hover:text-white transition-colors"
                >
                  Já tem uma conta? <span className="text-primary">Entre agora</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
          &copy; 2026 Tatu Financeiro &bull; Premium Experience
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
