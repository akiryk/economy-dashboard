import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CompactGdpHistoricalContextResult } from '../utils/gdpCompactHistoricalContext'
import { GdpCompactHistoricalChart } from './GdpCompactHistoricalChart'

const chart = vi.hoisted(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }))
const init = vi.hoisted(() => vi.fn(() => chart))

vi.mock('echarts/core', () => ({ init, use: vi.fn() }))

afterEach(() => {
  cleanup()
  init.mockClear()
  chart.setOption.mockClear()
  chart.resize.mockClear()
  chart.dispose.mockClear()
})

const ready: CompactGdpHistoricalContextResult = {
  status: 'ready', recentObservations: [{ date: '2026-01-01', value: 2.7 }],
  outerLower: 0.5, innerLower: 1.7, median: 2.3, innerUpper: 3, outerUpper: 3.5,
  latestPosition: 'insideInnerBand', latestObservation: { date: '2026-01-01', value: 2.7 },
  comparisonStart: '2001-01-01', comparisonEnd: '2026-01-01',
  validObservationCount: 101, recentObservationCount: 1,
}

describe('GdpCompactHistoricalChart', () => {
  it('initializes the existing ECharts lifecycle and exposes the factual summary', () => {
    const { unmount } = render(<GdpCompactHistoricalChart context={ready} />)
    expect(screen.getByRole('figure', { name: /Real GDP growth was 2.7% in 2026 Q1/ })).toBeVisible()
    expect(screen.getByText(/darker band marks the middle 50%/)).toBeVisible()
    expect(init).toHaveBeenCalledOnce()
    expect(chart.setOption).toHaveBeenCalledOnce()
    unmount()
    expect(chart.dispose).toHaveBeenCalledOnce()
  })

  it('does not initialize false bands for insufficient history', () => {
    render(<GdpCompactHistoricalChart context={{
      status: 'insufficient-history', recentObservations: [], latestObservation: null,
      latestPosition: 'unavailable', comparisonStart: null, comparisonEnd: null,
      validObservationCount: 0, recentObservationCount: 0, minimumRequired: 20,
    }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Historical GDP context is unavailable.')
    expect(init).not.toHaveBeenCalled()
  })

  it('keeps one accessible summary when production visually hides the caption', () => {
    render(<GdpCompactHistoricalChart context={ready} visuallyHideSummary />)
    const figure = screen.getByRole('figure', { name: /Real GDP growth was 2.7% in 2026 Q1/ })
    expect(figure).toBeVisible()
    expect(screen.getAllByText(/Real GDP growth was 2.7% in 2026 Q1/)).toHaveLength(1)
    expect(screen.getByText(/Real GDP growth was 2.7% in 2026 Q1/)).toHaveClass(
      'visually-hidden',
    )
  })

  it('opens band help from the button and dismisses it with Escape or an outside click', async () => {
    const user = userEvent.setup()
    render(<GdpCompactHistoricalChart context={ready} visuallyHideSummary />)
    const button = screen.getByRole('button', { name: 'Explain the historical bands' })

    expect(button).toHaveAttribute('aria-expanded', 'false')
    button.focus()
    await user.keyboard('{Enter}')

    const help = screen.getByRole('dialog', { name: 'Historical band explanation' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(help).toHaveTextContent('Comparison period: 2001 Q1 through 2026 Q1.')
    expect(help).toHaveTextContent('Dark band: middle 50% of historical readings.')
    expect(help).toHaveTextContent('Light bands: extend the range to the middle 80%.')
    expect(help).toHaveTextContent(
      'Readings outside the bands are in the highest or lowest 10% of history.',
    )

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button).toHaveFocus()

    await user.click(button)
    expect(screen.getByRole('dialog')).toBeVisible()
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('omits the chart and latest marker when the latest observation is unavailable', () => {
    render(<GdpCompactHistoricalChart context={{
      status: 'latest-unavailable', recentObservations: [{ date: '2026-01-01', value: null }],
      latestObservation: { date: '2026-01-01', value: null }, latestPosition: 'unavailable',
      comparisonStart: '2001-01-01', comparisonEnd: '2026-01-01',
      validObservationCount: 100, recentObservationCount: 1, minimumRequired: 20,
    }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Historical GDP context is unavailable.')
    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
    expect(init).not.toHaveBeenCalled()
  })
})
