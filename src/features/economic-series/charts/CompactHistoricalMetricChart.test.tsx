import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import perCapitaData from '../data/real-gdp-per-capita-growth.json'
import payrollGrowthData from '../data/payroll-growth.json'
import savingRateData from '../data/personal-saving-rate.json'
import type { EconomicObservation } from '../models/economicSeries'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import {
  payrollGrowthCompactDefinition,
  realGdpPerCapitaCompactDefinition,
  savingRateCompactDefinition,
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
    interactionDetails?: (
      observation: EconomicObservation & { value: number },
    ) => ReactNode
  }) => (
    <div
      data-testid="historical-band-chart"
      data-caption={props.caption}
      data-summary={props.accessibleSummary}
      data-zero-line={props.showZeroLine}
      data-latest-marker={props.showLatestMarker}
      data-interactive={props.interactiveDetails}
      data-latest-value={props.valueFormatter(111.33333333333333)}
    >
      {props.interactionDetails?.({ date: '2026-06-01', value: 2.7 })}
    </div>
  ),
}))

afterEach(cleanup)

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

  it('adds saving-rate point details with the exact 12-month change', () => {
    const series = validateEconomicSeries(savingRateData)
    const model = deriveHistoricalBandContext(
      series.observations,
      savingRateCompactDefinition.historicalBands,
    )
    render(
      <CompactHistoricalMetricChart
        model={model}
        definition={savingRateCompactDefinition}
        observations={series.observations}
      />,
    )

    const chart = screen.getByTestId('historical-band-chart')
    expect(chart).toHaveAttribute(
      'data-caption',
      'Personal saving rate · June 2021–June 2026',
    )
    expect(chart).toHaveAttribute('data-zero-line', 'false')
    expect(chart).toHaveAttribute('data-interactive', 'true')
    expect(chart).toHaveTextContent('Personal saving rateJune 20262.7%')
    expect(chart).toHaveTextContent(
      'Change from 12 months earlier: −1.9 percentage points',
    )
  })
})
