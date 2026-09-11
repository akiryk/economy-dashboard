import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  visibleDatasetFreshnessRegistry,
} from '../../src/features/data-freshness/freshnessRegistry'
import type { VisibleDatasetFreshnessDefinition } from '../../src/features/data-freshness/freshnessTypes'
import {
  validateRefreshUnitCoverage,
  type RefreshUnitDefinition,
  type RefreshUnitResult,
} from './refreshUnit'
import { refreshUnitRegistry } from './refreshUnitRegistry'

const dataDirectory = 'src/features/economic-series/data'

function dataArtifactPaths(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? dataArtifactPaths(path) : [path]
  })
}

describe('refresh unit registry', () => {
  it('owns every registered visible artifact exactly once', () => {
    expect(validateRefreshUnitCoverage(
      refreshUnitRegistry,
      visibleDatasetFreshnessRegistry,
    )).toEqual([])
  })

  it('references existing generated artifacts and nonempty source identities', () => {
    for (const unit of refreshUnitRegistry) {
      expect(unit.sourceIds.length, unit.id).toBeGreaterThan(0)
      expect(unit.artifactPaths.length, unit.id).toBeGreaterThan(0)
      for (const artifactPath of unit.artifactPaths) {
        expect(existsSync(artifactPath), `${unit.id}: ${artifactPath}`).toBe(true)
      }
    }
  })

  it('assigns every committed economic-data artifact to exactly one unit', () => {
    const committedArtifacts = dataArtifactPaths(dataDirectory)
      .filter((path) => path.endsWith('.json'))
      .sort()
    const registeredArtifacts = refreshUnitRegistry
      .flatMap((unit) => unit.artifactPaths)
      .sort()

    expect(registeredArtifacts).toEqual(committedArtifacts)
  })

  it('keeps dependent multi-output derivations in explicit units', () => {
    expect(refreshUnitRegistry.find(({ id }) => id === 'fred-cpi')).toMatchObject({
      artifactPaths: expect.arrayContaining([
        'src/features/economic-series/data/headline-cpi-inflation.json',
        'src/features/economic-series/data/core-cpi-inflation.json',
        'src/features/economic-series/data/headline-cpi-three-month-annualized.json',
      ]),
    })
    expect(refreshUnitRegistry.find(({ id }) => id === 'fred-real-wage-growth'))
      .toMatchObject({ dependencyUnitIds: ['fred-cpi'] })
    expect(refreshUnitRegistry.find(({ id }) => id === 'fred-business-investment'))
      .toMatchObject({ artifactPaths: [
        'src/features/economic-series/data/real-business-investment-growth.json',
        'src/features/economic-series/data/real-business-investment-level.json',
      ] })
  })

  it('accepts a controlled future unit and dataset when their ownership agrees', () => {
    const futureDataset: VisibleDatasetFreshnessDefinition = {
      datasetId: 'controlled-future-series',
      artifactPath: 'src/features/economic-series/data/controlled-future-series.json',
      contractIds: ['BEA-M'],
      surfaces: ['research'],
      seriesSlugs: ['controlled-future-series'],
    }
    const futureUnit: RefreshUnitDefinition = {
      id: 'controlled-future-unit',
      sourceFamily: 'bea',
      sourceIds: ['CONTROLLED'],
      artifactPaths: [futureDataset.artifactPath],
      affectedDatasetIds: [futureDataset.datasetId],
      dependencyUnitIds: [],
      execution: 'scheduled',
    }

    expect(validateRefreshUnitCoverage(
      [...refreshUnitRegistry, futureUnit],
      [...visibleDatasetFreshnessRegistry, futureDataset],
    )).toEqual([])
  })

  it('rejects missing ownership, duplicate ownership, and stale dataset mappings', () => {
    const dataset = visibleDatasetFreshnessRegistry[0]!
    const owner = refreshUnitRegistry.find((unit) =>
      unit.artifactPaths.includes(dataset.artifactPath))!
    const duplicateOwner: RefreshUnitDefinition = {
      ...owner,
      id: 'controlled-duplicate-owner',
    }
    const staleMapping: RefreshUnitDefinition = {
      ...owner,
      id: 'controlled-stale-mapping',
      artifactPaths: ['src/features/economic-series/data/controlled-stale.json'],
    }

    expect(validateRefreshUnitCoverage(
      [owner, duplicateOwner],
      [dataset],
    ).map(({ code }) => code)).toContain('duplicate-artifact-owner')
    expect(validateRefreshUnitCoverage([], [dataset]).map(({ code }) => code))
      .toContain('missing-artifact-owner')
    expect(validateRefreshUnitCoverage(
      [staleMapping],
      [dataset],
    ).map(({ code }) => code)).toEqual(expect.arrayContaining([
      'missing-artifact-owner',
      'mismatched-affected-datasets',
    ]))
  })

  it('rejects missing, self-referential, and cyclic dependencies', () => {
    const baseUnit = refreshUnitRegistry[0]!
    const firstUnit: RefreshUnitDefinition = {
      ...baseUnit,
      id: 'controlled-first-unit',
      affectedDatasetIds: [],
      artifactPaths: ['controlled-first.json'],
      dependencyUnitIds: ['controlled-second-unit'],
    }
    const secondUnit: RefreshUnitDefinition = {
      ...baseUnit,
      id: 'controlled-second-unit',
      affectedDatasetIds: [],
      artifactPaths: ['controlled-second.json'],
      dependencyUnitIds: ['controlled-first-unit'],
    }
    const invalidDependencyUnit: RefreshUnitDefinition = {
      ...baseUnit,
      id: 'controlled-invalid-dependency-unit',
      affectedDatasetIds: [],
      artifactPaths: ['controlled-invalid-dependency.json'],
      dependencyUnitIds: [
        'controlled-invalid-dependency-unit',
        'controlled-missing-unit',
      ],
    }

    expect(validateRefreshUnitCoverage(
      [firstUnit, secondUnit, invalidDependencyUnit],
      [],
    ).map(({ code }) => code)).toEqual(expect.arrayContaining([
      'cyclic-dependency',
      'missing-dependency',
      'self-dependency',
    ]))
  })
})

