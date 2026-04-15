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
