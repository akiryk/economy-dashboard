import { describe, expect, it } from 'vitest'
import { formatCorporateProfitSharePosition, formatCorporateProfitStructuralInterpretation, formatProfitPerHundred } from './corporateProfitShareContext'
import type { HistoricalBandModel } from './historicalBandContext'

const model = (latest: number, median: number) => ({ latestObservation: { date: '2026-01-01', value: latest }, median } as HistoricalBandModel)

describe('corporate profit share context', () => {
  it('formats the dollars-per-$100 equivalent to two decimals', () => expect(formatProfitPerHundred(11.44)).toBe('About $11.44 in adjusted after-tax corporate profit for every $100 of GDP.'))
  it('uses the above-median structural interpretation', () => expect(formatCorporateProfitStructuralInterpretation(model(12, 10))).toContain('sustained rise since the 1990s'))
  it('uses the lower interpretation at or below the median', () => {
    expect(formatCorporateProfitStructuralInterpretation(model(10, 10))).toContain('smaller share')
    expect(formatCorporateProfitStructuralInterpretation(model(9, 10))).toContain('does not identify a single cause')
  })
  it.each([
    [1, 'very low'], [3, 'low'], [5, 'typical'], [7, 'high'], [9, 'very high'],
  ])('classifies %s into the five-state historical scale', (latest, expected) => {
    const bands = { ...model(latest, 5), outerLower: 2, innerLower: 4, innerUpper: 6, outerUpper: 8 } as HistoricalBandModel
    expect(formatCorporateProfitSharePosition(bands)).toBe(expected)
  })
})
