import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../src/features/economic-series/models/economicSeries'
import { writeEconomicSeriesGroupAtomically } from './writeEconomicSeries'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  )
})

function createSeries(slug: string, value: number): EconomicSeries {
  return {
    id: slug,
    slug,
    provider: 'Federal Reserve Bank of St. Louis',
    providerSeriesId: 'PAYEMS',
    title: slug,
    shortTitle: slug,
    description: 'Derived payroll data',
    question: 'Payroll question?',
    units: 'Thousands of jobs',
    frequency: 'monthly',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Calculated by the application',
    sourceName: 'BLS via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/PAYEMS',
    retrievedAt: '2026-07-12',
    observations: [{ date: '2026-06-01', value }],
  }
}

describe('writeEconomicSeriesGroupAtomically', () => {
  it('replaces both validated outputs with trailing newlines', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'payroll-group-'))
    temporaryDirectories.push(directory)
    const monthlyPath = path.join(directory, 'monthly.json')
    const averagePath = path.join(directory, 'average.json')

    await writeEconomicSeriesGroupAtomically([
      { outputPath: monthlyPath, series: createSeries('monthly', 100) },
      { outputPath: averagePath, series: createSeries('average', 80) },
    ])

    expect(await readFile(monthlyPath, 'utf8')).toMatch(/\n$/)
    expect(await readFile(averagePath, 'utf8')).toMatch(/\n$/)
  })

  it.each([0, 1])(
    'preserves both existing files when output %i is invalid',
    async (invalidIndex) => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'payroll-group-'))
    temporaryDirectories.push(directory)
    const monthlyPath = path.join(directory, 'monthly.json')
    const averagePath = path.join(directory, 'average.json')
    const oldMonthly = '{"old":"monthly"}\n'
    const oldAverage = '{"old":"average"}\n'
    await writeFile(monthlyPath, oldMonthly, 'utf8')
    await writeFile(averagePath, oldAverage, 'utf8')

      const series = [createSeries('monthly', 100), createSeries('average', 80)]
      series[invalidIndex] = { ...series[invalidIndex]!, observations: [] }

      await expect(
        writeEconomicSeriesGroupAtomically([
          { outputPath: monthlyPath, series: series[0]! },
          { outputPath: averagePath, series: series[1]! },
        ]),
      ).rejects.toThrow('must include observations')

    expect(await readFile(monthlyPath, 'utf8')).toBe(oldMonthly)
    expect(await readFile(averagePath, 'utf8')).toBe(oldAverage)
    expect((await readdir(directory)).sort()).toEqual([
      'average.json',
      'monthly.json',
    ])
    },
  )
})
