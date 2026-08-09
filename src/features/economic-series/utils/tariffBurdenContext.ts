import type { EconomicObservation } from '../models/economicSeries'
import type { HistoricalBandModel, HistoricalBandPosition } from './historicalBandContext'
import { classifyHistoricalBandPosition } from './historicalBandContext'
import { formatObservationPeriod, formatPercentage, sortObservationsChronologically } from './economicSeries'

export function formatTariffPerHundred(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? 'The amount collected per $100 of imported goods is unavailable.'
    : `Customs duties collected were equal to about $${Number(value.toFixed(1)).toFixed(2)} for every $100 of imported goods.`
}

export function formatTariffHistoricalPosition(model: HistoricalBandModel | null): string {
  if (!model) return 'Historical comparison is unavailable.'
  const scale: Record<Exclude<HistoricalBandPosition, 'unavailable'>, string> = {
    belowOuterBand: 'very low', betweenOuterAndInnerLow: 'low', insideInnerBand: 'typical',
    betweenInnerAndOuterHigh: 'high', aboveOuterBand: 'very high',
  }
  const position = classifyHistoricalBandPosition(model.latestObservation.value, model)
  return position === 'unavailable' ? 'Historical comparison is unavailable.' : `The realized tariff burden is ${scale[position]} by the standards of the available history.`
}

export function formatTariffDirection(observations: readonly EconomicObservation[]): string {
  const sorted = sortObservationsChronologically(observations)
  const latest = [...sorted].reverse().find((item): item is EconomicObservation & { value: number } => item.value !== null)
  if (!latest) return 'Recent direction is unavailable.'
  const yearAgoDate = `${Number(latest.date.slice(0, 4)) - 1}${latest.date.slice(4)}`
  const yearAgo = sorted.find(({ date }) => date === yearAgoDate)?.value
  if (yearAgo === null || yearAgo === undefined) return 'Recent direction is unavailable.'
  const cutoff = `${Number(latest.date.slice(0, 4)) - 5}${latest.date.slice(4)}`
  const peak = Math.max(...sorted.filter(({ date, value }) => date >= cutoff && date <= latest.date && value !== null).map(({ value }) => value!))
  const change = latest.value - yearAgo
  if (Math.abs(change) < 0.2) return 'The burden is little changed from a year ago.'
  if (change < 0) return 'The burden has declined from a year ago.'
  return peak - latest.value <= 0.3
    ? 'The burden has risen sharply and is near its recent peak.'
    : 'The burden is much higher than a year ago but below its recent peak.'
}

export function createTariffAccessibleSummary(model: HistoricalBandModel, direction: string): string {
  const first = model.recentObservations[0]
  return `The realized tariff burden was ${formatPercentage(model.latestObservation.value)} in ${formatObservationPeriod(model.latestObservation.date, 'quarterly')}. ${formatTariffPerHundred(model.latestObservation.value)} ${formatTariffHistoricalPosition(model)} ${direction} The compact chart runs from ${first ? formatObservationPeriod(first.date, 'quarterly') : 'an unavailable quarter'} through ${formatObservationPeriod(model.latestObservation.date, 'quarterly')}.`
}
