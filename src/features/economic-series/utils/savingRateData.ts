import type { EconomicObservation } from '../models/economicSeries'

function shiftYear(date: string): string {
  return `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`
}

export function savingRateChanges(
  observations: readonly EconomicObservation[],
) {
  const byDate = new Map(observations.map((item) => [item.date, item.value]))
  return observations.map((item) => {
    const prior = byDate.get(shiftYear(item.date))
    return {
      ...item,
      change:
        item.value !== null && prior !== null && prior !== undefined
          ? item.value - prior
          : null,
    }
  })
}
