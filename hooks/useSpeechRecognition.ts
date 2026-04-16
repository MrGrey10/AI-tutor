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
  _isListening?: boolean
): UseSpeechRecognitionResult {
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const deliveredRef = useRef<boolean>(false);

  useEffect(() => {
    const Api = getSpeechRecognitionApi();
    setIsSupported(!!Api);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  const deliver = () => {
    if (deliveredRef.current) return;
    const text = (finalTranscriptRef.current || interimTranscriptRef.current).trim();
    if (text) {
      deliveredRef.current = true;
      onResult(text);
    }
  };

  const startListening = () => {
    const Api = getSpeechRecognitionApi();
    if (!Api) return;

    // Ensure any previous session is gone
    try {
      recognitionRef.current?.abort();
    } catch {}

    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    deliveredRef.current = false;

    const recognition = new Api();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 5;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        let best = result[0]?.transcript ?? '';
        let maxConfidence = result[0]?.confidence ?? 0;
        for (let j = 1; j < result.length; j++) {
          const alt = result[j];
          if (alt.confidence > maxConfidence) {
            maxConfidence = alt.confidence;
            best = alt.transcript;
          }
        }
        if (result.isFinal) {
          finalTranscriptRef.current += best + ' ';
        } else {
          interim += best + ' ';
        }
      }
      interimTranscriptRef.current = interim;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // no-speech / aborted are normal — still try to deliver what we have
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('SpeechRecognition error:', event.error);
      }
    };

    recognition.onend = () => {
      deliver();
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition start failed:', err);
    }
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    // stop() flushes remaining results via onend; fall back to deliver after timeout
    try {
      rec.stop();
    } catch {}
    setTimeout(() => {
      if (!deliveredRef.current) deliver();
    }, 400);
  };

  return { isSupported, startListening, stopListening };
}
