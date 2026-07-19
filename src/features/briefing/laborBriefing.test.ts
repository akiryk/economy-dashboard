import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import type { ConditionGroup, ConditionTier, DirectionState, IndicatorConditionResult, IndicatorDirectionResult } from './briefingModels'
import { buildLaborBriefing, combineLaborCondition, combineLaborDirection } from './laborBriefing'

const window = { requestedYears: 25, comparisonStart: '2000-01-01', comparisonEnd: '2025-01-01', observationCount: 100, usedShortHistory: false }

function condition(group: ConditionGroup, tier: ConditionTier = group === 'typical' ? 'typical' : group === 'favorable-side' ? 'favorable' : 'unfavorable'): IndicatorConditionResult {
  return { evidence: 'adequate', valence: 'higher-is-better', rawPercentile: 70, orientedPercentile: 70, tier, group, window }
}

function direction(value: DirectionState): IndicatorDirectionResult {
  return { evidence: 'adequate', direction: value, underlyingOrientation: value === 'improving' ? 'favorable' : value === 'broadly-stable' ? 'neutral' : 'adverse', currentChange: { frequency: 'monthly', windowPeriods: 6, latestPeriod: '2025-01-01', latestValue: 2, comparisonPeriod: '2024-07-01', comparisonValue: 1, signedChange: 1, absoluteChange: 1 }, noiseThreshold: 0.5, historicalChangeCount: 20, noiseGatePassed: value !== 'broadly-stable', comparisonWindow: window }
}

function series(slug: string, values: readonly number[], frequency: 'monthly' | 'weekly' = 'monthly'): EconomicSeries {
  return { id: slug, slug, provider: 'Fixture', providerSeriesId: slug, title: slug, shortTitle: slug, description: '', question: '', units: '', frequency, seasonalAdjustment: null, transformation: '', sourceName: 'Fixture', sourceUrl: 'https://example.com', retrievedAt: '2024-01-01', observations: values.map((value, index) => ({ date: new Date(Date.UTC(2020, frequency === 'monthly' ? index : 0, frequency === 'weekly' ? 1 + index * 7 : 1)).toISOString().slice(0, 10), value })) }
}

const levels = Array.from({ length: 60 }, (_, index) => 4 + (index % 3) * 0.1)
function fixtures(payrollValues: readonly number[] = levels.map((_, index) => 100 + (index % 3))) {
  return { unemployment: series('unemployment-rate', levels), payrolls: series('payroll-growth', payrollValues), primeAgeEmployment: series('prime-age-employment-ratio', levels.map((value) => 80 - value)), claims: null }
}

describe('corrected Labor condition combination', () => {
  it('uses unemployment anchor and EPOP confirmer agreement', () => {
    expect(combineLaborCondition(condition('favorable-side'), condition('favorable-side'))).toMatchObject({ reading: 'favorable-side', reason: 'agree' })
  })

  it('retains the anchor for adjacent groups in both directions', () => {
    expect(combineLaborCondition(condition('favorable-side'), condition('typical')).reading).toBe('favorable-side')
    expect(combineLaborCondition(condition('typical'), condition('favorable-side')).reading).toBe('typical')
    expect(combineLaborCondition(condition('unfavorable-side'), condition('typical')).reading).toBe('unfavorable-side')
    expect(combineLaborCondition(condition('typical'), condition('unfavorable-side')).reading).toBe('typical')
  })

  it('uses mixed only for directly opposing condition groups', () => {
    expect(combineLaborCondition(condition('favorable-side'), condition('unfavorable-side'))).toMatchObject({ reading: 'mixed', reason: 'opposing-groups' })
  })

  it('returns unclear when required condition evidence is missing', () => {
    expect(combineLaborCondition(condition('favorable-side'), { evidence: 'insufficient', reason: 'missing' }).reading).toBe('unclear')
  })
})

describe('corrected Labor direction combination', () => {
  it.each([
    ['broadly-stable', 'broadly-stable', 'broadly-stable'],
    ['broadly-stable', 'improving', 'improving'],
    ['improving', 'broadly-stable', 'improving'],
    ['broadly-stable', 'deteriorating', 'deteriorating'],
    ['broadly-stable', 'normalizing', 'normalizing'],
    ['improving', 'deteriorating', 'mixed'],
    ['improving', 'normalizing', 'mixed'],
    ['deteriorating', 'normalizing', 'deteriorating'],
  ] as const)('%s plus %s resolves to %s', (anchor, confirmer, expected) => {
    expect(combineLaborDirection(direction(anchor), direction(confirmer)).reading).toBe(expected)
  })

  it('suppresses direction when either required input has no fresh evidence', () => {
    expect(combineLaborDirection(direction('improving'), { evidence: 'no-fresh-evidence', reason: 'old' }).reading).toBe('no-fresh-evidence')
  })
})

describe('corrected Labor orchestration and copy', () => {
  it('does not let payroll level alter condition', () => {
    const low = buildLaborBriefing(fixtures(levels.map(() => -500)), '2024-12-15')
    const high = buildLaborBriefing(fixtures(levels.map(() => 5_000)), '2024-12-15')
    expect(low.status).toBe('ready')
    expect(high.status).toBe('ready')
    if (low.status !== 'ready' || high.status !== 'ready') return
    expect(low.conditionReading.reading).toBe(high.conditionReading.reading)
    expect(low.readingEvidence.find(({ id }) => id === 'payrolls')?.condition).toBeUndefined()
  })

  it('requires unemployment, payrolls, and EPOP but not claims', () => {
    expect(buildLaborBriefing({ ...fixtures(), primeAgeEmployment: null }, '2024-12-15').status).toBe('unclear')
    expect(buildLaborBriefing(fixtures(), '2024-12-15')).toMatchObject({ status: 'ready', supportingErrors: ['Initial claims data is unavailable.'] })
  })

  it('uses plain valence-oriented copy with values and no trace language', () => {
    const result = buildLaborBriefing(fixtures(), '2024-12-15')
    if (result.status !== 'ready') throw new Error('Expected ready fixture')
    expect(result.synthesis).toContain('unemployment is')
    expect(result.synthesis).toContain('payroll growth averages')
    expect(result.synthesis).toMatch(/lower than in roughly \d+% of the past 25 years/)
    expect(result.synthesis).not.toMatch(/historical percentile|favorable-side|unfavorable-side|primaries-|\d{4}-\d{2}-\d{2}/)
  })

  it('keeps the payroll revision qualifier conditional', () => {
    const stable = buildLaborBriefing(fixtures(), '2024-12-15')
    const material = buildLaborBriefing(fixtures([...levels.slice(0, -1), 2_000]), '2024-12-15')
    if (stable.status !== 'ready' || material.status !== 'ready') throw new Error('Expected ready fixtures')
    expect(stable.synthesis).not.toContain('commonly revised')
    expect(material.synthesis).toContain('commonly revised')
  })
})
