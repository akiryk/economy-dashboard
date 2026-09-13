import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { PublicFreshnessState } from '../src/features/data-freshness/freshnessTypes'
import type { RefreshUnitResult } from './refresh/refreshUnit'
import { readRefreshUnitResultFile } from './refresh/refreshUnitResultFile'

export interface PublicFreshnessManifest {
  schemaVersion: 1
  generatedAt: string | null
  datasets: PublicFreshnessState[]
}

function sortedStates(states: readonly PublicFreshnessState[]): PublicFreshnessState[] {
  return [...states].sort((left, right) => left.datasetId.localeCompare(right.datasetId))
}

export function applyRefreshUnitResults(
  manifest: PublicFreshnessManifest,
  results: readonly RefreshUnitResult[],
  generatedAt: string,
): PublicFreshnessManifest {
  const states = new Map(manifest.datasets.map((state) => [state.datasetId, state]))

  for (const result of results) {
    if (result.status === 'updated' || result.status === 'no-change') {
      for (const datasetId of result.affectedDatasetIds) {
        if (states.get(datasetId)?.state === 'failure') states.delete(datasetId)
      }
      continue
    }
    for (const datasetId of result.affectedDatasetIds) {
      states.set(datasetId, {
        datasetId,
        state: 'failure',
        message: result.status === 'skipped'
          ? 'The latest automatic update could not run because a required input failed; the last successfully validated observation is shown.'
          : 'The latest automatic update failed; the last successfully validated observation is shown.',
      })
    }
  }

  const datasets = sortedStates([...states.values()])
  const changed = JSON.stringify(datasets) !== JSON.stringify(sortedStates(manifest.datasets))
  return {
    schemaVersion: 1,
    generatedAt: changed ? generatedAt : manifest.generatedAt,
    datasets,
  }
}

function argumentsFor(name: string): string[] {
  return process.argv.flatMap((argument, index) =>
    argument === `--${name}` && process.argv[index + 1]
      ? [process.argv[index + 1]!]
      : [])
}

function requiredArgument(name: string): string {
  const [value] = argumentsFor(name)
  if (!value) throw new Error(`--${name} is required`)
  return value
}

async function main(): Promise<void> {
  const inputPath = resolve(requiredArgument('input'))
  const outputPath = resolve(requiredArgument('output'))
  const resultPaths = argumentsFor('results')
  if (resultPaths.length === 0) throw new Error('At least one --results file is required')
  const manifest = JSON.parse(await readFile(inputPath, 'utf8')) as PublicFreshnessManifest
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.datasets)) {
    throw new Error('Public freshness manifest is malformed')
  }
  const results = (await Promise.all(resultPaths.map(readRefreshUnitResultFile))).flat()
  const updated = applyRefreshUnitResults(manifest, results, new Date().toISOString())
  await writeFile(outputPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8')

  const scoped = results.filter(({ status }) => status === 'failed' || status === 'skipped')
  if (process.env.GITHUB_OUTPUT) {
    const failures = scoped.filter((result) => result.status === 'failed')
    const firstFailure = failures[0]
    const affectedDatasetIds = [...new Set(scoped.flatMap(({ affectedDatasetIds }) => affectedDatasetIds))]
    const reason = scoped.length === 0
      ? ''
      : `Scoped refresh units failed or were skipped: ${scoped.map(({ unitId }) => unitId).join(', ')}. Affected datasets retain last-known-good data.`
    await writeFile(process.env.GITHUB_OUTPUT, [
      `actionable=${scoped.length > 0}`,
      `category=${firstFailure?.status === 'failed' ? firstFailure.failure.category : 'unknown-failure'}`,
      `stage=${firstFailure?.status === 'failed' ? firstFailure.failure.stage : 'validation'}`,
      `datasets=${affectedDatasetIds.join(',')}`,
      `reason=${reason}`,
      '',
    ].join('\n'), { flag: 'a' })
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}
