import type { EconomicObservation } from '../models/economicSeries'
import { sortObservationsChronologically } from '../utils/economicSeries'

export type ChartDataPoint = [date: string, value: number | null]

export function adaptObservationsToChartData(
  observations: readonly EconomicObservation[],
): ChartDataPoint[] {
  return sortObservationsChronologically(observations).map(
    ({ date, value }): ChartDataPoint => [date, value],
  )
}
