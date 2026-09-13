import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  classifyOperationalFailure,
  type DiagnosticCategory,
  type OperationalFailureSignal,
} from '../../src/features/data-freshness/operationalDiagnostics'
import type { PipelineFailureStage } from '../../src/features/data-freshness/freshnessTypes'
import type {
  RefreshUnitDefinition,
  RefreshUnitResult,
} from './refreshUnit'

export type RefreshUnitRunner = () => Promise<void>

export interface RefreshFailureClassification {
  category: DiagnosticCategory
  stage: PipelineFailureStage
  reason: string
  retryable: boolean
}

interface ArtifactSnapshot {
  bytes: Buffer | null
  comparableContent: string | null
}

interface ExecuteRefreshUnitsOptions {
  units: readonly RefreshUnitDefinition[]
  runners: ReadonlyMap<string, RefreshUnitRunner>
  rootDirectory?: string
  maximumAttempts?: number
  retryDelaysMilliseconds?: readonly number[]
  delay?: (milliseconds: number) => Promise<void>
  now?: () => Date
}

export class RefreshAtomicityError extends Error {
  constructor(unitId: string, artifactPaths: readonly string[]) {
    super(
      `${unitId} changed artifacts before failing: ${artifactPaths.join(', ')}`,
    )
    this.name = 'RefreshAtomicityError'
  }
}

function sanitizedReason(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  return raw
    .replace(/([?&]api_key=)[^&\s]+/gi, '$1[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500) || 'Unknown refresh failure'
}

function classifySignal(reason: string): {
  signal: OperationalFailureSignal
  stage: PipelineFailureStage
  retryable: boolean
} {
  if (/HTTP (?:429|5\d\d)\b|\b(?:ECONN|ETIMEDOUT|timeout|network|fetch failed|socket)\b/i.test(reason)) {
    return { signal: 'transient-network', stage: 'retrieval', retryable: true }
  }
  if (/HTTP (?:401|403)\b|api[_ -]?key|authentication|unauthorized|forbidden|access denied/i.test(reason)) {
    return { signal: 'authentication-or-access', stage: 'retrieval', retryable: false }
  }
  if (/HTTP 404\b|not found|endpoint/i.test(reason)) {
    return { signal: 'endpoint-not-found', stage: 'retrieval', retryable: false }
  }
  if (/EACCES|EPERM|ENOSPC|rename|write failed|persistence/i.test(reason)) {
    return { signal: 'persistence', stage: 'persistence', retryable: false }
  }
  if (/JSON|parse|schema|malformed|unexpected (?:field|column|worksheet|response)/i.test(reason)) {
    return { signal: 'schema-or-parse', stage: 'parsing', retryable: false }
  }
  if (/validat|deriv|required|coverage|observation|period|history|reconcil/i.test(reason)) {
    return {
      signal: 'validation-or-derivation',
      stage: 'validation',
      retryable: false,
    }
  }
  return { signal: 'unknown', stage: 'retrieval', retryable: false }
}

export function classifyRefreshFailure(
  error: unknown,
  retriesExhausted = false,
): RefreshFailureClassification {
  const reason = sanitizedReason(error)
  const classified = classifySignal(reason)
  return {
    category: classifyOperationalFailure(
      classified.signal,
      retriesExhausted ? 'retries-exhausted' : 'not-applicable',
    ),
    stage: classified.stage,
    reason,
    retryable: classified.retryable,
  }
}

function comparableJson(bytes: Buffer): string {
  const value = JSON.parse(bytes.toString('utf8')) as unknown
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const copy = { ...value } as Record<string, unknown>
    delete copy.retrievedAt
    return JSON.stringify(copy)
  }
  return JSON.stringify(value)
}

async function snapshotArtifact(artifactPath: string): Promise<ArtifactSnapshot> {
  try {
    const bytes = await readFile(artifactPath)
    return { bytes, comparableContent: comparableJson(bytes) }
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { bytes: null, comparableContent: null }
    }
    throw error
  }
}

function sameBytes(left: Buffer | null, right: Buffer | null): boolean {
  if (left === null || right === null) return left === right
  return left.equals(right)
}

async function restoreArtifact(
  artifactPath: string,
  snapshot: ArtifactSnapshot,
): Promise<void> {
  if (snapshot.bytes === null) {
    await unlink(artifactPath).catch((error: unknown) => {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
        throw error
      }
    })
    return
  }

  const temporaryPath = path.join(
    path.dirname(artifactPath),
    `.${path.basename(artifactPath)}.${process.pid}.${Date.now()}.restore`,
  )
  try {
    await writeFile(temporaryPath, snapshot.bytes, { flag: 'wx' })
    await rename(temporaryPath, artifactPath)
  } catch (error: unknown) {
    await unlink(temporaryPath).catch(() => undefined)
    throw error
  }
}

function resultTime(now: () => Date): string {
  return now().toISOString()
}

