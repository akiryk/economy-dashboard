import { describe, expect, it } from 'vitest'
import type { YAXisComponentOption } from 'echarts'
import { createEconomicTimeSeriesChartOptions } from './economicTimeSeriesChartOptions'

function getYAxis(includeZero: boolean): YAXisComponentOption {
  const options = createEconomicTimeSeriesChartOptions({
    data: [
      ['2025-01-01', 4.1],
      ['2025-02-01', 4.3],
    ],
    seriesName: 'Unemployment',
    frequency: 'monthly',
    units: 'Percent',
    transformation: 'Level',
    includeZero,
  })

  return options.yAxis as YAXisComponentOption
}

describe('createEconomicTimeSeriesChartOptions', () => {
  it('does not force zero for level measures and applies readable padding', () => {
    const axis = getYAxis(false)
    const minimum = axis.min as (range: { min: number; max: number }) => number
    const maximum = axis.max as (range: { min: number; max: number }) => number

    expect(minimum({ min: 4.1, max: 4.3 })).toBe(3)
    expect(maximum({ min: 4.1, max: 4.3 })).toBe(5)
  })

  it('keeps zero visible for GDP and CPI policy', () => {
    const axis = getYAxis(true)
    const minimum = axis.min as (range: { min: number; max: number }) => number
    const maximum = axis.max as (range: { min: number; max: number }) => number

    expect(minimum({ min: 2, max: 4 })).toBe(0)
    expect(maximum({ min: -4, max: -2 })).toBe(0)
  })
})
