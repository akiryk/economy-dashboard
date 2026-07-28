import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import productionData from '../data/job-growth-breakeven-comparison.json'
import {
  validateJobGrowthBreakevenDataset,
  type JobGrowthBreakevenDataset,
} from '../models/jobGrowthBreakeven'
import { JobGrowthBreakevenSummary } from './JobGrowthBreakevenSummary'

vi.mock('../charts/JobGrowthBreakevenChart', () => ({
  JobGrowthBreakevenChart: ({
    recentObservationCount,
  }: {
    recentObservationCount?: number
  }) => (
    <figure
      data-testid="job-growth-breakeven-chart"
      data-count={recentObservationCount ?? 21}
      data-zero-line="true"
      data-latest-marker="true"
      data-interactive="true"
    />
  ),
}))

const production = validateJobGrowthBreakevenDataset(productionData)

function withLatestGap(gap: number): JobGrowthBreakevenDataset {
  return {
    ...production,
    observations: production.observations.map((item) =>
      item.date === '2026-06-01' && item.status === 'available'
        ? { ...item, gapPercentagePoints: gap }
        : item),
  }
}

afterEach(cleanup)

describe('JobGrowthBreakevenSummary', () => {
  it('renders the production hero, derivation, period, and compact chart', async () => {
    render(<JobGrowthBreakevenSummary dataset={production} />)
    const card = screen.getByRole('article', {
      name: 'Is job growth keeping up with the labor force?',
    })
    expect(within(card).getByText('+0.7 pp')).toBeVisible()
    expect(within(card).getByText(
      'Payroll growth above the estimated breakeven pace',
    )).toBeVisible()
    expect(within(card).getByText(
      'June 2026 · Latest three-month annualized rate',
    )).toBeVisible()
    expect(within(card).getByText(/^Yes —/)).toBeVisible()
    expect(within(card).getByText('0.84% annualized')).toBeVisible()
    expect(within(card).getByText('0.15% annualized')).toBeVisible()
    expect(within(card).getByText('+0.7 percentage points')).toBeVisible()
    expect(await within(card).findByTestId('job-growth-breakeven-chart'))
      .toHaveAttribute('data-zero-line', 'true')
  })

  it.each([
    [0.2, /^Yes —/, 'Payroll growth above the estimated breakeven pace'],
    [0, /^About even —/, 'Payroll growth roughly at the estimated breakeven pace'],
    [-0.2, /^No —/, 'Payroll growth below the estimated breakeven pace'],
  ] as const)('renders the deterministic state for %s', (gap, answer, label) => {
    render(<JobGrowthBreakevenSummary dataset={withLatestGap(gap)} />)
    expect(screen.getByText(answer)).toBeVisible()
    expect(screen.getByText(label)).toBeVisible()
  })

  it('preserves the expanded comparison, controls, details, and More/Less behavior', async () => {
    const user = userEvent.setup()
    render(<JobGrowthBreakevenSummary dataset={production} />)
    const card = screen.getByRole('article', {
      name: 'Is job growth keeping up with the labor force?',
    })
    expect(within(card).queryByText('Latest underlying comparison'))
      .not.toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: /More/ }))
    expect(within(card).getByText('Latest underlying comparison')).toBeVisible()
    expect(within(card).getByText('+111K per month')).toBeVisible()
    expect(within(card).getByText('+20K per month')).toBeVisible()
    expect(within(card).getByText('+91K per month')).toBeVisible()
    expect(within(card).getByText('What this tells you')).toBeVisible()
    expect(within(card).getByText('What this leaves out')).toBeVisible()
    expect(within(card).getByRole('button', { name: '20 years' }))
      .toHaveAttribute('aria-pressed', 'true')
    await user.click(within(card).getByRole('button', { name: '5 years' }))
    expect(within(card).getAllByTestId('job-growth-breakeven-chart').at(-1))
      .toHaveAttribute('data-count', '21')
    await user.click(within(card).getByText('Recent observations'))
    expect(within(card).getByRole('table', {
      name: /Twelve most recent payroll-growth/,
    })).toBeVisible()
    await user.click(within(card).getByRole('button', { name: /Less/ }))
    expect(within(card).queryByText('Latest underlying comparison'))
      .not.toBeInTheDocument()
  })
})
