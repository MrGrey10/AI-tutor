'use client'

import { useState, useRef, useEffect } from 'react'
import type { Message } from '@/types/chat'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { speak } from '@/lib/tts'
import { MicButton } from './MicButton'
import { ChatBubble } from './ChatBubble'
import { BrowserWarning } from './BrowserWarning'

interface ChatScreenProps {
  initialMessage?: string
  onEndSession: (messages: Message[]) => void
}

export function ChatScreen({ initialMessage, onEndSession }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessage ? [{ role: 'assistant', content: initialMessage }] : []
  )
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFetchingRef = useRef(false)

  // Speak the initial topic message once on mount
  useEffect(() => {
    if (initialMessage) speak(initialMessage)
  }, [])

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleTranscript = async (transcript: string) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    const userMessage: Message = { role: 'user', content: transcript }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userText: transcript }),
      })
      const { reply } = await res.json()
      const tutorMessage: Message = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, tutorMessage])
      speak(reply)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition(handleTranscript)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h1 className="font-semibold text-gray-800">English Tutor</h1>
        <button
          onClick={() => onEndSession(messages)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          End session
        </button>
      </div>

      {/* Browser warning */}
      {!isSupported && (
        <div className="px-4 pt-3">
          <BrowserWarning />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 text-gray-400 rounded-2xl px-4 py-2 text-sm">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center py-6 border-t border-gray-100">
        <MicButton
          isListening={isListening}
          onStart={startListening}
          onStop={stopListening}
          disabled={isLoading || !isSupported}
        />
      </div>
    </div>
  )
}
