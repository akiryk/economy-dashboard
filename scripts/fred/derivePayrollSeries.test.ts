import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { FredObservationsResponse } from './fredClient'
import {
  deriveMonthlyPayrollChanges,
  derivePayrollSeries,
  deriveThreeMonthAverageChanges,
} from './derivePayrollSeries'
import { payrollSeriesConfiguration } from './seriesConfigurations'

describe('deriveMonthlyPayrollChanges', () => {
  it('sorts without mutation and preserves positive, negative, and zero changes', () => {
    const source: EconomicObservation[] = [
      { date: '2000-04-01', value: 990 },
      { date: '2000-01-01', value: 1_000 },
      { date: '2000-03-01', value: 1_020 },
      { date: '2000-02-01', value: 1_020 },
    ]
    const original = structuredClone(source)

    expect(deriveMonthlyPayrollChanges(source)).toEqual([
      { date: '2000-01-01', value: null },
      { date: '2000-02-01', value: 20 },
      { date: '2000-03-01', value: 0 },
      { date: '2000-04-01', value: -30 },
    ])
    expect(source).toEqual(original)
  })

  it('returns null across missing values and calendar gaps', () => {
    expect(
      deriveMonthlyPayrollChanges([
        { date: '2000-01-01', value: 1_000 },
        { date: '2000-02-01', value: null },
        { date: '2000-03-01', value: 990 },
        { date: '2000-05-01', value: 980 },
        { date: '2000-06-01', value: 970 },
      ]),
    ).toEqual([
      { date: '2000-01-01', value: null },
      { date: '2000-02-01', value: null },
      { date: '2000-03-01', value: null },
      { date: '2000-05-01', value: null },
      { date: '2000-06-01', value: -10 },
    ])
  })
})

describe('deriveThreeMonthAverageChanges', () => {
  it('uses the current and two prior consecutive changes without mutation', () => {
    const changes: EconomicObservation[] = [
      { date: '2000-04-01', value: -30 },
      { date: '2000-01-01', value: 10 },
      { date: '2000-03-01', value: 20 },
      { date: '2000-02-01', value: 0 },
    ]
    const original = structuredClone(changes)

    expect(deriveThreeMonthAverageChanges(changes)).toEqual([
      { date: '2000-01-01', value: null },
      { date: '2000-02-01', value: null },
      { date: '2000-03-01', value: 10 },
      { date: '2000-04-01', value: -10 / 3 },
    ])
    expect(changes).toEqual(original)
  })

  it('returns null for missing values and windows that bridge a gap', () => {
    expect(
      deriveThreeMonthAverageChanges([
        { date: '2000-01-01', value: 10 },
        { date: '2000-02-01', value: null },
        { date: '2000-03-01', value: 20 },
        { date: '2000-05-01', value: 30 },
      ]).map((observation) => observation.value),
    ).toEqual([null, null, null, null])
  })
})

describe('derivePayrollSeries', () => {
  const response: FredObservationsResponse = {
    observations: [
      { date: '1999-10-01', value: '1000' },
      { date: '1999-11-01', value: '1010' },
      { date: '1999-12-01', value: '1030' },
      { date: '2000-01-01', value: '1060' },
      { date: '2000-02-01', value: '1050' },
      { date: '2027-01-01', value: '9999' },
    ],
  }

  it('builds two valid PAYEMS-derived series and excludes future values', () => {
    const original = structuredClone(response)
    const result = derivePayrollSeries(
      response,
      '2026-07-12',
      payrollSeriesConfiguration,
    )

    expect(result.monthlyChange.observations).toEqual([
      { date: '2000-01-01', value: 30 },
      { date: '2000-02-01', value: -10 },
    ])
    expect(result.payrollGrowth.observations).toEqual([
      { date: '2000-01-01', value: 20 },
      { date: '2000-02-01', value: 40 / 3 },
    ])
    expect(result.payrollGrowth).toMatchObject({
      providerSeriesId: 'PAYEMS',
      units: 'Thousands of jobs',
      transformation:
        'Three-month average of monthly change calculated by the application',
    })
    expect(validateEconomicSeries(result.monthlyChange)).toEqual(
      result.monthlyChange,
    )
    expect(validateEconomicSeries(result.payrollGrowth)).toEqual(
      result.payrollGrowth,
    )
    expect(response).toEqual(original)
  })

  it('rejects duplicate provider dates', () => {
    expect(() =>
      derivePayrollSeries(
        {
          observations: [
            { date: '2000-01-01', value: '1000' },
            { date: '2000-01-01', value: '1001' },
            { date: '2000-02-01', value: '1002' },
          ],
        },
        '2026-07-12',
        payrollSeriesConfiguration,
      ),
    ).toThrow('duplicate date')
  })
})
