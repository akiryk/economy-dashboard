import { describe, expect, it } from 'vitest'
import breakevenData from '../data/estimated-breakeven-employment-growth.json'
import comparisonData from '../data/job-growth-breakeven-comparison.json'
import {
  validateBreakevenEmploymentDataset,
  validateJobGrowthBreakevenDataset,
} from './jobGrowthBreakeven'

describe('job-growth breakeven runtime validators', () => {
  it('validates production data against published Federal Reserve benchmarks', () => {
    const source = validateBreakevenEmploymentDataset(breakevenData)
    const comparison = validateJobGrowthBreakevenDataset(comparisonData)
    expect(source.observations.length).toBeGreaterThanOrEqual(268)
    expect(source.observations.find(({ date }) => date === '1960-03-01'))
      .toMatchObject({ estimatedMonthlyJobGrowth: 84.124763 })
    expect(source.observations.find(({ date }) => date === '2020-12-01'))
      .toMatchObject({ estimatedMonthlyJobGrowth: 49.207317 })
    const latestSource = source.observations.at(-1)!
    expect(latestSource.estimatedMonthlyJobGrowth).toBeTypeOf('number')
    expect(['historical', 'projection']).toContain(latestSource.estimateStatus)
    const latest = [...comparison.observations].reverse().find(
      ({ status }) => status === 'available',
    )
    expect(latest?.status).toBe('available')
    if (latest?.status !== 'available') return
    expect(latest.monthlyJobGrowthDifference).toBeCloseTo(
      latest.actualAverageMonthlyJobGrowth - latest.estimatedBreakevenMonthlyJobGrowth,
    )
    expect(latest.gapPercentagePoints).toBeCloseTo(
      latest.actualAnnualizedPayrollGrowthRate - latest.estimatedAnnualizedBreakevenGrowthRate,
    )
  })

  it('rejects duplicate source periods', () => {
    expect(() => validateBreakevenEmploymentDataset({
      id: 'estimated-breakeven-employment-growth',
      provider: 'Board of Governors of the Federal Reserve System',
      title: 'Title',
      description: 'Description',
      units: 'Thousands of jobs per month',
      frequency: 'quarterly',
      periodConvention: 'Quarter ending month',
      methodology: 'Published method',
      sourceName: 'Source',
      sourceUrl: 'https://example.com',
      publicationDate: '2026-04-02',
      retrievedAt: '2026-07-28',
      observations: [
        {
          date: '2026-03-01',
          estimatedMonthlyJobGrowth: 10,
          estimateStatus: 'projection',
        },
        {
          date: '2026-03-01',
          estimatedMonthlyJobGrowth: 20,
          estimateStatus: 'projection',
        },
      ],
    })).toThrow('duplicate date')
  })

  it('rejects nonfinite derived fields', () => {
    expect(() => validateJobGrowthBreakevenDataset({
      id: 'job-growth-breakeven-comparison',
      title: 'Title',
      description: 'Description',
      question: 'Is job growth keeping up with the labor force?',
      frequency: 'quarterly',
      units: 'Percentage points',
      transformation: 'Transformation',
      sourceName: 'Source',
      sourceUrl: 'https://example.com',
      retrievedAt: '2026-07-28',
      sources: [
        {
          provider: 'Board of Governors of the Federal Reserve System',
          role: 'Estimated breakeven employment growth',
          sourceUrl: 'https://example.com',
        },
        {
          provider: 'Federal Reserve Bank of St. Louis',
          providerSeriesId: 'PAYEMS',
          role: 'Total nonfarm payroll employment',
          sourceUrl: 'https://example.com',
        },
      ],
      observations: [{
        status: 'available',
        date: '2026-06-01',
        actualAverageMonthlyJobGrowth: 100,
        estimatedBreakevenMonthlyJobGrowth: 20,
        monthlyJobGrowthDifference: 80,
        startingPayrollEmployment: 100_000,
        endingPayrollEmployment: 100_300,
        actualAnnualizedPayrollGrowthRate: 1,
        estimatedAnnualizedBreakevenGrowthRate: 0.2,
        gapPercentagePoints: Number.NaN,
        estimateStatus: 'projection',
      }],
    })).toThrow('nonfinite gapPercentagePoints')
  })
})
