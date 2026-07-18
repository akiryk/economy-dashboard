import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import { localEconomicSeriesRepository } from '../economic-series/repositories/localEconomicSeriesRepository'
import { buildLaborBriefing, LABOR_RESEARCH_LINKS, renderLaborSynthesis, selectLaborTemplate, type LaborTemplateId } from './laborBriefing'

function series(slug: string, values: readonly number[], frequency: 'monthly' | 'weekly' = 'monthly'): EconomicSeries {
  return {
    id: slug, slug, provider: 'Fixture', providerSeriesId: slug, title: slug, shortTitle: slug,
    description: '', question: '', units: frequency === 'weekly' ? 'Thousands' : 'Percent', frequency,
    seasonalAdjustment: null, transformation: '', sourceName: 'Fixture', sourceUrl: 'https://example.com', retrievedAt: '2024-01-01',
    observations: values.map((value, index) => {
      const date = new Date(Date.UTC(2020, frequency === 'monthly' ? index : 0, frequency === 'weekly' ? 1 + index * 7 : 1))
      return { date: date.toISOString().slice(0, 10), value }
    }),
  }
}

const stableValues = Array.from({ length: 49 }, (_, index) => 4 + (index % 3) * 0.1)

function fixtures(overrides: Partial<Parameters<typeof buildLaborBriefing>[0]> = {}) {
  return {
    unemployment: series('unemployment-rate', stableValues),
    payrolls: series('payroll-growth', stableValues.map((_, index) => 100 + (index % 3))),
    primeAgeEmployment: series('prime-age-employment-ratio', stableValues.map((value) => 70 - value)),
    claims: series('initial-unemployment-claims-four-week-average', Array.from({ length: 120 }, (_, index) => 220_000 + (index % 4) * 1_000), 'weekly'),
    ...overrides,
  }
}

