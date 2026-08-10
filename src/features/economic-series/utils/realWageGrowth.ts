import type {
  EconomicObservation,
  EconomicSeries,
} from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from './economicSeries'
import {
  classifyHistoricalBandPosition,
  deriveHistoricalBandContext,
  type HistoricalBandDefinition,
  type HistoricalBandResult,
} from './historicalBandContext'

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
  historicalBands: HistoricalBandResult | null
}

export interface VisibleRealWageGrowthSummary {
  startPeriod: string | null
  endPeriod: string | null
  latest: (EconomicObservation & { value: number }) | null
  minimum: (EconomicObservation & { value: number }) | null
  maximum: (EconomicObservation & { value: number }) | null
  validObservationCount: number
  atOrAboveZeroCount: number
  atOrAboveZeroShare: number | null
}

export const realWageGrowthThresholds = {
  neutral: 0.1,
} as const

export const realWageGrowthHistoricalBandDefinition: HistoricalBandDefinition = {
  recentObservationCount: 61,
  comparisonWindow: { kind: 'trailing-years', years: 25 },
  innerPercentiles: [25, 75],
  outerPercentiles: [10, 90],
  minimumFiniteObservations: 60,
  latestObservationPolicy: 'latest-finite',
}

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

export function createRealWageGrowthRangeModel(
  observations: readonly EconomicObservation[],
): RealWageGrowthModel {
  const sorted = [...observations].sort((left, right) =>
    left.date.localeCompare(right.date))
  const latestObservation = [...sorted].reverse()
    .find((observation): observation is EconomicObservation & { value: number } =>
      finite(observation.value)) ?? null
  const visiblePeriod = sorted.length
    ? [sorted[0]!.date, sorted.at(-1)!.date] as const
    : null
  return {
    status: latestObservation ? 'available' : 'unavailable',
    ...classifyRealWageGrowth(latestObservation?.value ?? null),
    latestObservation,
    observations: sorted,
    recentObservations: sorted,
    domain: deriveDomain(sorted),
    visiblePeriod,
    historicalBands: null,
  }
}

export function describeRealWageGrowthHistoricalPosition(
  bands: HistoricalBandResult | null,
): string | null {
  if (bands?.status !== 'ready') return null
  const position = classifyHistoricalBandPosition(
    bands.latestObservation.value,
    bands,
  )
  const descriptions = {
    belowOuterBand:
      'unusually low relative to the past 25 years',
    betweenOuterAndInnerLow:
      'below its typical range of the past 25 years',
    insideInnerBand:
      'within its typical range of the past 25 years',
    betweenInnerAndOuterHigh:
      'above its typical range of the past 25 years',
    aboveOuterBand:
      'unusually high relative to the past 25 years',
    unavailable:
      'unavailable relative to the past 25 years',
  } as const
  return descriptions[position]
}

export function formatRealWageGrowthHistoricalPosition(
  bands: HistoricalBandResult | null,
): string | null {
  const description = describeRealWageGrowthHistoricalPosition(bands)
  return description ? `The latest reading is ${description}.` : null
}

export function calculateVisibleRealWageGrowthSummary(
  observations: readonly EconomicObservation[],
): VisibleRealWageGrowthSummary {
  const sorted = [...observations].sort((left, right) =>
    left.date.localeCompare(right.date))
  const valid = sorted.filter(
    (observation): observation is EconomicObservation & { value: number } =>
      finite(observation.value),
  )
  let minimum: VisibleRealWageGrowthSummary['minimum'] = null
  let maximum: VisibleRealWageGrowthSummary['maximum'] = null
  for (const observation of valid) {
    if (!minimum || observation.value <= minimum.value) minimum = observation
    if (!maximum || observation.value >= maximum.value) maximum = observation
  }
  const atOrAboveZeroCount = valid.filter(({ value }) => value >= 0).length
  return {
    startPeriod: sorted[0]?.date ?? null,
    endPeriod: sorted.at(-1)?.date ?? null,
    latest: valid.at(-1) ?? null,
    minimum,
    maximum,
    validObservationCount: valid.length,
    atOrAboveZeroCount,
    atOrAboveZeroShare: valid.length
      ? Math.round(atOrAboveZeroCount / valid.length * 100)
      : null,
  }
}

