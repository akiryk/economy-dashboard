import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyRefreshUnitResults,
  type PublicFreshnessManifest,
} from '../applyRefreshUnitResults'
import {
  runScheduledRefreshCommand,
  type ScheduledRefreshCompletion,
} from '../refreshScheduledData'
import { executeRefreshUnits, type RefreshUnitRunner } from './executeRefreshUnits'
import type { RefreshUnitDefinition, RefreshUnitResult } from './refreshUnit'
import { refreshUnitRegistry } from './refreshUnitRegistry'
import {
  readRefreshUnitResultFile,
  writeRefreshUnitResultFile,
} from './refreshUnitResultFile'

const temporaryDirectories: string[] = []
const emptyManifest: PublicFreshnessManifest = {
  schemaVersion: 1,
  generatedAt: null,
  datasets: [],
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

async function fixtureDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'resilient-refresh-'))
  temporaryDirectories.push(directory)
  return directory
}

function registeredUnit(
  unitId: string,
  artifactPaths?: readonly [string, ...string[]],
): RefreshUnitDefinition {
  const definition = refreshUnitRegistry.find(({ id }) => id === unitId)
  if (!definition) throw new Error(`Missing controlled unit: ${unitId}`)
  return {
    ...definition,
    artifactPaths: artifactPaths ?? definition.artifactPaths.map((artifactPath) =>
      path.basename(artifactPath)) as [string, ...string[]],
  }
}

function dataset(retrievedAt: string, observations: readonly string[]): string {
  return `${JSON.stringify({ retrievedAt, observations }, null, 2)}\n`
}

interface ControlledRun {
  completion: ScheduledRefreshCompletion
  manifest: PublicFreshnessManifest
  results: RefreshUnitResult[]
  warnings: string[]
}

async function runControlledRefresh(options: {
  directory: string
  units: readonly RefreshUnitDefinition[]
  runners: ReadonlyMap<string, RefreshUnitRunner>
  manifest?: PublicFreshnessManifest
  completedAt?: string
}): Promise<ControlledRun> {
  const completedAt = options.completedAt ?? '2030-02-08T09:17:00.000Z'
  const resultPath = path.join(options.directory, 'refresh-results.json')
  const warnings: string[] = []
  const completion = await runScheduledRefreshCommand({
    apiKey: 'controlled-key',
    retrievedAt: completedAt.slice(0, 10),
  }, {
    refresh: () => executeRefreshUnits({
      units: options.units,
      runners: options.runners,
      rootDirectory: options.directory,
      maximumAttempts: 1,
      now: () => new Date(completedAt),
    }),
    logResult: () => undefined,
    warn: (message) => { warnings.push(message) },
    recordResults: (results) => writeRefreshUnitResultFile(resultPath, results),
  })
  const results = await readRefreshUnitResultFile(resultPath)
  return {
    completion,
    results,
    warnings,
    manifest: applyRefreshUnitResults(
      options.manifest ?? emptyManifest,
      results,
      completedAt,
    ),
  }
}

