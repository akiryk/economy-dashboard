import type { EconomicObservation } from '../models/economicSeries'
import { sortObservationsChronologically } from './economicSeries'

export interface RateComparisonObservation {
  date: string
  federalFundsRate: number
  treasuryYield: number
  difference: number
}

export function alignRateObservations(
  federalFunds: readonly EconomicObservation[],
  treasury: readonly EconomicObservation[],
): RateComparisonObservation[] {
  const treasuryByDate = new Map(treasury.map((item) => [item.date, item.value]))
  return sortObservationsChronologically(federalFunds).flatMap((item) => {
    const treasuryYield = treasuryByDate.get(item.date)
    if (item.value === null || treasuryYield === null || treasuryYield === undefined) return []
    return [{
      date: item.date,
      federalFundsRate: item.value,
      treasuryYield,
      difference: treasuryYield - item.value,
    }]
  })
}

export function rateComparisonSeries(
  observations: readonly RateComparisonObservation[],
  key: 'federalFundsRate' | 'treasuryYield',
): EconomicObservation[] {
  return observations.map((item) => ({ date: item.date, value: item[key] }))
}
