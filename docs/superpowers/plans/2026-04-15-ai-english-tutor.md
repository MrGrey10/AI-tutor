# AI English Tutor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js voice-based English tutor app that listens to the user, sends speech to a Groq LLM, corrects mistakes inline, reads responses aloud via browser TTS, and summarizes mistakes at session end.

**Architecture:** Browser Web Speech API handles STT and TTS. A Next.js API route proxies all LLM calls to Groq (keeping the API key server-side). All session state lives in React state — no persistence.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Groq SDK (`groq-sdk`), Vitest, React Testing Library, `@netlify/plugin-nextjs`

---

## File Map

```
app/
  layout.tsx                       — root layout, metadata, fonts
  page.tsx                         — root page, owns view state (start | chat | summary)
  globals.css                      — Tailwind base imports
  api/chat/route.ts                — POST handler: proxies to Groq, returns { reply }

components/
  StartScreen.tsx                  — topic picker / free chat start button
  ChatScreen.tsx                   — conversation view, orchestrates STT + fetch + TTS
  SummaryScreen.tsx                — fetches and displays end-of-session mistake summary
  MicButton.tsx                    — push-to-talk (mobile) / toggle (desktop) mic control
  ChatBubble.tsx                   — single message bubble (user / tutor / correction styles)
  BrowserWarning.tsx               — shown when SpeechRecognition is unavailable

hooks/
  useSpeechRecognition.ts          — Web Speech API abstraction

lib/
  tts.ts                           — Web Speech Synthesis wrapper (speak / stopSpeaking)

types/
  chat.ts                          — Message, View types + TOPICS constant

__tests__/
  api/chat.test.ts
  lib/tts.test.ts
  hooks/useSpeechRecognition.test.ts
  components/ChatBubble.test.tsx
  components/MicButton.test.tsx
  components/StartScreen.test.tsx
  components/ChatScreen.test.tsx
  components/SummaryScreen.test.tsx

vitest.config.ts
vitest.setup.ts
netlify.toml
.env.local.example
```

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: all scaffold files via `create-next-app`

- [ ] **Step 1: Scaffold the project**

```bash
cd /Users/pruvorottya/Desktop/petProjects/aienglish
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

When prompted, accept defaults.

- [ ] **Step 2: Install dependencies**

```bash
npm install groq-sdk
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @netlify/plugin-nextjs
```

- [ ] **Step 3: Remove boilerplate**

Delete the contents of `app/page.tsx` — we will replace it entirely in Task 13.
Delete the contents of `app/globals.css` except the Tailwind directives (keep lines `@tailwind base`, `@tailwind components`, `@tailwind utilities`).

- [ ] **Step 4: Create `.env.local.example`**

```
GROQ_API_KEY=your_groq_api_key_here
```

Also create `.env.local` with your real key (do not commit this file — it is already in `.gitignore`).

- [ ] **Step 5: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test script to `package.json`**

In the `"scripts"` section, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify Vitest works**

```bash
npm test
```

Expected: "No test files found" — that's fine at this stage.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json package-lock.json
git commit -m "chore: add Vitest with React Testing Library"
```

---

## Task 3: Types

**Files:**
- Create: `types/chat.ts`

- [ ] **Step 1: Create `types/chat.ts`**

```typescript
export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export type View = 'start' | 'chat' | 'summary'

export interface Topic {
  id: string
  label: string
  prompt: string
}

export const TOPICS: Topic[] = [
  {
    id: 'job-interview',
    label: 'Job Interview',
    prompt: "Let's practice for a job interview. I'll play the interviewer — I'll ask you questions a real interviewer might ask.",
  },
  {
    id: 'travel',
    label: 'Travel',
    prompt: "Let's chat about travel. Tell me about a place you'd like to visit or somewhere you've already been.",
  },
  {
    id: 'daily-life',
    label: 'Daily Life',
    prompt: "Let's talk about your daily routine and everyday life. What does a typical day look like for you?",
  },
  {
    id: 'technology',
    label: 'Technology',
    prompt: "Let's discuss technology. What gadgets or apps do you use most, and how do they help you?",
  },
  {
    id: 'hobbies',
    label: 'Hobbies',
    prompt: "Let's talk about hobbies. What do you enjoy doing in your free time, and how did you get into it?",
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add types/chat.ts
git commit -m "feat: add shared types and topic constants"
```

