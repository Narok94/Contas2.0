
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AiInsightCardProps {
  onGenerate: () => Promise<string>;
}

const AiInsightCard: React.FC<AiInsightCardProps> = ({ onGenerate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    try {
      const result = await onGenerate();
      setAnalysis(result);
    } catch (e) {
      setError("Oops! Tive um problema para gerar a análise. Tente de novo em um instante.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative bg-surface dark:bg-dark-surface p-6 rounded-3xl shadow-lg border border-border-color/50 dark:border-dark-border-color/50 flex flex-col justify-between h-full overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.25 1.593c.184.22.33.475.438.752A6 6 0 0112 18a6 6 0 01-4.188-1.655c.108-.277.254-.532.438-.752m1.313-1.313a3 3 0 114.438 0m-1.313 1.313L12 13.5m0 0l-1.063 1.063" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">Análise do Tatu</h3>
        </div>

        <div className="min-h-[100px] text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-dark-surface-light rounded-md w-full animate-skeleton-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-dark-surface-light rounded-md w-5/6 animate-skeleton-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-dark-surface-light rounded-md w-3/4 animate-skeleton-pulse"></div>
            </div>
          ) : error ? (
            <p className="text-warning">{error}</p>
          ) : analysis ? (
            <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
          ) : (
            <p>Compare seus gastos com o mês passado e receba dicas para economizar.</p>
          )}
        </div>
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleGenerate} 
        disabled={isLoading}
        className="w-full mt-4 py-2.5 px-4 text-sm font-semibold rounded-xl bg-primary/10 text-primary-dark dark:text-primary-light hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative z-10"
      >
        {isLoading ? 'Analisando...' : 'Gerar Análise Rápida'}
      </motion.button>
    </div>
  );
};

export default AiInsightCard;
