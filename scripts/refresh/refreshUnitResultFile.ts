import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { RefreshUnitResult } from './refreshUnit'
import { refreshUnitRegistry } from './refreshUnitRegistry'

export async function writeRefreshUnitResultFile(
  outputPath: string,
  results: readonly RefreshUnitResult[],
): Promise<void> {
  const resolvedPath = resolve(outputPath)
  await mkdir(dirname(resolvedPath), { recursive: true })
  await writeFile(resolvedPath, `${JSON.stringify({
    schemaVersion: 1,
    results,
  }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
}

export async function readRefreshUnitResultFile(
  inputPath: string,
): Promise<RefreshUnitResult[]> {
  const value = JSON.parse(await readFile(resolve(inputPath), 'utf8')) as unknown
  if (typeof value !== 'object' || value === null ||
    !('schemaVersion' in value) || value.schemaVersion !== 1 ||
    !('results' in value) || !Array.isArray(value.results)) {
    throw new Error(`Refresh-unit result file is malformed: ${inputPath}`)
  }

  const definitions = new Map(refreshUnitRegistry.map((unit) => [unit.id, unit]))
  return value.results.map((candidate) => {
    if (typeof candidate !== 'object' || candidate === null ||
      !('unitId' in candidate) || typeof candidate.unitId !== 'string' ||
      !('status' in candidate) || typeof candidate.status !== 'string' ||
      !['updated', 'no-change', 'failed', 'skipped'].includes(candidate.status) ||
      !('affectedDatasetIds' in candidate) || !Array.isArray(candidate.affectedDatasetIds) ||
      !candidate.affectedDatasetIds.every((id: unknown) => typeof id === 'string')) {
      throw new Error(`Refresh-unit result entry is malformed: ${inputPath}`)
    }
    const definition = definitions.get(candidate.unitId)
    if (!definition ||
      JSON.stringify([...candidate.affectedDatasetIds].sort()) !==
        JSON.stringify([...definition.affectedDatasetIds].sort())) {
      throw new Error(`Refresh-unit result does not match the registry: ${candidate.unitId}`)
    }
    return candidate as RefreshUnitResult
  })
}
