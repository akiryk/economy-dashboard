import type {
  EChartsCoreOption,
  TooltipComponentFormatterCallbackParams,
} from 'echarts'
import type { ChartDataPoint } from './chartAdapters'
import type { EconomicFrequency } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatEconomicValue,
  formatPercentage,
  formatSignedPercentage,
  formatSignedPercentagePoints,
  type EconomicValueFormat,
} from '../utils/economicSeries'

interface EconomicTimeSeriesChartOptionsInput {
  data: ChartDataPoint[]
  seriesName: string
  frequency: EconomicFrequency
  units: string
  transformation: string
  includeZero: boolean
  valueFormat: EconomicValueFormat
}

interface EconomicComparisonChartOptionsInput {
  nominalData: ChartDataPoint[]
  inflationData: ChartDataPoint[]
  realData: ChartDataPoint[]
  frequency: EconomicFrequency
}

interface InflationComparisonChartOptionsInput {
  headlineData: ChartDataPoint[]
  coreData: ChartDataPoint[]
  frequency: EconomicFrequency
  variant: 'household' | 'momentum' | 'year-over-year'
}

interface ManufacturingComparisonChartOptionsInput {
  outputData: ChartDataPoint[]
  employmentData: ChartDataPoint[]
  frequency: EconomicFrequency
}

interface ValueRange {
  min: number
  max: number
}

function paddedMinimum(range: ValueRange, includeZero: boolean): number {
  const padding = Math.max((range.max - range.min) * 0.1, 0.5)
  const minimum = Math.floor(range.min - padding)
  return includeZero ? Math.min(0, minimum) : minimum
}

function paddedMaximum(range: ValueRange, includeZero: boolean): number {
  const padding = Math.max((range.max - range.min) * 0.1, 0.5)
  const maximum = Math.ceil(range.max + padding)
  return includeZero ? Math.max(0, maximum) : maximum
}

function isChartDataPoint(value: unknown): value is ChartDataPoint {
  return (
    Array.isArray(value) &&
    typeof value[0] === 'string' &&
    (typeof value[1] === 'number' || value[1] === null)
  )
}

function formatTooltip(
  params: TooltipComponentFormatterCallbackParams,
  seriesName: string,
  frequency: EconomicFrequency,
  valueFormat: EconomicValueFormat,
): string {
  const item = Array.isArray(params) ? params[0] : params

  if (!item || !isChartDataPoint(item.value)) return seriesName

  const [date, value] = item.value
  if (valueFormat === 'index') {
    return `${formatObservationPeriod(date, frequency)}\nProductivity index, selected-range baseline = 100: ${formatEconomicValue(value, valueFormat)}\nChange since selected-range start: ${formatSignedPercentage(value === null ? null : value - 100)}`
  }
  if (seriesName === 'Productivity momentum') {
    const direction = value !== null && value < 0 ? 'lower' : 'higher'
    return `${formatObservationPeriod(date, frequency)}\nProductivity was ${formatPercentage(value === null ? null : Math.abs(value))} ${direction} than one year earlier`
  }
  return `${formatObservationPeriod(date, frequency)}\n${seriesName}: ${formatEconomicValue(value, valueFormat)}`
}

export function createEconomicTimeSeriesChartOptions({
  data,
  seriesName,
  frequency,
  units,
  transformation,
  includeZero,
  valueFormat,
}: EconomicTimeSeriesChartOptionsInput): EChartsCoreOption {
  return {
    animation: false,
    aria: {
      enabled: true,
      decal: { show: false },
      description: `${seriesName}, ${frequency}. Transformation: ${transformation}. Units: ${units}. A detailed data table follows the chart.`,
    },
    grid: {
      top: 24,
      right: 18,
      bottom: 42,
      left: 58,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      renderMode: 'html',
      confine: true,
      extraCssText: 'white-space: pre-line;',
      formatter: (params: TooltipComponentFormatterCallbackParams) =>
        formatTooltip(params, seriesName, frequency, valueFormat),
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#56616d', width: 1 },
      },
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#aeb5bc' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#56616d',
        hideOverlap: true,
        formatter: '{yyyy}',
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name:
        valueFormat === 'signed-thousands'
          ? 'Jobs (thousands)'
          : valueFormat === 'thousands-units'
            ? 'Units (thousands, annual rate)'
          : valueFormat === 'index'
            ? 'Index'
            : 'Percent',
      nameLocation: 'end',
      nameTextStyle: { color: '#56616d', align: 'right' },
      min: (range: ValueRange) => paddedMinimum(range, includeZero),
      max: (range: ValueRange) => paddedMaximum(range, includeZero),
      axisLabel: {
        color: '#56616d',
        formatter:
          valueFormat === 'signed-thousands'
            ? '{value}K'
            : valueFormat === 'thousands-units'
              ? '{value}K'
            : valueFormat === 'index'
              ? '{value}'
              : '{value}%',
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#e4e7ea', width: 1 } },
    },
    series: [
      {
        name: seriesName,
        type: 'line',
        data,
        connectNulls: false,
        smooth: false,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#245d72', width: 2.5 },
        itemStyle: { color: '#245d72' },
        emphasis: { focus: 'series' },
        ...(includeZero
          ? {
              markLine: {
                silent: true,
                symbol: 'none',
                label: { show: false },
                lineStyle: { color: '#56616d', width: 1.5, type: 'solid' },
                data: [{ yAxis: 0 }],
              },
            }
          : {}),
      },
    ],
  }
}

