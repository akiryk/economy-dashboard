import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import perCapitaData from '../data/real-gdp-per-capita-growth.json'
import payrollGrowthData from '../data/payroll-growth.json'
import savingRateData from '../data/personal-saving-rate.json'
import homeOwnershipData from '../data/home-ownership-cost-share.json'
import housingStartsData from '../data/housing-starts.json'
import populationData from '../data/us-population-monthly.json'
import manufacturingOutputData from '../data/manufacturing-output.json'
import type { EconomicObservation } from '../models/economicSeries'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import {
  payrollGrowthCompactDefinition,
  realGdpPerCapitaCompactDefinition,
  savingRateCompactDefinition,
  homeOwnershipCostCompactDefinition,
  housingStartsCompactDefinition,
  manufacturingOutputCompactDefinition,
} from '../utils/compactHistoricalMetrics'
import { deriveHistoricalBandContext } from '../utils/historicalBandContext'
import { deriveHousingStartsCompactData } from '../utils/housingStartsData'
import { deriveManufacturingOutputGrowth } from '../utils/manufacturingOutputGrowth'
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
    referenceLines?: readonly { value: number; label: string }[]
    showReferenceLineLabels?: boolean
    comparisonLabel?: string
  }) => (
    <div
      data-testid="historical-band-chart"
      data-caption={props.caption}
      data-summary={props.accessibleSummary}
      data-zero-line={props.showZeroLine}
      data-latest-marker={props.showLatestMarker}
      data-interactive={props.interactiveDetails}
      data-reference-lines={JSON.stringify(props.referenceLines)}
      data-comparison-label={props.comparisonLabel}
      data-latest-value={props.valueFormatter(111.33333333333333)}
    >
      {props.interactionDetails?.(
        props.caption.startsWith('Modeled ownership-cost share')
          ? { date: '2026-03-01', value: 42 }
          : props.caption.startsWith('Housing starts')
          ? { date: '2026-06-01', value: 3.93 }
          : props.caption.startsWith('Three-month-average manufacturing')
          ? { date: '2026-06-01', value: 1.3 }
          : { date: '2026-06-01', value: 2.7 },
      )}
      {props.showReferenceLineLabels && props.referenceLines?.map(({ label }) => (
        <span key={label}>{label}</span>
      ))}
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

  it('adds the affordability threshold and exact point details', () => {
    const series = validateEconomicSeries(homeOwnershipData)
    const model = deriveHistoricalBandContext(
      series.observations,
      homeOwnershipCostCompactDefinition.historicalBands,
    )
    render(<CompactHistoricalMetricChart
      model={model}
      definition={homeOwnershipCostCompactDefinition}
      observations={series.observations}
    />)
    const chart = screen.getByTestId('historical-band-chart')
    expect(chart).toHaveAttribute('data-zero-line', 'false')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveAttribute('data-interactive', 'true')
    expect(chart).toHaveAttribute('data-comparison-label', 'Available history since 2005')
    expect(chart).toHaveAttribute('data-reference-lines', expect.stringContaining('Atlanta Fed affordability threshold'))
    expect(chart).toHaveTextContent('30% = Atlanta Fed affordability threshold')
    expect(chart).toHaveTextContent('Modeled ownership-cost shareMarch 202642.0%')
    expect(chart).toHaveTextContent('Affordability threshold: 30.0%')
    expect(chart).toHaveTextContent('Difference: 12.0 percentage points above threshold')
  })

  it('shows normalized housing history with paired raw values and an accessible override', () => {
    const starts = validateEconomicSeries(housingStartsData)
    const population = validateEconomicSeries(populationData)
    const compact = deriveHousingStartsCompactData(
      starts.observations,
      population.observations,
    )
    const model = deriveHistoricalBandContext(
      compact.normalizedAverages,
      housingStartsCompactDefinition.historicalBands,
    )

    render(<CompactHistoricalMetricChart
      model={model}
      definition={housingStartsCompactDefinition}
      observations={compact.normalizedAverages}
      pairedObservations={compact.rawAverages}
      accessibleSummaryOverride="Population-normalized accessible summary"
    />)

    const chart = screen.getByTestId('historical-band-chart')
    expect(chart).toHaveAttribute(
      'data-caption',
      'Housing starts per 1,000 residents · June 2021–June 2026',
    )
    expect(chart).toHaveAttribute('data-summary', 'Population-normalized accessible summary')
    expect(chart).toHaveAttribute('data-zero-line', 'false')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveTextContent('Three-month-average annualized starts: 1.35 million')
    expect(chart).toHaveTextContent('Historical position: typical by historical standards')
  })

  it('shows manufacturing growth, its paired index level, zero line, and exact point state', () => {
    const series = validateEconomicSeries(manufacturingOutputData)
    const derived = deriveManufacturingOutputGrowth(series.observations)
    const model = deriveHistoricalBandContext(
      derived.growth,
      manufacturingOutputCompactDefinition.historicalBands,
    )
    render(<CompactHistoricalMetricChart
      model={model}
      definition={manufacturingOutputCompactDefinition}
      observations={derived.growth}
      pairedObservations={derived.averages}
      pairedObservationLabel="Three-month-average production index"
      pairedValueFormatter={(value) => value?.toFixed(1) ?? 'Unavailable'}
    />)
    const chart = screen.getByTestId('historical-band-chart')
    expect(chart).toHaveAttribute('data-zero-line', 'true')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveTextContent('Three-month-average production index: 98.7')
    expect(chart).toHaveTextContent('Historical position: typical by the standards of the past 25 years')
  })
})
