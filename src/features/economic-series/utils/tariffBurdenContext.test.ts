import { describe, expect, it } from 'vitest'
import type { HistoricalBandModel } from './historicalBandContext'
import { formatTariffDirection, formatTariffHistoricalPosition, formatTariffPerHundred } from './tariffBurdenContext'

const model = (value: number): HistoricalBandModel => ({ status: 'ready', recentObservations: [{ date: '2021-01-01', value: 2 }, { date: '2026-01-01', value }], comparisonStart: '1959-01-01', comparisonEnd: '2026-01-01', outerLower: 1, innerLower: 2, median: 3, innerUpper: 4, outerUpper: 5, latestObservation: { date: '2026-01-01', value }, validObservationCount: 269, recentObservationCount: 21 })

describe('tariff burden compact context', () => {
  it('matches displayed precision in dollars per $100', () => expect(formatTariffPerHundred(8.8398)).toContain('$8.80'))
  it.each([[0.5, 'very low'], [1.5, 'low'], [3, 'typical'], [4.5, 'high'], [6, 'very high']] as const)('classifies %s', (value, state) => expect(formatTariffHistoricalPosition(model(value))).toContain(state))
  it('formats all direction states deterministically', () => {
    const observations = (prior: number, peak: number, latest: number) => [{ date: '2021-01-01', value: peak }, { date: '2025-01-01', value: prior }, { date: '2026-01-01', value: latest }]
    expect(formatTariffDirection(observations(2, 5, 4))).toContain('much higher')
    expect(formatTariffDirection(observations(2, 4.1, 4))).toContain('risen sharply')
    expect(formatTariffDirection(observations(4, 5, 3))).toContain('declined')
    expect(formatTariffDirection(observations(3, 4, 3.1))).toContain('little changed')
  })
})
