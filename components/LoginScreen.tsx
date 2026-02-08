
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
      setError('Acesso negado. Verifique os dados.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden p-6 selection:bg-cyan-500/30">
      
      {/* Background Dinâmico - Luzes em movimento */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-[60%] h-[60%] bg-cyan-600/20 rounded-full blur-[120px] animate-blob"></div>
          <div className="absolute top-1/2 -right-1/4 w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-1/4 left-1/3 w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-[420px]"
      >
          <div className="flex flex-col items-center mb-10 text-center">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]"
              >
                  <TatuIcon />
              </motion.div>
              <h1 className="text-5xl font-black text-white tracking-tighter text-glow">
                TATU<span className="text-cyan-500">.</span>
              </h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-3 opacity-70">Controle Financeiro Inteligente</p>
          </div>

          <div className="glass-effect rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-white/10">
              <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                      <div className="relative group">
                           <input
                              type="text"
                              required
                              className="w-full px-6 py-4 bg-white/5 border border-white/10 group-hover:border-white/20 focus:border-cyan-500 rounded-2xl outline-none transition-all text-white font-bold placeholder:text-slate-500"
                              placeholder="Usuário"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                          />
                      </div>
                      <div className="relative group">
                          <input
                              type="password"
                              required
                              className="w-full px-6 py-4 bg-white/5 border border-white/10 group-hover:border-white/20 focus:border-cyan-500 rounded-2xl outline-none transition-all text-white font-bold placeholder:text-slate-500"
                              placeholder="Senha"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                          />
                      </div>
                  </div>
                  
                  {error && (
                      <motion.p 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] text-center text-rose-400 font-black uppercase tracking-widest"
                      >
                        {error}
                      </motion.p>
                  )}

                  <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-[0.97] disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                       {isLoading ? "Validando..." : "Entrar no Tatu"}
                  </button>
                  
                  <div className="text-center pt-4">
                      <button 
                          type="button"
                          onClick={onNavigateToRegister}
                          className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-cyan-400 transition-colors"
                      >
                          Primeira vez aqui? <span className="text-white">Criar Conta</span>
                      </button>
                  </div>
              </form>
          </div>

          <div className="mt-12 text-center">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Protegido por Criptografia End-to-End</p>
          </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
