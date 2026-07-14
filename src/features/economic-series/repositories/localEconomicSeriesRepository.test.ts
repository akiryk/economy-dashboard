import { describe, expect, it } from 'vitest'
import { localEconomicSeriesRepository } from './localEconomicSeriesRepository'

describe('localEconomicSeriesRepository', () => {
  it.each([
    ['real-gdp-growth', 'GDPC1'],
    ['real-gdp-per-capita-growth', 'A939RX0Q048SBEA'],
    ['labor-productivity-growth', 'OPHNFB'],
    ['labor-productivity-level', 'OPHNFB'],
  ])('loads %s as a quarterly series', async (slug, providerSeriesId) => {
    const series = await localEconomicSeriesRepository.getBySlug(slug)

    expect(series).toMatchObject({
      slug,
      providerSeriesId,
      frequency: 'quarterly',
    })
  })

  it.each([
    ['headline-cpi-inflation', 'CPIAUCSL'],
    ['core-cpi-inflation', 'CPILFESL'],
    ['headline-cpi-three-month-annualized', 'CPIAUCSL'],
    ['core-cpi-three-month-annualized', 'CPILFESL'],
    ['unemployment-rate', 'UNRATE'],
    ['prime-age-employment-ratio', 'LNS12300060'],
  ])('loads %s as a monthly series', async (slug, providerSeriesId) => {
    const series = await localEconomicSeriesRepository.getBySlug(slug)

    expect(series).toMatchObject({
      slug,
      providerSeriesId,
      frequency: 'monthly',
    })
    if (['UNRATE', 'LNS12300060'].includes(providerSeriesId)) {
      expect(series?.units).toBe('Percent')
      expect(series?.transformation).toBe('Level')
    } else {
      expect(series?.units).toContain('Percent')
      expect(series?.transformation).toContain('calculated by the application')
    }
  })

  it('returns null for an unknown slug', async () => {
    await expect(
      localEconomicSeriesRepository.getBySlug('wage-growth'),
    ).resolves.toBeNull()
  })

  it.each([
    ['payroll-growth', 'Three-month average of monthly change'],
    ['monthly-payroll-change', 'Monthly change'],
  ])('loads the PAYEMS-derived %s series', async (slug, transformation) => {
    const series = await localEconomicSeriesRepository.getBySlug(slug)

    expect(series).toMatchObject({
      slug,
      providerSeriesId: 'PAYEMS',
      frequency: 'monthly',
      units: 'Thousands of jobs',
    })
    expect(series?.transformation).toContain(transformation)
  })

  it('loads both wage outputs and preserves multi-source provenance', async () => {
    const nominal = await localEconomicSeriesRepository.getBySlug(
      'nominal-wage-growth',
    )
    const real = await localEconomicSeriesRepository.getBySlug('real-wage-growth')

    expect(nominal).toMatchObject({ providerSeriesId: 'AHETPI' })
    expect(real?.sources).toEqual([
      expect.objectContaining({ providerSeriesId: 'AHETPI', role: 'Wage measure' }),
      expect.objectContaining({
        providerSeriesId: 'CPIAUCSL', role: 'Inflation deflator',
      }),
    ])
  })
})
