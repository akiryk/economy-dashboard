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
    valueFormat: 'percentage',
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

  it('formats payroll counts and keeps the zero reference line', () => {
    const options = createEconomicTimeSeriesChartOptions({
      data: [
        ['2026-05-01', -42],
        ['2026-06-01', 145.333],
      ],
      seriesName: 'Payroll growth',
      frequency: 'monthly',
      units: 'Thousands of jobs',
      transformation: 'Three-month average of monthly change',
      includeZero: true,
      valueFormat: 'signed-thousands',
    })
    const axis = options.yAxis as YAXisComponentOption
    const series = (
      options.series as unknown as Array<{
        markLine?: unknown
        data?: Array<[string, number | null]>
      }>
    )[0]
    const tooltip = options.tooltip as {
      formatter: (params: { value: [string, number] }) => string
    }

    expect(axis.name).toBe('Jobs (thousands)')
    expect(axis.axisLabel).toMatchObject({ formatter: '{value}K' })
    expect(series?.markLine).toBeDefined()
    expect(series?.data?.[0]).toEqual(['2026-05-01', -42])
    expect(
      tooltip.formatter({ value: ['2026-06-01', 145.333] }),
    ).toBe('June 2026\nPayroll growth: +145K')
  })
})
