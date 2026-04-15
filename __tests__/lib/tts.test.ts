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
    global.SpeechSynthesisUtterance = class {
      text: string
      lang: string
      rate: number

      constructor(text: string) {
        this.text = text
        this.lang = ''
        this.rate = 1
      }
    } as unknown as typeof SpeechSynthesisUtterance
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
