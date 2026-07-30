import type { EconomicObservation } from '../models/economicSeries'
import {
  classifyHistoricalBandPosition,
  deriveHistoricalBandContext,
  type HistoricalBandPosition,
  type HistoricalBandResult,
} from './historicalBandContext'
import { sortObservationsChronologically } from './economicSeries'

export const JOLTS_DIRECTION_THRESHOLD = 0.1

export type JoltsDirection =
  | 'rising'
  | 'falling'
  | 'broadly-stable'
  | 'unavailable'

export interface JoltsDirectionContext {
  state: JoltsDirection
  latestAverage: number | null
  precedingAverage: number | null
  difference: number | null
}

export const joltsHistoricalBandDefinition = {
  recentObservationCount: 61,
  comparisonWindow: { kind: 'trailing-years', years: 25 },
  innerPercentiles: [25, 75],
  outerPercentiles: [10, 90],
  minimumFiniteObservations: 240,
  latestObservationPolicy: 'latest-finite',
} as const

function monthIndex(date: string): number {
  const [year, month] = date.split('-').map(Number)
  return year! * 12 + month!
}

export function deriveJoltsDirection(
  observations: readonly EconomicObservation[],
): JoltsDirectionContext {
  const valid = sortObservationsChronologically(observations)
    .filter(
      (observation): observation is EconomicObservation & { value: number } =>
        observation.value !== null && Number.isFinite(observation.value),
    )
    .slice(-6)
  const consecutive =
    valid.length === 6 &&
    valid.every(
      (observation, index) =>
        index === 0 ||
        monthIndex(observation.date) - monthIndex(valid[index - 1]!.date) === 1,
    )
  if (!consecutive) {
    return {
      state: 'unavailable',
      latestAverage: null,
      precedingAverage: null,
      difference: null,
    }
  }
  const precedingAverage =
    valid.slice(0, 3).reduce((sum, { value }) => sum + value, 0) / 3
  const latestAverage =
    valid.slice(3).reduce((sum, { value }) => sum + value, 0) / 3
  const difference = latestAverage - precedingAverage
  return {
    state:
      difference >= JOLTS_DIRECTION_THRESHOLD
        ? 'rising'
        : difference <= -JOLTS_DIRECTION_THRESHOLD
          ? 'falling'
          : 'broadly-stable',
    latestAverage,
    precedingAverage,
    difference,
  }
}

export function joltsDirectionStatement(state: JoltsDirection): string {
  if (state === 'rising') return 'Yes — layoffs are beginning to rise.'
  if (state === 'falling') {
    return 'No — layoffs have been falling in recent months.'
  }
  if (state === 'broadly-stable') {
    return 'No — layoffs are not beginning to rise.'
  }
  return 'Recent direction is unavailable because the required observations are incomplete.'
}

export function joltsLevelStatement(position: HistoricalBandPosition): string {
  if (position === 'belowOuterBand') {
    return 'The layoff rate is very low by historical standards.'
  }
  if (position === 'betweenOuterAndInnerLow') {
    return 'The layoff rate is low by historical standards.'
  }
  if (position === 'insideInnerBand') {
    return 'The layoff rate is within its typical historical range.'
  }
  if (position === 'betweenInnerAndOuterHigh') {
    return 'The layoff rate is high by historical standards.'
  }
  if (position === 'aboveOuterBand') {
    return 'The layoff rate is very high by historical standards.'
  }
  return 'The layoff rate’s historical position is unavailable.'
}

export function deriveJoltsHistoricalContext(
  observations: readonly EconomicObservation[],
): HistoricalBandResult {
  return deriveHistoricalBandContext(
    observations,
    joltsHistoricalBandDefinition,
  )
}

export function classifyJoltsLevel(
  model: HistoricalBandResult,
): HistoricalBandPosition {
  return model.status === 'ready'
    ? classifyHistoricalBandPosition(model.latestObservation.value, model)
    : 'unavailable'
}
