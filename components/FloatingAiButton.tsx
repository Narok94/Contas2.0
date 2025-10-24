

import React, { useRef } from 'react';
import { motion } from 'framer-motion';

interface FloatingAiButtonProps {
    onClick: () => void;
    onLongPress: () => void;
    constraintsRef: React.RefObject<HTMLDivElement>;
}

const FloatingAiButton: React.FC<FloatingAiButtonProps> = ({ onClick, onLongPress, constraintsRef }) => {
    const pressTimer = useRef<number | null>(null);
    const isLongPress = useRef(false);
    const isDragging = useRef(false);

    const handlePointerDown = () => {
        isDragging.current = false;
        isLongPress.current = false;
        pressTimer.current = window.setTimeout(() => {
            if (!isDragging.current) {
                isLongPress.current = true;
                onLongPress();
            }
        }, 500); // 500ms para long press
    };

    const handlePointerUp = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleTap = () => {
        if (!isLongPress.current && !isDragging.current) {
            onClick();
        }
    };

    const handleDragStart = () => {
        isDragging.current = true;
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };
    
    return (
        <motion.div
            drag
            dragConstraints={constraintsRef}
            dragMomentum={true}
            dragElastic={0.1}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onTap={handleTap}
            onDragStart={handleDragStart}
            animate={{
                y: [0, -10, 0],
            }}
            transition={{
                y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                },
            }}
            title="Abrir Assistente de IA (segure para ativar voz)"
            aria-label="Orbe do Assistente de IA. Arraste para mover. Toque para abrir. Pressione e segure para ativar o comando de voz."
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-16 h-16 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
        >
             <div className="w-full h-full rounded-full bg-gradient-to-br from-primary via-secondary to-pink-500 text-white flex items-center justify-center shadow-lg animate-orb-glow transform transition-transform active:scale-95">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.25 1.593c.184.22.33.475.438.752A6 6 0 0112 18a6 6 0 01-4.188-1.655c.108-.277.254-.532.438-.752m1.313-1.313a3 3 0 114.438 0m-1.313 1.313L12 13.5m0 0l-1.063 1.063" />
                </svg>
             </div>
        </motion.div>
    );
};

export default FloatingAiButton;