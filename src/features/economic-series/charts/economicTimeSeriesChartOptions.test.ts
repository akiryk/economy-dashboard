import { describe, expect, it } from 'vitest'
import type { YAXisComponentOption } from 'echarts'
import {
  createEconomicComparisonChartOptions,
  createEconomicTimeSeriesChartOptions,
  createInflationComparisonChartOptions,
  createManufacturingComparisonChartOptions,
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
  it('uses the shared non-interactive browser tooltip', () => {
    const options = createEconomicTimeSeriesChartOptions({
      data: [['2026-01-01', 2.5]],
      seriesName: 'Real GDP growth',
      frequency: 'quarterly',
      units: 'Percent',
      transformation: 'Percent change from one year earlier',
      includeZero: true,
      valueFormat: 'percentage',
    })

    expect(options.tooltip).toMatchObject({
      trigger: 'axis',
      renderMode: 'html',
      confine: true,
      enterable: false,
      extraCssText: expect.stringContaining('pointer-events: none'),
    })
  })

  it('uses only a zero reference line for signed lending standards', () => {
    const options = createEconomicTimeSeriesChartOptions({
      data: [['2026-01-01', -5], ['2026-04-01', 8.1]],
      seriesName: 'Bank lending standards',
      frequency: 'quarterly',
      units: 'Net percent reporting tighter standards',
      transformation: 'Provider-published net percentage',
      includeZero: true,
      valueFormat: 'signed-percentage',
    })
    const series = (options.series as Array<{ markArea?: unknown; markLine?: { data: unknown[] }; smooth: boolean; connectNulls: boolean }>)[0]!

    expect(series.markLine?.data).toEqual([{ yAxis: 0 }])
    expect(series.markArea).toBeUndefined()
    expect(series.smooth).toBe(false)
    expect(series.connectNulls).toBe(false)
  })

  it('adds the same visible two-handle dataZoom slider to compatible charts', () => {
    const chartOptions = createEconomicTimeSeriesChartOptions({
      data: [['2024-01-01', 1], ['2024-03-01', 2]],
      seriesName: 'Test series',
      frequency: 'monthly',
      units: 'Percent',
      transformation: 'Level',
      includeZero: false,
      valueFormat: 'percentage',
    })
    expect(chartOptions.dataZoom).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'slider', startValue: '2024-01-01', endValue: '2024-03-01' }),
    ]))
  })
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

  it('renders normalized productivity as an index without a zero line', () => {
    const options = createEconomicTimeSeriesChartOptions({
      data: [['2026-01-01', 114.2]],
      seriesName: 'Productivity index, selected-range baseline = 100',
      frequency: 'quarterly',
      units: 'Index',
      transformation: 'Published level normalized for display',
      includeZero: false,
      valueFormat: 'index',
    })
    const axis = options.yAxis as YAXisComponentOption
    const series = (options.series as unknown as Array<{ markLine?: unknown }>)[0]
    const tooltip = options.tooltip as {
      formatter: (params: { value: [string, number] }) => string
    }
    expect(axis.name).toBe('Index')
    expect(series?.markLine).toBeUndefined()
    expect(tooltip.formatter({ value: ['2026-01-01', 114.2] })).toBe(
      '2026 Q1\nProductivity index, selected-range baseline = 100: 114.2\nChange since selected-range start: +14.2%',
    )
  })

  it('identifies housing starts as an annualized thousands level', () => {
    const options = createEconomicTimeSeriesChartOptions({
      data: [['2026-05-01', 1177]],
      seriesName: 'Housing starts',
      frequency: 'monthly',
      units: 'Thousands of units, seasonally adjusted annual rate',
      transformation: 'Level',
      includeZero: false,
      valueFormat: 'thousands-units',
    })
    const axis = options.yAxis as YAXisComponentOption
    const tooltip = options.tooltip as {
      formatter: (params: { value: [string, number] }) => string
    }

    expect(axis.name).toBe('Units (thousands, annual rate)')
    expect(axis.axisLabel).toMatchObject({ formatter: '{value}K' })
    expect(tooltip.formatter({ value: ['2026-05-01', 1177] })).toBe(
      'May 2026\nHousing starts: 1,177K',
    )
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

describe('createManufacturingComparisonChartOptions', () => {
  it('uses one normalized axis, a 100 reference line, solid output, dashed employment, and baseline-aware tooltip', () => {
    const options = createManufacturingComparisonChartOptions({
      outputData: [['2026-05-01', 110]],
      employmentData: [['2026-05-01', 90]],
      frequency: 'monthly',
    })
    const axis = options.yAxis as YAXisComponentOption
    const series = options.series as unknown as Array<{ name: string; lineStyle: { type: string }; markLine?: { data: Array<{ yAxis: number }> } }>
    const tooltip = options.tooltip as { formatter: (params: Array<{ seriesName: string; value: [string, number] }>) => string }

    expect(Array.isArray(options.yAxis)).toBe(false)
    expect(axis.name).toBe('Selected-range baseline = 100')
    expect(series.map((item) => item.name)).toEqual(['Manufacturing output', 'Manufacturing employment'])
    expect(series.map((item) => item.lineStyle.type)).toEqual(['solid', 'dashed'])
    expect(series[0]?.markLine?.data).toEqual([{ yAxis: 100 }])
    expect(series[1]?.markLine).toBeUndefined()
    expect(tooltip.formatter([
      { seriesName: 'Manufacturing output', value: ['2026-05-01', 110] },
      { seriesName: 'Manufacturing employment', value: ['2026-05-01', 90] },
    ])).toContain('Manufacturing employment index: 90.0 (−10.0% since baseline)')
  })
})

describe('createInflationComparisonChartOptions', () => {
  it.each([
    ['year-over-year' as const, 'Headline CPI inflation', 'Core CPI inflation'],
    [
      'household' as const,
      'Real disposable income per person growth',
      'Real consumer spending per person growth',
    ],
    [
      'momentum' as const,
      'Headline CPI, 3-month annualized',
      'Core CPI, 3-month annualized',
    ],
    [
      'cpi-pce' as const,
      'CPI — consumer-facing inflation',
      'PCE — Fed’s preferred inflation measure',
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

  it('renders CPI as primary, PCE as secondary, and the target on one axis', () => {
    const options = createInflationComparisonChartOptions({
      headlineData: [['2026-05-01', 3.5]],
      coreData: [['2026-05-01', 2.8]],
      frequency: 'monthly',
      variant: 'cpi-pce',
    })
    const series = options.series as unknown as Array<{
      name: string
      lineStyle: { width: number }
      markLine?: { data: Array<{ name: string; yAxis: number }> }
      yAxisIndex?: number
    }>
    expect(Array.isArray(options.yAxis)).toBe(false)
    expect(series[0]?.lineStyle.width).toBeGreaterThan(series[1]!.lineStyle.width)
    expect(series[0]?.markLine?.data).toContainEqual(expect.objectContaining({
      name: '2% Fed target for PCE',
      yAxis: 2,
    }))
    expect(series.every(({ yAxisIndex }) => yAxisIndex === undefined)).toBe(true)
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
      headlineData: [['2026-01-01', -0.3]],
      coreData: [['2026-01-01', 2.1]],
      frequency: 'quarterly',
      variant: 'household',
    })
    const tooltip = options.tooltip as {
      formatter: (params: Array<{ seriesName: string; value: [string, number] }>) => string
    }
    expect(tooltip.formatter([
      { seriesName: 'Real disposable income per person growth', value: ['2026-01-01', -0.3] },
      { seriesName: 'Real consumer spending per person growth', value: ['2026-01-01', 2.1] },
    ])).toContain('Spending minus income growth: +2.4 percentage points')
    expect(tooltip.formatter([
      { seriesName: 'Real disposable income per person growth', value: ['2026-01-01', -0.3] },
      { seriesName: 'Real consumer spending per person growth', value: ['2026-01-01', 2.1] },
    ])).toContain('Real consumer spending per person growth: +2.1% from a year earlier')
  })

  it('renders claims as unsmoothed exact-date lines on one integer axis', () => {
    const options = createInflationComparisonChartOptions({
      headlineData: [['2026-07-11', 214_250]],
      coreData: [['2026-07-11', 208_000]],
      frequency: 'weekly',
      variant: 'claims',
    })
    const series = options.series as unknown as Array<{
      name: string
      connectNulls: boolean
      smooth: boolean
      lineStyle: { width: number; type: string }
      markLine?: unknown
    }>
    const tooltip = options.tooltip as {
      formatter: (params: Array<{ seriesName: string; value: [string, number] }>) => string
    }
    const axis = options.yAxis as YAXisComponentOption
    const minimum = axis.min as (range: { min: number; max: number }) => number

    expect(options.yAxis).toMatchObject({ name: 'Claims' })
    expect(minimum({ min: 200_000, max: 6_000_000 })).toBe(0)
    expect(series.map((item) => item.name)).toEqual([
      'Four-week average',
      'Weekly initial claims',
    ])
    expect(series.map((item) => item.lineStyle)).toEqual([
      expect.objectContaining({ width: 2.5, type: 'solid' }),
      expect.objectContaining({ width: 1.5, type: 'dashed' }),
    ])
    expect(series.every((item) => !item.connectNulls && !item.smooth)).toBe(true)
    expect(series[0]?.markLine).toBeUndefined()
    expect(tooltip.formatter([
      { seriesName: 'Four-week average', value: ['2026-07-11', 214_250] },
      { seriesName: 'Weekly initial claims', value: ['2026-07-11', 208_000] },
    ])).toBe(
      'Week of Jul 11, 2026\nFour-week average: 214,250\nWeekly initial claims: 208,000',
    )
  })
})
