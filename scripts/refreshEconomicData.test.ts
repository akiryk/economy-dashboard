import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { validateEconomicSeries } from '../src/features/economic-series/models/validateEconomicSeries'
import { fredSeriesConfigurations } from './fred/seriesConfigurations'
import {
  refreshAllEconomicData,
  refreshEconomicData,
} from './refreshEconomicData'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  )
})

describe('refreshEconomicData', () => {
  it('does not overwrite an existing file when normalization fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const outputPath = path.join(directory, 'real-gdp-growth.json')
    const original = '{"existing":"dataset"}\n'
    await writeFile(outputPath, original, 'utf8')
    const fetchImplementation = async () =>
      new Response(
        JSON.stringify({
          observations: [{ date: '2025-01-01', value: '2.5' }],
        }),
        { status: 200 },
      )

    await expect(
      refreshEconomicData({
        apiKey: 'test-key',
        outputPath,
        retrievedAt: '2025-01-01',
        fetchImplementation,
      }),
    ).rejects.toThrow('at least 80 usable quarterly observations')

    expect(await readFile(outputPath, 'utf8')).toBe(original)
  })

  it('preserves CPI after failure while independently updating GDP', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const gdpPath = path.join(directory, 'real-gdp-growth.json')
    const cpiPath = path.join(directory, 'headline-cpi-inflation.json')
    const existingCpi = '{"existing":"valid CPI fixture"}\n'
    await writeFile(cpiPath, existingCpi, 'utf8')

    const configurations = [
      { ...fredSeriesConfigurations[0]!, outputFile: gdpPath },
      { ...fredSeriesConfigurations[1]!, outputFile: cpiPath },
    ]
    const quarterlyObservations = Array.from({ length: 81 }, (_, index) => {
      const date = new Date(Date.UTC(2000, index * 3, 1))
      return { date: date.toISOString().slice(0, 10), value: '2.5' }
    })
    const fetchImplementation: typeof fetch = async (input) => {
      const requestUrl = new URL(String(input))
      const seriesId = requestUrl.searchParams.get('series_id')
      const observations =
        seriesId === 'GDPC1'
          ? quarterlyObservations
          : [{ date: '2025-01-01', value: '2.5' }]
      return new Response(JSON.stringify({ observations }), { status: 200 })
    }

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key',
      retrievedAt: '2025-01-01',
      configurations,
      fetchImplementation,
    })

    expect(outcomes.map((outcome) => outcome.status)).toEqual([
      'updated',
      'failed',
    ])
    expect(
      validateEconomicSeries(JSON.parse(await readFile(gdpPath, 'utf8')))
        .providerSeriesId,
    ).toBe('GDPC1')
    expect(await readFile(cpiPath, 'utf8')).toBe(existingCpi)
  })
})
