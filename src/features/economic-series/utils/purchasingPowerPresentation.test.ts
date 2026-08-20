import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import { purchasingPowerAnswer, purchasingPowerEvidence } from './purchasingPowerPresentation'

const series = (id: string, values: [string, number | null][]): EconomicSeries => ({
  id, slug: id, provider: 'FRED', providerSeriesId: id, title: id, shortTitle: id,
  description: id, question: id, units: id, frequency: 'monthly', seasonalAdjustment: 'Seasonally adjusted',
  transformation: id, sourceName: id, sourceUrl: 'https://example.com', retrievedAt: '2026-08-20',
  observations: values.map(([date, value]) => ({ date, value })),
})

describe('purchasing-power presentation', () => {
  it('uses deterministic positive, negative, near-zero, and unavailable wording', () => {
    expect(purchasingPowerAnswer(6.04, 10)).toContain('6.0% more')
    expect(purchasingPowerAnswer(-2.04, 10)).toContain('2.0% less')
    expect(purchasingPowerAnswer(0.049, 10)).toContain('about the same')
    expect(purchasingPowerAnswer(null, 10)).toContain('unavailable')
  })

  it('uses exact lookback months and the ratio formula for evidence', () => {
    const wages = series('AHETPI', [['2016-07-01', 20], ['2026-07-01', 30]])
    const cpi = series('CWSR0000SA0', [['2016-07-01', 100], ['2026-07-01', 125]])
    const evidence = purchasingPowerEvidence({ date: '2026-07-01', value: 20 }, 10, wages, cpi)
    expect(evidence).toMatchObject({ startDate: '2016-07-01', endDate: '2026-07-01', nominalChange: 50, priceChange: 25 })
    expect(evidence?.realChange).toBeCloseTo(20, 12)
    expect(evidence?.realChange).not.toBe(evidence!.nominalChange - evidence!.priceChange)
  })

  it('does not substitute a neighboring base month', () => {
    expect(purchasingPowerEvidence(
      { date: '2026-07-01', value: 1 }, 10,
      series('AHETPI', [['2016-06-01', 20], ['2026-07-01', 30]]),
      series('CWSR0000SA0', [['2016-07-01', 100], ['2026-07-01', 125]]),
    )).toBeNull()
  })
})
