import type { EconomicObservation } from '../models/economicSeries'
import type { HistoricalBandModel } from './historicalBandContext'
import { classifyHistoricalBandPosition } from './historicalBandContext'
import { formatObservationPeriod, formatPercentage } from './economicSeries'

export interface FederalDebtContext {
  latestObservation: (EconomicObservation & { value: number }) | null
  fiveYearChange: number | null
  outputComparison: string
  directionStatement: string
}

export function formatFederalDebtOutputComparison(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'The comparison with annual U.S. economic output is unavailable.'
  const scale = value < 50
    ? 'less than half of one year of U.S. economic output'
    : value < 90
      ? 'more than half, but less than one year of U.S. economic output'
      : value <= 110
        ? 'approximately equal to one year of U.S. economic output'
        : 'greater than one year of U.S. economic output'
  return `Federal debt held by the public is ${scale}.`
}

export function formatFederalDebtDirection(change: number | null): string {
  if (change === null || !Number.isFinite(change)) return 'The five-year change is unavailable.'
  if (Math.abs(change) < 1) return 'The ratio is little changed from five years ago.'
  const magnitude = Math.abs(change).toFixed(1)
  return change > 0
    ? `The ratio has risen by ${magnitude} percentage points over the past five years.`
    : `The ratio has fallen by ${magnitude} percentage points over the past five years.`
}

export function formatFederalDebtHistoricalPosition(model: HistoricalBandModel | null): string {
  if (!model) return 'The debt ratio’s historical position is unavailable.'
  const labels = {
    belowOuterBand: 'very low',
    betweenOuterAndInnerLow: 'low',
    insideInnerBand: 'typical',
    betweenInnerAndOuterHigh: 'high',
    aboveOuterBand: 'very high',
  } as const
  const position = classifyHistoricalBandPosition(model.latestObservation.value, model)
  return position === 'unavailable'
    ? 'The debt ratio’s historical position is unavailable.'
    : `The debt ratio is ${labels[position]} by postwar standards.`
}

export function deriveFederalDebtContext(observations: readonly EconomicObservation[]): FederalDebtContext {
  const finite = observations.filter(
    (observation): observation is EconomicObservation & { value: number } =>
      observation.value !== null && Number.isFinite(observation.value),
  )
  const latestObservation = finite.at(-1) ?? null
  const priorDate = latestObservation
    ? `${Number(latestObservation.date.slice(0, 4)) - 5}${latestObservation.date.slice(4)}`
    : null
  const prior = priorDate ? finite.find(({ date }) => date === priorDate) : null
  const fiveYearChange = latestObservation && prior
    ? latestObservation.value - prior.value
    : null
  return {
    latestObservation,
    fiveYearChange,
    outputComparison: formatFederalDebtOutputComparison(latestObservation?.value ?? null),
    directionStatement: formatFederalDebtDirection(fiveYearChange),
  }
}

export function createFederalDebtAccessibleSummary(
  context: FederalDebtContext,
  model: HistoricalBandModel,
): string {
  const first = model.recentObservations[0]
  return `Federal debt held by the public was ${formatPercentage(context.latestObservation?.value ?? null)} in ${context.latestObservation ? formatObservationPeriod(context.latestObservation.date, 'quarterly') : 'an unavailable quarter'}. ${context.outputComparison} ${formatFederalDebtHistoricalPosition(model)} ${context.directionStatement} The chart runs from ${first ? formatObservationPeriod(first.date, 'quarterly') : 'an unavailable quarter'} through ${formatObservationPeriod(model.latestObservation.date, 'quarterly')}.`
}
