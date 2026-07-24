import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { zipSync } from 'fflate'
import { afterEach, describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { ingestInflationContributionRelease } from './ingestInflationContributionRelease'
import {
  BLS_SUPPLEMENTAL_FILES_URL,
  parseInflationContributionWorkbook,
  table7WorkbooksFromArchive,
  validateInflationContributionCollection,
} from './inflationContributionRelease'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

interface WorkbookChanges {
  title?: string
  header?: unknown[]
  rows?: unknown[][]
}

async function workbook(changes: WorkbookChanges = {}): Promise<Uint8Array> {
  const title = changes.title ??
    'Table 7. Consumer Price Index for All Urban Consumers (CPI-U): U.S. city average, by expenditure category, June 2026, 12-month analysis table'
  const header = changes.header ?? [
    'Expenditure category',
    'Relative importance May 2026',
    'Unadjusted percent change June 2025-June 2026',
    'Unadjusted effect on All Items June 2025-June 2026',
  ]
  const rows = changes.rows ?? [
    ['All items', 100, 3.5, ''],
    ['Food', 13, 3, 0.410],
    ['Energy', 7, 14, 1.051],
    ['Shelter', 35, 3, 1.159],
    ['Commodities less food and energy commodities', 18, 1, 0.158],
    ['Services less energy services', 27, 4, 1.912],
  ]
  const result = new ExcelJS.Workbook()
  const sheet = result.addWorksheet('Table 7')
  sheet.addRows([[title], header, ...rows])
  return new Uint8Array(await result.xlsx.writeBuffer())
}

function metadata(
  period = '2026-06-01',
  releaseDate = '2026-07-14',
  sourceUrl = `${BLS_SUPPLEMENTAL_FILES_URL}news-release-table7-202606.xlsx`,
  sourceFile = 'news-release-table7-202606.xlsx',
) {
  return { period, sourceReleaseDate: releaseDate, sourceUrl, sourceFile }
}

describe('BLS Table 7 XLSX inflation-contribution ingestion', () => {
  it('extracts effects, preserves signs, derives Other services, and reconciles', async () => {
    const release = await parseInflationContributionWorkbook(await workbook(), metadata())
    expect(release).toMatchObject({
      period: '2026-06-01',
      headlineCpiEffectTotal: 3.5,
      food: 0.410,
      energy: 1.051,
      shelter: 1.159,
      commoditiesLessFoodAndEnergy: 0.158,
      servicesLessEnergyServices: 1.912,
      otherServices: 0.753,
      sourceReleaseDate: '2026-07-14',
      sourceFile: 'news-release-table7-202606.xlsx',
      vintage: 'release',
      reconciliationResidual: -0.031,
      reconciliationStatus: 'reconciled',
    })
  })

  it('selects the effect column rather than the nearby inflation-rate column', async () => {
    const release = await parseInflationContributionWorkbook(await workbook(), metadata())
    expect(release.food).toBe(0.410)
    expect(release.food).not.toBe(3)
  })

  it('parses the split merged headers and rich-text footnotes used by BLS workbooks', async () => {
    const result = new ExcelJS.Workbook()
    const sheet = result.addWorksheet('Table 7')
    sheet.addRows([
      [
        'Table 7. Consumer Price Index for All Urban Consumers (CPI-U): U.S. city average, by expenditure category, June 2026, 12-month analysis table',
      ],
      [],
      [
        'Indent Level',
        'Expenditure category',
        'Relative importance',
        'Twelve Month',
        'Twelve Month',
      ],
      [null, null, null, 'Unadjusted percent change June 2025-June 2026'],
      [null, null, null, null, null],
      [0, 'All items', 100, 3.5],
      [1, 'Food', 13, 3, 0.410],
      [1, 'Energy', 7, 14, 1.051],
      [1, 'Shelter', 35, 3, 1.159],
      [1, 'Commodities less food and energy commodities', 18, 1, 0.158],
      [1, 'Services less energy services', 27, 4, 1.912],
    ])
    sheet.getCell(4, 5).value = {
      richText: [
        { text: 'Unadjusted effect on All Items June 2025-June 2026' },
        { text: '(1)', font: { vertAlign: 'superscript' } },
      ],
    }

    const contents = new Uint8Array(await result.xlsx.writeBuffer())
    const release = await parseInflationContributionWorkbook(contents, metadata())

    expect(release).toMatchObject({
      food: 0.410,
      otherServices: 0.753,
      reconciliationResidual: -0.031,
    })
  })

  it('preserves a negative contribution and unrounded subtraction', async () => {
    const contents = await workbook({
      rows: [
        ['All items', 100, 2.7, ''],
        ['Food', 13, 3, 0.410],
        ['Energy', 7, -1, -0.070],
        ['Shelter', 35, 4, 1.355],
        ['Commodities less food and energy commodities', 18, 1, 0.151],
        ['Services less energy services', 27, 5, 2.188],
      ],
    })
    const release = await parseInflationContributionWorkbook(contents, metadata())
    expect(release.energy).toBe(-0.070)
    expect(release.otherServices).toBe(0.833)
    expect(release.reconciliationResidual).toBeCloseTo(0.021, 12)
  })

  it.each([
    ['missing category', () => workbook({ rows: [
      ['All items', 100, 3.5, ''],
      ['Energy', 7, 14, 1.051],
      ['Shelter', 35, 3, 1.159],
      ['Commodities less food and energy commodities', 18, 1, 0.158],
      ['Services less energy services', 27, 4, 1.912],
    ] })],
    ['duplicate category', () => workbook({ rows: [
      ['All items', 100, 3.5, ''],
      ['Food', 13, 3, 0.410],
      ['Food', 13, 3, 0.410],
      ['Energy', 7, 14, 1.051],
      ['Shelter', 35, 3, 1.159],
      ['Commodities less food and energy commodities', 18, 1, 0.158],
      ['Services less energy services', 27, 4, 1.912],
    ] })],
    ['malformed effect', () => workbook({ rows: [
      ['All items', 100, 3.5, ''],
      ['Food', 13, 3, '0.410'],
      ['Energy', 7, 14, 1.051],
      ['Shelter', 35, 3, 1.159],
      ['Commodities less food and energy commodities', 18, 1, 0.158],
      ['Services less energy services', 27, 4, 1.912],
    ] })],
    ['unexpected heading', () => workbook({ title: 'Table 6. Wrong table' })],
    ['ambiguous effect column', () => workbook({ header: [
      'Expenditure category',
      'Unadjusted percent change',
      'Unadjusted effect on All Items',
      'Unadjusted effect on All Items',
    ] })],
  ])('rejects %s', async (_name, invalidWorkbook) => {
    await expect(
      parseInflationContributionWorkbook(await invalidWorkbook(), metadata()),
    ).rejects.toThrow()
  })

  it('rejects a source-period mismatch', async () => {
    await expect(
      parseInflationContributionWorkbook(
        await workbook(),
        metadata(
          '2026-05-01',
          '2026-06-11',
          `${BLS_SUPPLEMENTAL_FILES_URL}news-release-table7-202605.xlsx`,
          'news-release-table7-202605.xlsx',
        ),
      )).rejects.toThrow(/conflicts/)
  })

  it('rejects duplicate months, unsorted data, and a fabricated October release', async () => {
    const june = await parseInflationContributionWorkbook(await workbook(), metadata())
    expect(() => validateInflationContributionCollection([june, june]))
      .toThrow(/Duplicate/)
    const may = { ...june, period: '2026-05-01' }
    expect(() => validateInflationContributionCollection([june, may]))
      .toThrow(/sorted/)
    await expect(
      parseInflationContributionWorkbook(
        await workbook({
          title: 'Table 7. Consumer Price Index for All Urban Consumers (CPI-U): U.S. city average, by expenditure category, October 2025, 12-month analysis table',
        }),
        metadata(
          '2025-10-01',
          '2025-11-13',
          `${BLS_SUPPLEMENTAL_FILES_URL}news-release-table7-202510.xlsx`,
          'news-release-table7-202510.xlsx',
        ),
      )).rejects.toThrow(/explicit gap/)
  })

  it('accepts the reconciliation boundary and rejects a larger mismatch', async () => {
    const atBoundary = await workbook({ rows: [
      ['All items', 100, 3.581, ''],
      ['Food', 13, 3, 0.410], ['Energy', 7, 14, 1.051],
      ['Shelter', 35, 3, 1.159],
      ['Commodities less food and energy commodities', 18, 1, 0.158],
      ['Services less energy services', 27, 4, 1.912],
    ] })
    const outside = await workbook({ rows: [
      ['All items', 100, 3.582, ''],
      ['Food', 13, 3, 0.410], ['Energy', 7, 14, 1.051],
      ['Shelter', 35, 3, 1.159],
      ['Commodities less food and energy commodities', 18, 1, 0.158],
      ['Services less energy services', 27, 4, 1.912],
    ] })
    expect((await parseInflationContributionWorkbook(atBoundary, metadata()))
      .reconciliationResidual).toBeCloseTo(0.05, 12)
    await expect(parseInflationContributionWorkbook(outside, metadata()))
      .rejects.toThrow(/exceeds/)
  })

  it.each([
    ['nonofficial URL', metadata(
      '2026-06-01', '2026-07-14', 'https://example.com/table7.xlsx',
    )],
    ['wrong annual archive', metadata(
      '2026-06-01',
      '2026-07-14',
      `${BLS_SUPPLEMENTAL_FILES_URL}archive-2025.zip`,
    )],
    ['filename-period mismatch', metadata(
      '2026-06-01',
      '2026-07-14',
      `${BLS_SUPPLEMENTAL_FILES_URL}news-release-table7-202606.xlsx`,
      'news-release-table7-202605.xlsx',
    )],
    ['invalid release date', metadata('2026-06-01', '2026-06-01')],
  ])('rejects invalid provenance: %s', async (_name, invalidMetadata) => {
    await expect(
      parseInflationContributionWorkbook(await workbook(), invalidMetadata),
    ).rejects.toThrow()
  })

  it('selects only the twelve Table 7 workbooks from an annual ZIP', () => {
    const files: Record<string, Uint8Array> = { 'readme.txt': new Uint8Array([1]) }
    for (let month = 1; month <= 12; month += 1) {
      const name = `folder/news-release-table7-2024${String(month).padStart(2, '0')}.xlsx`
      files[name] = new Uint8Array([month])
      files[`folder/news-release-table6-2024${String(month).padStart(2, '0')}.xlsx`] =
        new Uint8Array([month])
    }
    const selected = table7WorkbooksFromArchive(zipSync(files), 2024)
    expect(selected).toHaveLength(12)
    expect(selected.has('news-release-table7-202406.xlsx')).toBe(true)
  })

  it('rejects an incomplete or invalid annual ZIP', async () => {
    const singleWorkbook = await workbook()
    expect(() => table7WorkbooksFromArchive(zipSync({
      'news-release-table7-202406.xlsx': singleWorkbook,
    }), 2024)).toThrow(/Expected 12/)
    expect(() =>
      table7WorkbooksFromArchive(new Uint8Array([1, 2, 3]), 2024),
    ).toThrow(/Could not read/)
  })

  it('preserves prior output after retrieval or validation failure', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'bls-table7-'))
    temporaryDirectories.push(directory)
    const output = path.join(directory, 'staging.json')
    const invalidInput = path.join(directory, 'news-release-table7-202606.xlsx')
    await writeFile(output, 'prior valid output\n')
    await writeFile(invalidInput, new Uint8Array([1, 2, 3]))
    const arguments_ = [
      '--period', '2026-06-01',
      '--release-date', '2026-07-14',
      '--source-url',
      `${BLS_SUPPLEMENTAL_FILES_URL}news-release-table7-202606.xlsx`,
      '--output', output,
    ]
    await expect(ingestInflationContributionRelease([
      '--file', path.join(directory, 'missing.xlsx'), ...arguments_,
    ])).rejects.toThrow()
    expect(await readFile(output, 'utf8')).toBe('prior valid output\n')
    await expect(ingestInflationContributionRelease([
      '--file', invalidInput, ...arguments_,
    ])).rejects.toThrow()
    expect(await readFile(output, 'utf8')).toBe('prior valid output\n')
  })
})
