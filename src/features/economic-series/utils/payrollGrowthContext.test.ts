import { describe, expect, it } from 'vitest'
import {
  classifyPayrollHistoricalState,
  createPayrollGrowthAccessibleSummary,
  derivePayrollGrowthContext,
  formatPayrollGrowthAnswer,
} from './payrollGrowthContext'

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
  innerLower: 100,
  innerUpper: 250,
  median: 175,
  outerLower: 0,
  outerUpper: 400,
  latestObservation: { date: '2026-06-01', value: 175 },
  validObservationCount: 301,
  recentObservationCount: 61,
}

describe('payroll historical state', () => {
  it.each([
    [-1, 'very-weak'],
    [0, 'weak'],
    [100, 'typical'],
    [250, 'typical'],
    [400, 'strong'],
    [401, 'very-strong'],
  ])('classifies %s at exact boundaries', (value, state) => {
    expect(classifyPayrollHistoricalState({
      ...bands,
      latestObservation: { ...bands.latestObservation, value },
    })).toBe(state)
  })

  it('uses trailing 25 years of valid averages and a 61-month line', () => {
    const model = derivePayrollGrowthContext(
      months(318, (index) => index === 20 ? null : index),
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
    expect(model.historicalBands.recentObservations).toContainEqual({
      date: '2026-05-01',
      value: 316,
    })
  })
})

describe('payroll sign and historical answer', () => {
  it.each([
    [150, 'very-weak', 'Yes. Employers are adding jobs, but the pace is very weak'],
    [150, 'weak', 'Yes. Employers are adding jobs, but the pace is somewhat weak'],
    [150, 'typical', 'Yes. Employers are adding jobs at a typical pace'],
    [150, 'strong', 'Yes. Employers are adding jobs at a strong pace'],
    [150, 'very-strong', 'Yes. Employers are adding jobs at a very strong pace'],
    [-10, 'very-weak', 'No. Employers are cutting jobs, an unusually weak result'],
    [0, 'typical', 'Payroll employment is essentially unchanged.'],
  ] as const)('formats %s in the %s state', (value, state, wording) => {
    expect(formatPayrollGrowthAnswer(value, state)).toContain(wording)
  })

  it('provides complete accessible context', () => {
    const summary = createPayrollGrowthAccessibleSummary(
      derivePayrollGrowthContext(months(318, () => 111.333)),
    )
    expect(summary).toContain('+111K in June 2026')
    expect(summary).toContain('a gain of 111,333 jobs per month on average')
    expect(summary).toContain('line runs from June 2021 through June 2026')
    expect(summary).toContain('middle 50% ranges from')
    expect(summary).toContain('middle 80%')
    expect(summary).toContain('Zero separates net payroll growth')
    expect(summary).toContain('complete three-month-average observations')
    expect(summary).toContain('estimates are revised')
  })
})
