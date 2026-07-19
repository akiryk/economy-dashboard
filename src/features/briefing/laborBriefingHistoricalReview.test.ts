import { beforeAll, describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import { localEconomicSeriesRepository } from '../economic-series/repositories/localEconomicSeriesRepository'
import { buildLaborBriefing, type LaborSeriesInput } from './laborBriefing'

let committed: LaborSeriesInput

beforeAll(async () => {
  const [unemployment, payrolls, primeAgeEmployment, claims] = await Promise.all([
    localEconomicSeriesRepository.getBySlug('unemployment-rate'), localEconomicSeriesRepository.getBySlug('payroll-growth'),
    localEconomicSeriesRepository.getBySlug('prime-age-employment-ratio'), localEconomicSeriesRepository.getBySlug('initial-unemployment-claims-four-week-average'),
  ])
  committed = { unemployment, payrolls, primeAgeEmployment, claims }
})

function truncate(series: EconomicSeries | null, endpoint: string): EconomicSeries | null {
  return series ? { ...series, observations: series.observations.filter(({ date }) => date <= endpoint) } : null
}

function at(endpoint: string) {
  return buildLaborBriefing({ unemployment: truncate(committed.unemployment, endpoint), payrolls: truncate(committed.payrolls, endpoint), primeAgeEmployment: truncate(committed.primeAgeEmployment, endpoint), claims: truncate(committed.claims, endpoint) }, endpoint)
}

describe('corrected Labor model against committed latest-vintage data', () => {
  it.each(['1999-12-01', '2001-11-01', '2007-12-01', '2009-10-01', '2010-12-01', '2019-12-01', '2020-04-01', '2021-12-01', '2024-08-01', '2026-06-01'])('builds a complete, plain-language %s endpoint', (endpoint) => {
    const result = at(endpoint)
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.synthesis).not.toMatch(/historical percentile|favorable-side|unfavorable-side|primaries-|\d{4}-\d{2}-\d{2}/)
  })

  it('pins the corrected current stock/flow result and source values', () => {
    const result = buildLaborBriefing(committed, '2026-07-19')
    expect(result).toMatchObject({
      status: 'ready', conditionLabel: 'solid', directionLabel: 'improving', templateId: 'improving', staleWarning: false,
      readingEvidence: [
        { id: 'unemployment', value: '4.2%', period: 'June 2026' },
        { id: 'payrolls', value: '+111K', period: 'June 2026', condition: undefined },
        { id: 'primeAgeEmployment', value: '80.2%', period: 'June 2026' },
      ],
      supporting: [{ id: 'claims', value: '214K', period: 'Week of Jul 11, 2026' }],
    })
    if (result.status !== 'ready') return
    expect(result.conditionReading).toMatchObject({ reading: 'favorable-side', reason: 'agree' })
    expect(result.directionReading).toMatchObject({ reading: 'improving', reason: 'stable-plus-material' })
  })

  it('retains adverse unemployment movement when normalizing', () => {
    const result = at('2001-11-01')
    if (result.status !== 'ready') throw new Error('Expected endpoint')
    expect(result.readingEvidence[0].direction).toMatchObject({ evidence: 'adequate', direction: 'normalizing', underlyingOrientation: 'adverse' })
  })
})
