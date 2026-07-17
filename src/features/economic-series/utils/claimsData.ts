import type { EconomicObservation } from '../models/economicSeries'
import { sortObservationsChronologically } from './economicSeries'

export interface ClaimsObservation {
  date: string
  movingAverage: number | null
  weeklyClaims: number | null
}

export function alignClaimsObservations(
  movingAverage: readonly EconomicObservation[],
  weeklyClaims: readonly EconomicObservation[],
): ClaimsObservation[] {
  const weeklyByDate = new Map(
    weeklyClaims.map((observation) => [observation.date, observation.value]),
  )

  return sortObservationsChronologically(movingAverage).map((observation) => ({
    date: observation.date,
    movingAverage: observation.value,
    weeklyClaims: weeklyByDate.get(observation.date) ?? null,
  }))
}

export function claimsSeries(
  observations: readonly ClaimsObservation[],
  key: 'movingAverage' | 'weeklyClaims',
): EconomicObservation[] {
  return observations.map((observation) => ({
    date: observation.date,
    value: observation[key],
  }))
}

export function formatClaims(value: number | null): string {
  return value === null
    ? 'Not available'
    : Math.round(value).toLocaleString('en-US')
}

export function medianClaims(values: readonly (number | null)[]): number | null {
  const usable = values
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b)
  if (usable.length === 0) return null
  const middle = Math.floor(usable.length / 2)
  return usable.length % 2 === 0
    ? (usable[middle - 1]! + usable[middle]!) / 2
    : usable[middle]!
}
