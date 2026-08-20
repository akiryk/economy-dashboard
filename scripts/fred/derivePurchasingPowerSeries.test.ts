import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../../src/features/economic-series/models/economicSeries'
import { derivePurchasingPowerObservations } from './derivePurchasingPowerSeries'
import { purchasingPowerSeriesConfiguration } from './seriesConfigurations'

function month(index: number): string {
  return new Date(Date.UTC(2000, index, 1)).toISOString().slice(0, 10)
}

function observations(count: number, value: (index: number) => number | null): EconomicObservation[] {
  return Array.from({ length: count }, (_, index) => ({ date: month(index), value: value(index) }))
}

describe('derivePurchasingPowerObservations', () => {
  it('uses the documented production-worker wage and CPI-W sources', () => {
    expect(purchasingPowerSeriesConfiguration.wageSource).toMatchObject({
      providerSeriesId: 'AHETPI', seasonalAdjustment: 'Seasonally adjusted', fredFrequency: 'm', historyPolicy: { type: 'full' },
    })
    expect(purchasingPowerSeriesConfiguration.cpiSource).toMatchObject({
      providerSeriesId: 'CWSR0000SA0', seasonalAdjustment: 'Seasonally adjusted', fredFrequency: 'm', historyPolicy: { type: 'full' },
    })
  })

  it('aligns exact months and preserves full-precision real-level ratios', () => {
    const wages = [{ date: '2020-02-01', value: 21 }, { date: '2020-01-01', value: 20 }]
    const prices = [{ date: '2020-01-01', value: 200 }, { date: '2020-02-01', value: 203 }]
    const originalWages = structuredClone(wages)
    const originalPrices = structuredClone(prices)

    const result = derivePurchasingPowerObservations(wages, prices)

    expect(result.realLevel).toEqual([
      { date: '2020-01-01', value: 0.1 },
      { date: '2020-02-01', value: 21 / 203 },
    ])
    expect(result.realLevel[1]!.value).not.toBe(0.1034)
    expect(wages).toEqual(originalWages)
    expect(prices).toEqual(originalPrices)
  })

  it.each([[48, 49], [120, 121], [240, 241]] as const)(
    'uses the exact %i-month base and emits no premature rolling value',
    (window, count) => {
      const result = derivePurchasingPowerObservations(
        observations(count, (index) => 20 + index),
        observations(count, () => 200),
      )
      expect(result.changes[window].slice(0, window).every(({ value }) => value === null)).toBe(true)
      expect(result.changes[window][window]!.date).toBe(month(window))
      expect(result.changes[window][window]!.value).toBeCloseTo(
        ((20 + window) / 20 - 1) * 100,
        12,
      )
    },
  )

  it('calculates independently hand-checked positive and negative changes', () => {
    const wages = observations(49, (index) => index === 0 ? 20 : index === 48 ? 22 : 21)
    const prices = observations(49, (index) => index === 0 ? 100 : index === 48 ? 110 : 100)
    const flat = derivePurchasingPowerObservations(wages, prices)
    expect(flat.changes[48][48]!.value).toBeCloseTo(0, 12) // (22/110)/(20/100)-1

    wages[48] = { date: month(48), value: 19.8 }
    const negative = derivePurchasingPowerObservations(wages, prices)
    expect(negative.changes[48][48]!.value).toBeCloseTo(-10, 12) // (19.8/110)/(20/100)-1

    wages[48] = { date: month(48), value: 24.2 }
    const positive = derivePurchasingPowerObservations(wages, prices)
    expect(positive.changes[48][48]!.value).toBeCloseTo(10, 12) // (24.2/110)/(20/100)-1
  })

  it('keeps missing wage, CPI, and exact base months unavailable without filling', () => {
    const wages = observations(50, () => 20)
    const prices = observations(50, () => 100)
    wages[10] = { date: month(10), value: null }
    prices[11] = { date: month(11), value: null }
    prices.splice(12, 1)
    const result = derivePurchasingPowerObservations(wages, prices)

    expect(result.realLevel.find(({ date }) => date === month(10))?.value).toBeNull()
    expect(result.realLevel.find(({ date }) => date === month(11))?.value).toBeNull()
    expect(result.realLevel.some(({ date }) => date === month(12))).toBe(false)
    expect(result.changes[48].find(({ date }) => date === month(48))?.value).toBe(0)
    expect(result.changes[48].find(({ date }) => date === month(49))?.value).toBe(0)

    prices.splice(0, 1)
    const missingBase = derivePurchasingPowerObservations(wages, prices)
    expect(missingBase.changes[48].find(({ date }) => date === month(48))?.value).toBeNull()
  })

  it('rejects invalid CPI denominators and duplicate dates', () => {
    expect(derivePurchasingPowerObservations(
      [{ date: month(0), value: 20 }],
      [{ date: month(0), value: 0 }],
    ).realLevel[0]!.value).toBeNull()
    expect(derivePurchasingPowerObservations(
      [{ date: month(0), value: Number.NaN }],
      [{ date: month(0), value: 100 }],
    ).realLevel[0]!.value).toBeNull()
    expect(derivePurchasingPowerObservations(
      [{ date: month(0), value: 20 }],
      [{ date: month(0), value: Number.POSITIVE_INFINITY }],
    ).realLevel[0]!.value).toBeNull()
    expect(() => derivePurchasingPowerObservations(
      [{ date: month(0), value: 20 }, { date: month(0), value: 21 }],
      [{ date: month(0), value: 100 }],
    )).toThrow('duplicate date')
  })
})
