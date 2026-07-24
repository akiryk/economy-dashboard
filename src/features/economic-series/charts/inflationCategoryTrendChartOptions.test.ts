import { describe, expect, it } from 'vitest'
import type { CategoryInflationTrend } from '../utils/inflationCategoryTrends'
import {
  createInflationCategoryTrendChartOptions,
  formatCategoryInflationTooltip,
} from './inflationCategoryTrendChartOptions'

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
  domain: { min: -5, max: 10, includesZero: true },
  displayRangeLabel: '−5.0% to +10.0%',
}

describe('createInflationCategoryTrendChartOptions', () => {
  it('uses the per-series domain, gap, nonsmoothed line, and active details', () => {
    const active = trend.observations[0]!
    const options = createInflationCategoryTrendChartOptions(trend, active)
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
    expect(series.markLine).toMatchObject({
      data: [{ yAxis: 0 }, { xAxis: '2021-06-01' }],
    })
    expect(series.markPoint).toMatchObject({
      data: [
        { coord: ['2026-06-01', -2] },
        { coord: ['2021-06-01', 3] },
      ],
    })
  })

  it('omits zero when it is outside the padded domain', () => {
    const options = createInflationCategoryTrendChartOptions({
      ...trend,
      domain: { min: 1, max: 4, includesZero: false },
    })
    const series = (options.series as Array<Record<string, unknown>>)[0]!
    expect(series.markLine).toMatchObject({ data: [] })
  })

  it('formats category inflation tooltip content in percent', () => {
    const text = formatCategoryInflationTooltip(trend, trend.observations[0]!)
    expect(text).toBe('Energy inflation\nJune 2021\n+3.0%')
    expect(text).not.toContain('pp')
    expect(text).not.toContain('contribution')
  })
})
