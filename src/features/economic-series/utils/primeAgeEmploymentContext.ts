import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
  sortObservationsChronologically,
} from './economicSeries'
import {
  classifyHistoricalBandPosition,
  deriveHistoricalBandContext,
  type HistoricalBandDefinition,
  type HistoricalBandResult,
} from './historicalBandContext'

export type PrimeAgeEmploymentLevelState =
  | 'very-low'
  | 'low'
  | 'typical'
  | 'high'
  | 'very-high'
  | 'unavailable'

export interface PrimeAgeEmploymentContextModel {
  latestObservation: (EconomicObservation & { value: number }) | null
  historicalBands: HistoricalBandResult
  levelState: PrimeAgeEmploymentLevelState
  levelStatement: string
}

export const primeAgeEmploymentHistoricalBandDefinition:
HistoricalBandDefinition = {
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

export function classifyPrimeAgeEmploymentLevel(
  historicalBands: HistoricalBandResult,
): PrimeAgeEmploymentLevelState {
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

export function formatPrimeAgeEmploymentLevel(
  state: PrimeAgeEmploymentLevelState,
): string {
  const statements: Record<PrimeAgeEmploymentLevelState, string> = {
    'very-low':
      'Prime-age employment is very low compared with the past 25 years.',
    low: 'Prime-age employment is low compared with the past 25 years.',
    typical:
      'Prime-age employment is near its typical range of the past 25 years.',
    high: 'Prime-age employment is high compared with the past 25 years.',
    'very-high':
      'Prime-age employment is very high compared with the past 25 years.',
    unavailable: 'Historical prime-age employment context is unavailable.',
  }
  return statements[state]
}

export function derivePrimeAgeEmploymentContext(
  observations: readonly EconomicObservation[],
): PrimeAgeEmploymentContextModel {
  const sorted = sortObservationsChronologically(observations)
  const latest = sorted.at(-1)
  const latestObservation = finiteObservation(latest) ? latest : null
  const historicalBands = deriveHistoricalBandContext(
    sorted,
    primeAgeEmploymentHistoricalBandDefinition,
  )
  const levelState = classifyPrimeAgeEmploymentLevel(historicalBands)
  return {
    latestObservation,
    historicalBands,
    levelState,
    levelStatement: formatPrimeAgeEmploymentLevel(levelState),
  }
}

export function createPrimeAgeEmploymentAccessibleSummary(
  model: PrimeAgeEmploymentContextModel,
): string {
  if (!model.latestObservation) {
    return 'The latest prime-age employment ratio is unavailable.'
  }
  const bands = model.historicalBands.status === 'ready'
    ? `The latest five-year line runs from ` +
      `${formatObservationPeriod(model.historicalBands.recentObservations[0]!.date, 'monthly')} ` +
      `through ${formatObservationPeriod(model.historicalBands.latestObservation.date, 'monthly')}. ` +
      `The trailing comparison runs from ` +
      `${formatObservationPeriod(model.historicalBands.comparisonStart, 'monthly')} ` +
      `through ${formatObservationPeriod(model.historicalBands.comparisonEnd, 'monthly')}. ` +
      `The middle 50% ranges from ${formatPercentage(model.historicalBands.innerLower)} ` +
      `to ${formatPercentage(model.historicalBands.innerUpper)}, and the middle 80% ` +
      `ranges from ${formatPercentage(model.historicalBands.outerLower)} to ` +
      `${formatPercentage(model.historicalBands.outerUpper)}. `
    : 'Historical percentile ranges are unavailable. '
  return `The prime-age employment ratio was ` +
    `${formatPercentage(model.latestObservation.value)} in ` +
    `${formatObservationPeriod(model.latestObservation.date, 'monthly')}. ` +
    `Prime age means adults ages 25 through 54. ${bands}` +
    `${model.levelStatement} Higher readings occupy the higher historical ` +
    `bands. This measure does not describe hours, pay, job quality, or why ` +
    `someone is not employed.`
}
