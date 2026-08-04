import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { validateEconomicSeries } from '../src/features/economic-series/models/validateEconomicSeries'
import {
  cpiSeriesConfiguration,
  fredSeriesConfigurations,
  payrollSeriesConfiguration,
  wageSeriesConfiguration,
  householdComparisonConfiguration,
  personalSavingRateConfiguration,
  productivitySeriesConfiguration,
  tariffBurdenConfiguration,
  corporateProfitShareConfiguration,
} from './fred/seriesConfigurations'
import {
  refreshAllEconomicData,
  refreshCpiData,
  refreshEconomicData,
  refreshHoamData,
  refreshHouseholdComparisonData,
  refreshProductivityData,
  refreshTariffBurdenData,
  refreshCorporateProfitShareData,
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
  it('atomically preserves the prior profit-share output when either input fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'profit-share-data-'))
    temporaryDirectories.push(directory)
    const outputFile = path.join(directory, 'corporate-profit-share.json')
    await writeFile(outputFile, 'prior valid profit-share data')
    const config = {
      ...corporateProfitShareConfiguration,
      outputFile,
      profitsSource: {
        ...corporateProfitShareConfiguration.profitsSource,
        minimumUsableObservations: 1,
      },
      gdpSource: {
        ...corporateProfitShareConfiguration.gdpSource,
        minimumUsableObservations: 1,
      },
    }

    await expect(refreshCorporateProfitShareData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-18',
      config,
      fetchImplementation: async (input) => {
        const seriesId = new URL(String(input)).searchParams.get('series_id')
        return new Response(JSON.stringify(
          seriesId === 'CPATAX'
            ? { observations: [{ date: '2024-01-01', value: '100' }] }
            : { malformed: true },
        ), { status: 200 })
      },
    })).rejects.toThrow()
    expect(await readFile(outputFile, 'utf8')).toBe('prior valid profit-share data')
  })

  it('fetches both profit-share inputs once and writes their exact ratio', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'profit-share-data-'))
    temporaryDirectories.push(directory)
    const outputFile = path.join(directory, 'corporate-profit-share.json')
    const config = {
      ...corporateProfitShareConfiguration,
      outputFile,
      profitsSource: { ...corporateProfitShareConfiguration.profitsSource, minimumUsableObservations: 1 },
      gdpSource: { ...corporateProfitShareConfiguration.gdpSource, minimumUsableObservations: 1 },
    }
    const requested: string[] = []

    const result = await refreshCorporateProfitShareData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-18',
      config,
      fetchImplementation: async (input) => {
        const seriesId = new URL(String(input)).searchParams.get('series_id')!
        requested.push(seriesId)
        return new Response(JSON.stringify({
          observations: [{
            date: '2024-01-01',
            value: seriesId === 'CPATAX' ? '123.456' : '987.654',
          }],
        }), { status: 200 })
      },
    })

    expect(requested.sort()).toEqual(['CPATAX', 'GDP'])
    expect(result.series.observations[0]?.value).toBe((123.456 / 987.654) * 100)
    expect(validateEconomicSeries(JSON.parse(await readFile(outputFile, 'utf8'))))
      .toMatchObject({ providerSeriesId: 'CPATAX / GDP' })
  })

  it('preserves the prior tariff output when either source is invalid', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'tariff-data-'))
    temporaryDirectories.push(directory)
    const outputFile = path.join(directory, 'effective-tariff-burden.json')
    await writeFile(outputFile, 'prior valid tariff data')
    const config = {
      ...tariffBurdenConfiguration,
      outputFile,
      customsSource: { ...tariffBurdenConfiguration.customsSource, minimumUsableObservations: 1 },
      importsSource: { ...tariffBurdenConfiguration.importsSource, minimumUsableObservations: 1 },
    }

    await expect(refreshTariffBurdenData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-17',
      config,
      fetchImplementation: async (input) => {
        const seriesId = new URL(String(input)).searchParams.get('series_id')
        return new Response(JSON.stringify(seriesId === 'B235RC1Q027SBEA'
          ? { observations: [{ date: '2024-01-01', value: '10' }] }
          : { malformed: true }), { status: 200 })
      },
    })).rejects.toThrow()
    expect(await readFile(outputFile, 'utf8')).toBe('prior valid tariff data')
  })

  it('reports the derived tariff output path instead of a source-only path', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'tariff-report-'))
    temporaryDirectories.push(directory)
    const outputFile = path.join(directory, 'effective-tariff-burden.json')
    const config = {
      ...tariffBurdenConfiguration,
      outputFile,
      customsSource: {
        ...tariffBurdenConfiguration.customsSource,
        minimumUsableObservations: 1,
      },
      importsSource: {
        ...tariffBurdenConfiguration.importsSource,
        minimumUsableObservations: 1,
      },
    }

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-17',
      configurations: [],
      tariffBurdenConfiguration: config,
      fetchImplementation: async (input) => {
        const seriesId = new URL(String(input)).searchParams.get('series_id')
        return new Response(JSON.stringify({
          observations: [{
            date: '2024-01-01',
            value: seriesId === 'B235RC1Q027SBEA' ? '10' : '200',
          }],
        }), { status: 200 })
      },
    })

    expect(outcomes).toHaveLength(1)
    expect(outcomes[0]).toMatchObject({
      status: 'updated',
      config: { outputFile },
    })
  })

  it('distinguishes provider-transformed, provider-level, and local data handling', () => {
    expect(fredSeriesConfigurations.slice(0, 2).map((config) => config.dataHandling))
      .toEqual(['provider-transformed', 'locally-derived'])
    expect(fredSeriesConfigurations.slice(2).map((config) => config.dataHandling))
      .toEqual([
        'locally-derived',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'locally-derived',
        'locally-derived',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'locally-derived',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
        'provider-level',
      ])
    expect(payrollSeriesConfiguration).toMatchObject({
      dataHandling: 'locally-derived',
      providerSeriesId: 'PAYEMS',
      fredFrequency: 'm',
      historyPolicy: { type: 'full' },
    })
    expect(wageSeriesConfiguration).toMatchObject({
      dataHandling: 'multi-source-derived',
      providerSeriesId: 'AHETPI',
      fredFrequency: 'm',
      historyPolicy: { type: 'full' },
    })
    expect(cpiSeriesConfiguration).toMatchObject({
      dataHandling: 'cpi-derived',
      coreSource: {
        providerSeriesId: 'CPILFESL',
        fredFrequency: 'm',
        historyPolicy: { type: 'full' },
      },
    })
    expect(cpiSeriesConfiguration.headlineSource.fredUnits).toBeUndefined()
    expect(
      fredSeriesConfigurations.every(
        (config) => config.historyPolicy.type === 'full',
      ),
    ).toBe(true)
  })

  it('configures quarterly local derivations from full-history levels', () => {
    const configurations = ['A939RX0Q048SBEA', 'OPHNFB', 'PNFIC1'].map((providerSeriesId) =>
      fredSeriesConfigurations.find(
        (config) => config.providerSeriesId === providerSeriesId,
      ),
    )

    for (const config of configurations) {
      expect(config).toMatchObject({
        dataHandling: 'locally-derived',
        frequency: 'quarterly',
        fredFrequency: 'q',
        historyPolicy: { type: 'full' },
        localDerivation: 'year-over-year-quarterly-growth',
      })
      expect(config?.fredUnits).toBeUndefined()
    }
  })

  it('derives PNFIC1 growth by exact quarter and preserves gaps and precision', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'investment-data-'))
    temporaryDirectories.push(directory)
    const outputPath = path.join(directory, 'investment.json')
    const config = {
      ...fredSeriesConfigurations.find(
        (candidate) => candidate.providerSeriesId === 'PNFIC1',
      )!,
      minimumUsableObservations: 5,
    }
    let requestedUrl: URL | undefined
    await refreshEconomicData({
      apiKey: 'test-key',
      outputPath,
      retrievedAt: '2026-07-17',
      config,
      fetchImplementation: async (input) => {
        requestedUrl = new URL(String(input))
        return new Response(JSON.stringify({ observations: [
          { date: '2023-01-01', value: '100' },
          { date: '2023-07-01', value: '100' },
          { date: '2023-10-01', value: '100' },
          { date: '2024-01-01', value: '110' },
          { date: '2024-04-01', value: '120' },
          { date: '2024-07-01', value: '100' },
          { date: '2024-10-01', value: '90' },
          { date: '2025-01-01', value: '116.789' },
        ] }), { status: 200 })
      },
    })

    expect(requestedUrl?.searchParams.get('series_id')).toBe('PNFIC1')
    expect(requestedUrl?.searchParams.get('frequency')).toBe('q')
    expect(requestedUrl?.searchParams.has('units')).toBe(false)
    expect(requestedUrl?.searchParams.has('observation_start')).toBe(false)
    const series = validateEconomicSeries(
      JSON.parse(await readFile(outputPath, 'utf8')),
    )
    expect(series).toMatchObject({
      providerSeriesId: 'PNFIC1',
      frequency: 'quarterly',
      units: 'Percent change from year ago',
      sourceName: expect.stringContaining('Bureau of Economic Analysis'),
      seasonalAdjustment: expect.stringContaining('annual rate'),
    })
    expect(series.observations).toEqual([
      { date: '2024-01-01', value: 10.000000000000009 },
      { date: '2024-04-01', value: null },
      { date: '2024-07-01', value: 0 },
      { date: '2024-10-01', value: -9.999999999999998 },
      { date: '2025-01-01', value: 6.171818181818178 },
    ])
  })

  it.each([
    ['IPMAN', 'Index', 'Provider-published real-output index'],
    ['MANEMP', 'Thousands of persons', 'Provider-published payroll-employment level'],
  ])('configures %s as a direct monthly full-history level', (providerSeriesId, units, transformation) => {
    const config = fredSeriesConfigurations.find((item) => item.providerSeriesId === providerSeriesId)
    expect(config).toMatchObject({
      dataHandling: 'provider-level',
      providerSeriesId,
      frequency: 'monthly',
      fredFrequency: 'm',
      historyPolicy: { type: 'full' },
      units,
      seasonalAdjustment: 'Seasonally adjusted',
      transformation,
    })
    expect(config?.fredUnits).toBeUndefined()
  })

  it('preserves TCU as a provider-published monthly percentage level', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'capacity-data-'))
    temporaryDirectories.push(directory)
    const outputPath = path.join(directory, 'capacity.json')
    const config = {
      ...fredSeriesConfigurations.find(
        (candidate) => candidate.providerSeriesId === 'TCU',
      )!,
      minimumUsableObservations: 2,
    }
    await refreshEconomicData({
      apiKey: 'test-key',
      outputPath,
      retrievedAt: '2026-07-17',
      config,
      fetchImplementation: async () => new Response(JSON.stringify({ observations: [
        { date: '2026-01-01', value: '76.1234' },
        { date: '2026-02-01', value: '.' },
        { date: '2026-03-01', value: '77.5' },
        { date: '2027-01-01', value: '99.9' },
      ] }), { status: 200 }),
    })

    const series = validateEconomicSeries(
      JSON.parse(await readFile(outputPath, 'utf8')),
    )
    expect(series).toMatchObject({
      providerSeriesId: 'TCU',
      frequency: 'monthly',
      units: 'Percent',
      seasonalAdjustment: 'Seasonally adjusted',
      transformation: 'Provider-published level',
      sourceName: expect.stringContaining('Federal Reserve System'),
    })
    expect(series.observations).toEqual([
      { date: '2026-01-01', value: 76.1234 },
      { date: '2026-02-01', value: null },
      { date: '2026-03-01', value: 77.5 },
    ])
  })

  it('configures Story 18 sources as direct full-history provider levels', () => {
    const configs = Object.fromEntries(
      fredSeriesConfigurations
        .filter((item) => ['FEDFUNDS', 'GS10', 'NFCICREDIT'].includes(item.providerSeriesId))
        .map((item) => [item.providerSeriesId, item]),
    )
    expect(configs.FEDFUNDS).toMatchObject({ frequency: 'monthly', fredFrequency: 'm', units: 'Percent', historyPolicy: { type: 'full' } })
    expect(configs.GS10).toMatchObject({ frequency: 'monthly', fredFrequency: 'm', units: 'Percent', historyPolicy: { type: 'full' } })
    expect(configs.NFCICREDIT).toMatchObject({ frequency: 'weekly', fredFrequency: 'w', units: 'Index', historyPolicy: { type: 'full' } })
    expect(Object.values(configs).every((config) => config.fredUnits === undefined)).toBe(true)
  })

  it('configures Story 19 ratios as direct full-history provider values', () => {
    const budget = fredSeriesConfigurations.find((item) => item.providerSeriesId === 'FYFSGDA188S')
    const debt = fredSeriesConfigurations.find((item) => item.providerSeriesId === 'FYGFGDQ188S')
    expect(budget).toMatchObject({ frequency: 'annual', fredFrequency: 'a', units: 'Percent of GDP', historyPolicy: { type: 'full' }, sourceName: expect.stringContaining('Office of Management and Budget') })
    expect(debt).toMatchObject({ frequency: 'quarterly', fredFrequency: 'q', units: 'Percent of GDP', historyPolicy: { type: 'full' }, title: expect.stringContaining('Debt Held by the Public') })
    expect(budget?.fredUnits).toBeUndefined()
    expect(debt?.fredUnits).toBeUndefined()
  })

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
        historyPolicy: { type: 'full' },
        transformation: 'Level',
      })
      expect(config?.fredUnits).toBeUndefined()
    }
  })

  it('configures TDSP as a full-history quarterly provider level', () => {
    const config = fredSeriesConfigurations.find(
      (candidate) => candidate.providerSeriesId === 'TDSP',
    )

    expect(config).toMatchObject({
      dataHandling: 'provider-level',
      slug: 'household-debt-service-ratio',
      frequency: 'quarterly',
      fredFrequency: 'q',
      historyPolicy: { type: 'full' },
      units: 'Percent',
      transformation: 'Level',
    })
    expect(config?.fredUnits).toBeUndefined()
    expect(config?.localDerivation).toBeUndefined()
  })

  it('normalizes TDSP as a validated level and preserves missing observations', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'tdsp-data-'))
    temporaryDirectories.push(directory)
    const outputPath = path.join(directory, 'tdsp.json')
    const config = {
      ...fredSeriesConfigurations.find(
        (candidate) => candidate.providerSeriesId === 'TDSP',
      )!,
      minimumUsableObservations: 2,
    }
    const requestedUrls: URL[] = []

    const result = await refreshEconomicData({
      apiKey: 'test-key',
      outputPath,
      retrievedAt: '2026-07-16',
      config,
      fetchImplementation: async (input) => {
        requestedUrls.push(new URL(String(input)))
        return new Response(JSON.stringify({ observations: [
          { date: '2025-01-01', value: '11.1' },
          { date: '2025-04-01', value: '.' },
          { date: '2025-07-01', value: '11.3' },
          { date: '2027-01-01', value: '99.9' },
        ] }), { status: 200 })
      },
    })

    expect(requestedUrls[0]?.searchParams.get('series_id')).toBe('TDSP')
    expect(requestedUrls[0]?.searchParams.get('frequency')).toBe('q')
    expect(requestedUrls[0]?.searchParams.has('units')).toBe(false)
    expect(requestedUrls[0]?.searchParams.has('observation_start')).toBe(false)
    expect(result.series).toMatchObject({
      providerSeriesId: 'TDSP',
      frequency: 'quarterly',
      units: 'Percent',
      transformation: 'Level',
      observations: [
        { date: '2025-01-01', value: 11.1 },
        { date: '2025-04-01', value: null },
        { date: '2025-07-01', value: 11.3 },
      ],
    })
    expect(validateEconomicSeries(
      JSON.parse(await readFile(outputPath, 'utf8')),
    ).slug).toBe('household-debt-service-ratio')
  })

  it.each([
    [[{ date: 'not-a-date', value: '11.1' }], 1, 'invalid date'],
    [[{ date: '2025-01-01', value: 'not-a-number' }], 1, 'invalid value'],
    [[
      { date: '2025-01-01', value: '11.1' },
      { date: '2025-01-01', value: '11.2' },
    ], 1, 'duplicate date'],
    [[{ date: '2025-01-01', value: '11.1' }], 2, 'at least 2 usable'],
  ])('preserves TDSP after invalid provider data', async (
    observations,
    minimumUsableObservations,
    message,
  ) => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'tdsp-data-'))
    temporaryDirectories.push(directory)
    const outputPath = path.join(directory, 'tdsp.json')
    const original = '{"existing":"valid TDSP fixture"}\n'
    await writeFile(outputPath, original, 'utf8')
    const config = {
      ...fredSeriesConfigurations.find(
        (candidate) => candidate.providerSeriesId === 'TDSP',
      )!,
      minimumUsableObservations,
    }

    await expect(refreshEconomicData({
      apiKey: 'test-key',
      outputPath,
      retrievedAt: '2026-07-16',
      config,
      fetchImplementation: async () => new Response(
        JSON.stringify({ observations }),
        { status: 200 },
      ),
    })).rejects.toThrow(message)
    expect(await readFile(outputPath, 'utf8')).toBe(original)
  })

  it('configures household comparison sources as full-history quarterly per-capita levels', () => {
    const sources = [
      householdComparisonConfiguration.incomeSource,
      householdComparisonConfiguration.spendingSource,
      personalSavingRateConfiguration,
    ]
    expect(sources.map((source) => source.providerSeriesId)).toEqual([
      'A229RX0Q048SBEA',
      'A794RX0Q048SBEA',
      'PSAVERT',
    ])
    for (const source of sources.slice(0, 2)) {
      expect(source).toMatchObject({
        frequency: 'quarterly',
        fredFrequency: 'q',
        historyPolicy: { type: 'full' },
        localDerivation: 'year-over-year-quarterly-growth',
      })
      expect(source.fredUnits).toBeUndefined()
    }
    expect(personalSavingRateConfiguration).toMatchObject({
      frequency: 'monthly', fredFrequency: 'm', historyPolicy: { type: 'full' },
    })
    expect(personalSavingRateConfiguration.transformation).toBe('Level')
  })

  it('derives and writes both quarterly per-capita household growth series as one coherent group', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'household-quarterly-'))
    temporaryDirectories.push(directory)
    const incomeOutputFile = path.join(directory, 'income.json')
    const spendingOutputFile = path.join(directory, 'spending.json')
    const observations = Array.from({ length: 9 }, (_, index) => ({
      date: new Date(Date.UTC(2023, index * 3, 1)).toISOString().slice(0, 10),
      value: String(100 + index),
    })).reverse()
    const requested: string[] = []
    const result = await refreshHouseholdComparisonData({
      apiKey: 'test-key', retrievedAt: '2025-01-01',
      config: {
        ...householdComparisonConfiguration,
        incomeOutputFile, spendingOutputFile,
        incomeSource: { ...householdComparisonConfiguration.incomeSource, minimumUsableObservations: 5 },
        spendingSource: { ...householdComparisonConfiguration.spendingSource, minimumUsableObservations: 5 },
      },
      fetchImplementation: async (input) => {
        requested.push(new URL(String(input)).searchParams.get('series_id') ?? '')
        return new Response(JSON.stringify({ observations }), { status: 200 })
      },
    })
    expect(requested.sort()).toEqual(['A229RX0Q048SBEA', 'A794RX0Q048SBEA'])
    expect(result.incomeGrowth.observations[0]?.date).toBe('2024-01-01')
    expect(result.incomeGrowth.observations[0]?.value).toBeCloseTo(4)
    expect(result.spendingGrowth.observations).toHaveLength(5)
    expect(validateEconomicSeries(JSON.parse(await readFile(incomeOutputFile, 'utf8'))).frequency).toBe('quarterly')
    expect(validateEconomicSeries(JSON.parse(await readFile(spendingOutputFile, 'utf8'))).providerSeriesId).toBe('A794RX0Q048SBEA')
  })

  it('preserves both quarterly household outputs when either source is invalid', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'household-quarterly-'))
    temporaryDirectories.push(directory)
    const incomeOutputFile = path.join(directory, 'income.json')
    const spendingOutputFile = path.join(directory, 'spending.json')
    await writeFile(incomeOutputFile, 'old income\n', 'utf8')
    await writeFile(spendingOutputFile, 'old spending\n', 'utf8')
    await expect(refreshHouseholdComparisonData({
      apiKey: 'test-key', retrievedAt: '2025-01-01',
      config: {
        ...householdComparisonConfiguration,
        incomeOutputFile, spendingOutputFile,
        incomeSource: { ...householdComparisonConfiguration.incomeSource, minimumUsableObservations: 2 },
        spendingSource: { ...householdComparisonConfiguration.spendingSource, minimumUsableObservations: 2 },
      },
      fetchImplementation: async (input) => {
        const id = new URL(String(input)).searchParams.get('series_id')
        const observations = id === 'A794RX0Q048SBEA'
          ? [{ date: '2024-01-01', value: 'invalid' }, { date: '2025-01-01', value: '101' }]
          : [{ date: '2024-01-01', value: '100' }, { date: '2025-01-01', value: '101' }]
        return new Response(JSON.stringify({ observations }), { status: 200 })
      },
    })).rejects.toThrow()
    expect(await readFile(incomeOutputFile, 'utf8')).toBe('old income\n')
    expect(await readFile(spendingOutputFile, 'utf8')).toBe('old spending\n')
  })

  it('configures one full-history OPHNFB source for level and growth outputs', () => {
    expect(productivitySeriesConfiguration).toMatchObject({
      dataHandling: 'productivity-derived',
      levelSource: {
        providerSeriesId: 'OPHNFB',
        frequency: 'quarterly',
        fredFrequency: 'q',
        historyPolicy: { type: 'full' },
        transformation:
          'Published level, normalized to 100 at the selected-range start for display',
      },
      growthSource: {
        providerSeriesId: 'OPHNFB',
        localDerivation: 'year-over-year-quarterly-growth',
        historyPolicy: { type: 'full' },
      },
    })
    expect(productivitySeriesConfiguration.levelSource.fredUnits).toBeUndefined()
    expect(productivitySeriesConfiguration.growthSource.fredUnits).toBeUndefined()
  })

  it('fetches OPHNFB once and writes validated level and growth outputs together', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'productivity-data-'))
    temporaryDirectories.push(directory)
    const levelOutputFile = path.join(directory, 'level.json')
    const growthOutputFile = path.join(directory, 'growth.json')
    let fetchCount = 0
    const observations = Array.from({ length: 81 }, (_, index) => {
      const date = new Date(Date.UTC(2000, index * 3, 1))
      return { date: date.toISOString().slice(0, 10), value: String(50 + index) }
    })
    const result = await refreshProductivityData({
      apiKey: 'test-key',
      retrievedAt: '2020-01-01',
      config: {
        ...productivitySeriesConfiguration,
        levelOutputFile,
        growthOutputFile,
        levelSource: {
          ...productivitySeriesConfiguration.levelSource,
          minimumUsableObservations: 80,
        },
        growthSource: {
          ...productivitySeriesConfiguration.growthSource,
          minimumUsableObservations: 80,
        },
      },
      fetchImplementation: async () => {
        fetchCount += 1
        return new Response(JSON.stringify({ observations }), { status: 200 })
      },
    })
    expect(fetchCount).toBe(1)
    expect(result.level.observations).toHaveLength(81)
    expect(result.growth.observations).toHaveLength(77)
    expect(validateEconomicSeries(JSON.parse(await readFile(levelOutputFile, 'utf8'))).transformation).toContain('Published level')
    expect(validateEconomicSeries(JSON.parse(await readFile(growthOutputFile, 'utf8'))).transformation).toContain('calculated by the application')
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

  it('refreshes all direct sources once and omits provider transformations for local derivations', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const configurations = fredSeriesConfigurations.map((config) => ({
      ...config,
      outputFile: path.join(directory, `${config.slug}.json`),
      minimumUsableObservations: 2,
    }))
    const requestedUrls: URL[] = []
    const fetchImplementation: typeof fetch = async (input) => {
      const url = new URL(String(input))
      requestedUrls.push(url)
      const seriesId = url.searchParams.get('series_id')
      const locallyDerived = ['A939RX0Q048SBEA', 'OPHNFB', 'PNFIC1'].includes(seriesId ?? '')
      const monthlyPriceLevels = ['CPIAUCSL', 'PCEPI'].includes(seriesId ?? '')
        ? [
            ...Array.from({ length: 14 }, (_, index) => ({
              date: new Date(Date.UTC(2024, index, 1)).toISOString().slice(0, 10),
              value: String(100 + index),
            })),
            { date: '2027-01-01', value: '999' },
          ]
        : null
      return new Response(
        JSON.stringify({
          observations: monthlyPriceLevels ?? (locallyDerived
            ? [
                { date: '2024-01-01', value: '100' },
                { date: '2024-04-01', value: '101' },
                { date: '2024-07-01', value: '102' },
                { date: '2024-10-01', value: '103' },
                { date: '2025-01-01', value: '104' },
                { date: '2027-01-01', value: '999' },
              ]
            : [
                { date: '2024-01-01', value: '4.0' },
                { date: '2024-02-01', value: '4.1' },
                { date: '2027-01-01', value: '9.9' },
              ]),
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

    expect(outcomes).toHaveLength(26)
    expect(outcomes.every((outcome) => outcome.status === 'updated')).toBe(true)
    expect(
      outcomes.map((outcome) =>
        outcome.status === 'updated' ? outcome.sourceObservationCount : null,
      ),
    ).toEqual([3, 15, 15, 3, 3, 3, 3, 3, 6, 6, 3, 3, 3, 3, 3, 6, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3])
    expect(requestedUrls.map((url) => url.searchParams.get('series_id'))).toEqual([
      'GDPC1',
      'CPIAUCSL',
      'PCEPI',
      'UNRATE',
      'LNS12300060',
      'JTSLDR',
      'ICSA',
      'IC4WSA',
      'A939RX0Q048SBEA',
      'OPHNFB',
      'TDSP',
      'HOUST',
      'POPTHM',
      'IPMAN',
      'MANEMP',
      'PNFIC1',
      'TCU',
      'FEDFUNDS',
      'GS10',
      'NFCICREDIT',
      'DRTSCILM',
      'FYFSGDA188S',
      'FYGFGDQ188S',
      'A019RE1Q156NBEA',
      'FRBKCLMCILA',
      'FRBKCLMCIM',
    ])
    expect(requestedUrls[0]?.searchParams.get('units')).toBe('pc1')
    expect(
      requestedUrls.slice(1).every((url) => !url.searchParams.has('units')),
    ).toBe(true)
    expect(
      requestedUrls.every((url) => !url.searchParams.has('observation_start')),
    ).toBe(true)

    for (const config of configurations) {
      const series = validateEconomicSeries(
        JSON.parse(await readFile(config.outputFile, 'utf8')),
      )
      const expectedDate = ['CPIAUCSL', 'PCEPI'].includes(config.providerSeriesId)
        ? '2025-02-01'
        : ['A939RX0Q048SBEA', 'OPHNFB', 'PNFIC1'].includes(config.providerSeriesId)
          ? '2025-01-01'
          : '2024-02-01'
      expect(series.observations.at(-1)?.date).toBe(expectedDate)
    }
  })

  it('continues writing other series when one labor refresh fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const configurations = [
      fredSeriesConfigurations[0]!,
      fredSeriesConfigurations.find(({ providerSeriesId }) => providerSeriesId === 'UNRATE')!,
      fredSeriesConfigurations.find(({ providerSeriesId }) => providerSeriesId === 'LNS12300060')!,
    ].map((config) => ({
      ...config,
      outputFile: path.join(directory, `${config.slug}.json`),
      minimumUsableObservations: 2,
    }))
    const protectedPath = configurations[1]!.outputFile
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
      'failed',
      'updated',
    ])
    expect(await readFile(protectedPath, 'utf8')).toBe(existing)
    expect(
      validateEconomicSeries(
        JSON.parse(await readFile(configurations[2]!.outputFile, 'utf8')),
      ).providerSeriesId,
    ).toBe('LNS12300060')
  })

  it('preserves one claims series without blocking the other', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const configurations = ['ICSA', 'IC4WSA'].map((providerSeriesId) => fredSeriesConfigurations.find(
      (config) => config.providerSeriesId === providerSeriesId,
    )!).map((config) => ({
      ...config,
      outputFile: path.join(directory, `${config.slug}.json`),
      minimumUsableObservations: 2,
    }))
    const protectedPath = configurations[0]!.outputFile
    const existing = '{"existing":"valid claims fixture"}\n'
    await writeFile(protectedPath, existing, 'utf8')

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-12',
      configurations,
      fetchImplementation: async (input) => {
        const seriesId = new URL(String(input)).searchParams.get('series_id')
        return new Response(JSON.stringify({
          observations: seriesId === 'ICSA'
            ? [{ date: '2026-01-03', value: 'invalid' }]
            : [
                { date: '2026-01-03', value: '220000' },
                { date: '2026-01-10', value: '215000' },
              ],
        }), { status: 200 })
      },
    })

    expect(outcomes.map((outcome) => outcome.status)).toEqual(['failed', 'updated'])
    expect(await readFile(protectedPath, 'utf8')).toBe(existing)
    await expect(readFile(configurations[1]!.outputFile, 'utf8')).resolves.toContain('IC4WSA')
  })

  it('preserves the prior lending-standards file when its refresh is invalid', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const source = fredSeriesConfigurations.find(
      (config) => config.providerSeriesId === 'DRTSCILM',
    )!
    const config = {
      ...source,
      outputFile: path.join(directory, 'bank-lending-standards.json'),
      minimumUsableObservations: 2,
    }
    const existing = '{"existing":"valid lending standards fixture"}\n'
    await writeFile(config.outputFile, existing, 'utf8')

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-17',
      configurations: [config],
      fetchImplementation: async () => new Response(JSON.stringify({
        observations: [{ date: '2026-04-01', value: 'invalid' }],
      }), { status: 200 }),
    })

    expect(outcomes[0]?.status).toBe('failed')
    expect(await readFile(config.outputFile, 'utf8')).toBe(existing)
  })

  it('fetches PAYEMS once and atomically writes both derived outputs', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const payrollConfiguration = {
      ...payrollSeriesConfiguration,
      monthlyChangeOutputFile: path.join(directory, 'monthly.json'),
      payrollGrowthOutputFile: path.join(directory, 'average.json'),
    }
    const requestedUrls: URL[] = []
    const fetchImplementation: typeof fetch = async (input) => {
      requestedUrls.push(new URL(String(input)))
      return new Response(
        JSON.stringify({
          observations: [
            { date: '1999-10-01', value: '1000' },
            { date: '1999-11-01', value: '1010' },
            { date: '1999-12-01', value: '1030' },
            { date: '2000-01-01', value: '1060' },
            { date: '2000-02-01', value: '1050' },
            { date: '2027-01-01', value: '9999' },
          ],
        }),
        { status: 200 },
      )
    }

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-12',
      configurations: [],
      payrollConfiguration,
      fetchImplementation,
    })

    expect(outcomes).toHaveLength(1)
    expect(outcomes[0]?.status).toBe('updated')
    expect(
      outcomes[0]?.status === 'updated'
        ? outcomes[0].sourceObservationCount
        : null,
    ).toBe(6)
    expect(requestedUrls).toHaveLength(1)
    expect(requestedUrls[0]?.searchParams.get('series_id')).toBe('PAYEMS')
    expect(requestedUrls[0]?.searchParams.get('frequency')).toBe('m')
    expect(requestedUrls[0]?.searchParams.has('observation_start')).toBe(false)
    expect(requestedUrls[0]?.searchParams.has('units')).toBe(false)
    expect(
      validateEconomicSeries(
        JSON.parse(await readFile(payrollConfiguration.payrollGrowthOutputFile, 'utf8')),
      ).observations.at(-1)?.date,
    ).toBe('2000-02-01')
  })

  it('preserves both payroll files after derivation failure while updating unrelated data', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const gdpPath = path.join(directory, 'gdp.json')
    const monthlyPath = path.join(directory, 'monthly.json')
    const averagePath = path.join(directory, 'average.json')
    const oldMonthly = '{"old":"monthly"}\n'
    const oldAverage = '{"old":"average"}\n'
    await writeFile(monthlyPath, oldMonthly, 'utf8')
    await writeFile(averagePath, oldAverage, 'utf8')
    const payrollConfiguration = {
      ...payrollSeriesConfiguration,
      monthlyChangeOutputFile: monthlyPath,
      payrollGrowthOutputFile: averagePath,
    }
    const gdpConfiguration = {
      ...fredSeriesConfigurations[0]!,
      outputFile: gdpPath,
      minimumUsableObservations: 2,
    }
    const fetchImplementation: typeof fetch = async (input) => {
      const seriesId = new URL(String(input)).searchParams.get('series_id')
      const observations =
        seriesId === 'PAYEMS'
          ? [{ date: '2000-01-01', value: 'invalid' }]
          : [
              { date: '2000-01-01', value: '2.0' },
              { date: '2000-04-01', value: '2.1' },
            ]
      return new Response(JSON.stringify({ observations }), { status: 200 })
    }

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-12',
      configurations: [gdpConfiguration],
      payrollConfiguration,
      fetchImplementation,
    })

    expect(outcomes.map((outcome) => outcome.status)).toEqual([
      'updated',
      'failed',
    ])
    expect(validateEconomicSeries(JSON.parse(await readFile(gdpPath, 'utf8'))))
      .toMatchObject({ providerSeriesId: 'GDPC1' })
    expect(await readFile(monthlyPath, 'utf8')).toBe(oldMonthly)
    expect(await readFile(averagePath, 'utf8')).toBe(oldAverage)
  })

  it('fetches CPI and AHETPI once each and writes both wage outputs', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const cpiConfiguration = {
      ...fredSeriesConfigurations[1]!,
      outputFile: path.join(directory, 'cpi.json'),
      minimumUsableObservations: 2,
    }
    const wageConfiguration = {
      ...wageSeriesConfiguration,
      nominalOutputFile: path.join(directory, 'nominal.json'),
      realOutputFile: path.join(directory, 'real.json'),
    }
    const requests: string[] = []
    const fetchImplementation: typeof fetch = async (input) => {
      const id = new URL(String(input)).searchParams.get('series_id')!
      requests.push(id)
      const observations =
        id === 'CPIAUCSL'
          ? Array.from({ length: 14 }, (_, index) => ({
              date: new Date(Date.UTC(1964, index, 1)).toISOString().slice(0, 10),
              value: String(100 + index),
            }))
          : Array.from({ length: 14 }, (_, index) => ({
              date: new Date(Date.UTC(1964, index, 1)).toISOString().slice(0, 10),
              value: String(2 + index / 100),
            }))
      return new Response(JSON.stringify({ observations }), { status: 200 })
    }

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key', retrievedAt: '2026-07-13',
      configurations: [cpiConfiguration], payrollConfiguration: false,
      wageConfiguration, fetchImplementation,
    })

    expect(requests).toEqual(['CPIAUCSL', 'AHETPI'])
    expect(outcomes.map((outcome) => outcome.status)).toEqual(['updated', 'updated'])
    expect(validateEconomicSeries(JSON.parse(await readFile(wageConfiguration.nominalOutputFile, 'utf8'))))
      .toMatchObject({ providerSeriesId: 'AHETPI' })
    const real = validateEconomicSeries(
      JSON.parse(await readFile(wageConfiguration.realOutputFile, 'utf8')),
    )
    expect(real.sources?.map((source) => source.providerSeriesId)).toEqual([
      'AHETPI', 'CPIAUCSL',
    ])
  })

  it('preserves both wage files when AHETPI derivation fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const nominalPath = path.join(directory, 'nominal.json')
    const realPath = path.join(directory, 'real.json')
    await writeFile(nominalPath, 'old nominal\n', 'utf8')
    await writeFile(realPath, 'old real\n', 'utf8')
    const wageConfiguration = {
      ...wageSeriesConfiguration,
      nominalOutputFile: nominalPath,
      realOutputFile: realPath,
    }
    const cpiConfiguration = {
      ...fredSeriesConfigurations[1]!, outputFile: path.join(directory, 'cpi.json'),
      minimumUsableObservations: 1,
    }
    const fetchImplementation: typeof fetch = async (input) => {
      const id = new URL(String(input)).searchParams.get('series_id')
      const observations = id === 'CPIAUCSL'
        ? Array.from({ length: 13 }, (_, index) => ({
            date: new Date(Date.UTC(1964, index, 1)).toISOString().slice(0, 10),
            value: String(100 + index),
          }))
        : [{ date: '1964-01-01', value: 'invalid' }]
      return new Response(JSON.stringify({ observations }), { status: 200 })
    }

    const outcomes = await refreshAllEconomicData({
      apiKey: 'test-key', retrievedAt: '2026-07-13',
      configurations: [cpiConfiguration], payrollConfiguration: false,
      wageConfiguration, fetchImplementation,
    })
    expect(outcomes.map((outcome) => outcome.status)).toEqual(['updated', 'failed'])
    expect(await readFile(nominalPath, 'utf8')).toBe('old nominal\n')
    expect(await readFile(realPath, 'utf8')).toBe('old real\n')
  })

  it('fetches each CPI source once and atomically writes all four derivations', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const config = {
      ...cpiSeriesConfiguration,
      minimumUsableObservations: 13,
      headlineInflationOutputFile: path.join(directory, 'headline-yoy.json'),
      coreInflationOutputFile: path.join(directory, 'core-yoy.json'),
      headlineMomentumOutputFile: path.join(directory, 'headline-momentum.json'),
      coreMomentumOutputFile: path.join(directory, 'core-momentum.json'),
    }
    const requestedUrls: URL[] = []
    const fetchImplementation: typeof fetch = async (input) => {
      const url = new URL(String(input))
      requestedUrls.push(url)
      const base = url.searchParams.get('series_id') === 'CPIAUCSL' ? 100 : 200
      return new Response(JSON.stringify({
        observations: Array.from({ length: 14 }, (_, index) => ({
          date: new Date(Date.UTC(2024, index, 1)).toISOString().slice(0, 10),
          value: String(base + index),
        })),
      }), { status: 200 })
    }

    const result = await refreshCpiData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-13',
      config,
      fetchImplementation,
    })

    expect(requestedUrls.map((url) => url.searchParams.get('series_id')).sort())
      .toEqual(['CPIAUCSL', 'CPILFESL'])
    expect(requestedUrls.every((url) => !url.searchParams.has('units'))).toBe(true)
    expect(requestedUrls.every((url) => !url.searchParams.has('observation_start')))
      .toBe(true)
    expect(result.sourceObservationCount).toBe(14)
    expect(result.coreSourceObservationCount).toBe(14)
    for (const outputFile of [
      config.headlineInflationOutputFile,
      config.coreInflationOutputFile,
      config.headlineMomentumOutputFile,
      config.coreMomentumOutputFile,
    ]) {
      expect(validateEconomicSeries(JSON.parse(await readFile(outputFile, 'utf8')))
        .observations.at(-1)?.date).toBe('2025-02-01')
    }
  })

  it('preserves all four CPI files when either source cannot be derived', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const outputFiles = [
      path.join(directory, 'headline-yoy.json'),
      path.join(directory, 'core-yoy.json'),
      path.join(directory, 'headline-momentum.json'),
      path.join(directory, 'core-momentum.json'),
    ]
    await Promise.all(outputFiles.map((file, index) => writeFile(file, `old ${index}\n`, 'utf8')))
    const config = {
      ...cpiSeriesConfiguration,
      minimumUsableObservations: 13,
      headlineInflationOutputFile: outputFiles[0]!,
      coreInflationOutputFile: outputFiles[1]!,
      headlineMomentumOutputFile: outputFiles[2]!,
      coreMomentumOutputFile: outputFiles[3]!,
    }
    const fetchImplementation: typeof fetch = async (input) => {
      const id = new URL(String(input)).searchParams.get('series_id')
      const observations = id === 'CPILFESL'
        ? [{ date: '2024-01-01', value: 'invalid' }]
        : Array.from({ length: 14 }, (_, index) => ({
            date: new Date(Date.UTC(2024, index, 1)).toISOString().slice(0, 10),
            value: String(100 + index),
          }))
      return new Response(JSON.stringify({ observations }), { status: 200 })
    }

    await expect(refreshCpiData({
      apiKey: 'test-key',
      retrievedAt: '2026-07-13',
      config,
      fetchImplementation,
    })).rejects.toThrow()

    await Promise.all(outputFiles.map(async (file, index) => {
      expect(await readFile(file, 'utf8')).toBe(`old ${index}\n`)
    }))
  })

  it('preserves the prior HOAM dataset when workbook parsing fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const outputFile = path.join(directory, 'home-ownership-cost-share.json')
    const existing = '{"existing":"valid HOAM fixture"}\n'
    await writeFile(outputFile, existing, 'utf8')

    await expect(refreshHoamData({
      retrievedAt: '2026-07-16',
      config: {
        dataHandling: 'hoam-provider',
        outputFile,
        minimumUsableObservations: 2,
      },
      fetchImplementation: async () => new Response('not an XLSX archive'),
    })).rejects.toThrow('not a valid ZIP archive')

    expect(await readFile(outputFile, 'utf8')).toBe(existing)
  })
})
