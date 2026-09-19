import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import { HomeConstructionCostSummary } from './HomeConstructionCostSummary'

vi.mock('../charts/EconomicTimeSeriesChart', () => ({
  default: () => <div data-testid="construction-cost-chart" />,
}))

function series(slug: string, values: readonly number[]): EconomicSeries {
  return {
    id: slug,
    slug,
    provider: 'fixture',
    providerSeriesId: slug,
    title: slug,
    shortTitle: slug,
    description: 'Controlled construction-cost fixture.',
    question: 'Controlled question?',
    units: 'Index, 2005=100',
    frequency: 'monthly',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Controlled',
    sourceName: 'Controlled source',
    sourceUrl: 'https://example.com',
    retrievedAt: '2031-02-01',
    observations: values.map((value, index) => ({
      date: `${2030 + Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}-01`,
      value,
    })),
  }
}

afterEach(cleanup)

describe('HomeConstructionCostSummary', () => {
  it('renders controlled monthly, annual, and real changes without a dollar estimate', async () => {
    const nominal = series('single-family-construction-cost-index', [
      100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 108, 110,
    ])
    const real = series('real-single-family-construction-cost-index', [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 105,
    ])

    render(<HomeConstructionCostSummary nominal={nominal} real={real} />)

    expect(screen.getByText('+10.0%')).toBeVisible()
    expect(screen.getByText(/Costs rose 1.9% from the prior month/)).toBeVisible()
    expect(screen.getByText(/consumer prices.*rose 5.0%/)).toBeVisible()
    expect(screen.queryByText(/\$.*square foot/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /More/ })).toHaveAttribute('aria-expanded', 'false')
  })
})
