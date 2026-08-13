import { describe, expect, it } from 'vitest'
import { localEconomicSeriesRepository } from '../economic-series/repositories/localEconomicSeriesRepository'
import { buildLaborBriefing } from './laborBriefing'

describe('committed LMCI briefing data', () => {
  it('builds the current reading from complete full-history primary series', async () => {
    const [activity, momentum, unemployment, payrolls, monthlyPayrollChange, primeAgeEmployment, claims] = await Promise.all([
      localEconomicSeriesRepository.getBySlug('labor-market-activity-index'),
      localEconomicSeriesRepository.getBySlug('labor-market-momentum-index'),
      localEconomicSeriesRepository.getBySlug('unemployment-rate'),
      localEconomicSeriesRepository.getBySlug('payroll-growth'),
      localEconomicSeriesRepository.getBySlug('monthly-payroll-change'),
      localEconomicSeriesRepository.getBySlug('prime-age-employment-ratio'),
      localEconomicSeriesRepository.getBySlug('initial-unemployment-claims-four-week-average'),
    ])
    const result = buildLaborBriefing(
      { activity, momentum, unemployment, payrolls, monthlyPayrollChange, primeAgeEmployment, claims },
      activity!.retrievedAt.slice(0, 10),
    )
    if (result.status !== 'ready') throw new Error('Expected current LMCI result')
    const latestActivity = activity!.observations.at(-1)!
    const latestMomentum = momentum!.observations.at(-1)!
    expect(result.activity).toMatchObject({ rawValue: latestActivity.value, period: latestActivity.date, comparisonStart: activity!.observations[0]!.date, observationCount: activity!.observations.length, stale: false })
    expect(result.momentum).toMatchObject({ rawValue: latestMomentum.value, period: latestMomentum.date, comparisonStart: momentum!.observations[0]!.date, observationCount: momentum!.observations.length, stale: false })
    expect(result.activity?.percentile).toBeGreaterThanOrEqual(0)
    expect(result.activity?.percentile).toBeLessThanOrEqual(100)
    expect(result.momentum?.percentile).toBeGreaterThanOrEqual(0)
    expect(result.momentum?.percentile).toBeLessThanOrEqual(100)
    expect(result.answer.length).toBeGreaterThan(20)
    expect(result.supporting).toHaveLength(5)
  })
})
