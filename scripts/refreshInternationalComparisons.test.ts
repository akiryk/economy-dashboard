import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { oecdMetricConfigurations } from './oecd/internationalComparisons'
import { refreshInternationalComparisons } from './refreshInternationalComparisons'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

function fixture(config: (typeof oecdMetricConfigurations)[number]): string {
  const columns = ['DATAFLOW', 'REF_AREA', ...Object.keys(config.expected), ...Object.keys(config.allowed ?? {}), 'TIME_PERIOD', 'OBS_VALUE']
  const period = config.frequency === 'monthly' ? '2026-06' : '2026-Q2'
  const rows = ['AUS', 'CAN', 'FRA', 'DEU', 'ITA', 'JPN', 'KOR', 'ESP', 'GBR', 'USA'].map((country, countryIndex) => {
    const values: Record<string, string> = {
      DATAFLOW: `${config.agency}:${config.dataflow}(${config.version})`,
      REF_AREA: country,
      TIME_PERIOD: period,
      OBS_VALUE: String(countryIndex + 1),
      ...config.expected,
    }
    for (const [column, allowed] of Object.entries(config.allowed ?? {})) values[column] = allowed[0]!
    return columns.map((column) => values[column] ?? '').join(',')
  })
  return `${columns.join(',')}\n${rows.join('\n')}\n`
}

describe('international comparison refresh', () => {
  it('writes the complete validated group and preserves it after a source/schema failure', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'international-comparison-'))
    temporaryDirectories.push(directory)
    const outputPath = path.join(directory, 'comparisons.json')
    const successfulFetch = async (input: string | URL | Request) => {
      const url = String(input)
      const config = oecdMetricConfigurations.find(({ dataflow }) => url.includes(dataflow))
      if (!config) return new Response('not found', { status: 404 })
      return new Response(fixture(config), { status: 200 })
    }
    await refreshInternationalComparisons({
      retrievedAt: '2026-08-17',
      outputPath,
      fetchImplementation: successfulFetch as typeof fetch,
    })
    const lastKnownGood = await readFile(outputPath, 'utf8')
    expect(JSON.parse(lastKnownGood).metrics).toHaveLength(5)

    await expect(refreshInternationalComparisons({
      retrievedAt: '2026-08-18',
      outputPath,
      fetchImplementation: (async () => new Response('obsolete query', { status: 400 })) as typeof fetch,
    })).rejects.toThrow(/source\/schema request failed with HTTP 400/)
    expect(await readFile(outputPath, 'utf8')).toBe(lastKnownGood)
  })

  it('does not replace a prior snapshot when one response is invalid', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'international-comparison-'))
    temporaryDirectories.push(directory)
    const outputPath = path.join(directory, 'comparisons.json')
    await writeFile(outputPath, 'last-known-good\n')
    const fetchWithMalformedInflation = async (input: string | URL | Request) => {
      const url = String(input)
      const config = oecdMetricConfigurations.find(({ dataflow }) => url.includes(dataflow))!
      const csv = config.id === 'headline-inflation' ? fixture(config).replaceAll(',CPI,', ',WRONG,') : fixture(config)
      return new Response(csv, { status: 200 })
    }
    await expect(refreshInternationalComparisons({
      retrievedAt: '2026-08-17',
      outputPath,
      fetchImplementation: fetchWithMalformedInflation as typeof fetch,
    })).rejects.toThrow(/unexpected MEASURE/)
    expect(await readFile(outputPath, 'utf8')).toBe('last-known-good\n')
  })
})
