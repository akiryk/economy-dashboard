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
}: EconomicTimeSeriesChartOptionsInput): EChartsCoreOption {
  return {
    animation: false,
    aria: {
      enabled: true,
      decal: { show: false },
      description: `${seriesName}, ${frequency} percent change from one year ago. A detailed data table follows the chart.`,
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
      min: (range: { min: number }) => Math.min(0, Math.floor(range.min - 1)),
      max: (range: { max: number }) => Math.max(0, Math.ceil(range.max + 1)),
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
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: '#56616d', width: 1.5, type: 'solid' },
          data: [{ yAxis: 0 }],
        },
      },
    ],
  }
}