---

## Task 4: API Route

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `__tests__/api/chat.test.ts`

- [ ] **Step 1: Write the failing test — create `__tests__/api/chat.test.ts`**

```typescript
import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}))

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
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/api/chat.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/chat/route'`

- [ ] **Step 3: Create `app/api/chat/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `You are a friendly, encouraging English conversation tutor for intermediate learners. Respond naturally as a conversation partner — keep replies concise (2–4 sentences). If the user makes a grammar or vocabulary mistake, first respond to what they said naturally, then add a short correction: "By the way — you could say: [corrected version]." Never refuse to engage with a topic; always keep the conversation going. If a topic was selected at the start, keep responses relevant to that topic for the first few exchanges, then let the conversation flow naturally.`

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, userText } = await req.json()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
      { role: 'user', content: userText },
    ],
    stream: false,
  })

  const reply = completion.choices[0].message.content ?? ''
  return NextResponse.json({ reply })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/api/chat.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/route.ts __tests__/api/chat.test.ts
git commit -m "feat: add /api/chat route proxying Groq LLM"
```

---

## Task 5: TTS Library

**Files:**
- Create: `lib/tts.ts`
- Create: `__tests__/lib/tts.test.ts`

- [ ] **Step 1: Write the failing test — create `__tests__/lib/tts.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { speak, stopSpeaking } from '@/lib/tts'

describe('speak', () => {
  let mockSpeak: ReturnType<typeof vi.fn>
  let mockCancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSpeak = vi.fn()
    mockCancel = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: { speak: mockSpeak, cancel: mockCancel },
    })
    global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text: string) => ({
      text,
      lang: '',
      rate: 1,
    })) as unknown as typeof SpeechSynthesisUtterance
  })

  it('cancels existing speech before speaking', () => {
    speak('Hello')
    expect(mockCancel).toHaveBeenCalledOnce()
    expect(mockSpeak).toHaveBeenCalledOnce()
  })

  it('sets lang to en-US and rate to 0.9 on the utterance', () => {
    speak('Hello')
    const utterance = mockSpeak.mock.calls[0][0]
    expect(utterance.lang).toBe('en-US')
    expect(utterance.rate).toBe(0.9)
  })

  it('does nothing if speechSynthesis is unavailable', () => {
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: undefined,
    })
    expect(() => speak('test')).not.toThrow()
  })
})

describe('stopSpeaking', () => {
  it('calls cancel on speechSynthesis', () => {
    const mockCancel = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: { cancel: mockCancel, speak: vi.fn() },
    })
    stopSpeaking()
    expect(mockCancel).toHaveBeenCalledOnce()
  })

  it('does nothing if speechSynthesis is unavailable', () => {
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: undefined,
    })
    expect(() => stopSpeaking()).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/tts.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/tts'`

- [ ] **Step 3: Create `lib/tts.ts`**

```typescript
export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/tts.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/tts.ts __tests__/lib/tts.test.ts
git commit -m "feat: add TTS wrapper using Web Speech Synthesis API"
```

---

## Task 6: useSpeechRecognition Hook

**Files:**
- Create: `hooks/useSpeechRecognition.ts`
- Create: `__tests__/hooks/useSpeechRecognition.test.ts`

- [ ] **Step 1: Write the failing test — create `__tests__/hooks/useSpeechRecognition.test.ts`**

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

type MockRecognition = {
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { results: [[{ transcript: string }]] }) => void) | null
  onend: (() => void) | null
}

