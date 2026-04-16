'use client';

import { useEffect, useState } from 'react';
import type { Message } from '@/types/chat';
import { API_BASE } from '@/consts';

const SUMMARY_PROMPT =
  'Please summarize all the grammar and vocabulary mistakes I made in this session with their corrections. Format as a numbered list. If there were no mistakes, say so.';

interface SummaryScreenProps {
  messages: Message[];
  onNewSession: () => void;
}

export function SummaryScreen({ messages, onNewSession }: SummaryScreenProps) {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userText: SUMMARY_PROMPT }),
      signal: controller.signal
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data.reply) throw new Error('Unexpected response');
        setSummary(data.reply);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setSummary('Failed to generate summary. Please try again.');
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-white px-4'>
      <div className='max-w-lg w-full'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>Session Summary</h2>

        {isLoading ? (
          <p className='text-gray-400 text-center'>Generating your summary…</p>
        ) : (
          <div className='bg-gray-50 rounded-2xl p-6 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-8'>
            {summary}
          </div>
        )}

        {!isLoading && (
          <button
            onClick={onNewSession}
            className='w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition-colors'>
            Start new session
          </button>
        )}
      </div>
    </div>
  );
}
