import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { RefreshUnitResult } from './refreshUnit'
import { refreshUnitRegistry } from './refreshUnitRegistry'
import {
  readRefreshUnitResultFile,
  writeRefreshUnitResultFile,
} from './refreshUnitResultFile'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

async function temporaryFile(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'refresh-result-'))
  temporaryDirectories.push(directory)
  return path.join(directory, 'results.json')
}

describe('refresh-unit result files', () => {
  it('round-trips a controlled registered result', async () => {
    const definition = refreshUnitRegistry.find(
      ({ execution }) => execution === 'scheduled',
    )!
    const result: RefreshUnitResult = {
      unitId: definition.id,
      affectedDatasetIds: definition.affectedDatasetIds,
      attemptCount: 1,
      completedAt: '2030-02-03T04:05:06.000Z',
      status: 'no-change',
      checkedArtifactPaths: definition.artifactPaths,
    }
    const file = await temporaryFile()

    await writeRefreshUnitResultFile(file, [result])

    await expect(readRefreshUnitResultFile(file)).resolves.toEqual([result])
  })

  it('rejects affected datasets that disagree with the registry', async () => {
    const definition = refreshUnitRegistry.find(
      ({ execution }) => execution === 'scheduled',
    )!
    const file = await temporaryFile()
    await writeFile(file, JSON.stringify({
      schemaVersion: 1,
      results: [{
        unitId: definition.id,
        affectedDatasetIds: ['invented-dataset'],
        status: 'no-change',
      }],
    }))

    await expect(readRefreshUnitResultFile(file)).rejects.toThrow(
      `Refresh-unit result does not match the registry: ${definition.id}`,
    )
  })
})
