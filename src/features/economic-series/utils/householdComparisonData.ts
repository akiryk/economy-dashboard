import type { EconomicSeries } from '../models/economicSeries'
import { filterObservationsByTimeRange, type TimeRange } from './chartData'

export interface HouseholdComparisonObservation {
  date: string
  incomeGrowth: number | null
  spendingGrowth: number | null
  gap: number | null
}

export function alignHouseholdComparison(
  income: EconomicSeries,
  spending: EconomicSeries,
): HouseholdComparisonObservation[] {
  const spendingByDate = new Map(
    spending.observations.map((item) => [item.date, item.value]),
  )
  return [...income.observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((item) => spendingByDate.has(item.date))
    .map((item) => {
      const spendingGrowth = spendingByDate.get(item.date) ?? null
      return {
        date: item.date,
        incomeGrowth: item.value,
        spendingGrowth,
        gap:
          item.value !== null && spendingGrowth !== null
            ? spendingGrowth - item.value
            : null,
      }
    })
}

export function filterHouseholdComparison(
  observations: readonly HouseholdComparisonObservation[],
  range: TimeRange,
): HouseholdComparisonObservation[] {
  const dates = new Set(
    filterObservationsByTimeRange(
      observations.map((item) => ({ date: item.date, value: item.incomeGrowth })),
      range,
    ).map((item) => item.date),
  )
  return observations.filter((item) => dates.has(item.date))
}
