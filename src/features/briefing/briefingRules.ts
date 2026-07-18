import type {
  BriefingObservation,
  ComparisonWindowResult,
  ConditionGroup,
  ConditionTier,
  DimensionCondition,
  DimensionDirection,
  DimensionReadingResult,
  DirectionState,
  FreshnessResult,
  HistoricalPosition,
  IndicatorConditionResult,
  IndicatorDirectionResult,
  IndicatorValence,
  ObservationFrequency,
  RecentChange,
  ValenceOrientation,
} from './briefingModels'

export const DEFAULT_COMPARISON_YEARS = 25
export const DEFAULT_NOISE_PERCENTILE = 60
export const MIN_PERCENTILE_SAMPLE = 5
export const MIN_DIRECTION_CHANGE_SAMPLE = 5

const DAY_MS = 86_400_000
const WINDOW_PERIODS: Record<ObservationFrequency, number> = {
  weekly: 13,
  monthly: 6,
  quarterly: 2,
}

function parsePeriod(period: string): Date | undefined {
  const date = new Date(`${period}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function shiftPeriod(period: string, frequency: ObservationFrequency, amount: number): string | undefined {
  const date = parsePeriod(period)
  if (!date) return undefined

  if (frequency === 'weekly') date.setUTCDate(date.getUTCDate() + amount * 7)
  else date.setUTCMonth(date.getUTCMonth() + amount * (frequency === 'monthly' ? 1 : 3))

  return date.toISOString().slice(0, 10)
}

function validSortedObservations(observations: readonly BriefingObservation[]): BriefingObservation[] {
  return observations
    .filter(({ period, value }) => parsePeriod(period) !== undefined && Number.isFinite(value))
    .sort((left, right) => left.period.localeCompare(right.period))
}

export function selectComparisonWindow(
  observations: readonly BriefingObservation[],
  requestedYears = DEFAULT_COMPARISON_YEARS,
): ComparisonWindowResult {
  const valid = validSortedObservations(observations)
  const latest = valid.at(-1)
  if (!latest || valid.length < MIN_PERCENTILE_SAMPLE) {
    return { observations: valid, evidence: 'insufficient' }
  }

  const latestDate = parsePeriod(latest.period)!
  const cutoff = new Date(latestDate)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - requestedYears)
  const selected = valid.filter(({ period }) => parsePeriod(period)! >= cutoff)
  const first = selected[0]

  return {
    observations: selected,
    evidence: selected.length >= MIN_PERCENTILE_SAMPLE ? 'adequate' : 'insufficient',
    metadata: {
      requestedYears,
      comparisonStart: first.period,
      comparisonEnd: latest.period,
      observationCount: selected.length,
      usedShortHistory: parsePeriod(valid[0].period)! > cutoff,
    },
  }
}

/** Zero-based average-rank percentile: tied values share their mean rank. */
export function calculatePercentileRank(values: readonly number[], value: number): number | undefined {
  const valid = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!Number.isFinite(value) || valid.length < MIN_PERCENTILE_SAMPLE) return undefined
  const lower = valid.filter((candidate) => candidate < value).length
  const equal = valid.filter((candidate) => candidate === value).length
  const rank = equal > 0 ? lower + (equal - 1) / 2 : lower
  return Math.min(100, Math.max(0, (rank / (valid.length - 1)) * 100))
}

/** Linearly interpolated inverse of the zero-based rank scale. */
export function calculatePercentileValue(values: readonly number[], percentile: number): number | undefined {
  const valid = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (valid.length < MIN_PERCENTILE_SAMPLE || !Number.isFinite(percentile)) return undefined
  const bounded = Math.min(100, Math.max(0, percentile))
  const index = (bounded / 100) * (valid.length - 1)
  const lower = Math.floor(index)
  const fraction = index - lower
  return valid[lower] + (valid[Math.ceil(index)] - valid[lower]) * fraction
}

export function orientPercentile(percentile: number, valence: IndicatorValence): number | undefined {
  if (valence === 'unvalenced') return undefined
  return valence === 'higher-is-better' ? percentile : 100 - percentile
}

export function classifyConditionTier(percentile: number): ConditionTier {
  if (percentile > 80) return 'very-favorable'
  if (percentile > 60) return 'favorable'
  if (percentile >= 40) return 'typical'
  if (percentile >= 20) return 'unfavorable'
  return 'very-unfavorable'
}

export function conditionGroup(tier: ConditionTier): ConditionGroup {
  if (tier === 'very-favorable' || tier === 'favorable') return 'favorable-side'
  if (tier === 'typical') return 'typical'
  return 'unfavorable-side'
}

export function classifyHistoricalPosition(percentile: number): HistoricalPosition {
  if (percentile > 60) return 'high'
  if (percentile < 40) return 'low'
  return 'typical'
}

export function calculateIndicatorCondition(
  observations: readonly BriefingObservation[],
  valence: IndicatorValence,
): IndicatorConditionResult {
  const comparison = selectComparisonWindow(observations)
  if (comparison.evidence !== 'adequate' || !comparison.metadata) {
    return { evidence: 'insufficient', reason: 'fewer-than-five-comparison-observations' }
  }
  const latest = comparison.observations.at(-1)!
  const rawPercentile = calculatePercentileRank(
    comparison.observations.map(({ value }) => value),
    latest.value,
  )!
  if (valence === 'unvalenced') {
    return {
      evidence: 'adequate', valence, rawPercentile,
      historicalPosition: classifyHistoricalPosition(rawPercentile), window: comparison.metadata,
    }
  }
  const orientedPercentile = orientPercentile(rawPercentile, valence)!
  const tier = classifyConditionTier(orientedPercentile)
  return {
    evidence: 'adequate', valence, rawPercentile, orientedPercentile, tier,
    group: conditionGroup(tier), window: comparison.metadata,
  }
}

export function calculateRecentChange(
  observations: readonly BriefingObservation[],
  frequency: ObservationFrequency,
  endpointPeriod?: string,
): RecentChange | undefined {
  const valid = validSortedObservations(observations)
  const latest = endpointPeriod
    ? valid.find(({ period }) => period === endpointPeriod)
    : valid.at(-1)
  if (!latest) return undefined
  const windowPeriods = WINDOW_PERIODS[frequency]
  const comparisonPeriod = shiftPeriod(latest.period, frequency, -windowPeriods)
  const comparison = valid.find(({ period }) => period === comparisonPeriod)
  if (!comparison) return undefined
  const signedChange = latest.value - comparison.value
  return {
    frequency, windowPeriods, latestPeriod: latest.period, latestValue: latest.value,
    comparisonPeriod: comparison.period, comparisonValue: comparison.value,
    signedChange, absoluteChange: Math.abs(signedChange),
  }
}

function movementOrientation(change: number, valence: IndicatorValence): ValenceOrientation {
  if (change === 0 || valence === 'unvalenced') return 'neutral'
  const favorable = valence === 'higher-is-better' ? change > 0 : change < 0
  return favorable ? 'favorable' : 'adverse'
}

export interface DirectionConfiguration {
  frequency: ObservationFrequency
  valence: IndicatorValence
  noisePercentile?: number
  normalizingDimension?: 'labor'
  condition?: IndicatorConditionResult
}

export function calculateIndicatorDirection(
  observations: readonly BriefingObservation[],
  configuration: DirectionConfiguration,
): IndicatorDirectionResult {
  const comparison = selectComparisonWindow(observations)
  if (comparison.evidence !== 'adequate' || !comparison.metadata) {
    return { evidence: 'insufficient', reason: 'inadequate-comparison-window' }
  }
  const currentChange = calculateRecentChange(comparison.observations, configuration.frequency)
  if (!currentChange) return { evidence: 'insufficient', reason: 'missing-exact-comparison-period' }

  const historicalChanges = comparison.observations.flatMap(({ period }) => {
    const change = calculateRecentChange(comparison.observations, configuration.frequency, period)
    return change ? [change.absoluteChange] : []
  })
  if (historicalChanges.length < MIN_DIRECTION_CHANGE_SAMPLE) {
    return { evidence: 'insufficient', reason: 'fewer-than-five-historical-changes' }
  }
  const noiseThreshold = calculatePercentileValue(
    historicalChanges,
    configuration.noisePercentile ?? DEFAULT_NOISE_PERCENTILE,
  )!
  const noiseGatePassed = currentChange.absoluteChange > noiseThreshold
  const orientation = movementOrientation(currentChange.signedChange, configuration.valence)
  let direction: DirectionState = 'broadly-stable'

  if (noiseGatePassed && configuration.valence === 'unvalenced') {
    direction = currentChange.signedChange > 0 ? 'rising' : 'falling'
  } else if (noiseGatePassed) {
    direction = orientation === 'favorable' ? 'improving' : 'deteriorating'
    const favorableCondition = configuration.condition?.evidence === 'adequate'
      && configuration.condition.valence !== 'unvalenced'
      && configuration.condition.group === 'favorable-side'
    if (orientation === 'adverse' && configuration.normalizingDimension === 'labor' && favorableCondition) {
      direction = 'normalizing'
    }
  }

  return {
    evidence: 'adequate', direction, underlyingOrientation: orientation, currentChange,
    noiseThreshold, historicalChangeCount: historicalChanges.length, noiseGatePassed,
    comparisonWindow: comparison.metadata,
  }
}

export interface FreshnessConfiguration {
  expectedCadenceDays: number
  warningMultiplier?: number
  suppressionMultiplier?: number
}

export function evaluateFreshness(
  latestPeriod: string,
  evaluationPeriod: string,
  configuration: FreshnessConfiguration,
): FreshnessResult {
  const latest = parsePeriod(latestPeriod)
  const evaluation = parsePeriod(evaluationPeriod)
  if (!latest || !evaluation || configuration.expectedCadenceDays <= 0) {
    throw new Error('Freshness requires valid periods and a positive cadence.')
  }
  const evidenceAgeDays = Math.max(0, (evaluation.getTime() - latest.getTime()) / DAY_MS)
  const warningThresholdDays = configuration.expectedCadenceDays * (configuration.warningMultiplier ?? 1.5)
  const suppressionThresholdDays = configuration.expectedCadenceDays * (configuration.suppressionMultiplier ?? 2)
  const state = evidenceAgeDays > suppressionThresholdDays
    ? 'no-fresh-evidence'
    : evidenceAgeDays > warningThresholdDays ? 'stale-warning' : 'current'
  return {
    state, evidenceAgeDays, expectedCadenceDays: configuration.expectedCadenceDays,
    warningThresholdDays, suppressionThresholdDays,
    directionSuppressed: state === 'no-fresh-evidence',
  }
}

export function suppressStaleDirection(
  direction: IndicatorDirectionResult,
  freshness: FreshnessResult,
): IndicatorDirectionResult {
  return freshness.directionSuppressed
    ? { evidence: 'no-fresh-evidence', reason: 'freshness-suppression-threshold-exceeded' }
    : direction
}

export function combineDimensionConditions(
  first: IndicatorConditionResult,
  second: IndicatorConditionResult,
): DimensionReadingResult<DimensionCondition, IndicatorConditionResult> {
  const primaries = [first, second] as const
  if (first.evidence !== 'adequate' || second.evidence !== 'adequate'
    || first.valence === 'unvalenced' || second.valence === 'unvalenced') {
    return { reading: 'unclear', reason: 'insufficient-primary-evidence', primaries }
  }
  return first.group === second.group
    ? { reading: first.group, reason: 'primaries-agree', primaries }
    : { reading: 'mixed', reason: 'primaries-disagree', primaries }
}

export function combineDimensionDirections(
  first: IndicatorDirectionResult,
  second: IndicatorDirectionResult,
): DimensionReadingResult<DimensionDirection, IndicatorDirectionResult> {
  const primaries = [first, second] as const
  if (first.evidence === 'no-fresh-evidence' || second.evidence === 'no-fresh-evidence') {
    return { reading: 'no-fresh-evidence', reason: 'no-fresh-primary-evidence', primaries }
  }
  if (first.evidence !== 'adequate' || second.evidence !== 'adequate') {
    return { reading: 'unclear', reason: 'insufficient-primary-evidence', primaries }
  }
  return first.direction === second.direction
    ? { reading: first.direction, reason: 'primaries-agree', primaries }
    : { reading: 'mixed', reason: 'primaries-disagree', primaries }
}
