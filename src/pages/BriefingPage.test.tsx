import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { BriefingPage } from './BriefingPage'

const loadState = vi.hoisted(() => ({ current: { status: 'loading' } as { status: string; message?: string } }))

vi.mock('../features/briefing/useLaborBriefing', () => ({
  useLaborBriefing: () => loadState.current,
}))

describe('BriefingPage', () => {
  it('renders the Labor-only preview loading state and dashboard navigation', () => {
    loadState.current = { status: 'loading' }
    render(<MemoryRouter><BriefingPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'U.S. Economic Briefing' })).toBeVisible()
    expect(screen.getByText(/initial preview contains one Labor Market dimension/)).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Loading Labor briefing')
    expect(screen.getByRole('link', { name: 'Return to the full research dashboard' })).toHaveAttribute('href', '/')
  })

  it('renders a useful primary loading failure', () => {
    loadState.current = { status: 'error', message: 'The primary Labor data could not be loaded.' }
    render(<MemoryRouter><BriefingPage /></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('primary Labor data could not be loaded')
  })
})
