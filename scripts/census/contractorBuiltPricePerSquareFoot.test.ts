import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { parseContractorPricePerSquareFootWorkbook } from './contractorBuiltPricePerSquareFoot'

function workbookBytes(values: readonly number[]): Uint8Array {
  const rows: unknown[][] = Array.from({ length: 8 }, () => [])
  rows[0] = ['Median and Average Contract Price per Square Foot of New Contractor-Built Single-Family Houses Started']
  rows[3] = [null, 'Median contract price per square foot']
  rows[5] = ['Year', 'United']
  rows[6] = [null, 'States']
  values.forEach((value, index) => rows.push([1987 + index, value]))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(rows),
    'ContractMedAvgPriceSqFt',
  )
  return XLSX.write(workbook, { type: 'array', bookType: 'biff8' })
}

describe('Census contractor-built price-per-square-foot ingestion', () => {
  it('accepts a controlled next annual observation and a revised recent year', () => {
    const baseline = Array.from({ length: 39 }, (_, index) => 40 + index * 3)
    const advanced = [...baseline]
    advanced[38] = 160.5
    advanced.push(171.25)

    const before = parseContractorPricePerSquareFootWorkbook(workbookBytes(baseline))
    const after = parseContractorPricePerSquareFootWorkbook(workbookBytes(advanced))

    expect(after.at(-1)).toEqual({ date: '2026-01-01', value: 171.25 })
    expect(after.at(-2)).toEqual({ date: '2025-01-01', value: 160.5 })
    expect(after.slice(0, -2)).toEqual(before.slice(0, -1))
  })

  it('rejects a gap in the annual history', () => {
    const bytes = workbookBytes(Array.from({ length: 39 }, (_, index) => 40 + index))
    const workbook = XLSX.read(bytes, { type: 'array' })
    const sheet = workbook.Sheets.ContractMedAvgPriceSqFt!
    sheet.A20!.v = 2000
    const malformed = XLSX.write(workbook, { type: 'array', bookType: 'biff8' })

    expect(() => parseContractorPricePerSquareFootWorkbook(malformed))
      .toThrow(/not annual/)
  })
})
