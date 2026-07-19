import type { EconomicSeries } from '../economic-series/models/economicSeries'
import { formatObservationPeriod } from '../economic-series/utils/economicSeries'
import type {
  BriefingObservation,
  ConditionGroup,
  FreshnessResult,
  IndicatorConditionResult,
  IndicatorDirectionResult,
} from './briefingModels'
import {
  calculateIndicatorCondition,
  calculateIndicatorDirection,
  calculatePercentileRank,
  calculatePercentileValue,
  combineDimensionConditions,
  combineDimensionDirections,
  evaluateFreshness,
  orientPercentile,
  selectComparisonWindow,
  suppressStaleDirection,
} from './briefingRules'

export const LABOR_RESEARCH_LINKS = {
  unemployment: '/#unemployment-rate-card',
  payrolls: '/#payroll-growth-card',
  primeAgeEmployment: '/#prime-age-employment-ratio-card',
  claims: '/#initial-unemployment-claims-card',
} as const

export interface LaborSeriesInput {
  unemployment: EconomicSeries | null
  payrolls: EconomicSeries | null
  primeAgeEmployment: EconomicSeries | null
  claims: EconomicSeries | null
}

export type LaborTemplateId =
  | 'agree-improving'
  | 'agree-stable'
  | 'favorable-normalizing'
  | 'favorable-deteriorating'
  | 'unfavorable-improving'
  | 'mixed-condition'
  | 'mixed-direction'
  | 'stale-primary'
  | 'unclear-primary'
  | 'other-valid'

export interface LaborEvidence {
  id: keyof typeof LABOR_RESEARCH_LINKS
  label: string
  value: string
  period: string
  condition: IndicatorConditionResult
  fullHistoryRawPercentile: number
  fullHistoryOrientedPercentile: number
  direction: IndicatorDirectionResult
  freshness: FreshnessResult
  link: string
  role: string
}

export interface LaborSparklineModel {
  observations: BriefingObservation[]
  minimum: number
  maximum: number
  latest: BriefingObservation
  median: number
  lowerQuartile: number
  upperQuartile: number
  comparisonStart: string
  comparisonEnd: string
}

export interface LaborBriefingReady {
  status: 'ready'
  dimension: 'labor'
  question: 'Can people find and keep work?'
  conditionLabel: string
  directionLabel: string
  conditionReading: ReturnType<typeof combineDimensionConditions>
  directionReading: ReturnType<typeof combineDimensionDirections>
  templateId: LaborTemplateId
  synthesis: string
  revisionQualified: boolean
  freshnessLine: string
  staleWarning: boolean
  primaries: readonly [LaborEvidence, LaborEvidence]
  supporting: LaborEvidence[]
  supportingErrors: string[]
  sparkline: LaborSparklineModel
}

export type LaborBriefingResult =
  | LaborBriefingReady
  | { status: 'unclear'; message: string }

const CONDITION_LABELS: Record<ConditionGroup, string> = {
  'favorable-side': 'solid',
  typical: 'typical',
  'unfavorable-side': 'soft',
}

function displayCondition(
  reading: LaborBriefingReady['conditionReading']['reading'],
  primaries: readonly [LaborEvidence, LaborEvidence],
): string {
  if (reading === 'mixed' || reading === 'unclear') return reading
  const tiers = primaries.map(({ condition }) => condition.evidence === 'adequate' && condition.valence !== 'unvalenced' ? condition.tier : undefined)
  if (reading === 'favorable-side' && tiers.every((tier) => tier === 'very-favorable')) return 'strong'
  if (reading === 'unfavorable-side' && tiers.every((tier) => tier === 'very-unfavorable')) return 'weak'
  return CONDITION_LABELS[reading]
}

function observations(series: EconomicSeries): BriefingObservation[] {
  return series.observations.flatMap(({ date, value }) => value === null ? [] : [{ period: date, value }])
}

function latest(values: readonly BriefingObservation[]): BriefingObservation | undefined {
  return [...values].sort((a, b) => a.period.localeCompare(b.period)).at(-1)
}

function formatValue(value: number, kind: 'percentage' | 'payrolls' | 'claims'): string {
  if (kind === 'percentage') return `${value.toFixed(1)}%`
  if (kind === 'claims') return `${Math.round(value / 1_000).toLocaleString('en-US')}K`
  const rounded = Math.round(Math.abs(value)).toLocaleString('en-US')
  return value > 0 ? `+${rounded}K` : value < 0 ? `−${rounded}K` : '0K'
}

function formatPercentile(value: number): string {
  const rounded = Math.round(value)
  const mod100 = rounded % 100
  const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : rounded % 10 === 1 ? 'st' : rounded % 10 === 2 ? 'nd' : rounded % 10 === 3 ? 'rd' : 'th'
  return `${rounded}${suffix}`
}

