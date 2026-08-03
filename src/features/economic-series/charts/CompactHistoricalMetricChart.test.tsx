import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import perCapitaData from '../data/real-gdp-per-capita-growth.json'
import payrollGrowthData from '../data/payroll-growth.json'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import {
  payrollGrowthCompactDefinition,
  realGdpPerCapitaCompactDefinition,
} from '../utils/compactHistoricalMetrics'
import { deriveHistoricalBandContext } from '../utils/historicalBandContext'
import { CompactHistoricalMetricChart } from './CompactHistoricalMetricChart'

vi.mock('./HistoricalBandChart', () => ({
  HistoricalBandChart: (props: {
    caption: string
    accessibleSummary: string | null
    showZeroLine: boolean
    showLatestMarker: boolean
    interactiveDetails: boolean
    valueFormatter: (value: number | null) => string
  }) => (
    <div
      data-testid="historical-band-chart"
      data-caption={props.caption}
      data-summary={props.accessibleSummary}
      data-zero-line={props.showZeroLine}
      data-latest-marker={props.showLatestMarker}
      data-interactive={props.interactiveDetails}
      data-latest-value={props.valueFormatter(111.33333333333333)}
    />
  ),
}))

describe('CompactHistoricalMetricChart', () => {
  it('adapts per-capita observations into a factual chart caption and summary', () => {
    const series = validateEconomicSeries(perCapitaData)
    const model = deriveHistoricalBandContext(
      series.observations,
      realGdpPerCapitaCompactDefinition.historicalBands,
    )

    render(
      <CompactHistoricalMetricChart
        model={model}
        definition={realGdpPerCapitaCompactDefinition}
      />,
    )

    const chart = screen.getByTestId('historical-band-chart')
    expect(chart).toHaveAttribute(
      'data-caption',
      expect.stringMatching(/^Real GDP per capita growth · \d{4} Q[1-4]–\d{4} Q[1-4]$/),
    )
    expect(chart).toHaveAttribute(
      'data-summary',
      expect.stringContaining('historical'),
    )
    expect(chart).toHaveAttribute('data-zero-line', 'true')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
  })

  it('adapts payroll observations into a signed, interactive five-year chart', () => {
    const series = validateEconomicSeries(payrollGrowthData)
    const model = deriveHistoricalBandContext(
      series.observations,
      payrollGrowthCompactDefinition.historicalBands,
    )

    const { container } = render(
      <CompactHistoricalMetricChart
        model={model}
        definition={payrollGrowthCompactDefinition}
      />,
    )

    const chart = container.querySelector('[data-testid="historical-band-chart"]')
    expect(chart).not.toBeNull()
    expect(chart).toHaveAttribute(
      'data-caption',
      'Three-month average payroll change · June 2021–June 2026',
    )
    expect(chart).toHaveAttribute('data-zero-line', 'true')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveAttribute('data-interactive', 'true')
    expect(chart).toHaveAttribute('data-latest-value', '+111K')
  })
})
