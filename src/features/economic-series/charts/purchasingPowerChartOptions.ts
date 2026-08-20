import type { EChartsCoreOption } from 'echarts/core'
import type { EconomicObservation } from '../models/economicSeries'
import { compactChartTheme } from './compactChartTheme'

export function createPurchasingPowerChartOptions(
  observations: readonly EconomicObservation[],
  active: EconomicObservation | null,
): EChartsCoreOption {
  const values = observations.flatMap(({ value }) => value === null ? [] : [value])
  const latest = [...observations].reverse().find(({ value }) => value !== null)
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(0, ...values)
  const padding = Math.max((maximum - minimum) * 0.08, 0.25)
  return {
    animation: false,
    grid: { left: 5, right: 7, top: 8, bottom: 8 },
    tooltip: { show: false },
    xAxis: { type: 'time', show: false, boundaryGap: false },
    yAxis: { type: 'value', show: false, min: minimum - padding, max: maximum + padding },
    series: [{
      name: 'Purchasing-power change', type: 'line', connectNulls: false, smooth: false,
      showSymbol: false, symbol: 'circle', data: observations.map(({ date, value }) => [date, value]),
      lineStyle: { color: compactChartTheme.line, width: 2 },
      itemStyle: { color: compactChartTheme.latestMarker, borderColor: compactChartTheme.markerBorder, borderWidth: 1.5 },
      markLine: { silent: true, symbol: 'none', label: { show: false }, data: [
        { name: 'No change', yAxis: 0, lineStyle: { color: compactChartTheme.zeroLine, width: 1.5, type: 'dashed' } },
        ...(active ? [{ name: 'Selected month', xAxis: active.date, lineStyle: { color: compactChartTheme.zeroLine, width: 1, type: 'solid' } }] : []),
      ] },
      markPoint: { silent: true, label: { show: false }, symbol: 'circle', symbolSize: 8, data: [
        ...(latest ? [{ name: 'Latest observation', coord: [latest.date, latest.value] }] : []),
        ...(active ? [{ name: 'Selected observation', coord: [active.date, active.value], symbolSize: 10 }] : []),
      ] },
    }],
  }
}
