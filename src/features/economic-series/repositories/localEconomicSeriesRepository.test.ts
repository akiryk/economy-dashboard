import { describe, expect, it } from 'vitest'
import { localEconomicSeriesRepository } from './localEconomicSeriesRepository'

describe('localEconomicSeriesRepository', () => {
  it.each([
    ['real-gdp-growth', 'GDPC1'],
    ['real-gdp-per-capita-growth', 'A939RX0Q048SBEA'],
    ['labor-productivity-growth', 'OPHNFB'],
    ['labor-productivity-level', 'OPHNFB'],
    ['real-business-investment-growth', 'PNFIC1'],
    ['household-debt-service-ratio', 'TDSP'],
    ['quarterly-real-disposable-income-per-capita-growth', 'A229RX0Q048SBEA'],
    ['quarterly-real-consumer-spending-per-capita-growth', 'A794RX0Q048SBEA'],
    ['federal-debt-held-by-public', 'FYGFGDQ188S'],
    ['trade-balance-share-of-gdp', 'A019RE1Q156NBEA'],
    ['effective-tariff-burden', 'B235RC1Q027SBEA / A255RC1Q027SBEA'],
    ['corporate-profit-share', 'CPATAX / GDP'],
  ])('loads %s as a quarterly series', async (slug, providerSeriesId) => {
    const series = await localEconomicSeriesRepository.getBySlug(slug)

    expect(series).toMatchObject({
      slug,
      providerSeriesId,
      frequency: 'quarterly',
    })
    if (providerSeriesId === 'TDSP') {
      expect(series).toMatchObject({ units: 'Percent', transformation: 'Level' })
    }
  })

  it.each([
    ['home-ownership-cost-share', 'HOAM: Annual Payment Share of Income'],
    ['housing-starts', 'HOUST'],
    ['manufacturing-output', 'IPMAN'],
    ['manufacturing-employment', 'MANEMP'],
    ['industrial-capacity-utilization', 'TCU'],
  ])('loads the Story 15 %s series', async (slug, providerSeriesId) => {
    await expect(localEconomicSeriesRepository.getBySlug(slug)).resolves.toMatchObject({
      slug,
      providerSeriesId,
      frequency: 'monthly',
    })
  })

  it.each([
    ['headline-cpi-inflation', 'CPIAUCSL'],
    ['core-cpi-inflation', 'CPILFESL'],
    ['headline-cpi-three-month-annualized', 'CPIAUCSL'],
    ['core-cpi-three-month-annualized', 'CPILFESL'],
    ['unemployment-rate', 'UNRATE'],
    ['prime-age-employment-ratio', 'LNS12300060'],
    ['effective-federal-funds-rate', 'FEDFUNDS'],
    ['ten-year-treasury-yield', 'GS10'],
    ['labor-market-activity-index', 'FRBKCLMCILA'],
    ['labor-market-momentum-index', 'FRBKCLMCIM'],
  ])('loads %s as a monthly series', async (slug, providerSeriesId) => {
    const series = await localEconomicSeriesRepository.getBySlug(slug)

    expect(series).toMatchObject({
      slug,
      providerSeriesId,
      frequency: 'monthly',
    })
    if (providerSeriesId.startsWith('FRBKCLMCI')) {
      expect(series?.units).toBe('Index')
      expect(series?.transformation).toContain('full-history percentile')
    } else if (['UNRATE', 'LNS12300060'].includes(providerSeriesId)) {
      expect(series?.units).toBe('Percent')
      expect(series?.transformation).toBe('Level')
    } else if (['FEDFUNDS', 'GS10'].includes(providerSeriesId)) {
      expect(series?.units).toBe('Percent')
      expect(series?.transformation).toContain('Provider-published monthly average')
    } else {
      expect(series?.units).toContain('Percent')
      expect(series?.transformation).toContain('calculated by the application')
    }
  })

  it.each(['labor-market-activity-index', 'labor-market-momentum-index'])('loads valid complete %s history', async (slug) => {
    const series = await localEconomicSeriesRepository.getBySlug(slug)
    expect(series?.observations).toHaveLength(414)
    expect(series?.observations[0]?.date).toBe('1992-01-01')
    expect(series?.observations.at(-1)?.date).toBe('2026-06-01')
    const dates = series!.observations.map(({ date }) => date)
    expect(dates).toEqual([...dates].sort())
    expect(new Set(dates).size).toBe(dates.length)
    expect(dates.every((date) => date <= series!.retrievedAt)).toBe(true)
  })

  it('loads the native-weekly broad credit-conditions index', async () => {
    await expect(localEconomicSeriesRepository.getBySlug('broad-credit-conditions'))
      .resolves.toMatchObject({ providerSeriesId: 'NFCICREDIT', frequency: 'weekly', units: 'Index' })
  })

  it('loads quarterly bank lending standards with survey metadata and signed values', async () => {
    const series = await localEconomicSeriesRepository.getBySlug('bank-lending-standards')

    expect(series).toMatchObject({
      providerSeriesId: 'DRTSCILM',
      frequency: 'quarterly',
      units: 'Net percent reporting tighter standards',
      seasonalAdjustment: 'Not seasonally adjusted',
    })
    expect(series?.observations[0]?.date).toBe('1990-04-01')
    expect(series?.observations.at(-1)?.date).toBe('2026-04-01')
    expect(series?.observations.some((observation) => observation.value! < 0)).toBe(true)
    expect(series?.observations.some((observation) => observation.value === 0)).toBe(true)
    expect(series?.observations.some((observation) => observation.value! > 0)).toBe(true)
  })

  it.each([
    ['initial-unemployment-claims', 'ICSA', 'Provider-published weekly level'],
    ['initial-unemployment-claims-four-week-average', 'IC4WSA', 'Provider-published four-week moving average'],
  ])('loads the native-weekly %s series', async (slug, providerSeriesId, transformation) => {
    await expect(localEconomicSeriesRepository.getBySlug(slug)).resolves.toMatchObject({
      slug,
      providerSeriesId,
      frequency: 'weekly',
      units: 'Number of claims',
      transformation,
    })
  })

  it('loads the annual federal budget-balance ratio', async () => {
    await expect(localEconomicSeriesRepository.getBySlug('federal-budget-balance'))
      .resolves.toMatchObject({ providerSeriesId: 'FYFSGDA188S', frequency: 'annual', units: 'Percent of GDP' })
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
