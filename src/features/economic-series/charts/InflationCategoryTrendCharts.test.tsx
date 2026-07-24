import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    domain: { min: -2.1, max: -1.9, includesZero: false },
    displayRangeLabel: '−2.1% to −1.9%',
  }],
  unsupportedCategoryIds: [],
  unsupportedLabels: [],
  unavailableCategoryIds: [],
  unavailableLabels: [],
  windowStart: '2026-05-01',
  windowEnd: '2026-05-01',
}

describe('InflationCategoryTrendCharts', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders real rate text, period, and a decorative canvas', async () => {
    const { container, unmount } = render(<InflationCategoryTrendCharts model={model} />)
    expect(screen.getByText('Energy')).toBeInTheDocument()
    expect(screen.getByText('−2.0%')).toBeInTheDocument()
    expect(screen.getByText('May 2026')).toBeInTheDocument()
    expect(screen.getByText('Scale −2.1% to −1.9%')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    unmount()
    await waitFor(() => expect(dispose).toHaveBeenCalledOnce())
  })

  it('exposes exact details by focus, keyboard, pointer, tap, and Escape', async () => {
    const user = userEvent.setup()
    render(<InflationCategoryTrendCharts model={model} />)
    const chart = screen.getByLabelText(/Energy inflation chart/)
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 100, height: 44,
      top: 0, right: 100, bottom: 44, left: 0,
      toJSON: () => ({}),
    })
    await user.tab()
    expect(chart).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Energy inflationMay 2026−2.0%',
    )
    await user.keyboard('{Escape}')
    expect(chart).toHaveFocus()
    expect(screen.queryByText('Energy inflation')).not.toBeInTheDocument()
    fireEvent.pointerMove(chart, { clientX: 1, pointerType: 'mouse' })
    expect(screen.getByRole('status')).toHaveTextContent('−2.0%')
    fireEvent.pointerLeave(chart, { pointerType: 'mouse' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.pointerDown(chart, { clientX: 1, pointerType: 'touch' })
    expect(screen.getByRole('status')).toHaveTextContent('Energy inflation')
    fireEvent.pointerDown(chart, { clientX: 1, pointerType: 'touch' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.pointerDown(chart, { clientX: 1, pointerType: 'touch' })
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders a truthful unavailable state for zero mapped trends', () => {
    render(<InflationCategoryTrendCharts model={{
      ...model, trends: [],
    }} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'No directly comparable category inflation trends are available.',
    )
  })
})
