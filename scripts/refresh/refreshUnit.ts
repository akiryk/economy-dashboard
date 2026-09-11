import type {
  DiagnosticCategory,
} from '../../src/features/data-freshness/operationalDiagnostics'
import type {
  PipelineFailureStage,
  VisibleDatasetFreshnessDefinition,
} from '../../src/features/data-freshness/freshnessTypes'

export type RefreshSourceFamily =
  | 'atlanta-fed'
  | 'bea'
  | 'bls'
  | 'census-hud'
  | 'federal-reserve'
  | 'fred'
  | 'oecd'

export type RefreshExecution = 'scheduled' | 'scheduled-nonblocking' | 'manual'

export interface RefreshUnitDefinition {
  id: string
  sourceFamily: RefreshSourceFamily
  sourceIds: readonly [string, ...string[]]
  artifactPaths: readonly [string, ...string[]]
  affectedDatasetIds: readonly string[]
  dependencyUnitIds: readonly string[]
  execution: RefreshExecution
}

interface RefreshUnitResultBase {
  unitId: string
  affectedDatasetIds: readonly string[]
  completedAt: string
}

export type RefreshUnitResult =
  | RefreshUnitResultBase & {
      status: 'updated'
      changedArtifactPaths: readonly [string, ...string[]]
    }
  | RefreshUnitResultBase & {
      status: 'no-change'
      checkedArtifactPaths: readonly [string, ...string[]]
    }
  | RefreshUnitResultBase & {
      status: 'failed'
      preservedArtifactPaths: readonly [string, ...string[]]
      failure: {
        category: DiagnosticCategory
        stage: PipelineFailureStage
        reason: string
      }
    }
  | RefreshUnitResultBase & {
      status: 'skipped'
      preservedArtifactPaths: readonly [string, ...string[]]
      blockedByUnitIds: readonly [string, ...string[]]
      reason: string
    }

export interface RefreshUnitCoverageIssue {
  code:
    | 'cyclic-dependency'
    | 'duplicate-artifact-owner'
    | 'duplicate-unit-id'
    | 'missing-artifact-owner'
    | 'missing-dependency'
    | 'mismatched-affected-datasets'
    | 'self-dependency'
  message: string
}

function sorted(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right))
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right))
}

export function validateRefreshUnitCoverage(
  units: readonly RefreshUnitDefinition[],
  datasets: readonly VisibleDatasetFreshnessDefinition[],
): RefreshUnitCoverageIssue[] {
  const issues: RefreshUnitCoverageIssue[] = []
  const unitIds = new Set<string>()
  const artifactOwners = new Map<string, string>()

  for (const unit of units) {
    if (unitIds.has(unit.id)) {
      issues.push({
        code: 'duplicate-unit-id',
        message: `Refresh unit ID is duplicated: ${unit.id}`,
      })
    }
    unitIds.add(unit.id)

    for (const artifactPath of unit.artifactPaths) {
      const owner = artifactOwners.get(artifactPath)
      if (owner) {
        issues.push({
          code: 'duplicate-artifact-owner',
          message: `${artifactPath} is owned by both ${owner} and ${unit.id}`,
        })
      } else {
        artifactOwners.set(artifactPath, unit.id)
      }
    }
  }

  const visitedUnitIds = new Set<string>()
  const activeUnitIds = new Set<string>()

  function visitDependencies(unitId: string, path: readonly string[]): void {
    if (activeUnitIds.has(unitId)) {
      const cycleStart = path.indexOf(unitId)
      const cycle = [...path.slice(cycleStart), unitId]
      issues.push({
        code: 'cyclic-dependency',
        message: `Refresh unit dependency cycle: ${cycle.join(' -> ')}`,
      })
      return
    }
    if (visitedUnitIds.has(unitId)) {
      return
    }

    const unit = units.find((candidate) => candidate.id === unitId)
    if (!unit) {
      return
    }

    activeUnitIds.add(unitId)
    for (const dependencyId of unit.dependencyUnitIds) {
      if (unitIds.has(dependencyId) && dependencyId !== unitId) {
        visitDependencies(dependencyId, [...path, unitId])
      }
    }
    activeUnitIds.delete(unitId)
    visitedUnitIds.add(unitId)
  }

  for (const unit of units) {
    visitDependencies(unit.id, [])
  }

  for (const unit of units) {
    for (const dependencyId of unit.dependencyUnitIds) {
      if (dependencyId === unit.id) {
        issues.push({
          code: 'self-dependency',
          message: `${unit.id} cannot depend on itself`,
        })
      } else if (!unitIds.has(dependencyId)) {
        issues.push({
          code: 'missing-dependency',
          message: `${unit.id} depends on unknown refresh unit ${dependencyId}`,
        })
      }
    }

    const expectedDatasetIds = datasets
      .filter((dataset) => unit.artifactPaths.includes(dataset.artifactPath))
      .map((dataset) => dataset.datasetId)
    if (!sameValues(unit.affectedDatasetIds, expectedDatasetIds)) {
      issues.push({
        code: 'mismatched-affected-datasets',
        message: `${unit.id} maps to [${unit.affectedDatasetIds.join(', ')}], expected [${expectedDatasetIds.join(', ')}]`,
      })
    }
  }

  for (const dataset of datasets) {
    if (!artifactOwners.has(dataset.artifactPath)) {
      issues.push({
        code: 'missing-artifact-owner',
        message: `${dataset.datasetId} has no refresh unit for ${dataset.artifactPath}`,
      })
    }
  }

  return issues
}
