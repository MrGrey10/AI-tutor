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
