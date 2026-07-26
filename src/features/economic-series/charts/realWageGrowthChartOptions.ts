import type { EChartsCoreOption } from 'echarts/core'
import type { EconomicObservation } from '../models/economicSeries'
import type { HistoricalBandResult } from '../utils/historicalBandContext'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'
import {
  compactChartTheme,
} from './compactChartTheme'

export function createRealWageGrowthChartOptions({
  observations,
  domain,
  historicalBands = null,
  activeObservation = null,
}: {
  observations: readonly EconomicObservation[]
  domain: readonly [number, number]
  historicalBands?: HistoricalBandResult | null
  activeObservation?: EconomicObservation | null
}): EChartsCoreOption {
  const latest = [...observations].reverse()
    .find(({ value }) => value !== null && Number.isFinite(value))
  const readyBands = historicalBands?.status === 'ready'
    ? historicalBands
    : null
  const anchors = readyBands
    ? [domain[0], domain[1], readyBands.outerLower, readyBands.outerUpper]
    : [...domain]
  const minimum = Math.min(...anchors)
  const maximum = Math.max(...anchors)
  const padding = readyBands
    ? Math.max((maximum - minimum) * 0.08, 0.1)
    : 0
  return {
    animation: false,
    grid: { left: 4, right: 6, top: 7, bottom: 7, containLabel: false },
    tooltip: { show: false },
    xAxis: { type: 'time', show: false, boundaryGap: false },
    yAxis: {
      type: 'value',
      show: false,
      min: minimum - padding,
      max: maximum + padding,
    },
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
      z: 3,
      markArea: readyBands ? {
        silent: true,
        label: { show: false },
        data: [
          [
            {
              name: 'Historical middle 80 percent',
              yAxis: readyBands.outerLower,
              itemStyle: { color: compactChartTheme.outerBandFill },
            },
            { yAxis: readyBands.outerUpper },
          ],
          [
            {
              name: 'Historical middle 50 percent',
              yAxis: readyBands.innerLower,
              itemStyle: { color: compactChartTheme.innerBandFill },
            },
            { yAxis: readyBands.innerUpper },
          ],
        ],
      } : undefined,
      markLine: {
        silent: true,
        symbol: 'none',
        label: { show: false },
        data: [
          {
            name: 'Equal wage and price growth',
            yAxis: 0,
            lineStyle: {
              color: compactChartTheme.zeroLine,
              width: 1.5,
              type: 'dashed',
              opacity: 1,
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
