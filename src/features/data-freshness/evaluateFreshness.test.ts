import { describe, expect, it } from 'vitest'
import { evaluateDatasetFreshness, safelyEvaluateDatasetFreshness } from './evaluateFreshness'
import { freshnessContracts, visibleDatasetFreshnessById } from './freshnessRegistry'
import type { FreshnessEvidence } from './freshnessTypes'

function definition(id = 'unemployment-rate') {
  const value = visibleDatasetFreshnessById.get(id)
  if (!value) throw new Error(`Missing test dataset: ${id}`)
  return value
}

function evidence(overrides: Partial<FreshnessEvidence> = {}): FreshnessEvidence {
  return {
    datasetId: 'unemployment-rate',
    evaluatedAt: '2026-08-07T12:00:00Z',
    deployedObservation: '2026-07-01',
    ...overrides,
  }
}

describe('release-aware freshness evaluation', () => {
  it('keeps monthly data healthy immediately before its next release', () => {
    expect(evaluateDatasetFreshness(definition(), freshnessContracts, evidence({
      evaluatedAt: '2026-09-03T23:59:00Z',
      providerCheck: { status: 'not-due', checkedAt: '2026-09-03T23:59:00Z' },
    }))).toMatchObject({ state: 'healthy', reason: 'release-not-due' })
  })

  it('distinguishes provider delay immediately after the release window', () => {
    expect(evaluateDatasetFreshness(definition(), freshnessContracts, evidence({
      evaluatedAt: '2026-09-04T13:31:00Z',
      providerCheck: {
        status: 'not-advanced', checkedAt: '2026-09-04T13:31:00Z',
        expectedObservation: '2026-08-01',
      },
    }))).toMatchObject({ state: 'late-provider', reason: 'provider-not-advanced' })
  })

  it('allows one successful refresh-cycle grace, then marks known available data stale', () => {
    const providerCheck = {
      status: 'advanced' as const,
      checkedAt: '2026-09-04T14:00:00Z',
      providerObservation: '2026-08-01',
    }
    expect(evaluateDatasetFreshness(definition(), freshnessContracts, evidence({
      providerCheck, successfulRefreshCyclesSinceProviderAdvance: 0,
    }))).toMatchObject({ state: 'warning', reason: 'within-refresh-grace' })
    expect(evaluateDatasetFreshness(definition(), freshnessContracts, evidence({
      providerCheck, successfulRefreshCyclesSinceProviderAdvance: 1,
    }))).toMatchObject({
      state: 'unexpectedly-stale', reason: 'provider-advanced-not-deployed',
      humanActionRequired: true,
    })
  })

  it('treats an old quarterly observation as healthy before the next dated release', () => {
    expect(evaluateDatasetFreshness(
      definition('real-gdp-growth'), freshnessContracts,
      evidence({
        datasetId: 'real-gdp-growth', deployedObservation: '2026-04-01',
        evaluatedAt: '2026-08-25T23:59:00Z',
        providerCheck: { status: 'not-due', checkedAt: '2026-08-25T23:59:00Z' },
      }),
    )).toMatchObject({ state: 'healthy', reason: 'release-not-due' })
  })
})