let mockRecognition: MockRecognition

beforeEach(() => {
  mockRecognition = {
    start: vi.fn(),
    stop: vi.fn(),
    lang: '',
    interimResults: false,
    maxAlternatives: 1,
    onresult: null,
    onend: null,
  }
  const MockSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition)
  Object.defineProperty(window, 'SpeechRecognition', {
    writable: true,
    configurable: true,
    value: MockSpeechRecognition,
  })
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    writable: true,
    configurable: true,
    value: MockSpeechRecognition,
  })
})

describe('useSpeechRecognition', () => {
  it('reports isSupported: true when SpeechRecognition is available', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()))
    expect(result.current.isSupported).toBe(true)
  })

  it('reports isSupported: false when SpeechRecognition is unavailable', () => {
    Object.defineProperty(window, 'SpeechRecognition', { writable: true, configurable: true, value: undefined })
    Object.defineProperty(window, 'webkitSpeechRecognition', { writable: true, configurable: true, value: undefined })
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()))
    expect(result.current.isSupported).toBe(false)
  })

  it('starts recognition and sets isListening to true', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()))
    act(() => { result.current.startListening() })
    expect(mockRecognition.start).toHaveBeenCalledOnce()
    expect(result.current.isListening).toBe(true)
  })

  it('calls onResult with the recognized transcript', () => {
    const onResult = vi.fn()
    const { result } = renderHook(() => useSpeechRecognition(onResult))
    act(() => { result.current.startListening() })
    act(() => {
      mockRecognition.onresult?.({ results: [[{ transcript: 'Hello world' }]] })
    })
    expect(onResult).toHaveBeenCalledWith('Hello world')
  })

  it('sets isListening to false when recognition ends', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()))
    act(() => { result.current.startListening() })
    act(() => { mockRecognition.onend?.() })
    expect(result.current.isListening).toBe(false)
  })

  it('stops recognition and sets isListening to false', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()))
    act(() => { result.current.startListening() })
    act(() => { result.current.stopListening() })
    expect(mockRecognition.stop).toHaveBeenCalledOnce()
    expect(result.current.isListening).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/hooks/useSpeechRecognition.test.ts
```

Expected: FAIL — `Cannot find module '@/hooks/useSpeechRecognition'`

- [ ] **Step 3: Create `hooks/useSpeechRecognition.ts`**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'

interface UseSpeechRecognitionResult {
  isListening: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
}

export function useSpeechRecognition(
  onResult: (transcript: string) => void
): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const Api =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    setIsSupported(!!Api)
  }, [])

  const startListening = () => {
    const Api =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!Api) return

    const recognition = new Api()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  return { isListening, isSupported, startListening, stopListening }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/hooks/useSpeechRecognition.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add hooks/useSpeechRecognition.ts __tests__/hooks/useSpeechRecognition.test.ts
git commit -m "feat: add useSpeechRecognition hook wrapping Web Speech API"
```

---

## Task 7: BrowserWarning Component

**Files:**
- Create: `components/BrowserWarning.tsx`
- Create: `__tests__/components/BrowserWarning.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/BrowserWarning.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserWarning } from '@/components/BrowserWarning'

describe('BrowserWarning', () => {
  it('renders the unsupported browser message', () => {
    render(<BrowserWarning />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/chrome or edge/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/BrowserWarning.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/BrowserWarning'`

- [ ] **Step 3: Create `components/BrowserWarning.tsx`**

```typescript
export function BrowserWarning() {
  return (
    <div
      role="alert"
      className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-yellow-800 text-sm"
    >
      Your browser does not support voice input. Please use{' '}
      <strong>Chrome or Edge</strong> to use this app.
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/BrowserWarning.test.tsx
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add components/BrowserWarning.tsx __tests__/components/BrowserWarning.test.tsx
git commit -m "feat: add BrowserWarning component for unsupported browsers"
```

