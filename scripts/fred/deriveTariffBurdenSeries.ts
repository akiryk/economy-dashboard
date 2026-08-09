import type { EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { TariffBurdenConfig } from './seriesConfigurations'

export function deriveTariffBurdenSeries(customs: EconomicSeries, imports: EconomicSeries, retrievedAt: string, config: TariffBurdenConfig): EconomicSeries {
  const importsByDate = new Map(imports.observations.map((item) => [item.date, item.value]))
  const observations = customs.observations.map((item) => {
    const denominator = importsByDate.get(item.date)
    return { date: item.date, value: item.value === null || denominator === null || denominator === undefined || denominator <= 0 ? null : item.value / denominator * 100 }
  })
  const first = observations.findIndex((item) => item.value !== null)
  return validateEconomicSeries({
    id: 'effective-tariff-burden', slug: 'effective-tariff-burden', provider: 'Federal Reserve Bank of St. Louis',
    providerSeriesId: 'B235RC1Q027SBEA / A255RC1Q027SBEA', title: 'Effective Tariff Burden', shortTitle: 'Effective tariff burden',
    description: 'Federal customs-duty receipts divided by imports of goods.', question: 'How heavily are imported goods being taxed?', units: 'Percent of goods-import value', frequency: 'quarterly', seasonalAdjustment: 'Seasonally adjusted annual rate (both source levels)', transformation: 'Customs duties divided by goods imports multiplied by 100, calculated by the application', sourceName: 'U.S. Bureau of Economic Analysis via FRED; ratio calculated by the application', sourceUrl: config.customsSource.sourceUrl, retrievedAt,
    observations: first < 0 ? [] : observations.slice(first),
    sources: [
      { provider: 'Federal Reserve Bank of St. Louis', providerSeriesId: config.customsSource.providerSeriesId, sourceName: config.customsSource.sourceName, sourceUrl: config.customsSource.sourceUrl, role: 'Customs-duty numerator' },
      { provider: 'Federal Reserve Bank of St. Louis', providerSeriesId: config.importsSource.providerSeriesId, sourceName: config.importsSource.sourceName, sourceUrl: config.importsSource.sourceUrl, role: 'Goods-import denominator' },
    ],
  })
}
