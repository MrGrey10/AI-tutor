'use client';

import { useState, useRef, useEffect } from 'react';

interface UseSpeechRecognitionResult {
	isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

function getSpeechRecognitionApi(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as Window & { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition })
      .webkitSpeechRecognition ||
    null
  );
}

export function useSpeechRecognition(
  onResult: (transcript: string) => void,
	isListening: boolean
): UseSpeechRecognitionResult {
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const Api = getSpeechRecognitionApi();
    setIsSupported(!!Api);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = () => {
    const Api = getSpeechRecognitionApi();
    if (!Api) return;

    const recognition = new Api();
    recognition.lang = 'en-US';
    recognition.interimResults = true; // enable partial results
    recognition.maxAlternatives = 5; // get multiple guesses

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (!result.isFinal) return;

      let best = '';
      let maxConfidence = 0;

      for (let i = 0; i < result.length; i++) {
        const alt = result[i];
        if (alt.confidence > maxConfidence) {
          maxConfidence = alt.confidence;
          best = alt.transcript;
        }
      }

      onResult(best);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  return { isSupported, startListening, stopListening };
}
