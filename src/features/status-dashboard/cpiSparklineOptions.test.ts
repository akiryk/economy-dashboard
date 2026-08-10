import { describe, expect, it } from 'vitest'
import { createCpiSparklineOptions } from './cpiSparklineOptions'

describe('CPI sparkline options', () => {
  it('preserves gaps and has no axes, smoothing, symbols, legend, gridlines, or fill', () => {
    const options = createCpiSparklineOptions([
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
    expect(createCpiSparklineOptions([], 'normal', 'dark').series[0].lineStyle.color)
      .toBe('#8a8a93')
  })
})
