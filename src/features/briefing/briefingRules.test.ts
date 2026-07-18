import { describe, expect, it } from 'vitest'
import type { BriefingObservation, DirectionState, IndicatorConditionResult, IndicatorDirectionResult } from './briefingModels'
import {
  calculateIndicatorCondition,
  calculateIndicatorDirection,
  calculatePercentileRank,
  calculatePercentileValue,
  calculateRecentChange,
  classifyConditionTier,
  combineDimensionConditions,
  combineDimensionDirections,
  evaluateFreshness,
  orientPercentile,
  selectComparisonWindow,
  suppressStaleDirection,
} from './briefingRules'

const observation = (period: string, value: number): BriefingObservation => ({ period, value })

const monthly = (values: readonly number[], startYear = 2020): BriefingObservation[] => values.map((value, index) => {
  const date = new Date(Date.UTC(startYear, index, 1))
  return observation(date.toISOString().slice(0, 10), value)
})

const quarterly = (values: readonly number[]): BriefingObservation[] => values.map((value, index) => {
  const date = new Date(Date.UTC(2020, index * 3, 1))
  return observation(date.toISOString().slice(0, 10), value)
})

const adequateCondition = (group: 'favorable-side' | 'typical' | 'unfavorable-side'): IndicatorConditionResult => ({
  evidence: 'adequate', valence: 'higher-is-better', rawPercentile: 75,
  orientedPercentile: 75, tier: group === 'favorable-side' ? 'favorable' : group === 'typical' ? 'typical' : 'unfavorable',
  group, window: { requestedYears: 25, comparisonStart: '2020-01-01', comparisonEnd: '2024-01-01', observationCount: 5, usedShortHistory: true },
})

const adequateDirection = (direction: Extract<DirectionState, 'improving' | 'deteriorating' | 'normalizing'>): IndicatorDirectionResult => ({
  evidence: 'adequate', direction, underlyingOrientation: direction === 'improving' ? 'favorable' : 'adverse',
  currentChange: { frequency: 'monthly', windowPeriods: 6, latestPeriod: '2024-07-01', latestValue: 2, comparisonPeriod: '2024-01-01', comparisonValue: 1, signedChange: 1, absoluteChange: 1 },
  noiseThreshold: 0.5, historicalChangeCount: 10, noiseGatePassed: true,
  comparisonWindow: { requestedYears: 25, comparisonStart: '2020-01-01', comparisonEnd: '2024-07-01', observationCount: 10, usedShortHistory: true },
})

describe('comparison windows', () => {
  it('docs example: selects only the trailing 25 years from longer history', () => {
    const result = selectComparisonWindow([
      observation('1990-01-01', 1), observation('1999-12-31', 2), observation('2000-01-01', 3),
      observation('2010-01-01', 4), observation('2020-01-01', 5), observation('2024-01-01', 6), observation('2025-01-01', 7),
    ])
    expect(result.metadata).toMatchObject({ comparisonStart: '2000-01-01', comparisonEnd: '2025-01-01', observationCount: 5, usedShortHistory: false })
  })

  it('docs example: identifies complete shorter history', () => {
    const result = selectComparisonWindow(monthly([1, 2, 3, 4, 5]))
    expect(result.metadata).toMatchObject({ comparisonStart: '2020-01-01', observationCount: 5, usedShortHistory: true })
  })

  it('keeps irregular weekly observations and gaps without interpolation', () => {
    const values = ['2024-01-05', '2024-01-12', '2024-02-02', '2024-02-09', '2024-03-01'].map((period, index) => observation(period, index))
    expect(selectComparisonWindow(values).observations.map(({ period }) => period)).toEqual(values.map(({ period }) => period))
  })

  it('reports insufficient evidence below five valid observations', () => {
    expect(selectComparisonWindow([...monthly([1, 2, 3, 4]), observation('bad', 5), observation('2024-01-01', Number.NaN)]).evidence).toBe('insufficient')
  })
})

