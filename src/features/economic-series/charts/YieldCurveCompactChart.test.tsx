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
  it('uses an accessible dashed zero line, external region labels, and compact dates', () => {
    const { container } = render(<YieldCurveCompactChart observations={observations} />)
    expect(screen.queryByText('Zero = 10-year and 3-month rates are equal'))
      .not.toBeInTheDocument()
    expect(screen.getByText('Inverted')).toHaveClass('yield-curve-compact-chart__region-label')
    expect(screen.getByText('10-year yield higher')).toHaveClass('yield-curve-compact-chart__region-label')
    expect(container.querySelector('.yield-curve-compact-chart__zero'))
      .toHaveClass('yield-curve-compact-chart__zero')
    expect(container.querySelector('.yield-curve-compact-chart__latest'))
      .toHaveStyle({ width: '.4rem', height: '.4rem' })
    expect(container.querySelector('.yield-curve-compact-chart__dates'))
      .toHaveTextContent('April 2026June 2026')
    expect(container.querySelector('figcaption')).toHaveTextContent(
      'zero means the component rates are equal',
    )
  })

  it('supports concise keyboard details without a state label', async () => {
    const user = userEvent.setup()
    render(<YieldCurveCompactChart observations={observations} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    const chart = screen.getByLabelText(/Use left and right arrow keys/)
    chart.focus()
    await user.keyboard('{ArrowLeft}')
    const tooltip = screen.getByRole('status')
    expect(tooltip).toHaveTextContent('May 2026')
    expect(tooltip).toHaveTextContent('Spread 0.0 pp')
    expect(tooltip).toHaveTextContent('10Y 4.10% · 3M 4.10%')
    expect(tooltip).not.toHaveTextContent('State')
    expect(tooltip).not.toHaveTextContent('Three-month-average spread')
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
    expect(tooltip.style.getPropertyValue('--yield-curve-tooltip-position'))
      .toBe('50%')

    fireEvent.pointerLeave(chart, { pointerType: 'mouse' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('pins details on tap and dismisses them on a second tap', () => {
    render(<YieldCurveCompactChart observations={observations} />)
    const chart = screen.getByLabelText(/Use left and right arrow keys/)
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 300,
    } as DOMRect)

    fireEvent.pointerDown(chart, { clientX: 0, pointerType: 'touch' })
    expect(screen.getByRole('status')).toHaveTextContent('April 2026')
    fireEvent.pointerLeave(chart, { pointerType: 'touch' })
    expect(screen.getByRole('status')).toBeVisible()
    fireEvent.pointerDown(chart, { clientX: 0, pointerType: 'touch' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('opens the probabilistic-signal help', async () => {
    const user = userEvent.setup()
    render(<YieldCurveCompactChart observations={observations} />)
    await user.click(screen.getByRole('button', { name: 'Explain the yield curve spread' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('signal is probabilistic')
    expect(screen.getByRole('dialog')).toHaveTextContent('New York Fed’s recession-probability framework')
    expect(screen.getByRole('dialog')).toHaveTextContent('zero means the two component rates are equal')
  })
})
