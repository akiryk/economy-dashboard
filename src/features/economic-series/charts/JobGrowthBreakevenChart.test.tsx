import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import productionData from '../data/job-growth-breakeven-comparison.json'
import { validateJobGrowthBreakevenDataset } from '../models/jobGrowthBreakeven'
import { JobGrowthBreakevenChart } from './JobGrowthBreakevenChart'

const chart = vi.hoisted(() => ({
  setOption: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
}))
const init = vi.hoisted(() => vi.fn(() => chart))

vi.mock('echarts/core', () => ({ init, use: vi.fn() }))

const production = validateJobGrowthBreakevenDataset(productionData)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('JobGrowthBreakevenChart', () => {
  it('renders five years, historical bands, a zero line and latest marker', () => {
    render(<JobGrowthBreakevenChart dataset={production} />)
    expect(screen.getByText(
      'Actual minus estimated breakeven growth · 2021 Q2–2026 Q2',
    )).toBeVisible()
    expect(screen.getByText(
      'Zero = payroll growth matched the estimated breakeven pace',
    )).toBeVisible()
    const options = chart.setOption.mock.calls[0]?.[0] as {
      series: Array<{
        data: Array<[string, number | null]>
        connectNulls: boolean
        markArea: unknown
        markLine: { data: Array<{ name: string }> }
        markPoint: unknown
      }>
    }
    expect(options.series[0]?.data).toHaveLength(21)
    expect(options.series[0]?.connectNulls).toBe(false)
    expect(options.series[0]?.markArea).toBeDefined()
    expect(options.series[0]?.markLine.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Zero' })]),
    )
    expect(options.series[0]?.markPoint).toBeDefined()
  })

  it('reveals all rates and counts by keyboard, pointer, and tap', () => {
    render(<JobGrowthBreakevenChart dataset={production} />)
    const interaction = screen.getByLabelText(
      /Use left and right arrow keys for exact quarterly values/,
    )
    vi.spyOn(interaction, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 100, height: 128,
      top: 0, right: 100, bottom: 128, left: 0,
      toJSON: () => ({}),
    })

    fireEvent.focus(interaction)
    expect(screen.getByRole('status')).toHaveTextContent(
      '2026 Q2Gap: +0.7 ppActual payroll growth: 0.84% annualized' +
      'Estimated breakeven growth: 0.15% annualized' +
      'Actual job growth: +111K per month' +
      'Estimated breakeven: +20K per monthDifference: +91K per month',
    )
    fireEvent.keyDown(interaction, { key: 'ArrowLeft' })
    expect(screen.getByRole('status')).toHaveTextContent('2026 Q1')
    fireEvent.keyDown(interaction, { key: 'Escape' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fireEvent.pointerMove(interaction, {
      clientX: 100,
      pointerType: 'mouse',
    })
    expect(screen.getByRole('status')).toHaveTextContent('2026 Q2')
    fireEvent.pointerLeave(interaction, { pointerType: 'mouse' })
    fireEvent.pointerDown(interaction, {
      clientX: 100,
      pointerType: 'touch',
    })
    expect(screen.getByRole('status')).toHaveTextContent('Difference: +91K')
  })

  it('explains percentage points, the estimated baseline, and historical bands', async () => {
    const user = userEvent.setup()
    render(<JobGrowthBreakevenChart dataset={production} />)
    await user.click(screen.getByRole('button', {
      name: 'Explain the historical bands',
    }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('modeled estimate')
    expect(dialog).toHaveTextContent(
      '0.9% − 0.1% = 0.8 percentage points',
    )
    expect(dialog).toHaveTextContent('not a target or forecast')
  })

  it('uses established insufficient-history behavior', () => {
    render(
      <JobGrowthBreakevenChart
        dataset={{
          ...production,
          observations: production.observations.slice(-12),
        }}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Historical context is unavailable.',
    )
    expect(init).not.toHaveBeenCalled()
  })
})
