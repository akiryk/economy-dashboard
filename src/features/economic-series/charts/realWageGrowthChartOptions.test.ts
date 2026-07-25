import { describe, expect, it } from 'vitest'
import {
  createRealWageGrowthChartOptions,
  formatRealWageGrowthTooltip,
} from './realWageGrowthChartOptions'

const observations = [
  { date: '2021-06-01', value: -1 },
  { date: '2025-10-01', value: null },
  { date: '2026-06-01', value: 0.5 },
]

describe('createRealWageGrowthChartOptions', () => {
  it('renders one nonsmoothed gap-preserving line with zero and latest markers', () => {
    const options = createRealWageGrowthChartOptions({
      observations,
      domain: [-1.2, 0.7],
    })
    expect(options.yAxis).toMatchObject({ min: -1.2, max: 0.7 })
    expect(options.xAxis).toMatchObject({ type: 'time', show: false })
    const series = (options.series as Array<Record<string, unknown>>)[0]!
    expect(series).toMatchObject({
      name: 'Real wage growth',
      smooth: false,
      connectNulls: false,
      showSymbol: false,
      data: [
        ['2021-06-01', -1],
        ['2025-10-01', null],
        ['2026-06-01', 0.5],
      ],
      markLine: { data: [{ yAxis: 0 }] },
      markPoint: { data: [{ coord: ['2026-06-01', 0.5] }] },
    })
    expect(series).not.toHaveProperty('areaStyle')
  })

  it('adds the selected month without replacing the latest endpoint', () => {
    const options = createRealWageGrowthChartOptions({
      observations,
      domain: [-1.2, 0.7],
      activeObservation: observations[0],
    })
    const series = (options.series as Array<Record<string, unknown>>)[0]!
    expect(series.markLine).toMatchObject({
      data: [{ yAxis: 0 }, { xAxis: '2021-06-01' }],
    })
    expect(series.markPoint).toMatchObject({
      data: [
        { coord: ['2026-06-01', 0.5] },
        { coord: ['2021-06-01', -1] },
      ],
    })
  })

  it('formats exact tooltip content in percent', () => {
    expect(formatRealWageGrowthTooltip(observations[0]!)).toBe(
      'Real wage growth\nJune 2021\n−1.0%',
    )
    expect(formatRealWageGrowthTooltip({
      date: '2026-06-01',
      value: -0.049,
    })).toBe('Real wage growth\nJune 2026\n0%')
  })
})