describe('percentiles and conditions', () => {
  it('docs example: uses average zero-based ranks for ties regardless of input order', () => {
    expect(calculatePercentileRank([5, 1, 3, 3, 2], 3)).toBe(62.5)
    expect(calculatePercentileRank([1, 2, 3, 4, 5], 1)).toBe(0)
    expect(calculatePercentileRank([5, 4, 3, 2, 1], 5)).toBe(100)
    expect(calculatePercentileValue([0, 10, 20, 30, 40, 50], 60)).toBe(30)
  })

  it('returns no percentile for an inadequate sample', () => {
    expect(calculatePercentileRank([1, 2, 3, 4], 4)).toBeUndefined()
  })

  it('docs example: orients higher and lower valence and withholds orientation for unvalenced data', () => {
    expect(orientPercentile(75, 'higher-is-better')).toBe(75)
    expect(orientPercentile(75, 'lower-is-better')).toBe(25)
    expect(orientPercentile(75, 'unvalenced')).toBeUndefined()
  })

  it('docs example: assigns exact boundaries toward typical', () => {
    expect([20, 40, 60, 80].map(classifyConditionTier)).toEqual(['unfavorable', 'typical', 'typical', 'favorable'])
  })

  it('gives unvalenced indicators historical position but no favorable tier', () => {
    const result = calculateIndicatorCondition(monthly([1, 2, 3, 4, 5]), 'unvalenced')
    expect(result).toMatchObject({ evidence: 'adequate', valence: 'unvalenced', historicalPosition: 'high' })
    expect(result).not.toHaveProperty('tier')
  })

  it('condition is unchanged by any separate direction calculation', () => {
    const before = calculateIndicatorCondition(monthly([1, 2, 3, 4, 5]), 'higher-is-better')
    calculateIndicatorDirection(monthly([1, 2, 3, 4, 5, 6, 20]), { frequency: 'monthly', valence: 'higher-is-better' })
    expect(calculateIndicatorCondition(monthly([1, 2, 3, 4, 5]), 'higher-is-better')).toEqual(before)
  })
})

