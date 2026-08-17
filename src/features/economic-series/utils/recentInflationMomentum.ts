import type { EconomicSeries } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
  formatSignedPercentagePoints,
} from './economicSeries'

export type InflationMomentumAnswerTier =
  | 'substantial-pickup'
  | 'pickup'
  | 'close'
  | 'slowing'
  | 'substantial-slowing'
  | 'unavailable'

export interface InflationMomentumComparisonItem {
  id: 'previous-three-month' | 'three-month'
  label: string
  value: number
  period: string
  slopeYPercent: number
}

export interface RecentInflationMomentumModel {
  status: 'available' | 'unavailable'
  answerTier: InflationMomentumAnswerTier
  answer: string
  twelveMonthRate: number | null
  twelveMonthPeriod: string | null
  threeMonthAnnualizedRate: number | null
  threeMonthPeriod: string | null
  previousThreeMonthAnnualizedRate: number | null
  previousThreeMonthPeriod: string | null
  difference: number | null
  scale: readonly [number, number] | null
  items: readonly InflationMomentumComparisonItem[]
  slopeDirection: 'up' | 'down' | 'level' | null
  slopeReferenceY: number | null
  differenceLabel: string | null
  recentThreeMonthGrowth: number | null
  conditionalRate: number | null
  conditionalPeriod: string | null
  conditionalCpiNsa: number | null
  baseObservation: ConditionalInflationBaseObservation | null
  conditionalUnavailableReason: string | null
}

export type ConditionalInflationBaseObservation =
  | { kind: 'observed'; date: string; value: number }
  | {
      kind: 'interpolated'
      date: string
      value: number
      previousDate: string
      previousValue: number
      nextDate: string
      nextValue: number
    }

export interface ConditionalInflationScenario {
  recentThreeMonthGrowth: number | null
  conditionalRate: number | null
  conditionalPeriod: string | null
  conditionalCpiNsa: number | null
  baseObservation: ConditionalInflationBaseObservation | null
  conditionalUnavailableReason: string | null
}

export const inflationMomentumThresholds = {
  meaningful: 0.1,
  substantial: 1,
} as const

export function classifyInflationMomentumDifference(
  difference: number | null,
): Pick<RecentInflationMomentumModel, 'answerTier' | 'answer'> {
  if (difference === null || !Number.isFinite(difference)) {
    return {
      answerTier: 'unavailable',
      answer: 'Recent inflation momentum is unavailable.',
    }
  }
  if (difference >= inflationMomentumThresholds.meaningful) {
    if (difference >= inflationMomentumThresholds.substantial) {
      return {
        answerTier: 'substantial-pickup',
        answer: 'Inflation has accelerated sharply in recent months.',
      }
    }
    return {
      answerTier: 'pickup',
      answer: 'Inflation has accelerated in recent months.',
    }
  }
  if (difference <= -inflationMomentumThresholds.meaningful) {
    if (difference <= -inflationMomentumThresholds.substantial) {
      return {
        answerTier: 'substantial-slowing',
        answer: 'Inflation has slowed sharply in recent months.',
      }
    }
    return {
      answerTier: 'slowing',
      answer: 'Inflation has slowed in recent months.',
    }
  }
  return {
    answerTier: 'close',
    answer: 'Inflation momentum is little changed.',
  }
}

function latestObservation(series: EconomicSeries) {
  return [...series.observations]
    .sort((left, right) => right.date.localeCompare(left.date))
    .find(({ value }) => value !== null && Number.isFinite(value)) ?? null
}

function monthsBefore(date: string, months: number): string {
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCMonth(result.getUTCMonth() - months)
  return result.toISOString().slice(0, 10)
}

function monthsAfter(date: string, months: number): string {
  return monthsBefore(date, -months)
}

function finiteObservationValue(
  observations: readonly { date: string; value: number | null }[],
  date: string,
): number | null {
  const matches = observations.filter((observation) => observation.date === date)
  if (matches.length !== 1) return null
  const value = matches[0]!.value
  return value !== null && Number.isFinite(value) ? value : null
}

