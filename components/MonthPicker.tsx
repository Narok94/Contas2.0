import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MonthPickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ selectedDate, onSelectDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const validDate = useMemo(() => {
    return selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
  }, [selectedDate]);

  const currentYear = validDate.getFullYear();
  const currentMonth = validDate.getMonth();

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const fullMonthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    onSelectDate(new Date(currentYear, monthIndex, 1));
    setIsOpen(false);
  };

  const handleYearChange = (delta: number) => {
    const newYear = currentYear + delta;
    onSelectDate(new Date(newYear, currentMonth, 1));
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Gatilho Compacto */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color rounded-xl hover:bg-white dark:hover:bg-dark-surface transition-all active:scale-95 group shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
        </svg>
        <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
          {fullMonthNames[currentMonth]} <span className="text-primary/70">{currentYear}</span>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover de Seleção */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 p-3 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-2xl shadow-2xl z-50 min-w-[220px]"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <button 
                onClick={(e) => { e.stopPropagation(); handleYearChange(-1); }} 
                className="p-1 rounded-lg hover:bg-surface-light dark:hover:bg-dark-surface-light transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-black text-primary">{currentYear}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleYearChange(1); }} 
                className="p-1 rounded-lg hover:bg-surface-light dark:hover:bg-dark-surface-light transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {monthNames.map((name, index) => {
                const isSelected = index === currentMonth;
                return (
                  <button
                    key={name}
                    onClick={() => handleMonthSelect(index)}
                    className={`py-2 text-[10px] font-black rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-primary text-white shadow-md' 
                        : 'hover:bg-primary/10 hover:text-primary text-text-secondary'
                    }`}
                  >
                    {name.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthPicker;