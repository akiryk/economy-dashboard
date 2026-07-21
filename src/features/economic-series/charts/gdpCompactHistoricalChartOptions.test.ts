import { describe, expect, it } from 'vitest'
import type { CompactGdpHistoricalContext } from '../utils/gdpCompactHistoricalContext'
import {
  calculateGdpCompactYDomain,
  createGdpCompactAccessibleSummary,
  createGdpCompactHistoricalChartOptions,
} from './gdpCompactHistoricalChartOptions'

function context(overrides: Partial<CompactGdpHistoricalContext> = {}): CompactGdpHistoricalContext {
  return {
    status: 'ready',
    recentObservations: [
      { date: '2025-04-01', value: 2 },
      { date: '2025-07-01', value: null },
      { date: '2025-10-01', value: -1 },
      { date: '2026-01-01', value: 3 },
    ],
    outerLower: 0.5, innerLower: 1.5, median: 2.2, innerUpper: 3.1, outerUpper: 4,
    latestPosition: 'insideInnerBand',
    latestObservation: { date: '2026-01-01', value: 3 },
    comparisonStart: '2001-01-01', comparisonEnd: '2026-01-01',
    validObservationCount: 101, recentObservationCount: 4,
    ...overrides,
  }
}

describe('GDP compact historical chart options', () => {
  it('layers exact outer and inner markArea bands beneath the line', () => {
    const options = createGdpCompactHistoricalChartOptions(context())
    const series = (options.series as Array<{ markArea: { data: unknown[] }; data: unknown[] }>)[0]!
    expect(series.markArea.data).toEqual([
      [
        expect.objectContaining({ yAxis: 0.5, name: 'Historical 10th–90th percentile band' }),
        { yAxis: 4 },
      ],
      [
        expect.objectContaining({ yAxis: 1.5, name: 'Historical 25th–75th percentile band' }),
        { yAxis: 3.1 },
      ],
    ])
    expect(series.data).toEqual([
      ['2025-04-01', 2], ['2025-07-01', null], ['2025-10-01', -1], ['2026-01-01', 3],
    ])
  })

  it('hides axes and omits legend, zoom, toolbox, and smoothing', () => {
    const options = createGdpCompactHistoricalChartOptions(context())
    const series = (options.series as Array<{ smooth: boolean; connectNulls: boolean; showSymbol: boolean }>)[0]!
    expect(options.xAxis).toMatchObject({ show: false })
    expect(options.yAxis).toMatchObject({ show: false })
    expect(options).not.toHaveProperty('legend')
    expect(options).not.toHaveProperty('dataZoom')
    expect(options).not.toHaveProperty('toolbox')
    expect(series).toMatchObject({ smooth: false, connectNulls: false, showSymbol: false })
  })

  it('includes a zero reference and exact latest marker', () => {
    const options = createGdpCompactHistoricalChartOptions(context())
    const series = (options.series as Array<{ markLine: { data: unknown[] }; markPoint: { data: unknown[] } }>)[0]!
    expect(series.markLine.data).toEqual([{ yAxis: 0 }])
    expect(series.markPoint.data).toEqual([{ name: 'Latest observation', coord: ['2026-01-01', 3] }])
  })

  it.each([
    ['all positive', context({ recentObservations: [{ date: '2026-01-01', value: 2 }], outerLower: 1, outerUpper: 4 }), 0, 4],
    ['negative recent', context({ recentObservations: [{ date: '2026-01-01', value: -5 }] }), -5, 4],
    ['extreme outlier', context({ recentObservations: [{ date: '2026-01-01', value: 40 }] }), 0, 40],
  ] as const)('builds a padded unbroken domain for %s data', (_label, fixture, includedMin, includedMax) => {
    const domain = calculateGdpCompactYDomain(fixture)
    expect(domain.min).toBeLessThan(includedMin)
    expect(domain.max).toBeGreaterThan(includedMax)
  })

  it('provides a concise tooltip with factual latest-position context', () => {
    const options = createGdpCompactHistoricalChartOptions(context())
    const tooltip = options.tooltip as { formatter: (items: Array<{ value: [string, number] }>) => string }
    expect(tooltip.formatter([{ value: ['2026-01-01', 3] }])).toBe(
      '2026 Q1\nReal GDP growth: 3.0%\nLatest position: within the historical middle 50%',
    )
    expect(tooltip.formatter([{ value: ['2025-10-01', -1] }])).toBe('2025 Q4\nReal GDP growth: -1.0%')
  })

  it('creates deterministic non-editorial accessible copy', () => {
    const summary = createGdpCompactAccessibleSummary(context())
    expect(summary).toContain('Real GDP growth was 3.0% in 2026 Q1.')
    expect(summary).toContain('The line shows the latest 4 quarters.')
    expect(summary).toContain('darker band marks the middle 50%')
    expect(summary).toContain('lighter band marks the 10th through 90th percentiles')
    expect(summary).toContain('from 2001 Q1 through 2026 Q1')
    expect(summary).toContain('latest reading is within the historical middle 50%')
    expect(summary).not.toMatch(/healthy|weak|good|bad/i)
  })
})
