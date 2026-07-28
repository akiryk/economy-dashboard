import { describe, expect, it } from 'vitest'
import {
  annualizeBreakevenGrowth,
  annualizeThreeMonthGrowth,
  buildBreakevenEmploymentDataset,
  buildJobGrowthBreakevenDataset,
  deriveJobGrowthBreakevenObservations,
  parseFederalReserveBreakevenHtml,
  parsePayemsCsv,
} from './breakevenEmployment'

function addQuarters(startYear: number, index: number): string {
  const year = startYear + Math.floor(index / 4)
  const quarter = index % 4 + 1
  return `${year}q${quarter}`
}

function accessibleHtml(
  count = 268,
  rowOverride?: (index: number, row: string) => string,
): string {
  const rows = Array.from({ length: count }, (_, index) => {
    const row = `<tr><th class="stub">${addQuarters(1960, index)}</th>` +
      `<td class="data">${84.124763 + index}</td>` +
      '<td class="data">-1000</td>' +
      '<td class="data">1000</td></tr>'
    return rowOverride?.(index, row) ?? row
  }).join('')
  return '<h5 id="fig2">Figure 2. Breakeven pace of employment growth</h5>' +
    '<table><thead><tr>' +
    '<th class="colhead">QDate</th>' +
    '<th class="colhead">Breakeven employment growth</th>' +
    '<th class="colhead">Lower bound of 90-percent confidence interval</th>' +
    '<th class="colhead">Upper bound of 90-percent confidence interval</th>' +
    `</tr></thead><tbody>${rows}</tbody></table>`
}

describe('Federal Reserve breakeven source parsing', () => {
  it('validates table identity, chronology, units, and projection status', () => {
    const observations = parseFederalReserveBreakevenHtml(accessibleHtml())
    expect(observations).toHaveLength(268)
    expect(observations[0]).toEqual({
      date: '1960-03-01',
      estimatedMonthlyJobGrowth: 84.124763,
      estimateStatus: 'historical-estimate',
    })
    expect(observations.at(-1)).toMatchObject({
      date: '2026-12-01',
      estimateStatus: 'projection',
    })
  })

  it('rejects changed table headings', () => {
    expect(() => parseFederalReserveBreakevenHtml(
      accessibleHtml().replace(
        'Breakeven employment growth',
        'Different measure',
      ),
    )).toThrow('headings have changed')
  })

  it('rejects duplicate and nonfinite source observations', () => {
    expect(() => parseFederalReserveBreakevenHtml(
      accessibleHtml(268, (index, row) =>
        index === 1 ? row.replace('1960q2', '1960q1') : row),
    )).toThrow(/duplicate|missing or out-of-order/)
    expect(() => parseFederalReserveBreakevenHtml(
      accessibleHtml(268, (index, row) =>
        index === 4 ? row.replace('88.124763', 'not-a-number') : row),
    )).toThrow('nonfinite value')
  })
})

