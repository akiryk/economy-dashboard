import { describe, expect, it, vi } from 'vitest'
import type { HistoricalBandModel } from '../utils/historicalBandContext'
import { compactChartTheme } from './compactChartTheme'
import {
  calculateHistoricalBandYDomain,
  createHistoricalBandChartOptions,
} from './historicalBandChartOptions'

const model: HistoricalBandModel = {
  status: 'ready',
  recentObservations: [
    { date: '2025-04-01', value: 2 },
    { date: '2025-07-01', value: null },
    { date: '2025-10-01', value: -1 },
    { date: '2026-01-01', value: 3 },
  ],
  outerLower: 0.5, innerLower: 1.5, median: 2.2,
  innerUpper: 3.1, outerUpper: 4,
  latestObservation: { date: '2026-01-01', value: 3 },
  comparisonStart: '2001-01-01', comparisonEnd: '2026-01-01',
  validObservationCount: 101, recentObservationCount: 4,
}

function options(overrides: Partial<Parameters<typeof createHistoricalBandChartOptions>[0]> = {}) {
  return createHistoricalBandChartOptions({
    model,
    seriesLabel: 'Example growth',
    frequency: 'quarterly',
    valueFormatter: (value) => value === null ? 'Unavailable' : `${value.toFixed(1)}%`,
    latestPositionDescription: 'within the historical middle 50%',
    showZeroLine: true,
    showLatestMarker: true,
    ...overrides,
  })
}

describe('historical band chart options', () => {
  it('layers shared-theme outer and inner bands and preserves gaps', () => {
    const series = (options().series as Array<{
      data: unknown[]
      markArea: { data: Array<Array<{ itemStyle?: { color: string } }>> }
      lineStyle: { color: string }
      smooth: boolean
      connectNulls: boolean
    }>)[0]!
    expect(series.markArea.data[0]?.[0]?.itemStyle?.color).toBe(
      compactChartTheme.outerBandFill,
    )
    expect(series.markArea.data[1]?.[0]?.itemStyle?.color).toBe(
      compactChartTheme.innerBandFill,
    )
    expect(series.lineStyle.color).toBe(compactChartTheme.line)
    expect(series.data).toContainEqual(['2025-07-01', null])
    expect(series).toMatchObject({ smooth: false, connectNulls: false })
  })

  it('supports optional zero line and latest marker', () => {
    const enabled = (options().series as Array<{
      markLine?: { data: unknown[] }
      markPoint?: { data: unknown[] }
    }>)[0]!
    expect(enabled.markLine?.data).toEqual([{
      name: 'Zero',
      yAxis: 0,
      lineStyle: {
        color: compactChartTheme.zeroLine,
        width: 1.25,
        type: 'dashed',
      },
    }])
    expect(enabled.markPoint?.data).toEqual([{
      name: 'Latest observation', coord: ['2026-01-01', 3],
    }])
    const disabled = (options({
      showZeroLine: false, showLatestMarker: false,
    }).series as Array<{ markLine?: unknown; markPoint?: unknown }>)[0]!
    expect(disabled.markLine).toBeUndefined()
    expect(disabled.markPoint).toBeUndefined()
  })

  it('renders an optional policy reference and includes it in the domain', () => {
    const configured = (options({
      referenceLines: [{ value: 5, label: 'Policy reference' }],
    }).series as Array<{
      markLine?: { data: Array<{ name: string; yAxis: number }> }
    }>)[0]!
    expect(configured.markLine?.data).toContainEqual(expect.objectContaining({
      name: 'Policy reference',
      yAxis: 5,
    }))
    expect(calculateHistoricalBandYDomain(model, true, [5]).max).toBeGreaterThan(5)
  })

  it('delegates value formatting and appends supplied latest-position language', () => {
    const formatter = vi.fn((value: number | null) => `${value}% formatted`)
    const tooltip = options({ valueFormatter: formatter }).tooltip as {
      formatter: (items: Array<{ value: [string, number] }>) => string
      renderMode: string
      enterable: boolean
      extraCssText: string
    }
    expect(tooltip).toMatchObject({
      renderMode: 'html',
      enterable: false,
      extraCssText: expect.stringContaining('pointer-events: none'),
    })
    expect(tooltip.formatter([{ value: ['2026-01-01', 3] }])).toBe(
      '2026 Q1\nExample growth: 3% formatted\nLatest position: within the historical middle 50%',
    )
    expect(formatter).toHaveBeenCalledWith(3)
  })

  it('includes zero in the domain only when requested', () => {
    const positive = { ...model, recentObservations: [{ date: '2026-01-01', value: 2 }] }
    expect(calculateHistoricalBandYDomain(positive, true).min).toBeLessThan(0)
    expect(calculateHistoricalBandYDomain(positive, false).min).toBeGreaterThan(0)
  })
})
