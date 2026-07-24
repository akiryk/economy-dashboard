import type { EChartsCoreOption } from 'echarts/core'
import type { CategoryInflationTrend } from '../utils/inflationCategoryTrends'
import { compactChartTheme } from './compactChartTheme'

export function createInflationCategoryTrendChartOptions(
  trend: CategoryInflationTrend,
  sharedDomain: readonly [number, number],
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
      min: sharedDomain[0],
      max: sharedDomain[1],
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
        data: [{
          name: 'Zero percent',
          yAxis: 0,
          lineStyle: {
            color: compactChartTheme.zeroLine,
            width: 1,
            type: 'dashed',
          },
        }],
      },
      markPoint: latest ? {
        silent: true,
        label: { show: false },
        symbol: 'circle',
        symbolSize: 7,
        data: [{ name: 'Latest observation', coord: [latest.date, latest.value] }],
      } : undefined,
    }],
  }
}
