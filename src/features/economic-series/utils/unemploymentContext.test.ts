import { describe, expect, it } from 'vitest'
import {
  classifyUnemploymentDirection,
  classifyUnemploymentLevel,
  createUnemploymentAccessibleSummary,
  deriveUnemploymentContext,
  formatUnemploymentLevel,
  unemploymentDirectionThreshold,
} from './unemploymentContext'

function months(
  count: number,
  value: (index: number) => number | null,
  startYear = 2000,
) {
  return Array.from({ length: count }, (_, index) => ({
    date: new Date(Date.UTC(startYear, index, 1)).toISOString().slice(0, 10),
    value: value(index),
  }))
}

const bands = {
  status: 'ready' as const,
  recentObservations: [],
  comparisonStart: '2001-06-01',
  comparisonEnd: '2026-06-01',
  innerLower: 4,
  innerUpper: 6,
  median: 5,
  outerLower: 3,
  outerUpper: 8,
  latestObservation: { date: '2026-06-01', value: 5 },
  validObservationCount: 301,
  recentObservationCount: 61,
}

describe('unemployment historical level', () => {
  it.each([
    [2.9, 'very-low', 'very low'],
    [3, 'low', 'low'],
    [4, 'typical', 'near its typical range'],
    [6, 'typical', 'near its typical range'],
    [8, 'high', 'high'],
    [8.1, 'very-high', 'very high'],
  ])('classifies %s with lower-is-better orientation', (value, state, text) => {
    const result = classifyUnemploymentLevel({
      ...bands,
      latestObservation: { ...bands.latestObservation, value },
    })
    expect(result).toBe(state)
    expect(formatUnemploymentLevel(result)).toContain(text)
  })

  it('uses the exact trailing window, excludes nulls, and keeps five years', () => {
    const model = deriveUnemploymentContext(
      months(318, (index) => index === 20 ? null : index % 10),
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
})

describe('unemployment direction', () => {
  it.each([
    [unemploymentDirectionThreshold, 'rising'],
    [0.299, 'little-changed'],
    [-0.299, 'little-changed'],
    [-unemploymentDirectionThreshold, 'falling'],
    [null, 'unavailable'],
  ])('classifies %s at explicit boundaries', (change, state) => {
    expect(classifyUnemploymentDirection(change)).toBe(state)
  })

  it('supports low-but-rising and high-but-falling independently', () => {
    const lowButRising = deriveUnemploymentContext(
      months(318, (index) => index === 305 ? 2 : index === 317 ? 2.5 : 5),
    )
    expect(lowButRising.levelState).toBe('very-low')
    expect(lowButRising.directionState).toBe('rising')

    const highButFalling = deriveUnemploymentContext(
      months(318, (index) => index === 305 ? 10 : index === 317 ? 9 : 5),
    )
    expect(highButFalling.levelState).toBe('very-high')
    expect(highButFalling.directionState).toBe('falling')
  })

  it('does not substitute a nearby month when the prior year is missing', () => {
    const observations = months(318, () => 5)
    observations[305]!.value = null
    const model = deriveUnemploymentContext(observations)
    expect(model.levelState).toBe('typical')
    expect(model.directionState).toBe('unavailable')
    expect(model.twelveMonthChange).toBeNull()
  })

  it('provides complete accessible context', () => {
    const observations = months(318, (index) => index === 305 ? 4 : 5)
    const summary = createUnemploymentAccessibleSummary(
      deriveUnemploymentContext(observations),
    )
    expect(summary).toContain('5.0% in June 2026')
    expect(summary).toContain('employed people plus unemployed people')
    expect(summary).toContain('not actively looking are not counted')
    expect(summary).toContain('middle 50% ranges from')
    expect(summary).toContain('middle 80% ranges from')
    expect(summary).toContain('Lower unemployment readings occupy the lower')
    expect(summary).toContain('+1.0 percentage points')
    expect(summary).toContain('has risen over the past year')
  })
})