function freshnessReferencePeriod(period: string, frequency: EconomicSeries['frequency']): string {
  if (frequency !== 'monthly' && frequency !== 'quarterly') return period
  const date = new Date(`${period}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + (frequency === 'monthly' ? 1 : 3), 0)
  return date.toISOString().slice(0, 10)
}

function buildEvidence(
  id: LaborEvidence['id'],
  label: string,
  series: EconomicSeries,
  valence: 'higher-is-better' | 'lower-is-better',
  evaluationPeriod: string,
  role: string,
  kind: 'percentage' | 'payrolls' | 'claims',
): LaborEvidence | undefined {
  const values = observations(series)
  const current = latest(values)
  if (!current) return undefined
  const condition = calculateIndicatorCondition(values, valence)
  const allValues = values.map(({ value }) => value)
  const fullHistoryRawPercentile = calculatePercentileRank(allValues, current.value)
  if (fullHistoryRawPercentile === undefined) return undefined
  const rawDirection = calculateIndicatorDirection(values, {
    frequency: series.frequency === 'weekly' ? 'weekly' : 'monthly',
    valence,
    normalizingDimension: id === 'unemployment' || id === 'payrolls' ? 'labor' : undefined,
    condition,
  })
  const freshness = evaluateFreshness(freshnessReferencePeriod(current.period, series.frequency), evaluationPeriod, {
    expectedCadenceDays: series.frequency === 'weekly' ? 7 : 31,
  })
  return {
    id, label, value: formatValue(current.value, kind),
    period: formatObservationPeriod(current.period, series.frequency), condition,
    fullHistoryRawPercentile,
    fullHistoryOrientedPercentile: orientPercentile(fullHistoryRawPercentile, valence)!,
    direction: suppressStaleDirection(rawDirection, freshness), freshness,
    link: LABOR_RESEARCH_LINKS[id], role,
  }
}

function createSparkline(series: EconomicSeries): LaborSparklineModel | undefined {
  const all = observations(series)
  const comparison = selectComparisonWindow(all)
  const current = latest(all)
  if (!current || comparison.evidence !== 'adequate' || !comparison.metadata) return undefined
  const cutoff = new Date(`${current.period}T00:00:00Z`)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 10)
  const displayed = all.filter(({ period }) => new Date(`${period}T00:00:00Z`) >= cutoff)
  if (displayed.length < 2) return undefined
  const distribution = comparison.observations.map(({ value }) => value)
  const displayValues = displayed.map(({ value }) => value)
  return {
    observations: displayed, minimum: Math.min(...displayValues), maximum: Math.max(...displayValues),
    latest: current, median: calculatePercentileValue(distribution, 50)!,
    lowerQuartile: calculatePercentileValue(distribution, 25)!,
    upperQuartile: calculatePercentileValue(distribution, 75)!,
    comparisonStart: comparison.metadata.comparisonStart,
    comparisonEnd: comparison.metadata.comparisonEnd,
  }
}

export function selectLaborTemplate(
  condition: LaborBriefingReady['conditionReading']['reading'],
  direction: LaborBriefingReady['directionReading']['reading'],
  stale: boolean,
): LaborTemplateId {
  if (condition === 'unclear' || direction === 'unclear') return 'unclear-primary'
  if (direction === 'no-fresh-evidence') return 'stale-primary'
  if (condition === 'mixed') return 'mixed-condition'
  if (direction === 'mixed') return 'mixed-direction'
  if (stale) return 'stale-primary'
  if (condition === 'favorable-side' && direction === 'normalizing') return 'favorable-normalizing'
  if (condition === 'favorable-side' && direction === 'deteriorating') return 'favorable-deteriorating'
  if (condition === 'unfavorable-side' && direction === 'improving') return 'unfavorable-improving'
  if (direction === 'improving') return 'agree-improving'
  if (direction === 'broadly-stable') return 'agree-stable'
  return 'other-valid'
}

export function renderLaborSynthesis(template: LaborTemplateId, unemployment: LaborEvidence, payrolls: LaborEvidence, revision: boolean): string {
  const percentile = unemployment.condition.evidence === 'adequate'
    ? `${formatPercentile(unemployment.condition.rawPercentile)} historical percentile`
    : 'insufficient historical context'
  const facts = `Unemployment is ${unemployment.value} (${percentile}) while payroll growth averages ${payrolls.value}.`
  const directionNames = [unemployment.direction, payrolls.direction].map((direction) => direction.evidence === 'adequate' ? direction.direction : direction.evidence)
  const conditionNames = [unemployment.condition, payrolls.condition].map((condition) => condition.evidence === 'adequate' && condition.valence !== 'unvalenced' ? condition.group : condition.evidence)
  const normalizingEvidence = unemployment.direction.evidence === 'adequate' && unemployment.direction.direction === 'normalizing' ? unemployment : payrolls
  const normalizingMovement = normalizingEvidence.direction.evidence === 'adequate'
    ? `${normalizingEvidence.label} moved adversely by ${normalizingEvidence.direction.currentChange.absoluteChange.toFixed(1)} over six months`
    : 'A primary measure moved adversely'
  const interpretations: Record<LaborTemplateId, string> = {
    'agree-improving': 'Labor conditions and direction are improving.',
    'agree-stable': 'Labor conditions are aligned while recent direction is broadly stable.',
    'favorable-normalizing': `Conditions remain favorable while ${normalizingMovement} beyond ordinary noise; this is classified as normalizing, not as a forecast.`,
    'favorable-deteriorating': 'Conditions remain favorable while recent direction is deteriorating.',
    'unfavorable-improving': 'Conditions remain unfavorable while recent direction is improving.',
    'mixed-condition': `The primary condition signals disagree (${conditionNames.join(' versus ')}), so condition is mixed${directionNames[0] !== directionNames[1] ? `; direction also disagrees (${directionNames.join(' versus ')}) and is mixed` : ''}.`,
    'mixed-direction': 'The primary direction signals disagree, so the direction reading is mixed.',
    'stale-primary': 'Primary evidence is stale, so recent direction is not treated as stable.',
    'unclear-primary': 'Primary evidence is insufficient for a clear condition or direction reading.',
    'other-valid': `Primary conditions are ${conditionNames.join(' and ')}, while directions are ${directionNames.join(' and ')}.`,
  }
  return `${facts} ${interpretations[template]}${revision ? ' The newest payroll estimate is commonly revised.' : ''}`
}

export function buildLaborBriefing(input: LaborSeriesInput, evaluationPeriod: string): LaborBriefingResult {
  if (!input.unemployment || !input.payrolls) {
    return { status: 'unclear', message: 'Unemployment and payroll data are both required for the Labor reading.' }
  }
  const unemployment = buildEvidence('unemployment', 'Unemployment rate', input.unemployment, 'lower-is-better', evaluationPeriod, 'Primary condition anchor', 'percentage')
  const payrolls = buildEvidence('payrolls', 'Payroll growth, three-month average', input.payrolls, 'higher-is-better', evaluationPeriod, 'Primary direction anchor; commonly revised', 'payrolls')
  const sparkline = createSparkline(input.unemployment)
  if (!unemployment || !payrolls || !sparkline || unemployment.condition.evidence !== 'adequate' || payrolls.condition.evidence !== 'adequate') {
    return { status: 'unclear', message: 'Primary Labor history is insufficient for a defensible reading.' }
  }
  const conditionReading = combineDimensionConditions(unemployment.condition, payrolls.condition)
  const directionReading = combineDimensionDirections(unemployment.direction, payrolls.direction)
  const staleWarning = unemployment.freshness.state !== 'current' || payrolls.freshness.state !== 'current'
  const templateId = selectLaborTemplate(conditionReading.reading, directionReading.reading, staleWarning)
  const revisionQualified = payrolls.direction.evidence === 'adequate' && payrolls.direction.noiseGatePassed
  const supporting: LaborEvidence[] = []
  const supportingErrors: string[] = []
  if (input.primeAgeEmployment) {
    const evidence = buildEvidence('primeAgeEmployment', 'Prime-age employment-to-population ratio', input.primeAgeEmployment, 'higher-is-better', evaluationPeriod, 'Supporting context; does not set either reading', 'percentage')
    if (evidence) supporting.push(evidence)
    else supportingErrors.push('Prime-age employment data has no usable observations.')
  } else supportingErrors.push('Prime-age employment data is unavailable.')
  if (input.claims) {
    const evidence = buildEvidence('claims', 'Initial claims, four-week average', input.claims, 'lower-is-better', evaluationPeriod, 'Supporting timely signal; does not set either reading', 'claims')
    if (evidence) supporting.push(evidence)
    else supportingErrors.push('Initial claims data has no usable observations.')
  } else supportingErrors.push('Initial claims data is unavailable.')
  return {
    status: 'ready', dimension: 'labor', question: 'Can people find and keep work?',
    conditionLabel: displayCondition(conditionReading.reading, [unemployment, payrolls]),
    directionLabel: directionReading.reading.replaceAll('-', ' '),
    conditionReading, directionReading, templateId,
    synthesis: renderLaborSynthesis(templateId, unemployment, payrolls, revisionQualified),
    revisionQualified, staleWarning,
    freshnessLine: `Based on unemployment through ${unemployment.period} and payrolls through ${payrolls.period}.`,
    primaries: [unemployment, payrolls], supporting, supportingErrors, sparkline,
  }
}
