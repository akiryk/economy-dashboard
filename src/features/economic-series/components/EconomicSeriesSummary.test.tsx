import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import realGdpGrowthData from '../data/real-gdp-growth.json'
import realGdpPerCapitaData from '../data/real-gdp-per-capita-growth.json'
import type { EconomicObservation } from '../models/economicSeries'
import type { CompactHistoricalMetricDefinition } from '../utils/compactHistoricalMetrics'
import type { HistoricalBandResult } from '../utils/historicalBandContext'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import { EconomicSeriesSummary } from './EconomicSeriesSummary'

const chartPropsSpy = vi.hoisted(() => vi.fn())
const compactChartPropsSpy = vi.hoisted(() => vi.fn())

vi.mock('../charts/EconomicTimeSeriesChart', () => ({
  default: (props: {
    observations: readonly EconomicObservation[]
    seriesName: string
    frequency: string
  }) => {
    chartPropsSpy(props)
    return <div data-testid="economic-chart" />
  },
}))

vi.mock('../charts/CompactHistoricalMetricChart', () => ({
  CompactHistoricalMetricChart: (props: {
    model: HistoricalBandResult
    definition: CompactHistoricalMetricDefinition
  }) => {
    compactChartPropsSpy(props)
    return <figure data-testid="compact-historical-chart"><figcaption>{props.definition.seriesLabel} compact historical summary</figcaption></figure>
  },
}))

const series = validateEconomicSeries(realGdpGrowthData)
const perCapitaSeries = validateEconomicSeries(realGdpPerCapitaData)

afterEach(() => {
  cleanup()
  chartPropsSpy.mockClear()
  compactChartPropsSpy.mockClear()
})

describe('EconomicSeriesSummary', () => {
  it('renders non-chart content and a stable loading fallback immediately', async () => {
    render(<EconomicSeriesSummary series={series} />)

    expect(screen.getByText('Loading chart visualization…')).toBeVisible()
    expect(screen.getByText('Latest real GDP growth')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'What this tells you' }),
    ).toBeVisible()
    expect(await screen.findByTestId('economic-chart')).toBeVisible()
  })

  it('progressively discloses the GDP research content and preserves its range state', async () => {
    const user = userEvent.setup()
    const { container } = render(<EconomicSeriesSummary collapsible series={series} />)

    expect(screen.getByText('Economic growth')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Is the U.S. economy growing?' })).toBeVisible()
    expect(screen.getByText('Real Gross Domestic Product: Percent Change from Year Ago')).toBeVisible()
    expect(screen.getByLabelText('Latest real GDP growth')).toBeVisible()
    expect(await screen.findByTestId('compact-historical-chart')).toBeVisible()
    const headline = container.querySelector('.series-card__headline')
    expect(headline?.children[0]).toHaveClass('series-current')
    expect(headline?.children[1]).toBe(screen.getByTestId('compact-historical-chart'))
    expect(compactChartPropsSpy).toHaveBeenCalledOnce()
    expect(compactChartPropsSpy.mock.calls[0]?.[0].model).toMatchObject({
      status: 'ready', latestObservation: { date: '2026-01-01', value: 2.68474 },
    })
    const more = screen.getByRole('button', { name: /More/ })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelector('#real-gdp-growth-expanded')).not.toBeInTheDocument()
    expect(screen.queryByTestId('economic-chart')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '5 years' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'What this tells you' })).not.toBeInTheDocument()
    expect(screen.queryByText('U.S. Bureau of Economic Analysis via FRED')).not.toBeInTheDocument()

    more.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /Less/ })).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByTestId('economic-chart')).toBeVisible()
    expect(screen.getByTestId('compact-historical-chart')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'What this tells you' })).toBeVisible()
    expect(screen.getByText('U.S. Bureau of Economic Analysis via FRED')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '5 years' }))
    await user.click(screen.getByRole('button', { name: /Less/ }))
    expect(screen.queryByRole('button', { name: '5 years' })).not.toBeInTheDocument()
    expect(screen.getByTestId('compact-historical-chart')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /More/ }))
    expect(screen.getByRole('button', { name: '5 years' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies the shared compact treatment and metric definition to GDP per capita', async () => {
    render(<EconomicSeriesSummary collapsible series={perCapitaSeries} />)

    expect(screen.getByText('Growth per person')).toBeVisible()
    expect(screen.getByLabelText('Latest real GDP per capita growth')).toHaveTextContent('2.3%')
    expect(await screen.findByTestId('compact-historical-chart')).toBeVisible()
    expect(compactChartPropsSpy).toHaveBeenCalledOnce()
    expect(compactChartPropsSpy.mock.calls[0]?.[0]).toMatchObject({
      model: {
        status: 'ready',
        latestObservation: { date: '2026-01-01', value: 2.3253453949752867 },
        recentObservationCount: 20,
      },
      definition: {
        seriesLabel: 'Real GDP per capita growth',
        showZeroLine: true,
      },
    })
    expect(screen.getByRole('button', { name: /More/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('button', { name: '5 years' })).not.toBeInTheDocument()
  })

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
    await waitFor(() => expect(chartPropsSpy).toHaveBeenCalled())
    const latestChartProps = chartPropsSpy.mock.calls.at(-1)?.[0] as {
      observations: EconomicObservation[]
    }
    expect(latestChartProps.observations[0]?.date).toBe('2021-01-01')
    expect(latestChartProps.observations.at(-1)?.date).toBe('2026-01-01')
  })

  it('zooms summaries independently, resets, and clears zoom on preset changes', async () => {
    const user = userEvent.setup()
    render(<EconomicSeriesSummary series={series} />)

    const initialPeriod = screen.getByText(/^Visible period:/).textContent
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByText(/^Visible period:/).textContent).not.toBe(initialPeriod)
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Reset zoom' }))
    expect(screen.getByText(/^Visible period:/).textContent).toBe(initialPeriod)
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    await user.click(screen.getByRole('button', { name: '5 years' }))
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '20 years' }))
    expect(screen.getByText(/^Visible period:/).textContent).toBe(initialPeriod)
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()
  })

  it('preserves source, explanations, metadata, and observations', async () => {
    const user = userEvent.setup()
    render(<EconomicSeriesSummary series={series} />)

    expect(
      screen.getByText('U.S. Bureau of Economic Analysis via FRED'),
    ).toBeVisible()
    await user.click(screen.getByText('Series details'))
    expect(screen.getByText('Seasonal adjustment')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'What this tells you' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'What this leaves out' }),
    ).toBeVisible()
    await user.click(screen.getByText('Recent observations'))
    expect(
      screen.getByRole('table', {
        name: 'Eight most recent real GDP growth observations',
      }),
    ).toBeVisible()
  })

  it('shows an empty-range state instead of the chart for all-null data', async () => {
    const user = userEvent.setup()
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
        'No Real GDP growth observations are available for the selected period.',
      ),
    ).toBeVisible()
    expect(screen.queryByTestId('economic-chart')).not.toBeInTheDocument()
    await user.click(screen.getByText('Recent observations'))
    expect(
      screen.getByRole('table', {
        name: 'Eight most recent real GDP growth observations',
      }),
    ).toBeVisible()
  })
})
