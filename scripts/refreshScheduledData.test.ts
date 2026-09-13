import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { refreshUnitRegistry } from './refresh/refreshUnitRegistry'
import type { RefreshUnitResult } from './refresh/refreshUnit'
import {
  classifyScheduledRefreshCompletion,
  createScheduledRefreshRunners,
  runScheduledRefreshCommand,
} from './refreshScheduledData'

function result(
  unitId: string,
  status: 'updated' | 'no-change' | 'failed',
): RefreshUnitResult {
  const common = {
    unitId,
    affectedDatasetIds: [`${unitId}-dataset`],
    attemptCount: 1,
    completedAt: '2030-02-03T04:05:06.000Z',
  }
  if (status === 'updated') {
    return {
      ...common,
      status,
      changedArtifactPaths: [`${unitId}.json`],
    }
  }
  if (status === 'no-change') {
    return {
      ...common,
      status,
      checkedArtifactPaths: [`${unitId}.json`],
    }
  }
  return {
    ...common,
    status,
    preservedArtifactPaths: [`${unitId}.json`],
    failure: {
      category: 'repeated-refresh-failure',
      stage: 'retrieval',
      reason: 'Controlled provider failure',
    },
  }
}

function skippedResult(unitId: string, blockedByUnitId: string): RefreshUnitResult {
  return {
    unitId,
    affectedDatasetIds: [`${unitId}-dataset`],
    attemptCount: 0,
    completedAt: '2030-02-03T04:05:06.000Z',
    status: 'skipped',
    preservedArtifactPaths: [`${unitId}.json`],
    blockedByUnitIds: [blockedByUnitId],
    reason: 'A required refresh unit did not complete successfully.',
  }
}

describe('scheduled refresh runner coverage', () => {
  it('provides one runner for every normal scheduled unit and no others', () => {
    const expectedUnitIds = refreshUnitRegistry
      .filter(({ execution }) => execution === 'scheduled')
      .map(({ id }) => id)
      .sort()
    const runnerIds = [...createScheduledRefreshRunners({
      apiKey: 'controlled-key',
      retrievedAt: '2030-01-02',
      fetchImplementation: async () => {
        throw new Error('Runner coverage must not execute provider requests')
      },
    }).keys()].sort()

    expect(runnerIds).toEqual(expectedUnitIds)
  })

  it('keeps Table 7 and OECD outside the blocking command but eligible to run independently', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>
    }
    const workflow = readFileSync(
      '.github/workflows/refresh-and-deploy.yml',
      'utf8',
    )
    const table7Command = readFileSync(
      'scripts/refreshInflationDriversData.ts',
      'utf8',
    )
    const oecdCommand = readFileSync(
      'scripts/refreshInternationalComparisons.ts',
      'utf8',
    )

    expect(packageJson.scripts['data:refresh'])
      .toBe('tsx scripts/refreshScheduledData.ts')
    expect(packageJson.scripts['data:refresh-inflation-contributions'])
      .toContain('refreshInflationDriversData.ts --contributions-only')
    expect(packageJson.scripts['data:refresh-international'])
      .toContain('refreshInternationalComparisons.ts')
    expect(workflow).toContain(
      "if: always() && github.event_name != 'push' && steps.install.outcome == 'success'",
    )
    expect(table7Command).toContain("unitId: 'bls-table-7-inflation-contributions'")
    expect(oecdCommand).toContain("unitId: 'oecd-international-comparisons'")
    expect(table7Command).toContain('logRefreshUnitResult(result)')
    expect(oecdCommand).toContain('logRefreshUnitResult(result)')
  })

  it('keeps complete verification and commit gates after the refresh step', () => {
    const workflow = readFileSync(
      '.github/workflows/refresh-and-deploy.yml',
      'utf8',
    )
    const orderedSteps = [
      '- name: Refresh economic datasets',
      '- name: Validate refresh scope',
      '- name: Lint',
      '- name: Typecheck',
      '- name: Test',
      '- name: Run browser smoke tests',
      '- name: Build GitHub Pages application',
      '- name: Check whitespace errors',
      '- name: Commit validated dataset changes',
    ]
    const indexes = orderedSteps.map((step) => workflow.indexOf(step))

    expect(indexes.every((index) => index >= 0)).toBe(true)
    expect(indexes).toEqual([...indexes].sort((left, right) => left - right))
    const oecdStepIndex = workflow.indexOf(
      '- name: Refresh international comparison datasets',
      indexes[0],
    )
    expect(oecdStepIndex).toBeGreaterThan(indexes[0]!)
    const refreshStep = workflow.slice(indexes[0], oecdStepIndex)
    expect(refreshStep).not.toContain('continue-on-error')
    expect(workflow).toContain(
      "git add -- 'src/features/economic-series/data/*.json' 'src/features/data-freshness/data/refresh-metadata.json'",
    )
  })
})

describe('scheduled refresh publication boundary', () => {
  it('completes successfully with a failed unit and a later independent update', async () => {
    const logged: RefreshUnitResult[] = []
    const warnings: string[] = []
    const results = [
      result('claims', 'failed'),
      result('mortgage', 'updated'),
    ]

    const completion = await runScheduledRefreshCommand(
      { apiKey: 'controlled-key', retrievedAt: '2030-02-03' },
      {
        refresh: async () => results,
        logResult: (entry) => { logged.push(entry) },
        warn: (message) => { warnings.push(message) },
      },
    )

    expect(completion).toBe('partial-success')
    expect(logged).toEqual(results)
    expect(warnings).toEqual([
      'Scheduled refresh completed with preserved scoped failures: claims',
    ])
  })

  it('supports multiple scoped failures without converting them to a global error', async () => {
    const results = [
      result('claims', 'failed'),
      skippedResult('real-wages', 'claims'),
      result('housing', 'failed'),
      result('mortgage', 'no-change'),
    ]

    await expect(runScheduledRefreshCommand(
      { apiKey: 'controlled-key', retrievedAt: '2030-02-03' },
      { refresh: async () => results, logResult: () => undefined, warn: () => undefined },
    )).resolves.toBe('partial-success')
  })

  it('reports complete refreshes across successive controlled observations', () => {
    expect(classifyScheduledRefreshCompletion([
      result('mortgage', 'updated'),
    ])).toBe('complete')
    expect(classifyScheduledRefreshCompletion([
      result('mortgage', 'updated'),
      result('claims', 'no-change'),
    ])).toBe('complete')
  })

  it('keeps orchestration errors globally blocking', async () => {
    await expect(runScheduledRefreshCommand(
      { apiKey: 'controlled-key', retrievedAt: '2030-02-03' },
      {
        refresh: async () => {
          throw new Error('Invalid refresh-unit configuration')
        },
      },
    )).rejects.toThrow('Invalid refresh-unit configuration')
  })
})
