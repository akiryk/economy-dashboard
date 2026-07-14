import type { EconomicObservation } from '../models/economicSeries'

export interface NormalizedProductivityObservation extends EconomicObservation {
  changeFromBaseline: number | null
}

export function normalizeProductivityRange(
  observations: readonly EconomicObservation[],
): NormalizedProductivityObservation[] {
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date))
  const baseline = sorted.find(
    (item) => item.value !== null && Number.isFinite(item.value) && item.value !== 0,
  )?.value
  if (baseline === null || baseline === undefined) {
    return sorted.map((item) => ({ ...item, value: null, changeFromBaseline: null }))
  }
  return sorted.map((item) => {
    const value = item.value === null ? null : (item.value / baseline) * 100
    return { date: item.date, value, changeFromBaseline: value === null ? null : value - 100 }
  })
}

export function cumulativeProductivityChange(
  observations: readonly EconomicObservation[],
): number | null {
  const normalized = normalizeProductivityRange(observations)
  return normalized.at(-1)?.changeFromBaseline ?? null
}

function shiftQuarterYear(date: string): string {
  return `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`
}

export interface ProductivityMomentumObservation extends EconomicObservation {
  momentumChange: number | null
}

export function calculateProductivityMomentum(
  observations: readonly EconomicObservation[],
): ProductivityMomentumObservation[] {
  const valuesByDate = new Map(observations.map((item) => [item.date, item.value]))
  return observations.map((item) => {
    const prior = valuesByDate.get(shiftQuarterYear(item.date))
    return {
      ...item,
      momentumChange:
        item.value !== null && prior !== null && prior !== undefined
          ? item.value - prior
          : null,
    }
  })
}
