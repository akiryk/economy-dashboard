import { describe, expect, it } from 'vitest'
import { dashboardEconomicSeriesRepository } from './dashboardEconomicSeriesRepository'
import { localEconomicSeriesRepository } from './localEconomicSeriesRepository'

describe('dashboardEconomicSeriesRepository', () => {
  it('reuses the main dashboard year-over-year real GDP dataset', async () => {
    const [statusSeries, mainSeries] = await Promise.all([
      dashboardEconomicSeriesRepository.getBySlug('real-gdp-growth'),
      localEconomicSeriesRepository.getBySlug('real-gdp-growth'),
    ])

    expect(statusSeries).toEqual(mainSeries)
    expect(statusSeries).toMatchObject({
      providerSeriesId: 'GDPC1',
      units: 'Percent change from year ago',
      frequency: 'quarterly',
    })
  })
})
