import type { EconomicObservation, EconomicSeries } from '../../src/features/economic-series/models/economicSeries'

export const coreGoodsPceSourceUrl = 'https://www.federalreserve.gov/econres/notes/feds-notes/detecting-tariff-effects-on-consumer-prices-in-real-time-part-II-accessible-20260408.htm'

const months: Readonly<Record<string, string>> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

export function parseCoreGoodsPceInflation(html: string): EconomicObservation[] {
  const table = html.match(/<table[^>]+title="Figure 5\. Tariff effects on core goods PCE prices"[\s\S]*?<\/table>/)?.[0]
  if (!table) throw new Error('Federal Reserve Figure 5 table was not found.')

  const observations = [...table.matchAll(/<tr>[\s\S]*?<th[^>]*>(\d{2})-([A-Z][a-z]{2})<\/th>[\s\S]*?<td[^>]*>(-?\d+(?:\.\d+)?)<\/td>[\s\S]*?<\/tr>/g)]
    .map((match) => ({
      date: `20${match[1]}-${months[match[2]!] ?? '00'}-01`,
      value: Number(match[3]),
    }))

  if (observations.length < 120 || observations.some(({ date, value }) => date.includes('-00-') || !Number.isFinite(value))) {
    throw new Error('Federal Reserve Figure 5 data were incomplete or invalid.')
  }
  return observations
}

export function createCoreGoodsPceInflationSeries(html: string, retrievedAt: string): EconomicSeries {
  return {
    id: 'core-goods-pce-inflation', slug: 'core-goods-pce-inflation',
    provider: 'Board of Governors of the Federal Reserve System',
    providerSeriesId: 'FEDS Notes 2026-04-08 Figure 5, Published',
    title: 'Core Goods PCE Inflation', shortTitle: 'Core goods PCE inflation',
    description: 'Twelve-month percent change in core-goods prices in the personal consumption expenditures price index.',
    question: 'How quickly are prices for core consumer goods changing?',
    units: 'Percent change from year ago', frequency: 'monthly',
    seasonalAdjustment: 'Underlying PCE price indexes are seasonally adjusted',
    transformation: 'Published 12-month core-goods PCE inflation rate; February 2026 is a Federal Reserve staff estimate.',
    sourceName: 'Federal Reserve Board FEDS Notes, based on Bureau of Economic Analysis data',
    sourceUrl: coreGoodsPceSourceUrl, retrievedAt,
    observations: parseCoreGoodsPceInflation(html),
  }
}
