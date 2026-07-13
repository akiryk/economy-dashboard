import type { EconomicSeries } from '../models/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type ChartSummary,
  type TimeRange,
} from './chartData'

export interface WageComparisonObservation {
  date: string
  nominalWageGrowth: number | null
  cpiInflation: number | null
  realWageGrowth: number | null
}

export function alignWageComparisonObservations(
  realWageGrowth: EconomicSeries,
  nominalWageGrowth: EconomicSeries,
  cpiInflation: EconomicSeries,
): WageComparisonObservation[] {
  const nominalByDate = new Map(
    nominalWageGrowth.observations.map((item) => [item.date, item.value]),
  )
  const inflationByDate = new Map(
    cpiInflation.observations.map((item) => [item.date, item.value]),
  )

  return [...realWageGrowth.observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter(
      (item) => nominalByDate.has(item.date) && inflationByDate.has(item.date),
    )
    .map((item) => ({
      date: item.date,
      nominalWageGrowth: nominalByDate.get(item.date) ?? null,
      cpiInflation: inflationByDate.get(item.date) ?? null,
      realWageGrowth: item.value,
    }))
}

export function filterWageComparisonByTimeRange(
  observations: readonly WageComparisonObservation[],
  range: TimeRange,
): WageComparisonObservation[] {
  const visibleDates = new Set(
    filterObservationsByTimeRange(
      observations.map((item) => ({ date: item.date, value: item.realWageGrowth })),
      range,
    ).map((item) => item.date),
  )
  return observations
    .filter((item) => visibleDates.has(item.date))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function calculateWageComparisonSummary(
  observations: readonly WageComparisonObservation[],
): ChartSummary {
  return calculateChartSummary(
    observations.map((item) => ({ date: item.date, value: item.realWageGrowth })),
  )
}
