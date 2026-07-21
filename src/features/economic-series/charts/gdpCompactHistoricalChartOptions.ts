import type { EChartsCoreOption } from 'echarts/core'
import type { CompactGdpHistoricalContext, GdpHistoricalPosition } from '../utils/gdpCompactHistoricalContext'
import { formatObservationPeriod, formatPercentage } from '../utils/economicSeries'

export interface GdpCompactYDomain {
  min: number
  max: number
}

export function calculateGdpCompactYDomain(
  context: Pick<CompactGdpHistoricalContext, 'recentObservations' | 'outerLower' | 'outerUpper'>,
): GdpCompactYDomain {
  const values = context.recentObservations.flatMap(({ value }) => value === null ? [] : [value])
  const minimum = Math.min(0, context.outerLower, ...values)
  const maximum = Math.max(0, context.outerUpper, ...values)
  const span = maximum - minimum
  const padding = Math.max(span * 0.08, 0.25)
  return { min: minimum - padding, max: maximum + padding }
}

const positionLabels: Record<GdpHistoricalPosition, string> = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
  unavailable: 'unavailable relative to the historical bands',
}

export function describeGdpHistoricalPosition(position: GdpHistoricalPosition): string {
  return positionLabels[position]
}

export function createGdpCompactAccessibleSummary(context: CompactGdpHistoricalContext): string {
  const first = context.recentObservations.find(({ value }) => value !== null)
  const path = first?.value === null || first?.value === undefined
    ? 'No finite recent path is available.'
    : `The recent path begins at ${formatPercentage(first.value)} in ${formatObservationPeriod(first.date, 'quarterly')} and ends at ${formatPercentage(context.latestObservation.value)}.`
  return `Real GDP growth was ${formatPercentage(context.latestObservation.value)} in ${formatObservationPeriod(context.latestObservation.date, 'quarterly')}. The line shows the latest ${context.recentObservationCount} quarters. ${path} The darker band marks the middle 50% of observations from ${formatObservationPeriod(context.comparisonStart, 'quarterly')} through ${formatObservationPeriod(context.comparisonEnd, 'quarterly')}, and the lighter band marks the 10th through 90th percentiles. The latest reading is ${describeGdpHistoricalPosition(context.latestPosition)}.`
}

export function createGdpCompactHistoricalChartOptions(
  context: CompactGdpHistoricalContext,
): EChartsCoreOption {
  const domain = calculateGdpCompactYDomain(context)
  const summary = createGdpCompactAccessibleSummary(context)
  return {
    animation: false,
    aria: { enabled: true, description: summary },
    grid: { left: 2, right: 2, top: 4, bottom: 4, containLabel: false },
    tooltip: {
      trigger: 'axis',
      renderMode: 'html',
      confine: true,
      formatter: (parameters: unknown) => {
        const item = (Array.isArray(parameters) ? parameters[0] : parameters) as { value?: [string, number | null] } | undefined
        const [date, value] = item?.value ?? []
        if (!date) return ''
        const latestNote = date === context.latestObservation.date
          ? `\nLatest position: ${describeGdpHistoricalPosition(context.latestPosition)}`
          : ''
        return `${formatObservationPeriod(date, 'quarterly')}\nReal GDP growth: ${formatPercentage(value ?? null)}${latestNote}`
      },
    },
    xAxis: {
      type: 'time', show: false, boundaryGap: false,
      axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', show: false, min: domain.min, max: domain.max,
      axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
    },
    series: [{
      name: 'Recent real GDP growth',
      type: 'line',
      data: context.recentObservations.map(({ date, value }) => [date, value]),
      connectNulls: false,
      smooth: false,
      showSymbol: false,
      symbol: 'circle',
      lineStyle: { color: '#245d72', width: 2.5 },
      itemStyle: { color: '#245d72', borderColor: '#ffffff', borderWidth: 1.5 },
      markArea: {
        silent: true,
        label: { show: false },
        data: [
          [
            { name: 'Historical 10th–90th percentile band', yAxis: context.outerLower, itemStyle: { color: 'rgba(184, 148, 54, 0.14)' } },
            { yAxis: context.outerUpper },
          ],
          [
            { name: 'Historical 25th–75th percentile band', yAxis: context.innerLower, itemStyle: { color: 'rgba(184, 148, 54, 0.28)' } },
            { yAxis: context.innerUpper },
          ],
        ],
      },
      markLine: {
        silent: true, symbol: 'none', label: { show: false },
        lineStyle: { color: '#56616d', width: 1.25, type: 'dashed' },
        data: [{ yAxis: 0 }],
      },
      markPoint: {
        silent: true, label: { show: false }, symbol: 'circle', symbolSize: 8,
        data: [{ name: 'Latest observation', coord: [context.latestObservation.date, context.latestObservation.value] }],
      },
    }],
  }
}
