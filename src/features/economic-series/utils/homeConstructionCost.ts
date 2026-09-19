import type { EconomicObservation } from '../models/economicSeries'

export interface HomeConstructionCostContext {
  latestDate: string
  latestIndex: number
  cumulativeSinceBase: number
  monthChange: number | null
  yearChange: number | null
  tenYearChange: number | null
  twentyYearChange: number | null
}

function dateMonthsEarlier(date: string, months: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCMonth(value.getUTCMonth() - months)
  return value.toISOString().slice(0, 10)
}

function percentChange(current: number, prior: number | null | undefined): number | null {
  return prior === null || prior === undefined || prior === 0
    ? null
    : ((current / prior) - 1) * 100
}

export function deriveHomeConstructionCostContext(
  observations: readonly EconomicObservation[],
): HomeConstructionCostContext | null {
  const latest = [...observations].reverse().find(({ value }) => value !== null)
  if (!latest || latest.value === null) return null
  const values = new Map(observations.map(({ date, value }) => [date, value]))
  return {
    latestDate: latest.date,
    latestIndex: latest.value,
    cumulativeSinceBase: latest.value - 100,
    monthChange: percentChange(latest.value, values.get(dateMonthsEarlier(latest.date, 1))),
    yearChange: percentChange(latest.value, values.get(dateMonthsEarlier(latest.date, 12))),
    tenYearChange: percentChange(latest.value, values.get(dateMonthsEarlier(latest.date, 120))),
    twentyYearChange: percentChange(latest.value, values.get(dateMonthsEarlier(latest.date, 240))),
  }
}
