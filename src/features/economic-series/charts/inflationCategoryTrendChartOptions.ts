import type { EChartsCoreOption } from 'echarts/core'
import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'
import type { CategoryInflationTrend } from '../utils/inflationCategoryTrends'
import { compactChartTheme } from './compactChartTheme'

export function createInflationCategoryTrendChartOptions(
  trend: CategoryInflationTrend,
  activeObservation: EconomicObservation | null = null,
): EChartsCoreOption {
  const latest = [...trend.observations].reverse()
    .find(({ value }) => value !== null && Number.isFinite(value))
  return {
    animation: false,
    grid: { left: 2, right: 5, top: 5, bottom: 5, containLabel: false },
    tooltip: { show: false },
    xAxis: { type: 'time', show: false, boundaryGap: false },
    yAxis: {
      type: 'value',
      show: false,
      min: trend.domain.min,
      max: trend.domain.max,
    },
    series: [{
      name: trend.label,
      type: 'line',
      data: trend.observations.map(({ date, value }) => [date, value]),
      connectNulls: false,
      smooth: false,
      showSymbol: false,
      symbol: 'circle',
      lineStyle: { color: compactChartTheme.line, width: 2 },
      itemStyle: {
        color: compactChartTheme.latestMarker,
        borderColor: compactChartTheme.markerBorder,
        borderWidth: 1.5,
      },
      markLine: {
        silent: true,
        symbol: 'none',
        label: { show: false },
        data: [
          ...(trend.domain.includesZero ? [{
            name: 'Zero percent',
            yAxis: 0,
            lineStyle: {
              color: compactChartTheme.zeroLine,
              width: 1,
              type: 'dashed',
            },
          }] : []),
          ...(activeObservation ? [{
            name: 'Active observation',
            xAxis: activeObservation.date,
            lineStyle: {
              color: compactChartTheme.zeroLine,
              width: 1,
              type: 'solid',
            },
          }] : []),
        ],
      },
      markPoint: latest || activeObservation ? {
        silent: true,
        label: { show: false },
        symbol: 'circle',
        symbolSize: 7,
        data: [
          ...(latest ? [{
            name: 'Latest observation',
            coord: [latest.date, latest.value],
          }] : []),
          ...(activeObservation ? [{
            name: 'Active observation',
            coord: [activeObservation.date, activeObservation.value],
            symbolSize: 9,
          }] : []),
        ],
      } : undefined,
    }],
  }
}

export function formatCategoryInflationTooltip(
  trend: Pick<CategoryInflationTrend, 'label'>,
  observation: EconomicObservation,
): string {
  if (observation.value === null) return ''
  return `${trend.label} inflation\n` +
    `${formatObservationPeriod(observation.date, 'monthly')}\n` +
    formatSignedPercentage(observation.value)
}
