import type { EconomicObservation } from '../models/economicSeries'

export interface HomeConstructionCostContext {
  latestDate: string
  latestIndex: number
  monthChange: number
  yearChange: number
  realYearChange: number
}

function dateMonthsEarlier(date: string, months: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCMonth(value.getUTCMonth() - months)
  return value.toISOString().slice(0, 10)
}

export function deriveYearOverYearChanges(
  observations: readonly EconomicObservation[],
): EconomicObservation[] {
  const values = new Map(observations.map(({ date, value }) => [date, value]))
  return observations.map(({ date, value }) => {
    const prior = values.get(dateMonthsEarlier(date, 12))
    return {
      date,
      value: value === null || prior === null || prior === undefined || prior === 0
        ? null
        : ((value / prior) - 1) * 100,
    }
  })
}

export function deriveHomeConstructionCostContext(
  nominal: readonly EconomicObservation[],
  real: readonly EconomicObservation[],
): HomeConstructionCostContext | null {
  const latest = [...nominal].reverse().find(({ value }) => value !== null)
  if (!latest || latest.value === null) return null
  const nominalByDate = new Map(nominal.map(({ date, value }) => [date, value]))
  const realByDate = new Map(real.map(({ date, value }) => [date, value]))
  const previous = nominalByDate.get(dateMonthsEarlier(latest.date, 1))
  const priorYear = nominalByDate.get(dateMonthsEarlier(latest.date, 12))
  const latestReal = realByDate.get(latest.date)
  const priorReal = realByDate.get(dateMonthsEarlier(latest.date, 12))
  if (
    previous === null || previous === undefined || previous === 0 ||
    priorYear === null || priorYear === undefined || priorYear === 0 ||
    latestReal === null || latestReal === undefined ||
    priorReal === null || priorReal === undefined || priorReal === 0
  ) return null
  return {
    latestDate: latest.date,
    latestIndex: latest.value,
    monthChange: ((latest.value / previous) - 1) * 100,
    yearChange: ((latest.value / priorYear) - 1) * 100,
    realYearChange: ((latestReal / priorReal) - 1) * 100,
  }
}
