import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import perCapitaData from '../data/real-gdp-per-capita-growth.json'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import { realGdpPerCapitaCompactDefinition } from '../utils/compactHistoricalMetrics'
import { deriveHistoricalBandContext } from '../utils/historicalBandContext'
import { CompactHistoricalMetricChart } from './CompactHistoricalMetricChart'

vi.mock('./HistoricalBandChart', () => ({
  HistoricalBandChart: (props: {
    caption: string
    accessibleSummary: string | null
    showZeroLine: boolean
    showLatestMarker: boolean
  }) => (
    <div
      data-testid="historical-band-chart"
      data-caption={props.caption}
      data-summary={props.accessibleSummary}
      data-zero-line={props.showZeroLine}
      data-latest-marker={props.showLatestMarker}
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
      'Real GDP per capita growth · 2021 Q2–2026 Q1',
    )
    expect(chart).toHaveAttribute(
      'data-summary',
      expect.stringContaining('between the historical 75th and 90th percentiles'),
    )
    expect(chart).toHaveAttribute('data-zero-line', 'true')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
  })
})
