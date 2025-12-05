
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { type Account, type ChatMessage, type Income, type User } from '../types';
import { generateResponseStream, ParsedCommand, generateSpeech } from '../services/geminiService';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { playAudio } from '../utils/audioUtils';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  accounts: Account[];
  incomes: Income[];
  categories: string[];
  onCommand: (command: ParsedCommand) => string;
  startWithVoice: boolean;
  onListeningChange: (isListening: boolean) => void;
  onTriggerAnalysis: () => Promise<string>;
}

export interface AiChatModalRef {
    stopListening: () => void;
}

const AiChatModal = forwardRef<AiChatModalRef, AiChatModalProps>(({ isOpen, onClose, currentUser, accounts, incomes, categories, onCommand, startWithVoice, onListeningChange, onTriggerAnalysis }, ref) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialVoiceStartHandled = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const submitMessage = async (content: string, isVoice: boolean = false) => {
        if ((!content.trim() && !selectedImage) || isLoading) return;

        let displayContent = content;
        if (isVoice) {
            displayContent = `🎤: "${content}"`;
        } else if (selectedImage && !content.trim()) {
            displayContent = "📷 [Imagem enviada]";
        }

        const userMessage: ChatMessage = { role: 'user', content: displayContent };
        const historyForApi = [...messages];

        setMessages(prev => [...prev, userMessage]);
        
        // Capture image for this request and clear state immediately
        const imageToSend = selectedImage;
        setSelectedImage(null);
        if (!isVoice) setInput('');

        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'model', content: '' }]);

        try {
            // Se tiver imagem e nenhum texto, mandamos um texto padrão instruindo a ler a imagem
            const commandText = content || (imageToSend ? "Analise esta imagem e extraia os dados das contas." : "");

            const stream = generateResponseStream(commandText, historyForApi, accounts, categories, incomes, imageToSend || undefined);
            
            let fullResponse = "";
            let textToSpeak = "";
            const allFunctionCalls = [];

            for await (const chunk of stream) {
                if (chunk.text) {
                    fullResponse += chunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].content = fullResponse;
                        return newMessages;
                    });
                }
                if (chunk.functionCalls) {
                    allFunctionCalls.push(...chunk.functionCalls);
                }
            }
            
            textToSpeak = fullResponse;

            if (allFunctionCalls.length > 0) {
                let commandResultText = "";
                for (const functionCall of allFunctionCalls) {
                    let parsedCommand: ParsedCommand | null = null;
                    const { name, args } = functionCall;

                    if (name === 'add_account') parsedCommand = { intent: 'add_account', data: args };
                    else if (name === 'pay_account') parsedCommand = { intent: 'pay_account', data: args };
                    else if (name === 'edit_account') parsedCommand = { intent: 'edit_account', data: args };
                    else if (name === 'add_income') parsedCommand = { intent: 'add_income', data: args };
                    else if (name === 'edit_income') parsedCommand = { intent: 'edit_income', data: args };

                    if (parsedCommand) {
                        const result = onCommand(parsedCommand);
                        commandResultText += (commandResultText ? "\n" : "") + result;
                    }
                }
                if (commandResultText) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].content = commandResultText;
                        return newMessages;
                    });
                    textToSpeak = commandResultText;
                } else if (!fullResponse) {
                     setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].content = "Ação concluída.";
                        return newMessages;
                    });
                    textToSpeak = "Ação concluída.";
                }
            }

            if (textToSpeak) {
                try {
                    const audioData = await generateSpeech(textToSpeak);
                    if (audioData) {
                        await playAudio(audioData);
                    }
                } catch (audioError) {
                    console.error("Could not play AI response audio:", audioError);
                }
            }

        } catch (error) {
             setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.content = 'Ocorreu um erro. Por favor, tente novamente.';
                } else {
                    newMessages.push({ role: 'model', content: 'Ocorreu um erro. Por favor, tente novamente.' });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoiceResult = (transcript: string) => {
        if (!transcript) return;
        submitMessage(transcript, true);
    };

    const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({ onResult: handleVoiceResult });
    
    useImperativeHandle(ref, () => ({
        stopListening,
    }));

    const handleAnalyzeClick = async () => {
        setIsLoading(true);
        const analysisResult = await onTriggerAnalysis();
        const modelMessage: ChatMessage = { role: 'model', content: analysisResult };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
        
        if (analysisResult) {
            try {
                const audioData = await generateSpeech(analysisResult);
                if (audioData) {
                    await playAudio(audioData);
                }
            } catch (audioError) {
                console.error("Could not play AI analysis audio:", audioError);
            }
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Extract base64 data part (remove "data:image/png;base64,")
                const base64Data = base64String.split(',')[1];
                setSelectedImage({
                    data: base64Data,
                    mimeType: file.type
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        onListeningChange(isListening);
    }, [isListening, onListeningChange]);

    useEffect(() => {
        if(isOpen) {
             const userName = currentUser?.name?.split(' ')[0] || 'você';
             const greeting = `E aí, ${userName}! Beleza? Sou a Ricka, sua nova parceira financeira. 💰✨<br/>Me diga o que você precisa: adicionar uma conta, pagar um boleto, ou só bater um papo. Você também pode me enviar um print da conta!`;
             setMessages([{ role: 'model', content: greeting }]);
             
             generateSpeech(greeting.replace(/<br\/>/g, ' ')).then(audioData => {
                 if(audioData) playAudio(audioData);
             });

             setInput('');
             setSelectedImage(null);
             initialVoiceStartHandled.current = false; // Reset on open
        } else {
             onListeningChange(false);
        }
    }, [isOpen, currentUser, onListeningChange]);
    
    useEffect(() => {
        if (isOpen && startWithVoice && isSupported && !isListening && !initialVoiceStartHandled.current) {
            const timer = setTimeout(() => {
                startListening();
                initialVoiceStartHandled.current = true;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, startWithVoice, isSupported, isListening, startListening]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, selectedImage]); // Added selectedImage to scroll when image is added

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        submitMessage(input);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-slate-900 via-black to-slate-900 border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 w-full max-w-2xl h-[80vh] flex flex-col animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b border-primary/20">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-secondary-light to-accent-light">Ricka ✨</h2>
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
                                <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length-1]?.role === 'model' && messages[messages.length-1]?.content === '' && (
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
                
                {selectedImage && (
                    <div className="px-4 pb-2">
                        <div className="relative inline-block">
                            <img 
                                src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                                alt="Preview" 
                                className="h-20 rounded-lg border border-primary/50"
                            />
                            <button 
                                onClick={removeSelectedImage}
                                className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-primary/20">
                    <form onSubmit={handleSend} className="flex items-center space-x-2">
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleImageSelect} 
                            className="hidden" 
                        />
                         <button
                            type="button"
                            onClick={handleAnalyzeClick}
                            disabled={isLoading || isListening}
                            className="p-2 rounded-full text-white bg-slate-800/50 border border-primary/30 hover:bg-primary/50 disabled:opacity-50 transition-all"
                            title="Analisar Gastos"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isListening}
                            className="p-2 rounded-full text-white bg-slate-800/50 border border-primary/30 hover:bg-primary/50 disabled:opacity-50 transition-all"
                            title="Anexar Imagem"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Ouvindo..." : "Escreva ou envie uma imagem..."}
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
                        <button type="submit" disabled={isLoading || (!input.trim() && !selectedImage) || isListening} className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50 transition-opacity">
                            Enviar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
});

export default AiChatModal;
