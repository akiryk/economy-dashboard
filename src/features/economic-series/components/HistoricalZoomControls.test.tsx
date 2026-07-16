import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HistoricalZoomControls } from './HistoricalZoomControls'

afterEach(cleanup)

describe('HistoricalZoomControls', () => {
  it('provides shared keyboard-operable companion controls and an active reset', () => {
    const onMove = vi.fn()
    const onResize = vi.fn()
    const onReset = vi.fn()
    render(<HistoricalZoomControls active visiblePeriod="Visible period: January 1970–December 1977" onMove={onMove} onResize={onResize} onReset={onReset} />)

    fireEvent.click(screen.getByRole('button', { name: 'Move earlier' }))
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset zoom' }))

    expect(onMove).toHaveBeenCalledWith('earlier')
    expect(onResize).toHaveBeenCalledWith('in')
    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.getByText('Visible period: January 1970–December 1977')).toHaveAttribute('aria-live', 'polite')
  })

  it('shows reset only when zoom is active', () => {
    render(<HistoricalZoomControls active={false} visiblePeriod="Visible period: January 2000–January 2020" onMove={vi.fn()} onResize={vi.fn()} onReset={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move earlier' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled()
  })
})