---

## Task 8: ChatBubble Component

**Files:**
- Create: `components/ChatBubble.tsx`
- Create: `__tests__/components/ChatBubble.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/ChatBubble.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/ChatBubble.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ChatBubble'`

- [ ] **Step 3: Create `components/ChatBubble.tsx`**

```typescript
import { Message } from '@/types/chat'

interface ChatBubbleProps {
  message: Message
}

const CORRECTION_MARKER = 'By the way —'

export function ChatBubble({ message }: ChatBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div
          data-testid="user-bubble"
          className="max-w-[75%] rounded-2xl rounded-br-sm bg-blue-500 text-white px-4 py-2 text-sm"
        >
          {message.content}
        </div>
      </div>
    )
  }

  const correctionIndex = message.content.indexOf(CORRECTION_MARKER)

  if (correctionIndex === -1) {
    return (
      <div className="flex justify-start mb-3">
        <div
          data-testid="tutor-bubble"
          className="max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800 px-4 py-2 text-sm"
        >
          {message.content}
        </div>
      </div>
    )
  }

  const mainText = message.content.slice(0, correctionIndex).trim()
  const correctionText = message.content.slice(correctionIndex)

  return (
    <div className="flex flex-col items-start gap-2 mb-3">
      {mainText && (
        <div
          data-testid="tutor-bubble"
          className="max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800 px-4 py-2 text-sm"
        >
          {mainText}
        </div>
      )}
      <div
        data-testid="correction-bubble"
        className="max-w-[75%] rounded-2xl rounded-bl-sm bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm"
      >
        {correctionText}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/ChatBubble.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ChatBubble.tsx __tests__/components/ChatBubble.test.tsx
git commit -m "feat: add ChatBubble component with correction splitting"
```

---

## Task 9: MicButton Component

**Files:**
- Create: `components/MicButton.tsx`
- Create: `__tests__/components/MicButton.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/MicButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MicButton } from '@/components/MicButton'

describe('MicButton — desktop (maxTouchPoints = 0)', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true,
    })
  })

  it('shows "Click to speak" when not listening', () => {
    render(<MicButton isListening={false} onStart={vi.fn()} onStop={vi.fn()} />)
    expect(screen.getByText(/click to speak/i)).toBeInTheDocument()
  })

  it('shows "Click to stop" when listening', () => {
    render(<MicButton isListening={true} onStart={vi.fn()} onStop={vi.fn()} />)
    expect(screen.getByText(/click to stop/i)).toBeInTheDocument()
  })

  it('calls onStart on click when not listening', () => {
    const onStart = vi.fn()
    render(<MicButton isListening={false} onStart={onStart} onStop={vi.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onStop on click when listening', () => {
    const onStop = vi.fn()
    render(<MicButton isListening={true} onStart={vi.fn()} onStop={onStop} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is true', () => {
    render(<MicButton isListening={false} onStart={vi.fn()} onStop={vi.fn()} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('MicButton — mobile (maxTouchPoints = 1)', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 1,
      writable: true,
      configurable: true,
    })
  })

  it('shows "Hold to speak" when not listening', () => {
    render(<MicButton isListening={false} onStart={vi.fn()} onStop={vi.fn()} />)
    expect(screen.getByText(/hold to speak/i)).toBeInTheDocument()
  })

  it('calls onStart on pointerDown', () => {
    const onStart = vi.fn()
    render(<MicButton isListening={false} onStart={onStart} onStop={vi.fn()} />)
    fireEvent.pointerDown(screen.getByRole('button'))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onStop on pointerUp', () => {
    const onStop = vi.fn()
    render(<MicButton isListening={true} onStart={vi.fn()} onStop={onStop} />)
    fireEvent.pointerUp(screen.getByRole('button'))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('calls onStop on pointerLeave', () => {
    const onStop = vi.fn()
    render(<MicButton isListening={true} onStart={vi.fn()} onStop={onStop} />)
    fireEvent.pointerLeave(screen.getByRole('button'))
    expect(onStop).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/MicButton.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/MicButton'`

