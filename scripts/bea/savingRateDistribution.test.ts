import { readFile, mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { calculateSavingRate, parseSavingRateDistributionWorkbook, refreshSavingRateDistribution } from './savingRateDistribution'

async function workbook(changes: { duplicateYear?: boolean; badHeader?: boolean; missing?: boolean } = {}) {
  const result = new ExcelJS.Workbook()
  const sheet = result.addWorksheet('savings rates')
  sheet.addRow(['Year', changes.badHeader ? 'wrong' : '0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%', '0-20%', '20-40%', '40-60%', '60-80%', '80-100%', 'Top 5%', 'Top 1%'])
  sheet.addRow([2023, changes.missing ? 'N/A' : -1, -.5, -.4, -.3, -.2, -.1, 0, .1, .2, .5])
  if (changes.duplicateYear) sheet.addRow([2023, -1, -.5, -.4, -.3, -.2, -.1, 0, .1, .2, .5])
  return new Uint8Array(await result.xlsx.writeBuffer())
}

describe('BEA saving-rate distribution ingestion', () => {
  it('uses BEA directly published rates and preserves nulls and statuses', async () => {
    const result = await parseSavingRateDistributionWorkbook(await workbook({ missing: true }), '2026-08-03', { 2023: 'experimental' })
    expect(result.observations[0]).toMatchObject({ rate: null, status: 'experimental' })
    expect(result.observations[1]).toMatchObject({ rate: -50 })
    expect(result.observations[6]).toMatchObject({ rate: 0 })
  })

  it('calculates a rate from components without approximating unavailable inputs', () => {
    expect(calculateSavingRate(25, 200)).toBe(12.5)
    expect(calculateSavingRate(null, 200)).toBeNull()
    expect(calculateSavingRate(25, 0)).toBeNull()
  })

  it.each([{ badHeader: true }, { duplicateYear: true }])('rejects structurally unexpected workbooks', async (changes) => {
    await expect(parseSavingRateDistributionWorkbook(await workbook(changes), '2026-08-03')).rejects.toThrow()
  })

  it('preserves the prior committed file when refresh validation fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'saving-distribution-'))
    const outputFile = path.join(directory, 'data.json')
    await writeFile(outputFile, 'prior valid data')
    await expect(refreshSavingRateDistribution({
      retrievedAt: '2026-08-03', outputFile,
      fetchImplementation: async (input) => String(input).endsWith('.xlsx')
        ? new Response(await workbook({ badHeader: true }))
        : new Response('<a href="/current/joint_dist_summary.xlsx">workbook</a>'),
    })).rejects.toThrow()
    expect(await readFile(outputFile, 'utf8')).toBe('prior valid data')
  })
})
