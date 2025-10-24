import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('henrique');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username, password)) {
      setError('Credenciais inválidas. Tente "henrique" com senha "admin".');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[length:200%_200%] bg-gradient-to-br from-slate-100 via-sky-100 to-slate-200 dark:from-slate-900 dark:via-secondary-dark dark:to-slate-800 animate-gradient-pan">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/70 dark:bg-dark-background/70 backdrop-blur-xl rounded-4xl shadow-2xl ring-1 ring-black/5">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
            Bem-vindo!
          </h1>
          <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">Faça login para gerenciar suas contas.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-slate-300 bg-slate-50/80 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:z-10 sm:text-sm rounded-t-lg dark:bg-dark-surface/80 dark:border-slate-700 dark:text-dark-text-primary dark:placeholder-slate-400 dark:focus:ring-4 dark:focus:ring-secondary/20 dark:focus:border-secondary transition-all duration-300"
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-slate-300 bg-slate-50/80 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:z-10 sm:text-sm rounded-b-lg dark:bg-dark-surface/80 dark:border-slate-700 dark:text-dark-text-primary dark:placeholder-slate-400 dark:focus:ring-4 dark:focus:ring-secondary/20 dark:focus:border-secondary transition-all duration-300"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-danger text-sm text-center pt-2">{error}</p>}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-primary dark:focus:ring-offset-dark-background transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-secondary/30 dark:hover:shadow-secondary/40 focus:shadow-xl focus:shadow-secondary/30 transform hover:scale-[1.02] active:scale-100"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;