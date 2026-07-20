import type { EconomicSeries } from '../economic-series/models/economicSeries'
import { formatObservationPeriod } from '../economic-series/utils/economicSeries'
import { calculateIndicatorDirection, calculatePercentileRank, evaluateFreshness } from './briefingRules'

export const LABOR_RESEARCH_LINKS = {
  unemployment: '/#unemployment-rate-card',
  payrolls: '/#payroll-growth-card',
  primeAgeEmployment: '/#prime-age-employment-ratio-card',
  claims: '/#initial-unemployment-claims-card',
} as const

export type LaborActivityTier = 'Well Below Avg.' | 'Below Avg.' | 'Near Avg.' | 'Above Avg.' | 'Well Above Avg.'
export type LaborMomentumTier = 'Weakening Sharply' | 'Weakening' | 'Steady' | 'Strengthening' | 'Strengthening Sharply'
export type LaborSemanticBand = 'adverse' | 'neutral' | 'favorable'

export interface LaborSeriesInput {
  activity: EconomicSeries | null
  momentum: EconomicSeries | null
  unemployment: EconomicSeries | null
  payrolls: EconomicSeries | null
  monthlyPayrollChange: EconomicSeries | null
  primeAgeEmployment: EconomicSeries | null
  claims: EconomicSeries | null
}

export interface LaborPrimaryReading<Tier extends string> {
  rawValue: number
  period: string
  formattedPeriod: string
  percentile: number
  tier: Tier
  band: LaborSemanticBand
  comparisonStart: string
  comparisonEnd: string
  observationCount: number
  stale: boolean
  noFreshEvidence: boolean
}

export interface LaborSupportingEvidence {
  id: keyof typeof LABOR_RESEARCH_LINKS
  label: string
  value: string
  period: string
  sourceName: string
  link: string
  note: string
}

export interface LaborBriefingReady {
  status: 'ready'
  dimension: 'labor'
  question: 'Can people find and keep work?'
  activity: LaborPrimaryReading<LaborActivityTier>
  momentum: LaborPrimaryReading<LaborMomentumTier>
  momentumAngle: number
  synthesis: string
  tension: string | null
  supporting: LaborSupportingEvidence[]
  supportingErrors: string[]
}

export type LaborBriefingResult = LaborBriefingReady | { status: 'unclear'; message: string }

export function clampPercentile(percentile: number): number {
  return Math.min(100, Math.max(0, percentile))
}

export function activityTier(percentile: number): LaborActivityTier {
  const value = clampPercentile(percentile)
  if (value < 20) return 'Well Below Avg.'
  if (value < 40) return 'Below Avg.'
  if (value < 60) return 'Near Avg.'
  if (value < 80) return 'Above Avg.'
  return 'Well Above Avg.'
}

export function momentumTier(percentile: number): LaborMomentumTier {
  const value = clampPercentile(percentile)
  if (value < 20) return 'Weakening Sharply'
  if (value < 40) return 'Weakening'
  if (value < 60) return 'Steady'
  if (value < 80) return 'Strengthening'
  return 'Strengthening Sharply'
}

export function semanticBand(percentile: number): LaborSemanticBand {
  const value = clampPercentile(percentile)
  if (value < 40) return 'adverse'
  if (value < 60) return 'neutral'
  return 'favorable'
}

/** Maps the historical percentile to a bounded visual angle: -45° down, 0° level, +45° up. */
export function momentumArrowAngle(percentile: number): number {
  return ((clampPercentile(percentile) - 50) / 50) * 45
}

function latestFinite(series: EconomicSeries): { date: string; value: number } | undefined {
  const latest = series.observations.at(-1)
  return latest?.value === null || latest === undefined ? undefined : { date: latest.date, value: latest.value }
}

