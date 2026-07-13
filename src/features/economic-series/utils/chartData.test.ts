import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../models/economicSeries'
import realGdpGrowthData from '../data/real-gdp-growth.json'
import payrollGrowthData from '../data/payroll-growth.json'
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

  it('preserves short GDP ranges while maximum includes full history', () => {
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
    ).toHaveLength(313)
  })

  it('allows series-specific maximum start dates', () => {
    const gdp = validateEconomicSeries(realGdpGrowthData)
    const payroll = validateEconomicSeries(payrollGrowthData)

    expect(filterObservationsByTimeRange(gdp.observations, 'max')[0]?.date)
      .toBe('1948-01-01')
    expect(filterObservationsByTimeRange(payroll.observations, 'max')[0]?.date)
      .toBe('1939-04-01')
  })

  it('filters monthly data from the latest date and includes the boundary', () => {
    const monthlyObservations = Array.from({ length: 73 }, (_, index) => {
      const date = new Date(Date.UTC(2020, 4 + index, 1))
      return { date: date.toISOString().slice(0, 10), value: index }
    }).reverse()
    const original = structuredClone(monthlyObservations)

    const fiveYears = filterObservationsByTimeRange(monthlyObservations, '5y')

    expect(fiveYears).toHaveLength(61)
    expect(fiveYears[0]?.date).toBe('2021-05-01')
    expect(fiveYears.at(-1)?.date).toBe('2026-05-01')
    expect(filterObservationsByTimeRange(monthlyObservations, 'max')).toHaveLength(
      73,
    )
    expect(monthlyObservations).toEqual(original)
  })
})

describe('calculateChartSummary', () => {
  it('calculates extrema across a full maximum-range input', () => {
    const fullHistory = [
      { date: '1948-01-01', value: 8 },
      { date: '1980-01-01', value: -3 },
      { date: '2026-01-01', value: 2 },
    ]

    expect(calculateChartSummary(
      filterObservationsByTimeRange(fullHistory, 'max'),
    )).toMatchObject({
      latest: { date: '2026-01-01', value: 2 },
      minimum: { date: '1980-01-01', value: -3 },
      maximum: { date: '1948-01-01', value: 8 },
      observationCount: 3,
    })
  })

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
