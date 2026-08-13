import type { EconomicObservation } from '../models/economicSeries'
import { sortObservationsChronologically } from './economicSeries'

export type MortgageRateDirection = 'higher' | 'lower' | 'little-changed'

export interface MortgageRateComparison {
  latest: EconomicObservation & { value: number }
  oneYearEarlier: (EconomicObservation & { value: number }) | null
  fiveYearsEarlier: (EconomicObservation & { value: number }) | null
  oneYearDifference: number | null
  fiveYearDifference: number | null
  direction: MortgageRateDirection
}

function finite(
  observation: EconomicObservation,
): observation is EconomicObservation & { value: number } {
  return observation.value !== null && Number.isFinite(observation.value)
}

function priorComparable(
  observations: readonly (EconomicObservation & { value: number })[],
  latestDate: string,
  years: number,
): (EconomicObservation & { value: number }) | null {
  const target = new Date(`${latestDate}T00:00:00Z`)
  target.setUTCDate(target.getUTCDate() - (52 * 7 * years))
  const targetDate = target.toISOString().slice(0, 10)
  return [...observations].reverse().find(({ date }) => date <= targetDate) ?? null
}

export function deriveMortgageRateComparison(
  observations: readonly EconomicObservation[],
): MortgageRateComparison | null {
  const valid = sortObservationsChronologically(observations).filter(finite)
  const latest = valid.at(-1)
  if (!latest) return null
  const oneYearEarlier = priorComparable(valid, latest.date, 1)
  const fiveYearsEarlier = priorComparable(valid, latest.date, 5)
  const oneYearDifference = oneYearEarlier
    ? latest.value - oneYearEarlier.value
    : null
  const fiveYearDifference = fiveYearsEarlier
    ? latest.value - fiveYearsEarlier.value
    : null
  const direction = oneYearDifference === null || Math.abs(oneYearDifference) < 0.1
    ? 'little-changed'
    : oneYearDifference > 0
      ? 'higher'
      : 'lower'
  return {
    latest,
    oneYearEarlier,
    fiveYearsEarlier,
    oneYearDifference,
    fiveYearDifference,
    direction,
  }
}

export function formatMortgageRateAnswer(model: MortgageRateComparison): string {
  const direction = model.direction === 'little-changed'
    ? 'little changed from a year ago'
    : `${model.direction === 'higher' ? 'up' : 'down'} from a year ago`
  return `The average 30-year fixed mortgage rate is ${model.latest.value.toFixed(1)}%, ${direction}.`
}

export function formatPointDifference(value: number | null): string {
  if (value === null) return 'unavailable'
  const direction = value > 0 ? 'higher' : value < 0 ? 'lower' : 'unchanged'
  if (direction === 'unchanged') return 'unchanged'
  return `${Math.abs(value).toFixed(2)} percentage points ${direction}`
}
