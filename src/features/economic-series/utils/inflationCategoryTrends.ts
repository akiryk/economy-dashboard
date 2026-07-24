import type {
  EconomicObservation,
  EconomicSeries,
} from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatSignedPercentage,
  formatSignedPercentagePoints,
} from './economicSeries'
import type {
  CompactInflationContribution,
  InflationContributionCategoryId,
} from './inflationContributions'

export interface ContributionInflationSeriesMapping {
  contributionCategoryId: InflationContributionCategoryId
  inflationSeriesSlug: string
  label: string
  unit: '%'
  valueFormatter: (value: number) => string
  explanation: string
  sourceAttribution: string
  comparabilityNote: string
}

export const contributionInflationSeriesMappings:
  readonly ContributionInflationSeriesMapping[] = [
    {
      contributionCategoryId: 'shelter',
      inflationSeriesSlug: 'shelter-cpi-inflation',
      label: 'Shelter',
      unit: '%',
      valueFormatter: formatSignedPercentage,
      explanation: 'Year-over-year change in shelter prices.',
      sourceAttribution: 'U.S. Bureau of Labor Statistics CPI-U',
      comparabilityNote: 'Directly matches the shelter contribution category.',
    },
    {
      contributionCategoryId: 'energy',
      inflationSeriesSlug: 'energy-cpi-inflation',
      label: 'Energy',
      unit: '%',
      valueFormatter: formatSignedPercentage,
      explanation: 'Year-over-year change in energy prices.',
      sourceAttribution: 'U.S. Bureau of Labor Statistics CPI-U',
      comparabilityNote: 'Directly matches the energy contribution category.',
    },
    {
      contributionCategoryId: 'food',
      inflationSeriesSlug: 'food-cpi-inflation',
      label: 'Food',
      unit: '%',
      valueFormatter: formatSignedPercentage,
      explanation: 'Year-over-year change in food prices.',
      sourceAttribution: 'U.S. Bureau of Labor Statistics CPI-U',
      comparabilityNote: 'Directly matches the food contribution category.',
    },
  ]

export interface CategoryInflationTrend {
  contributionCategoryId: InflationContributionCategoryId
  inflationSeriesSlug: string
  label: string
  currentInflationRate: number
  currentPeriod: string
  observations: readonly EconomicObservation[]
  startPeriod: string
  endPeriod: string
}

export interface InflationDriversSupportingTrendsModel {
  trends: readonly CategoryInflationTrend[]
  unsupportedCategoryIds: readonly InflationContributionCategoryId[]
  unsupportedLabels: readonly string[]
  unavailableCategoryIds: readonly InflationContributionCategoryId[]
  unavailableLabels: readonly string[]
  sharedDomain: readonly [number, number] | null
  windowStart: string | null
  windowEnd: string | null
}

const FIVE_YEARS = 5
const DOMAIN_PADDING = 0.08
const MINIMUM_RANGE = 0.2

function fiveYearBoundary(period: string): string {
  return `${Number(period.slice(0, 4)) - FIVE_YEARS}${period.slice(4)}`
}

export function calculateCategoryInflationSharedDomain(
  trends: readonly Pick<CategoryInflationTrend, 'observations'>[],
): readonly [number, number] | null {
  const values = trends.flatMap(({ observations }) =>
    observations.flatMap(({ value }) =>
      value === null || !Number.isFinite(value) ? [] : [value]))
  if (values.length === 0) return null
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(0, ...values)
  if (minimum === maximum) return [-MINIMUM_RANGE / 2, MINIMUM_RANGE / 2]
  const padding = Math.max(
    MINIMUM_RANGE / 2,
    (maximum - minimum) * DOMAIN_PADDING,
  )
  return [minimum - padding, maximum + padding]
}

