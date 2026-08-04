import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../models/economicSeries'
import type { HistoricalBandModel } from './historicalBandContext'
import {
  createHousingStartsAccessibleSummary,
  deriveHousingStartsCompactData,
  formatHousingStartsHistoricalPosition,
} from './housingStartsData'

const observations = (
  values: readonly (number | null)[],
  startMonth = 0,
): EconomicObservation[] => values.map((value, index) => ({
  date: new Date(Date.UTC(2026, startMonth + index, 1)).toISOString().slice(0, 10),
  value,
}))

const historicalModel = (
  overrides: Partial<HistoricalBandModel> = {},
): HistoricalBandModel => ({
  status: 'ready',
  recentObservations: [{ date: '2026-06-01', value: 50 }],
  comparisonStart: '2001-06-01',
  comparisonEnd: '2026-06-01',
  outerLower: 10,
  innerLower: 25,
  median: 50,
  innerUpper: 75,
  outerUpper: 90,
  latestObservation: { date: '2026-06-01', value: 50 },
  validObservationCount: 301,
  recentObservationCount: 61,
  ...overrides,
})

describe('housing-starts compact data', () => {
  it('requires three exact constituent months for raw and normalized averages', () => {
    const result = deriveHousingStartsCompactData(
      observations([1200, 1500, 1800, null, 2100]),
      observations([300_000, 300_000, 300_000, 300_000, 300_000]),
    )

    expect(result.rawAverages.map(({ value }) => value)).toEqual([
      null, null, 1500, null, null,
    ])
    expect(result.normalizedAverages.map(({ value }) => value)).toEqual([
      null, null, 5, null, null,
    ])
  })

  it('aligns population by exact month and preserves missing-month gaps', () => {
    const result = deriveHousingStartsCompactData(
      observations([1200, 1500, 1800, 2100]),
      [
        { date: '2026-01-01', value: 300_000 },
        { date: '2026-03-01', value: 360_000 },
        { date: '2026-04-01', value: 350_000 },
      ],
    )

    expect(result.normalizedAverages).toEqual([
      { date: '2026-01-01', value: null },
      { date: '2026-02-01', value: null },
      { date: '2026-03-01', value: null },
      { date: '2026-04-01', value: null },
    ])
  })

  it.each([
    [9, 'very low'],
    [10, 'low'],
    [25, 'typical'],
    [76, 'high'],
    [91, 'very high'],
  ] as const)('formats %s as %s using exact band boundaries', (value, label) => {
    expect(formatHousingStartsHistoricalPosition(value, historicalModel()))
      .toBe(label)
  })

  it('summarizes raw pace, normalized pace, state, dates, and basis', () => {
    const summary = createHousingStartsAccessibleSummary(historicalModel({
      outerLower: 3,
      innerLower: 4,
      innerUpper: 6,
      outerUpper: 7,
      latestObservation: { date: '2026-06-01', value: 5 },
      recentObservations: [
        { date: '2021-06-01', value: 4.5 },
        { date: '2026-06-01', value: 5 },
      ],
    }), [{ date: '2026-06-01', value: 1430 }])

    expect(summary).toContain('1.43 million')
    expect(summary).toContain('5.00 starts per 1,000 residents')
    expect(summary).toContain('typical by historical standards')
    expect(summary).toContain('June 2021 through June 2026')
    expect(summary).toContain('line and historical bands use population-normalized data')
  })
})
