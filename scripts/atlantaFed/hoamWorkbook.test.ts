import { describe, expect, it } from 'vitest'
import {
  HOAM_WORKBOOK_URL,
  fetchHoamWorkbook,
  parseHoamWorkbook,
  type HoamConfiguration,
} from './hoamWorkbook'

function storedZip(entries: Record<string, string>): ArrayBuffer {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  for (const [name, contents] of Object.entries(entries)) {
    const fileName = Buffer.from(name)
    const data = Buffer.from(contents)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(fileName.length, 26)
    localParts.push(local, fileName, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(fileName.length, 28)
    central.writeUInt32LE(offset, 42)
    centralParts.push(central, fileName)
    offset += local.length + fileName.length + data.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(entries).length, 8)
  end.writeUInt16LE(Object.keys(entries).length, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)
  const archive = Buffer.concat([...localParts, centralDirectory, end])
  return archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength)
}

function workbook(rows: Array<{ month: string; value?: string }>, header = 'Annual Payment Share of Income') {
  const strings = ['Month', 'Unused B', 'Unused C', header, ...rows.map((row) => row.month)]
  const shared = `<sst>${strings.map((value) => `<si><t>${value}</t></si>`).join('')}</sst>`
  const sheetRows = [
    '<row><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>',
    ...rows.map((row, index) => `<row><c r="A${index + 2}" t="s"><v>${index + 4}</v></c>${row.value === undefined ? '' : `<c r="D${index + 2}"><v>${row.value}</v></c>`}</row>`),
  ]
  return storedZip({
    'xl/sharedStrings.xml': shared,
    'xl/worksheets/sheet1.xml': `<worksheet><sheetData>${sheetRows.join('')}</sheetData></worksheet>`,
  })
}

const config: HoamConfiguration = {
  dataHandling: 'hoam-provider',
  outputFile: '/tmp/unused.json',
  minimumUsableObservations: 2,
}

describe('Atlanta Fed HOAM workbook', () => {
  it('selects the national cost-share field, converts ratios to percentages, sorts, preserves gaps, and excludes future rows', () => {
    const result = parseHoamWorkbook(workbook([
      { month: '2025-02', value: '0.42' },
      { month: '2025-01', value: '0.405' },
      { month: '2025-03' },
      { month: '2027-01', value: '0.99' },
    ]), '2026-01-01', config)

    expect(result).toMatchObject({
      slug: 'home-ownership-cost-share',
      provider: 'Federal Reserve Bank of Atlanta',
      units: 'Percent of median household income',
      frequency: 'monthly',
    })
    expect(result.observations).toEqual([
      { date: '2025-01-01', value: 40.5 },
      { date: '2025-02-01', value: 42 },
      { date: '2025-03-01', value: null },
    ])
  })

  it.each([
    [workbook([{ month: 'Jan 2025', value: '0.4' }, { month: '2025-02', value: '0.4' }]), 'invalid month'],
    [workbook([{ month: '2025-01', value: 'unknown' }, { month: '2025-02', value: '0.4' }]), 'invalid cost share'],
    [workbook([{ month: '2025-01', value: '0.4' }, { month: '2025-01', value: '0.41' }]), 'duplicate month'],
    [workbook([{ month: '2025-01', value: '0.4' }, { month: '2025-02' }]), 'at least 2 usable'],
    [workbook([{ month: '2025-01', value: '0.4' }, { month: '2025-02', value: '0.4' }], 'Changed field'), 'schema has changed'],
  ])('rejects invalid or changed workbooks', (input, message) => {
    expect(() => parseHoamWorkbook(input, '2026-01-01', config)).toThrow(message)
  })

  it('uses the official workbook URL and reports HTTP failures', async () => {
    let requested = ''
    await expect(fetchHoamWorkbook(async (input) => {
      requested = String(input)
      return new Response('', { status: 503 })
    })).rejects.toThrow('HTTP 503')
    expect(requested).toBe(HOAM_WORKBOOK_URL)
  })
})
