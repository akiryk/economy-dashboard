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
  domain: MiniTrendDomain
  displayRangeLabel: string
}

export interface MiniTrendDomain {
  min: number
  max: number
  includesZero: boolean
}

export interface InflationDriversSupportingTrendsModel {
  trends: readonly CategoryInflationTrend[]
  unsupportedCategoryIds: readonly InflationContributionCategoryId[]
  unsupportedLabels: readonly string[]
  unavailableCategoryIds: readonly InflationContributionCategoryId[]
  unavailableLabels: readonly string[]
  windowStart: string | null
  windowEnd: string | null
}

const FIVE_YEARS = 5
const DOMAIN_PADDING = 0.08
const MINIMUM_PADDING = 0.1

function fiveYearBoundary(period: string): string {
  return `${Number(period.slice(0, 4)) - FIVE_YEARS}${period.slice(4)}`
}

export function deriveCategoryInflationTrendDomain(
  observations: readonly EconomicObservation[],
): MiniTrendDomain | null {
  const values = observations.flatMap(({ value }) =>
    value === null || !Number.isFinite(value) ? [] : [value])
  if (values.length === 0) return null
  const actualMinimum = Math.min(...values)
  const actualMaximum = Math.max(...values)
  const padding = Math.max(
    MINIMUM_PADDING,
    (actualMaximum - actualMinimum) * DOMAIN_PADDING,
  )
  const min = Math.floor((actualMinimum - padding) * 10) / 10
  const max = Math.ceil((actualMaximum + padding) * 10) / 10
  return {
    min,
    max,
    includesZero: min <= 0 && max >= 0,
  }
}

export function formatCategoryInflationRange(
  domain: MiniTrendDomain,
): string {
  return `${formatSignedPercentage(domain.min)} to ${formatSignedPercentage(domain.max)}`
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
    const domain = deriveCategoryInflationTrendDomain(observations)
    if (!firstFinite || !domain) {
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
      domain,
      displayRangeLabel: formatCategoryInflationRange(domain),
    }]
  })
  return {
    trends,
    unsupportedCategoryIds: unsupported.map(({ id }) => id),
    unsupportedLabels: unsupported.map(({ label }) => label),
    unavailableCategoryIds,
    unavailableLabels: unavailableCategoryIds.map((id) =>
      mappings.get(id)?.label ?? id),
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
    'Left-side values are percentage-point contributions; right-side values are year-over-year percent changes in category prices. Each rate chart uses its own labeled vertical scale, so apparent line heights are not directly comparable. Exact monthly values are available by hovering, tapping, or focusing a chart. A zero line appears only when zero is inside that chart’s displayed range.'
}