function freshnessPeriodEnd(period: string): string {
  const date = new Date(`${period}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + 1, 0)
  return date.toISOString().slice(0, 10)
}

function primaryReading<Tier extends string>(
  series: EconomicSeries,
  evaluationPeriod: string,
  classify: (percentile: number) => Tier,
): LaborPrimaryReading<Tier> | undefined {
  const latest = latestFinite(series)
  if (!latest) return undefined
  const values = series.observations.flatMap(({ value }) => value === null ? [] : [value])
  const percentile = calculatePercentileRank(values, latest.value)
  if (percentile === undefined) return undefined
  const freshness = evaluateFreshness(freshnessPeriodEnd(latest.date), evaluationPeriod, { expectedCadenceDays: 31 })
  return {
    rawValue: latest.value,
    period: latest.date,
    formattedPeriod: formatObservationPeriod(latest.date, 'monthly'),
    percentile: clampPercentile(percentile),
    tier: classify(percentile),
    band: semanticBand(percentile),
    comparisonStart: series.observations.find(({ value }) => value !== null)!.date,
    comparisonEnd: latest.date,
    observationCount: values.length,
    stale: freshness.state !== 'current',
    noFreshEvidence: freshness.directionSuppressed,
  }
}

function activityPhrase(tier: LaborActivityTier): string {
  if (tier === 'Well Below Avg.') return 'well below its historical average'
  if (tier === 'Below Avg.') return 'below its historical average'
  if (tier === 'Near Avg.') return 'near its historical average'
  if (tier === 'Above Avg.') return 'above its historical average'
  return 'well above its historical average'
}

function momentumPhrase(tier: LaborMomentumTier): string {
  return tier.toLowerCase()
}

function formatSupportingValue(series: EconomicSeries, kind: 'percent' | 'jobs' | 'claims'): string | undefined {
  const latest = latestFinite(series)
  if (!latest) return undefined
  if (kind === 'percent') return `${latest.value.toFixed(1)}%`
  if (kind === 'claims') return `${Math.round(latest.value / 1_000).toLocaleString('en-US')}K`
  const rounded = Math.round(Math.abs(latest.value)).toLocaleString('en-US')
  return latest.value > 0 ? `+${rounded}K` : latest.value < 0 ? `−${rounded}K` : '0K'
}

function supportingEvidence(
  id: LaborSupportingEvidence['id'],
  label: string,
  series: EconomicSeries | null,
  kind: 'percent' | 'jobs' | 'claims',
  note: string,
): LaborSupportingEvidence | undefined {
  if (!series) return undefined
  const latest = latestFinite(series)
  const value = formatSupportingValue(series, kind)
  if (!latest || !value) return undefined
  return {
    id, label, value,
    period: formatObservationPeriod(latest.date, series.frequency),
    sourceName: series.sourceName,
    link: LABOR_RESEARCH_LINKS[id], note,
  }
}

function tensionStatement(input: LaborSeriesInput, momentum: LaborPrimaryReading<LaborMomentumTier>): string | null {
  if (!input.payrolls || momentum.percentile < 60) return null
  const observations = input.payrolls.observations.flatMap(({ date, value }) => value === null ? [] : [{ period: date, value }])
  const direction = calculateIndicatorDirection(observations, { frequency: 'monthly', valence: 'higher-is-better' })
  if (direction.evidence !== 'adequate' || direction.direction !== 'deteriorating') return null
  return `Three-month average payroll growth deteriorated beyond its normal historical variation, while the broader LMCI momentum measure is ${momentum.tier.toLowerCase()}.`
}

export function buildLaborBriefing(input: LaborSeriesInput, evaluationPeriod: string): LaborBriefingResult {
  if (!input.activity || !input.momentum) {
    return { status: 'unclear', message: 'Kansas City Fed LMCI Activity and Momentum data are required for the Labor reading.' }
  }
  const activity = primaryReading(input.activity, evaluationPeriod, activityTier)
  const momentum = primaryReading(input.momentum, evaluationPeriod, momentumTier)
  if (!activity) return { status: 'unclear', message: 'Labor Market Activity is unavailable.' }
  if (!momentum) return { status: 'unclear', message: 'Labor Market Momentum is unavailable.' }

  const evidence = [
    supportingEvidence('unemployment', 'Unemployment rate', input.unemployment, 'percent', 'Provider-published monthly level.'),
    supportingEvidence('payrolls', 'Latest monthly payroll change', input.monthlyPayrollChange, 'jobs', 'Latest month; commonly revised.'),
    supportingEvidence('payrolls', 'Three-month average payroll change', input.payrolls, 'jobs', 'Average monthly change across the latest three months; commonly revised.'),
    supportingEvidence('primeAgeEmployment', 'Prime-age employment-to-population ratio', input.primeAgeEmployment, 'percent', 'Provider-published monthly level.'),
    supportingEvidence('claims', 'Initial claims, four-week average', input.claims, 'claims', 'Provider-published weekly four-week average.'),
  ]
  const supporting = evidence.filter((item): item is LaborSupportingEvidence => item !== undefined)
  const supportingErrors = evidence.flatMap((item, index) => item ? [] : [`${['Unemployment', 'Latest monthly payroll change', 'Three-month payroll average', 'Prime-age employment', 'Initial claims'][index]} data is unavailable.`])
  return {
    status: 'ready', dimension: 'labor', question: 'Can people find and keep work?', activity, momentum,
    momentumAngle: momentumArrowAngle(momentum.percentile),
    synthesis: `Labor-market activity is ${activityPhrase(activity.tier)}, while momentum is ${momentum.noFreshEvidence ? 'too old to assess' : momentumPhrase(momentum.tier)}.`,
    tension: tensionStatement(input, momentum), supporting, supportingErrors,
  }
}
