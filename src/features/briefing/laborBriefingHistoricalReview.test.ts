import { beforeAll, describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import { localEconomicSeriesRepository } from '../economic-series/repositories/localEconomicSeriesRepository'
import { buildLaborBriefing, type LaborSeriesInput } from './laborBriefing'

let committed: LaborSeriesInput

beforeAll(async () => {
  const [unemployment, payrolls, primeAgeEmployment, claims] = await Promise.all([
    localEconomicSeriesRepository.getBySlug('unemployment-rate'),
    localEconomicSeriesRepository.getBySlug('payroll-growth'),
    localEconomicSeriesRepository.getBySlug('prime-age-employment-ratio'),
    localEconomicSeriesRepository.getBySlug('initial-unemployment-claims-four-week-average'),
  ])
  committed = { unemployment, payrolls, primeAgeEmployment, claims }
})

function truncate(series: EconomicSeries | null, endpoint: string): EconomicSeries | null {
  return series ? { ...series, observations: series.observations.filter(({ date }) => date <= endpoint) } : null
}

function at(endpoint: string) {
  return buildLaborBriefing({
    unemployment: truncate(committed.unemployment, endpoint),
    payrolls: truncate(committed.payrolls, endpoint),
    primeAgeEmployment: truncate(committed.primeAgeEmployment, endpoint),
    claims: truncate(committed.claims, endpoint),
  }, endpoint)
}

describe('Labor historical review against committed latest-vintage data', () => {
  it.each([
    ['1999-12-01', 'strong', 'broadly stable', 'agree-stable'],
    ['2001-11-01', 'mixed', 'mixed', 'mixed-condition'],
    ['2007-12-01', 'mixed', 'mixed', 'mixed-condition'],
    ['2009-10-01', 'weak', 'mixed', 'mixed-direction'],
    ['2010-12-01', 'mixed', 'broadly stable', 'mixed-condition'],
    ['2019-12-01', 'mixed', 'broadly stable', 'mixed-condition'],
    ['2020-04-01', 'weak', 'deteriorating', 'other-valid'],
    ['2021-12-01', 'strong', 'improving', 'agree-improving'],
    ['2024-08-01', 'mixed', 'mixed', 'mixed-condition'],
    ['2026-06-01', 'mixed', 'mixed', 'mixed-condition'],
  ])('pins the %s review endpoint', (endpoint, condition, direction, template) => {
    expect(at(endpoint)).toMatchObject({ status: 'ready', conditionLabel: condition, directionLabel: direction, templateId: template })
  })

  it('pins the current committed result and reconciles all displayed values', () => {
    const result = buildLaborBriefing(committed, '2026-07-19')
    expect(result).toMatchObject({
      status: 'ready', conditionLabel: 'mixed', directionLabel: 'mixed', templateId: 'mixed-condition',
      staleWarning: false, revisionQualified: true,
      primaries: [
        { value: '4.2%', period: 'June 2026', fullHistoryRawPercentile: 21.595744680851066 },
        { value: '+111K', period: 'June 2026', fullHistoryRawPercentile: 37.2848948374761 },
      ],
      supporting: [
        { value: '80.2%', period: 'June 2026' },
        { value: '214K', period: 'Week of Jul 11, 2026' },
      ],
    })
    if (result.status !== 'ready') return
    expect(result.synthesis).toContain('condition signals disagree')
    expect(result.synthesis).toContain('direction also disagrees')
  })

  it('shows normalizing only for a favorable Labor condition with adverse material movement', () => {
    const result = at('2001-11-01')
    if (result.status !== 'ready') throw new Error('Expected review endpoint')
    expect(result.primaries[0]).toMatchObject({
      condition: { evidence: 'adequate', group: 'favorable-side' },
      direction: { evidence: 'adequate', direction: 'normalizing', underlyingOrientation: 'adverse', noiseGatePassed: true },
    })
    expect(result.primaries[1]).toMatchObject({
      condition: { evidence: 'adequate', group: 'unfavorable-side' },
      direction: { evidence: 'adequate', direction: 'deteriorating', underlyingOrientation: 'adverse', noiseGatePassed: true },
    })
  })
})
