import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { afterEach, describe, expect, it } from 'vitest'
import {
  buildInflationContributionSnapshot,
  compareReleasePeriods,
  discoverTable7Releases,
  downloadTable7Workbook,
  refreshInflationContributions,
} from './inflationContributionAutomation'
import type {
  InflationContributionHistory,
  InflationContributionRelease,
} from './inflationContributionRelease'

const temporaryDirectories: string[] = []
afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

const indexUrl =
  'https://www.bls.gov/cpi/tables/supplemental-files/home.htm'

function page(...links: Array<{ label: string; href: string }>): string {
  return `<html><body>${links.map(({ label, href }) =>
    `<a class="file" href="${href}"><span>${label}</span></a>`).join('')}</body></html>`
}

function releaseLink(month: string, year: number) {
  const number = new Date(`${month} 1, ${year} UTC`).getUTCMonth() + 1
  return {
    label: `News Release Table 7, ${month} ${year} (XLSX)`,
    href: `news-release-table7-${year}${String(number).padStart(2, '0')}.xlsx`,
  }
}

async function workbook(month = 'July', year = 2026): Promise<Uint8Array> {
  const result = new ExcelJS.Workbook()
  const sheet = result.addWorksheet('Table 7')
  sheet.addRows([
    [`Table 7. Consumer Price Index for All Urban Consumers (CPI-U): U.S. city average, by expenditure category, ${month} ${year}, 12-month analysis table`],
    [
      'Expenditure category',
      'Relative importance',
      `Unadjusted percent change ${month} ${year - 1}-${month} ${year}`,
      `Unadjusted effect on All Items ${month} ${year - 1}-${month} ${year}`,
    ],
    ['All items', 100, 3.4, ''],
    ['Food', 13, 3, 0.41],
    ['Energy', 7, 14, 0.95],
    ['Shelter', 35, 3, 1.15],
    ['Commodities less food and energy commodities', 18, 1, 0.16],
    ['Services less energy services', 27, 4, 1.89],
  ])
  return new Uint8Array(await result.xlsx.writeBuffer())
}

function history(): InflationContributionHistory {
  const releases = [
    {
      period: '2025-07-01', sourceReleaseDate: '2025-08-12',
      sourceUrl: 'https://www.bls.gov/cpi/tables/supplemental-files/news-release-table7-202507.xlsx',
      sourceFile: 'news-release-table7-202507.xlsx',
    },
    {
      period: '2026-06-01', sourceReleaseDate: '2026-07-14',
      sourceUrl: 'https://www.bls.gov/cpi/tables/supplemental-files/news-release-table7-202606.xlsx',
      sourceFile: 'news-release-table7-202606.xlsx',
    },
  ].map((metadata): InflationContributionRelease => ({
    ...metadata, headlineCpiEffectTotal: 3.5, food: 0.41, energy: 1.05,
    shelter: 1.16, commoditiesLessFoodAndEnergy: 0.16,
    servicesLessEnergyServices: 1.91, otherServices: 0.75,
    vintage: 'release', reconciliationResidual: -0.03,
    reconciliationStatus: 'reconciled',
  }))
  return {
    title: 'History', sourceName: 'BLS', sourceIndexUrl: indexUrl,
    units: 'Percentage-point effect on all-items CPI', methodology: 'fixture',
    vintage: 'release', observations: releases,
  }
}

function response(
  body: string | Uint8Array,
  url: string,
  init: ResponseInit = {},
): Response {
  const responseBody = typeof body === 'string'
    ? body
    : Buffer.from(body) as unknown as BodyInit
  const result = new Response(responseBody, init)
  Object.defineProperty(result, 'url', { value: url })
  return result
}

describe('BLS Table 7 release discovery', () => {
  it('finds the latest release regardless of link order and ignores unrelated files', () => {
    const releases = discoverTable7Releases(page(
      releaseLink('July', 2026),
      { label: 'News Release Table 6, August 2026 (XLSX)', href: 'table6.xlsx' },
      releaseLink('June', 2026),
      releaseLink('August', 2026),
    ))
    expect(releases.map(({ period }) => period)).toEqual([
      '2026-06-01', '2026-07-01', '2026-08-01',
    ])
  })

  it('deduplicates identical semantic links and rejects ambiguity', () => {
    expect(discoverTable7Releases(page(
      releaseLink('July', 2026), releaseLink('July', 2026),
    ))).toHaveLength(1)
    expect(() => discoverTable7Releases(page({
      ...releaseLink('July', 2026),
      href: 'news-release-table7-202606.xlsx',
    }))).toThrow(/unexpected workbook name/)
  })

  it('rejects malformed pages and unofficial workbook hosts', () => {
    expect(() => discoverTable7Releases('<html>No releases</html>'))
      .toThrow(/Unable to determine/)
    expect(() => discoverTable7Releases(page({
      ...releaseLink('July', 2026), href: 'https://example.com/news-release-table7-202607.xlsx',
    }))).toThrow(/www\.bls\.gov/)
  })

  it.each([
    ['2026-07-01', '2026-07-01', 'current'],
    ['2026-06-01', '2026-07-01', 'new'],
    ['2026-07-01', '2026-06-01', 'stale'],
  ] as const)('compares %s with %s as %s', (committed, discovered, expected) => {
    expect(compareReleasePeriods(committed, discovered)).toBe(expected)
  })
})

