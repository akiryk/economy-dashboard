import type { EconomicObservation } from '../economic-series/models/economicSeries'
import type { DashboardThresholdState } from './cpiTileModel'

const themeColors = {
  light: {
    border: '#e4e4e7',
    'notable-good': '#047857', normal: '#71717a', 'notable-bad': '#b45309',
  },
  dark: {
    border: '#26262a',
    'notable-good': '#34d399', normal: '#8a8a93', 'notable-bad': '#f5a524',
  },
}

export interface DashboardSparklineReference {
  value: number
  label: string
}

export function createDashboardSparklineOptions(
  observations: readonly EconomicObservation[],
  state: DashboardThresholdState,
  theme: 'light' | 'dark' = 'light',
  reference?: DashboardSparklineReference,
) {
  const colors = themeColors[theme]
  return {
    animation: false,
    aria: { enabled: false },
    grid: { left: 1, right: 1, top: 2, bottom: 2 },
    xAxis: {
      type: 'category' as const,
      show: false,
      boundaryGap: false,
      data: observations.map(({ date }) => date),
    },
    yAxis: {
      type: 'value' as const,
      show: false,
      scale: true,
    },
    series: [{
      type: 'line' as const,
      data: observations.map(({ value }) => value),
      showSymbol: false,
      connectNulls: false,
      smooth: false,
      silent: true,
      lineStyle: { color: colors[state], width: 1.5 },
      areaStyle: undefined,
      markLine: reference
        ? {
            silent: true,
            symbol: 'none',
            label: { show: false },
            lineStyle: { color: colors.border, width: 1, type: 'dashed' },
            data: [{ yAxis: reference.value, name: reference.label }],
          }
        : undefined,
    }],
  }
}
