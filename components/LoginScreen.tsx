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
    <path d="M20 65C20 45 35 35 50 35C65 35 80 45 80 65H20Z" fill="#2D9F75" />
    <path d="M32 38C38 36 44 35 50 35C56 35 62 36 68 38L65 65H35L32 38Z" fill="#4ADE80" />
    {/* Segmentos do Casco */}
    <path d="M40 36V65M50 35V65M60 36V65" stroke="#2D9F75" strokeWidth="1.5" />
    {/* Cabeça */}
    <path d="M15 55C15 50 22 50 25 55V65H15V55Z" fill="#A3E635" />
    {/* Olho */}
    <circle cx="20" cy="58" r="1.5" fill="#2D9F75" />
    {/* Rabo */}
    <path d="M80 60L88 65H80V60Z" fill="#A3E635" />
    {/* Patas */}
    <rect x="30" y="65" width="10" height="5" rx="1" fill="#A3E635" />
    <rect x="60" y="65" width="10" height="5" rx="1" fill="#A3E635" />
  </svg>
);

const ParticleNetwork: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = (Math.random() * 2 - 1) * 0.3;
                this.speedY = (Math.random() * 2 - 1) * 0.3;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
                if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
            }
            draw() {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        let particles: Particle[];
        const init = () => {
            particles = [];
            const particleDensity = window.innerWidth < 768 ? 20000 : 12000;
            let numberOfParticles = (canvas.height * canvas.width) / particleDensity;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };

        const connect = () => {
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                                 + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                    if (distance < (canvas.width / 8) * (canvas.height / 8)) {
                        opacityValue = 1 - (distance / 25000);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue * 0.2})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            connect();
            animationFrameId = requestAnimationFrame(animate);
        };
        
        init();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"></canvas>;
};


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
    <div className="relative flex items-center justify-center min-h-[100dvh] bg-[#020617] text-white overflow-hidden p-4">
      {/* Background Dinâmico Aprimorado */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0b1f4c] via-[#020617] to-[#1e3a8a] z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <ParticleNetwork />

      <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
      >
          {/* Logo Container Centralizado e Destacado com estilo Azul Transparente */}
          <div className="flex flex-col items-center mb-10">
              <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                  className="relative group"
              >
                  {/* Glowing Rings (conforme a imagem) */}
                  <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
                  <div className="absolute -inset-2 border border-indigo-500/20 rounded-full"></div>
                  
                  <div className="relative w-32 h-32 bg-indigo-500/80 backdrop-blur-xl rounded-full border border-white/30 p-4 shadow-2xl flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
                      ) : (
                        <TatuIcon className="w-10/12 h-10/12 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                      )}
                  </div>
              </motion.div>
              
              <div className="text-center mt-6">
                  <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                    TATU<span className="text-primary">.</span>
                  </h1>
                  <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em] mt-1">
                    Finanças a Dois
                  </p>
              </div>
          </div>

          {/* Cartão de Login Glassmorphism */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                      <div className="relative group">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                           </div>
                           <input
                              type="text"
                              autoCapitalize="none"
                              required
                              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl outline-none transition-all placeholder:text-white/20 text-white font-medium"
                              placeholder="Usuário"
                              email={email}
                              onChange={(e) => setEmail(e.target.value)}
                          />
                      </div>
                      <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          </div>
                          <input
                              type="password"
                              required
                              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl outline-none transition-all placeholder:text-white/20 text-white font-medium"
                              placeholder="Senha"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                          />
                      </div>
                  </div>
                  
                  {error && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-center text-rose-400 font-bold uppercase tracking-wider bg-rose-500/10 py-2 rounded-lg"
                      >
                        {error}
                      </motion.p>
                  )}

                  <div className="flex items-center justify-between px-1">
                      <label className="flex items-center cursor-pointer group">
                          <input 
                              type="checkbox" 
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="sr-only peer"
                          />
                          <div className="w-5 h-5 border-2 border-white/20 rounded peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                               <svg className={`w-3 h-3 text-white transition-opacity ${rememberMe ? 'opacity-100' : 'opacity-0'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                          </div>
                          <span className="ml-3 text-sm text-white/40 group-hover:text-white/60 transition-colors">Lembrar acesso</span>
                      </label>
                  </div>

                  <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 relative group overflow-hidden"
                  >
                       <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                       {isLoading ? (
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                      ) : "ENTRAR NO DASHBOARD"}
                  </button>
                  
                  <div className="text-center pt-2">
                      <button 
                          type="button"
                          onClick={onNavigateToRegister}
                          className="text-sm font-bold text-white/40 hover:text-white transition-colors"
                      >
                          Novo por aqui? <span className="text-primary hover:underline">Crie uma conta</span>
                      </button>
                  </div>
              </form>
          </div>
          
          <p className="text-center mt-10 text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
              Sincronizado com Vercel Postgres
          </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;