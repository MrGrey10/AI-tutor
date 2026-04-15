'use client'

import { useEffect, useState } from 'react'

interface MicButtonProps {
  isListening: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export function MicButton({ isListening, onStart, onStop, disabled }: MicButtonProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(navigator.maxTouchPoints > 0)
  }, [])

  const baseClass =
    'w-20 h-20 rounded-full font-medium text-xs transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none'
  const listeningClass = 'bg-red-500 text-white ring-red-300 scale-110'
  const idleClass = 'bg-blue-500 text-white ring-blue-300 hover:bg-blue-600'

  if (isMobile) {
    return (
      <button
        disabled={disabled}
        onPointerDown={disabled ? undefined : onStart}
        onPointerUp={disabled ? undefined : onStop}
        onPointerLeave={disabled ? undefined : onStop}
        className={`${baseClass} ${isListening ? listeningClass : idleClass}`}
        aria-label={isListening ? 'Release to send' : 'Hold to speak'}
        aria-pressed={isListening}
      >
        {isListening ? 'Release' : 'Hold to speak'}
      </button>
    )
  }

  return (
    <button
      disabled={disabled}
      onClick={isListening ? onStop : onStart}
      className={`${baseClass} ${isListening ? listeningClass : idleClass}`}
      aria-label={isListening ? 'Click to stop' : 'Click to speak'}
      aria-pressed={isListening}
    >
      {isListening ? 'Click to stop' : 'Click to speak'}
    </button>
  )
}