describe('Labor briefing orchestration', () => {
  it('builds a complete stable view model whose supporting data cannot change its chips', () => {
    const result = buildLaborBriefing(fixtures(), '2024-01-15')
    const withoutSupporting = buildLaborBriefing(fixtures({ primeAgeEmployment: null, claims: null }), '2024-01-15')
    expect(result.status).toBe('ready')
    expect(withoutSupporting.status).toBe('ready')
    if (result.status !== 'ready' || withoutSupporting.status !== 'ready') return
    expect(result.directionReading.reading).toBe('broadly-stable')
    expect(withoutSupporting.conditionReading.reading).toBe(result.conditionReading.reading)
    expect(withoutSupporting.directionReading.reading).toBe(result.directionReading.reading)
    expect(withoutSupporting.supportingErrors).toHaveLength(2)
    expect(result.primaries.map(({ link }) => link)).toEqual([LABOR_RESEARCH_LINKS.unemployment, LABOR_RESEARCH_LINKS.payrolls])
  })

  it('returns unclear when primary data is missing or insufficient', () => {
    expect(buildLaborBriefing(fixtures({ unemployment: null }), '2024-01-15')).toMatchObject({ status: 'unclear' })
    expect(buildLaborBriefing(fixtures({ unemployment: series('unemployment-rate', [1, 2, 3]) }), '2024-01-15')).toMatchObject({ status: 'unclear' })
  })

  it('selects stale and no-fresh evidence templates without implying stability', () => {
    const stale = buildLaborBriefing(fixtures(), '2024-02-20')
    const suppressed = buildLaborBriefing(fixtures(), '2024-04-01')
    expect(stale).toMatchObject({ status: 'ready', templateId: 'stale-primary', staleWarning: true })
    expect(suppressed).toMatchObject({ status: 'ready', directionLabel: 'no fresh evidence', templateId: 'stale-primary' })
    if (suppressed.status === 'ready') expect(suppressed.synthesis).not.toMatch(/broadly stable/i)
  })

  it('applies a revision qualifier only when payroll movement clears its gate', () => {
    const payrollValues = [...stableValues.slice(0, -1), 500]
    const material = buildLaborBriefing(fixtures({ payrolls: series('payroll-growth', payrollValues) }), '2024-01-15')
    const stable = buildLaborBriefing(fixtures(), '2024-01-15')
    expect(material).toMatchObject({ status: 'ready', revisionQualified: true })
    expect(stable).toMatchObject({ status: 'ready', revisionQualified: false })
    if (material.status === 'ready') expect(material.synthesis).toContain('commonly revised')
    if (stable.status === 'ready') expect(stable.synthesis).not.toContain('commonly revised')
  })

  it('keeps every template finite, factual, and free of causal or predictive phrasing', () => {
    const result = buildLaborBriefing(fixtures(), '2024-01-15')
    if (result.status !== 'ready') throw new Error('Expected fixture to build')
    expect(result.synthesis).toContain('Unemployment is')
    expect(result.synthesis).toContain('payroll growth averages')
    expect(result.synthesis).not.toMatch(/because|due to|therefore|will /i)
  })

  it('selects every Labor analytical template deterministically', () => {
    expect(selectLaborTemplate('favorable-side', 'improving', false)).toBe('agree-improving')
    expect(selectLaborTemplate('typical', 'broadly-stable', false)).toBe('agree-stable')
    expect(selectLaborTemplate('favorable-side', 'normalizing', false)).toBe('favorable-normalizing')
    expect(selectLaborTemplate('favorable-side', 'deteriorating', false)).toBe('favorable-deteriorating')
    expect(selectLaborTemplate('unfavorable-side', 'improving', false)).toBe('unfavorable-improving')
    expect(selectLaborTemplate('mixed', 'improving', false)).toBe('mixed-condition')
    expect(selectLaborTemplate('typical', 'mixed', false)).toBe('mixed-direction')
    expect(selectLaborTemplate('typical', 'no-fresh-evidence', false)).toBe('stale-primary')
    expect(selectLaborTemplate('unclear', 'unclear', false)).toBe('unclear-primary')
    expect(selectLaborTemplate('typical', 'deteriorating', false)).toBe('other-valid')
  })

  it('renders all reviewed templates with both facts and required conflict or adverse wording', () => {
    const result = buildLaborBriefing(fixtures(), '2024-01-15')
    if (result.status !== 'ready') throw new Error('Expected ready fixture')
    const templates: LaborTemplateId[] = ['agree-improving', 'agree-stable', 'favorable-normalizing', 'favorable-deteriorating', 'unfavorable-improving', 'mixed-condition', 'mixed-direction', 'stale-primary', 'unclear-primary', 'other-valid']
    for (const template of templates) {
      const sentence = renderLaborSynthesis(template, result.primaries[0], result.primaries[1], false)
      expect(sentence).toContain(result.primaries[0].value)
      expect(sentence).toContain(result.primaries[1].value)
      expect(sentence).not.toMatch(/because|due to|therefore|will /i)
      if (template.startsWith('mixed')) expect(sentence).toMatch(/disagree|mixed/i)
      if (template === 'favorable-normalizing') expect(sentence).toMatch(/adverse/i)
      if (template === 'stale-primary') expect(sentence).not.toMatch(/broadly stable/i)
    }
  })

  it('loads all four committed repositories and builds populated trace and sparkline data', async () => {
    const [unemployment, payrolls, primeAgeEmployment, claims] = await Promise.all([
      localEconomicSeriesRepository.getBySlug('unemployment-rate'), localEconomicSeriesRepository.getBySlug('payroll-growth'),
      localEconomicSeriesRepository.getBySlug('prime-age-employment-ratio'), localEconomicSeriesRepository.getBySlug('initial-unemployment-claims-four-week-average'),
    ])
    const result = buildLaborBriefing({ unemployment, payrolls, primeAgeEmployment, claims }, '2026-07-18')
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.primaries).toHaveLength(2)
    expect(result.supporting).toHaveLength(2)
    expect(result.sparkline.observations.length).toBeGreaterThan(100)
    expect(result.synthesis).not.toMatch(/\{[^}]+\}/)
  })
})
