import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../models/economicSeries'
import { adaptObservationsToChartData } from './chartAdapters'

describe('adaptObservationsToChartData', () => {
  it('sorts observations, preserves nulls, and does not mutate input', () => {
    const observations: EconomicObservation[] = [
      { date: '2024-07-01', value: null },
      { date: '2024-01-01', value: 2.2 },
      { date: '2024-04-01', value: 3.1 },
    ]
    const original = structuredClone(observations)

    expect(adaptObservationsToChartData(observations)).toEqual([
      ['2024-01-01', 2.2],
      ['2024-04-01', 3.1],
      ['2024-07-01', null],
    ])
    expect(observations).toEqual(original)
  })
})
