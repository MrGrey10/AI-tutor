import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatBubble } from '@/components/ChatBubble'

describe('ChatBubble', () => {
  it('renders a user message with data-testid="user-bubble"', () => {
    render(<ChatBubble message={{ role: 'user', content: 'Hello there!' }} />)
    expect(screen.getByTestId('user-bubble')).toHaveTextContent('Hello there!')
  })

  it('renders a plain tutor message with data-testid="tutor-bubble"', () => {
    render(<ChatBubble message={{ role: 'assistant', content: 'Hi! How can I help?' }} />)
    expect(screen.getByTestId('tutor-bubble')).toHaveTextContent('Hi! How can I help?')
  })

  it('splits a tutor message containing a correction into main + correction bubbles', () => {
    render(
      <ChatBubble
        message={{
          role: 'assistant',
          content: 'That sounds fun! By the way — you could say: "I went there last year."',
        }}
      />
    )
    expect(screen.getByTestId('tutor-bubble')).toHaveTextContent('That sounds fun!')
    expect(screen.getByTestId('correction-bubble')).toHaveTextContent(
      'By the way — you could say: "I went there last year."'
    )
  })

  it('renders no correction-bubble when there is no correction', () => {
    render(<ChatBubble message={{ role: 'assistant', content: 'Good job!' }} />)
    expect(screen.queryByTestId('correction-bubble')).not.toBeInTheDocument()
  })

  it('renders only a correction-bubble when the entire message is a correction', () => {
    render(
      <ChatBubble
        message={{
          role: 'assistant',
          content: 'By the way — you could say: "I am going."',
        }}
      />
    )
    expect(screen.queryByTestId('tutor-bubble')).not.toBeInTheDocument()
    expect(screen.getByTestId('correction-bubble')).toBeInTheDocument()
  })
})
