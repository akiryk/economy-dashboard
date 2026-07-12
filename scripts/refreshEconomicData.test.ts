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
  it('configures both labor series as monthly provider levels without pc1', () => {
    const unemployment = fredSeriesConfigurations.find(
      (config) => config.providerSeriesId === 'UNRATE',
    )
    const primeAgeEmployment = fredSeriesConfigurations.find(
      (config) => config.providerSeriesId === 'LNS12300060',
    )

    for (const config of [unemployment, primeAgeEmployment]) {
      expect(config).toMatchObject({
        fredFrequency: 'm',
        frequency: 'monthly',
        observationStart: '2000-01-01',
        transformation: 'Level',
      })
      expect(config?.fredUnits).toBeUndefined()
    }
  })

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

  it('refreshes all four series through one pipeline and omits units for levels', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const configurations = fredSeriesConfigurations.map((config) => ({
      ...config,
      outputFile: path.join(directory, `${config.slug}.json`),
      minimumUsableObservations: 2,
    }))
    const requestedUrls: URL[] = []
    const fetchImplementation: typeof fetch = async (input) => {
      requestedUrls.push(new URL(String(input)))
      return new Response(
        JSON.stringify({
          observations: [
            { date: '2024-01-01', value: '4.0' },
            { date: '2024-02-01', value: '4.1' },
            { date: '2027-01-01', value: '9.9' },
          ],
        }),
        { status: 200 },
      )
    }

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-12',
      configurations,
      fetchImplementation,
    })

    expect(outcomes).toHaveLength(4)
    expect(outcomes.every((outcome) => outcome.status === 'updated')).toBe(true)
    expect(requestedUrls.map((url) => url.searchParams.get('series_id'))).toEqual([
      'GDPC1',
      'CPIAUCSL',
      'UNRATE',
      'LNS12300060',
    ])
    expect(requestedUrls.slice(0, 2).map((url) => url.searchParams.get('units')))
      .toEqual(['pc1', 'pc1'])
    expect(requestedUrls.slice(2).map((url) => url.searchParams.has('units')))
      .toEqual([false, false])

    for (const config of configurations) {
      const series = validateEconomicSeries(
        JSON.parse(await readFile(config.outputFile, 'utf8')),
      )
      expect(series.observations.at(-1)?.date).toBe('2024-02-01')
    }
  })

  it('continues writing other series when one labor refresh fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const configurations = fredSeriesConfigurations.map((config) => ({
      ...config,
      outputFile: path.join(directory, `${config.slug}.json`),
      minimumUsableObservations: 2,
    }))
    const protectedPath = configurations[2]!.outputFile
    const existing = '{"existing":"valid labor fixture"}\n'
    await writeFile(protectedPath, existing, 'utf8')
    const fetchImplementation: typeof fetch = async (input) => {
      const seriesId = new URL(String(input)).searchParams.get('series_id')
      const observations =
        seriesId === 'UNRATE'
          ? [{ date: '2024-01-01', value: 'invalid' }]
          : [
              { date: '2024-01-01', value: '4.0' },
              { date: '2024-02-01', value: '4.1' },
            ]
      return new Response(JSON.stringify({ observations }), { status: 200 })
    }

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-12',
      configurations,
      fetchImplementation,
    })

    expect(outcomes.map((outcome) => outcome.status)).toEqual([
      'updated',
      'updated',
      'failed',
      'updated',
    ])
    expect(await readFile(protectedPath, 'utf8')).toBe(existing)
    expect(
      validateEconomicSeries(
        JSON.parse(await readFile(configurations[3]!.outputFile, 'utf8')),
      ).providerSeriesId,
    ).toBe('LNS12300060')
  })
})
