import { describe, expect, it } from 'vitest'
import {
  classifySavingRateDirection,
  classifySavingRateLevel,
  createSavingRateAccessibleSummary,
  deriveSavingRateContext,
  formatSavingRateLevel,
  savingRateStableThreshold,
} from './savingRateContext'

function months(count: number, value: (index: number) => number | null) {
  return Array.from({ length: count }, (_, index) => ({
    date: new Date(Date.UTC(2000, index, 1)).toISOString().slice(0, 10),
    value: value(index),
  }))
}

const bands = {
  status: 'ready' as const,
  recentObservations: [], comparisonStart: '2001-06-01',
  comparisonEnd: '2026-06-01', innerLower: 4, innerUpper: 6,
  median: 5, outerLower: 3, outerUpper: 8,
  latestObservation: { date: '2026-06-01', value: 5 },
  validObservationCount: 301, recentObservationCount: 61,
}

describe('saving-rate direction', () => {
  it.each([
    [-savingRateStableThreshold - 0.001, 'saving-less'],
    [-savingRateStableThreshold, 'broadly-stable'],
    [0, 'broadly-stable'],
    [savingRateStableThreshold, 'broadly-stable'],
    [savingRateStableThreshold + 0.001, 'saving-more'],
    [null, 'unavailable'],
  ])('classifies %s at the neutral-band boundaries', (change, state) => {
    expect(classifySavingRateDirection(change)).toBe(state)
  })

  it('uses the exact prior-year month without rounding or substitution', () => {
    const observations = months(318, () => 5)
    observations[305]!.value = 5.201
    const model = deriveSavingRateContext(observations)
    expect(model.twelveMonthChange).toBeCloseTo(-0.201)
    expect(model.directionState).toBe('saving-less')

    observations[305]!.value = null
    expect(deriveSavingRateContext(observations)).toMatchObject({
      priorYearObservation: null,
      twelveMonthChange: null,
      directionState: 'unavailable',
    })
  })
})

describe('saving-rate historical level', () => {
  it.each([
    [2.9, 'very-low', 'very low'], [3, 'low', 'low'],
    [4, 'typical', 'typical'], [6, 'typical', 'typical'],
    [8, 'high', 'high'], [8.1, 'very-high', 'very high'],
  ])('classifies %s using neutral five-state context', (value, state, text) => {
    const result = classifySavingRateLevel({
      ...bands, latestObservation: { ...bands.latestObservation, value },
    })
    expect(result).toBe(state)
    expect(formatSavingRateLevel(result)).toContain(text)
  })

  it('uses 25 years, keeps 61 monthly points, excludes nulls, and preserves gaps', () => {
    const observations = months(318, (index) => index === 280 ? null : index % 10)
    const model = deriveSavingRateContext(observations)
    expect(model.historicalBands).toMatchObject({
      status: 'ready', comparisonStart: '2001-06-01',
      comparisonEnd: '2026-06-01', validObservationCount: 300,
      recentObservationCount: 61,
    })
    if (model.historicalBands.status !== 'ready') throw new Error('Expected bands')
    expect(model.historicalBands.recentObservations).toContainEqual({
      date: observations[280]!.date, value: null,
    })
  })

  it('provides complete neutral accessible context', () => {
    const observations = months(318, (index) => index === 305 ? 7 : 5)
    const summary = createSavingRateAccessibleSummary(
      deriveSavingRateContext(observations),
    )
    expect(summary).toContain('5.0% in June 2026')
    expect(summary).toContain('smaller share')
    expect(summary).toContain('−2.0 percentage points')
    expect(summary).toContain('middle 50%')
    expect(summary).toContain('middle 80%')
    expect(summary).toContain('not a target or a judgment')
  })
})