describe('weekly, market-day, event, manual, and OECD contracts', () => {
  it('respects weekly cadence and holiday evidence without false alarms', () => {
    const weekly = definition('initial-unemployment-claims')
    expect(evaluateDatasetFreshness(weekly, freshnessContracts, evidence({
      datasetId: weekly.datasetId, deployedObservation: '2026-07-03',
      evaluatedAt: '2026-07-02T18:00:00Z',
      providerCheck: { status: 'not-due', checkedAt: '2026-07-02T18:00:00Z' },
    }))).toMatchObject({ state: 'healthy' })
  })

  it('does not count a weekend as a missing market close', () => {
    const market = definition('dashboard-sp500')
    expect(evaluateDatasetFreshness(market, freshnessContracts, evidence({
      datasetId: market.datasetId, deployedObservation: '2026-08-21',
      evaluatedAt: '2026-08-23T18:00:00Z',
      providerCheck: {
        status: 'unchanged', checkedAt: '2026-08-23T18:00:00Z',
        providerObservation: '2026-08-21',
      }, completedMarketDaysBehind: 0,
    }))).toMatchObject({ state: 'healthy' })
  })

  it('marks two completed market days behind known provider data as stale', () => {
    const market = definition('dashboard-sp500')
    expect(evaluateDatasetFreshness(market, freshnessContracts, evidence({
      datasetId: market.datasetId, deployedObservation: '2026-08-19',
      providerCheck: {
        status: 'advanced', checkedAt: '2026-08-21T23:00:00Z',
        providerObservation: '2026-08-21',
      }, completedMarketDaysBehind: 2,
    }))).toMatchObject({ state: 'unexpectedly-stale', reason: 'publication-cadence-missed' })
  })

  it('keeps unchanged event-driven policy healthy regardless of observation age', () => {
    const policy = definition('federal-funds-target-lower-bound')
    expect(evaluateDatasetFreshness(policy, freshnessContracts, evidence({
      datasetId: policy.datasetId, deployedObservation: '2025-12-11',
      evaluatedAt: '2026-08-20T00:00:00Z',
      providerCheck: {
        status: 'unchanged', checkedAt: '2026-08-20T00:00:00Z',
        providerObservation: '2025-12-11',
      },
    }))).toMatchObject({ state: 'healthy' })
  })

  it('keeps irregular and access-restricted sources non-failing but explicit', () => {
    expect(evaluateDatasetFreshness(
      definition('saving-rate-by-income-decile'), freshnessContracts,
      evidence({ datasetId: 'saving-rate-by-income-decile', deployedObservation: '2023' }),
    )).toMatchObject({ state: 'warning', reason: 'manual-or-irregular-review' })
    expect(evaluateDatasetFreshness(
      definition('inflation-contributions'), freshnessContracts,
      evidence({ datasetId: 'inflation-contributions', deployedObservation: '2026-07-01' }),
    )).toMatchObject({
      state: 'warning', reason: 'source-access-restricted', humanActionRequired: true,
    })
  })

  it('applies OECD peer tolerances and consecutive-failure threshold', () => {
    const oecd = definition('international-comparisons')
    const base = evidence({ datasetId: oecd.datasetId, deployedObservation: '2026-07' })
    expect(evaluateDatasetFreshness(oecd, freshnessContracts, {
      ...base,
      oecd: { frequency: 'monthly', newestPeriodIndex: 24319, usaPeriodIndex: 24318, currentPeerCount: 8, consecutiveFailedChecks: 0 },
    })).toMatchObject({ state: 'healthy', reason: 'oecd-peer-coverage-current' })
    expect(evaluateDatasetFreshness(oecd, freshnessContracts, {
      ...base,
      oecd: { frequency: 'monthly', newestPeriodIndex: 24319, usaPeriodIndex: 24315, currentPeerCount: 7, consecutiveFailedChecks: 3 },
    })).toMatchObject({ state: 'unexpectedly-stale', reason: 'oecd-peer-coverage-incomplete' })
  })
})

describe('failure isolation', () => {
  it('does not mislabel a pipeline failure as provider delay', () => {
    expect(evaluateDatasetFreshness(definition(), freshnessContracts, evidence({
      pipelineFailure: { stage: 'verification', detail: 'tests blocked a valid refresh' },
    }))).toMatchObject({ state: 'failure', reason: 'pipeline-failure' })
  })

  it('isolates malformed evidence as an indeterminate warning', () => {
    const deployed = { observations: [{ date: '2026-07-01', value: 4.1 }] }
    const health = safelyEvaluateDatasetFreshness(definition(), freshnessContracts, evidence({
      evaluatedAt: 'not-a-date',
    }))
    expect(health).toMatchObject({ state: 'warning', reason: 'provider-evidence-unavailable' })
    expect(deployed).toEqual({ observations: [{ date: '2026-07-01', value: 4.1 }] })
  })
})
