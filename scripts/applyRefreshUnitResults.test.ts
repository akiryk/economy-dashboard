import { describe, expect, it } from 'vitest'
import type { RefreshUnitResult } from './refresh/refreshUnit'
import {
  applyRefreshUnitResults,
  type PublicFreshnessManifest,
} from './applyRefreshUnitResults'

const emptyManifest: PublicFreshnessManifest = {
  schemaVersion: 1,
  generatedAt: null,
  datasets: [],
}

function failed(unitId: string, datasetIds: readonly string[]): RefreshUnitResult {
  return {
    unitId,
    affectedDatasetIds: datasetIds,
    attemptCount: 3,
    completedAt: '2030-02-03T04:05:06.000Z',
    status: 'failed',
    preservedArtifactPaths: [`${unitId}.json`],
    failure: {
      category: 'repeated-refresh-failure',
      stage: 'retrieval',
      reason: 'Controlled HTTP 503',
    },
  }
}

function checked(unitId: string, datasetIds: readonly string[]): RefreshUnitResult {
  return {
    unitId,
    affectedDatasetIds: datasetIds,
    attemptCount: 1,
    completedAt: '2030-02-04T04:05:06.000Z',
    status: 'no-change',
    checkedArtifactPaths: [`${unitId}.json`],
  }
}

describe('applyRefreshUnitResults', () => {
  it('publishes one scoped failure across every affected dataset without a global warning', () => {
    const result = applyRefreshUnitResults(
      emptyManifest,
      [failed('claims', ['claims', 'claims-average'])],
      '2030-02-03T04:05:06.000Z',
    )

    expect(result.datasets).toEqual([
      expect.objectContaining({ datasetId: 'claims', state: 'failure' }),
      expect.objectContaining({ datasetId: 'claims-average', state: 'failure' }),
    ])
    expect(result.datasets).not.toContainEqual(expect.objectContaining({
      datasetId: 'dashboard-refresh',
    }))
  })

  it('supports simultaneous failures and preserves unrelated reminder state', () => {
    const result = applyRefreshUnitResults({
      schemaVersion: 1,
      generatedAt: '2030-02-01T00:00:00.000Z',
      datasets: [{
        datasetId: 'manual-source',
        state: 'warning',
        message: 'Controlled review reminder.',
      }],
    }, [
      failed('claims', ['claims']),
      failed('housing', ['housing']),
    ], '2030-02-03T04:05:06.000Z')

    expect(result.datasets.map(({ datasetId }) => datasetId)).toEqual([
      'claims', 'housing', 'manual-source',
    ])
  })

  it('clears a prior failure after a successful check with no newer observation', () => {
    const failedManifest = applyRefreshUnitResults(
      emptyManifest,
      [failed('claims', ['claims'])],
      '2030-02-03T04:05:06.000Z',
    )
    const recovered = applyRefreshUnitResults(
      failedManifest,
      [checked('claims', ['claims'])],
      '2030-02-04T04:05:06.000Z',
    )

    expect(recovered.datasets).toEqual([])
    expect(recovered.generatedAt).toBe('2030-02-04T04:05:06.000Z')
  })

  it('keeps a dependency-skipped unit failed and avoids timestamp-only churn', () => {
    const prior: PublicFreshnessManifest = {
      schemaVersion: 1,
      generatedAt: '2030-02-03T04:05:06.000Z',
      datasets: [{
        datasetId: 'real-wages',
        state: 'failure',
        message: 'The latest automatic update could not run because a required input failed; the last successfully validated observation is shown.',
      }],
    }
    const skipped: RefreshUnitResult = {
      unitId: 'real-wages',
      affectedDatasetIds: ['real-wages'],
      attemptCount: 0,
      completedAt: '2030-02-04T04:05:06.000Z',
      status: 'skipped',
      preservedArtifactPaths: ['real-wages.json'],
      blockedByUnitIds: ['cpi'],
      reason: 'A required refresh unit did not complete successfully.',
    }

    expect(applyRefreshUnitResults(
      prior,
      [skipped],
      '2030-02-04T04:05:06.000Z',
    )).toEqual(prior)
  })
})
