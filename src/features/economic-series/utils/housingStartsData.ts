import type { EconomicObservation } from '../models/economicSeries'
import { classifyHistoricalBandPosition, type HistoricalBandModel } from './historicalBandContext'
import { formatAnnualizedHousingUnits, formatObservationPeriod } from './economicSeries'

export interface HousingStartsCompactData {
  rawAverages: EconomicObservation[]
  normalizedAverages: EconomicObservation[]
}

function averageThreeMonths(
  observations: readonly EconomicObservation[],
): EconomicObservation[] {
  const values = new Map(observations.map(({ date, value }) => [date, value]))
  return observations.map(({ date }) => {
    const current = new Date(`${date}T00:00:00Z`)
    const dates = [2, 1, 0].map((offset) => {
      const month = new Date(current)
      month.setUTCMonth(month.getUTCMonth() - offset)
      return month.toISOString().slice(0, 10)
    })
    const window = dates.map((month) => values.get(month))
    return {
      date,
      value: window.every((value): value is number =>
        value !== null && value !== undefined && Number.isFinite(value))
        ? window.reduce((sum, value) => sum + value, 0) / 3
        : null,
    }
  })
}

export function deriveHousingStartsCompactData(
  starts: readonly EconomicObservation[],
  population: readonly EconomicObservation[],
): HousingStartsCompactData {
  const populationByDate = new Map(population.map(({ date, value }) => [date, value]))
  const normalized = starts.map(({ date, value }) => {
    const populationThousands = populationByDate.get(date)
    return {
      date,
      value: value === null || populationThousands === null ||
        populationThousands === undefined || populationThousands <= 0
        ? null
        : (value / populationThousands) * 1000,
    }
  })
  return {
    rawAverages: averageThreeMonths(starts),
    normalizedAverages: averageThreeMonths(normalized),
  }
}

const positionLabels = {
  belowOuterBand: 'very low',
  betweenOuterAndInnerLow: 'low',
  insideInnerBand: 'typical',
  betweenInnerAndOuterHigh: 'high',
  aboveOuterBand: 'very high',
} as const

export function formatHousingStartsHistoricalPosition(
  value: number | null,
  model: HistoricalBandModel,
): string {
  const position = classifyHistoricalBandPosition(value, model)
  return position === 'unavailable'
    ? 'Historical position unavailable'
    : positionLabels[position]
}

export function createHousingStartsAccessibleSummary(
  model: HistoricalBandModel,
  rawAverages: readonly EconomicObservation[],
): string {
  const raw = rawAverages.find(({ date }) => date === model.latestObservation.date)?.value ?? null
  const first = model.recentObservations[0]
  return `The three-month average annualized housing-start pace was ${formatAnnualizedHousingUnits(raw)} in ${formatObservationPeriod(model.latestObservation.date, 'monthly')}. The population-normalized pace was ${model.latestObservation.value.toFixed(2)} starts per 1,000 residents, which is ${formatHousingStartsHistoricalPosition(model.latestObservation.value, model)} by historical standards. The compact line runs from ${first ? formatObservationPeriod(first.date, 'monthly') : 'an unavailable month'} through ${formatObservationPeriod(model.latestObservation.date, 'monthly')}; the line and historical bands use population-normalized data.`
}
