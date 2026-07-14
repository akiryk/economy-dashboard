import { describe, expect, it } from 'vitest'
import type { YAXisComponentOption } from 'echarts'
import {
  createEconomicComparisonChartOptions,
  createEconomicTimeSeriesChartOptions,
  createInflationComparisonChartOptions,
} from './economicTimeSeriesChartOptions'

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

describe('createEconomicComparisonChartOptions', () => {
  it('uses two aligned lines, one percentage axis, a legend, and zero line', () => {
    const options = createEconomicComparisonChartOptions({
      nominalData: [['2026-05-01', 3.5]],
      inflationData: [['2026-05-01', 4.2]],
      realData: [['2026-05-01', -0.58456]],
      frequency: 'monthly',
    })
    const chartSeries = options.series as unknown as Array<{
      name: string
      data: Array<[string, number | null]>
      lineStyle: { type: string }
      markLine?: unknown
      yAxisIndex?: number
    }>
    const tooltip = options.tooltip as {
      formatter: (params: Array<{
        seriesName: string
        value: [string, number]
      }>) => string
    }

    expect(Array.isArray(options.yAxis)).toBe(false)
    expect(chartSeries).toHaveLength(2)
    expect(chartSeries.map((item) => item.name)).toEqual([
      'Nominal wage growth',
      'Headline CPI inflation',
    ])
    expect(chartSeries.map((item) => item.lineStyle.type)).toEqual([
      'solid',
      'dashed',
    ])
    expect(chartSeries[0]?.markLine).toBeDefined()
    expect(chartSeries.every((item) => item.yAxisIndex === undefined)).toBe(true)
    expect(options.legend).toMatchObject({
      data: ['Nominal wage growth', 'Headline CPI inflation'],
    })
    expect(tooltip.formatter([
      { seriesName: 'Nominal wage growth', value: ['2026-05-01', 3.5] },
      { seriesName: 'Headline CPI inflation', value: ['2026-05-01', 4.2] },
    ])).toContain('Real wage growth: −0.6%')
  })
})

describe('createInflationComparisonChartOptions', () => {
  it.each([
    ['year-over-year' as const, 'Headline CPI inflation', 'Core CPI inflation'],
    [
      'household' as const,
      'Real disposable income per capita growth',
      'Real consumer spending growth',
    ],
    [
      'momentum' as const,
      'Headline CPI, 3-month annualized',
      'Core CPI, 3-month annualized',
    ],
  ])('uses aligned distinguishable lines and one zero-inclusive axis for %s', (
    variant,
    headlineName,
    coreName,
  ) => {
    const options = createInflationComparisonChartOptions({
      headlineData: [
        ['2026-04-01', null],
        ['2026-05-01', 4.2],
      ],
      coreData: [
        ['2026-04-01', 2.7],
        ['2026-05-01', 2.8],
      ],
      frequency: 'monthly',
      variant,
    })
    const axis = options.yAxis as YAXisComponentOption
    const minimum = axis.min as (range: { min: number; max: number }) => number
    const series = options.series as unknown as Array<{
      name: string
      data: Array<[string, number | null]>
      connectNulls: boolean
      smooth: boolean
      lineStyle: { type: string }
      markLine?: unknown
      yAxisIndex?: number
    }>

    expect(Array.isArray(options.yAxis)).toBe(false)
    expect(minimum({ min: 2.7, max: 4.2 })).toBe(0)
    expect(series.map((item) => item.name)).toEqual([headlineName, coreName])
    expect(series.map((item) => item.lineStyle.type)).toEqual(['solid', 'dashed'])
    expect(series.every((item) => item.connectNulls === false)).toBe(true)
    expect(series.every((item) => item.smooth === false)).toBe(true)
    expect(series.every((item) => item.yAxisIndex === undefined)).toBe(true)
    expect(series[0]?.data[0]).toEqual(['2026-04-01', null])
    expect(series[0]?.markLine).toBeDefined()
    expect(options.legend).toMatchObject({ data: [headlineName, coreName] })
  })

  it('reports percentage-point differences only for year-over-year inflation', () => {
    const tooltipParams = [
      {
        seriesName: 'Headline CPI inflation',
        value: ['2026-05-01', 4.2],
      },
      { seriesName: 'Core CPI inflation', value: ['2026-05-01', 2.8] },
    ]
    const yearOverYear = createInflationComparisonChartOptions({
      headlineData: [['2026-05-01', 4.2]],
      coreData: [['2026-05-01', 2.8]],
      frequency: 'monthly',
      variant: 'year-over-year',
    })
    const tooltip = yearOverYear.tooltip as {
      formatter: (params: typeof tooltipParams) => string
      renderMode: string
    }
    expect(tooltip.renderMode).toBe('html')
    expect(tooltip.formatter(tooltipParams)).toBe(
      'May 2026\nHeadline CPI inflation: 4.2%\nCore CPI inflation: 2.8%\nDifference: −1.4% percentage points',
    )

    const momentum = createInflationComparisonChartOptions({
      headlineData: [['2026-05-01', 4.2]],
      coreData: [['2026-05-01', 2.8]],
      frequency: 'monthly',
      variant: 'momentum',
    })
    const momentumTooltip = momentum.tooltip as {
      formatter: (params: Array<{ seriesName: string; value: [string, number] }>) => string
    }
    expect(momentumTooltip.formatter([
      { seriesName: 'Headline CPI, 3-month annualized', value: ['2026-05-01', 4.2] },
      { seriesName: 'Core CPI, 3-month annualized', value: ['2026-05-01', 2.8] },
    ])).not.toContain('Difference')
  })

  it('reports spending minus income growth for household comparisons', () => {
    const options = createInflationComparisonChartOptions({
      headlineData: [['2026-05-01', -0.3]],
      coreData: [['2026-05-01', 2.1]],
      frequency: 'monthly',
      variant: 'household',
    })
    const tooltip = options.tooltip as {
      formatter: (params: Array<{ seriesName: string; value: [string, number] }>) => string
    }
    expect(tooltip.formatter([
      { seriesName: 'Real disposable income per capita growth', value: ['2026-05-01', -0.3] },
      { seriesName: 'Real consumer spending growth', value: ['2026-05-01', 2.1] },
    ])).toContain('Spending minus income growth: +2.4% percentage points')
    expect(tooltip.formatter([
      { seriesName: 'Real disposable income per capita growth', value: ['2026-05-01', -0.3] },
      { seriesName: 'Real consumer spending growth', value: ['2026-05-01', 2.1] },
    ])).toContain('Real consumer spending growth: +2.1%')
  })
})