export function calculateThreeMonthCpiGrowth(
  current: number,
  threeMonthsEarlier: number,
): number {
  return current / threeMonthsEarlier - 1
}

export function annualizeThreeMonthCpiGrowth(growth: number): number {
  return (Math.pow(1 + growth, 4) - 1) * 100
}

export function calculateConditionalCpiNsa(
  currentNsa: number,
  recentThreeMonthGrowth: number,
): number {
  return currentNsa * (1 + recentThreeMonthGrowth)
}

export function calculateConditionalTwelveMonthRate(
  conditionalCpiNsa: number,
  baseCpiNsa: number,
): number {
  return (conditionalCpiNsa / baseCpiNsa - 1) * 100
}

export function resolveConditionalInflationBase(
  observations: readonly { date: string; value: number | null }[],
  date: string,
): ConditionalInflationBaseObservation | null {
  if (observations.some((observation, index) =>
    index > 0 && observation.date <= observations[index - 1]!.date)) {
    return null
  }
  const matches = observations.filter((observation) => observation.date === date)
  if (matches.length !== 1) return null
  const value = matches[0]!.value
  if (value !== null && Number.isFinite(value)) {
    return { kind: 'observed', date, value }
  }
  if (value !== null) return null

  const previousDate = monthsBefore(date, 1)
  const nextDate = monthsAfter(date, 1)
  const previousValue = finiteObservationValue(observations, previousDate)
  const nextValue = finiteObservationValue(observations, nextDate)
  if (previousValue === null || nextValue === null) return null

  return {
    kind: 'interpolated',
    date,
    value: Math.sqrt(previousValue * nextValue),
    previousDate,
    previousValue,
    nextDate,
    nextValue,
  }
}

export function deriveConditionalInflationScenario({
  latestDate,
  headlineNsaLevels,
  headlineSaLevels,
}: {
  latestDate: string
  headlineNsaLevels: EconomicSeries
  headlineSaLevels: EconomicSeries
}): ConditionalInflationScenario {
  const saCurrent = finiteObservationValue(headlineSaLevels.observations, latestDate)
  const saPrior = finiteObservationValue(
    headlineSaLevels.observations,
    monthsBefore(latestDate, 3),
  )
  const nsaCurrent = finiteObservationValue(headlineNsaLevels.observations, latestDate)
  if (saCurrent === null || saPrior === null || nsaCurrent === null) {
    return unavailableConditionalScenario(
      'The current SA and NSA CPI endpoints and the three-month-earlier SA endpoint are required.',
    )
  }

  const baseDate = monthsBefore(latestDate, 9)
  const baseObservation = resolveConditionalInflationBase(
    headlineNsaLevels.observations,
    baseDate,
  )
  if (!baseObservation) {
    return unavailableConditionalScenario(
      'The required NSA base is neither observed nor a single bracketed missing month.',
    )
  }

  const recentThreeMonthGrowth = calculateThreeMonthCpiGrowth(saCurrent, saPrior)
  const conditionalCpiNsa = calculateConditionalCpiNsa(
    nsaCurrent,
    recentThreeMonthGrowth,
  )
  return {
    recentThreeMonthGrowth,
    conditionalRate: calculateConditionalTwelveMonthRate(
      conditionalCpiNsa,
      baseObservation.value,
    ),
    conditionalPeriod: monthsAfter(latestDate, 3),
    conditionalCpiNsa,
    baseObservation,
    conditionalUnavailableReason: null,
  }
}

function unavailableConditionalScenario(
  reason: string,
): ConditionalInflationScenario {
  return {
    recentThreeMonthGrowth: null,
    conditionalRate: null,
    conditionalPeriod: null,
    conditionalCpiNsa: null,
    baseObservation: null,
    conditionalUnavailableReason: reason,
  }
}

