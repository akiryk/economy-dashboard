import type {
  EChartsCoreOption,
  TooltipComponentFormatterCallbackParams,
} from 'echarts'
import type { ChartDataPoint } from './chartAdapters'
import type { EconomicFrequency } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
} from '../utils/economicSeries'

interface EconomicTimeSeriesChartOptionsInput {
  data: ChartDataPoint[]
  seriesName: string
  frequency: EconomicFrequency
  units: string
  transformation: string
  includeZero: boolean
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
): string {
  const item = Array.isArray(params) ? params[0] : params

  if (!item || !isChartDataPoint(item.value)) return seriesName

  const [date, value] = item.value
  return `${formatObservationPeriod(date, frequency)}\n${seriesName}: ${formatPercentage(value)}`
}

export function createEconomicTimeSeriesChartOptions({
  data,
  seriesName,
  frequency,
  units,
  transformation,
  includeZero,
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
      renderMode: 'richText',
      confine: true,
      formatter: (params: TooltipComponentFormatterCallbackParams) =>
        formatTooltip(params, seriesName, frequency),
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
      name: 'Percent',
      nameLocation: 'end',
      nameTextStyle: { color: '#56616d', align: 'right' },
      min: (range: ValueRange) => paddedMinimum(range, includeZero),
      max: (range: ValueRange) => paddedMaximum(range, includeZero),
      axisLabel: {
        color: '#56616d',
        formatter: '{value}%',
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