export function createEconomicComparisonChartOptions({
  nominalData,
  inflationData,
  realData,
  frequency,
}: EconomicComparisonChartOptionsInput): EChartsCoreOption {
  const realByDate = new Map(realData)
  return {
    animation: false,
    aria: {
      enabled: true,
      decal: { show: true },
      description:
        'Nominal wage growth and headline CPI inflation on one shared percentage axis. A detailed factual summary and data table follow the chart.',
    },
    legend: {
      data: ['Nominal wage growth', 'Headline CPI inflation'],
      bottom: 0,
      textStyle: { color: '#56616d' },
    },
    grid: {
      top: 24,
      right: 18,
      bottom: 72,
      left: 58,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      renderMode: 'html',
      confine: true,
      extraCssText: 'white-space: pre-line;',
      formatter: (params: TooltipComponentFormatterCallbackParams) => {
        const items = Array.isArray(params) ? params : [params]
        const first = items.find((item) => isChartDataPoint(item.value))
        if (!first || !isChartDataPoint(first.value)) return 'Wages versus inflation'
        const date = first.value[0]
        const values = new Map(
          items
            .filter((item) => isChartDataPoint(item.value))
            .map((item) => [item.seriesName, (item.value as ChartDataPoint)[1]]),
        )
        return [
          formatObservationPeriod(date, frequency),
          `Nominal wage growth: ${formatPercentage(values.get('Nominal wage growth') ?? null)}`,
          `Headline CPI inflation: ${formatPercentage(values.get('Headline CPI inflation') ?? null)}`,
          `Real wage growth: ${formatSignedPercentage(realByDate.get(date) ?? null)}`,
        ].join('\n')
      },
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#56616d', width: 1 },
      },
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#aeb5bc' } },
      axisTick: { show: false },
      axisLabel: { color: '#56616d', hideOverlap: true, formatter: '{yyyy}' },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Percent',
      nameLocation: 'end',
      nameTextStyle: { color: '#56616d', align: 'right' },
      min: (range: ValueRange) => paddedMinimum(range, true),
      max: (range: ValueRange) => paddedMaximum(range, true),
      axisLabel: { color: '#56616d', formatter: '{value}%' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#e4e7ea', width: 1 } },
    },
    series: [
      {
        name: 'Nominal wage growth',
        type: 'line',
        data: nominalData,
        connectNulls: false,
        smooth: false,
        showSymbol: false,
        lineStyle: { color: '#245d72', width: 2.5, type: 'solid' },
        itemStyle: { color: '#245d72' },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: '#56616d', width: 1.5, type: 'solid' },
          data: [{ yAxis: 0 }],
        },
      },
      {
        name: 'Headline CPI inflation',
        type: 'line',
        data: inflationData,
        connectNulls: false,
        smooth: false,
        showSymbol: false,
        lineStyle: { color: '#8a4f2d', width: 2.5, type: 'dashed' },
        itemStyle: { color: '#8a4f2d' },
      },
    ],
  }
}

