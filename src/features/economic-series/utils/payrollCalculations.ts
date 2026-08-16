import type { EconomicObservation } from '../models/economicSeries'

export function shiftPayrollMonth(date: string, offset: number): string {
  const shifted = new Date(`${date}T00:00:00Z`)
  shifted.setUTCMonth(shifted.getUTCMonth() + offset)
  return shifted.toISOString().slice(0, 10)
}

export function deriveThreeMonthAverageChanges(
  monthlyChanges: readonly EconomicObservation[],
): EconomicObservation[] {
  const sorted = [...monthlyChanges].sort((a, b) =>
    a.date.localeCompare(b.date),
  )
  const valuesByDate = new Map(sorted.map(({ date, value }) => [date, value]))

  return sorted.map(({ date }) => {
    const values = [date, shiftPayrollMonth(date, -1), shiftPayrollMonth(date, -2)]
      .map((month) => valuesByDate.get(month))
    const complete = values.every((value): value is number =>
      value !== null && value !== undefined && Number.isFinite(value))
    return {
      date,
      value: complete
        ? values.reduce((sum, value) => sum + value, 0) / 3
        : null,
    }
  })
}

export function threeMonthAverageEnding(
  monthlyChanges: readonly EconomicObservation[],
  endDate: string,
): number | null {
  const valuesByDate = new Map(
    monthlyChanges.map(({ date, value }) => [date, value]),
  )
  const values = [endDate, shiftPayrollMonth(endDate, -1), shiftPayrollMonth(endDate, -2)]
    .map((date) => valuesByDate.get(date))
  return values.every((value): value is number =>
    value !== null && value !== undefined && Number.isFinite(value))
    ? values.reduce((sum, value) => sum + value, 0) / 3
    : null
}
