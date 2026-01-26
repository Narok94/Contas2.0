
import React from 'react';
import { motion } from 'framer-motion';
import { Goal } from '../types';

interface GoalTrackerProps {
  goals: Goal[];
  onAddGoal?: () => void;
}

const GoalTracker: React.FC<GoalTrackerProps> = ({ goals = [], onAddGoal }) => {
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-3xl border border-border-color/50 dark:border-dark-border-color/50 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Nossas Metas
        </h3>
        {onAddGoal && (
          <button onClick={onAddGoal} className="text-sm font-semibold text-primary hover:underline">+ Nova Meta</button>
        )}
      </div>

      <div className="space-y-6">
        {goals && goals.length > 0 ? goals.map((goal) => {
          const target = goal.targetValue || 1;
          const percentage = Math.min(100, (goal.currentValue / target) * 100);
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-bold text-sm">{goal.name}</p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                      {formatCurrency(goal.currentValue)} de {formatCurrency(goal.targetValue)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-primary">{percentage.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-surface-light dark:bg-dark-surface-light rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-6 border-2 border-dashed border-border-color dark:border-dark-border-color rounded-2xl">
            <p className="text-text-muted text-sm italic">Nenhuma meta definida.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;
