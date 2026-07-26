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

export type UnemploymentLevelState =
  | 'very-low'
  | 'low'
  | 'typical'
  | 'high'
  | 'very-high'
  | 'unavailable'

export type UnemploymentDirectionState =
  | 'rising'
  | 'falling'
  | 'little-changed'
  | 'unavailable'

export interface UnemploymentContextModel {
  latestObservation: (EconomicObservation & { value: number }) | null
  historicalBands: HistoricalBandResult
  levelState: UnemploymentLevelState
  levelStatement: string
  priorYearObservation: (EconomicObservation & { value: number }) | null
  twelveMonthChange: number | null
  directionState: UnemploymentDirectionState
  directionStatement: string
}

export const unemploymentHistoricalBandDefinition: HistoricalBandDefinition = {
  recentObservationCount: 61,
  comparisonWindow: { kind: 'trailing-years', years: 25 },
  innerPercentiles: [25, 75],
  outerPercentiles: [10, 90],
  minimumFiniteObservations: 60,
  latestObservationPolicy: 'last-observation',
}

export const unemploymentDirectionThreshold = 0.3

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

export function classifyUnemploymentLevel(
  historicalBands: HistoricalBandResult,
): UnemploymentLevelState {
  if (historicalBands.status !== 'ready') return 'unavailable'
  const position = classifyHistoricalBandPosition(
    historicalBands.latestObservation.value,
    historicalBands,
  )
  const states = {
    belowOuterBand: 'very-low',
    betweenOuterAndInnerLow: 'low',
    insideInnerBand: 'typical',
    betweenInnerAndOuterHigh: 'high',
    aboveOuterBand: 'very-high',
    unavailable: 'unavailable',
  } as const
  return states[position]
}

export function formatUnemploymentLevel(
  state: UnemploymentLevelState,
): string {
  const statements: Record<UnemploymentLevelState, string> = {
    'very-low': 'Unemployment is very low compared with the past 25 years.',
    low: 'Unemployment is low compared with the past 25 years.',
    typical:
      'Unemployment is near its typical range of the past 25 years.',
    high: 'Unemployment is high compared with the past 25 years.',
    'very-high':
      'Unemployment is very high compared with the past 25 years.',
    unavailable: 'Historical unemployment context is unavailable.',
  }
  return statements[state]
}

export function classifyUnemploymentDirection(
  change: number | null,
): UnemploymentDirectionState {
  if (change === null || !Number.isFinite(change)) return 'unavailable'
  if (change >= unemploymentDirectionThreshold) return 'rising'
  if (change <= -unemploymentDirectionThreshold) return 'falling'
  return 'little-changed'
}

export function formatUnemploymentDirection(
  state: UnemploymentDirectionState,
): string {
  const statements: Record<UnemploymentDirectionState, string> = {
    rising: 'Unemployment has risen over the past year.',
    falling: 'Unemployment has fallen over the past year.',
    'little-changed': 'Unemployment is little changed from a year ago.',
    unavailable:
      'The change from a year ago is unavailable because the exact prior-year observation is missing.',
  }
  return statements[state]
}

export function deriveUnemploymentContext(
  observations: readonly EconomicObservation[],
): UnemploymentContextModel {
  const sorted = sortObservationsChronologically(observations)
  const latest = sorted.at(-1)
  const latestObservation = finiteObservation(latest) ? latest : null
  const historicalBands = deriveHistoricalBandContext(
    sorted,
    unemploymentHistoricalBandDefinition,
  )
  const levelState = classifyUnemploymentLevel(historicalBands)
  const priorYearObservation = latestObservation
    ? sorted.find(({ date }) => date === priorYearDate(latestObservation.date))
    : undefined
  const finitePriorYearObservation = finiteObservation(priorYearObservation)
    ? priorYearObservation
    : null
  const twelveMonthChange = latestObservation && finitePriorYearObservation
    ? latestObservation.value - finitePriorYearObservation.value
    : null
  const directionState = classifyUnemploymentDirection(twelveMonthChange)
  return {
    latestObservation,
    historicalBands,
    levelState,
    levelStatement: formatUnemploymentLevel(levelState),
    priorYearObservation: finitePriorYearObservation,
    twelveMonthChange,
    directionState,
    directionStatement: formatUnemploymentDirection(directionState),
  }
}

export function createUnemploymentAccessibleSummary(
  model: UnemploymentContextModel,
): string {
  if (!model.latestObservation) {
    return 'The latest unemployment rate is unavailable.'
  }
  const bands = model.historicalBands.status === 'ready'
    ? `The trailing comparison runs from ` +
      `${formatObservationPeriod(model.historicalBands.comparisonStart, 'monthly')} ` +
      `through ${formatObservationPeriod(model.historicalBands.comparisonEnd, 'monthly')}. ` +
      `The middle 50% ranges from ${formatPercentage(model.historicalBands.innerLower)} ` +
      `to ${formatPercentage(model.historicalBands.innerUpper)}, and the middle 80% ` +
      `ranges from ${formatPercentage(model.historicalBands.outerLower)} to ` +
      `${formatPercentage(model.historicalBands.outerUpper)}. `
    : 'Historical percentile ranges are unavailable. '
  const change = model.twelveMonthChange === null
    ? 'The exact change from a year earlier is unavailable. '
    : `The rate changed by ${formatSignedPercentagePoints(model.twelveMonthChange)} ` +
      `percentage points from a year earlier. `
  return `The unemployment rate was ` +
    `${formatPercentage(model.latestObservation.value)} in ` +
    `${formatObservationPeriod(model.latestObservation.date, 'monthly')}. ` +
    `The labor force includes employed people plus unemployed people who are ` +
    `available and have recently looked for work. People who want work but are ` +
    `not actively looking are not counted as unemployed. ${bands}` +
    `${model.levelStatement} Lower unemployment readings occupy the lower ` +
    `historical bands. ${change}${model.directionStatement}`
}
