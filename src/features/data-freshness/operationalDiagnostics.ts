import type { FreshnessContractId, PipelineFailureStage } from './freshnessTypes'

export const diagnosticCategories = [
  'provider-delay',
  'transient-provider-failure',
  'access-authentication-failure',
  'endpoint-provider-change',
  'schema-parsing-failure',
  'validation-derivation-failure',
  'persistence-write-failure',
  'verification-test-failure',
  'commit-push-failure',
  'deployment-failure',
  'repeated-refresh-failure',
  'manual-action-required',
  'lifecycle-warning',
  'unknown-failure',
] as const

export type DiagnosticCategory = (typeof diagnosticCategories)[number]

export interface OperationalDiagnostic {
  incidentKey: string
  datasetId: string
  contractIds: readonly FreshnessContractId[]
  category: DiagnosticCategory
  stage: PipelineFailureStage
  occurredAt: string
  latestDeployedObservation: string | null
  latestKnownProviderObservation: string | null
  retry: 'not-applicable' | 'will-retry' | 'retries-exhausted' | 'recovered-on-retry'
  lastKnownGoodDataPreserved: boolean
  humanActionRequired: boolean
  reason: string
  workflowUrl: string
}

export interface DiagnosticInput extends Omit<OperationalDiagnostic,
  'humanActionRequired' | 'lastKnownGoodDataPreserved'> {
  humanActionRequired?: boolean
  lastKnownGoodDataPreserved?: boolean
}

export type OperationalFailureSignal =
  | 'provider-not-advanced'
  | 'transient-network'
  | 'authentication-or-access'
  | 'endpoint-not-found'
  | 'schema-or-parse'
  | 'validation-or-derivation'
  | 'persistence'
  | 'verification'
  | 'commit-or-push'
  | 'deployment'
  | 'manual-action'
  | 'possible-discontinuation'
  | 'unknown'

export function classifyOperationalFailure(
  signal: OperationalFailureSignal,
  retry: OperationalDiagnostic['retry'] = 'not-applicable',
): DiagnosticCategory {
  if (signal === 'provider-not-advanced') return 'provider-delay'
  if (signal === 'transient-network') {
    return retry === 'retries-exhausted'
      ? 'repeated-refresh-failure'
      : 'transient-provider-failure'
  }
  const categories: Record<Exclude<OperationalFailureSignal,
    'provider-not-advanced' | 'transient-network'>, DiagnosticCategory> = {
    'authentication-or-access': 'access-authentication-failure',
    'endpoint-not-found': 'endpoint-provider-change',
    'schema-or-parse': 'schema-parsing-failure',
    'validation-or-derivation': 'validation-derivation-failure',
    persistence: 'persistence-write-failure',
    verification: 'verification-test-failure',
    'commit-or-push': 'commit-push-failure',
    deployment: 'deployment-failure',
    'manual-action': 'manual-action-required',
    'possible-discontinuation': 'lifecycle-warning',
    unknown: 'unknown-failure',
  }
  return categories[signal]
}

const actionableCategories = new Set<DiagnosticCategory>([
  'access-authentication-failure',
  'endpoint-provider-change',
  'schema-parsing-failure',
  'validation-derivation-failure',
  'persistence-write-failure',
  'verification-test-failure',
  'commit-push-failure',
  'deployment-failure',
  'repeated-refresh-failure',
  'manual-action-required',
  'lifecycle-warning',
  'unknown-failure',
])

export function createOperationalDiagnostic(input: DiagnosticInput): OperationalDiagnostic {
  if (!Number.isFinite(Date.parse(input.occurredAt))) {
    throw new Error(`Invalid diagnostic timestamp for ${input.datasetId}`)
  }
  return {
    ...input,
    lastKnownGoodDataPreserved: input.lastKnownGoodDataPreserved ?? true,
    humanActionRequired: input.humanActionRequired ?? actionableCategories.has(input.category),
  }
}

export type IncidentTransition =
  | { kind: 'none' }
  | { kind: 'opened'; diagnostic: OperationalDiagnostic }
  | { kind: 'updated'; diagnostic: OperationalDiagnostic }
  | { kind: 'recovered'; incidentKey: string; recoveredAt: string }

export function diagnosticShouldNotify(diagnostic: OperationalDiagnostic): boolean {
  if (diagnostic.retry === 'recovered-on-retry') return false
  if (diagnostic.category === 'provider-delay') return false
  if (diagnostic.category === 'transient-provider-failure' &&
    diagnostic.retry !== 'retries-exhausted') return false
  return diagnostic.humanActionRequired
}

export function transitionDiagnosticIncident(
  previous: OperationalDiagnostic | null,
  current: OperationalDiagnostic | null,
  evaluatedAt: string,
): IncidentTransition {
  if (!current) {
    return previous
      ? { kind: 'recovered', incidentKey: previous.incidentKey, recoveredAt: evaluatedAt }
      : { kind: 'none' }
  }
  if (!diagnosticShouldNotify(current)) return { kind: 'none' }
  if (!previous || previous.incidentKey !== current.incidentKey) {
    return { kind: 'opened', diagnostic: current }
  }
  const unchanged = previous.category === current.category &&
    previous.stage === current.stage &&
    previous.reason === current.reason &&
    previous.latestDeployedObservation === current.latestDeployedObservation &&
    previous.latestKnownProviderObservation === current.latestKnownProviderObservation
  return unchanged ? { kind: 'none' } : { kind: 'updated', diagnostic: current }
}
