import { describe, expect, it } from 'vitest'
import {
  classifyPrimeAgeEmploymentLevel,
  createPrimeAgeEmploymentAccessibleSummary,
  derivePrimeAgeEmploymentContext,
  formatPrimeAgeEmploymentLevel,
} from './primeAgeEmploymentContext'

function months(
  count: number,
  value: (index: number) => number | null,
) {
  return Array.from({ length: count }, (_, index) => ({
    date: new Date(Date.UTC(2000, index, 1)).toISOString().slice(0, 10),
    value: value(index),
  }))
}

const bands = {
  status: 'ready' as const,
  recentObservations: [],
  comparisonStart: '2001-06-01',
  comparisonEnd: '2026-06-01',
  innerLower: 77,
  innerUpper: 80,
  median: 78.5,
  outerLower: 75,
  outerUpper: 82,
  latestObservation: { date: '2026-06-01', value: 79 },
  validObservationCount: 301,
  recentObservationCount: 61,
}

describe('prime-age employment historical level', () => {
  it.each([
    [74.9, 'very-low', 'very low'],
    [75, 'low', 'low'],
    [77, 'typical', 'near its typical range'],
    [80, 'typical', 'near its typical range'],
    [82, 'high', 'high'],
    [82.1, 'very-high', 'very high'],
  ])('classifies %s with higher-is-better orientation', (value, state, text) => {
    const result = classifyPrimeAgeEmploymentLevel({
      ...bands,
      latestObservation: { ...bands.latestObservation, value },
    })
    expect(result).toBe(state)
    expect(formatPrimeAgeEmploymentLevel(result)).toContain(text)
  })

  it('uses 25 years, excludes nulls, and keeps the latest five years', () => {
    const model = derivePrimeAgeEmploymentContext(
      months(318, (index) => index === 20 ? null : 75 + index % 8),
    )
    expect(model.historicalBands).toMatchObject({
      status: 'ready',
      comparisonStart: '2001-06-01',
      comparisonEnd: '2026-06-01',
      validObservationCount: 300,
      recentObservationCount: 61,
    })
    if (model.historicalBands.status !== 'ready') throw new Error('Expected bands')
    expect(model.historicalBands.recentObservations).toHaveLength(61)
  })

  it('reports complete accessible context and exclusions', () => {
    const summary = createPrimeAgeEmploymentAccessibleSummary(
      derivePrimeAgeEmploymentContext(months(318, () => 80)),
    )
    expect(summary).toContain('80.0% in June 2026')
    expect(summary).toContain('ages 25 through 54')
    expect(summary).toContain('line runs from June 2021 through June 2026')
    expect(summary).toContain('middle 50% ranges from')
    expect(summary).toContain('middle 80% ranges from')
    expect(summary).toContain('Higher readings occupy the higher')
    expect(summary).toContain('hours, pay, job quality')
  })
})
