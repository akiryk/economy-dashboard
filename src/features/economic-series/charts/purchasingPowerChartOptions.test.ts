import { describe, expect, it } from 'vitest'
import { createPurchasingPowerChartOptions } from './purchasingPowerChartOptions'

describe('purchasing-power chart options', () => {
  it('preserves gaps, renders zero and latest markers, and has no percentile bands', () => {
    const options = createPurchasingPowerChartOptions([
      { date: '2020-01-01', value: 1 }, { date: '2020-02-01', value: null }, { date: '2020-03-01', value: -1 },
    ], null)
    const chartSeries = (options.series as Record<string, unknown>[])[0]!
    expect(chartSeries.data).toEqual([['2020-01-01', 1], ['2020-02-01', null], ['2020-03-01', -1]])
    expect(chartSeries.connectNulls).toBe(false)
    expect(chartSeries.markArea).toBeUndefined()
    expect(chartSeries.markLine).toMatchObject({ data: [expect.objectContaining({ yAxis: 0 })] })
    expect(chartSeries.markPoint).toMatchObject({ data: [expect.objectContaining({ coord: ['2020-03-01', -1] })] })
  })
})
