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
    const result = buildLaborBriefing({ activity, momentum, unemployment, payrolls, monthlyPayrollChange, primeAgeEmployment, claims }, '2026-07-20')
    if (result.status !== 'ready') throw new Error('Expected current LMCI result')
    expect(result.activity).toMatchObject({ rawValue: 0.08758, period: '2026-06-01', comparisonStart: '1992-01-01', observationCount: 414, tier: 'Near Avg.', stale: false })
    expect(result.activity.percentile).toBeCloseTo(43.0993, 3)
    expect(result.momentum).toMatchObject({ rawValue: 0.12056, period: '2026-06-01', comparisonStart: '1992-01-01', observationCount: 414, tier: 'Steady', stale: false })
    expect(result.momentum.percentile).toBeCloseTo(54.2373, 3)
    expect(result.synthesis).toBe('Labor-market activity is near its historical average, while momentum is steady.')
    expect(result.supporting).toHaveLength(5)
  })
})
