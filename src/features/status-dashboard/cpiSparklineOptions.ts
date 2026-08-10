import type { EconomicObservation } from '../economic-series/models/economicSeries'
import type { DashboardThresholdState } from './cpiTileModel'

const themeColors = {
  light: { 'notable-good': '#047857', normal: '#71717a', 'notable-bad': '#b45309' },
  dark: { 'notable-good': '#34d399', normal: '#8a8a93', 'notable-bad': '#f5a524' },
}

export function createCpiSparklineOptions(
  observations: readonly EconomicObservation[],
  state: DashboardThresholdState,
  theme: 'light' | 'dark' = 'light',
) {
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
      lineStyle: { color: themeColors[theme][state], width: 1.5 },
      areaStyle: undefined,
    }],
  }
}
