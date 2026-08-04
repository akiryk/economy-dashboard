import { calculatePercentileValue } from '../../briefing/briefingRules'
import type { EconomicObservation } from '../models/economicSeries'
import { sortObservationsChronologically } from './economicSeries'

export interface HistoricalBandDefinition {
  recentObservationCount: number
  comparisonWindow:
    | { kind: 'trailing-years'; years: number }
    | { kind: 'trailing-years-with-all-available-fallback'; years: number }
    | { kind: 'all-available' }
  innerPercentiles: readonly [number, number]
  outerPercentiles: readonly [number, number]
  minimumFiniteObservations: number
  latestObservationPolicy: 'last-observation' | 'latest-finite'
}

export interface HistoricalBandModel {
  status: 'ready'
  recentObservations: EconomicObservation[]
  comparisonStart: string
  comparisonEnd: string
  innerLower: number
  innerUpper: number
  median: number
  outerLower: number
  outerUpper: number
  latestObservation: EconomicObservation & { value: number }
  validObservationCount: number
  recentObservationCount: number
}

interface HistoricalBandUnavailable {
  status: 'empty' | 'insufficient-history' | 'latest-unavailable'
  recentObservations: EconomicObservation[]
  comparisonStart: string | null
  comparisonEnd: string | null
  latestObservation: EconomicObservation | null
  validObservationCount: number
  recentObservationCount: number
  minimumRequired: number
}

export type HistoricalBandResult =
  | HistoricalBandModel
  | HistoricalBandUnavailable

export type HistoricalBandPosition =
  | 'belowOuterBand'
  | 'betweenOuterAndInnerLow'
  | 'insideInnerBand'
  | 'betweenInnerAndOuterHigh'
  | 'aboveOuterBand'
  | 'unavailable'

function finiteObservation(
  observation: EconomicObservation,
): observation is EconomicObservation & { value: number } {
  return observation.value !== null && Number.isFinite(observation.value)
}

function comparisonStartDate(
  latestDate: string,
  earliestDate: string,
  window: HistoricalBandDefinition['comparisonWindow'],
): string | null {
  if (window.kind === 'all-available') return null
  const cutoff = new Date(`${latestDate}T00:00:00Z`)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - window.years)
  const cutoffDate = cutoff.toISOString().slice(0, 10)
  return window.kind === 'trailing-years-with-all-available-fallback' &&
    earliestDate > cutoffDate
    ? null
    : cutoffDate
}

export function deriveHistoricalBandContext(
  observations: readonly EconomicObservation[],
  definition: HistoricalBandDefinition,
): HistoricalBandResult {
  const sorted = sortObservationsChronologically(observations)
  const latestObservation = definition.latestObservationPolicy === 'latest-finite'
    ? [...sorted].reverse().find(finiteObservation) ?? null
    : sorted.at(-1) ?? null

  if (!latestObservation) {
    return {
      status: 'empty', recentObservations: [], latestObservation: null,
      comparisonStart: null, comparisonEnd: null, validObservationCount: 0,
      recentObservationCount: 0,
      minimumRequired: definition.minimumFiniteObservations,
    }
  }

  const observationsThroughLatest = sorted.filter(
    ({ date }) => date <= latestObservation.date,
  )
  const recentObservations = observationsThroughLatest.slice(
    -definition.recentObservationCount,
  )
  const cutoff = comparisonStartDate(
    latestObservation.date,
    observationsThroughLatest[0]!.date,
    definition.comparisonWindow,
  )
  const comparisonObservations = observationsThroughLatest.filter(
    ({ date }) => cutoff === null || date >= cutoff,
  )
  const finiteValues = comparisonObservations
    .filter(finiteObservation)
    .map(({ value }) => value)
  const comparisonStart = comparisonObservations[0]?.date ?? null
  const failureBase = {
    recentObservations,
    latestObservation,
    comparisonStart,
    comparisonEnd: latestObservation.date,
    validObservationCount: finiteValues.length,
    recentObservationCount: recentObservations.length,
    minimumRequired: definition.minimumFiniteObservations,
  }

  if (finiteValues.length < definition.minimumFiniteObservations) {
    return { status: 'insufficient-history', ...failureBase }
  }
  if (!finiteObservation(latestObservation)) {
    return { status: 'latest-unavailable', ...failureBase }
  }

  const [innerLow, innerHigh] = definition.innerPercentiles
  const [outerLow, outerHigh] = definition.outerPercentiles
  return {
    status: 'ready', recentObservations,
    comparisonStart: comparisonStart!, comparisonEnd: latestObservation.date,
    innerLower: calculatePercentileValue(finiteValues, innerLow)!,
    innerUpper: calculatePercentileValue(finiteValues, innerHigh)!,
    median: calculatePercentileValue(finiteValues, 50)!,
    outerLower: calculatePercentileValue(finiteValues, outerLow)!,
    outerUpper: calculatePercentileValue(finiteValues, outerHigh)!,
    latestObservation,
    validObservationCount: finiteValues.length,
    recentObservationCount: recentObservations.length,
  }
}

export function classifyHistoricalBandPosition(
  value: number | null,
  model: Pick<
    HistoricalBandModel,
    'outerLower' | 'innerLower' | 'innerUpper' | 'outerUpper'
  >,
): HistoricalBandPosition {
  if (value === null || !Number.isFinite(value)) return 'unavailable'
  if (value < model.outerLower) return 'belowOuterBand'
  if (value < model.innerLower) return 'betweenOuterAndInnerLow'
  if (value <= model.innerUpper) return 'insideInnerBand'
  if (value <= model.outerUpper) return 'betweenInnerAndOuterHigh'
  return 'aboveOuterBand'
}
