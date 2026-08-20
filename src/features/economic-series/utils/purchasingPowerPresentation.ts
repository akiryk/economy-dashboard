import type { EconomicObservation, EconomicSeries } from '../models/economicSeries'

export type PurchasingPowerYears = 4 | 10 | 20

export function latestValidObservation(observations: readonly EconomicObservation[]) {
  return [...observations].reverse().find(({ value }) => value !== null && Number.isFinite(value)) ?? null
}

export function purchasingPowerAnswer(value: number | null, years: number): string {
  if (value === null || !Number.isFinite(value)) return 'The latest comparison is unavailable.'
  const magnitude = Math.abs(value).toFixed(1)
  if (Math.abs(value) < 0.05) return `Average hourly earnings buy about the same amount as they did ${years} years ago.`
  return `Average hourly earnings buy ${magnitude}% ${value > 0 ? 'more' : 'less'} than they did ${years} years ago.`
}

function shiftYears(date: string, years: number): string {
  return `${Number(date.slice(0, 4)) - years}${date.slice(4)}`
}

export interface PurchasingPowerEvidence {
  endDate: string
  startDate: string
  wageStart: number
  wageEnd: number
  cpiStart: number
  cpiEnd: number
  nominalChange: number
  priceChange: number
  realChange: number
}

export function purchasingPowerEvidence(
  observation: EconomicObservation | null,
  years: PurchasingPowerYears,
  wages: EconomicSeries,
  cpi: EconomicSeries,
): PurchasingPowerEvidence | null {
  if (!observation || observation.value === null) return null
  const startDate = shiftYears(observation.date, years)
  const wageByDate = new Map(wages.observations.map(({ date, value }) => [date, value]))
  const cpiByDate = new Map(cpi.observations.map(({ date, value }) => [date, value]))
  const wageStart = wageByDate.get(startDate)
  const wageEnd = wageByDate.get(observation.date)
  const cpiStart = cpiByDate.get(startDate)
  const cpiEnd = cpiByDate.get(observation.date)
  if ([wageStart, wageEnd, cpiStart, cpiEnd].some((value) => value === null || value === undefined || !Number.isFinite(value))) return null
  return {
    startDate, endDate: observation.date,
    wageStart: wageStart!, wageEnd: wageEnd!, cpiStart: cpiStart!, cpiEnd: cpiEnd!,
    nominalChange: (wageEnd! / wageStart! - 1) * 100,
    priceChange: (cpiEnd! / cpiStart! - 1) * 100,
    realChange: (wageEnd! / wageStart! / (cpiEnd! / cpiStart!) - 1) * 100,
  }
}

export function lastYears(observations: readonly EconomicObservation[], years: number) {
  const latest = latestValidObservation(observations)
  if (!latest) return []
  const start = shiftYears(latest.date, years)
  return observations.filter(({ date }) => date >= start && date <= latest.date)
}
