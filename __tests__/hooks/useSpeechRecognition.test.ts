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
  onerror: (() => void) | null
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
    onerror: null,
  }
  const MockSpeechRecognition = vi.fn(function() { return mockRecognition })
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