export function formatVisibleRealWageGrowthSummary(
  summary: VisibleRealWageGrowthSummary,
): string {
  if (
    !summary.latest ||
    !summary.minimum ||
    !summary.maximum ||
    summary.atOrAboveZeroShare === null
  ) {
    return 'No valid real wage growth observations are available in the visible period.'
  }
  return `In the visible period, real wage growth ranged from ` +
    `${formatSignedPercentage(summary.minimum.value)} in ` +
    `${formatObservationPeriod(summary.minimum.date, 'monthly')} to ` +
    `${formatSignedPercentage(summary.maximum.value)} in ` +
    `${formatObservationPeriod(summary.maximum.date, 'monthly')}. ` +
    `Wages rose at least as fast as prices in ${summary.atOrAboveZeroShare}% ` +
    `of ${summary.validObservationCount} valid months shown. The latest ` +
    `reading is ${formatSignedPercentage(summary.latest.value)} in ` +
    `${formatObservationPeriod(summary.latest.date, 'monthly')}.`
}

export function createVisibleRealWageGrowthAccessibleSummary(
  summary: VisibleRealWageGrowthSummary,
): string {
  if (!summary.startPeriod || !summary.endPeriod) {
    return 'No real wage growth date range is visible.'
  }
  return `${formatVisibleRealWageGrowthSummary(summary)} The selected range runs ` +
    `from ${formatObservationPeriod(summary.startPeriod, 'monthly')} through ` +
    `${formatObservationPeriod(summary.endPeriod, 'monthly')}. Zero means wage ` +
    `growth and consumer-price inflation were equal. This is an aggregate ` +
    `measure and does not describe every worker.`
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
  const latestObservation = [...observations].reverse().find(
    (observation): observation is EconomicObservation & { value: number } =>
      finite(observation.value),
  ) ?? null
  const latestDate = latestObservation?.date
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
  const rangeModel = createRealWageGrowthRangeModel(recentObservations)
  const historicalBands = deriveHistoricalBandContext(
    observations,
    realWageGrowthHistoricalBandDefinition,
  )
  const latestClassification = classifyRealWageGrowth(
    latestObservation?.value ?? null,
  )
  return {
    ...rangeModel,
    status: latestObservation ? 'available' : 'unavailable',
    ...latestClassification,
    latestObservation,
    observations,
    visiblePeriod,
    historicalBands,
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
  const historicalContext = model.historicalBands?.status === 'ready'
    ? ` The trailing comparison runs from ` +
      `${formatObservationPeriod(model.historicalBands.comparisonStart, 'monthly')} ` +
      `through ${formatObservationPeriod(model.historicalBands.comparisonEnd, 'monthly')}. ` +
      `The middle 50% ranges from ` +
      `${formatSignedPercentage(model.historicalBands.innerLower)} to ` +
      `${formatSignedPercentage(model.historicalBands.innerUpper)}, and the ` +
      `middle 80% ranges from ` +
      `${formatSignedPercentage(model.historicalBands.outerLower)} to ` +
      `${formatSignedPercentage(model.historicalBands.outerUpper)}. ` +
      `${formatRealWageGrowthHistoricalPosition(model.historicalBands)}`
    : ''
  return `Real wage growth was ${formatSignedPercentage(model.latestObservation.value)} ` +
    `in ${formatObservationPeriod(model.latestObservation.date, 'monthly')}; ` +
    `${relationship}. Zero means wage growth and consumer-price inflation were equal. ` +
    `The visible trend runs from ${formatObservationPeriod(model.visiblePeriod[0], 'monthly')} ` +
    `through ${formatObservationPeriod(model.visiblePeriod[1], 'monthly')}. ` +
    historicalContext +
    'This is an aggregate measure and does not describe every worker.'
}
