import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { YieldCurveCompactChart } from './YieldCurveCompactChart'
import type { YieldCurveObservation } from '../utils/yieldCurveData'

const observations: YieldCurveObservation[] = [
  { date: '2026-04-01', value: -0.2, monthlySpread: -0.2, tenYearYield: 4, threeMonthRate: 4.2 },
  { date: '2026-05-01', value: 0, monthlySpread: 0, tenYearYield: 4.1, threeMonthRate: 4.1 },
  { date: '2026-06-01', value: 0.3, monthlySpread: 0.3, tenYearYield: 4.4, threeMonthRate: 4.1 },
]

afterEach(cleanup)

describe('YieldCurveCompactChart', () => {
  it('labels the zero line and regions and supports keyboard details', async () => {
    const user = userEvent.setup()
    render(<YieldCurveCompactChart observations={observations} />)
    expect(screen.getByText('Zero = 10-year and 3-month rates are equal')).toBeVisible()
    expect(screen.getByText('Inverted')).toBeVisible()
    expect(screen.getByText('10-year yield higher')).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    const chart = screen.getByLabelText(/Use left and right arrow keys/)
    chart.focus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText('May 2026')).toBeVisible()
    expect(screen.getByText('State: nearly flat')).toBeVisible()
  })

  it('positions details at the hovered observation and hides them on pointer leave', () => {
    render(<YieldCurveCompactChart observations={observations} />)
    const chart = screen.getByLabelText(/Use left and right arrow keys/)
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 300,
    } as DOMRect)

    fireEvent.pointerMove(chart, { clientX: 250, pointerType: 'mouse' })
    const tooltip = screen.getByRole('status')
    expect(tooltip).toHaveTextContent('May 2026')
    expect(tooltip).toHaveStyle({ left: '50%' })

    fireEvent.pointerLeave(chart, { pointerType: 'mouse' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('opens the probabilistic-signal help', async () => {
    const user = userEvent.setup()
    render(<YieldCurveCompactChart observations={observations} />)
    await user.click(screen.getByRole('button', { name: 'Explain the yield curve spread' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('signal is probabilistic')
    expect(screen.getByRole('dialog')).toHaveTextContent('New York Fed’s recession-probability framework')
  })
})
