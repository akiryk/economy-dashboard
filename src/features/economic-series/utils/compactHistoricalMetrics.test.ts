import { describe, expect, it } from 'vitest'
import gdpData from '../data/real-gdp-growth.json'
import perCapitaData from '../data/real-gdp-per-capita-growth.json'
import productivityData from '../data/labor-productivity-growth.json'
import cpiData from '../data/headline-cpi-inflation.json'
import unemploymentData from '../data/unemployment-rate.json'
import primeAgeEmploymentData from '../data/prime-age-employment-ratio.json'
import payrollGrowthData from '../data/payroll-growth.json'
import homeOwnershipData from '../data/home-ownership-cost-share.json'
import budgetBalanceData from '../data/federal-budget-balance.json'
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
  createFederalBudgetBalanceCompactDefinition,
  federalBudgetBalanceCompactDefinition,
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
    expect(summary).toContain(
      `Productivity growth was ${model.latestObservation.value.toFixed(1)}%`,
    )
    expect(summary).toContain('latest 20 quarters')
    expect(summary).toContain('from ')
    expect(summary).toContain(' through ')
    expect(summary).toContain(
      'Zero separates higher from lower productivity than one year earlier.',
    )
    expect(laborProductivityGrowthCompactDefinition.helpText.description)
      .toContain('The line shows year-over-year growth in output per hour.')
    expect(describeCompactHistoricalPosition(
      model,
      laborProductivityGrowthCompactDefinition,
    )).toMatch(/historical/)
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
    expect(model.comparisonEnd).toBe(model.latestObservation.date)
    expect(new Date(`${model.comparisonEnd}T00:00:00Z`).getUTCFullYear()
      - new Date(`${model.comparisonStart}T00:00:00Z`).getUTCFullYear()).toBe(25)
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
    expect(model.comparisonStart).toBe('2001-07-01')
    expect(model.comparisonEnd).toBe('2026-07-01')
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
    expect(model.comparisonEnd).toBe(model.latestObservation.date)
    expect(new Date(`${model.comparisonEnd}T00:00:00Z`).getUTCFullYear()
      - new Date(`${model.comparisonStart}T00:00:00Z`).getUTCFullYear()).toBe(25)
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
    const latestSourceObservation = series.observations.at(-1)
    expect(model.latestObservation).toEqual(latestSourceObservation)
    expect(model.recentObservations).toHaveLength(61)
    expect(model.recentObservations.at(-1)).toEqual(model.latestObservation)
    expect(model.comparisonEnd).toBe(model.latestObservation.date)
    expect(new Date(`${model.comparisonEnd}T00:00:00Z`).getUTCFullYear()
      - new Date(`${model.comparisonStart}T00:00:00Z`).getUTCFullYear()).toBe(25)
    expect(payrollGrowthCompactDefinition.showZeroLine).toBe(true)
    expect(payrollGrowthCompactDefinition.showLatestMarker).toBe(true)
    expect(payrollGrowthCompactDefinition.interactiveDetails).toBe(true)
    const formattedLatest = payrollGrowthCompactDefinition.valueFormatter?.(
      model.latestObservation.value,
    )
    expect(formattedLatest).toMatch(/^[+−]?\d+K$/)
    if (model.latestObservation.value > 0) expect(formattedLatest).toMatch(/^\+/)
    if (model.latestObservation.value < 0) expect(formattedLatest).toMatch(/^−/)
    expect(payrollGrowthCompactDefinition.helpText.description)
      .toContain('three valid consecutive monthly changes')
    expect(payrollGrowthCompactDefinition.helpText.description)
      .toContain('revised')
    expect(describeCompactHistoricalPosition(
      model,
      payrollGrowthCompactDefinition,
    )).toMatch(/historical/)
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

  it('configures federal budget balance with five annual readings and postwar bands', () => {
    const series = validateEconomicSeries(budgetBalanceData)
    const postwar = series.observations.filter(({ date }) => date >= '1946-01-01')
    const model = deriveHistoricalBandContext(
      postwar,
      federalBudgetBalanceCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.recentObservations).toHaveLength(5)
    expect(model.recentObservations[0]?.date).toBe('2021-01-01')
    expect(model.comparisonStart).toBe('1946-01-01')
    expect(federalBudgetBalanceCompactDefinition.showZeroLine).toBe(true)
    expect(federalBudgetBalanceCompactDefinition.showLatestMarker).toBe(true)
    expect(federalBudgetBalanceCompactDefinition.showAllObservationMarkers).toBe(true)
    expect(federalBudgetBalanceCompactDefinition.interactiveCursor).toBe('pointer')
    expect(federalBudgetBalanceCompactDefinition.unifiedFooterLabels).toBe(true)
    expect(federalBudgetBalanceCompactDefinition.comparisonLabel?.(model)).toBe(
      'Historical bands use annual federal deficit magnitudes from 1946–2025',
    )
    expect(federalBudgetBalanceCompactDefinition.interactiveDetails).toBe(true)
    expect(federalBudgetBalanceCompactDefinition.interactionStateLabel?.(-5.8))
      .toBe('Deficit')
  })

  it.each([
    ['surplus', 'Federal surplus as a share of GDP', 'annual federal surplus magnitudes'],
    ['balanced', 'Absolute federal budget balance as a share of GDP', 'annual absolute budget-balance magnitudes'],
  ] as const)('uses %s-specific chart and historical wording', (state, label, historicalSubject) => {
    const definition = createFederalBudgetBalanceCompactDefinition(state)
    expect(definition.seriesLabel).toBe(label)
    expect(definition.comparisonLabel?.({
      comparisonEnd: '2025-01-01',
    } as never)).toContain(historicalSubject)
  })
})