export function createInflationComparisonChartOptions({
  headlineData,
  coreData,
  frequency,
  variant,
}: InflationComparisonChartOptionsInput): EChartsCoreOption {
  const momentum = variant === 'momentum'
  const household = variant === 'household'
  const headlineName = household
    ? 'Real disposable income per person growth'
    : momentum
    ? 'Headline CPI, 3-month annualized'
    : 'Headline CPI inflation'
  const coreName = household
    ? 'Real consumer spending per person growth'
    : momentum
    ? 'Core CPI, 3-month annualized'
    : 'Core CPI inflation'
  return {
    animation: false,
    aria: {
      enabled: true,
      decal: { show: true },
      description: `${headlineName} and ${coreName} on one shared percentage axis. A factual summary and detailed data table follow the chart.`,
    },
    legend: {
      data: [headlineName, coreName],
      bottom: 0,
      textStyle: { color: '#56616d' },
    },
    grid: {
      top: 24,
      right: 18,
      bottom: 72,
      left: 58,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      renderMode: 'html',
      confine: true,
      extraCssText: 'white-space: pre-line;',
      formatter: (params: TooltipComponentFormatterCallbackParams) => {
        const items = Array.isArray(params) ? params : [params]
        const first = items.find((item) => isChartDataPoint(item.value))
        if (!first || !isChartDataPoint(first.value)) return household ? 'Income versus spending' : 'Inflation comparison'
        const date = first.value[0]
        const values = new Map(
          items
            .filter((item) => isChartDataPoint(item.value))
            .map((item) => [item.seriesName, (item.value as ChartDataPoint)[1]]),
        )
        const headline = values.get(headlineName) ?? null
        const core = values.get(coreName) ?? null
        const lines = [
          formatObservationPeriod(date, frequency),
          `${headlineName}: ${household ? `${formatSignedPercentage(headline)} from a year earlier` : formatPercentage(headline)}`,
          `${coreName}: ${household ? `${formatSignedPercentage(core)} from a year earlier` : formatPercentage(core)}`,
        ]
        if (!momentum) {
          const difference =
            headline !== null && core !== null ? core - headline : null
          lines.push(
            `${household ? 'Spending minus income growth' : 'Difference'}: ${household ? formatSignedPercentagePoints(difference) : formatSignedPercentage(difference)} percentage points`,
          )
        }
        return lines.join('\n')
      },
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#56616d', width: 1 },
      },
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#aeb5bc' } },
      axisTick: { show: false },
      axisLabel: { color: '#56616d', hideOverlap: true, formatter: '{yyyy}' },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Percent',
      nameLocation: 'end',
      nameTextStyle: { color: '#56616d', align: 'right' },
      min: (range: ValueRange) => paddedMinimum(range, true),
      max: (range: ValueRange) => paddedMaximum(range, true),
      axisLabel: { color: '#56616d', formatter: '{value}%' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#e4e7ea', width: 1 } },
    },
    series: [
      {
        name: headlineName,
        type: 'line',
        data: headlineData,
        connectNulls: false,
        smooth: false,
        showSymbol: false,
        lineStyle: { color: '#245d72', width: 2.5, type: 'solid' },
        itemStyle: { color: '#245d72' },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: '#56616d', width: 1.5, type: 'solid' },
          data: [{ yAxis: 0 }],
        },
      },
      {
        name: coreName,
        type: 'line',
        data: coreData,
        connectNulls: false,
        smooth: false,
        showSymbol: false,
        lineStyle: { color: '#8a4f2d', width: 2.5, type: 'dashed' },
        itemStyle: { color: '#8a4f2d' },
      },
    ],
  }
}

export function createManufacturingComparisonChartOptions({
  outputData,
  employmentData,
  frequency,
}: ManufacturingComparisonChartOptionsInput): EChartsCoreOption {
  return {
    animation: false,
    aria: { enabled: true, decal: { show: true }, description: 'Manufacturing output and manufacturing employment, each normalized to 100 at the selected-range baseline, on one shared axis. A factual summary and detailed table follow.' },
    legend: { data: ['Manufacturing output', 'Manufacturing employment'], bottom: 0, textStyle: { color: '#56616d' } },
    grid: { top: 24, right: 18, bottom: 72, left: 58, containLabel: false },
    tooltip: {
      trigger: 'axis', renderMode: 'html', confine: true, extraCssText: 'white-space: pre-line;',
      formatter: (params: TooltipComponentFormatterCallbackParams) => {
        const items = Array.isArray(params) ? params : [params]
        const first = items.find((item) => isChartDataPoint(item.value))
        if (!first || !isChartDataPoint(first.value)) return 'Manufacturing comparison'
        const date = first.value[0]
        const values = new Map(items.filter((item) => isChartDataPoint(item.value)).map((item) => [item.seriesName, (item.value as ChartDataPoint)[1]]))
        const output = values.get('Manufacturing output') ?? null
        const employment = values.get('Manufacturing employment') ?? null
        return [
          formatObservationPeriod(date, frequency),
          `Manufacturing output index: ${output?.toFixed(1) ?? 'Not available'} (${formatSignedPercentage(output === null ? null : output - 100)} since baseline)`,
          `Manufacturing employment index: ${employment?.toFixed(1) ?? 'Not available'} (${formatSignedPercentage(employment === null ? null : employment - 100)} since baseline)`,
        ].join('\n')
      },
      axisPointer: { type: 'line', lineStyle: { color: '#56616d', width: 1 } },
    },
    xAxis: { type: 'time', boundaryGap: false, axisLine: { lineStyle: { color: '#aeb5bc' } }, axisTick: { show: false }, axisLabel: { color: '#56616d', hideOverlap: true, formatter: '{yyyy}' }, splitLine: { show: false } },
    yAxis: { type: 'value', name: 'Selected-range baseline = 100', nameLocation: 'end', nameTextStyle: { color: '#56616d', align: 'right' }, min: (range: ValueRange) => paddedMinimum(range, false), max: (range: ValueRange) => paddedMaximum(range, false), axisLabel: { color: '#56616d', formatter: '{value}' }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#e4e7ea', width: 1 } } },
    series: [
      { name: 'Manufacturing output', type: 'line', data: outputData, connectNulls: false, smooth: false, showSymbol: false, lineStyle: { color: '#245d72', width: 2.5, type: 'solid' }, itemStyle: { color: '#245d72' }, markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#56616d', width: 1.5, type: 'solid' }, data: [{ yAxis: 100 }] } },
      { name: 'Manufacturing employment', type: 'line', data: employmentData, connectNulls: false, smooth: false, showSymbol: false, lineStyle: { color: '#8a4f2d', width: 2.5, type: 'dashed' }, itemStyle: { color: '#8a4f2d' } },
    ],
  }
}
