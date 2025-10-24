
import { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceRecognitionProps {
  onResult: (transcript: string) => void;
}

const getSpeechRecognition = () => {
  if (typeof window !== 'undefined') {
    // FIX: Cast window to `any` to access vendor-prefixed or non-standard SpeechRecognition API.
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }
  return null;
};

export const useVoiceRecognition = ({ onResult }: VoiceRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  // FIX: Use `any` for the recognition ref since SpeechRecognition types are not standard in TypeScript.
  const recognitionRef = useRef<any | null>(null);

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

    // FIX: Use `any` for the event type as SpeechRecognitionEvent is not a standard type.
    recognition.onresult = (event: any) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      onResult(currentTranscript);
      setIsListening(false);
    };

    // FIX: Use `any` for the event type as SpeechRecognitionErrorEvent is not a standard type.
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: !!getSpeechRecognition(),
  };
};
