import type { EconomicSeries } from '../models/economicSeries'
import type { TimeRange } from './chartData'

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
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date))
  const latest = [...sorted].reverse().find(
    (item) => item.incomeGrowth !== null && item.spendingGrowth !== null,
  )
  if (!latest) return []
  if (range === 'max') return sorted.filter((item) => item.date <= latest.date)
  const years = range === '5y' ? 5 : range === '10y' ? 10 : 20
  const boundary = new Date(`${latest.date}T00:00:00Z`)
  boundary.setUTCFullYear(boundary.getUTCFullYear() - years)
  const boundaryDate = boundary.toISOString().slice(0, 10)
  return sorted.filter((item) => item.date >= boundaryDate && item.date <= latest.date)
}