describe('PAYEMS parsing and aligned comparison', () => {
  it('validates headings, chronological order, duplicates, and nulls', () => {
    expect(parsePayemsCsv(
      'observation_date,PAYEMS\n2025-12-01,100\n2026-03-01,.\n',
    )).toEqual([
      { date: '2025-12-01', value: 100 },
      { date: '2026-03-01', value: null },
    ])
    expect(() => parsePayemsCsv(
      'observation_date,PAYEMS\n2026-03-01,100\n2026-03-01,101\n',
    )).toThrow('duplicate date')
    expect(() => parsePayemsCsv(
      'observation_date,PAYEMS\n2026-03-01,100\n2025-12-01,101\n',
    )).toThrow('not chronological')
    expect(() => parsePayemsCsv(
      'date,value\n2026-03-01,100\n',
    )).toThrow('unexpected headings')
  })

  it('uses exact three-month levels and a compatible starting denominator', () => {
    const [comparison] = deriveJobGrowthBreakevenObservations(
      [{
        date: '2026-03-01',
        estimatedMonthlyJobGrowth: 50,
        estimateStatus: 'projection',
      }],
      [
        { date: '2025-12-01', value: 100_000 },
        { date: '2026-01-01', value: 100_040 },
        { date: '2026-02-01', value: 100_090 },
        { date: '2026-03-01', value: 100_150 },
      ],
    )
    expect(comparison).toEqual({
      status: 'available',
      date: '2026-03-01',
      actualAverageMonthlyJobGrowth: 50,
      estimatedBreakevenMonthlyJobGrowth: 50,
      monthlyJobGrowthDifference: 0,
      startingPayrollEmployment: 100_000,
      endingPayrollEmployment: 100_150,
      actualAnnualizedPayrollGrowthRate:
        annualizeThreeMonthGrowth(100_000, 100_150),
      estimatedAnnualizedBreakevenGrowthRate:
        annualizeBreakevenGrowth(100_000, 50),
      gapPercentagePoints: 0,
      estimateStatus: 'projection',
    })
  })

  it('retains the count components and subtracts annualized rates', () => {
    const [comparison] = deriveJobGrowthBreakevenObservations(
      [{
        date: '2026-06-01',
        estimatedMonthlyJobGrowth: 20,
        estimateStatus: 'projection',
      }],
      [
        { date: '2026-03-01', value: 100_000 },
        { date: '2026-04-01', value: 100_100 },
        { date: '2026-05-01', value: 100_200 },
        { date: '2026-06-01', value: 100_300 },
      ],
    )
    expect(comparison?.status).toBe('available')
    if (comparison?.status !== 'available') return
    expect(comparison.actualAverageMonthlyJobGrowth).toBe(100)
    expect(comparison.monthlyJobGrowthDifference).toBe(80)
    expect(comparison.gapPercentagePoints).toBeCloseTo(
      comparison.actualAnnualizedPayrollGrowthRate -
      comparison.estimatedAnnualizedBreakevenGrowthRate,
      12,
    )
  })

  it('preserves missing exact periods and incomplete windows', () => {
    const estimate = [{
      date: '2026-06-01',
      estimatedMonthlyJobGrowth: 20,
      estimateStatus: 'projection' as const,
    }]
    expect(deriveJobGrowthBreakevenObservations(estimate, [
      { date: '2026-03-01', value: 100_000 },
    ])[0]).toMatchObject({
      status: 'unavailable',
      reason: 'missing-payroll-period',
    })
    expect(deriveJobGrowthBreakevenObservations(estimate, [
      { date: '2026-03-01', value: 100_000 },
      { date: '2026-04-01', value: 100_100 },
      { date: '2026-05-01', value: 100_200 },
      { date: '2026-06-01', value: null },
    ])[0]).toMatchObject({
      status: 'unavailable',
      reason: 'incomplete-payroll-window',
    })
    expect(deriveJobGrowthBreakevenObservations(estimate, [
      { date: '2026-03-01', value: 100_000 },
      { date: '2026-04-01', value: null },
      { date: '2026-05-01', value: 100_200 },
      { date: '2026-06-01', value: 100_300 },
    ])[0]).toMatchObject({
      status: 'unavailable',
      reason: 'incomplete-payroll-window',
    })
  })
})

describe('runtime dataset validation', () => {
  it('builds validated source and comparison datasets', () => {
    const source = buildBreakevenEmploymentDataset([{
      date: '2026-06-01',
      estimatedMonthlyJobGrowth: 20,
      estimateStatus: 'projection',
    }], '2026-07-28')
    const comparison = buildJobGrowthBreakevenDataset([{
      status: 'unavailable',
      date: '2026-06-01',
      estimatedBreakevenMonthlyJobGrowth: 20,
      estimateStatus: 'projection',
      reason: 'missing-payroll-period',
    }], '2026-07-28')
    expect(source.id).toBe('estimated-breakeven-employment-growth')
    expect(comparison.observations[0]?.status).toBe('unavailable')
  })
})
