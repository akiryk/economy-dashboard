import type { EconomicSeries } from '../economic-series/models/economicSeries'
import { formatObservationPeriod } from '../economic-series/utils/economicSeries'
import type {
  BriefingObservation,
  ConditionGroup,
  DirectionState,
  FreshnessResult,
  IndicatorConditionResult,
  IndicatorDirectionResult,
} from './briefingModels'
import {
  calculateIndicatorCondition,
  calculateIndicatorDirection,
  calculatePercentileRank,
  calculatePercentileValue,
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
  | 'improving'
  | 'stable'
  | 'normalizing'
  | 'deteriorating'
  | 'mixed-condition'
  | 'mixed-direction'
  | 'stale-primary'
  | 'unclear'

export interface LaborEvidence {
  id: keyof typeof LABOR_RESEARCH_LINKS
  label: string
  value: string
  period: string
  condition?: IndicatorConditionResult
  fullHistoryRawPercentile?: number
  fullHistoryOrientedPercentile?: number
  direction?: IndicatorDirectionResult
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

export interface LaborConditionReading {
  reading: ConditionGroup | 'mixed' | 'unclear'
  reason: 'agree' | 'anchor-retained-adjacent' | 'opposing-groups' | 'insufficient-evidence'
  anchor: IndicatorConditionResult
  confirmer: IndicatorConditionResult
}

export interface LaborDirectionReading {
  reading: DirectionState | 'mixed' | 'unclear' | 'no-fresh-evidence'
  reason: 'agree' | 'stable-plus-material' | 'opposing-material' | 'adverse-combination' | 'insufficient-evidence' | 'no-fresh-evidence'
  anchor: IndicatorDirectionResult
  confirmer: IndicatorDirectionResult
}

export interface LaborBriefingReady {
  status: 'ready'
  dimension: 'labor'
  question: 'Can people find and keep work?'
  conditionLabel: string
  directionLabel: string
  conditionReading: LaborConditionReading
  directionReading: LaborDirectionReading
  templateId: LaborTemplateId
  synthesis: string
  revisionQualified: boolean
  freshnessLine: string
  staleWarning: boolean
  readingEvidence: readonly [LaborEvidence, LaborEvidence, LaborEvidence]
  supporting: LaborEvidence[]
  supportingErrors: string[]
  sparkline: LaborSparklineModel
}

export type LaborBriefingResult = LaborBriefingReady | { status: 'unclear'; message: string }

const CONDITION_LABELS: Record<Exclude<LaborConditionReading['reading'], 'mixed' | 'unclear'>, string> = {
  'favorable-side': 'solid', typical: 'typical', 'unfavorable-side': 'soft',
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

function freshnessReferencePeriod(period: string, frequency: EconomicSeries['frequency']): string {
  if (frequency !== 'monthly' && frequency !== 'quarterly') return period
  const date = new Date(`${period}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + (frequency === 'monthly' ? 1 : 3), 0)
  return date.toISOString().slice(0, 10)
}

interface EvidenceOptions {
  conditionValence?: 'higher-is-better' | 'lower-is-better'
  directionValence?: 'higher-is-better' | 'lower-is-better'
  normalizing?: boolean
}

function buildEvidence(
  id: LaborEvidence['id'], label: string, series: EconomicSeries, evaluationPeriod: string,
  role: string, kind: 'percentage' | 'payrolls' | 'claims', options: EvidenceOptions,
): LaborEvidence | undefined {
  const values = observations(series)
  const current = latest(values)
  if (!current) return undefined
  const condition = options.conditionValence ? calculateIndicatorCondition(values, options.conditionValence) : undefined
  const fullHistoryRawPercentile = options.conditionValence
    ? calculatePercentileRank(values.map(({ value }) => value), current.value) : undefined
  const rawDirection = options.directionValence ? calculateIndicatorDirection(values, {
    frequency: series.frequency === 'weekly' ? 'weekly' : 'monthly',
    valence: options.directionValence,
    normalizingDimension: options.normalizing ? 'labor' : undefined,
    condition,
  }) : undefined
  const freshness = evaluateFreshness(freshnessReferencePeriod(current.period, series.frequency), evaluationPeriod, {
    expectedCadenceDays: series.frequency === 'weekly' ? 7 : 31,
  })
  return {
    id, label, value: formatValue(current.value, kind), period: formatObservationPeriod(current.period, series.frequency),
    condition, fullHistoryRawPercentile,
    fullHistoryOrientedPercentile: fullHistoryRawPercentile === undefined || !options.conditionValence
      ? undefined : orientPercentile(fullHistoryRawPercentile, options.conditionValence),
    direction: rawDirection ? suppressStaleDirection(rawDirection, freshness) : undefined,
    freshness, link: LABOR_RESEARCH_LINKS[id], role,
  }
}

function adequateGroup(result: IndicatorConditionResult): ConditionGroup | undefined {
  return result.evidence === 'adequate' && result.valence !== 'unvalenced' ? result.group : undefined
}

export function combineLaborCondition(anchor: IndicatorConditionResult, confirmer: IndicatorConditionResult): LaborConditionReading {
  const anchorGroup = adequateGroup(anchor)
  const confirmerGroup = adequateGroup(confirmer)
  if (!anchorGroup || !confirmerGroup) return { reading: 'unclear', reason: 'insufficient-evidence', anchor, confirmer }
  if (anchorGroup === confirmerGroup) return { reading: anchorGroup, reason: 'agree', anchor, confirmer }
  if ((anchorGroup === 'favorable-side' && confirmerGroup === 'unfavorable-side')
    || (anchorGroup === 'unfavorable-side' && confirmerGroup === 'favorable-side')) {
    return { reading: 'mixed', reason: 'opposing-groups', anchor, confirmer }
  }
  return { reading: anchorGroup, reason: 'anchor-retained-adjacent', anchor, confirmer }
}

function adequateDirection(result: IndicatorDirectionResult): DirectionState | undefined {
  return result.evidence === 'adequate' ? result.direction : undefined
}

export function combineLaborDirection(anchor: IndicatorDirectionResult, confirmer: IndicatorDirectionResult): LaborDirectionReading {
  if (anchor.evidence === 'no-fresh-evidence' || confirmer.evidence === 'no-fresh-evidence') {
    return { reading: 'no-fresh-evidence', reason: 'no-fresh-evidence', anchor, confirmer }
  }
  const anchorDirection = adequateDirection(anchor)
  const confirmerDirection = adequateDirection(confirmer)
  if (!anchorDirection || !confirmerDirection) return { reading: 'unclear', reason: 'insufficient-evidence', anchor, confirmer }
  if (anchorDirection === confirmerDirection) return { reading: anchorDirection, reason: 'agree', anchor, confirmer }
  if (anchorDirection === 'broadly-stable') return { reading: confirmerDirection, reason: 'stable-plus-material', anchor, confirmer }
  if (confirmerDirection === 'broadly-stable') return { reading: anchorDirection, reason: 'stable-plus-material', anchor, confirmer }
  if ((anchorDirection === 'deteriorating' && confirmerDirection === 'normalizing')
    || (anchorDirection === 'normalizing' && confirmerDirection === 'deteriorating')) {
    return { reading: 'deteriorating', reason: 'adverse-combination', anchor, confirmer }
  }
  return { reading: 'mixed', reason: 'opposing-material', anchor, confirmer }
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
    observations: displayed, minimum: Math.min(...displayValues), maximum: Math.max(...displayValues), latest: current,
    median: calculatePercentileValue(distribution, 50)!, lowerQuartile: calculatePercentileValue(distribution, 25)!,
    upperQuartile: calculatePercentileValue(distribution, 75)!, comparisonStart: comparison.metadata.comparisonStart,
    comparisonEnd: comparison.metadata.comparisonEnd,
  }
}

function displayCondition(reading: LaborConditionReading, unemployment: LaborEvidence): string {
  if (reading.reading === 'mixed' || reading.reading === 'unclear') return reading.reading
  const condition = unemployment.condition
  if (condition?.evidence === 'adequate' && condition.valence !== 'unvalenced') {
    if (condition.tier === 'very-favorable') return 'strong'
    if (condition.tier === 'very-unfavorable') return 'weak'
  }
  return CONDITION_LABELS[reading.reading]
}

function selectTemplate(condition: LaborConditionReading['reading'], direction: LaborDirectionReading['reading'], stale: boolean): LaborTemplateId {
  if (condition === 'unclear' || direction === 'unclear') return 'unclear'
  if (direction === 'no-fresh-evidence' || stale) return 'stale-primary'
  if (condition === 'mixed') return 'mixed-condition'
  if (direction === 'mixed') return 'mixed-direction'
  if (direction === 'broadly-stable') return 'stable'
  if (direction === 'improving' || direction === 'deteriorating' || direction === 'normalizing') return direction
  return 'unclear'
}

function orientedHistoryPhrase(unemployment: LaborEvidence): string {
  const oriented = unemployment.condition?.evidence === 'adequate' && unemployment.condition.valence !== 'unvalenced'
    ? unemployment.condition.orientedPercentile : undefined
  if (oriented === undefined) return 'with insufficient historical context'
  const share = Math.round(oriented / 5) * 5
  return `lower than in roughly ${share}% of the past 25 years`
}

function directionSentence(direction: LaborDirectionReading['reading'], unemployment: LaborEvidence, payrolls: LaborEvidence): string {
  const unemploymentDirection = unemployment.direction?.evidence === 'adequate' ? unemployment.direction.direction : undefined
  const change = unemployment.direction?.evidence === 'adequate' ? unemployment.direction.currentChange.signedChange : undefined
  if (direction === 'improving') return 'Recent movement is improving overall.'
  if (direction === 'broadly-stable') return 'Recent movement is broadly stable.'
  if (direction === 'deteriorating') return `Recent movement is deteriorating${unemploymentDirection === 'normalizing' && change !== undefined ? `; unemployment increased ${Math.abs(change).toFixed(1)} points from a still-favorable level` : ''}.`
  if (direction === 'normalizing') return `Unemployment increased ${Math.abs(change ?? 0).toFixed(1)} points over six months, an adverse move from a still-favorable level.`
  if (direction === 'mixed') return 'Payroll growth and unemployment are moving in opposing material directions.'
  if (direction === 'no-fresh-evidence') return 'The primary data are too old to describe recent direction.'
  return `Recent direction is unclear from unemployment and payroll data through ${payrolls.period}.`
}

export function renderLaborSynthesis(
  template: LaborTemplateId, conditionLabel: string, direction: LaborDirectionReading,
  unemployment: LaborEvidence, payrolls: LaborEvidence, revision: boolean,
): string {
  const periodLead = unemployment.period === payrolls.period ? `In ${unemployment.period}, ` : ''
  const payrollPeriod = unemployment.period === payrolls.period ? '' : ` in ${payrolls.period}`
  const facts = `${periodLead}unemployment is ${unemployment.value}, ${orientedHistoryPhrase(unemployment)}, while payroll growth averages ${payrolls.value}${payrollPeriod}.`
  const condition = template === 'mixed-condition'
    ? 'Unemployment and prime-age employment give opposing condition signals.'
    : `Labor conditions are ${conditionLabel}.`
  const movement = directionSentence(direction.reading, unemployment, payrolls)
  return `${facts} ${condition} ${movement}${revision ? ' The newest payroll estimate is commonly revised.' : ''}`
}

export function buildLaborBriefing(input: LaborSeriesInput, evaluationPeriod: string): LaborBriefingResult {
  if (!input.unemployment || !input.payrolls || !input.primeAgeEmployment) {
    return { status: 'unclear', message: 'Unemployment, payroll, and prime-age employment data are required for the Labor reading.' }
  }
  const unemployment = buildEvidence('unemployment', 'Unemployment rate', input.unemployment, evaluationPeriod,
    'Condition anchor and direction confirmer', 'percentage', { conditionValence: 'lower-is-better', directionValence: 'lower-is-better', normalizing: true })
  const payrolls = buildEvidence('payrolls', 'Payroll growth, three-month average', input.payrolls, evaluationPeriod,
    'Direction anchor; commonly revised', 'payrolls', { directionValence: 'higher-is-better' })
  const primeAgeEmployment = buildEvidence('primeAgeEmployment', 'Prime-age employment-to-population ratio', input.primeAgeEmployment, evaluationPeriod,
    'Condition confirmer', 'percentage', { conditionValence: 'higher-is-better' })
  const sparkline = createSparkline(input.unemployment)
  if (!unemployment?.condition || !unemployment.direction || !payrolls?.direction || !primeAgeEmployment?.condition || !sparkline) {
    return { status: 'unclear', message: 'Required Labor history is insufficient for a defensible reading.' }
  }
  const conditionReading = combineLaborCondition(unemployment.condition, primeAgeEmployment.condition)
  const directionReading = combineLaborDirection(payrolls.direction, unemployment.direction)
  const conditionLabel = displayCondition(conditionReading, unemployment)
  const staleWarning = [unemployment, payrolls, primeAgeEmployment].some(({ freshness }) => freshness.state !== 'current')
  const templateId = selectTemplate(conditionReading.reading, directionReading.reading, staleWarning)
  const revisionQualified = payrolls.direction.evidence === 'adequate' && payrolls.direction.noiseGatePassed
  const supporting: LaborEvidence[] = []
  const supportingErrors: string[] = []
  if (input.claims) {
    const evidence = buildEvidence('claims', 'Initial claims, four-week average', input.claims, evaluationPeriod,
      'Supporting timely signal; does not set either reading', 'claims', { conditionValence: 'lower-is-better', directionValence: 'lower-is-better' })
    if (evidence) supporting.push(evidence)
    else supportingErrors.push('Initial claims data has no usable observations.')
  } else supportingErrors.push('Initial claims data is unavailable.')
  return {
    status: 'ready', dimension: 'labor', question: 'Can people find and keep work?', conditionLabel,
    directionLabel: directionReading.reading.replaceAll('-', ' '), conditionReading, directionReading, templateId,
    synthesis: renderLaborSynthesis(templateId, conditionLabel, directionReading, unemployment, payrolls, revisionQualified),
    revisionQualified, staleWarning,
    freshnessLine: `Based on unemployment, payrolls, and prime-age employment through ${unemployment.period}.`,
    readingEvidence: [unemployment, payrolls, primeAgeEmployment], supporting, supportingErrors, sparkline,
  }
}
