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
  id: 'twelve-month' | 'three-month'
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
  difference: number | null
  scale: readonly [number, number] | null
  items: readonly InflationMomentumComparisonItem[]
  slopeDirection: 'up' | 'down' | 'level' | null
  slopeReferenceY: number | null
  differenceLabel: string | null
}

export const inflationMomentumThresholds = {
  substantial: 1,
  meaningful: 0.3,
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
  if (difference >= inflationMomentumThresholds.substantial) {
    return {
      answerTier: 'substantial-pickup',
      answer: 'Yes — inflation has picked up substantially in recent months.',
    }
  }
  if (difference >= inflationMomentumThresholds.meaningful) {
    return {
      answerTier: 'pickup',
      answer: 'Yes — inflation has picked up in recent months.',
    }
  }
  if (difference <= -inflationMomentumThresholds.substantial) {
    return {
      answerTier: 'substantial-slowing',
      answer: 'No — inflation has slowed substantially in recent months.',
    }
  }
  if (difference <= -inflationMomentumThresholds.meaningful) {
    return {
      answerTier: 'slowing',
      answer: 'No — inflation has been slowing in recent months.',
    }
  }
  return {
    answerTier: 'close',
    answer: 'Not much — the recent pace is close to the past-year rate.',
  }
}

function latestObservation(series: EconomicSeries) {
  return [...series.observations]
    .sort((left, right) => right.date.localeCompare(left.date))
    .find(({ value }) => value !== null && Number.isFinite(value)) ?? null
}

export function deriveRecentInflationMomentumModel({
  twelveMonthHeadline,
  threeMonthHeadline,
}: {
  twelveMonthHeadline: EconomicSeries
  threeMonthHeadline: EconomicSeries
}): RecentInflationMomentumModel {
  const latestTwelveMonth = latestObservation(twelveMonthHeadline)
  if (!latestTwelveMonth) {
    return unavailableModel()
  }
  const latestThreeMonthAtPeriod = threeMonthHeadline.observations.find(
    ({ date }) => date === latestTwelveMonth.date,
  )
  if (
    latestThreeMonthAtPeriod?.value === null ||
    latestThreeMonthAtPeriod?.value === undefined ||
    !Number.isFinite(latestThreeMonthAtPeriod.value)
  ) {
    return unavailableModel(latestTwelveMonth.date, latestTwelveMonth.value)
  }
  const twelveMonthRate = latestTwelveMonth.value!
  const threeMonthAnnualizedRate = latestThreeMonthAtPeriod.value
  const difference = threeMonthAnnualizedRate - twelveMonthRate
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
  const minimum = Math.min(0, twelveMonthRate, threeMonthAnnualizedRate)
  const maximum = Math.max(0, twelveMonthRate, threeMonthAnnualizedRate)
  const padding = Math.max(0.2, (maximum - minimum) * 0.08)
  const scale: readonly [number, number] = [
    Math.floor((minimum - padding) * 10) / 10,
    Math.ceil((maximum + padding) * 10) / 10,
  ]
  const position = (value: number) =>
    (value - scale[0]) / (scale[1] - scale[0]) * 100
  const slopeY = (value: number) => 36 - position(value) * 0.32
  const twelveMonthY = slopeY(twelveMonthRate)
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
    twelveMonthPeriod: latestTwelveMonth.date,
    threeMonthAnnualizedRate,
    threeMonthPeriod: latestThreeMonthAtPeriod.date,
    difference,
    scale,
    slopeDirection,
    slopeReferenceY: Math.min(
      38,
      Math.max(displayedTwelveMonthY, displayedThreeMonthY) + 3,
    ),
    differenceLabel,
    items: [
      {
        id: 'twelve-month',
        label: 'Past 12 months',
        value: twelveMonthRate,
        period: latestTwelveMonth.date,
        slopeYPercent: displayedTwelveMonthY,
      },
      {
        id: 'three-month',
        label: 'Latest 3 months, annualized',
        value: threeMonthAnnualizedRate,
        period: latestThreeMonthAtPeriod.date,
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
    difference: null,
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
  return `${model.answer} Overall CPI inflation over the past 12 months was ` +
    `${formatSignedPercentage(model.twelveMonthRate)} in ` +
    `${formatObservationPeriod(model.twelveMonthPeriod!, 'monthly')}. ` +
    `The latest three-month annualized overall CPI pace was ` +
    `${formatSignedPercentage(model.threeMonthAnnualizedRate)} in ` +
    `${formatObservationPeriod(model.threeMonthPeriod!, 'monthly')}. ` +
    `The recent pace was ${direction}; the recent-minus-past-year difference was ` +
    `${formatSignedPercentagePoints(model.difference)} percentage points. ` +
    'The graphic compares two measurement windows rather than consecutive observations. The recent rate is annualized and describes an observed pace; it is not a forecast.'
}
