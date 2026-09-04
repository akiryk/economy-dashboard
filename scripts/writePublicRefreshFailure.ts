import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  dashboardRefreshDatasetId,
  type PublicFreshnessState,
} from '../src/features/data-freshness/freshnessTypes'
import { globalAlertPolicyForDataset } from '../src/features/data-freshness/freshnessRegistry'

interface PublicFreshnessManifest {
  schemaVersion: 1
  generatedAt: string | null
  datasets: PublicFreshnessState[]
}

function argument(name: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  if (!value) throw new Error(`--${name} is required`)
  return value
}

function parseManifest(value: unknown): PublicFreshnessManifest {
  if (typeof value !== 'object' || value === null || !('schemaVersion' in value) ||
    value.schemaVersion !== 1 || !('datasets' in value) || !Array.isArray(value.datasets)) {
    throw new Error('Public freshness manifest is malformed')
  }
  return value as PublicFreshnessManifest
}

export function withRefreshFailure(
  manifest: PublicFreshnessManifest,
  generatedAt: string,
  affectedDatasetId = dashboardRefreshDatasetId,
): PublicFreshnessManifest {
  const policy = globalAlertPolicyForDataset(affectedDatasetId)
  const datasetId = policy.visibility === 'global'
    ? dashboardRefreshDatasetId
    : affectedDatasetId
  const message = policy.visibility === 'global'
    ? 'Data is possibly out of date.'
    : policy.publicMessage
  return {
    schemaVersion: 1,
    generatedAt,
    datasets: [
      ...manifest.datasets.filter((dataset) => dataset.datasetId !== datasetId),
      {
        datasetId,
        state: 'failure',
        message,
      },
    ],
  }
}

async function main() {
  const inputPath = resolve(argument('input'))
  const outputPath = resolve(argument('output'))
  const datasetId = process.argv.includes('--dataset')
    ? argument('dataset')
    : dashboardRefreshDatasetId
  const manifest = parseManifest(JSON.parse(await readFile(inputPath, 'utf8')) as unknown)
  const generatedAt = new Date().toISOString()
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    `${JSON.stringify(withRefreshFailure(manifest, generatedAt, datasetId), null, 2)}\n`,
    { encoding: 'utf8', mode: 0o644 },
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}
