import { describe, expect, it } from 'vitest'
import {
  getClaimsBackContent,
  getGdpBackContent,
  getInflationBackContent,
  getHighYieldSpreadBackContent,
  getMortgageRateBackContent,
  getPayrollBackContent,
  getSahmBackContent,
  getSp500BackContent,
  getUnemploymentBackContent,
} from './cardBackContent'

describe('dashboard card back content', () => {
  it('uses grammatical GDP direction and current periods', () => {
    const growing = getGdpBackContent(2.4, '2026-04-01', 'Growing')
    expect(growing.whatItShows).toContain('2.4% higher in Q2 2026 than in Q2 2025')
    expect(growing.whatItShows).toContain('same quarter one year earlier')
    expect(growing.whatItShows).not.toContain('annualized')
    const contracting = getGdpBackContent(-1.2, '2026-07-01', 'Contracting')
    expect(contracting.whatItShows).toContain('1.2% lower in Q3 2026 than in Q3 2025')
    expect(contracting.howToReadIt).toContain('does not establish a recession')
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
    const content = getInflationBackContent(value, state)
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

  it('describes the mortgage benchmark without mixing in Treasury rates', () => {
    const content = getMortgageRateBackContent(6.69, 'Aug 6, 2026', 'up 0.2 pp from a year ago')
    expect(content.whatItShows).toContain('6.69% on Aug 6, 2026')
    expect(content.whatItShows).toContain('up 0.2 pp from a year ago')
    expect(content.howToReadIt).toContain('individual offer varies')
    expect(content.howToReadIt).not.toMatch(/good|bad|favorable|unfavorable/i)
  })

  it('limits S&P claims to available FRED history', () => {
    const content = getSp500BackContent(-4.2, 6_340, 7.8, 'Modest pullback')
    expect(content.whatItShows).toContain('available FRED history')
    expect(content.howToReadIt).toContain('not necessarily an all-time drawdown')
    expect(content.howToReadIt).toContain('pulled back modestly')
  })

  it('explains high-yield risk premiums without deterministic safety or recession claims', () => {
    const calm = getHighYieldSpreadBackContent(312, 'Calm', 8)
    expect(calm.whatItShows).toContain('after option adjustment')
    expect(calm.howToReadIt).toContain('unusually low')
    expect(calm.howToReadIt).toContain('do not eliminate default risk')
    const stressed = getHighYieldSpreadBackContent(550, 'Stressed', 95)
    expect(stressed.howToReadIt).toContain('substantially more compensation')
    expect(stressed.howToReadIt).toContain('do not guarantee recession')
  })
})
