import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../models/economicSeries'
import realGdpGrowthData from '../data/real-gdp-growth.json'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
} from './chartData'

const observations: EconomicObservation[] = [
  { date: '2026-01-01', value: 2.7 },
  { date: '2020-10-01', value: -1 },
  { date: '2021-01-01', value: 1.8 },
  { date: '2023-01-01', value: 2.3 },
]

describe('filterObservationsByTimeRange', () => {
  it('uses the latest observation date and includes the range boundary', () => {
    expect(filterObservationsByTimeRange(observations, '5y')).toEqual([
      { date: '2021-01-01', value: 1.8 },
      { date: '2023-01-01', value: 2.3 },
      { date: '2026-01-01', value: 2.7 },
    ])
  })

  it('includes all observations for maximum and does not mutate input', () => {
    const original = structuredClone(observations)

    expect(filterObservationsByTimeRange(observations, 'max')).toHaveLength(4)
    expect(observations).toEqual(original)
  })

  it('produces distinct ranges for the expanded GDP history', () => {
    const series = validateEconomicSeries(realGdpGrowthData)

    expect(filterObservationsByTimeRange(series.observations, '5y')).toHaveLength(
      21,
    )
    expect(
      filterObservationsByTimeRange(series.observations, '10y'),
    ).toHaveLength(41)
    expect(
      filterObservationsByTimeRange(series.observations, '20y'),
    ).toHaveLength(81)
    expect(
      filterObservationsByTimeRange(series.observations, 'max'),
    ).toHaveLength(105)
  })
})

describe('calculateChartSummary', () => {
  it('finds latest, minimum, maximum, and below-zero observations', () => {
    expect(calculateChartSummary(observations)).toEqual({
      latest: { date: '2026-01-01', value: 2.7 },
      minimum: { date: '2020-10-01', value: -1 },
      maximum: { date: '2026-01-01', value: 2.7 },
      hasBelowZero: true,
      observationCount: 4,
    })
  })

  it('uses the most recent observation when extrema are tied', () => {
    const tied = [
      { date: '2024-01-01', value: 2 },
      { date: '2025-01-01', value: 2 },
    ]

    const summary = calculateChartSummary(tied)
    expect(summary.minimum?.date).toBe('2025-01-01')
    expect(summary.maximum?.date).toBe('2025-01-01')
  })

  it('handles empty and all-null inputs without mutating them', () => {
    const allNull: EconomicObservation[] = [
      { date: '2025-01-01', value: null },
    ]
    const original = structuredClone(allNull)
    const emptySummary = {
      latest: null,
      minimum: null,
      maximum: null,
      hasBelowZero: false,
      observationCount: 0,
    }

    expect(calculateChartSummary([])).toEqual(emptySummary)
    expect(calculateChartSummary(allNull)).toEqual(emptySummary)
    expect(allNull).toEqual(original)
  })
})
