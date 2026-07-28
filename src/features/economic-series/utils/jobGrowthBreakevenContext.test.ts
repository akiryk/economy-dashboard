import { describe, expect, it } from 'vitest'
import productionData from '../data/job-growth-breakeven-comparison.json'
import {
  validateJobGrowthBreakevenDataset,
  type JobGrowthBreakevenDataset,
} from '../models/jobGrowthBreakeven'
import {
  classifyJobGrowthBreakevenGap,
  createJobGrowthBreakevenAccessibleSummary,
  deriveJobGrowthBreakevenContext,
  formatJobGrowthBreakevenAnswer,
  formatJobGrowthBreakevenHeroLabel,
  formatSignedPp,
  jobGrowthBreakevenNeutralThreshold,
} from './jobGrowthBreakevenContext'

const production = validateJobGrowthBreakevenDataset(productionData)

function withLatestGap(gap: number): JobGrowthBreakevenDataset {
  return {
    ...production,
    observations: production.observations.map((item, index, all) =>
      index === all.length - 3 && item.status === 'available'
        ? { ...item, gapPercentagePoints: gap }
        : item),
  }
}

describe('job-growth breakeven answer model', () => {
  it.each([
    [0.2, 'above'],
    [-0.2, 'below'],
    [0, 'about-even'],
    [0.049999, 'about-even'],
    [-0.049999, 'about-even'],
    [jobGrowthBreakevenNeutralThreshold, 'above'],
    [-jobGrowthBreakevenNeutralThreshold, 'below'],
    [null, 'unavailable'],
  ] as const)('classifies %s as %s', (gap, expected) => {
    expect(classifyJobGrowthBreakevenGap(gap)).toBe(expected)
  })

  it('keeps answer and direction-sensitive hero language deterministic', () => {
    expect(formatJobGrowthBreakevenAnswer('above')).toMatch(/^Yes —/)
    expect(formatJobGrowthBreakevenAnswer('about-even')).toMatch(/^About even —/)
    expect(formatJobGrowthBreakevenAnswer('below')).toMatch(/^No —/)
    expect(formatJobGrowthBreakevenHeroLabel('above')).toContain('above')
    expect(formatJobGrowthBreakevenHeroLabel('below')).toContain('below')
    expect(formatJobGrowthBreakevenHeroLabel('about-even')).toContain('roughly at')
  })

  it('formats the compact hero with signed pp units', () => {
    expect(formatSignedPp(0.69118)).toBe('+0.7 pp')
    expect(formatSignedPp(-0.69118)).toBe('−0.7 pp')
    expect(formatSignedPp(0)).toBe('0.0 pp')
  })
})

describe('production job-growth breakeven context', () => {
  it('uses the latest aligned period, five-year line, and trailing 25 years', () => {
    const context = deriveJobGrowthBreakevenContext(production)
    expect(context.latest).toMatchObject({
      date: '2026-06-01',
      actualAverageMonthlyJobGrowth: 111.33333333333333,
      estimatedBreakevenMonthlyJobGrowth: 20.29385,
      monthlyJobGrowthDifference: 91.03948333333332,
      gapPercentagePoints: 0.6911808742970482,
    })
    expect(context.state).toBe('above')
    expect(context.historicalBands.status).toBe('ready')
    if (context.historicalBands.status !== 'ready') return
    expect(context.historicalBands.recentObservations).toHaveLength(21)
    expect(context.historicalBands.recentObservations[0]?.date)
      .toBe('2021-06-01')
    expect(context.historicalBands.comparisonStart).toBe('2001-06-01')
    expect(context.historicalBands.comparisonEnd).toBe('2026-06-01')
    expect(context.historicalBands.validObservationCount).toBe(101)
  })

  it('preserves unavailable gaps and does not select future projections', () => {
    const fixture = {
      ...production,
      observations: production.observations.map((item) =>
        item.date === '2024-12-01'
          ? {
              status: 'unavailable' as const,
              date: item.date,
              estimatedBreakevenMonthlyJobGrowth:
                item.estimatedBreakevenMonthlyJobGrowth,
              estimateStatus: item.estimateStatus,
              reason: 'incomplete-payroll-window' as const,
            }
          : item),
    }
    const context = deriveJobGrowthBreakevenContext(fixture)
    expect(context.historicalBands.recentObservations).toContainEqual({
      date: '2024-12-01',
      value: null,
    })
    expect(context.gapObservations.slice(-2)).toEqual([
      { date: '2026-09-01', value: null },
      { date: '2026-12-01', value: null },
    ])
    expect(context.latest?.date).toBe('2026-06-01')
  })

  it('produces complete accessible rate, count, period, and model context', () => {
    const summary = createJobGrowthBreakevenAccessibleSummary(
      deriveJobGrowthBreakevenContext(production),
    )
    expect(summary).toContain('2026 Q2')
    expect(summary).toContain('Gap: +0.7 pp')
    expect(summary).toContain('Actual payroll growth: 0.84% annualized')
    expect(summary).toContain('Estimated breakeven growth: 0.15% annualized')
    expect(summary).toContain('Actual job growth: +111K per month')
    expect(summary).toContain('Estimated breakeven: +20K per month')
    expect(summary).toContain('Difference: +91K per month')
    expect(summary).toContain('2021 Q2 through 2026 Q2')
    expect(summary).toContain('source projection')
  })

  it('supports positive, neutral, and negative production-shaped fixtures', () => {
    expect(deriveJobGrowthBreakevenContext(withLatestGap(0.2)).state).toBe('above')
    expect(deriveJobGrowthBreakevenContext(withLatestGap(0)).state).toBe('about-even')
    expect(deriveJobGrowthBreakevenContext(withLatestGap(-0.2)).state).toBe('below')
  })

  it('uses established insufficient-history behavior', () => {
    const short = {
      ...production,
      observations: production.observations.slice(-12),
    }
    expect(deriveJobGrowthBreakevenContext(short).historicalBands.status)
      .toBe('insufficient-history')
  })
})
