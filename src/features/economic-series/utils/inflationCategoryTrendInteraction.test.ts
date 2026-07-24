import { describe, expect, it } from 'vitest'
import {
  adjacentFiniteObservationIndex,
  nearestFiniteObservationIndex,
} from './inflationCategoryTrendInteraction'

const observations = [
  { date: '2026-01-01', value: 1 },
  { date: '2026-02-01', value: null },
  { date: '2026-03-01', value: 3 },
]

describe('inflation category trend interaction', () => {
  it('selects the nearest real observation without interpolating a null', () => {
    expect(nearestFiniteObservationIndex(observations, 0)).toBe(0)
    expect(nearestFiniteObservationIndex(observations, 0.9)).toBe(2)
  })

  it('navigates only finite observations and clamps at the ends', () => {
    expect(adjacentFiniteObservationIndex(observations, 0, 1)).toBe(2)
    expect(adjacentFiniteObservationIndex(observations, 2, 1)).toBe(2)
    expect(adjacentFiniteObservationIndex(observations, 2, -1)).toBe(0)
  })
})