export function deriveRecentInflationMomentumModel({
  twelveMonthHeadline,
  threeMonthHeadline,
  headlineNsaLevels,
  headlineSaLevels,
}: {
  twelveMonthHeadline: EconomicSeries
  threeMonthHeadline: EconomicSeries
  headlineNsaLevels: EconomicSeries
  headlineSaLevels: EconomicSeries
}): RecentInflationMomentumModel {
  const latestThreeMonth = latestObservation(threeMonthHeadline)
  if (!latestThreeMonth) {
    return unavailableModel()
  }
  const previousPeriod = monthsBefore(latestThreeMonth.date, 3)
  const previousThreeMonth = threeMonthHeadline.observations.find(
    ({ date }) => date === previousPeriod,
  )
  if (
    previousThreeMonth?.value === null ||
    previousThreeMonth?.value === undefined ||
    !Number.isFinite(previousThreeMonth.value)
  ) {
    const latestTwelveMonth = twelveMonthHeadline.observations.find(
      ({ date }) => date === latestThreeMonth.date,
    )
    return unavailableModel(
      latestTwelveMonth?.date ?? null,
      latestTwelveMonth?.value ?? null,
    )
  }
  const latestTwelveMonth = twelveMonthHeadline.observations.find(
    ({ date }) => date === latestThreeMonth.date,
  )
  const twelveMonthRate = latestTwelveMonth?.value ?? null
  const threeMonthAnnualizedRate = latestThreeMonth.value!
  const previousThreeMonthAnnualizedRate = previousThreeMonth.value
  const difference = threeMonthAnnualizedRate - previousThreeMonthAnnualizedRate
  const conditional = deriveConditionalInflationScenario({
    latestDate: latestThreeMonth.date,
    headlineNsaLevels,
    headlineSaLevels,
  })
  const classification = classifyInflationMomentumDifference(difference)
  const slopeDirection = difference >= inflationMomentumThresholds.meaningful
    ? 'up'
    : difference <= -inflationMomentumThresholds.meaningful
      ? 'down'
      : 'level'
  const differenceMagnitude = formatSignedPercentagePoints(Math.abs(difference))
    .replace(/^\+/, '')
  const differenceLabel = slopeDirection === 'up'
    ? `${differenceMagnitude} percentage points faster`
    : slopeDirection === 'down'
      ? `${differenceMagnitude} percentage points slower`
      : `About the same — ${differenceMagnitude} percentage points apart`
  const minimum = Math.min(0, previousThreeMonthAnnualizedRate, threeMonthAnnualizedRate)
  const maximum = Math.max(0, previousThreeMonthAnnualizedRate, threeMonthAnnualizedRate)
  const padding = Math.max(0.2, (maximum - minimum) * 0.08)
  const scale: readonly [number, number] = [
    Math.floor((minimum - padding) * 10) / 10,
    Math.ceil((maximum + padding) * 10) / 10,
  ]
  const position = (value: number) =>
    (value - scale[0]) / (scale[1] - scale[0]) * 100
  const slopeY = (value: number) => 36 - position(value) * 0.32
  const twelveMonthY = slopeY(previousThreeMonthAnnualizedRate)
  const threeMonthY = slopeY(threeMonthAnnualizedRate)
  const levelY = (twelveMonthY + threeMonthY) / 2
  const slopeCenter = (twelveMonthY + threeMonthY) / 2
  const emphasizedDifference = (threeMonthY - twelveMonthY) * 1.5
  const emphasizedTwelveMonthY = slopeCenter - emphasizedDifference / 2
  const emphasizedThreeMonthY = slopeCenter + emphasizedDifference / 2
  const displayedTwelveMonthY = slopeDirection === 'level'
    ? levelY
    : emphasizedTwelveMonthY
  const displayedThreeMonthY = slopeDirection === 'level'
    ? levelY
    : emphasizedThreeMonthY
  return {
    status: 'available',
    ...classification,
    twelveMonthRate,
    twelveMonthPeriod: latestTwelveMonth?.date ?? null,
    threeMonthAnnualizedRate,
    threeMonthPeriod: latestThreeMonth.date,
    previousThreeMonthAnnualizedRate,
    previousThreeMonthPeriod: previousThreeMonth.date,
    difference,
    scale,
    slopeDirection,
    slopeReferenceY: Math.min(
      38,
      Math.max(displayedTwelveMonthY, displayedThreeMonthY) + 3,
    ),
    differenceLabel,
    ...conditional,
    items: [
      {
        id: 'previous-three-month',
        label: 'Previous 3 months, annualized',
        value: previousThreeMonthAnnualizedRate,
        period: previousThreeMonth.date,
        slopeYPercent: displayedTwelveMonthY,
      },
      {
        id: 'three-month',
        label: 'Latest 3 months, annualized',
        value: threeMonthAnnualizedRate,
        period: latestThreeMonth.date,
        slopeYPercent: displayedThreeMonthY,
      },
    ],
  }
}

