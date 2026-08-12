import type { EconomicSeries } from '../features/economic-series/models/economicSeries'
import {
  findLatestNonNullObservation,
  formatObservationPeriod,
} from '../features/economic-series/utils/economicSeries'

export interface LoadedPeriod {
  date: string
  label: string
}

export function updateLoadedPeriod(
  current: Readonly<Record<string, LoadedPeriod>>,
  slug: string,
  series: EconomicSeries | null,
): Readonly<Record<string, LoadedPeriod>> {
  const latest = series
    ? findLatestNonNullObservation(series.observations)
    : null
  if (latest && series) {
    const period = {
      date: latest.date,
      label: formatObservationPeriod(latest.date, series.frequency),
    }
    return current[slug]?.date === period.date &&
      current[slug]?.label === period.label
      ? current
      : { ...current, [slug]: period }
  }
  if (!(slug in current)) return current
  const next = { ...current }
  delete next[slug]
  return next
}
