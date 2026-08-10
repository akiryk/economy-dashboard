import { describe, expect, it, vi } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import type { EconomicSeriesRepository } from './EconomicSeriesRepository'
import { createDashboardEconomicSeriesRepository } from './createDashboardEconomicSeriesRepository'

const series: EconomicSeries = {
  id: 'dashboard-test', slug: 'dashboard-test',
  provider: 'Federal Reserve Bank of St. Louis', providerSeriesId: 'TEST',
  title: 'Test series', shortTitle: 'Test', description: 'Test data.',
  question: 'What is the test value?', units: 'Percent', frequency: 'daily',
  seasonalAdjustment: null, transformation: 'Provider-published daily value',
  sourceName: 'Test source via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/TEST',
  retrievedAt: '2026-08-10', observations: [{ date: '2026-08-08', value: 1.5 }],
}

describe('createDashboardEconomicSeriesRepository', () => {
  it('loads and validates a configured committed dataset', async () => {
    const reusedRepository: EconomicSeriesRepository = { getBySlug: vi.fn() }
    const repository = createDashboardEconomicSeriesRepository({
      'dashboard-test': async () => ({ default: series }),
    }, reusedRepository)

    await expect(repository.getBySlug('dashboard-test')).resolves.toEqual(series)
    expect(reusedRepository.getBySlug).not.toHaveBeenCalled()
  })

  it('delegates only the three explicitly reused slugs', async () => {
    const requestedSlugs: string[] = []
    const getBySlug: EconomicSeriesRepository['getBySlug'] = vi.fn(async (slug: string) => {
      requestedSlugs.push(slug)
      return series
    })
    const repository = createDashboardEconomicSeriesRepository({}, { getBySlug })

    for (const slug of [
      'unemployment-rate',
      'initial-unemployment-claims',
      'initial-unemployment-claims-four-week-average',
    ]) {
      await expect(repository.getBySlug(slug)).resolves.toBe(series)
    }
    expect(requestedSlugs).toEqual([
      'unemployment-rate',
      'initial-unemployment-claims',
      'initial-unemployment-claims-four-week-average',
    ])
  })

  it('rejects invalid configured data and returns null for an unknown slug', async () => {
    const repository = createDashboardEconomicSeriesRepository({
      invalid: async () => ({ default: { ...series, observations: [] } }),
    }, { getBySlug: vi.fn() })

    await expect(repository.getBySlug('invalid')).rejects.toThrow('must include observations')
    await expect(repository.getBySlug('unknown')).resolves.toBeNull()
  })
})
