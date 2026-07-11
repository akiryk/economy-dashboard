import type { EconomicObservation } from '../models/economicSeries'
import { sortObservationsChronologically } from './economicSeries'

export const timeRanges = ['5y', '10y', '20y', 'max'] as const

export type TimeRange = (typeof timeRanges)[number]

const rangeYears: Record<Exclude<TimeRange, 'max'>, number> = {
  '5y': 5,
  '10y': 10,
  '20y': 20,
}

export interface ChartSummary {
  latest: EconomicObservation | null
  minimum: EconomicObservation | null
  maximum: EconomicObservation | null
  hasBelowZero: boolean
  observationCount: number
}

type NonNullObservation = EconomicObservation & { value: number }

export function filterObservationsByTimeRange(
  observations: readonly EconomicObservation[],
  range: TimeRange,
): EconomicObservation[] {
  const sorted = sortObservationsChronologically(observations)
  if (range === 'max' || sorted.length === 0) return sorted

  const latestDate = new Date(`${sorted.at(-1)?.date}T00:00:00Z`)
  const boundary = new Date(latestDate)
  boundary.setUTCFullYear(boundary.getUTCFullYear() - rangeYears[range])
  const boundaryDate = boundary.toISOString().slice(0, 10)

  return sorted.filter((observation) => observation.date >= boundaryDate)
}

export function calculateChartSummary(
  observations: readonly EconomicObservation[],
): ChartSummary {
  const nonNullObservations = sortObservationsChronologically(
    observations,
  ).filter(
    (observation): observation is NonNullObservation =>
      observation.value !== null,
  )

  let minimum: NonNullObservation | null = null
  let maximum: NonNullObservation | null = null

  for (const observation of nonNullObservations) {
    if (minimum === null || observation.value <= minimum.value) {
      minimum = observation
    }
    if (maximum === null || observation.value >= maximum.value) {
      maximum = observation
    }
  }

  return {
    latest: nonNullObservations.at(-1) ?? null,
    minimum,
    maximum,
    hasBelowZero: nonNullObservations.some(
      (observation) => observation.value < 0,
    ),
    observationCount: nonNullObservations.length,
  }
}
