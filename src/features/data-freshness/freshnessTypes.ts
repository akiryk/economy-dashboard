export const freshnessHealthStates = [
  'healthy',
  'late-provider',
  'warning',
  'unexpectedly-stale',
  'failure',
] as const

export type FreshnessHealthState = (typeof freshnessHealthStates)[number]

export interface PublicFreshnessState {
  datasetId: string
  state: FreshnessHealthState
  message: string
}

export const dashboardRefreshDatasetId = 'dashboard-refresh'

export type FreshnessContractId =
  | 'BEA-Q'
  | 'BEA-M'
  | 'BEA-IRR'
  | 'BLS-EMP'
  | 'BLS-CPI'
  | 'BLS-T7'
  | 'BLS-JOLTS'
  | 'BLS-PROD'
  | 'DOL-W'
  | 'CENSUS-HOUSING'
  | 'FED-G17'
  | 'FED-POLICY'
  | 'FED-RATES-M'
  | 'FISCAL'
  | 'HOAM-M'
  | 'PMMS-W'
  | 'MARKET-D'
  | 'FED-RESEARCH'
  | 'OECD'

export type AutomaticReleaseContract = {
  kind: 'release-aware'
  cadence: 'monthly' | 'quarterly' | 'annual' | 'source-specific'
  automation: 'automatic'
  graceSuccessfulRefreshCycles: number
  releaseRule: string
}

export type WeeklyContract = {
  kind: 'weekly'
  automation: 'automatic'
  publicationWeekday: 'thursday'
  holidayRule: 'previous-business-day' | 'source-calendar'
  maxExpectedReleasesBehind: number
  graceSuccessfulRefreshCycles: number
}

export type MarketDayContract = {
  kind: 'market-day'
  automation: 'automatic'
  expectedThrough: 'prior-completed-market-day'
  maxCompletedMarketDaysBehind: number
  graceSuccessfulRefreshCycles: number
}

export type EventDrivenContract = {
  kind: 'event-driven'
  automation: 'automatic'
  releaseRule: string
  graceSuccessfulRefreshCycles: number
}

export type IrregularContract = {
  kind: 'irregular'
  automation: 'automatic' | 'manual' | 'partially-manual'
  reviewIntervalDays: number
  releaseRule: string
  accessRestriction?: string
}

export type OecdContract = {
  kind: 'oecd-peer-snapshot'
  automation: 'automatic-nonblocking'
  minimumCurrentPeers: number
  requiredCountry: 'USA'
  monthlyPeriodTolerance: number
  quarterlyPeriodTolerance: number
  staleAfterConsecutiveFailedChecks: number
}

export type FreshnessContract =
  | AutomaticReleaseContract
  | WeeklyContract
  | MarketDayContract
  | EventDrivenContract
  | IrregularContract
  | OecdContract

export interface FreshnessContractDefinition {
  id: FreshnessContractId
  provider: string
  contract: FreshnessContract
}

export type VisibleSurface = 'research' | 'status' | 'compare'

export interface VisibleDatasetFreshnessDefinition {
  datasetId: string
  artifactPath: string
  contractIds: readonly [FreshnessContractId, ...FreshnessContractId[]]
  surfaces: readonly [VisibleSurface, ...VisibleSurface[]]
  seriesSlugs: readonly string[]
}

export type ProviderCheck =
  | { status: 'not-due'; checkedAt: string }
  | { status: 'not-advanced'; checkedAt: string; expectedObservation: string }
  | { status: 'advanced'; checkedAt: string; providerObservation: string }
  | { status: 'unchanged'; checkedAt: string; providerObservation: string }
  | { status: 'unavailable'; checkedAt: string; detail: string }
  | { status: 'failed'; checkedAt: string; stage: PipelineFailureStage; detail: string }

export type PipelineFailureStage =
  | 'retrieval'
  | 'parsing'
  | 'validation'
  | 'derivation'
  | 'persistence'
  | 'verification'
  | 'commit-push'
  | 'deployment'

export interface OecdFreshnessEvidence {
  frequency: 'monthly' | 'quarterly'
  newestPeriodIndex: number
  usaPeriodIndex: number | null
  currentPeerCount: number
  consecutiveFailedChecks: number
}

export interface FreshnessEvidence {
  datasetId: string
  evaluatedAt: string
  deployedObservation: string | null
  providerCheck?: ProviderCheck
  successfulRefreshCyclesSinceProviderAdvance?: number
  expectedReleasesBehind?: number
  completedMarketDaysBehind?: number
  manualReviewAt?: string
  pipelineFailure?: {
    stage: PipelineFailureStage
    detail: string
  }
  oecd?: OecdFreshnessEvidence
}

export interface FreshnessHealthResult {
  datasetId: string
  contractIds: readonly FreshnessContractId[]
  state: FreshnessHealthState
  reason:
    | 'current-through-latest-known-provider-observation'
    | 'release-not-due'
    | 'provider-not-advanced'
    | 'within-refresh-grace'
    | 'provider-advanced-not-deployed'
    | 'publication-cadence-missed'
    | 'manual-or-irregular-review'
    | 'source-access-restricted'
    | 'provider-evidence-unavailable'
    | 'pipeline-failure'
    | 'oecd-peer-coverage-current'
    | 'oecd-peer-coverage-incomplete'
  evaluatedAt: string
  latestDeployedObservation: string | null
  latestKnownProviderObservation: string | null
  humanActionRequired: boolean
  detail: string
}
