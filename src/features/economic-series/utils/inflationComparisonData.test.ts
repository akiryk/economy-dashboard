import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import {
  alignInflationObservations,
  calculateInflationComparisonSummary,
  coreValueThreeMonthsEarlier,
  filterInflationComparisonByTimeRange,
  latestSharedInflationObservation,
} from './inflationComparisonData'

function series(
  slug: string,
  observations: EconomicSeries['observations'],
): EconomicSeries {
  return {
    id: slug,
    slug,
    provider: 'FRED',
    providerSeriesId: slug,
    title: slug,
    shortTitle: slug,
    description: slug,
    question: `${slug}?`,
    units: 'Percent',
    frequency: 'monthly',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Derived',
    sourceName: 'FRED',
    sourceUrl: 'https://example.com',
    retrievedAt: '2026-07-13',
    observations,
  }
}

describe('inflationComparisonData', () => {
  it('aligns exact months, precomputes differences, and does not mutate inputs', () => {
    const headline = series('headline', [
      { date: '2025-03-01', value: 3 },
      { date: '2025-01-01', value: 2 },
      { date: '2025-02-01', value: 2.5 },
    ])
    const core = series('core', [
      { date: '2025-01-01', value: 2.4 },
      { date: '2025-03-01', value: null },
      { date: '2025-04-01', value: 4 },
    ])
    const originalHeadline = structuredClone(headline)
    const originalCore = structuredClone(core)

    expect(alignInflationObservations(headline, core)).toEqual([
      { date: '2025-01-01', headline: 2, core: 2.4, difference: 0.3999999999999999 },
      { date: '2025-03-01', headline: 3, core: null, difference: null },
    ])
    expect(headline).toEqual(originalHeadline)
    expect(core).toEqual(originalCore)
  })

  it('selects the latest shared month rather than a partial endpoint', () => {
    const aligned = [
      { date: '2026-03-01', headline: 2, core: 3, difference: 1 },
      { date: '2026-04-01', headline: 2.1, core: null, difference: null },
    ]
    expect(latestSharedInflationObservation(aligned)?.date).toBe('2026-03-01')
  })

  it('filters both lines to one anchored range while preserving internal gaps', () => {
    const aligned = Array.from({ length: 74 }, (_, index) => ({
      date: new Date(Date.UTC(2020, index, 1)).toISOString().slice(0, 10),
      headline: index === 70 ? null : index,
      core: index === 70 ? null : index + 1,
      difference: index === 70 ? null : 1,
    }))
    const original = structuredClone(aligned)
    const fiveYears = filterInflationComparisonByTimeRange(aligned, '5y')

    expect(fiveYears[0]?.date).toBe('2021-02-01')
    expect(fiveYears.at(-1)?.date).toBe('2026-02-01')
    expect(fiveYears.find((item) => item.date === aligned[70]?.date))
      .toMatchObject({ headline: null, core: null })
    expect(filterInflationComparisonByTimeRange(aligned, 'max')).toEqual(aligned)
    expect(aligned).toEqual(original)
  })

  it('reports core extrema with existing tie behavior and exact prior month', () => {
    const aligned = [
      { date: '2026-01-01', headline: 2, core: 3, difference: 1 },
      { date: '2026-02-01', headline: 2, core: -1, difference: -3 },
      { date: '2026-03-01', headline: 2, core: -1, difference: -3 },
      { date: '2026-04-01', headline: 2, core: 4, difference: 2 },
    ]
    const summary = calculateInflationComparisonSummary(aligned)

    expect(summary.minimum).toEqual({ date: '2026-03-01', value: -1 })
    expect(summary.maximum).toEqual({ date: '2026-04-01', value: 4 })
    expect(coreValueThreeMonthsEarlier(aligned, '2026-04-01')).toBe(3)
    expect(coreValueThreeMonthsEarlier(aligned, '2026-05-01')).toBe(-1)
    expect(coreValueThreeMonthsEarlier(aligned, '2026-06-01')).toBe(-1)
  })
})
