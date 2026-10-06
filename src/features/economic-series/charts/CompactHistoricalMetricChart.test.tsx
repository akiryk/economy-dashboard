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
import budgetBalanceData from '../data/federal-budget-balance.json'
import type { EconomicObservation } from '../models/economicSeries'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import {
  payrollGrowthCompactDefinition,
  realGdpPerCapitaCompactDefinition,
  savingRateCompactDefinition,
  homeOwnershipCostCompactDefinition,
  housingStartsCompactDefinition,
  manufacturingOutputCompactDefinition,
  federalBudgetBalanceCompactDefinition,
  createFederalBudgetBalanceCompactDefinition,
} from '../utils/compactHistoricalMetrics'
import { deriveHistoricalBandContext, type HistoricalBandResult } from '../utils/historicalBandContext'
import { deriveHousingStartsCompactData } from '../utils/housingStartsData'
import { deriveManufacturingOutputGrowth } from '../utils/manufacturingOutputGrowth'
import { deriveBudgetBalanceCompactContext } from '../utils/budgetBalanceContext'
import { formatHomeOwnershipPointDifference } from '../utils/homeOwnershipAffordability'
import { formatAnnualizedHousingUnits, formatObservationPeriod, formatPercentage, formatSignedPercentagePoints, formatSignedThousands } from '../utils/economicSeries'
import { CompactHistoricalMetricChart } from './CompactHistoricalMetricChart'

