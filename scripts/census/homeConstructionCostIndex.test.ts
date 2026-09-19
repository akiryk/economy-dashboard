import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  deriveRealConstructionCostIndex,
  parseConstructionCostWorkbook,
} from './homeConstructionCostIndex'

async function workbookBytes(values: readonly number[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Vertical')
  sheet.getCell('C6').value = 'Laspeyres\n (Fixed)'
  values.forEach((value, index) => {
    sheet.getCell(index + 7, 1).value = new Date(Date.UTC(2016 + Math.floor(index / 12), index % 12, 1))
    sheet.getCell(index + 7, 3).value = value
  })
  return Buffer.from(await workbook.xlsx.writeBuffer())
}

describe('Census home-construction cost ingestion', () => {
  it('accepts a controlled next month and revised recent observations', async () => {
    const baseline = Array.from({ length: 127 }, (_, index) => 100 + index / 10)
    const advanced = [...baseline]
    advanced[126] = 118.75
    advanced.push(119.2)

    const before = await parseConstructionCostWorkbook(await workbookBytes(baseline))
    const after = await parseConstructionCostWorkbook(await workbookBytes(advanced))

    expect(after.at(-1)?.date).toBe('2026-08-01')
    expect(after.at(-1)?.value).toBe(119.2)
    expect(after.at(-2)?.value).toBe(118.75)
    expect(after.length).toBe(before.length + 1)
  })

  it('adjusts for CPI and preserves an explicit gap when a CPI month is absent', () => {
    const cpi = Array.from({ length: 12 }, (_, month) => ({
      date: `2005-${String(month + 1).padStart(2, '0')}-01`,
      value: 100,
    }))
    const result = deriveRealConstructionCostIndex(
      [{ date: '2005-01-01', value: 100 }, { date: '2006-01-01', value: 110 }],
      cpi,
    )
    expect(result).toEqual([
      { date: '2005-01-01', value: 100 },
      { date: '2006-01-01', value: null },
    ])
  })
})
