import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { refreshUnitRegistry } from './refresh/refreshUnitRegistry'
import { createScheduledRefreshRunners } from './refreshScheduledData'

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
})
