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
