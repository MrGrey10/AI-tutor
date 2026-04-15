'use client'

import { useState } from 'react'
import type { View, Message } from '@/types/chat'
import { StartScreen } from '@/components/StartScreen'
import { ChatScreen } from '@/components/ChatScreen'
import { SummaryScreen } from '@/components/SummaryScreen'

export default function Home() {
  const [view, setView] = useState<View>('start')
  const [initialMessage, setInitialMessage] = useState<string | undefined>()
  const [sessionMessages, setSessionMessages] = useState<Message[]>([])

  const handleStart = (message?: string) => {
    setInitialMessage(message)
    setView('chat')
  }

  const handleEndSession = (messages: Message[]) => {
    setSessionMessages(messages)
    setView('summary')
  }

  const handleNewSession = () => {
    setInitialMessage(undefined)
    setSessionMessages([])
    setView('start')
  }

  if (view === 'chat') {
    return <ChatScreen initialMessage={initialMessage} onEndSession={handleEndSession} />
  }

  if (view === 'summary') {
    return <SummaryScreen messages={sessionMessages} onNewSession={handleNewSession} />
  }

  return <StartScreen onStart={handleStart} />
}
