import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  executeRefreshUnits,
  RefreshAtomicityError,
  type RefreshUnitRunner,
} from './executeRefreshUnits'
import type { RefreshUnitDefinition } from './refreshUnit'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

function unit(
  id: string,
  artifactPath: string,
  dependencyUnitIds: readonly string[] = [],
): RefreshUnitDefinition {
  return {
    id,
    sourceFamily: 'fred',
    sourceIds: [`${id}-source`],
    artifactPaths: [artifactPath],
    affectedDatasetIds: [`${id}-dataset`],
    dependencyUnitIds,
    execution: 'scheduled',
  }
}

async function fixtureDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'refresh-units-'))
  temporaryDirectories.push(directory)
  return directory
}

function dataset(retrievedAt: string, observations: readonly string[]): string {
  return `${JSON.stringify({ retrievedAt, observations }, null, 2)}\n`
}

describe('executeRefreshUnits', () => {
  it('exhausts bounded transient retries, preserves that unit, and attempts the next unit', async () => {
    const directory = await fixtureDirectory()
    const failedPath = 'failed.json'
    const healthyPath = 'healthy.json'
    const prior = dataset('2030-01-01', ['2030-01'])
    await writeFile(path.join(directory, failedPath), prior)
    await writeFile(path.join(directory, healthyPath), prior)
    let failedAttempts = 0
    let healthyAttempts = 0
    const delays: number[] = []
    const runners = new Map<string, RefreshUnitRunner>([
      ['failed-unit', async () => {
        failedAttempts += 1
        throw new Error('Provider request failed with HTTP 503?api_key=secret-value')
      }],
      ['healthy-unit', async () => {
        healthyAttempts += 1
        await writeFile(
          path.join(directory, healthyPath),
          dataset('2030-02-01', ['2030-01', '2030-02']),
        )
      }],
    ])

    const results = await executeRefreshUnits({
      units: [unit('failed-unit', failedPath), unit('healthy-unit', healthyPath)],
      runners,
      rootDirectory: directory,
      retryDelaysMilliseconds: [10, 20],
      delay: async (milliseconds) => { delays.push(milliseconds) },
      now: () => new Date('2030-02-03T04:05:06.000Z'),
    })

    expect(failedAttempts).toBe(3)
    expect(healthyAttempts).toBe(1)
    expect(delays).toEqual([10, 20])
    expect(results).toMatchObject([
      {
        unitId: 'failed-unit',
        status: 'failed',
        attemptCount: 3,
        failure: {
          category: 'repeated-refresh-failure',
          stage: 'retrieval',
          reason: 'Provider request failed with HTTP 503?api_key=[redacted]',
        },
      },
      {
        unitId: 'healthy-unit',
        status: 'updated',
        attemptCount: 1,
        changedArtifactPaths: [healthyPath],
      },
    ])
    expect(await readFile(path.join(directory, failedPath), 'utf8')).toBe(prior)
  })

  it('recovers on a bounded retry and reports the attempts used', async () => {
    const directory = await fixtureDirectory()
    const artifactPath = 'retry.json'
    await writeFile(path.join(directory, artifactPath), dataset('2030-01-01', ['2030-01']))
    let attempts = 0

    const results = await executeRefreshUnits({
      units: [unit('retry-unit', artifactPath)],
      runners: new Map([['retry-unit', async () => {
        attempts += 1
        if (attempts === 1) throw new Error('Temporary fetch failed with HTTP 502')
        await writeFile(
          path.join(directory, artifactPath),
          dataset('2030-02-01', ['2030-01', '2030-02']),
        )
      }]]),
      rootDirectory: directory,
      delay: async () => undefined,
    })

    expect(results[0]).toMatchObject({
      unitId: 'retry-unit',
      status: 'updated',
      attemptCount: 2,
    })
  })

  it('skips dependents after a permanent failure but still runs independent units', async () => {
    const directory = await fixtureDirectory()
    const prerequisitePath = 'prerequisite.json'
    const dependentPath = 'dependent.json'
    const independentPath = 'independent.json'
    const prior = dataset('2030-01-01', ['2030-01'])
    await Promise.all([prerequisitePath, dependentPath, independentPath].map((artifactPath) =>
      writeFile(path.join(directory, artifactPath), prior)))
    let dependentRan = false
    let independentRan = false

    const results = await executeRefreshUnits({
      units: [
        unit('dependent-unit', dependentPath, ['prerequisite-unit']),
        unit('prerequisite-unit', prerequisitePath),
        unit('independent-unit', independentPath),
      ],
      runners: new Map([
        ['prerequisite-unit', async () => {
          throw new Error('Provider schema was malformed')
        }],
        ['dependent-unit', async () => { dependentRan = true }],
        ['independent-unit', async () => {
          independentRan = true
          await writeFile(
            path.join(directory, independentPath),
            dataset('2030-02-01', ['2030-01', '2030-02']),
          )
        }],
      ]),
      rootDirectory: directory,
      delay: async () => undefined,
    })

    expect(results).toMatchObject([
      {
        status: 'failed',
        attemptCount: 1,
        failure: { category: 'schema-parsing-failure', stage: 'parsing' },
      },
      {
        status: 'skipped',
        attemptCount: 0,
        blockedByUnitIds: ['prerequisite-unit'],
      },
      { status: 'updated', attemptCount: 1 },
    ])
    expect(dependentRan).toBe(false)
    expect(independentRan).toBe(true)
  })

  it('ignores retrieval-date-only rewrites and detects a later observation', async () => {
    const directory = await fixtureDirectory()
    const artifactPath = 'forward.json'
    await writeFile(path.join(directory, artifactPath), dataset('2030-01-01', ['2030-01']))
    const definition = unit('forward-unit', artifactPath)

    const unchanged = await executeRefreshUnits({
      units: [definition],
      runners: new Map([['forward-unit', async () => {
        await writeFile(
          path.join(directory, artifactPath),
          dataset('2030-02-01', ['2030-01']),
        )
      }]]),
      rootDirectory: directory,
    })
    expect(unchanged[0]).toMatchObject({
      status: 'no-change',
      checkedArtifactPaths: [artifactPath],
    })

    const advanced = await executeRefreshUnits({
      units: [definition],
      runners: new Map([['forward-unit', async () => {
        await writeFile(
          path.join(directory, artifactPath),
          dataset('2030-03-01', ['2030-01', '2030-02']),
        )
      }]]),
      rootDirectory: directory,
    })
    expect(advanced[0]).toMatchObject({
      status: 'updated',
      changedArtifactPaths: [artifactPath],
    })
  })

  it('treats a partial write before failure as a global atomicity violation', async () => {
    const directory = await fixtureDirectory()
    const artifactPath = 'atomic.json'
    const prior = dataset('2030-01-01', ['2030-01'])
    await writeFile(path.join(directory, artifactPath), prior)

    await expect(executeRefreshUnits({
      units: [unit('atomic-unit', artifactPath)],
      runners: new Map([['atomic-unit', async () => {
        await writeFile(
          path.join(directory, artifactPath),
          dataset('2030-02-01', ['2030-01', '2030-02']),
        )
        throw new Error('Validation failed after writing')
      }]]),
      rootDirectory: directory,
    })).rejects.toBeInstanceOf(RefreshAtomicityError)
    expect(await readFile(path.join(directory, artifactPath), 'utf8')).toBe(prior)
  })

  it('rejects missing and unexpected runners before attempting work', async () => {
    const directory = await fixtureDirectory()
    const definition = unit('registered-unit', 'registered.json')

    await expect(executeRefreshUnits({
      units: [definition],
      runners: new Map([['unexpected-unit', async () => undefined]]),
      rootDirectory: directory,
    })).rejects.toThrow(
      'Refresh runner coverage mismatch; missing: [registered-unit]; unexpected: [unexpected-unit]',
    )
  })
})