describe('recent changes and direction', () => {
  it('docs example: uses exact weekly, monthly, and quarterly period identities', () => {
    expect(calculateRecentChange([observation('2024-01-05', 2), observation('2024-04-05', 5)], 'weekly')?.signedChange).toBe(3)
    expect(calculateRecentChange(monthly([1, 0, 0, 0, 0, 0, 4]), 'monthly')?.signedChange).toBe(3)
    expect(calculateRecentChange(quarterly([1, 2, 4]), 'quarterly')?.signedChange).toBe(3)
  })

  it('docs example: does not replace a missing exact period with its nearest neighbor', () => {
    expect(calculateRecentChange([observation('2024-01-02', 1), observation('2024-07-01', 2)], 'monthly')).toBeUndefined()
  })

  it('docs example: classifies a material favorable movement as improving', () => {
    const result = calculateIndicatorDirection(monthly([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 10]), { frequency: 'monthly', valence: 'higher-is-better' })
    expect(result).toMatchObject({ evidence: 'adequate', direction: 'improving', noiseGatePassed: true, historicalChangeCount: 7 })
  })

  it('classifies material adverse and unvalenced movements', () => {
    const rising = monthly([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 10])
    expect(calculateIndicatorDirection(rising, { frequency: 'monthly', valence: 'lower-is-better' })).toMatchObject({ direction: 'deteriorating' })
    expect(calculateIndicatorDirection(rising, { frequency: 'monthly', valence: 'unvalenced' })).toMatchObject({ direction: 'rising' })
    expect(calculateIndicatorDirection(rising.map((item) => ({ ...item, value: -item.value })), { frequency: 'monthly', valence: 'unvalenced' })).toMatchObject({ direction: 'falling' })
  })

  it('docs example: treats movement at or below the gate as broadly stable', () => {
    const flat = monthly([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    expect(calculateIndicatorDirection(flat, { frequency: 'monthly', valence: 'higher-is-better' })).toMatchObject({ direction: 'broadly-stable', noiseThreshold: 0, noiseGatePassed: false })
  })

  it('requires five eligible historical changes', () => {
    expect(calculateIndicatorDirection(monthly([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), { frequency: 'monthly', valence: 'higher-is-better' })).toMatchObject({ evidence: 'insufficient', reason: 'fewer-than-five-historical-changes' })
  })
})

describe('normalizing', () => {
  const adverse = monthly([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 10])

  it('docs example: preserves adverse movement but labels favorable Labor condition normalizing', () => {
    expect(calculateIndicatorDirection(adverse, { frequency: 'monthly', valence: 'lower-is-better', normalizingDimension: 'labor', condition: adequateCondition('favorable-side') })).toMatchObject({ direction: 'normalizing', underlyingOrientation: 'adverse' })
  })

  it('becomes deteriorating at typical and cannot be enabled outside Labor', () => {
    expect(calculateIndicatorDirection(adverse, { frequency: 'monthly', valence: 'lower-is-better', normalizingDimension: 'labor', condition: adequateCondition('typical') })).toMatchObject({ direction: 'deteriorating' })
    expect(calculateIndicatorDirection(adverse, { frequency: 'monthly', valence: 'lower-is-better', condition: adequateCondition('favorable-side') })).toMatchObject({ direction: 'deteriorating' })
  })

  it('never calls favorable movement normalizing', () => {
    expect(calculateIndicatorDirection(adverse, { frequency: 'monthly', valence: 'higher-is-better', normalizingDimension: 'labor', condition: adequateCondition('favorable-side') })).toMatchObject({ direction: 'improving' })
  })
})

describe('freshness', () => {
  it('docs example: keeps exact boundaries in the less severe state', () => {
    expect(evaluateFreshness('2024-01-01', '2024-01-16', { expectedCadenceDays: 10 }).state).toBe('current')
    expect(evaluateFreshness('2024-01-01', '2024-01-21', { expectedCadenceDays: 10 }).state).toBe('stale-warning')
  })

  it('docs example: warns beyond 1.5 times and suppresses only beyond 2 times cadence', () => {
    expect(evaluateFreshness('2024-01-01', '2024-01-17', { expectedCadenceDays: 10 }).state).toBe('stale-warning')
    const stale = evaluateFreshness('2024-01-01', '2024-01-22', { expectedCadenceDays: 10 })
    expect(stale).toMatchObject({ state: 'no-fresh-evidence', directionSuppressed: true, evidenceAgeDays: 21 })
    expect(suppressStaleDirection(adequateDirection('improving'), stale)).toEqual({ evidence: 'no-fresh-evidence', reason: 'freshness-suppression-threshold-exceeded' })
  })
})

describe('dimension agreement', () => {
  it.each(['favorable-side', 'typical', 'unfavorable-side'] as const)('docs example: returns shared %s condition group', (group) => {
    expect(combineDimensionConditions(adequateCondition(group), adequateCondition(group))).toMatchObject({ reading: group, reason: 'primaries-agree' })
  })

  it('returns mixed for favorable-versus-typical and favorable-versus-unfavorable', () => {
    expect(combineDimensionConditions(adequateCondition('favorable-side'), adequateCondition('typical')).reading).toBe('mixed')
    expect(combineDimensionConditions(adequateCondition('favorable-side'), adequateCondition('unfavorable-side')).reading).toBe('mixed')
  })

  it('returns unclear when a required primary is inadequate', () => {
    expect(combineDimensionConditions(adequateCondition('typical'), { evidence: 'insufficient', reason: 'gap' }).reading).toBe('unclear')
  })

  it('agrees exactly, and keeps normalizing distinct from deteriorating', () => {
    expect(combineDimensionDirections(adequateDirection('improving'), adequateDirection('improving')).reading).toBe('improving')
    expect(combineDimensionDirections(adequateDirection('normalizing'), adequateDirection('deteriorating')).reading).toBe('mixed')
  })

  it('distinguishes insufficient from no-fresh primary evidence', () => {
    expect(combineDimensionDirections(adequateDirection('improving'), { evidence: 'insufficient', reason: 'gap' }).reading).toBe('unclear')
    expect(combineDimensionDirections(adequateDirection('improving'), { evidence: 'no-fresh-evidence', reason: 'old' }).reading).toBe('no-fresh-evidence')
  })

  it('accepts only the two primary inputs, so supporting evidence cannot alter the result', () => {
    const reading = combineDimensionConditions(adequateCondition('favorable-side'), adequateCondition('typical'))
    expect(reading).toMatchObject({ reading: 'mixed', reason: 'primaries-disagree' })
    expect(reading.primaries).toHaveLength(2)
  })
})
