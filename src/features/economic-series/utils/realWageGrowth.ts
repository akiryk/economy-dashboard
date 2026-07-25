import type {
  EconomicObservation,
  EconomicSeries,
} from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from './economicSeries'

export type RealWageGrowthAnswerTier =
  | 'positive'
  | 'about-even'
  | 'negative'
  | 'unavailable'

export interface RealWageGrowthModel {
  status: 'available' | 'unavailable'
  answerTier: RealWageGrowthAnswerTier
  answer: string
  latestObservation: (EconomicObservation & { value: number }) | null
  observations: EconomicObservation[]
  recentObservations: EconomicObservation[]
  domain: readonly [number, number] | null
  visiblePeriod: readonly [string, string] | null
}

export const realWageGrowthThresholds = {
  neutral: 0.1,
} as const

export function classifyRealWageGrowth(value: number | null): Pick<
  RealWageGrowthModel,
  'answerTier' | 'answer'
> {
  if (value === null || !Number.isFinite(value)) {
    return {
      answerTier: 'unavailable',
      answer: 'Current real wage growth is unavailable.',
    }
  }
  if (value >= realWageGrowthThresholds.neutral) {
    return {
      answerTier: 'positive',
      answer: 'Yes — wages are rising faster than prices.',
    }
  }
  if (value <= -realWageGrowthThresholds.neutral) {
    return {
      answerTier: 'negative',
      answer: 'No — prices are rising faster than wages.',
    }
  }
  return {
    answerTier: 'about-even',
    answer: 'About even — wages are roughly keeping pace with prices.',
  }
}

function finite(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value)
}

function recentWindowStart(latestDate: string): string {
  const start = new Date(`${latestDate}T00:00:00Z`)
  start.setUTCFullYear(start.getUTCFullYear() - 5)
  return start.toISOString().slice(0, 10)
}

function deriveDomain(observations: readonly EconomicObservation[]): readonly [
  number,
  number,
] | null {
  const values = observations
    .map(({ value }) => value)
    .filter(finite)
  if (!values.length) return null
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(0, ...values)
  const padding = Math.max(0.1, (maximum - minimum) * 0.08)
  return [
    Math.floor((minimum - padding) * 10) / 10,
    Math.ceil((maximum + padding) * 10) / 10,
  ]
}

export function deriveRealWageGrowthModel({
  realWageGrowth,
  nominalWageGrowth,
  cpiInflation,
}: {
  realWageGrowth: EconomicSeries
  nominalWageGrowth: EconomicSeries
  cpiInflation: EconomicSeries
}): RealWageGrowthModel {
  const realByDate = new Map(
    realWageGrowth.observations.map(({ date, value }) => [date, value]),
  )
  const nominalByDate = new Map(
    nominalWageGrowth.observations.map(({ date, value }) => [date, value]),
  )
  const inflationByDate = new Map(
    cpiInflation.observations.map(({ date, value }) => [date, value]),
  )
  const dates = [...new Set([
    ...realByDate.keys(),
    ...nominalByDate.keys(),
    ...inflationByDate.keys(),
  ])].sort()
  const observations = dates.map((date) => {
    const nominal = nominalByDate.get(date)
    const inflation = inflationByDate.get(date)
    const real = realByDate.get(date)
    return {
      date,
      value: finite(real) && finite(nominal) && finite(inflation)
        ? real
        : null,
    }
  })
  const latestDate = dates.at(-1)
  const latest = latestDate
    ? observations.find(({ date }) => date === latestDate) ?? null
    : null
  const latestObservation = latest && finite(latest.value)
    ? { ...latest, value: latest.value }
    : null
  const recentObservations = latestDate
    ? observations.filter(({ date }) =>
        date >= recentWindowStart(latestDate) && date <= latestDate)
    : []
  const visiblePeriod = recentObservations.length
    ? [
        recentObservations[0]!.date,
        recentObservations.at(-1)!.date,
      ] as const
    : null
  const classification = classifyRealWageGrowth(latestObservation?.value ?? null)

  return {
    status: latestObservation ? 'available' : 'unavailable',
    ...classification,
    latestObservation,
    observations,
    recentObservations,
    domain: deriveDomain(recentObservations),
    visiblePeriod,
  }
}

export function createRealWageGrowthAccessibleSummary(
  model: RealWageGrowthModel,
): string {
  if (
    model.status === 'unavailable' ||
    !model.latestObservation ||
    !model.visiblePeriod
  ) {
    return 'Current real wage growth is unavailable because a same-month wage or consumer-price input is missing.'
  }
  const relationship = model.answerTier === 'positive'
    ? 'wages were rising faster than prices'
    : model.answerTier === 'negative'
      ? 'prices were rising faster than wages'
      : 'wages and prices were rising at about the same pace'
  return `Real wage growth was ${formatSignedPercentage(model.latestObservation.value)} ` +
    `in ${formatObservationPeriod(model.latestObservation.date, 'monthly')}; ` +
    `${relationship}. Zero means wage growth and consumer-price inflation were equal. ` +
    `The visible trend runs from ${formatObservationPeriod(model.visiblePeriod[0], 'monthly')} ` +
    `through ${formatObservationPeriod(model.visiblePeriod[1], 'monthly')}. ` +
    'This is an aggregate measure and does not describe every worker.'
}
