
import React, { useState, useRef, useEffect } from 'react';
import { type Account, type ChatMessage } from '../types';
import { getFinancialInsights, processVoiceCommand, ParsedCommand } from '../services/geminiService';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onCommand: (command: ParsedCommand) => string;
  startWithVoice: boolean;
}

// Efeito de digitação para as respostas do modelo
const Typewriter: React.FC<{ text: string }> = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText(''); // Limpa o texto ao receber novo conteúdo
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(intervalId);
            }
        }, 20); // Velocidade da digitação

        return () => clearInterval(intervalId);
    }, [text]);

    return <p className="text-sm" dangerouslySetInnerHTML={{ __html: displayedText.replace(/\n/g, '<br />') }} />;
};


const AiChatModal: React.FC<AiChatModalProps> = ({ isOpen, onClose, accounts, onCommand, startWithVoice }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleVoiceResult = async (transcript: string) => {
        if (!transcript) return;
        setIsLoading(true);
        const userMessage: ChatMessage = { role: 'user', content: `🎤: "${transcript}"` };
        setMessages(prev => [...prev, userMessage]);

        try {
            const command = await processVoiceCommand(transcript, accounts);
            const feedback = onCommand(command);
            const modelMessage: ChatMessage = { role: 'model', content: feedback };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', content: 'Ocorreu um erro ao processar o comando de voz.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({ onResult: handleVoiceResult });

    useEffect(() => {
        if(isOpen) {
            setMessages([{ role: 'model', content: 'Olá! Sou seu assistente financeiro. Como posso ajudar? Você pode digitar ou usar o microfone para dar comandos.' }]);
        }
    }, [isOpen]);
    
    useEffect(() => {
        if (isOpen && startWithVoice && isSupported && !isListening) {
            const timer = setTimeout(() => startListening(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, startWithVoice, isSupported, isListening, startListening]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseContent = await getFinancialInsights(accounts, input);
            const modelMessage: ChatMessage = { role: 'model', content: responseContent };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', content: 'Ocorreu um erro. Por favor, tente novamente.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-slate-900 via-black to-slate-900 border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 w-full max-w-2xl h-[80vh] flex flex-col animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b border-primary/20">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-secondary-light">Assistente IA</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl transition-colors">&times;</button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4 [scrollbar-width:thin] [scrollbar-color:#6366f1_#0f172a]">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md p-3 rounded-lg text-white ${msg.role === 'user' ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-sky-500/10 border border-sky-500/30'}`}>
                                {msg.role === 'model' && index === messages.length - 1 && !isLoading ? (
                                    <Typewriter text={msg.content} />
                                ) : (
                                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="max-w-sm w-full p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center space-x-2">
                                <div className="w-full h-2 bg-primary/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-transparent via-secondary-light to-transparent w-1/2 rounded-full animate-scanner-beam"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-primary/20">
                    <form onSubmit={handleSend} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Ouvindo..." : "Pergunte ou dê um comando..."}
                            disabled={isLoading || isListening}
                            className="flex-1 p-2 rounded-md bg-slate-800/50 text-white border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        {isSupported && (
                           <button 
                                type="button" 
                                onClick={isListening ? stopListening : startListening}
                                disabled={isLoading}
                                className={`p-2 rounded-full transition-all ${isListening ? 'bg-danger/80 text-white animate-pulse-mic' : 'bg-primary text-white'} disabled:opacity-50`}
                           >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                           </button>
                        )}
                        <button type="submit" disabled={isLoading || !input.trim() || isListening} className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50 transition-opacity">
                            Enviar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiChatModal;