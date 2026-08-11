import type { EconomicSeries } from '../models/economicSeries'
import {
  formatObservationPeriod,
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
  relativeDifference: number | null
  showRelativeHero: boolean
  heroValue: string
  heroLabel: string
  supportingComparison: string | null
  scale: readonly [number, number] | null
  items: readonly InflationMomentumComparisonItem[]
  slopeDirection: 'up' | 'down' | 'level' | null
  slopeReferenceY: number | null
  differenceLabel: string | null
}

export const inflationMomentumThresholds = {
  meaningful: 0.1,
} as const

export function deriveInflationMomentumHero({
  difference,
  answerTier,
}: {
  difference: number
  answerTier: InflationMomentumAnswerTier
}): Pick<
  RecentInflationMomentumModel,
  'relativeDifference' | 'showRelativeHero' | 'heroValue' | 'heroLabel'
> {
  const heroLabel =
    'Latest three-month annualized pace compared with the previous three months'
  if (answerTier === 'close') {
    return {
      relativeDifference: null,
      showRelativeHero: false,
      heroValue: '0.0 pp',
      heroLabel,
    }
  }
  return {
    relativeDifference: null,
    showRelativeHero: false,
    heroValue: `${formatSignedPercentagePoints(difference)} pp`,
    heroLabel,
  }
}

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
    return {
      answerTier: 'pickup',
      answer: 'Yes — inflation has picked up in recent months.',
    }
  }
  if (difference <= -inflationMomentumThresholds.meaningful) {
    return {
      answerTier: 'slowing',
      answer: 'No — inflation has slowed in recent months.',
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

export function deriveRecentInflationMomentumModel({
  twelveMonthHeadline,
  threeMonthHeadline,
}: {
  twelveMonthHeadline: EconomicSeries
  threeMonthHeadline: EconomicSeries
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
  const classification = classifyInflationMomentumDifference(difference)
  const hero = deriveInflationMomentumHero({
    difference,
    answerTier: classification.answerTier,
  })
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
    ...hero,
    supportingComparison:
      `${formatSignedPercentage(threeMonthAnnualizedRate)} versus ` +
      `${formatSignedPercentage(previousThreeMonthAnnualizedRate)}, a change of ` +
      `${differenceMagnitude} percentage points.`,
    scale,
    slopeDirection,
    slopeReferenceY: Math.min(
      38,
      Math.max(displayedTwelveMonthY, displayedThreeMonthY) + 3,
    ),
    differenceLabel,
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
    relativeDifference: null,
    showRelativeHero: false,
    heroValue: 'Unavailable',
    heroLabel:
      'Latest three-month annualized pace compared with the previous three months',
    supportingComparison: null,
    scale: null,
    items: [],
    slopeDirection: null,
    slopeReferenceY: null,
    differenceLabel: null,
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
    ? ` The 12-month inflation rate was ${formatSignedPercentage(model.twelveMonthRate)} in ${formatObservationPeriod(model.twelveMonthPeriod, 'monthly')}.`
    : ''
  return `Headline CPI's latest three-month annualized pace was ` +
    `${formatSignedPercentage(model.threeMonthAnnualizedRate)} in ` +
    `${formatObservationPeriod(model.threeMonthPeriod!, 'monthly')}, versus ` +
    `${formatSignedPercentage(model.previousThreeMonthAnnualizedRate)} over the previous three months ending ` +
    `${formatObservationPeriod(model.previousThreeMonthPeriod!, 'monthly')}. ` +
    `${model.answer} Momentum was ${direction}; the change was ` +
    `${formatSignedPercentagePoints(model.difference)} percentage points. ` +
    `The graphic compares adjacent, non-overlapping three-month windows.${twelveMonthContext} ` +
    'The rates are annualized observed paces, not forecasts.'
}
