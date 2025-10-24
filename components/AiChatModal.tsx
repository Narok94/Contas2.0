import React, { useState, useRef, useEffect } from 'react';
import { type Account, type ChatMessage, type Income } from '../types';
import { processUserCommand, ParsedCommand } from '../services/geminiService';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  incomes: Income[];
  categories: string[];
  onCommand: (command: ParsedCommand) => string;
  startWithVoice: boolean;
  onListeningChange: (isListening: boolean) => void;
  onTriggerAnalysis: () => Promise<string>;
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


const AiChatModal: React.FC<AiChatModalProps> = ({ isOpen, onClose, accounts, incomes, categories, onCommand, startWithVoice, onListeningChange, onTriggerAnalysis }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const submitMessage = async (content: string, isVoice: boolean = false) => {
        if (!content.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: isVoice ? `🎤: "${content}"` : content };
        const historyForApi = [...messages];

        setMessages(prev => [...prev, userMessage]);
        if (!isVoice) setInput('');
        setIsLoading(true);

        try {
            const result = await processUserCommand(content, historyForApi, accounts, categories, incomes);
            let modelResponse: string;

            if (result.intent === 'unknown') {
                modelResponse = result.data.text;
            } else {
                modelResponse = onCommand(result);
            }
            
            const modelMessage: ChatMessage = { role: 'model', content: modelResponse };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', content: 'Ocorreu um erro. Por favor, tente novamente.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoiceResult = (transcript: string) => {
        if (!transcript) return;
        submitMessage(transcript, true);
    };

    const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({ onResult: handleVoiceResult });
    
    const handleAnalyzeClick = async () => {
        setIsLoading(true);
        const analysisResult = await onTriggerAnalysis();
        const modelMessage: ChatMessage = { role: 'model', content: analysisResult };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    useEffect(() => {
        onListeningChange(isListening);
    }, [isListening, onListeningChange]);

    useEffect(() => {
        if(isOpen) {
             setMessages([{ role: 'model', content: 'Olá! Sou seu assistente financeiro. Como posso ajudar? Você pode adicionar, pagar ou editar contas, ou me fazer uma pergunta.' }]);
             setInput('');
        } else {
             onListeningChange(false);
        }
    }, [isOpen, onListeningChange]);
    
    useEffect(() => {
        if (isOpen && startWithVoice && isSupported && !isListening) {
            const timer = setTimeout(() => startListening(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, startWithVoice, isSupported, isListening, startListening]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        submitMessage(input);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-slate-900 via-black to-slate-900 border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 w-full max-w-2xl h-[80vh] flex flex-col animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b border-primary/20">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-secondary-light to-accent-light">Assistente IA</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl transition-colors">&times;</button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4 [scrollbar-width:thin] [scrollbar-color:#6366f1_#0f172a]">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`w-fit max-w-xl px-4 py-3 ${
                                msg.role === 'user' 
                                ? 'bg-gradient-to-br from-primary via-secondary to-accent text-white rounded-2xl rounded-br-lg' 
                                : 'bg-dark-surface-light text-dark-text-primary rounded-2xl rounded-bl-lg'
                            }`}>
                                {msg.role === 'model' && index === messages.length - 1 && isLoading ? (
                                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                                ) : msg.role === 'model' ? (
                                    <Typewriter text={msg.content} />
                                ) : (
                                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="px-4 py-3 rounded-2xl rounded-bl-lg bg-dark-surface-light w-24">
                                <div className="flex items-center space-x-2 h-5">
                                    <div className="w-full h-2 bg-primary/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-transparent via-secondary-light to-transparent w-1/2 rounded-full animate-scanner-beam"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-primary/20">
                    <form onSubmit={handleSend} className="flex items-center space-x-2">
                         <button
                            type="button"
                            onClick={handleAnalyzeClick}
                            disabled={isLoading || isListening}
                            className="p-2 rounded-full text-white bg-slate-800/50 border border-primary/30 hover:bg-primary/50 disabled:opacity-50 transition-all"
                            title="Analisar Gastos"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                        </button>
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