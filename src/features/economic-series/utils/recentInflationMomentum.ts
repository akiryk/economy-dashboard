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
  positionPercent: number
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
  zeroPositionPercent: number | null
  items: readonly InflationMomentumComparisonItem[]
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
  const minimum = Math.min(0, twelveMonthRate, threeMonthAnnualizedRate)
  const maximum = Math.max(0, twelveMonthRate, threeMonthAnnualizedRate)
  const padding = Math.max(0.2, (maximum - minimum) * 0.08)
  const scale: readonly [number, number] = [
    Math.floor((minimum - padding) * 10) / 10,
    Math.ceil((maximum + padding) * 10) / 10,
  ]
  const position = (value: number) =>
    (value - scale[0]) / (scale[1] - scale[0]) * 100
  return {
    status: 'available',
    ...classification,
    twelveMonthRate,
    twelveMonthPeriod: latestTwelveMonth.date,
    threeMonthAnnualizedRate,
    threeMonthPeriod: latestThreeMonthAtPeriod.date,
    difference,
    scale,
    zeroPositionPercent: position(0),
    items: [
      {
        id: 'twelve-month',
        label: 'Past 12 months',
        value: twelveMonthRate,
        period: latestTwelveMonth.date,
        positionPercent: position(twelveMonthRate),
      },
      {
        id: 'three-month',
        label: 'Latest 3 months, annualized',
        value: threeMonthAnnualizedRate,
        period: latestThreeMonthAtPeriod.date,
        positionPercent: position(threeMonthAnnualizedRate),
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
    zeroPositionPercent: null,
    items: [],
  }
}

export function createRecentInflationMomentumAccessibleSummary(
  model: RecentInflationMomentumModel,
): string {
  if (model.status === 'unavailable') {
    return 'The required latest headline CPI observations are unavailable; core inflation was not substituted.'
  }
  const direction = model.difference! > 0
    ? 'higher'
    : model.difference! < 0 ? 'lower' : 'equal'
  return `${model.answer} Overall CPI inflation over the past 12 months was ` +
    `${formatSignedPercentage(model.twelveMonthRate)} in ` +
    `${formatObservationPeriod(model.twelveMonthPeriod!, 'monthly')}. ` +
    `The latest three-month annualized overall CPI pace was ` +
    `${formatSignedPercentage(model.threeMonthAnnualizedRate)} in ` +
    `${formatObservationPeriod(model.threeMonthPeriod!, 'monthly')}, ` +
    `which was ${direction}; the recent-minus-past-year difference was ` +
    `${formatSignedPercentagePoints(model.difference)} percentage points. ` +
    'The recent rate is annualized and describes an observed pace; it is not a forecast.'
}
