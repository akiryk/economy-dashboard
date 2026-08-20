import { safelyEvaluateDatasetFreshness } from './evaluateFreshness'
import {
  freshnessContracts,
  visibleDatasetFreshnessRegistry,
} from './freshnessRegistry'
import type {
  FreshnessEvidence,
  FreshnessHealthResult,
} from './freshnessTypes'

export interface FreshnessReport {
  schemaVersion: 1
  evaluatedAt: string
  results: FreshnessHealthResult[]
}

export function buildFreshnessReport(
  evaluatedAt: string,
  evidenceByDataset: ReadonlyMap<string, FreshnessEvidence>,
): FreshnessReport {
  return {
    schemaVersion: 1,
    evaluatedAt,
    results: visibleDatasetFreshnessRegistry.map((dataset) =>
      safelyEvaluateDatasetFreshness(
        dataset,
        freshnessContracts,
        evidenceByDataset.get(dataset.datasetId) ?? {
          datasetId: dataset.datasetId,
          evaluatedAt,
          deployedObservation: null,
          providerCheck: {
            status: 'unavailable',
            checkedAt: evaluatedAt,
            detail: 'No provider/release evidence was supplied for this inspection.',
          },
        },
      )),
  }
}
