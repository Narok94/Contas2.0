
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
}

const TatuIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 65C20 45 35 35 50 35C65 35 80 45 80 65H20Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M32 38C38 36 44 35 50 35C56 35 62 36 68 38L65 65H35L32 38Z" fill="currentColor" />
    <path d="M40 36V65M50 35V65M60 36V65" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
    <path d="M15 55C15 50 22 50 25 55V65H15V55Z" fill="currentColor" fillOpacity="0.6" />
    <circle cx="20" cy="58" r="1.5" fill="black" />
    <path d="M80 60L88 65H80V60Z" fill="currentColor" fillOpacity="0.6" />
    <rect x="30" y="65" width="10" height="5" rx="1" fill="currentColor" />
    <rect x="60" y="65" width="10" height="5" rx="1" fill="currentColor" />
  </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const success = await onLogin(email, password);
    if (!success) {
      setError('Acesso negado. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden p-6">
      {/* Background Aurora */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-cyber-purple via-cyber-blue to-cyber-pink animate-aurora blur-[120px]" style={{backgroundSize: '400% 400%'}} />
      </div>
      
      <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
      >
          <div className="flex flex-col items-center mb-12">
              <div className="w-24 h-24 text-primary animate-float mb-6">
                  <TatuIcon />
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter text-glow drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                TATU<span className="text-primary">.</span>
              </h1>
              <p className="text-slate-500 font-black text-xs uppercase tracking-[0.5em] mt-3">Sua grana sob controle</p>
          </div>

          <div className="glass-effect rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border-white/5">
              <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                      <div className="relative">
                           <input
                              type="text"
                              required
                              className="w-full px-6 py-4 bg-black/40 border border-white/10 focus:border-primary rounded-2xl outline-none transition-all text-white font-bold placeholder:text-slate-600"
                              placeholder="Usuário"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                          />
                      </div>
                      <div className="relative">
                          <input
                              type="password"
                              required
                              className="w-full px-6 py-4 bg-black/40 border border-white/10 focus:border-primary rounded-2xl outline-none transition-all text-white font-bold placeholder:text-slate-600"
                              placeholder="Senha"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                          />
                      </div>
                  </div>
                  
                  {error && (
                      <p className="text-xs text-center text-rose-500 font-black uppercase tracking-widest animate-pulse">{error}</p>
                  )}

                  <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-5 bg-white hover:bg-primary text-slate-900 font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-sm"
                  >
                       {isLoading ? "Validando..." : "Entrar agora"}
                  </button>
                  
                  <div className="text-center pt-4">
                      <button 
                          type="button"
                          onClick={onNavigateToRegister}
                          className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                      >
                          Não tem conta? <span className="text-primary hover:underline">Cadastre-se</span>
                      </button>
                  </div>
              </form>
          </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
