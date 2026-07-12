import { describe, expect, it } from 'vitest'
import { localEconomicSeriesRepository } from './localEconomicSeriesRepository'

describe('localEconomicSeriesRepository', () => {
  it.each([
    ['unemployment-rate', 'UNRATE'],
    ['prime-age-employment-ratio', 'LNS12300060'],
  ])('loads %s as a monthly series', async (slug, providerSeriesId) => {
    const series = await localEconomicSeriesRepository.getBySlug(slug)

    expect(series).toMatchObject({
      slug,
      providerSeriesId,
      frequency: 'monthly',
      units: 'Percent',
      transformation: 'Level',
    })
  })

  it('returns null for an unknown slug', async () => {
    await expect(
      localEconomicSeriesRepository.getBySlug('payroll-growth'),
    ).resolves.toBeNull()
  })
})
