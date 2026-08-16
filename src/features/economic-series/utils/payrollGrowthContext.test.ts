import { describe, expect, it } from 'vitest'
import {
  classifyLatestPayrollMonth,
  classifyPayrollDirection,
  classifyPayrollHistoricalState,
  classifyPayrollTrend,
  createPayrollGrowthAccessibleSummary,
  derivePayrollGrowthContext,
  shouldMentionLatestPayrollMonth,
} from './payrollGrowthContext'
import payrollGrowth from '../data/payroll-growth.json'
import monthlyPayroll from '../data/monthly-payroll-change.json'

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

describe('payroll trend interpretation', () => {
  it.each([
    [51, 'typical', 'growing'],
    [51, 'strong', 'growing-strongly'],
    [50, 'strong', 'nearly-stalled'],
    [20, 'weak', 'nearly-stalled'],
    [0, 'typical', 'nearly-stalled'],
    [-50, 'very-weak', 'nearly-stalled'],
    [-50.001, 'typical', 'contracting'],
    [null, 'unavailable', 'unavailable'],
  ] as const)('classifies %s / %s as %s', (value, historical, state) => {
    expect(classifyPayrollTrend(value, historical)).toBe(state)
  })

  it.each([
    [-1, 'negative'], [0, 'near-zero'], [1, 'positive'], [null, 'unavailable'],
  ] as const)('classifies latest month %s as %s', (value, state) => {
    expect(classifyLatestPayrollMonth(value)).toBe(state)
  })

  it.each([
    [20, -1, true], [-20, 1, true], [20, 1, false], [-20, -1, false],
    [0, -1, false], [20, null, false],
  ] as const)('sets sign-divergence mention for %s / %s to %s', (trend, month, mention) => {
    expect(shouldMentionLatestPayrollMonth(trend, month)).toBe(mention)
  })

  it.each([
    [20, 69, 'stable'], [20, 70, 'slowing'], [120, 70, 'accelerating'],
    [119.99, 70, 'stable'], [20, null, 'unavailable'],
  ] as const)('classifies non-overlapping direction %s vs %s as %s', (latest, prior, state) => {
    expect(classifyPayrollDirection(latest, prior)).toBe(state)
  })

  it('produces the July-style result from aligned monthly observations', () => {
    const averages = months(62, () => 100)
    averages.at(-1)!.value = 20
    const monthly = [
      { date: '2026-02-01', value: -156 },
      { date: '2026-03-01', value: 214 },
      { date: '2026-04-01', value: 148 },
      { date: '2026-05-01', value: 63 },
      { date: '2026-06-01', value: 20 },
      { date: '2026-07-01', value: -23 },
    ]
    averages.at(-1)!.date = '2026-07-01'
    const model = derivePayrollGrowthContext(averages, monthly)
    expect(model).toMatchObject({
      trendState: 'nearly-stalled', latestMonthState: 'negative',
      directionState: 'stable', mentionLatestMonth: true,
      mentionReason: 'sign-divergence', priorNonOverlappingAverage: 68.66666666666667,
    })
    expect(model.answer).toBe(
      'Job growth has nearly stalled. Payrolls fell by 23,000 in July, while the latest three-month average is +20,000 jobs per month.',
    )
  })

  it('keeps a strong positive trend when the aligned latest month is negative', () => {
    const model = derivePayrollGrowthContext(
      months(301, () => 200).map((item, index, all) =>
        index === all.length - 1 ? { ...item, value: 300 } : item),
      [{ date: '2025-01-01', value: -40 }],
    )
    expect(model.trendState).toBe('growing-strongly')
    expect(model.latestMonthState).toBe('negative')
    expect(model.mentionLatestMonth).toBe(true)
    expect(model.answer).toContain('strong pace')
    expect(model.answer).not.toContain('nearly stalled')
  })

  it('does not mention an ordinary aligned positive month', () => {
    const averages = months(301, () => 180)
    const date = averages.at(-1)!.date
    const model = derivePayrollGrowthContext(averages, [{ date, value: 170 }])
    expect(model.mentionLatestMonth).toBe(false)
    expect(model.answer).toContain('solid pace')
    expect(model.answer).not.toContain('Payrolls rose')
  })

  it('does not combine a monthly observation from a different ending month', () => {
    const averages = months(61, () => 20)
    const latestDate = averages.at(-1)!.date
    const model = derivePayrollGrowthContext(averages, [
      { date: new Date(`${latestDate}T00:00:00Z`).toISOString().slice(0, 10), value: null },
      { date: '2026-07-01', value: -23 },
    ])
    expect(model.latestMonthState).toBe('unavailable')
    expect(model.mentionLatestMonth).toBe(false)
  })

  it('does not infer a trend when the latest average is null', () => {
    const averages = months(61, () => 20)
    averages.at(-1)!.value = null
    const model = derivePayrollGrowthContext(averages, [
      { date: averages.at(-1)!.date, value: -23 },
    ])
    expect(model).toMatchObject({
      latestObservation: null,
      trendState: 'unavailable',
      latestMonthState: 'unavailable',
      directionState: 'unavailable',
      mentionLatestMonth: false,
    })
    expect(model.answer).toBe('The latest three-month average is unavailable.')
  })

  it('keeps direction unavailable without a complete prior non-overlapping window', () => {
    const averages = months(61, () => 100)
    const latestDate = averages.at(-1)!.date
    const model = derivePayrollGrowthContext(averages, [
      { date: latestDate, value: 100 },
    ])
    expect(model.directionState).toBe('unavailable')
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
    expect(summary).toContain('Broad trend state: growing')
  })

  it('calibrates sign divergence against committed historical cases', () => {
    for (const date of [
      '2001-03-01', '2007-07-01', '2008-02-01', '2010-06-01',
      '2020-12-01', '2025-01-01', '2025-06-01', '2026-07-01',
    ]) {
      const averages = payrollGrowth.observations.filter(({ date: item }) => item <= date)
      const monthly = monthlyPayroll.observations.filter(({ date: item }) => item <= date)
      const model = derivePayrollGrowthContext(averages, monthly)
      expect(model.mentionReason, date).toBe('sign-divergence')
      expect(model.latestMonthState, date).toBe('negative')
    }
    const december2020 = derivePayrollGrowthContext(
      payrollGrowth.observations.filter(({ date }) => date <= '2020-12-01'),
      monthlyPayroll.observations.filter(({ date }) => date <= '2020-12-01'),
    )
    expect(december2020.trendState).toBe('growing-strongly')
    expect(december2020.answer).not.toContain('nearly stalled')
  })
})
