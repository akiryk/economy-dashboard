import { describe, expect, it } from 'vitest'
import {
  getClaimsBackContent,
  getGdpBackContent,
  getInflationBackContent,
  getPayrollBackContent,
  getSahmBackContent,
  getUnemploymentBackContent,
} from './cardBackContent'

describe('dashboard card back content', () => {
  it('uses grammatical GDP direction and current periods', () => {
    expect(getGdpBackContent(2.4, 'Q2 2026', true, {
      percentile: 55, stateLabel: 'Growing',
    }).whatItShows).toContain('grew at a 2.4% annualized rate in Q2 2026')
    expect(getGdpBackContent(-1.2, 'Q3 2026', false, {
      percentile: 5, stateLabel: 'Contracting',
    }).whatItShows).toContain('contracted at a 1.2% annualized rate')
  })

  it('uses unemployment level and historical context without payrolls', () => {
    const content = getUnemploymentBackContent(3.7, 'Jul 2026', {
      percentile: 12, stateLabel: 'Low',
    })
    expect(content.whatItShows).toContain('3.7% of the labor force')
    expect(content.howToReadIt).toContain('low relative to most')
    expect(`${content.whatItShows} ${content.howToReadIt}`).not.toMatch(/payroll/i)
  })

  it('describes both claims measures and threshold state', () => {
    const content = getClaimsBackContent(219_500, 228_000, {
      percentile: 10, stateLabel: 'Low',
    })
    expect(content.whatItShows).toContain('219,500 filings per week')
    expect(content.whatItShows).toContain('Latest week: 228,000')
    expect(content.howToReadIt).toContain('layoffs remain limited')
  })

  it.each([
    [0.29, 'well below'],
    [0.3, 'relatively close'],
    [0.5, 'has crossed'],
  ])('changes Sahm interpretation at %s', (value, phrase) => {
    const content = getSahmBackContent(value)
    expect(content.howToReadIt).toContain(phrase)
    expect(content.howToReadIt).toContain('indicator, not a forecast')
  })

  it.each([
    [0.4, 'Very low', 'unusually low'],
    [1, 'Low', 'is low'],
    [2, 'Near price-stability range', 'near the range'],
    [3, 'Elevated', 'is elevated'],
    [4, 'High', 'is high'],
  ])('uses the CPI state for %s', (value, state, phrase) => {
    const content = getInflationBackContent(value, 2.5, state)
    expect(content.howToReadIt).toContain(phrase)
    expect(content.howToReadIt).toContain("PCE inflation, not CPI")
    expect(content.howToReadIt).not.toContain("CPI target")
  })

  it('uses three-month payroll state while handling latest-month grammar', () => {
    const growing = getPayrollBackContent(20, -23, 'Growing slowly')
    expect(growing.whatItShows).toContain('added an average of 20,000')
    expect(growing.whatItShows).toContain('latest month lost 23,000')
    expect(growing.howToReadIt).toContain('still growing')
    expect(growing.whatItShows).not.toContain('added −')

    const shrinking = getPayrollBackContent(-10, 25, 'Shrinking')
    expect(shrinking.whatItShows).toContain('lost an average of 10,000')
    expect(shrinking.howToReadIt).toContain('is shrinking')
  })
})
