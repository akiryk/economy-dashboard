import { describe, expect, it } from 'vitest'
import { createCoreGoodsPceInflationSeries, parseCoreGoodsPceInflation } from './coreGoodsPceInflation'

const rows = Array.from({ length: 120 }, (_, index) => {
  const year = 15 + Math.floor(index / 12)
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index % 12]
  return `<tr><th>${String(year).padStart(2, '0')}-${month}</th><td>${index / 10}</td><td>NA</td></tr>`
}).join('')
const fixture = `<table title="Figure 5. Tariff effects on core goods PCE prices">${rows}</table>`

describe('core-goods PCE inflation refresh', () => {
  it('parses the published column into monthly observations', () => {
    expect(parseCoreGoodsPceInflation(fixture)).toEqual(expect.arrayContaining([
      { date: '2015-01-01', value: 0 }, { date: '2024-12-01', value: 11.9 },
    ]))
  })

  it('keeps source and transformation metadata with the series', () => {
    const series = createCoreGoodsPceInflationSeries(fixture, '2026-08-06')
    expect(series.sourceUrl).toContain('federalreserve.gov')
    expect(series.transformation).toContain('12-month')
  })

  it('rejects a missing or incomplete figure before writing', () => {
    expect(() => parseCoreGoodsPceInflation('<html />')).toThrow('not found')
    expect(() => parseCoreGoodsPceInflation('<table title="Figure 5. Tariff effects on core goods PCE prices"></table>')).toThrow('incomplete')
  })
})