- [ ] **Step 3: Create `components/MicButton.tsx`**

```typescript
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
        onPointerDown={onStart}
        onPointerUp={onStop}
        onPointerLeave={onStop}
        className={`${baseClass} ${isListening ? listeningClass : idleClass}`}
        aria-label={isListening ? 'Release to send' : 'Hold to speak'}
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
    >
      {isListening ? 'Click to stop' : 'Click to speak'}
    </button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/MicButton.test.tsx
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/MicButton.tsx __tests__/components/MicButton.test.tsx
git commit -m "feat: add MicButton with push-to-talk (mobile) and toggle (desktop)"
```

---

## Task 10: StartScreen Component

**Files:**
- Create: `components/StartScreen.tsx`
- Create: `__tests__/components/StartScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/StartScreen.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StartScreen } from '@/components/StartScreen'

describe('StartScreen', () => {
  it('renders a "Free chat" button', () => {
    render(<StartScreen onStart={vi.fn()} />)
    expect(screen.getByRole('button', { name: /free chat/i })).toBeInTheDocument()
  })

  it('renders all 5 topic buttons', () => {
    render(<StartScreen onStart={vi.fn()} />)
    expect(screen.getByRole('button', { name: /job interview/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /travel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /daily life/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /technology/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hobbies/i })).toBeInTheDocument()
  })

  it('calls onStart with undefined when "Free chat" is clicked', () => {
    const onStart = vi.fn()
    render(<StartScreen onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: /free chat/i }))
    expect(onStart).toHaveBeenCalledWith(undefined)
  })

  it('calls onStart with the travel topic prompt when "Travel" is clicked', () => {
    const onStart = vi.fn()
    render(<StartScreen onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: /travel/i }))
    expect(onStart).toHaveBeenCalledWith(expect.stringContaining('travel'))
  })

  it('calls onStart with a prompt for each topic', () => {
    const onStart = vi.fn()
    render(<StartScreen onStart={onStart} />)
    ;['job interview', 'travel', 'daily life', 'technology', 'hobbies'].forEach((name) => {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(name, 'i') }))
    })
    expect(onStart).toHaveBeenCalledTimes(5)
    onStart.mock.calls.forEach((call) => {
      expect(typeof call[0]).toBe('string')
      expect(call[0].length).toBeGreaterThan(0)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/StartScreen.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/StartScreen'`

- [ ] **Step 3: Create `components/StartScreen.tsx`**

```typescript
import { TOPICS } from '@/types/chat'

interface StartScreenProps {
  onStart: (initialMessage?: string) => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AI English Tutor</h1>
        <p className="text-gray-500 mb-10">Practice your English conversation skills with an AI partner.</p>

        <button
          onClick={() => onStart(undefined)}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition-colors mb-8"
        >
          Free chat
        </button>

        <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Or choose a topic</p>

        <div className="grid grid-cols-1 gap-3">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onStart(topic.prompt)}
              className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/StartScreen.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/StartScreen.tsx __tests__/components/StartScreen.test.tsx
git commit -m "feat: add StartScreen with free chat and topic selection"
```

---

## Task 11: SummaryScreen Component

**Files:**
- Create: `components/SummaryScreen.tsx`
- Create: `__tests__/components/SummaryScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/SummaryScreen.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/SummaryScreen.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/SummaryScreen'`

