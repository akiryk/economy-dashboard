import type { EconomicObservation } from '../models/economicSeries'
import { classifyHistoricalBandPosition, type HistoricalBandModel } from './historicalBandContext'
import { formatObservationPeriod, formatSignedPercentage } from './economicSeries'

export type ManufacturingDirection = 'more' | 'flat' | 'less'

function shiftedMonth(date: string, months: number): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCMonth(parsed.getUTCMonth() + months)
  return parsed.toISOString().slice(0, 10)
}

export function deriveManufacturingOutputGrowth(
  observations: readonly EconomicObservation[],
): { averages: EconomicObservation[]; growth: EconomicObservation[] } {
  const source = new Map(observations.map(({ date, value }) => [date, value]))
  const averages = observations.map(({ date }) => {
    const values = [-2, -1, 0].map((offset) => source.get(shiftedMonth(date, offset)))
    return {
      date,
      value: values.every((value): value is number => value !== null && value !== undefined && Number.isFinite(value))
        ? values.reduce((sum, value) => sum + value, 0) / 3
        : null,
    }
  })
  const averageByDate = new Map(averages.map(({ date, value }) => [date, value]))
  return {
    averages,
    growth: averages.map(({ date, value }) => {
      const prior = averageByDate.get(shiftedMonth(date, -12))
      return {
        date,
        value: value === null || prior === null || prior === undefined || prior === 0
          ? null
          : (value / prior - 1) * 100,
      }
    }),
  }
}

export function classifyManufacturingDirection(value: number | null): ManufacturingDirection | null {
  if (value === null || !Number.isFinite(value)) return null
  if (value > 0.2) return 'more'
  if (value < -0.2) return 'less'
  return 'flat'
}

export function formatManufacturingDirection(value: number | null): string {
  const state = classifyManufacturingDirection(value)
  if (state === 'more') return 'Yes — U.S. manufacturers are producing more than a year ago.'
  if (state === 'less') return 'No — U.S. manufacturers are producing less than a year ago.'
  if (state === 'flat') return 'About flat — U.S. manufacturers are producing about the same amount as a year ago.'
  return 'The current manufacturing-production direction is unavailable.'
}

const historicalLabels = {
  belowOuterBand: 'very weak',
  betweenOuterAndInnerLow: 'weak',
  insideInnerBand: 'typical',
  betweenInnerAndOuterHigh: 'strong',
  aboveOuterBand: 'very strong',
} as const

export function formatManufacturingHistoricalPosition(
  value: number | null,
  model: HistoricalBandModel,
): string {
  const state = classifyHistoricalBandPosition(value, model)
  return state === 'unavailable' ? 'unavailable' : historicalLabels[state]
}

export function createManufacturingAccessibleSummary(
  model: HistoricalBandModel,
): string {
  const first = model.recentObservations[0]
  const latest = model.latestObservation
  return `${formatSignedPercentage(latest.value)} in ${formatObservationPeriod(latest.date, 'monthly')}. ${formatManufacturingDirection(latest.value)} The growth rate is ${formatManufacturingHistoricalPosition(latest.value, model)} by the standards of the past 25 years. The compact chart runs from ${first ? formatObservationPeriod(first.date, 'monthly') : 'an unavailable month'} through ${formatObservationPeriod(latest.date, 'monthly')}. It measures the inflation-adjusted volume of manufacturing production, not employment, sales revenue, or prices.`
}