describe('resilient refresh pipeline acceptance scenarios', () => {
  it('preserves failed claims while a newer mortgage observation advances and publishes', async () => {
    const directory = await fixtureDirectory()
    const claims = registeredUnit('fred-initial-unemployment-claims')
    const mortgage = registeredUnit('fred-dashboard-mortgage-rate-30-year')
    const priorClaims = dataset('2030-01-31', ['2030-01-19'])
    const priorMortgage = dataset('2030-01-31', ['2030-01-24'])
    const nextMortgage = dataset('2030-02-08', ['2030-01-24', '2030-02-07'])
    await writeFile(path.join(directory, claims.artifactPaths[0]), priorClaims)
    await writeFile(path.join(directory, mortgage.artifactPaths[0]), priorMortgage)

    const run = await runControlledRefresh({
      directory,
      units: [claims, mortgage],
      runners: new Map([
        [claims.id, async () => { throw new Error('Provider request failed with HTTP 503') }],
        [mortgage.id, async () => {
          await writeFile(path.join(directory, mortgage.artifactPaths[0]), nextMortgage)
        }],
      ]),
    })

    expect(run.completion).toBe('partial-success')
    expect(run.results).toMatchObject([
      { unitId: claims.id, status: 'failed' },
      { unitId: mortgage.id, status: 'updated' },
    ])
    expect(await readFile(path.join(directory, claims.artifactPaths[0]), 'utf8'))
      .toBe(priorClaims)
    expect(await readFile(path.join(directory, mortgage.artifactPaths[0]), 'utf8'))
      .toBe(nextMortgage)
    expect(run.manifest.datasets).toEqual([
      expect.objectContaining({
        datasetId: 'initial-unemployment-claims',
        state: 'failure',
      }),
    ])
    expect(run.manifest.datasets).not.toContainEqual(expect.objectContaining({
      datasetId: 'mortgage-rate-30-year',
    }))
    expect(run.manifest.datasets).not.toContainEqual(expect.objectContaining({
      datasetId: 'dashboard-refresh',
    }))
    expect(run.warnings).toEqual([
      `Scheduled refresh completed with preserved scoped failures: ${claims.id}`,
    ])
  })

  it('supports multiple scoped failures while an unrelated unit still advances', async () => {
    const directory = await fixtureDirectory()
    const claims = registeredUnit('fred-initial-unemployment-claims')
    const claimsAverage = registeredUnit(
      'fred-initial-unemployment-claims-four-week-average',
    )
    const mortgage = registeredUnit('fred-dashboard-mortgage-rate-30-year')
    const prior = dataset('2030-02-01', ['2030-01-24'])
    for (const unit of [claims, claimsAverage, mortgage]) {
      await writeFile(path.join(directory, unit.artifactPaths[0]), prior)
    }

    const run = await runControlledRefresh({
      directory,
      units: [claims, claimsAverage, mortgage],
      runners: new Map([
        [claims.id, async () => { throw new Error('Controlled claims schema malformed') }],
        [claimsAverage.id, async () => { throw new Error('Controlled average validation failed') }],
        [mortgage.id, async () => {
          await writeFile(
            path.join(directory, mortgage.artifactPaths[0]),
            dataset('2030-02-15', ['2030-01-24', '2030-02-14']),
          )
        }],
      ]),
    })

    expect(run.results.map(({ status }) => status)).toEqual([
      'failed', 'failed', 'updated',
    ])
    expect(run.manifest.datasets.map(({ datasetId }) => datasetId)).toEqual([
      'initial-unemployment-claims',
      'initial-unemployment-claims-four-week-average',
    ])
  })

  it('preserves every output of a failed atomic derivation while unrelated data advance', async () => {
    const directory = await fixtureDirectory()
    const cpi = registeredUnit('fred-cpi')
    const mortgage = registeredUnit('fred-dashboard-mortgage-rate-30-year')
    const prior = dataset('2030-01-31', ['2029-12'])
    for (const artifactPath of [...cpi.artifactPaths, ...mortgage.artifactPaths]) {
      await writeFile(path.join(directory, artifactPath), prior)
    }

    const run = await runControlledRefresh({
      directory,
      units: [cpi, mortgage],
      runners: new Map([
        [cpi.id, async () => {
          throw new Error('Derived CPI output validation failed before replacement')
        }],
        [mortgage.id, async () => {
          await writeFile(
            path.join(directory, mortgage.artifactPaths[0]),
            dataset('2030-02-08', ['2029-12', '2030-02-07']),
          )
        }],
      ]),
    })

    for (const artifactPath of cpi.artifactPaths) {
      expect(await readFile(path.join(directory, artifactPath), 'utf8')).toBe(prior)
    }
    expect(run.results).toMatchObject([
      {
        unitId: cpi.id,
        status: 'failed',
        preservedArtifactPaths: cpi.artifactPaths,
      },
      { unitId: mortgage.id, status: 'updated' },
    ])
    expect(run.manifest.datasets.map(({ datasetId }) => datasetId))
      .toEqual([...cpi.affectedDatasetIds].sort())
  })

  it('clears a prior claims failure after a later successful no-change check', async () => {
    const directory = await fixtureDirectory()
    const claims = registeredUnit('fred-initial-unemployment-claims')
    const artifactPath = path.join(directory, claims.artifactPaths[0])
    const observations = ['2030-01-19']
    await writeFile(artifactPath, dataset('2030-02-08', observations))

    const failedRun = await runControlledRefresh({
      directory,
      units: [claims],
      runners: new Map([
        [claims.id, async () => { throw new Error('Controlled HTTP 503') }],
      ]),
    })
    const recoveredRun = await runControlledRefresh({
      directory,
      units: [claims],
      runners: new Map([
        [claims.id, async () => {
          await writeFile(artifactPath, dataset('2030-02-09', observations))
        }],
      ]),
      manifest: failedRun.manifest,
      completedAt: '2030-02-09T09:17:00.000Z',
    })

    expect(failedRun.manifest.datasets).toHaveLength(1)
    expect(recoveredRun.completion).toBe('complete')
    expect(recoveredRun.results).toMatchObject([{ status: 'no-change' }])
    expect(recoveredRun.manifest.datasets).toEqual([])
    expect(recoveredRun.manifest.generatedAt).toBe('2030-02-09T09:17:00.000Z')
  })
})
