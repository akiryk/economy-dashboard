import type { HistoricalBandModel, HistoricalBandPosition } from './historicalBandContext'
import { classifyHistoricalBandPosition } from './historicalBandContext'
import { formatObservationPeriod, formatPercentage } from './economicSeries'

export const homeOwnershipAffordabilityThreshold = 30

export type HomeOwnershipAffordabilityState = 'affordable' | 'not-affordable' | 'unavailable'

export function classifyHomeOwnershipAffordability(value: number | null): HomeOwnershipAffordabilityState {
  if (value === null || !Number.isFinite(value)) return 'unavailable'
  return value <= homeOwnershipAffordabilityThreshold ? 'affordable' : 'not-affordable'
}

export function formatHomeOwnershipAffordabilityAnswer(value: number | null): string {
  const state = classifyHomeOwnershipAffordability(value)
  if (state === 'unavailable') return 'Modeled affordability is unavailable.'
  return state === 'affordable'
    ? 'The median-priced home is affordable for a median-income household under this model.'
    : 'The median-priced home is not affordable for a median-income household under this model.'
}

export function formatHomeOwnershipThresholdContext(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Comparison with the 30% affordability threshold is unavailable.'
  const difference = value - homeOwnershipAffordabilityThreshold
  if (difference > 0) return 'Estimated ownership costs are well above the 30% affordability threshold.'
  if (difference >= -2) return 'Estimated ownership costs are near the 30% affordability threshold.'
  return 'Estimated ownership costs are comfortably below the 30% affordability threshold.'
}

const historicalDescriptions: Record<Exclude<HistoricalBandPosition, 'unavailable'>, string> = {
  belowOuterBand: 'The required income share is very low compared with the available history.',
  betweenOuterAndInnerLow: 'The required income share is low compared with the available history.',
  insideInnerBand: 'The required income share is typical compared with the available history.',
  betweenInnerAndOuterHigh: 'The required income share is high compared with the available history.',
  aboveOuterBand: 'The required income share is very high compared with the available history.',
}

export function formatHomeOwnershipHistoricalPosition(model: HistoricalBandModel): string {
  const position = classifyHistoricalBandPosition(model.latestObservation.value, model)
  return position === 'unavailable'
    ? 'Historical affordability context is unavailable.'
    : historicalDescriptions[position]
}

export function formatHomeOwnershipPointDifference(value: number): string {
  const difference = value - homeOwnershipAffordabilityThreshold
  if (difference === 0) return '0.0 percentage points at threshold'
  return `${Math.abs(difference).toFixed(1)} percentage points ${difference > 0 ? 'above' : 'below'} threshold`
}

export function createHomeOwnershipAccessibleSummary(model: HistoricalBandModel): string {
  const first = model.recentObservations.find(({ value }) => value !== null)
  const usesTrailingWindow = model.comparisonStart !== model.recentObservations[0]?.date &&
    new Date(`${model.latestObservation.date}T00:00:00Z`).getUTCFullYear() -
      new Date(`${model.comparisonStart}T00:00:00Z`).getUTCFullYear() >= 25
  return `Modeled ownership costs were ${formatPercentage(model.latestObservation.value)} in ${formatObservationPeriod(model.latestObservation.date, 'monthly')}, ${model.latestObservation.value > homeOwnershipAffordabilityThreshold ? 'above' : 'at or below'} the 30% affordability threshold. ${formatHomeOwnershipHistoricalPosition(model)} The compact line runs from ${first ? formatObservationPeriod(first.date, 'monthly') : 'an unavailable date'} through ${formatObservationPeriod(model.latestObservation.date, 'monthly')}. Historical bands use ${usesTrailingWindow ? 'the trailing 25 years' : `available history since ${new Date(`${model.comparisonStart}T00:00:00Z`).getUTCFullYear()}`}.`
}
