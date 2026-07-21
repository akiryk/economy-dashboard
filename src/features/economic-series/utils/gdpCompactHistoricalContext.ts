import { calculatePercentileValue } from '../../briefing/briefingRules'
import type { EconomicObservation } from '../models/economicSeries'
import { sortObservationsChronologically } from './economicSeries'

export const GDP_COMPARISON_YEARS = 25
export const GDP_RECENT_QUARTERS = 12
export const GDP_MINIMUM_COMPARISON_OBSERVATIONS = 20

export type GdpHistoricalPosition =
  | 'belowOuterBand'
  | 'betweenOuterAndInnerLow'
  | 'insideInnerBand'
  | 'betweenInnerAndOuterHigh'
  | 'aboveOuterBand'
  | 'unavailable'

export interface GdpHistoricalThresholds {
  outerLower: number
  innerLower: number
  median: number
  innerUpper: number
  outerUpper: number
}

export interface CompactGdpHistoricalContext extends GdpHistoricalThresholds {
  status: 'ready'
  recentObservations: EconomicObservation[]
  latestPosition: Exclude<GdpHistoricalPosition, 'unavailable'>
  latestObservation: EconomicObservation & { value: number }
  comparisonStart: string
  comparisonEnd: string
  validObservationCount: number
  recentObservationCount: number
}

interface CompactGdpHistoricalContextFailure {
  status: 'empty' | 'insufficient-history' | 'latest-unavailable'
  recentObservations: EconomicObservation[]
  latestObservation: EconomicObservation | null
  latestPosition: 'unavailable'
  comparisonStart: string | null
  comparisonEnd: string | null
  validObservationCount: number
  recentObservationCount: number
  minimumRequired: number
}

export type CompactGdpHistoricalContextResult =
  | CompactGdpHistoricalContext
  | CompactGdpHistoricalContextFailure

export function classifyGdpHistoricalPosition(
  value: number | null,
  thresholds: GdpHistoricalThresholds,
): GdpHistoricalPosition {
  if (value === null || !Number.isFinite(value)) return 'unavailable'
  if (value < thresholds.outerLower) return 'belowOuterBand'
  if (value < thresholds.innerLower) return 'betweenOuterAndInnerLow'
  if (value <= thresholds.innerUpper) return 'insideInnerBand'
  if (value <= thresholds.outerUpper) return 'betweenInnerAndOuterHigh'
  return 'aboveOuterBand'
}

export function deriveCompactGdpHistoricalContext(
  observations: readonly EconomicObservation[],
): CompactGdpHistoricalContextResult {
  const sorted = sortObservationsChronologically(observations)
  const recentObservations = sorted.slice(-GDP_RECENT_QUARTERS)
  const latestObservation = sorted.at(-1) ?? null
  if (!latestObservation) {
    return {
      status: 'empty', recentObservations, latestObservation: null, latestPosition: 'unavailable',
      comparisonStart: null, comparisonEnd: null, validObservationCount: 0,
      recentObservationCount: 0, minimumRequired: GDP_MINIMUM_COMPARISON_OBSERVATIONS,
    }
  }

  const latestDate = new Date(`${latestObservation.date}T00:00:00Z`)
  const cutoff = new Date(latestDate)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - GDP_COMPARISON_YEARS)
  const cutoffDate = cutoff.toISOString().slice(0, 10)
  const comparisonObservations = sorted.filter(({ date }) => date >= cutoffDate && date <= latestObservation.date)
  const validValues = comparisonObservations.flatMap(({ value }) => value === null || !Number.isFinite(value) ? [] : [value])
  const comparisonStart = comparisonObservations[0]?.date ?? null
  const comparisonEnd = latestObservation.date
  const failureBase = {
    recentObservations, latestObservation, latestPosition: 'unavailable' as const,
    comparisonStart, comparisonEnd, validObservationCount: validValues.length,
    recentObservationCount: recentObservations.length,
    minimumRequired: GDP_MINIMUM_COMPARISON_OBSERVATIONS,
  }

  if (validValues.length < GDP_MINIMUM_COMPARISON_OBSERVATIONS) {
    return { status: 'insufficient-history', ...failureBase }
  }
  if (latestObservation.value === null || !Number.isFinite(latestObservation.value)) {
    return { status: 'latest-unavailable', ...failureBase }
  }

  const thresholds: GdpHistoricalThresholds = {
    outerLower: calculatePercentileValue(validValues, 10)!,
    innerLower: calculatePercentileValue(validValues, 25)!,
    median: calculatePercentileValue(validValues, 50)!,
    innerUpper: calculatePercentileValue(validValues, 75)!,
    outerUpper: calculatePercentileValue(validValues, 90)!,
  }
  const latestPosition = classifyGdpHistoricalPosition(latestObservation.value, thresholds)
  if (latestPosition === 'unavailable') {
    return { status: 'latest-unavailable', ...failureBase }
  }
  return {
    status: 'ready', ...thresholds, recentObservations,
    latestPosition,
    latestObservation: { ...latestObservation, value: latestObservation.value },
    comparisonStart: comparisonStart!, comparisonEnd,
    validObservationCount: validValues.length,
    recentObservationCount: recentObservations.length,
  }
}
