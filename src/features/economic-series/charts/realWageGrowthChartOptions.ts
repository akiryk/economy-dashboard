import type { EChartsCoreOption } from 'echarts/core'
import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'
import {
  compactChartTheme,
  compactReferenceLineTheme,
} from './compactChartTheme'

export function createRealWageGrowthChartOptions({
  observations,
  domain,
  activeObservation = null,
}: {
  observations: readonly EconomicObservation[]
  domain: readonly [number, number]
  activeObservation?: EconomicObservation | null
}): EChartsCoreOption {
  const latest = [...observations].reverse()
    .find(({ value }) => value !== null && Number.isFinite(value))
  return {
    animation: false,
    grid: { left: 4, right: 6, top: 7, bottom: 7, containLabel: false },
    tooltip: { show: false },
    xAxis: { type: 'time', show: false, boundaryGap: false },
    yAxis: { type: 'value', show: false, min: domain[0], max: domain[1] },
    series: [{
      name: 'Real wage growth',
      type: 'line',
      data: observations.map(({ date, value }) => [date, value]),
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
          {
            name: 'Equal wage and price growth',
            yAxis: 0,
            lineStyle: {
              color: compactReferenceLineTheme.color,
              width: compactReferenceLineTheme.width,
              type: compactReferenceLineTheme.type,
              opacity: compactReferenceLineTheme.opacity,
            },
          },
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
        symbolSize: 8,
        data: [
          ...(latest ? [{
            name: 'Latest observation',
            coord: [latest.date, latest.value],
          }] : []),
          ...(activeObservation ? [{
            name: 'Active observation',
            coord: [activeObservation.date, activeObservation.value],
            symbolSize: 10,
          }] : []),
        ],
      } : undefined,
    }],
  }
}

export function formatRealWageGrowthTooltip(
  observation: EconomicObservation,
): string {
  if (observation.value === null) return ''
  return `Real wage growth\n` +
    `${formatObservationPeriod(observation.date, 'monthly')}\n` +
    formatSignedPercentage(observation.value)
}
