import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EconomicFrequency, EconomicSeries } from '../models/economicSeries'
import { HomeConstructionCostSummary } from './HomeConstructionCostSummary'

const { chartPropsSpy } = vi.hoisted(() => ({ chartPropsSpy: vi.fn() }))

vi.mock('../charts/EconomicTimeSeriesChart', () => ({
  default: (props: {
    seriesName: string
    frequency: EconomicFrequency
    valueFormat: string
  }) => {
    chartPropsSpy(props)
    return <div data-testid="construction-cost-chart">{props.seriesName}</div>
  },
}))

function series(
  slug: string,
  frequency: EconomicFrequency,
  units: string,
  observations: EconomicSeries['observations'],
): EconomicSeries {
  return {
    id: slug,
    slug,
    provider: 'fixture',
    providerSeriesId: slug,
    title: slug,
    shortTitle: slug,
    description: 'Controlled construction-cost fixture.',
    question: 'Controlled question?',
    units,
    frequency,
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Controlled',
    sourceName: 'Controlled source',
    sourceUrl: `https://example.com/${slug}`,
    retrievedAt: '2031-02-01',
    observations,
  }
}

const nominal = series(
  'single-family-construction-cost-index',
  'monthly',
  'Index, 2005=100',
  [
    { date: '2011-01-01', value: 100 },
    { date: '2021-01-01', value: 130 },
    { date: '2030-01-01', value: 180 },
    { date: '2030-12-01', value: 190 },
    { date: '2031-01-01', value: 200 },
  ],
)

const annualDollars = series(
  'contractor-built-price-per-square-foot',
  'annual',
  'Nominal dollars per square foot',
  [
    { date: '2029-01-01', value: 160.25 },
    { date: '2030-01-01', value: 166.75 },
  ],
)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('HomeConstructionCostSummary', () => {
  it('leads with the controlled monthly level and keeps dollars out of the compact answer', () => {
    render(<HomeConstructionCostSummary nominal={nominal} annualDollars={annualDollars} />)

    expect(screen.getByRole('heading', {
      name: 'How much has the cost of building a comparable home risen?',
    })).toBeVisible()
    expect(screen.getByText('200.0')).toBeVisible()
    expect(screen.getByText('Construction-cost index · 2005 = 100')).toBeVisible()
    expect(screen.getByText('January 2031')).toBeVisible()
    expect(screen.getByText(/About 100% higher than the 2005 base-year cost level/)).toBeVisible()
    expect(screen.getByText(/From a year earlier, costs rose 11.1%/)).toBeVisible()
    expect(screen.getByText(/From the prior month, costs rose 5.3%/)).toBeVisible()
    expect(screen.getByText(/Costs are 53.8% higher than 10 years earlier/)).toBeVisible()
    expect(screen.getByText(/Monthly constant-quality construction-cost index/)).toHaveClass('visually-hidden')
    expect(screen.queryByText('$166.75')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /More/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the separate annual nominal-dollar evidence only when expanded', async () => {
    const user = userEvent.setup()
    render(<HomeConstructionCostSummary nominal={nominal} annualDollars={annualDollars} />)

    await user.click(screen.getByRole('button', { name: /More/ }))

    expect(screen.getAllByText('$166.75')).toHaveLength(2)
    expect(screen.getByText('2030 · nominal dollars')).toBeVisible()
    expect(screen.getAllByTestId('construction-cost-chart')).toHaveLength(3)
    expect(screen.getByText(/never advances an annual dollar value with the monthly index/)).toBeVisible()
    expect(screen.getByText(/excludes the value of the improved lot/)).toBeVisible()
    expect(screen.getByText(/Construction cost excludes land, financing and selling expenses/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Monthly construction-cost index' }))
      .toHaveAttribute('href', nominal.sourceUrl)
    expect(screen.getByRole('link', { name: 'Annual contractor-built price per square foot' }))
      .toHaveAttribute('href', annualDollars.sourceUrl)
    expect(chartPropsSpy.mock.calls.some(([props]) => (
      props.frequency === 'monthly' && props.valueFormat === 'dollars-per-square-foot'
    ))).toBe(false)
    expect(screen.getByRole('table', {
      name: 'Twelve most recent annual contractor-built price-per-square-foot observations',
    })).toBeVisible()
  })

  it('reports missing exact comparison observations instead of inventing changes', () => {
    const gapped = series(
      'single-family-construction-cost-index',
      'monthly',
      'Index, 2005=100',
      [
        { date: '2030-11-01', value: 175 },
        { date: '2031-01-01', value: 180 },
      ],
    )

    render(<HomeConstructionCostSummary nominal={gapped} annualDollars={annualDollars} />)

    expect(screen.getByText(/From a year earlier, comparison unavailable/)).toBeVisible()
    expect(screen.getByText(/From the prior month, comparison unavailable/)).toBeVisible()
  })
})
