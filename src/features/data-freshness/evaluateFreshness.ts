import type {
  FreshnessContractDefinition,
  FreshnessEvidence,
  FreshnessHealthResult,
  ProviderCheck,
  VisibleDatasetFreshnessDefinition,
} from './freshnessTypes'

function providerObservation(check: ProviderCheck | undefined): string | null {
  return check?.status === 'advanced' || check?.status === 'unchanged'
    ? check.providerObservation
    : null
}

function result(
  dataset: VisibleDatasetFreshnessDefinition,
  evidence: FreshnessEvidence,
  values: Omit<FreshnessHealthResult,
    'datasetId' | 'contractIds' | 'evaluatedAt' | 'latestDeployedObservation' |
    'latestKnownProviderObservation'>,
): FreshnessHealthResult {
  return {
    datasetId: dataset.datasetId,
    contractIds: dataset.contractIds,
    evaluatedAt: evidence.evaluatedAt,
    latestDeployedObservation: evidence.deployedObservation,
    latestKnownProviderObservation: providerObservation(evidence.providerCheck),
    ...values,
  }
}

function latestIsDeployed(deployed: string | null, provider: string): boolean {
  return deployed !== null && deployed >= provider
}

export function evaluateDatasetFreshness(
  dataset: VisibleDatasetFreshnessDefinition,
  contracts: Readonly<Record<string, FreshnessContractDefinition>>,
  evidence: FreshnessEvidence,
): FreshnessHealthResult {
  if (evidence.datasetId !== dataset.datasetId) {
    throw new Error(`Freshness evidence for ${evidence.datasetId} cannot evaluate ${dataset.datasetId}`)
  }
  if (!Number.isFinite(Date.parse(evidence.evaluatedAt))) {
    throw new Error(`Invalid freshness evaluation timestamp for ${dataset.datasetId}`)
  }
  const definitions = dataset.contractIds.map((id) => {
    const definition = contracts[id]
    if (!definition) throw new Error(`Missing freshness contract: ${id}`)
    return definition
  })

  if (evidence.pipelineFailure) {
    return result(dataset, evidence, {
      state: 'failure', reason: 'pipeline-failure', humanActionRequired: true,
      detail: `${evidence.pipelineFailure.stage}: ${evidence.pipelineFailure.detail}`,
    })
  }
  if (evidence.providerCheck?.status === 'failed') {
    return result(dataset, evidence, {
      state: 'failure', reason: 'pipeline-failure', humanActionRequired: true,
      detail: `${evidence.providerCheck.stage}: ${evidence.providerCheck.detail}`,
    })
  }

  const oecd = definitions.find(({ contract }) => contract.kind === 'oecd-peer-snapshot')
  if (oecd?.contract.kind === 'oecd-peer-snapshot') {
    if (!evidence.oecd) {
      return result(dataset, evidence, {
        state: 'warning', reason: 'provider-evidence-unavailable', humanActionRequired: false,
        detail: 'OECD peer-period evidence was not supplied; freshness cannot be determined.',
      })
    }
    const tolerance = evidence.oecd.frequency === 'monthly'
      ? oecd.contract.monthlyPeriodTolerance
      : oecd.contract.quarterlyPeriodTolerance
    const usaCurrent = evidence.oecd.usaPeriodIndex !== null &&
      evidence.oecd.newestPeriodIndex - evidence.oecd.usaPeriodIndex <= tolerance
    const peersCurrent = evidence.oecd.currentPeerCount >= oecd.contract.minimumCurrentPeers
    if (usaCurrent && peersCurrent) {
      return result(dataset, evidence, {
        state: 'healthy', reason: 'oecd-peer-coverage-current', humanActionRequired: false,
        detail: `United States data are within ${tolerance} period(s) and ${evidence.oecd.currentPeerCount} peers are current.`,
      })
    }
    const failed = evidence.oecd.consecutiveFailedChecks >=
      oecd.contract.staleAfterConsecutiveFailedChecks
    return result(dataset, evidence, {
      state: failed ? 'unexpectedly-stale' : 'warning',
      reason: 'oecd-peer-coverage-incomplete', humanActionRequired: failed,
      detail: `OECD coverage has ${evidence.oecd.currentPeerCount} current peers; consecutive failed checks: ${evidence.oecd.consecutiveFailedChecks}.`,
    })
  }

  const irregular = definitions.find(({ contract }) => contract.kind === 'irregular')
  if (irregular?.contract.kind === 'irregular' &&
    (!evidence.providerCheck || evidence.providerCheck.status === 'unavailable')) {
    const restricted = Boolean(irregular.contract.accessRestriction)
    return result(dataset, evidence, {
      state: 'warning',
      reason: restricted ? 'source-access-restricted' : 'manual-or-irregular-review',
      humanActionRequired: irregular.contract.automation !== 'automatic',
      detail: restricted
        ? irregular.contract.accessRestriction!
        : `No fixed release calendar; review at least every ${irregular.contract.reviewIntervalDays} days.`,
    })
  }

  const check = evidence.providerCheck
  if (!check || check.status === 'unavailable') {
    return result(dataset, evidence, {
      state: 'warning', reason: 'provider-evidence-unavailable', humanActionRequired: false,
      detail: check?.status === 'unavailable'
        ? check.detail
        : 'No authoritative provider check or release-calendar evidence was supplied.',
    })
  }
  if (check.status === 'not-due') {
    return result(dataset, evidence, {
      state: 'healthy', reason: 'release-not-due', humanActionRequired: false,
      detail: 'The next observation is not yet due under the source-specific release contract.',
    })
  }
  if (check.status === 'not-advanced') {
    return result(dataset, evidence, {
      state: 'late-provider', reason: 'provider-not-advanced', humanActionRequired: false,
      detail: `The release window passed, but the provider has not published ${check.expectedObservation}.`,
    })
  }

  if (latestIsDeployed(evidence.deployedObservation, check.providerObservation)) {
    return result(dataset, evidence, {
      state: 'healthy', reason: 'current-through-latest-known-provider-observation',
      humanActionRequired: false,
      detail: `The deployed dataset includes provider observation ${check.providerObservation}.`,
    })
  }

  const periodic = definitions.map(({ contract }) => contract).find(
    (contract) => contract.kind === 'weekly' || contract.kind === 'market-day',
  )
  const cadenceMissed = periodic?.kind === 'weekly'
    ? (evidence.expectedReleasesBehind ?? 0) > periodic.maxExpectedReleasesBehind
    : periodic?.kind === 'market-day'
      ? (evidence.completedMarketDaysBehind ?? 0) >= periodic.maxCompletedMarketDaysBehind
      : false
  const grace = Math.max(...definitions.map(({ contract }) =>
    'graceSuccessfulRefreshCycles' in contract
      ? contract.graceSuccessfulRefreshCycles
      : 0))
  const cycles = evidence.successfulRefreshCyclesSinceProviderAdvance ?? 0
  if (!cadenceMissed && cycles < grace) {
    return result(dataset, evidence, {
      state: 'warning', reason: 'within-refresh-grace', humanActionRequired: false,
      detail: `Provider observation ${check.providerObservation} is available; ${cycles} of ${grace} allowed successful refresh cycles have completed.`,
    })
  }
  return result(dataset, evidence, {
    state: 'unexpectedly-stale',
    reason: cadenceMissed ? 'publication-cadence-missed' : 'provider-advanced-not-deployed',
    humanActionRequired: true,
    detail: `Provider observation ${check.providerObservation} is not present in the deployed dataset after the applicable grace period.`,
  })
}

export function safelyEvaluateDatasetFreshness(
  dataset: VisibleDatasetFreshnessDefinition,
  contracts: Readonly<Record<string, FreshnessContractDefinition>>,
  evidence: FreshnessEvidence,
): FreshnessHealthResult {
  try {
    return evaluateDatasetFreshness(dataset, contracts, evidence)
  } catch (error) {
    return result(dataset, evidence, {
      state: 'warning', reason: 'provider-evidence-unavailable', humanActionRequired: true,
      detail: `Freshness evaluation failed without affecting economic data: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}
