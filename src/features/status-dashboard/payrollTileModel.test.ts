import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import {
  classifyPayrollPace,
  createPayrollTileModel,
  deriveThreeMonthPayrollAverage,
  describePayrollPace,
} from './payrollTileModel'

function series(values: Array<{ date: string; value: number | null }>): EconomicSeries {
  return {
    id: 'dashboard-payroll-change', slug: 'dashboard-payroll-change',
    provider: 'FRED', providerSeriesId: 'PAYEMS', title: 'Payroll change',
    shortTitle: 'Payroll change', description: 'Monthly payroll change',
    question: 'Are employers adding jobs?', units: 'Thousands of persons',
    frequency: 'monthly', seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'FRED units=chg transformation of PAYEMS',
    sourceName: 'BLS via FRED', sourceUrl: 'https://example.com',
    retrievedAt: '2026-08-10', observations: values,
  }
}

describe('payroll tile model', () => {
  it('derives arithmetic means only from three consecutive valid calendar months', () => {
    expect(deriveThreeMonthPayrollAverage([
      { date: '2026-01-01', value: 10 },
      { date: '2026-02-01', value: 20 },
      { date: '2026-03-01', value: 30 },
      { date: '2026-04-01', value: 40 },
    ])).toEqual([
      { date: '2026-01-01', value: null },
      { date: '2026-02-01', value: null },
      { date: '2026-03-01', value: 20 },
      { date: '2026-04-01', value: 30 },
    ])
  })

  it('preserves missing components and never averages by array position', () => {
    expect(deriveThreeMonthPayrollAverage([
      { date: '2026-01-01', value: 10 },
      { date: '2026-03-01', value: 30 },
      { date: '2026-04-01', value: 40 },
      { date: '2026-05-01', value: null },
    ])).toEqual([
      { date: '2026-01-01', value: null },
      { date: '2026-03-01', value: null },
      { date: '2026-04-01', value: null },
      { date: '2026-05-01', value: null },
    ])
  })

  it('recalculates every affected average when a source month is revised', () => {
    const original = deriveThreeMonthPayrollAverage([
      { date: '2026-01-01', value: 30 }, { date: '2026-02-01', value: 60 },
      { date: '2026-03-01', value: 90 }, { date: '2026-04-01', value: 120 },
    ])
    const revised = deriveThreeMonthPayrollAverage([
      { date: '2026-01-01', value: 30 }, { date: '2026-02-01', value: 30 },
      { date: '2026-03-01', value: 90 }, { date: '2026-04-01', value: 120 },
    ])
    expect(original.slice(2).map(({ value }) => value)).toEqual([60, 90])
    expect(revised.slice(2).map(({ value }) => value)).toEqual([50, 80])
  })

  it.each([
    [-1, 99, 'Shrinking', 'notable-bad'],
    [0, 50, 'Flat', 'normal'],
    [20, 24.99, 'Growing slowly', 'normal'],
    [20, 25, 'Growing', 'normal'],
    [20, 75, 'Growing', 'normal'],
    [20, 75.01, 'Growing strongly', 'notable-good'],
  ] as const)('describes %s at percentile %s as %s / %s', (value, percentile, label, state) => {
    expect(describePayrollPace(value, percentile)).toBe(label)
    expect(classifyPayrollPace(value, percentile)).toBe(state)
  })

  it('uses the full derived history for percentile and a five-year derived sparkline', () => {
    const observations = Array.from({ length: 85 }, (_, index) => ({
      date: `${2020 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}-01`,
      value: index === 82 ? null : index,
    }))
    const model = createPayrollTileModel(series(observations))
    expect(model.latestMonth).toEqual({ date: '2027-01-01', value: 84 })
    expect(model.headline.date).toBe('2026-10-01')
    expect(model.sparkline[0].date).toBe('2021-10-01')
    expect(model.sparkline).toHaveLength(61)
    expect(model.historical.historyStart).toBe('2020-03-01')
    expect(model.historical.historyEnd).toBe('2026-10-01')
    expect(model).toMatchObject({
      trendState: 'growing-strongly',
      latestMonthState: 'positive',
      mentionLatestMonth: false,
    })
  })
})