describe('BLS Table 7 download safety', () => {
  const release = {
    period: '2026-07-01', sourceFile: 'news-release-table7-202607.xlsx',
    url: 'https://www.bls.gov/cpi/tables/supplemental-files/news-release-table7-202607.xlsx',
    label: 'News Release Table 7, July 2026 (XLSX)',
  }

  it('accepts a nonempty official XLSX and captures its release date', async () => {
    const result = await downloadTable7Workbook(release, async () => response(
      new Uint8Array([0x50, 0x4b, 3, 4]), release.url,
      { headers: { 'last-modified': 'Wed, 12 Aug 2026 12:30:00 GMT' } },
    ))
    expect(result.sourceReleaseDate).toBe('2026-08-12')
  })

  it.each([
    ['HTTP error', async () => response('', release.url, { status: 503 })],
    ['empty/non-XLSX', async () => response('<html>Error</html>', release.url,
      { headers: { 'last-modified': 'Wed, 12 Aug 2026 12:30:00 GMT' } })],
    ['unofficial redirect', async () => response('PKxx', 'https://example.com/file.xlsx',
      { headers: { 'last-modified': 'Wed, 12 Aug 2026 12:30:00 GMT' } })],
  ])('rejects %s', async (_name, fetchImplementation) => {
    await expect(downloadTable7Workbook(release, fetchImplementation))
      .rejects.toThrow()
  })
})

describe('automated inflation-contribution persistence', () => {
  async function paths() {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'table7-auto-'))
    temporaryDirectories.push(directory)
    const historyPath = path.join(directory, 'history.json')
    const snapshotPath = path.join(directory, 'snapshot.json')
    await writeFile(historyPath, `${JSON.stringify(history())}\n`)
    await writeFile(snapshotPath, '{"unchanged":true}\n')
    return { historyPath, snapshotPath }
  }

  it('does not rewrite files when the discovered release is current', async () => {
    const files = await paths()
    const before = await readFile(files.historyPath, 'utf8')
    const currentPage = page(releaseLink('June', 2026))
    await expect(refreshInflationContributions({ ...files,
      fetchImplementation: async () => response(currentPage, indexUrl),
    })).resolves.toBe('current')
    expect(await readFile(files.historyPath, 'utf8')).toBe(before)
  })

  it('appends exactly one validated release and derives the card snapshot', async () => {
    const files = await paths()
    const bytes = await workbook()
    const workbookUrl = 'https://www.bls.gov/cpi/tables/supplemental-files/news-release-table7-202607.xlsx'
    const fetchImplementation = async (input: string | URL | Request) =>
      String(input).endsWith('home.htm')
        ? response(page(releaseLink('July', 2026)), indexUrl)
        : response(bytes, workbookUrl, {
          headers: { 'last-modified': 'Wed, 12 Aug 2026 12:30:00 GMT' },
        })
    await expect(refreshInflationContributions({ ...files, fetchImplementation }))
      .resolves.toBe('updated')
    const updated = JSON.parse(await readFile(files.historyPath, 'utf8')) as InflationContributionHistory
    expect(updated.observations).toHaveLength(history().observations.length + 1)
    expect(updated.observations.at(-1)).toMatchObject({ period: '2026-07-01', food: 0.41 })
    const snapshot = JSON.parse(await readFile(files.snapshotPath, 'utf8')) as { observations: Array<{ date: string }> }
    expect(snapshot.observations.map(({ date }) => date)).toEqual(['2025-07-01', '2026-07-01'])
  })

  it('preserves both files when a known new release fails validation', async () => {
    const files = await paths()
    const beforeHistory = await readFile(files.historyPath, 'utf8')
    const beforeSnapshot = await readFile(files.snapshotPath, 'utf8')
    const fetchImplementation = async (input: string | URL | Request) =>
      String(input).endsWith('home.htm')
        ? response(page(releaseLink('July', 2026)), indexUrl)
        : response(new Uint8Array([0x50, 0x4b, 3, 4]),
          'https://www.bls.gov/cpi/tables/supplemental-files/news-release-table7-202607.xlsx',
          { headers: { 'last-modified': 'Wed, 12 Aug 2026 12:30:00 GMT' } })
    await expect(refreshInflationContributions({ ...files, fetchImplementation }))
      .rejects.toThrow(/Existing data preserved/)
    expect(await readFile(files.historyPath, 'utf8')).toBe(beforeHistory)
    expect(await readFile(files.snapshotPath, 'utf8')).toBe(beforeSnapshot)
  })

  it('rejects a multiple-period gap without downloading', async () => {
    const files = await paths()
    let calls = 0
    await expect(refreshInflationContributions({ ...files,
      fetchImplementation: async () => {
        calls += 1
        return response(page(releaseLink('August', 2026)), indexUrl)
      },
    })).rejects.toThrow(/multiple-period gap/)
    expect(calls).toBe(1)
  })

  it('builds a future snapshot without a hard-coded latest month', () => {
    const fixture = history()
    const latest = { ...(fixture.observations.at(-1) as InflationContributionRelease),
      period: '2026-07-01', sourceFile: 'news-release-table7-202607.xlsx' }
    fixture.observations.push(latest)
    expect(buildInflationContributionSnapshot(fixture, latest).observations.at(-1)?.date)
      .toBe('2026-07-01')
  })
})
