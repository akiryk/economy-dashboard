import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { InflationDriversSupportingTrendsModel } from '../utils/inflationCategoryTrends'
import { InflationCategoryTrendCharts } from './InflationCategoryTrendCharts'

const dispose = vi.fn()
vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose })),
}))

const model: InflationDriversSupportingTrendsModel = {
  trends: [{
    contributionCategoryId: 'energy',
    inflationSeriesSlug: 'energy-cpi-inflation',
    label: 'Energy',
    currentInflationRate: -2,
    currentPeriod: '2026-05-01',
    observations: [{ date: '2026-05-01', value: -2 }],
    startPeriod: '2026-05-01',
    endPeriod: '2026-05-01',
  }],
  unsupportedCategoryIds: [],
  unsupportedLabels: [],
  unavailableCategoryIds: [],
  unavailableLabels: [],
  sharedDomain: [-3, 4],
  windowStart: '2026-05-01',
  windowEnd: '2026-05-01',
}

describe('InflationCategoryTrendCharts', () => {
  afterEach(() => vi.clearAllMocks())

  it('renders real rate text, period, and a decorative canvas', async () => {
    const { container, unmount } = render(<InflationCategoryTrendCharts model={model} />)
    expect(screen.getByText('Energy')).toBeInTheDocument()
    expect(screen.getByText('−2.0%')).toBeInTheDocument()
    expect(screen.getByText('May 2026')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    unmount()
    await waitFor(() => expect(dispose).toHaveBeenCalledOnce())
  })

  it('renders a truthful unavailable state for zero mapped trends', () => {
    render(<InflationCategoryTrendCharts model={{
      ...model, trends: [], sharedDomain: null,
    }} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'No directly comparable category inflation trends are available.',
    )
  })
})
