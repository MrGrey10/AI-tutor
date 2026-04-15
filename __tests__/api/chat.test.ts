// @vitest-environment node
import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockCreate = vi.hoisted(() => vi.fn())

vi.hoisted(() => {
  process.env.GROQ_API_KEY = 'test-key'
})

vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }
  }),
}))

import { POST } from '@/app/api/chat/route'

describe('POST /api/chat', () => {
  beforeEach(() => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Nice to meet you too!' } }],
    })
  })

  it('returns 200 with a reply from Groq', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], userText: 'Hello' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.reply).toBe('Nice to meet you too!')
  })

  it('prepends a system prompt and appends the new user message', async () => {
    const existingMessages = [{ role: 'assistant', content: 'Hello!' }]
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: existingMessages, userText: 'How are you?' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    const callArgs = mockCreate.mock.calls[mockCreate.mock.calls.length - 1][0]
    expect(callArgs.messages[0].role).toBe('system')
    expect(callArgs.messages[1]).toEqual({ role: 'assistant', content: 'Hello!' })
    expect(callArgs.messages[callArgs.messages.length - 1]).toEqual({
      role: 'user',
      content: 'How are you?',
    })
  })

  it('uses llama-3.3-70b-versatile model', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], userText: 'Hi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    const callArgs = mockCreate.mock.calls[mockCreate.mock.calls.length - 1][0]
    expect(callArgs.model).toBe('llama-3.3-70b-versatile')
  })

  it('returns 502 when Groq throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'))
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], userText: 'Hello' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(502)
    expect(data.error).toBeDefined()
  })

  it('returns 400 when userText is missing', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], userText: '' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('handles empty choices array gracefully', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [] })
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], userText: 'Hi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.reply).toBe('')
  })
})
