export type ObservationFrequency = 'weekly' | 'monthly' | 'quarterly'

export type IndicatorValence = 'higher-is-better' | 'lower-is-better' | 'unvalenced'

export type ValenceOrientation = 'favorable' | 'adverse' | 'neutral'

export type ConditionTier =
  | 'very-favorable'
  | 'favorable'
  | 'typical'
  | 'unfavorable'
  | 'very-unfavorable'

export type ConditionGroup = 'favorable-side' | 'typical' | 'unfavorable-side'

export type HistoricalPosition = 'high' | 'typical' | 'low'

export type DirectionState =
  | 'improving'
  | 'deteriorating'
  | 'broadly-stable'
  | 'normalizing'
  | 'rising'
  | 'falling'

export type EvidenceState = 'adequate' | 'insufficient' | 'no-fresh-evidence'

export type FreshnessState = 'current' | 'stale-warning' | 'no-fresh-evidence'

export interface BriefingObservation {
  period: string
  value: number
}

export interface ComparisonWindowMetadata {
  requestedYears: number
  comparisonStart: string
  comparisonEnd: string
  observationCount: number
  usedShortHistory: boolean
}

export interface ComparisonWindowResult {
  observations: BriefingObservation[]
  metadata?: ComparisonWindowMetadata
  evidence: EvidenceState
}

export interface RecentChange {
  frequency: ObservationFrequency
  windowPeriods: number
  latestPeriod: string
  latestValue: number
  comparisonPeriod: string
  comparisonValue: number
  signedChange: number
  absoluteChange: number
}

export type IndicatorConditionResult =
  | {
      evidence: 'adequate'
      valence: Exclude<IndicatorValence, 'unvalenced'>
      rawPercentile: number
      orientedPercentile: number
      tier: ConditionTier
      group: ConditionGroup
      window: ComparisonWindowMetadata
    }
  | {
      evidence: 'adequate'
      valence: 'unvalenced'
      rawPercentile: number
      historicalPosition: HistoricalPosition
      window: ComparisonWindowMetadata
    }
  | { evidence: 'insufficient'; reason: string }

export type IndicatorDirectionResult =
  | {
      evidence: 'adequate'
      direction: DirectionState
      underlyingOrientation: ValenceOrientation
      currentChange: RecentChange
      noiseThreshold: number
      historicalChangeCount: number
      noiseGatePassed: boolean
      comparisonWindow: ComparisonWindowMetadata
    }
  | { evidence: 'insufficient'; reason: string }
  | { evidence: 'no-fresh-evidence'; reason: string }

export interface FreshnessResult {
  state: FreshnessState
  evidenceAgeDays: number
  expectedCadenceDays: number
  warningThresholdDays: number
  suppressionThresholdDays: number
  directionSuppressed: boolean
}

export type DimensionCondition = ConditionGroup | 'mixed' | 'unclear'
export type DimensionDirection = DirectionState | 'mixed' | 'unclear' | 'no-fresh-evidence'

export interface DimensionReadingResult<TReading, TInput> {
  reading: TReading
  reason:
    | 'primaries-agree'
    | 'primaries-disagree'
    | 'insufficient-primary-evidence'
    | 'no-fresh-primary-evidence'
  primaries: readonly [TInput, TInput]
}
