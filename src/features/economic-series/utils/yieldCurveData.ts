import type { EconomicObservation } from '../models/economicSeries'
import { formatSignedPercentagePoints } from './economicSeries'

export interface YieldCurveObservation extends EconomicObservation {
  tenYearYield: number | null
  threeMonthRate: number | null
  monthlySpread: number | null
}

export type YieldCurveState = 'inverted' | 'nearly-flat' | 'upward-sloping' | 'unavailable'

function previousMonth(date: string, months: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCMonth(value.getUTCMonth() - months)
  return value.toISOString().slice(0, 10)
}

export function deriveYieldCurveObservations(
  tenYear: readonly EconomicObservation[],
  threeMonth: readonly EconomicObservation[],
): YieldCurveObservation[] {
  const shortByDate = new Map(threeMonth.map(({ date, value }) => [date, value]))
  const monthly = tenYear.map(({ date, value }) => {
    const short = shortByDate.get(date)
    const validShort = short === undefined ? null : short
    return {
      date,
      tenYearYield: value,
      threeMonthRate: validShort,
      monthlySpread: value === null || validShort === null ? null : value - validShort,
    }
  })
  const spreadByDate = new Map(monthly.map(({ date, monthlySpread }) => [date, monthlySpread]))
  return monthly.map((item) => {
    const values = [item.date, previousMonth(item.date, 1), previousMonth(item.date, 2)]
      .map((date) => spreadByDate.get(date))
    const complete = values.every((value): value is number => value !== null && value !== undefined)
    return { ...item, value: complete ? values.reduce((sum, value) => sum + value, 0) / 3 : null }
  })
}

export function classifyYieldCurve(value: number | null): YieldCurveState {
  if (value === null) return 'unavailable'
  if (value < -0.1) return 'inverted'
  if (value > 0.1) return 'upward-sloping'
  return 'nearly-flat'
}

export function formatYieldCurveAnswer(value: number | null): string {
  const state = classifyYieldCurve(value)
  if (state === 'inverted') return `Yes — the 3-month Treasury rate is ${Math.abs(value!).toFixed(1)} percentage points above the 10-year Treasury yield.`
  if (state === 'upward-sloping') return `No — the 10-year Treasury yield is ${Math.abs(value!).toFixed(1)} percentage points above the 3-month Treasury rate.`
  if (state === 'nearly-flat') return 'Nearly flat — the 10-year and 3-month Treasury rates are very close.'
  return 'The current yield-curve state is unavailable.'
}

export function formatYieldCurveInterpretation(value: number | null): string {
  const state = classifyYieldCurve(value)
  if (state === 'inverted') return 'An inversion often occurs when monetary policy is restrictive and investors expect weaker growth, lower inflation, or future rate cuts. Inversions have historically preceded many U.S. recessions, but they do not guarantee one or determine its timing.'
  if (state === 'nearly-flat') return 'A nearly flat curve can indicate uncertainty about future growth, inflation, and interest rates, but it is not by itself a recession forecast.'
  if (state === 'upward-sloping') return 'A positive spread does not rule out recession, but the curve is not currently giving an inversion signal.'
  return 'No current yield-curve interpretation is available.'
}

export function formatYieldCurveVisibleContext(value: number | null): string {
  const state = classifyYieldCurve(value)
  if (state === 'inverted') return 'An inversion means short-term Treasury rates are above long-term rates.'
  if (state === 'nearly-flat') return 'A nearly flat curve means investors receive about the same yield for short- and long-term Treasury lending.'
  if (state === 'upward-sloping') return 'Long-term Treasury yields being above short-term rates is typical.'
  return 'The current yield-curve state is unavailable.'
}

export function formatYieldCurveSpread(value: number | null): string {
  return value === null ? 'Unavailable' : `${formatSignedPercentagePoints(value)} pp`
}
