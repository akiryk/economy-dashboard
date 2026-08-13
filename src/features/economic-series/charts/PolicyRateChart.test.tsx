import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PolicyRateChart } from './PolicyRateChart'

const observations = [
  { date: '2024-01-01', lower: 5.25, upper: 5.5, midpoint: 5.375, regime: 'target-range' as const },
  { date: '2024-09-19', lower: 4.75, upper: 5, midpoint: 4.875, regime: 'target-range' as const },
  { date: '2025-01-01', lower: 4.75, upper: 5, midpoint: 4.875, regime: 'target-range' as const },
]

afterEach(cleanup)

describe('PolicyRateChart', () => {
  it('renders discrete range segments and only shows details during interaction', () => {
    const { container } = render(<PolicyRateChart observations={observations} compact />)
    const plot = screen.getByLabelText(/Hover, tap, or use left and right arrow keys/)
    expect(container.querySelectorAll('.policy-rate-chart__band')).toHaveLength(2)
    expect(container.querySelector('.policy-rate-chart__band')).toHaveAttribute('width')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fireEvent.focus(plot)
    expect(screen.getByRole('status')).toHaveTextContent('January 1, 2025')
    fireEvent.keyDown(plot, { key: 'ArrowLeft' })
    expect(screen.getByRole('status')).toHaveTextContent('September 19, 2024')
    fireEvent.blur(plot)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('updates on pointer movement and clears on pointer leave', () => {
    render(<PolicyRateChart observations={observations} compact />)
    const plot = screen.getByLabelText(/Hover, tap, or use left and right arrow keys/)
    Object.defineProperty(plot, 'getBoundingClientRect', {
      value: () => ({ left: 0, right: 100, top: 0, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) }),
    })
    fireEvent.pointerMove(plot, { clientX: 5, pointerType: 'mouse' })
    expect(screen.getByRole('status')).toHaveTextContent('January 1, 2024')
    fireEvent.pointerMove(plot, { clientX: 95, pointerType: 'mouse' })
    expect(screen.getByRole('status')).toHaveTextContent('January 1, 2025')
    fireEvent.pointerLeave(plot, { pointerType: 'mouse' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