vi.mock('./HistoricalBandChart', () => ({
  HistoricalBandChart: (props: {
    model: HistoricalBandResult
    caption: string
    accessibleSummary: string | null
    showZeroLine: boolean
    showLatestMarker: boolean
    showAllObservationMarkers?: boolean
    interactiveDetails: boolean
    interactiveCursor?: string
    unifiedFooterLabels?: boolean
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
      data-all-markers={props.showAllObservationMarkers}
      data-interactive={props.interactiveDetails}
      data-cursor={props.interactiveCursor}
      data-unified-footer={props.unifiedFooterLabels}
      data-reference-lines={JSON.stringify(props.referenceLines)}
      data-comparison-label={props.comparisonLabel}
      data-latest-value={props.valueFormatter(props.model.status === 'ready' ? props.model.latestObservation.value : null)}
    >
      {props.model.status === 'ready' && props.interactionDetails?.(props.model.latestObservation)}
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
      expect.stringMatching(
        /^Three-month average payroll change · [A-Z][a-z]+ \d{4}–[A-Z][a-z]+ \d{4}$/,
      ),
    )
    expect(chart).toHaveAttribute('data-zero-line', 'true')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveAttribute('data-interactive', 'true')
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(chart).toHaveAttribute('data-latest-value', formatSignedThousands(model.latestObservation.value))
  })

  it('shows concise annual budget balance details and zero mechanics', () => {
    const series = validateEconomicSeries(budgetBalanceData)
    const postwar = series.observations.filter(({ date }) => date >= '1946-01-01')
    const context = deriveBudgetBalanceCompactContext(
      postwar,
      federalBudgetBalanceCompactDefinition.historicalBands,
    )
    const definition = createFederalBudgetBalanceCompactDefinition(context.state)
    render(<CompactHistoricalMetricChart
      model={context.model}
      definition={definition}
      observations={context.observations}
    />)
    const chart = screen.getByTestId('historical-band-chart')
    expect(chart).toHaveAttribute(
      'data-caption',
      expect.stringMatching(/^(Federal (?:deficit|surplus)|Absolute federal budget balance) as a share of GDP · Displayed: \d{4}–\d{4}$/),
    )
    expect(chart).toHaveAttribute(
      'data-comparison-label',
      expect.stringMatching(/^Historical bands use annual (?:federal (?:deficit|surplus)|absolute budget-balance) magnitudes from 1946–\d{4}$/),
    )
    expect(chart).toHaveAttribute('data-zero-line', 'true')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveAttribute('data-all-markers', 'true')
    expect(chart).toHaveAttribute('data-interactive', 'true')
    expect(chart).toHaveAttribute('data-cursor', 'pointer')
    expect(chart).toHaveAttribute('data-unified-footer', 'true')
    expect(context.model.status).toBe('ready')
    if (context.model.status !== 'ready') return
    const latest = context.model.latestObservation
    expect(chart).toHaveTextContent(
      `${formatObservationPeriod(latest.date, 'annual')}${definition.interactionStateLabel!(latest.value)} ${definition.valueFormatter!(latest.value)}`,
    )
    expect(chart).not.toHaveTextContent('Historical position')
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
      expect.stringMatching(/^Personal saving rate · [A-Z][a-z]+ \d{4}–[A-Z][a-z]+ \d{4}$/),
    )
    expect(chart).toHaveAttribute('data-zero-line', 'false')
    expect(chart).toHaveAttribute('data-interactive', 'true')
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    const latest = model.latestObservation
    const priorDate = new Date(`${latest.date}T00:00:00Z`)
    priorDate.setUTCFullYear(priorDate.getUTCFullYear() - 1)
    const prior = series.observations.find(({ date }) => date === priorDate.toISOString().slice(0, 10))?.value
    expect(chart).toHaveTextContent(
      `Personal saving rate${formatObservationPeriod(latest.date, 'monthly')}${formatPercentage(latest.value)}`,
    )
    expect(chart).toHaveTextContent(
      `Change from 12 months earlier: ${prior == null ? 'unavailable' : `${formatSignedPercentagePoints(latest.value - prior)} percentage points`}`,
    )
  })

  it.each([
    [3, 5, -2],
    [4, 5, -1],
    [4, 6, -2],
    [4, null, null],
  ])('compares controlled saving values %s and %s at exactly 12 months', (latestValue, priorValue, change) => {
    const observations: EconomicObservation[] = Array.from({ length: 73 }, (_, index) => ({
      date: new Date(Date.UTC(2030, index, 1)).toISOString().slice(0, 10),
      value: index === 60 ? priorValue : index === 72 ? latestValue : 8,
    }))
    const model = deriveHistoricalBandContext(observations, savingRateCompactDefinition.historicalBands)
    render(<CompactHistoricalMetricChart
      model={model}
      definition={savingRateCompactDefinition}
      observations={observations}
    />)
    expect(screen.getByTestId('historical-band-chart')).toHaveTextContent(
      `Change from 12 months earlier: ${change === null ? 'unavailable' : `${formatSignedPercentagePoints(change)} percentage points`}`,
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
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(chart).toHaveAttribute('data-comparison-label', homeOwnershipCostCompactDefinition.comparisonLabel!(model))
    expect(chart).toHaveAttribute('data-reference-lines', expect.stringContaining('Atlanta Fed affordability threshold'))
    expect(chart).toHaveTextContent('30% = Atlanta Fed affordability threshold')
    expect(chart).toHaveTextContent(
      `Modeled ownership-cost share${formatObservationPeriod(model.latestObservation.date, 'monthly')}${formatPercentage(model.latestObservation.value)}`,
    )
    expect(chart).toHaveTextContent('Affordability threshold: 30.0%')
    expect(chart).toHaveTextContent(`Difference: ${formatHomeOwnershipPointDifference(model.latestObservation.value)}`)
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
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    const selectedRawAverage = compact.rawAverages.find(
      ({ date }) => date === model.latestObservation.date,
    )?.value ?? null
    expect(chart).toHaveAttribute(
      'data-caption',
      expect.stringMatching(/^Housing starts per 1,000 residents · [A-Z][a-z]+ \d{4}–[A-Z][a-z]+ \d{4}$/),
    )
    expect(chart).toHaveAttribute('data-summary', 'Population-normalized accessible summary')
    expect(chart).toHaveAttribute('data-zero-line', 'false')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveTextContent(
      `Three-month-average annualized starts: ${formatAnnualizedHousingUnits(selectedRawAverage)}`,
    )
    expect(chart).toHaveTextContent(
      /Historical position: (?:very low|low|typical|high|very high) by historical standards/,
    )
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
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    const selectedAverage = derived.averages.find(
      ({ date }) => date === model.latestObservation.date,
    )?.value
    expect(chart).toHaveAttribute('data-zero-line', 'true')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveTextContent(
      `Three-month-average production index: ${selectedAverage?.toFixed(1) ?? 'Unavailable'}`,
    )
    expect(chart).toHaveTextContent(
      /Historical position: (?:very weak|weak|typical|strong|very strong) by the standards of the past 25 years/,
    )
  })

  it('renders a newly appended valid observation without a production-current expectation', () => {
    const observations = Array.from({ length: 314 }, (_, index) => {
      const date = new Date(Date.UTC(2000, index, 1)).toISOString().slice(0, 10)
      return { date, value: 90 + index * 0.05 }
    })
    const advanced = [...observations, { date: '2026-03-01', value: 108 }]
    const derived = deriveManufacturingOutputGrowth(advanced)
    const model = deriveHistoricalBandContext(
      derived.growth,
      manufacturingOutputCompactDefinition.historicalBands,
    )

    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.latestObservation.date).toBe('2026-03-01')

    render(<CompactHistoricalMetricChart
      model={model}
      definition={manufacturingOutputCompactDefinition}
      observations={derived.growth}
    />)

    expect(screen.getByTestId('historical-band-chart')).toHaveAttribute(
      'data-caption',
      expect.stringContaining(formatObservationPeriod('2026-03-01', 'monthly')),
    )
  })
})
