import type {
  EconomicObservation,
  EconomicSeries,
} from '../economic-series/models/economicSeries'
import {
  calculateHistoricalPercentile,
  latestValidObservation,
  selectMonthlyLookback,
  type DashboardThresholdState,
  type HistoricalPercentile,
} from './cpiTileModel'

export interface PayrollTileModel {
  headline: EconomicObservation & { value: number }
  latestMonth: EconomicObservation & { value: number }
  state: DashboardThresholdState
  stateLabel: string
  sparkline: readonly EconomicObservation[]
  derivedHistory: readonly EconomicObservation[]
  historical: HistoricalPercentile
}

function shiftMonth(date: string, offset: number): string {
  const shifted = new Date(`${date}T00:00:00Z`)
  shifted.setUTCMonth(shifted.getUTCMonth() + offset)
  return shifted.toISOString().slice(0, 10)
}

export function deriveThreeMonthPayrollAverage(
  observations: readonly EconomicObservation[],
): readonly EconomicObservation[] {
  const valuesByDate = new Map(observations.map(({ date, value }) => [date, value]))
  return observations.map(({ date }) => {
    const values = [date, shiftMonth(date, -1), shiftMonth(date, -2)]
      .map((month) => valuesByDate.get(month))
    const complete = values.every((value): value is number =>
      value !== null && value !== undefined)
    return {
      date,
      value: complete
        ? values.reduce((sum, value) => sum + value, 0) / 3
        : null,
    }
  })
}

export function describePayrollPace(value: number, percentile: number): string {
  if (value < 0) return 'Shrinking'
  if (value === 0) return 'Flat'
  if (percentile < 25) return 'Growing slowly'
  if (percentile <= 75) return 'Growing'
  return 'Growing strongly'
}

export function classifyPayrollPace(
  value: number,
  percentile: number,
): DashboardThresholdState {
  if (value < 0) return 'notable-bad'
  if (value > 0 && percentile > 75) return 'notable-good'
  return 'normal'
}

export function createPayrollTileModel(series: EconomicSeries): PayrollTileModel {
  const latestMonth = latestValidObservation(series.observations)
  if (!latestMonth) throw new Error('Payroll change has no valid observations')
  const derivedHistory = deriveThreeMonthPayrollAverage(series.observations)
  const headline = latestValidObservation(derivedHistory)
  if (!headline) throw new Error('Payroll change has no complete three-month average')
  const historical = calculateHistoricalPercentile(derivedHistory, headline)

  return {
    headline,
    latestMonth,
    state: classifyPayrollPace(headline.value, historical.percentile),
    stateLabel: describePayrollPace(headline.value, historical.percentile),
    sparkline: selectMonthlyLookback(derivedHistory, headline.date, 5),
    derivedHistory,
    historical,
  }
}
