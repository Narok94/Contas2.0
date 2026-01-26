
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
}

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
                this.size = Math.random() * 2 + 1;
                this.speedX = (Math.random() * 2 - 1) * 0.5;
                this.speedY = (Math.random() * 2 - 1) * 0.5;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
                if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
            }
            draw() {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        let particles: Particle[];
        const init = () => {
            particles = [];
            const particleDensity = window.innerWidth < 768 ? 18000 : 9000;
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
                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue})`;
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

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0"></canvas>;
};


const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
      const timer = setInterval(() => {
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'shortOffset'
          };
          setCurrentDateTime(now.toLocaleString('en-US', options).replace(' at', ' at').replace(',', ','));
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Passa 'email' como 'username' para a função onLogin para manter a compatibilidade
    const success = await onLogin(email, password);
    if (!success) {
      setError('Credenciais incorretas. Verifique seu usuário e senha.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-gradient-to-br from-[#0b1f4c] via-[#1c3d7a] to-[#3b82f6] text-slate-800 relative overflow-hidden">
      <ParticleNetwork />

      <div className="absolute top-4 right-4 text-white/70 text-sm font-medium z-10">
          {currentDateTime}
      </div>

      <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
      >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10">
              <div className="text-center mb-8">
                  <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">TATU.</h1>
                  <p className="text-slate-500 mt-1">Controle suas contas</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                       <label htmlFor="email" className="sr-only">Usuário</label>
                       <input
                          id="email"
                          type="text"
                          autoCapitalize="none"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none transition-all placeholder:text-slate-400"
                          placeholder="Usuário"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                      />
                  </div>
                  <div>
                      <label htmlFor="password" className="sr-only">Senha</label>
                      <input
                          id="password"
                          type="password"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none transition-all placeholder:text-slate-400"
                          placeholder="Senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                      />
                  </div>
                  
                  {error && (
                      <p className="text-xs text-center text-red-600 animate-fade-in">{error}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                          <input 
                              id="remember-me"
                              name="remember-me"
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-slate-600">
                              Lembrar-me
                          </label>
                      </div>
                  </div>

                  <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-3"
                  >
                       {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : "ENTRAR"}
                  </button>
                  
                  <div className="text-center text-sm text-slate-500 pt-4">
                      Não tem uma conta?{' '}
                      <button 
                          type="button"
                          onClick={onNavigateToRegister}
                          className="font-semibold text-primary hover:underline"
                      >
                          Cadastre-se.
                      </button>
                  </div>
              </form>
          </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
