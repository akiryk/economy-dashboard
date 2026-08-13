import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import { fetchFredObservations } from './fredClient'
import {
  dashboardFredSeriesConfigurations,
  dashboardSeriesSources,
} from './seriesConfigurations'

const requiredProviderSeriesIds = [
  'A191RL1Q225SBEA', 'GDP', 'UNRATE', 'PAYEMS', 'IC4WSA', 'ICSA',
  'SAHMREALTIME', 'CPIAUCNS', 'CPILFESL', 'T10YIE', 'DFF', 'DFEDTARU',
  'T10Y2Y', 'T10Y3M', 'DGS10', 'MORTGAGE30US', 'SP500',
  'BAMLH0A0HYM2',
] as const

describe('Story 84 dashboard source configuration', () => {
  it('represents exactly the 18 required sources and explicitly reuses compatible datasets', () => {
    expect(dashboardSeriesSources.map(({ providerSeriesId }) => providerSeriesId).sort())
      .toEqual([...requiredProviderSeriesIds].sort())
    expect(dashboardSeriesSources).toHaveLength(18)
    expect(dashboardSeriesSources.filter(({ reused }) => reused)).toEqual([
      { providerSeriesId: 'UNRATE', slug: 'unemployment-rate', reused: true },
      { providerSeriesId: 'IC4WSA', slug: 'initial-unemployment-claims-four-week-average', reused: true },
      { providerSeriesId: 'ICSA', slug: 'initial-unemployment-claims', reused: true },
    ])
    expect(dashboardFredSeriesConfigurations).toHaveLength(15)
  })

  it('uses full history and only the specified provider transformations', () => {
    expect(dashboardFredSeriesConfigurations.every(({ historyPolicy }) =>
      historyPolicy.type === 'full')).toBe(true)
    expect(dashboardFredSeriesConfigurations.filter(({ fredUnits }) => fredUnits)
      .map(({ providerSeriesId, fredUnits }) => [providerSeriesId, fredUnits]))
      .toEqual([
        ['PAYEMS', 'chg'],
        ['CPIAUCNS', 'pc1'],
        ['CPILFESL', 'pc1'],
      ])
  })

  it('uses authoritative provider series rather than local substitutes', () => {
    for (const providerSeriesId of [
      'A191RL1Q225SBEA', 'IC4WSA', 'SAHMREALTIME', 'T10Y2Y', 'T10Y3M',
    ]) {
      expect(dashboardSeriesSources.some((source) =>
        source.providerSeriesId === providerSeriesId)).toBe(true)
    }
    expect(dashboardSeriesSources.some(({ providerSeriesId }) =>
      providerSeriesId === 'SAHMCURRENT')).toBe(false)
  })

  it('validates every committed dashboard source with full ordered history', async () => {
    const outputBySlug = new Map(
      dashboardFredSeriesConfigurations.map(({ slug, outputFile }) => [slug, outputFile]),
    )
    outputBySlug.set('unemployment-rate', 'src/features/economic-series/data/unemployment-rate.json')
    outputBySlug.set('initial-unemployment-claims', 'src/features/economic-series/data/initial-unemployment-claims.json')
    outputBySlug.set('initial-unemployment-claims-four-week-average', 'src/features/economic-series/data/initial-unemployment-claims-four-week-average.json')

    for (const { providerSeriesId, slug } of dashboardSeriesSources) {
      const outputFile = outputBySlug.get(slug)
      expect(outputFile).toBeDefined()
      const series = validateEconomicSeries(JSON.parse(
        await readFile(outputFile!, 'utf8'),
      ))
      expect(series).toMatchObject({ slug, providerSeriesId })
      const dates = series.observations.map(({ date }) => date)
      expect(dates).toEqual([...dates].sort())
      expect(new Set(dates).size).toBe(dates.length)
      expect(dates.at(-1)! <= series.retrievedAt).toBe(true)
      expect(series.observations.length).toBeGreaterThan(250)
    }
  })

  it.each([
    ['PAYEMS', 'chg'],
    ['CPIAUCNS', 'pc1'],
    ['CPILFESL', 'pc1'],
  ] as const)('sends %s with units=%s', async (providerSeriesId, fredUnits) => {
    const config = dashboardFredSeriesConfigurations.find((candidate) =>
      candidate.providerSeriesId === providerSeriesId)!
    let requestedUrl: URL | null = null

    await fetchFredObservations('test-key', config, async (input) => {
      requestedUrl = new URL(String(input))
      return new Response(JSON.stringify({
        observations: [{ date: '2026-01-01', value: '1.25' }],
      }))
    })

    expect(requestedUrl!.searchParams.get('units')).toBe(fredUnits)
    expect(requestedUrl!.searchParams.has('observation_start')).toBe(false)
  })
})
