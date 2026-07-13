import type { EconomicSeries } from '../models/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type ChartSummary,
  type TimeRange,
} from './chartData'

export interface InflationComparisonObservation {
  date: string
  headline: number | null
  core: number | null
  difference: number | null
}

export function alignInflationObservations(
  headline: EconomicSeries,
  core: EconomicSeries,
): InflationComparisonObservation[] {
  const headlineByDate = new Map(
    headline.observations.map((item) => [item.date, item.value]),
  )
  return [...core.observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((item) => headlineByDate.has(item.date))
    .map((item) => {
      const headlineValue = headlineByDate.get(item.date) ?? null
      const difference =
        item.value !== null && headlineValue !== null
          ? item.value - headlineValue
          : null
      return {
        date: item.date,
        headline: headlineValue,
        core: item.value,
        difference,
      }
    })
}

export function filterInflationComparisonByTimeRange(
  observations: readonly InflationComparisonObservation[],
  range: TimeRange,
): InflationComparisonObservation[] {
  const validShared = observations.filter(
    (item) => item.headline !== null && item.core !== null,
  )
  const visibleDates = new Set(
    filterObservationsByTimeRange(
      validShared.map((item) => ({ date: item.date, value: item.core })),
      range,
    ).map((item) => item.date),
  )
  const firstVisibleDate = [...visibleDates].sort()[0]
  const lastVisibleDate = [...visibleDates].sort().at(-1)
  if (!firstVisibleDate || !lastVisibleDate) return []
  return observations
    .filter(
      (item) => item.date >= firstVisibleDate && item.date <= lastVisibleDate,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function calculateInflationComparisonSummary(
  observations: readonly InflationComparisonObservation[],
): ChartSummary {
  return calculateChartSummary(
    observations.map((item) => ({ date: item.date, value: item.core })),
  )
}

export function latestSharedInflationObservation(
  observations: readonly InflationComparisonObservation[],
): InflationComparisonObservation | null {
  return (
    [...observations]
      .sort((a, b) => b.date.localeCompare(a.date))
      .find((item) => item.headline !== null && item.core !== null) ?? null
  )
}

export function coreValueThreeMonthsEarlier(
  observations: readonly InflationComparisonObservation[],
  date: string,
): number | null {
  const prior = new Date(`${date}T00:00:00Z`)
  prior.setUTCMonth(prior.getUTCMonth() - 3)
  const priorDate = prior.toISOString().slice(0, 10)
  return observations.find((item) => item.date === priorDate)?.core ?? null
}
