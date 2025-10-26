import { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceRecognitionProps {
  onResult: (transcript: string) => void;
}

const getSpeechRecognition = () => {
  if (typeof window !== 'undefined') {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }
  return null;
};

export const useVoiceRecognition = ({ onResult }: VoiceRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const currentTranscript = event.results[0][0].transcript;
      if (onResultRef.current) {
        onResultRef.current(currentTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error("Speech recognition error:", event.error);
      }
      // Garante que o estado seja redefinido em caso de erro, pois onend pode não disparar.
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        // O estado será atualizado pelo handler 'onstart'.
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        // Em caso de erro, garanta que não estamos presos em um estado de escuta.
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        // Deixa o onend cuidar da definição de isListening para false para ser a única fonte da verdade.
    }
  }, [isListening]);

  return {
    isListening,
    startListening,
    stopListening,
    isSupported: !!getSpeechRecognition(),
  };
};