- [ ] **Step 3: Create `components/SummaryScreen.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import type { Message } from '@/types/chat'

const SUMMARY_PROMPT =
  'Please summarize all the grammar and vocabulary mistakes I made in this session with their corrections. Format as a numbered list. If there were no mistakes, say so.'

interface SummaryScreenProps {
  messages: Message[]
  onNewSession: () => void
}

export function SummaryScreen({ messages, onNewSession }: SummaryScreenProps) {
  const [summary, setSummary] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userText: SUMMARY_PROMPT }),
    })
      .then((res) => res.json())
      .then((data) => setSummary(data.reply))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-lg w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Session Summary</h2>

        {isLoading ? (
          <p className="text-gray-400 text-center">Generating your summary…</p>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-6 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-8">
            {summary}
          </div>
        )}

        {!isLoading && (
          <button
            onClick={onNewSession}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition-colors"
          >
            Start new session
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/SummaryScreen.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/SummaryScreen.tsx __tests__/components/SummaryScreen.test.tsx
git commit -m "feat: add SummaryScreen that fetches and displays session mistake summary"
```

---

## Task 12: ChatScreen Component

**Files:**
- Create: `components/ChatScreen.tsx`
- Create: `__tests__/components/ChatScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/ChatScreen.test.tsx
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
  MicButton: ({ onStart, onStop }: { onStart: () => void; onStop: () => void }) => (
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/ChatScreen.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ChatScreen'`

- [ ] **Step 3: Create `components/ChatScreen.tsx`**

```typescript
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

  // Speak the initial topic message once on mount
  useEffect(() => {
    if (initialMessage) speak(initialMessage)
  }, [])

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleTranscript = async (transcript: string) => {
    const userMessage: Message = { role: 'user', content: transcript }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
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
    } finally {
      setIsLoading(false)
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/ChatScreen.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ChatScreen.tsx __tests__/components/ChatScreen.test.tsx
git commit -m "feat: add ChatScreen orchestrating STT, Groq API, and TTS"
```

---

## Task 13: Root Page — Wire Up Views

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```typescript
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
```

- [ ] **Step 2: Update `app/layout.tsx` metadata**

Replace the existing metadata with:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI English Tutor',
  description: 'Practice English conversation with an AI tutor',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Run all tests to verify nothing is broken**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Run the dev server and manually verify the app**

```bash
npm run dev
```

Open http://localhost:3000 in Chrome and verify:
- Start screen shows "Free chat" and 5 topic buttons
- Clicking a topic starts a chat with an initial tutor message that is spoken aloud
- Mic button responds to click (desktop toggle) — your speech is transcribed and the tutor responds
- Tutor corrections appear in amber bubbles
- "End session" shows the summary screen with a numbered list of mistakes
- "Start new session" returns to the start screen

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: wire up view state in root page connecting all screens"
```

---

## Task 14: Netlify Deployment

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 2: Verify the production build works locally**

```bash
npm run build
```

Expected: Build completes with no errors. Check for any TypeScript or ESLint errors and fix them.

- [ ] **Step 3: Commit**

```bash
git add netlify.toml
git commit -m "chore: add Netlify config for Next.js deployment"
```

- [ ] **Step 4: Deploy to Netlify**

Either connect the repo in the Netlify dashboard (recommended — push to GitHub first), or use the Netlify CLI:

```bash
npx netlify-cli deploy --prod
```

In the Netlify dashboard, go to **Site settings → Environment variables** and add:

```
GROQ_API_KEY = <your key from console.groq.com>
```

Trigger a redeploy after adding the env var.

- [ ] **Step 5: Smoke test the deployed app**

Open the Netlify URL in Chrome on both desktop and mobile. Verify:
- Voice input works (Chrome required)
- Tutor replies are spoken aloud
- Corrections appear in amber bubbles
- End session summary generates correctly

---

## Final State

After all tasks complete:

```
✅ Next.js app with TypeScript + Tailwind
✅ /api/chat proxies to Groq (API key never in browser)
✅ Browser Web Speech API for STT + TTS
✅ Push-to-talk on mobile, toggle on desktop
✅ Inline grammar corrections in amber bubbles
✅ End-of-session mistake summary
✅ All tests passing (api, lib, hooks, components)
✅ Deployed on Netlify
```
