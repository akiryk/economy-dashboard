import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import realGdpGrowthData from '../data/real-gdp-growth.json'
import type { EconomicObservation } from '../models/economicSeries'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import { EconomicSeriesSummary } from './EconomicSeriesSummary'

const chartPropsSpy = vi.hoisted(() => vi.fn())

vi.mock('../charts/EconomicTimeSeriesChart', () => ({
  EconomicTimeSeriesChart: (props: {
    observations: readonly EconomicObservation[]
    seriesName: string
  }) => {
    chartPropsSpy(props)
    return <div data-testid="economic-chart" />
  },
}))

const series = validateEconomicSeries(realGdpGrowthData)

afterEach(() => {
  cleanup()
  chartPropsSpy.mockClear()
})

describe('EconomicSeriesSummary', () => {
  it('renders range controls with 20 years initially selected', () => {
    render(<EconomicSeriesSummary series={series} />)

    expect(screen.getByRole('button', { name: '5 years' })).toBeVisible()
    expect(screen.getByRole('button', { name: '10 years' })).toBeVisible()
    expect(screen.getByRole('button', { name: '20 years' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Maximum' })).toBeVisible()
  })

  it('updates the summary and chart data when a range is selected', async () => {
    const user = userEvent.setup()
    render(<EconomicSeriesSummary series={series} />)

    expect(screen.getByText(/At least one observation was below zero/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: '5 years' }))

    expect(screen.getByText(/No observations were below zero/)).toBeVisible()
    expect(screen.getByRole('button', { name: '5 years' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const latestChartProps = chartPropsSpy.mock.calls.at(-1)?.[0] as {
      observations: EconomicObservation[]
    }
    expect(latestChartProps.observations[0]?.date).toBe('2021-01-01')
    expect(latestChartProps.observations.at(-1)?.date).toBe('2026-01-01')
  })

  it('preserves metadata, explanations, and the observations table', () => {
    render(<EconomicSeriesSummary series={series} />)

    expect(screen.getByText('Seasonal adjustment')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'What this tells you' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'What this does not tell you' }),
    ).toBeVisible()
    expect(
      screen.getByRole('table', {
        name: 'Eight most recent GDP growth observations',
      }),
    ).toBeVisible()
  })

  it('shows an empty-range state instead of the chart for all-null data', () => {
    render(
      <EconomicSeriesSummary
        series={{
          ...series,
          observations: [{ date: '2026-01-01', value: null }],
        }}
      />,
    )

    expect(
      screen.getByText(
        'No GDP growth observations are available for the selected period.',
      ),
    ).toBeVisible()
    expect(screen.queryByTestId('economic-chart')).not.toBeInTheDocument()
    expect(
      screen.getByRole('table', {
        name: 'Eight most recent GDP growth observations',
      }),
    ).toBeVisible()
  })
})
