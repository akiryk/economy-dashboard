import { describe, expect, it } from 'vitest'
import type { CategoryInflationTrend } from '../utils/inflationCategoryTrends'
import { createInflationCategoryTrendChartOptions } from './inflationCategoryTrendChartOptions'

const trend: CategoryInflationTrend = {
  contributionCategoryId: 'energy',
  inflationSeriesSlug: 'energy-cpi-inflation',
  label: 'Energy',
  currentInflationRate: -2,
  currentPeriod: '2026-06-01',
  startPeriod: '2021-06-01',
  endPeriod: '2026-06-01',
  observations: [
    { date: '2021-06-01', value: 3 },
    { date: '2025-10-01', value: null },
    { date: '2026-06-01', value: -2 },
  ],
}

describe('createInflationCategoryTrendChartOptions', () => {
  it('uses the shared domain, zero line, null gap, nonsmoothed line, and latest endpoint', () => {
    const options = createInflationCategoryTrendChartOptions(trend, [-5, 10])
    expect(options.yAxis).toMatchObject({ min: -5, max: 10 })
    const series = (options.series as Array<Record<string, unknown>>)[0]!
    expect(series).toMatchObject({
      smooth: false,
      connectNulls: false,
      showSymbol: false,
      data: [
        ['2021-06-01', 3],
        ['2025-10-01', null],
        ['2026-06-01', -2],
      ],
    })
    expect(series).not.toHaveProperty('areaStyle')
    expect(series.markLine).toMatchObject({ data: [{ yAxis: 0 }] })
    expect(series.markPoint).toMatchObject({
      data: [{ coord: ['2026-06-01', -2] }],
    })
  })
})
