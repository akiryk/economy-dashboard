import { describe, expect, it } from 'vitest'
import { validateInternationalComparisonData } from '../../src/features/international-comparison/models/internationalComparison'
import { createInternationalComparisonData, normalizeOecdMetric, oecdMetricConfigurations, parseCsv } from './internationalComparisons'

function fixtureFor(config = oecdMetricConfigurations[0]!, appendedUsPeriod = '2026-Q2'): string {
  const columns = ['DATAFLOW', 'REF_AREA', ...Object.keys(config.expected), ...Object.keys(config.allowed ?? {}), 'TIME_PERIOD', 'OBS_VALUE']
  const countries = ['AUS', 'CAN', 'FRA', 'DEU', 'ITA', 'JPN', 'KOR', 'ESP', 'GBR', 'USA']
  const period = config.frequency === 'monthly' ? '2026-06' : '2026-Q1'
  const rows = countries.map((country, index) => {
    const values: Record<string, string> = {
      DATAFLOW: `${config.agency}:${config.dataflow}(${config.version})`,
      REF_AREA: country,
      TIME_PERIOD: country === 'USA' ? appendedUsPeriod : period,
      OBS_VALUE: String(70 + index),
      ...config.expected,
    }
    for (const [column, allowed] of Object.entries(config.allowed ?? {})) values[column] = allowed[0]!
    return columns.map((column) => values[column] ?? '').join(',')
  })
  return `${columns.join(',')}\n${rows.join('\n')}\n`
}

describe('OECD international comparison normalization', () => {
  it('parses quoted CSV fields without splitting embedded commas', () => {
    expect(parseCsv('A,B\n"one, two",3\n')).toEqual([['A', 'B'], ['one, two', '3']])
  })

  it('normalizes exact source dimensions and remains valid when a new observation is appended', () => {
    const config = oecdMetricConfigurations[0]!
    const original = normalizeOecdMetric(fixtureFor(config, '2026-Q1'), config)
    const advanced = normalizeOecdMetric(fixtureFor(config, '2026-Q2'), config)
    expect(original.observations.find(({ countryCode }) => countryCode === 'USA')?.period).toBe('2026-Q1')
    expect(advanced.observations.find(({ countryCode }) => countryCode === 'USA')?.period).toBe('2026-Q2')
  })

  it('rejects an unexpected semantic source code', () => {
    const config = oecdMetricConfigurations[0]!
    expect(() => normalizeOecdMetric(fixtureFor(config).replaceAll('EMP_WAP', 'WRONG'), config))
      .toThrow(/unexpected OECD dataflow|unexpected MEASURE/)
  })

  it('rejects duplicate observations and insufficient current coverage', () => {
    const metrics = oecdMetricConfigurations.map((config) => normalizeOecdMetric(
      fixtureFor(config, config.frequency === 'monthly' ? '2026-06' : '2026-Q1'),
      config,
    ))
    const data = createInternationalComparisonData(metrics, '2026-08-17')
    const duplicate = structuredClone(data)
    duplicate.metrics[0]!.observations.push(duplicate.metrics[0]!.observations[0]!)
    expect(() => validateInternationalComparisonData(duplicate)).toThrow(/Duplicate observation/)

    const sparse = structuredClone(data)
    sparse.metrics[0]!.observations = sparse.metrics[0]!.observations.slice(0, 7)
    expect(() => validateInternationalComparisonData(sparse)).toThrow(/missing current United States|only 7 current/)
  })
})
