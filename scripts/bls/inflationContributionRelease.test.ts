import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ingestInflationContributionRelease } from './ingestInflationContributionRelease'
import {
  parseInflationContributionRelease,
  validateInflationContributionCollection,
} from './inflationContributionRelease'

const fixtureDirectory = path.resolve('scripts/bls/fixtures')
const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

async function fixture(name: string): Promise<string> {
  return readFile(path.join(fixtureDirectory, name), 'utf8')
}

function metadata(
  period = '2026-06-01',
  releaseDate = '2026-07-14',
  sourceUrl = 'https://www.bls.gov/news.release/archives/cpi_07142026.htm',
) {
  return {
    period,
    sourceReleaseDate: releaseDate,
    sourceUrl,
    sourceFile: 'cpi-release.html',
  }
}

describe('BLS Table 7 inflation-contribution ingestion', () => {
  it.each([
    {
      file: 'cpi-table7-2023-06.html',
      period: '2023-06-01',
      releaseDate: '2023-07-12',
      url: 'https://www.bls.gov/news.release/archives/cpi_07122023.htm',
      energy: -1.556,
      otherServices: 0.919,
      residual: 0.031,
    },
    {
      file: 'cpi-table7-2025-09.html',
      period: '2025-09-01',
      releaseDate: '2025-10-24',
      url: 'https://www.bls.gov/news.release/archives/cpi_10242025.htm',
      energy: 0.176,
      otherServices: 0.827,
      residual: -0.013,
    },
    {
      file: 'cpi-table7-2025-11.html',
      period: '2025-11-01',
      releaseDate: '2025-12-18',
      url: 'https://www.bls.gov/news.release/archives/cpi_12182025.htm',
      energy: 0.264,
      otherServices: 0.755,
      residual: -0.036,
    },
    {
      file: 'cpi-table7-2026-06.html',
      period: '2026-06-01',
      releaseDate: '2026-07-14',
      url: 'https://www.bls.gov/news.release/archives/cpi_07142026.htm',
      energy: 1.051,
      otherServices: 0.753,
      residual: -0.031,
    },
  ])('parses and reconciles $period with release provenance', async ({
    file,
    period,
    releaseDate,
    url,
    energy,
    otherServices,
    residual,
  }) => {
    const release = parseInflationContributionRelease(
      await fixture(file),
      metadata(period, releaseDate, url),
    )

    expect(release).toMatchObject({
      period,
      energy,
      sourceReleaseDate: releaseDate,
      sourceUrl: url,
      vintage: 'release',
      reconciliationStatus: 'reconciled',
    })
    expect(release.otherServices).toBeCloseTo(otherServices, 12)
    expect(release.reconciliationResidual).toBeCloseTo(residual, 12)
  })

  it('selects the effect column rather than the nearby inflation-rate column', async () => {
    const release = parseInflationContributionRelease(
      await fixture('cpi-table7-2026-06.html'),
      metadata(),
    )

    expect(release.food).toBe(0.410)
    expect(release.food).not.toBe(3.0)
  })

  it.each([
    ['missing category', (html: string) =>
      html.replace(/<tr><td>Food<\/td>.*?<\/tr>/, '')],
    ['duplicate category', (html: string) =>
      html.replace('</tbody>', '<tr><td>Food</td><td>1</td><td>2</td><td>0.410</td></tr></tbody>')],
    ['malformed effect', (html: string) =>
      html.replace('<td>0.410</td>', '<td>not available</td>')],
    ['unexpected heading', (html: string) =>
      html.replace('Table 7.', 'Table 6.')],
    ['changed column order', (html: string) =>
      html.replace(
        '<th>Unadjusted percent change</th><th>Unadjusted effect on All Items</th>',
        '<th>Unadjusted effect on All Items</th><th>Unadjusted percent change</th>',
      )],
  ])('rejects %s', async (_name, change) => {
    const html = change(await fixture('cpi-table7-2026-06.html'))
    expect(() => parseInflationContributionRelease(html, metadata())).toThrow()
  })

  it('rejects an unavailable source marker', () => {
    expect(() =>
      parseInflationContributionRelease(
        '<p>Table 7 not published because of the appropriations lapse.</p>',
        metadata(),
      )).toThrow(/unavailable|Table 7/i)
  })

  it('rejects a source-period mismatch', async () => {
    const html = await fixture('cpi-table7-2026-06.html')
    expect(() =>
      parseInflationContributionRelease(
        html,
        metadata('2026-05-01'),
      )).toThrow(/conflicts/)
  })

  it('rejects duplicate months and protects the October 2025 gap', async () => {
    const june = parseInflationContributionRelease(
      await fixture('cpi-table7-2026-06.html'),
      metadata(),
    )
    const novemberHtml = await fixture('cpi-table7-2025-11.html')
    expect(() => validateInflationContributionCollection([june, june]))
      .toThrow(/Duplicate/)

    expect(() =>
      parseInflationContributionRelease(
        novemberHtml.replace(
          'November 2025',
          'October 2025',
        ),
        metadata(
          '2025-10-01',
          '2025-12-18',
          'https://www.bls.gov/news.release/archives/cpi_12182025.htm',
        ),
      )).toThrow(/must remain missing/)
  })

  it('rejects unsorted releases', async () => {
    const june2023 = parseInflationContributionRelease(
      await fixture('cpi-table7-2023-06.html'),
      metadata(
        '2023-06-01',
        '2023-07-12',
        'https://www.bls.gov/news.release/archives/cpi_07122023.htm',
      ),
    )
    const june2026 = parseInflationContributionRelease(
      await fixture('cpi-table7-2026-06.html'),
      metadata(),
    )

    expect(() =>
      validateInflationContributionCollection([june2026, june2023]))
      .toThrow(/sorted/)
  })

  it('accepts the exact reconciliation boundary and rejects a larger mismatch', async () => {
    const html = await fixture('cpi-table7-2026-06.html')
    const exactBoundary = html.replace('<td>3.5</td>', '<td>3.581</td>')
    const outsideBoundary = html.replace('<td>3.5</td>', '<td>3.582</td>')

    expect(parseInflationContributionRelease(exactBoundary, metadata())
      .reconciliationResidual).toBeCloseTo(0.05, 12)
    expect(() => parseInflationContributionRelease(outsideBoundary, metadata()))
      .toThrow(/exceeds/)
  })

  it.each([
    ['nonofficial URL', metadata(
      '2026-06-01',
      '2026-07-14',
      'https://example.com/cpi_07142026.htm',
    )],
    ['URL-date mismatch', metadata('2026-06-01', '2026-07-13')],
    ['missing source file', { ...metadata(), sourceFile: '' }],
  ])('rejects invalid provenance: %s', async (_name, invalidMetadata) => {
    const html = await fixture('cpi-table7-2026-06.html')
    expect(() =>
      parseInflationContributionRelease(
        html,
        invalidMetadata,
      )).toThrow()
  })

  it('preserves prior output after retrieval or validation failure', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'bls-table7-'))
    temporaryDirectories.push(directory)
    const output = path.join(directory, 'staging.json')
    const invalidInput = path.join(directory, 'invalid.html')
    await writeFile(output, 'prior valid output\n')
    await writeFile(invalidInput, '<table>not Table 7</table>')

    await expect(ingestInflationContributionRelease([
      '--file', path.join(directory, 'missing.html'),
      '--period', '2026-06-01',
      '--release-date', '2026-07-14',
      '--source-url', 'https://www.bls.gov/news.release/archives/cpi_07142026.htm',
      '--output', output,
    ])).rejects.toThrow()
    expect(await readFile(output, 'utf8')).toBe('prior valid output\n')

    await expect(ingestInflationContributionRelease([
      '--file', invalidInput,
      '--period', '2026-06-01',
      '--release-date', '2026-07-14',
      '--source-url', 'https://www.bls.gov/news.release/archives/cpi_07142026.htm',
      '--output', output,
    ])).rejects.toThrow()
    expect(await readFile(output, 'utf8')).toBe('prior valid output\n')
  })
})
