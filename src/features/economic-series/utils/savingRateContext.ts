import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentagePoints,
  sortObservationsChronologically,
} from './economicSeries'
import {
  classifyHistoricalBandPosition,
  deriveHistoricalBandContext,
  type HistoricalBandDefinition,
  type HistoricalBandResult,
} from './historicalBandContext'

export type SavingRateDirectionState =
  | 'saving-less'
  | 'broadly-stable'
  | 'saving-more'
  | 'unavailable'

export type SavingRateLevelState =
  | 'very-low'
  | 'low'
  | 'typical'
  | 'high'
  | 'very-high'
  | 'unavailable'

export interface SavingRateContextModel {
  latestObservation: (EconomicObservation & { value: number }) | null
  priorYearObservation: (EconomicObservation & { value: number }) | null
  twelveMonthChange: number | null
  directionState: SavingRateDirectionState
  directionStatement: string
  historicalBands: HistoricalBandResult
  levelState: SavingRateLevelState
  levelStatement: string
}

/** Changes no larger than 0.2 percentage point are treated as immaterial. */
export const savingRateStableThreshold = 0.2

export const savingRateHistoricalBandDefinition: HistoricalBandDefinition = {
  recentObservationCount: 61,
  comparisonWindow: { kind: 'trailing-years', years: 25 },
  innerPercentiles: [25, 75],
  outerPercentiles: [10, 90],
  minimumFiniteObservations: 60,
  latestObservationPolicy: 'last-observation',
}

function finiteObservation(
  observation: EconomicObservation | undefined,
): observation is EconomicObservation & { value: number } {
  return observation?.value !== null &&
    observation?.value !== undefined &&
    Number.isFinite(observation.value)
}

function priorYearDate(date: string): string {
  const prior = new Date(`${date}T00:00:00Z`)
  prior.setUTCFullYear(prior.getUTCFullYear() - 1)
  return prior.toISOString().slice(0, 10)
}

export function classifySavingRateDirection(
  change: number | null,
): SavingRateDirectionState {
  if (change === null || !Number.isFinite(change)) return 'unavailable'
  if (change < -savingRateStableThreshold) return 'saving-less'
  if (change > savingRateStableThreshold) return 'saving-more'
  return 'broadly-stable'
}

export function formatSavingRateDirection(
  state: SavingRateDirectionState,
): string {
  const statements: Record<SavingRateDirectionState, string> = {
    'saving-less':
      'Yes — households are saving a smaller share of their income than a year ago.',
    'broadly-stable':
      'No clear change — households are saving about the same share of their income as a year ago.',
    'saving-more':
      'No — households are saving a larger share of their income than a year ago.',
    unavailable:
      'The change from a year ago is unavailable because the exact prior-year observation is missing.',
  }
  return statements[state]
}

export function classifySavingRateLevel(
  historicalBands: HistoricalBandResult,
): SavingRateLevelState {
  if (historicalBands.status !== 'ready') return 'unavailable'
  const states = {
    belowOuterBand: 'very-low',
    betweenOuterAndInnerLow: 'low',
    insideInnerBand: 'typical',
    betweenInnerAndOuterHigh: 'high',
    aboveOuterBand: 'very-high',
    unavailable: 'unavailable',
  } as const
  return states[classifyHistoricalBandPosition(
    historicalBands.latestObservation.value,
    historicalBands,
  )]
}

export function formatSavingRateLevel(state: SavingRateLevelState): string {
  const statements: Record<SavingRateLevelState, string> = {
    'very-low': 'The saving rate is very low by historical standards.',
    low: 'The saving rate is low by historical standards.',
    typical: 'The saving rate is within its typical historical range.',
    high: 'The saving rate is high by historical standards.',
    'very-high': 'The saving rate is very high by historical standards.',
    unavailable: 'Historical saving-rate context is unavailable.',
  }
  return statements[state]
}

export function deriveSavingRateContext(
  observations: readonly EconomicObservation[],
): SavingRateContextModel {
  const sorted = sortObservationsChronologically(observations)
  const latest = sorted.at(-1)
  const latestObservation = finiteObservation(latest) ? latest : null
  const prior = latestObservation
    ? sorted.find(({ date }) => date === priorYearDate(latestObservation.date))
    : undefined
  const priorYearObservation = finiteObservation(prior) ? prior : null
  const twelveMonthChange = latestObservation && priorYearObservation
    ? latestObservation.value - priorYearObservation.value
    : null
  const historicalBands = deriveHistoricalBandContext(
    sorted,
    savingRateHistoricalBandDefinition,
  )
  const directionState = classifySavingRateDirection(twelveMonthChange)
  const levelState = classifySavingRateLevel(historicalBands)
  return {
    latestObservation,
    priorYearObservation,
    twelveMonthChange,
    directionState,
    directionStatement: formatSavingRateDirection(directionState),
    historicalBands,
    levelState,
    levelStatement: formatSavingRateLevel(levelState),
  }
}

export function formatSavingRateChange(change: number | null): string {
  if (change === null || !Number.isFinite(change)) {
    return 'Change from a year earlier unavailable'
  }
  const magnitude = Math.abs(change).toFixed(1)
  if (Math.abs(change) <= Number.EPSILON) {
    return 'Unchanged from a year earlier'
  }
  return `${change < 0 ? 'Down' : 'Up'} ${magnitude} percentage ${magnitude === '1.0' ? 'point' : 'points'} from a year earlier`
}

export function createSavingRateAccessibleSummary(
  model: SavingRateContextModel,
): string {
  if (!model.latestObservation) return 'The latest personal saving rate is unavailable.'
  const bands = model.historicalBands.status === 'ready'
    ? `The five-year line runs from ${formatObservationPeriod(model.historicalBands.recentObservations[0]!.date, 'monthly')} through ${formatObservationPeriod(model.historicalBands.latestObservation.date, 'monthly')}. The trailing comparison runs from ${formatObservationPeriod(model.historicalBands.comparisonStart, 'monthly')} through ${formatObservationPeriod(model.historicalBands.comparisonEnd, 'monthly')}. The middle 50% ranges from ${formatPercentage(model.historicalBands.innerLower)} to ${formatPercentage(model.historicalBands.innerUpper)}, and the middle 80% ranges from ${formatPercentage(model.historicalBands.outerLower)} to ${formatPercentage(model.historicalBands.outerUpper)}. `
    : 'Historical percentile ranges are unavailable. '
  const change = model.twelveMonthChange === null
    ? 'The exact change from a year earlier is unavailable. '
    : `The change from a year earlier was ${formatSignedPercentagePoints(model.twelveMonthChange)} percentage points. `
  return `The personal saving rate was ${formatPercentage(model.latestObservation.value)} in ${formatObservationPeriod(model.latestObservation.date, 'monthly')}. ${model.directionStatement} ${change}${bands}${model.levelStatement} Historical bands describe frequency, not a target or a judgment that higher or lower is always better.`
}
