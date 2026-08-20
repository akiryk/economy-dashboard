import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildFreshnessReport } from '../src/features/data-freshness/freshnessReport'
import { visibleDatasetFreshnessRegistry } from '../src/features/data-freshness/freshnessRegistry'
import type { FreshnessEvidence } from '../src/features/data-freshness/freshnessTypes'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function latestObservation(value: unknown): string | null {
  if (!isRecord(value)) return null
  if (Array.isArray(value.observations)) {
    const periods = value.observations.flatMap((observation) => {
      if (!isRecord(observation)) return []
      if (typeof observation.date === 'string') return [observation.date]
      if (typeof observation.year === 'number') return [String(observation.year)]
      return []
    })
    return periods.sort().at(-1) ?? null
  }
  if (Array.isArray(value.metrics)) {
    const periods = value.metrics.flatMap((metric) =>
      isRecord(metric) && Array.isArray(metric.observations)
        ? metric.observations.flatMap((observation) =>
          isRecord(observation) && typeof observation.period === 'string'
            ? [observation.period]
            : [])
        : [])
    return periods.sort().at(-1) ?? null
  }
  const nestedDates: string[] = []
  for (const nested of Object.values(value)) {
    if (!Array.isArray(nested)) continue
    for (const observation of nested) {
      if (isRecord(observation) && typeof observation.date === 'string') {
        nestedDates.push(observation.date)
      }
    }
  }
  return nestedDates.sort().at(-1) ?? null
}

async function main(): Promise<void> {
  const evaluatedAt = new Date().toISOString()
  const evidence = new Map<string, FreshnessEvidence>()
  for (const dataset of visibleDatasetFreshnessRegistry) {
    try {
      const raw = JSON.parse(await readFile(resolve(dataset.artifactPath), 'utf8')) as unknown
      evidence.set(dataset.datasetId, {
        datasetId: dataset.datasetId,
        evaluatedAt,
        deployedObservation: latestObservation(raw),
        providerCheck: {
          status: 'unavailable',
          checkedAt: evaluatedAt,
          detail: 'Committed data inspected successfully; no live provider or release-calendar evidence was requested.',
        },
      })
    } catch (error) {
      evidence.set(dataset.datasetId, {
        datasetId: dataset.datasetId,
        evaluatedAt,
        deployedObservation: null,
        pipelineFailure: {
          stage: 'validation',
          detail: error instanceof Error ? error.message : String(error),
        },
      })
    }
  }
  const report = buildFreshnessReport(evaluatedAt, evidence)
  const datasetArgumentIndex = process.argv.indexOf('--dataset')
  const requestedDataset = datasetArgumentIndex >= 0
    ? process.argv[datasetArgumentIndex + 1]
    : undefined
  if (datasetArgumentIndex >= 0 && !requestedDataset) {
    throw new Error('--dataset requires a dataset identifier')
  }
  if (requestedDataset) {
    const result = report.results.find((candidate) => candidate.datasetId === requestedDataset)
    if (!result) throw new Error(`Unknown visible dataset: ${requestedDataset}`)
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

await main()
