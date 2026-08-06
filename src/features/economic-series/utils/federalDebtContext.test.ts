import { describe, expect, it } from 'vitest'
import type { HistoricalBandModel } from './historicalBandContext'
import {
  createFederalDebtAccessibleSummary,
  deriveFederalDebtContext,
  formatFederalDebtDirection,
  formatFederalDebtHistoricalPosition,
  formatFederalDebtOutputComparison,
} from './federalDebtContext'

const model = (value: number): HistoricalBandModel => ({
  status: 'ready', recentObservations: [{ date: '2021-01-01', value: 90 }, { date: '2026-01-01', value }],
  comparisonStart: '1970-01-01', comparisonEnd: '2026-01-01',
  outerLower: 30, innerLower: 50, median: 65, innerUpper: 80, outerUpper: 95,
  latestObservation: { date: '2026-01-01', value }, validObservationCount: 225,
  recentObservationCount: 21,
})

describe('federal debt compact context', () => {
  it.each([
    [49.9, 'less than half'], [50, 'more than half, but less'], [89.9, 'more than half, but less'],
    [90, 'approximately equal'], [110, 'approximately equal'], [110.1, 'greater than one year'],
  ])('formats output comparison for %s', (value, phrase) => {
    expect(formatFederalDebtOutputComparison(value)).toContain(phrase)
  })

  it.each([[5, 'risen by 5.0'], [-5, 'fallen by 5.0'], [0.99, 'little changed']] as const)(
    'formats five-year direction for %s', (change, phrase) => {
      expect(formatFederalDebtDirection(change)).toContain(phrase)
    },
  )

  it.each([[20, 'very low'], [40, 'low'], [70, 'typical'], [90, 'high'], [100, 'very high']] as const)(
    'formats historical state for %s', (value, state) => {
      expect(formatFederalDebtHistoricalPosition(model(value))).toContain(state)
    },
  )

  it('uses the exact same quarter five years earlier and creates an accessible summary', () => {
    const context = deriveFederalDebtContext([
      { date: '2021-01-01', value: 100 }, { date: '2025-10-01', value: 97 },
      { date: '2026-01-01', value: 98.7105 },
    ])
    expect(context.fiveYearChange).toBeCloseTo(-1.2895)
    expect(createFederalDebtAccessibleSummary(context, model(98.7105)))
      .toContain('The chart runs from 2021 Q1 through 2026 Q1.')
  })
})
