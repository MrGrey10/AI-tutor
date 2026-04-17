'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '@/types/chat';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { speak, unlockAudio } from '@/lib/tts';
import { MicButton } from './MicButton';
import { ChatBubble } from './ChatBubble';
import { BrowserWarning } from './BrowserWarning';
import { API_BASE } from '@/consts';

interface ChatScreenProps {
  initialMessage?: string;
  onEndSession: (messages: Message[]) => void;
}

export function ChatScreen({ initialMessage, onEndSession }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessage ? [{ role: 'assistant', content: initialMessage }] : []
  );
  const [text, setText] = useState('');
  const [pushText, setPushText] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const [isListening, setIsListening] = useState(false);

  // Speak the initial topic message once on mount
  useEffect(() => {
		 if (typeof window !== 'undefined' && window.speechSynthesis) {
			const synth = window.speechSynthesis;
			synth.cancel();
			synth.getVoices();
		 }

    if (initialMessage) speak(initialMessage);
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleTranscript = async (transcript: string) => {
    if (isFetchingRef.current || isListening || !transcript) {
			return;
		}
    isFetchingRef.current = true;

    const userMessage: Message = { role: 'user', content: transcript };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userText: transcript })
      });
      const { reply } = await res.json();
      const tutorMessage: Message = { role: 'assistant', content: reply };
      setMessages((prev) => [...prev, tutorMessage]);
      console.log('[ChatScreen] Received reply:', reply);
      speak(reply);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (pushText && text) {
      handleTranscript(text);
      setPushText(false);
      setText('');
    }
  }, [pushText, text]);

  const { isSupported, startListening, stopListening } = useSpeechRecognition(handleTranscript, isListening);

  const handleStartListening = useCallback(() => {
    unlockAudio(); // must be called from user gesture — unlocks TTS on mobile
    setIsListening(true);
    startListening();
  }, []);

  const handleStopListening = useCallback(() => {
    setIsListening(false);
    stopListening();
  }, []);

  return (
    <div className='min-h-screen flex flex-col bg-white'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-gray-100'>
        <h1 className='font-semibold text-gray-800'>English Tutor</h1>
        <button
          onClick={() => onEndSession(messages)}
          className='text-sm text-gray-400 hover:text-gray-600 transition-colors'>
          End session
        </button>
      </div>

      {/* Browser warning */}
      {!isSupported && (
        <div className='px-4 pt-3'>
          <BrowserWarning />
        </div>
      )}

      {/* Messages */}
      <div className='flex-1 overflow-y-auto px-4 py-4'>
        {messages?.map((msg, i) => (
          <ChatBubble key={i} message={msg} speak={() => { unlockAudio(); speak(msg.content); }} />
        ))}
        {isLoading && (
          <div className='flex justify-start mb-3'>
            <div className='bg-gray-100 text-gray-400 rounded-2xl px-4 py-2 text-sm'>Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className='p-[20px] w-full max-w-[620px] m-auto flex flex-col gap-3'>
        <textarea
          name='user text'
          placeholder='Type your message...'
          className='border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setPushText(true);
            }
          }}
        />
        <button
          onClick={() => setPushText(true)}
          className='bg-blue-500 text-white px-4 py-2 rounded-md mb-[20px] hover:bg-blue-600 transition-colors'>
          Send
        </button>
      </div>

      {/* Controls */}
      <div className='flex justify-center items-center py-6 border-t border-gray-100'>
        <MicButton
          onStart={handleStartListening}
          onStop={handleStopListening}
          disabled={isLoading || !isSupported}
          isListening={isListening}
        />
      </div>
    </div>
  );
}
