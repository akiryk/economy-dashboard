import { cleanup, render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('img', { name: /Real GDP growth was 2.7% in 2026 Q1/ })).toBeVisible()
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

  it('omits the chart and latest marker when the latest observation is unavailable', () => {
    render(<GdpCompactHistoricalChart context={{
      status: 'latest-unavailable', recentObservations: [{ date: '2026-01-01', value: null }],
      latestObservation: { date: '2026-01-01', value: null }, latestPosition: 'unavailable',
      comparisonStart: '2001-01-01', comparisonEnd: '2026-01-01',
      validObservationCount: 100, recentObservationCount: 1, minimumRequired: 20,
    }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Historical GDP context is unavailable.')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(init).not.toHaveBeenCalled()
  })
})
