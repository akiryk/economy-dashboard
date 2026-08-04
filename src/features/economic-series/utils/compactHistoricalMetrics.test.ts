import { describe, expect, it } from 'vitest'
import gdpData from '../data/real-gdp-growth.json'
import perCapitaData from '../data/real-gdp-per-capita-growth.json'
import productivityData from '../data/labor-productivity-growth.json'
import cpiData from '../data/headline-cpi-inflation.json'
import unemploymentData from '../data/unemployment-rate.json'
import primeAgeEmploymentData from '../data/prime-age-employment-ratio.json'
import payrollGrowthData from '../data/payroll-growth.json'
import homeOwnershipData from '../data/home-ownership-cost-share.json'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import { deriveHistoricalBandContext } from './historicalBandContext'
import {
  createCompactHistoricalAccessibleSummary,
  describeCompactHistoricalPosition,
  headlineCpiCompactDefinition,
  laborProductivityGrowthCompactDefinition,
  realGdpCompactDefinition,
  realGdpPerCapitaCompactDefinition,
  unemploymentCompactDefinition,
  primeAgeEmploymentCompactDefinition,
  payrollGrowthCompactDefinition,
  homeOwnershipCostCompactDefinition,
} from './compactHistoricalMetrics'

describe('compact historical metric definitions', () => {
  it.each([
    ['GDP', gdpData, realGdpCompactDefinition],
    ['GDP per capita', perCapitaData, realGdpPerCapitaCompactDefinition],
    ['labor productivity growth', productivityData, laborProductivityGrowthCompactDefinition],
  ] as const)('uses an explicit approved configuration for %s', (_label, data, definition) => {
    expect(definition.historicalBands).toEqual({
      recentObservationCount: 20,
      comparisonWindow: { kind: 'trailing-years', years: 25 },
      innerPercentiles: [25, 75], outerPercentiles: [10, 90],
      minimumFiniteObservations: 20,
      latestObservationPolicy: 'last-observation',
    })
    const series = validateEconomicSeries(data)
    const model = deriveHistoricalBandContext(
      series.observations,
      definition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.latestObservation).toEqual(series.observations.at(-1))
    expect(model.recentObservations).toHaveLength(20)
    expect(model.comparisonEnd).toBe(model.latestObservation.date)
  })

  it('keeps productivity interpretation factual and explains the growth line', () => {
    const series = validateEconomicSeries(productivityData)
    const model = deriveHistoricalBandContext(
      series.observations,
      laborProductivityGrowthCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    const summary = createCompactHistoricalAccessibleSummary(
      model,
      laborProductivityGrowthCompactDefinition,
    )
    expect(summary).toContain('Productivity growth was 2.8% in 2026 Q1.')
    expect(summary).toContain('latest 20 quarters')
    expect(summary).toContain('from 2001 Q1 through 2026 Q1')
    expect(summary).toContain(
      'Zero separates higher from lower productivity than one year earlier.',
    )
    expect(laborProductivityGrowthCompactDefinition.helpText.description)
      .toContain('The line shows year-over-year growth in output per hour.')
    expect(describeCompactHistoricalPosition(
      model,
      laborProductivityGrowthCompactDefinition,
    )).toBe('within the historical middle 50%')
  })

  it('configures CPI with five years, policy-reference semantics, and monthly wording', () => {
    const series = validateEconomicSeries(cpiData)
    const model = deriveHistoricalBandContext(
      series.observations,
      headlineCpiCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.recentObservations).toHaveLength(61)
    expect(model.comparisonStart).toBe('2001-06-01')
    expect(model.comparisonEnd).toBe('2026-06-01')
    expect(headlineCpiCompactDefinition.referenceLines).toEqual([
      { value: 2, label: '2% policy reference' },
    ])
    expect(headlineCpiCompactDefinition.helpText.description).toContain(
      'formal 2% inflation target applies to PCE inflation, not CPI',
    )
    const summary = createCompactHistoricalAccessibleSummary(
      model,
      headlineCpiCompactDefinition,
    )
    expect(summary).toContain('latest 61 months')
    expect(summary).toContain('Federal Reserve formally targets PCE inflation')
  })

  it('configures unemployment with five years, oriented bands, and no zero line', () => {
    const series = validateEconomicSeries(unemploymentData)
    const model = deriveHistoricalBandContext(
      series.observations,
      unemploymentCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.recentObservations).toHaveLength(61)
    expect(model.comparisonStart).toBe('2001-06-01')
    expect(model.comparisonEnd).toBe('2026-06-01')
    expect(unemploymentCompactDefinition.showZeroLine).toBe(false)
    expect(unemploymentCompactDefinition.showLatestMarker).toBe(true)
    expect(unemploymentCompactDefinition.helpText.description).toContain(
      'Some people who want work are not counted if they are not actively looking',
    )
    expect(describeCompactHistoricalPosition(
      model,
      unemploymentCompactDefinition,
    )).toBe('low compared with the past 25 years')
  })

  it('configures prime-age employment with higher-oriented interactive bands', () => {
    const series = validateEconomicSeries(primeAgeEmploymentData)
    const model = deriveHistoricalBandContext(
      series.observations,
      primeAgeEmploymentCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.recentObservations).toHaveLength(61)
    expect(model.comparisonStart).toBe('2001-06-01')
    expect(model.comparisonEnd).toBe('2026-06-01')
    expect(primeAgeEmploymentCompactDefinition.showZeroLine).toBe(false)
    expect(primeAgeEmploymentCompactDefinition.interactiveDetails).toBe(true)
    expect(primeAgeEmploymentCompactDefinition.helpText.description)
      .toContain('less affected by retirement and schooling')
    expect(describeCompactHistoricalPosition(
      model,
      primeAgeEmploymentCompactDefinition,
    )).toBe('high compared with the past 25 years')
  })

  it('configures payroll growth with complete three-month averages and signed units', () => {
    const series = validateEconomicSeries(payrollGrowthData)
    const model = deriveHistoricalBandContext(
      series.observations,
      payrollGrowthCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.latestObservation).toEqual({
      date: '2026-06-01',
      value: 111.33333333333333,
    })
    expect(model.recentObservations).toHaveLength(61)
    expect(model.recentObservations[0]?.date).toBe('2021-06-01')
    expect(model.comparisonStart).toBe('2001-06-01')
    expect(model.comparisonEnd).toBe('2026-06-01')
    expect(payrollGrowthCompactDefinition.showZeroLine).toBe(true)
    expect(payrollGrowthCompactDefinition.showLatestMarker).toBe(true)
    expect(payrollGrowthCompactDefinition.interactiveDetails).toBe(true)
    expect(payrollGrowthCompactDefinition.valueFormatter?.(
      model.latestObservation.value,
    )).toBe('+111K')
    expect(payrollGrowthCompactDefinition.helpText.description)
      .toContain('three valid consecutive monthly changes')
    expect(payrollGrowthCompactDefinition.helpText.description)
      .toContain('revised')
    expect(describeCompactHistoricalPosition(
      model,
      payrollGrowthCompactDefinition,
    )).toBe('within the typical historical range')
  })

  it('keeps per-capita interpretation factual and distribution-neutral', () => {
    const series = validateEconomicSeries(perCapitaData)
    const model = deriveHistoricalBandContext(
      series.observations,
      realGdpPerCapitaCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    const summary = createCompactHistoricalAccessibleSummary(
      model,
      realGdpPerCapitaCompactDefinition,
    )
    expect(summary).toMatch(/Real GDP per capita growth was .+ in \d{4} Q[1-4]\./)
    expect(summary).toContain('latest 20 quarters')
    expect(summary).toMatch(/from \d{4} Q[1-4] through \d{4} Q[1-4]/)
    expect(summary).toContain('middle 50%')
    expect(summary).toContain('middle 80%')
    expect(summary).toContain('Zero separates increasing from decreasing real output per person.')
    expect(summary).not.toMatch(/everyone|household|healthy|favorable|good|bad/i)
    expect(describeCompactHistoricalPosition(
      model,
      realGdpPerCapitaCompactDefinition,
    )).toMatch(/historical/)
  })

  it('configures home ownership with available history, a threshold, and no zero line', () => {
    const series = validateEconomicSeries(homeOwnershipData)
    const model = deriveHistoricalBandContext(
      series.observations,
      homeOwnershipCostCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.recentObservations).toHaveLength(61)
    expect(model.recentObservations[0]?.date).toBe('2021-03-01')
    expect(model.comparisonStart).toBe('2005-01-01')
    expect(homeOwnershipCostCompactDefinition.comparisonLabel?.(model))
      .toBe('Available history since 2005')
    expect(homeOwnershipCostCompactDefinition.showZeroLine).toBe(false)
    expect(homeOwnershipCostCompactDefinition.referenceLines).toEqual([
      { value: 30, label: '30% = Atlanta Fed affordability threshold' },
    ])
    expect(createCompactHistoricalAccessibleSummary(model, homeOwnershipCostCompactDefinition))
      .toContain('above the 30% affordability threshold')
  })
})