export async function executeRefreshUnits({
  units,
  runners,
  rootDirectory = process.cwd(),
  maximumAttempts = 3,
  retryDelaysMilliseconds = [250, 1_000],
  delay = async (milliseconds) => {
    await new Promise((resolve) => setTimeout(resolve, milliseconds))
  },
  now = () => new Date(),
}: ExecuteRefreshUnitsOptions): Promise<RefreshUnitResult[]> {
  if (!Number.isInteger(maximumAttempts) || maximumAttempts < 1) {
    throw new Error('maximumAttempts must be a positive integer')
  }

  const unitIds = new Set(units.map(({ id }) => id))
  if (unitIds.size !== units.length) {
    throw new Error('Refresh plan contains duplicate unit IDs')
  }
  const missingRunners = units
    .filter(({ id }) => !runners.has(id))
    .map(({ id }) => id)
  const unexpectedRunners = [...runners.keys()].filter((id) => !unitIds.has(id))
  if (missingRunners.length > 0 || unexpectedRunners.length > 0) {
    throw new Error(
      `Refresh runner coverage mismatch; missing: [${missingRunners.join(', ')}]; ` +
      `unexpected: [${unexpectedRunners.join(', ')}]`,
    )
  }

  const missingDependencies = units.flatMap((unit) =>
    unit.dependencyUnitIds
      .filter((dependencyId) => !unitIds.has(dependencyId))
      .map((dependencyId) => `${unit.id} -> ${dependencyId}`))
  if (missingDependencies.length > 0) {
    throw new Error(
      `Refresh plan contains missing dependencies: ${missingDependencies.join(', ')}`,
    )
  }

  const orderedUnits: RefreshUnitDefinition[] = []
  const pendingUnits = [...units]
  const orderedUnitIds = new Set<string>()
  while (pendingUnits.length > 0) {
    const readyIndex = pendingUnits.findIndex((unit) =>
      unit.dependencyUnitIds.every((dependencyId) => orderedUnitIds.has(dependencyId)))
    if (readyIndex < 0) {
      throw new Error(
        `Refresh plan contains a dependency cycle among: ${pendingUnits.map(({ id }) => id).join(', ')}`,
      )
    }
    const [readyUnit] = pendingUnits.splice(readyIndex, 1)
    orderedUnits.push(readyUnit!)
    orderedUnitIds.add(readyUnit!.id)
  }

  const results: RefreshUnitResult[] = []
  const resultsByUnitId = new Map<string, RefreshUnitResult>()

  for (const unit of orderedUnits) {
    const blockedByUnitIds = unit.dependencyUnitIds.filter((dependencyId) => {
      const dependency = resultsByUnitId.get(dependencyId)
      return !dependency || dependency.status === 'failed' || dependency.status === 'skipped'
    })
    if (blockedByUnitIds.length > 0) {
      const result: RefreshUnitResult = {
        unitId: unit.id,
        affectedDatasetIds: unit.affectedDatasetIds,
        attemptCount: 0,
        completedAt: resultTime(now),
        status: 'skipped',
        preservedArtifactPaths: unit.artifactPaths,
        blockedByUnitIds: blockedByUnitIds as [string, ...string[]],
        reason: 'A required refresh unit did not complete successfully.',
      }
      results.push(result)
      resultsByUnitId.set(unit.id, result)
      continue
    }

    const artifactPaths = unit.artifactPaths.map((artifactPath) =>
      path.resolve(rootDirectory, artifactPath))
    const before = await Promise.all(artifactPaths.map(snapshotArtifact))
    const runner = runners.get(unit.id)!
    let attemptCount = 0
    let failure: RefreshFailureClassification | null = null

    while (attemptCount < maximumAttempts) {
      attemptCount += 1
      try {
        await runner()
        failure = null
        break
      } catch (error: unknown) {
        const afterFailure = await Promise.all(artifactPaths.map(snapshotArtifact))
        const changedAfterFailure = unit.artifactPaths.filter((_, index) =>
          !sameBytes(before[index]!.bytes, afterFailure[index]!.bytes))
        if (changedAfterFailure.length > 0) {
          await Promise.all(changedAfterFailure.map((artifactPath) => {
            const index = unit.artifactPaths.indexOf(artifactPath)
            return restoreArtifact(artifactPaths[index]!, before[index]!)
          }))
          throw new RefreshAtomicityError(unit.id, changedAfterFailure)
        }

        const initialClassification = classifyRefreshFailure(error)
        const retriesExhausted = initialClassification.retryable &&
          attemptCount === maximumAttempts
        failure = classifyRefreshFailure(error, retriesExhausted)
        if (!initialClassification.retryable || retriesExhausted) break

        const delayMilliseconds = retryDelaysMilliseconds[attemptCount - 1] ??
          retryDelaysMilliseconds.at(-1) ?? 0
        await delay(delayMilliseconds)
      }
    }

    if (failure) {
      const result: RefreshUnitResult = {
        unitId: unit.id,
        affectedDatasetIds: unit.affectedDatasetIds,
        attemptCount,
        completedAt: resultTime(now),
        status: 'failed',
        preservedArtifactPaths: unit.artifactPaths,
        failure: {
          category: failure.category,
          stage: failure.stage,
          reason: failure.reason,
        },
      }
      results.push(result)
      resultsByUnitId.set(unit.id, result)
      continue
    }

    const after = await Promise.all(artifactPaths.map(snapshotArtifact))
    const changedArtifactPaths = unit.artifactPaths.filter((_, index) =>
      before[index]!.comparableContent !== after[index]!.comparableContent)
    const result: RefreshUnitResult = changedArtifactPaths.length > 0
      ? {
          unitId: unit.id,
          affectedDatasetIds: unit.affectedDatasetIds,
          attemptCount,
          completedAt: resultTime(now),
          status: 'updated',
          changedArtifactPaths: changedArtifactPaths as [string, ...string[]],
        }
      : {
          unitId: unit.id,
          affectedDatasetIds: unit.affectedDatasetIds,
          attemptCount,
          completedAt: resultTime(now),
          status: 'no-change',
          checkedArtifactPaths: unit.artifactPaths,
        }
    results.push(result)
    resultsByUnitId.set(unit.id, result)
  }

  return results
}