function unavailableModel(
  twelveMonthPeriod: string | null = null,
  twelveMonthRate: number | null = null,
): RecentInflationMomentumModel {
  return {
    status: 'unavailable',
    ...classifyInflationMomentumDifference(null),
    twelveMonthRate,
    twelveMonthPeriod,
    threeMonthAnnualizedRate: null,
    threeMonthPeriod: null,
    previousThreeMonthAnnualizedRate: null,
    previousThreeMonthPeriod: null,
    difference: null,
    scale: null,
    items: [],
    slopeDirection: null,
    slopeReferenceY: null,
    differenceLabel: null,
    ...unavailableConditionalScenario(
      'The latest momentum comparison is unavailable.',
    ),
  }
}

export function createRecentInflationMomentumAccessibleSummary(
  model: RecentInflationMomentumModel,
): string {
  if (model.status === 'unavailable') {
    return 'The required latest headline CPI observations are unavailable; core inflation was not substituted.'
  }
  const direction = model.slopeDirection === 'up'
    ? 'faster'
    : model.slopeDirection === 'down' ? 'slower' : 'about the same'
  const twelveMonthContext = model.twelveMonthRate !== null && model.twelveMonthPeriod
    ? ` The actual 12-month inflation rate was ${formatPercentage(model.twelveMonthRate)} in ${formatObservationPeriod(model.twelveMonthPeriod, 'monthly')}.`
    : ''
  const conditionalContext = model.conditionalRate !== null && model.conditionalPeriod
    ? ` If the latest three-month price increase repeated once, the ordinary 12-month rate in ${formatObservationPeriod(model.conditionalPeriod, 'monthly')} would be ${formatPercentage(model.conditionalRate)}. This conditional rate is not a forecast.`
    : ` The conditional 12-month rate is unavailable: ${model.conditionalUnavailableReason}`
  const interpolationContext = model.baseObservation?.kind === 'interpolated'
    ? ` The required ${formatObservationPeriod(model.baseObservation.date, 'monthly')} NSA base was geometrically interpolated from ${formatObservationPeriod(model.baseObservation.previousDate, 'monthly')} and ${formatObservationPeriod(model.baseObservation.nextDate, 'monthly')} for this scenario only.`
    : ''
  return `Headline CPI's latest three-month annualized pace was ` +
    `${formatSignedPercentage(model.threeMonthAnnualizedRate)} in ` +
    `${formatObservationPeriod(model.threeMonthPeriod!, 'monthly')}, versus ` +
    `${formatSignedPercentage(model.previousThreeMonthAnnualizedRate)} over the previous three months ending ` +
    `${formatObservationPeriod(model.previousThreeMonthPeriod!, 'monthly')}. ` +
    `${model.answer} Momentum was ${direction}; the change was ` +
    `${formatSignedPercentagePoints(model.difference)} percentage points. ` +
    `The graphic compares adjacent, non-overlapping three-month windows.${twelveMonthContext}${conditionalContext}${interpolationContext} ` +
    'The momentum rates are annualized observed paces.'
}