export function deriveInflationDriversSupportingTrends({
  selectedContributions,
  supportingSeries,
}: {
  selectedContributions: readonly CompactInflationContribution[]
  supportingSeries: readonly EconomicSeries[]
}): InflationDriversSupportingTrendsModel {
  const selected = selectedContributions.filter(
    (item): item is CompactInflationContribution & {
      id: InflationContributionCategoryId
      kind: 'category'
    } => item.kind === 'category',
  )
  const mappings = new Map(contributionInflationSeriesMappings.map((mapping) => [
    mapping.contributionCategoryId,
    mapping,
  ]))
  const seriesBySlug = new Map(supportingSeries.map((series) => [
    series.slug,
    series,
  ]))
  const unsupported = selected.filter(({ id }) => !mappings.has(id))
  const unavailableCategoryIds: InflationContributionCategoryId[] = []
  const trends = selected.flatMap(({ id }) => {
    const mapping = mappings.get(id)
    if (!mapping) return []
    const series = seriesBySlug.get(mapping.inflationSeriesSlug)
    const valid = series?.observations.filter(
      ({ value }) => value !== null && Number.isFinite(value),
    ).sort((left, right) => left.date.localeCompare(right.date))
    const latest = valid?.at(-1)
    if (!series || !latest) {
      unavailableCategoryIds.push(id)
      return []
    }
    const boundary = fiveYearBoundary(latest.date)
    const observations = series.observations
      .filter(({ date }) => date >= boundary && date <= latest.date)
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((observation) => ({ ...observation }))
    const firstFinite = observations.find(({ value }) => value !== null)
    if (!firstFinite) {
      unavailableCategoryIds.push(id)
      return []
    }
    return [{
      contributionCategoryId: id,
      inflationSeriesSlug: mapping.inflationSeriesSlug,
      label: mapping.label,
      currentInflationRate: latest.value!,
      currentPeriod: latest.date,
      observations,
      startPeriod: firstFinite.date,
      endPeriod: latest.date,
    }]
  })
  return {
    trends,
    unsupportedCategoryIds: unsupported.map(({ id }) => id),
    unsupportedLabels: unsupported.map(({ label }) => label),
    unavailableCategoryIds,
    unavailableLabels: unavailableCategoryIds.map((id) =>
      mappings.get(id)?.label ?? id),
    sharedDomain: calculateCategoryInflationSharedDomain(trends),
    windowStart: trends.length
      ? trends.map(({ startPeriod }) => startPeriod).sort()[0]!
      : null,
    windowEnd: trends.length
      ? trends.map(({ endPeriod }) => endPeriod).sort().at(-1)!
      : null,
  }
}

export function createInflationCategoryTrendAccessibleSummary({
  headlinePeriod,
  selectedContributions,
  model,
}: {
  headlinePeriod: string
  selectedContributions: readonly CompactInflationContribution[]
  model: InflationDriversSupportingTrendsModel
}): string {
  const selected = selectedContributions
    .filter(({ kind }) => kind === 'category')
    .map(({ label, contribution }) =>
      `${label}, ${formatSignedPercentagePoints(contribution)} percentage points`)
    .join('; ')
  const trends = model.trends.map((trend) =>
    `${trend.label}, ${formatSignedPercentage(trend.currentInflationRate)} in ` +
    `${formatObservationPeriod(trend.currentPeriod, 'monthly')}`)
    .join('; ')
  const omitted = model.unsupportedLabels.length
    ? `Selected categories omitted because no directly comparable CPI series exists: ${model.unsupportedLabels.join(', ')}. Omission does not mean their prices had no inflation.`
    : 'Every selected category has a directly comparable CPI series.'
  const unavailable = model.unavailableLabels.length
    ? `Mapped series temporarily unavailable: ${model.unavailableLabels.join(', ')}; no zero or carried-forward rate is shown.`
    : ''
  const window = model.windowStart && model.windowEnd
    ? `Trend coverage runs from ${formatObservationPeriod(model.windowStart, 'monthly')} through ${formatObservationPeriod(model.windowEnd, 'monthly')}.`
    : 'No mapped category inflation trend is available.'
  return `Headline CPI contribution period: ${formatObservationPeriod(headlinePeriod, 'monthly')}. ` +
    `Current top-four contributions: ${selected}. ` +
    `${trends ? `Mapped category inflation rates: ${trends}. ` : ''}${omitted} ${unavailable} ${window} ` +
    'Left-side values are percentage-point contributions; right-side values are year-over-year percent changes in category prices. All displayed rate trends use one shared scale that includes zero.'
}
