import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatScreen } from '@/components/ChatScreen'
import type { Message } from '@/types/chat'

// Capture the onResult callback so tests can trigger transcripts
let capturedOnResult: (text: string) => void

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: vi.fn((onResult: (text: string) => void) => {
    capturedOnResult = onResult
    return {
      isListening: false,
      isSupported: true,
      startListening: vi.fn(),
      stopListening: vi.fn(),
    }
  }),
}))

vi.mock('@/lib/tts', () => ({
  speak: vi.fn(),
  stopSpeaking: vi.fn(),
}))

vi.mock('@/components/MicButton', () => ({
  MicButton: ({ onStart }: { onStart: () => void }) => (
    <button onClick={onStart} data-testid="mic-button">Mic</button>
  ),
}))

vi.mock('@/components/ChatBubble', () => ({
  ChatBubble: ({ message }: { message: Message }) => (
    <div data-testid={`bubble-${message.role}`}>{message.content}</div>
  ),
}))

vi.mock('@/components/BrowserWarning', () => ({
  BrowserWarning: () => <div data-testid="browser-warning">Warning</div>,
}))

describe('ChatScreen', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ reply: 'Great answer! By the way — you could say: "I am doing well."' }),
    }) as unknown as typeof fetch
  })

  it('renders mic button and end session button', () => {
    render(<ChatScreen onEndSession={vi.fn()} />)
    expect(screen.getByTestId('mic-button')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument()
  })

  it('renders initial message as a tutor bubble when provided', () => {
    render(<ChatScreen initialMessage="Let's practice!" onEndSession={vi.fn()} />)
    expect(screen.getByTestId('bubble-assistant')).toHaveTextContent("Let's practice!")
  })

  it('adds user transcript as a bubble and fetches tutor reply', async () => {
    render(<ChatScreen onEndSession={vi.fn()} />)

    await act(async () => {
      capturedOnResult('Hello, how are you?')
    })

    expect(screen.getByTestId('bubble-user')).toHaveTextContent('Hello, how are you?')

    await waitFor(() => {
      expect(screen.getByTestId('bubble-assistant')).toHaveTextContent('Great answer!')
    })
  })

  it('posts the correct payload to /api/chat', async () => {
    render(<ChatScreen initialMessage="Hi!" onEndSession={vi.fn()} />)

    await act(async () => {
      capturedOnResult('I goes to school')
    })

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.userText).toBe('I goes to school')
    expect(body.messages).toEqual([{ role: 'assistant', content: 'Hi!' }])
  })

  it('shows an error bubble when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as unknown as typeof fetch
    render(<ChatScreen onEndSession={vi.fn()} />)

    await act(async () => {
      capturedOnResult('test input')
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('bubble-assistant').some(
        el => el.textContent?.includes('something went wrong')
      )).toBe(true)
    })
  })

  it('calls onEndSession with current messages when end session is clicked', async () => {
    const onEndSession = vi.fn()
    render(<ChatScreen initialMessage="Hello!" onEndSession={onEndSession} />)

    await act(async () => { capturedOnResult('Test') })
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /end session/i }))
    expect(onEndSession).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Test' }),
      ])
    )
  })
})
