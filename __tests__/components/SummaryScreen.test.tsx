import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SummaryScreen } from '@/components/SummaryScreen'
import type { Message } from '@/types/chat'

const MOCK_MESSAGES: Message[] = [
  { role: 'user', content: 'I goed to store yesterday' },
  { role: 'assistant', content: 'Oh nice! By the way — you could say: "I went to the store yesterday."' },
]

describe('SummaryScreen', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          reply: '1. "I goed" → "I went"\n2. Missing article "the" before "store".',
        }),
    }) as unknown as typeof fetch
  })

  it('shows a loading state initially', () => {
    render(<SummaryScreen messages={MOCK_MESSAGES} onNewSession={vi.fn()} />)
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
  })

  it('shows the summary after fetch resolves', async () => {
    render(<SummaryScreen messages={MOCK_MESSAGES} onNewSession={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/I goed/)).toBeInTheDocument()
    })
  })

  it('shows a "Start new session" button after loading', async () => {
    render(<SummaryScreen messages={MOCK_MESSAGES} onNewSession={vi.fn()} />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start new session/i })).toBeInTheDocument()
    )
  })

  it('calls onNewSession when "Start new session" is clicked', async () => {
    const onNewSession = vi.fn()
    render(<SummaryScreen messages={MOCK_MESSAGES} onNewSession={onNewSession} />)
    await waitFor(() => screen.getByRole('button', { name: /start new session/i }))
    fireEvent.click(screen.getByRole('button', { name: /start new session/i }))
    expect(onNewSession).toHaveBeenCalledOnce()
  })

  it('shows error message when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as unknown as typeof fetch
    render(<SummaryScreen messages={MOCK_MESSAGES} onNewSession={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/failed to generate/i)).toBeInTheDocument()
    })
  })

  it('sends full conversation history plus the summary request to /api/chat', async () => {
    render(<SummaryScreen messages={MOCK_MESSAGES} onNewSession={vi.fn()} />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('/api/chat')
    const body = JSON.parse(options.body)
    expect(body.messages).toEqual(MOCK_MESSAGES)
    expect(body.userText).toContain('summarize')
  })
})
