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
import {
  deriveThreeMonthAverageChanges,
} from '../economic-series/utils/payrollCalculations'
import {
  classifyLatestPayrollMonth,
  classifyPayrollTrend,
  shouldMentionLatestPayrollMonth,
  type PayrollLatestMonthState,
  type PayrollTrendState,
} from '../economic-series/utils/payrollGrowthContext'

export { deriveThreeMonthAverageChanges as deriveThreeMonthPayrollAverage }

export interface PayrollTileModel {
  headline: EconomicObservation & { value: number }
  latestMonth: EconomicObservation & { value: number }
  state: DashboardThresholdState
  stateLabel: string
  sparkline: readonly EconomicObservation[]
  derivedHistory: readonly EconomicObservation[]
  historical: HistoricalPercentile
  trendState: PayrollTrendState
  latestMonthState: PayrollLatestMonthState
  mentionLatestMonth: boolean
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
  const derivedHistory = deriveThreeMonthAverageChanges(series.observations)
  const headline = latestValidObservation(derivedHistory)
  if (!headline) throw new Error('Payroll change has no complete three-month average')
  const historical = calculateHistoricalPercentile(derivedHistory, headline)
  const latestMonthState = classifyLatestPayrollMonth(latestMonth.value)
  const trendState = classifyPayrollTrend(
    headline.value,
    historical.percentile > 75 ? 'strong' : 'typical',
  )

  return {
    headline,
    latestMonth,
    state: classifyPayrollPace(headline.value, historical.percentile),
    stateLabel: describePayrollPace(headline.value, historical.percentile),
    sparkline: selectMonthlyLookback(derivedHistory, headline.date, 5),
    derivedHistory,
    historical,
    trendState,
    latestMonthState,
    mentionLatestMonth: shouldMentionLatestPayrollMonth(
      headline.value,
      latestMonth.value,
    ),
  }
}