describe('refresh unit result model', () => {
  it.each<RefreshUnitResult>([
    {
      unitId: 'controlled-unit',
      affectedDatasetIds: ['controlled-dataset'],
      completedAt: '2030-02-03T04:05:06.000Z',
      status: 'updated',
      changedArtifactPaths: ['controlled.json'],
    },
    {
      unitId: 'controlled-unit',
      affectedDatasetIds: ['controlled-dataset'],
      completedAt: '2030-03-04T05:06:07.000Z',
      status: 'no-change',
      checkedArtifactPaths: ['controlled.json'],
    },
    {
      unitId: 'controlled-unit',
      affectedDatasetIds: ['controlled-dataset'],
      completedAt: '2030-04-05T06:07:08.000Z',
      status: 'failed',
      preservedArtifactPaths: ['controlled.json'],
      failure: {
        category: 'schema-parsing-failure',
        stage: 'parsing',
        reason: 'Controlled provider schema changed.',
      },
    },
    {
      unitId: 'controlled-unit',
      affectedDatasetIds: ['controlled-dataset'],
      completedAt: '2030-05-06T07:08:09.000Z',
      status: 'skipped',
      preservedArtifactPaths: ['controlled.json'],
      blockedByUnitIds: ['controlled-prerequisite-unit'],
      reason: 'A required refresh unit did not complete successfully.',
    },
  ])('represents $status without consulting production data', (result) => {
    expect(result.unitId).toBe('controlled-unit')
    expect(result.affectedDatasetIds).toEqual(['controlled-dataset'])
  })
})
