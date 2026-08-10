import { describe, expect, it } from 'vitest'
import { createDashboardSparklineOptions } from './dashboardSparklineOptions'

describe('dashboard sparkline options', () => {
  it('preserves gaps and has no axes, smoothing, symbols, legend, gridlines, or fill', () => {
    const options = createDashboardSparklineOptions([
      { date: '2026-01-01', value: 2 },
      { date: '2026-02-01', value: null },
      { date: '2026-03-01', value: 2.2 },
    ], 'normal')
    expect(options.xAxis.show).toBe(false)
    expect(options.yAxis.show).toBe(false)
    expect(options).not.toHaveProperty('legend')
    expect(options.series[0]).toMatchObject({
      data: [2, null, 2.2], smooth: false, connectNulls: false,
      showSymbol: false, areaStyle: undefined,
    })
    expect(createDashboardSparklineOptions([], 'normal', 'dark').series[0].lineStyle.color)
      .toBe('#8a8a93')
  })

  it('adds only an explicitly requested dashed reference line', () => {
    const withoutReference = createDashboardSparklineOptions([], 'normal')
    const withReference = createDashboardSparklineOptions(
      [], 'notable-bad', 'dark', { value: 0.5, label: 'Sahm trigger' },
    )
    expect(withoutReference.series[0].markLine).toBeUndefined()
    expect(withReference.series[0].markLine).toMatchObject({
      symbol: 'none',
      lineStyle: { color: '#26262a', width: 1, type: 'dashed' },
      data: [{ yAxis: 0.5, name: 'Sahm trigger' }],
    })
  })
})
