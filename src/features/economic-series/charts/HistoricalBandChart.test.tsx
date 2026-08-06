import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HistoricalBandModel } from '../utils/historicalBandContext'
import { HistoricalBandChart } from './HistoricalBandChart'

const setCursorStyle = vi.hoisted(() => vi.fn())
const chart = vi.hoisted(() => ({
  setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(),
  getZr: vi.fn(() => ({ setCursorStyle })),
}))
const init = vi.hoisted(() => vi.fn(() => chart))

vi.mock('echarts/core', () => ({ init, use: vi.fn() }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const model: HistoricalBandModel = {
  status: 'ready',
  recentObservations: [
    { date: '2021-04-01', value: 1 },
    { date: '2026-01-01', value: 2 },
  ],
  outerLower: -1, innerLower: 0.5, median: 1,
  innerUpper: 2.5, outerUpper: 4,
  latestObservation: { date: '2026-01-01', value: 2 },
  comparisonStart: '2001-01-01', comparisonEnd: '2026-01-01',
  validObservationCount: 101, recentObservationCount: 20,
}

const defaultProps = {
  model,
  seriesLabel: 'Example growth',
  frequency: 'quarterly' as const,
  valueFormatter: (value: number | null) => value === null ? 'Unavailable' : `${value}%`,
  accessibleSummary: 'Example accessible summary',
  latestPositionDescription: 'within the historical middle 50%',
  helpText: {
    heading: 'Recent historical comparison: past 25 years',
    description: 'The dark band shows the middle 50%.',
  },
  caption: 'Example growth · 2021 Q2–2026 Q1',
  showZeroLine: true,
  showLatestMarker: true,
}

describe('HistoricalBandChart', () => {
  it('owns one chart lifecycle and exposes one supplied accessible summary', () => {
    const { rerender, unmount } = render(
      <HistoricalBandChart {...defaultProps} visuallyHideSummary />,
    )
    expect(screen.getByRole('figure', { name: 'Example accessible summary' })).toBeVisible()
    expect(screen.getAllByText('Example accessible summary')).toHaveLength(1)
    expect(screen.getByText('Example accessible summary')).toHaveClass('visually-hidden')
    expect(screen.getByText('Example growth · 2021 Q2–2026 Q1')).toBeVisible()
    expect(init).toHaveBeenCalledOnce()
    expect(setCursorStyle).toHaveBeenCalledWith('crosshair')
    rerender(<HistoricalBandChart {...defaultProps} visuallyHideSummary />)
    expect(init).toHaveBeenCalledOnce()
    expect(chart.dispose).not.toHaveBeenCalled()
    unmount()
    expect(chart.dispose).toHaveBeenCalledOnce()
  })

  it('opens supplied help by hover, click, and keyboard and dismisses accessibly', async () => {
    const user = userEvent.setup()
    render(<HistoricalBandChart {...defaultProps} />)
    const button = screen.getByRole('button', { name: 'Explain the historical bands' })

    await user.hover(button)
    expect(screen.getByRole('dialog')).toHaveTextContent('The dark band shows the middle 50%.')
    await user.unhover(button)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button).toHaveFocus()

    await user.keyboard(' ')
    expect(screen.getByRole('dialog')).toBeVisible()
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reveals exact details by keyboard, pointer, and tap when enabled', async () => {
    const user = userEvent.setup()
    render(
      <HistoricalBandChart
        {...defaultProps}
        frequency="monthly"
        interactiveDetails
      />,
    )
    expect(chart.setOption).toHaveBeenCalledWith(
      expect.objectContaining({ tooltip: { show: false } }),
      { notMerge: true },
    )
    const interaction = screen.getByLabelText(
      /Use left and right arrow keys for exact monthly values/,
    )
    vi.spyOn(interaction, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 100, height: 128,
      top: 0, right: 100, bottom: 128, left: 0,
      toJSON: () => ({}),
    })

    await user.tab()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Example growthJanuary 20262%',
    )
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('status')).toHaveTextContent('April 20211%')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fireEvent.pointerMove(interaction, {
      clientX: 100,
      pointerType: 'mouse',
    })
    const latestTooltip = screen.getByRole('status')
    expect(latestTooltip).toHaveTextContent('January 2026')
    expect(latestTooltip.style.top).toMatch(/%$/)
    expect(Number.parseFloat(latestTooltip.style.top)).toBeCloseTo(41.38, 1)
    expect(latestTooltip).not.toHaveClass(
      'historical-band-chart__interaction-tooltip--below',
    )
    fireEvent.pointerLeave(interaction, { pointerType: 'mouse' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fireEvent.pointerDown(interaction, {
      clientX: 0,
      pointerType: 'touch',
    })
    expect(screen.getByRole('status')).toHaveTextContent('April 2021')
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders an explicit unavailable state without initializing ECharts', () => {
    render(<HistoricalBandChart {...defaultProps} model={{
      status: 'empty', recentObservations: [], comparisonStart: null,
      comparisonEnd: null, latestObservation: null, validObservationCount: 0,
      recentObservationCount: 0, minimumRequired: 20,
    }} accessibleSummary={null} latestPositionDescription={null} />)
    expect(screen.getByRole('status')).toHaveTextContent('Historical context is unavailable.')
    expect(init).not.toHaveBeenCalled()
  })
})
