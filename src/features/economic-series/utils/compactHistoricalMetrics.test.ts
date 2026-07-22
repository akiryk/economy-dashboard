import { describe, expect, it } from 'vitest'
import gdpData from '../data/real-gdp-growth.json'
import perCapitaData from '../data/real-gdp-per-capita-growth.json'
import productivityData from '../data/labor-productivity-growth.json'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import { deriveHistoricalBandContext } from './historicalBandContext'
import {
  createCompactHistoricalAccessibleSummary,
  describeCompactHistoricalPosition,
  laborProductivityGrowthCompactDefinition,
  realGdpCompactDefinition,
  realGdpPerCapitaCompactDefinition,
} from './compactHistoricalMetrics'

describe('compact historical metric definitions', () => {
  it.each([
    ['GDP', gdpData, realGdpCompactDefinition, 2.68474],
    ['GDP per capita', perCapitaData, realGdpPerCapitaCompactDefinition, 2.3253453949752867],
    ['labor productivity growth', productivityData, laborProductivityGrowthCompactDefinition, 2.7972148347061188],
  ] as const)('uses an explicit approved configuration for %s', (_label, data, definition, latest) => {
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
    expect(model.latestObservation.value).toBe(latest)
    expect(model.recentObservations).toHaveLength(20)
    expect(model.comparisonStart).toBe('2001-01-01')
    expect(model.comparisonEnd).toBe('2026-01-01')
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
    expect(summary).toContain('Real GDP per capita growth was 2.3% in 2026 Q1.')
    expect(summary).toContain('latest 20 quarters')
    expect(summary).toContain('from 2001 Q1 through 2026 Q1')
    expect(summary).toContain('middle 50%')
    expect(summary).toContain('middle 80%')
    expect(summary).toContain('Zero separates increasing from decreasing real output per person.')
    expect(summary).not.toMatch(/everyone|household|healthy|favorable|good|bad/i)
    expect(describeCompactHistoricalPosition(
      model,
      realGdpPerCapitaCompactDefinition,
    )).toBe('between the historical 75th and 90th percentiles')
  })
})
