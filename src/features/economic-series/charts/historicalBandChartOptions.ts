import type { EChartsCoreOption } from 'echarts/core'
import type { EconomicFrequency } from '../models/economicSeries'
import type { HistoricalBandModel } from '../utils/historicalBandContext'
import { formatObservationPeriod } from '../utils/economicSeries'
import { compactChartTheme } from './compactChartTheme'
import { sharedChartTooltip } from './sharedChartTooltip'

export interface HistoricalBandChartOptionsInput {
  model: HistoricalBandModel
  seriesLabel: string
  frequency: EconomicFrequency
  valueFormatter: (value: number | null) => string
  latestPositionDescription: string
  showZeroLine: boolean
  showLatestMarker: boolean
  showAllObservationMarkers?: boolean
  cursor?: 'crosshair' | 'pointer'
  showTooltip?: boolean
  referenceLines?: readonly { value: number; label: string }[]
}

export function calculateHistoricalBandYDomain(
  model: Pick<
    HistoricalBandModel,
    'recentObservations' | 'outerLower' | 'outerUpper'
  >,
  includeZero: boolean,
  referenceValues: readonly number[] = [],
): { min: number; max: number } {
  const values = model.recentObservations.flatMap(({ value }) =>
    value === null ? [] : [value],
  )
  const anchors = [
    model.outerLower,
    model.outerUpper,
    ...values,
    ...referenceValues,
  ]
  if (includeZero) anchors.push(0)
  const minimum = Math.min(...anchors)
  const maximum = Math.max(...anchors)
  const span = maximum - minimum
  const padding = Math.max(span * 0.08, 0.25)
  return { min: minimum - padding, max: maximum + padding }
}

export function createHistoricalBandChartOptions({
  model,
  seriesLabel,
  frequency,
  valueFormatter,
  latestPositionDescription,
  showZeroLine,
  showLatestMarker,
  showAllObservationMarkers = false,
  cursor,
  showTooltip = true,
  referenceLines = [],
}: HistoricalBandChartOptionsInput): EChartsCoreOption {
  const domain = calculateHistoricalBandYDomain(
    model,
    showZeroLine,
    referenceLines.map(({ value }) => value),
  )
  return {
    animation: false,
    grid: { left: 2, right: 2, top: 4, bottom: 4, containLabel: false },
    tooltip: showTooltip ? {
      ...sharedChartTooltip,
      formatter: (parameters: unknown) => {
        const item = (Array.isArray(parameters) ? parameters[0] : parameters) as
          | { value?: [string, number | null] }
          | undefined
        const [date, value] = item?.value ?? []
        if (!date) return ''
        const latestNote = date === model.latestObservation.date
          ? `\nLatest position: ${latestPositionDescription}`
          : ''
        return `${formatObservationPeriod(date, frequency)}\n${seriesLabel}: ${valueFormatter(value ?? null)}${latestNote}`
      },
    } : { show: false },
    xAxis: {
      type: 'time', show: false, boundaryGap: false,
      axisLabel: { show: false }, axisLine: { show: false },
      axisTick: { show: false }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', show: false, min: domain.min, max: domain.max,
      axisLabel: { show: false }, axisLine: { show: false },
      axisTick: { show: false }, splitLine: { show: false },
    },
    series: [{
      name: seriesLabel,
      type: 'line',
      data: model.recentObservations.map(({ date, value }) => [date, value]),
      connectNulls: false,
      smooth: false,
      showSymbol: showAllObservationMarkers,
      symbol: 'circle',
      symbolSize: 5,
      cursor,
      lineStyle: { color: compactChartTheme.line, width: 2.5 },
      itemStyle: {
        color: compactChartTheme.latestMarker,
        borderColor: compactChartTheme.markerBorder,
        borderWidth: 1.5,
      },
      markArea: {
        silent: true,
        label: { show: false },
        data: [
          [
            {
              name: 'Historical outer percentile band',
              yAxis: model.outerLower,
              itemStyle: { color: compactChartTheme.outerBandFill },
            },
            { yAxis: model.outerUpper },
          ],
          [
            {
              name: 'Historical inner percentile band',
              yAxis: model.innerLower,
              itemStyle: { color: compactChartTheme.innerBandFill },
            },
            { yAxis: model.innerUpper },
          ],
        ],
      },
      markLine: showZeroLine || referenceLines.length > 0 ? {
        silent: true, symbol: 'none', label: { show: false },
        data: [
          ...(showZeroLine ? [{
            name: 'Zero',
            yAxis: 0,
            lineStyle: {
              color: compactChartTheme.zeroLine,
              width: 1.25,
              type: 'dashed' as const,
            },
          }] : []),
          ...referenceLines.map(({ value, label }) => ({
            name: label,
            yAxis: value,
            lineStyle: {
              color: compactChartTheme.policyReference,
              width: 1,
              type: 'solid' as const,
            },
          })),
        ],
      } : undefined,
      markPoint: showLatestMarker ? {
        silent: true, label: { show: false }, symbol: 'circle', symbolSize: 8,
        data: [{
          name: 'Latest observation',
          coord: [model.latestObservation.date, model.latestObservation.value],
        }],
      } : undefined,
    }],
  }
}
