import { inflateRawSync } from 'node:zlib'
import type { EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'

export const HOAM_WORKBOOK_URL =
  'https://www.atlantafed.org/-/media/Project/Atlanta/FRBA/Documents/research/housing-and-policy/hoam/HOAM_US_Affordability_Index.xlsx'

export interface HoamConfiguration {
  dataHandling: 'hoam-provider'
  outputFile: string
  minimumUsableObservations: number
}

export const hoamConfiguration: HoamConfiguration = {
  dataHandling: 'hoam-provider',
  outputFile: 'src/features/economic-series/data/home-ownership-cost-share.json',
  minimumUsableObservations: 60,
}

function unzipEntry(archive: Buffer, targetName: string): Buffer {
  let endOffset = -1
  for (let offset = archive.length - 22; offset >= 0; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset
      break
    }
  }
  if (endOffset < 0) throw new Error('HOAM workbook is not a valid ZIP archive')

  const entryCount = archive.readUInt16LE(endOffset + 10)
  let offset = archive.readUInt32LE(endOffset + 16)
  for (let index = 0; index < entryCount; index += 1) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('HOAM workbook central directory is malformed')
    }
    const method = archive.readUInt16LE(offset + 10)
    const compressedSize = archive.readUInt32LE(offset + 20)
    const fileNameLength = archive.readUInt16LE(offset + 28)
    const extraLength = archive.readUInt16LE(offset + 30)
    const commentLength = archive.readUInt16LE(offset + 32)
    const localOffset = archive.readUInt32LE(offset + 42)
    const name = archive.subarray(offset + 46, offset + 46 + fileNameLength).toString()
    if (name === targetName) {
      if (archive.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new Error(`HOAM workbook entry ${targetName} is malformed`)
      }
      const localNameLength = archive.readUInt16LE(localOffset + 26)
      const localExtraLength = archive.readUInt16LE(localOffset + 28)
      const start = localOffset + 30 + localNameLength + localExtraLength
      const compressed = archive.subarray(start, start + compressedSize)
      if (method === 0) return compressed
      if (method === 8) return inflateRawSync(compressed)
      throw new Error(`HOAM workbook uses unsupported ZIP method ${method}`)
    }
    offset += 46 + fileNameLength + extraLength + commentLength
  }
  throw new Error(`HOAM workbook is missing ${targetName}`)
}

function decodeXml(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

function sharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml(
      [...match[1]!.matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)]
        .map((text) => text[1])
        .join(''),
    ),
  )
}

function rowCells(rowXml: string, strings: readonly string[]): Map<string, string> {
  const cells = new Map<string, string>()
  for (const match of rowXml.matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
    const raw = /<v>([\s\S]*?)<\/v>/.exec(match[3]!)?.[1]
    if (raw === undefined) continue
    cells.set(match[1]!, match[2]!.includes('t="s"') ? strings[Number(raw)]! : raw)
  }
  return cells
}

export function parseHoamWorkbook(
  workbook: ArrayBuffer,
  retrievedAt: string,
  config: HoamConfiguration = hoamConfiguration,
): EconomicSeries {
  const archive = Buffer.from(workbook)
  const strings = sharedStrings(unzipEntry(archive, 'xl/sharedStrings.xml').toString())
  const sheet = unzipEntry(archive, 'xl/worksheets/sheet1.xml').toString()
  const rows = [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)]
  const header = rowCells(rows[0]?.[1] ?? '', strings)
  if (header.get('A') !== 'Month' || header.get('D') !== 'Annual Payment Share of Income') {
    throw new Error('HOAM workbook schema has changed')
  }

  const observations = rows.slice(1).map((row, index) => {
    const cells = rowCells(row[1]!, strings)
    const month = cells.get('A')
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error(`HOAM row ${index + 2} has an invalid month`)
    }
    const rawValue = cells.get('D')
    if (rawValue !== undefined && !/^-?\d+(?:\.\d+)?(?:E[+-]?\d+)?$/i.test(rawValue)) {
      throw new Error(`HOAM row ${index + 2} has an invalid cost share`)
    }
    return { date: `${month}-01`, value: rawValue === undefined ? null : Number(rawValue) * 100 }
  }).filter((observation) => observation.date <= retrievedAt)
    .sort((a, b) => a.date.localeCompare(b.date))

  for (let index = 1; index < observations.length; index += 1) {
    if (observations[index - 1]!.date === observations[index]!.date) {
      throw new Error(`HOAM workbook contains duplicate month: ${observations[index]!.date}`)
    }
  }
  const usableCount = observations.filter((observation) => observation.value !== null).length
  if (usableCount < config.minimumUsableObservations) {
    throw new Error(`Expected at least ${config.minimumUsableObservations} usable monthly HOAM observations, received ${usableCount}`)
  }

  return validateEconomicSeries({
    id: 'home-ownership-cost-share',
    slug: 'home-ownership-cost-share',
    provider: 'Federal Reserve Bank of Atlanta',
    providerSeriesId: 'HOAM: Annual Payment Share of Income',
    title: 'Home-Ownership Cost Share',
    shortTitle: 'Home-ownership affordability',
    description: 'Modeled annual cost of owning a median-priced home as a percentage of median household income.',
    question: 'How much of a median household’s income would it take to own a typical home?',
    units: 'Percent of median household income',
    frequency: 'monthly',
    seasonalAdjustment: null,
    transformation: 'Official national annual payment share of income, converted from ratio to percent',
    sourceName: 'Federal Reserve Bank of Atlanta Home Ownership Affordability Monitor',
    sourceUrl: 'https://www.atlantafed.org/research-and-data/data/home-ownership-affordability-monitor',
    retrievedAt,
    observations,
  })
}

export async function fetchHoamWorkbook(
  fetchImplementation: typeof fetch = fetch,
): Promise<ArrayBuffer> {
  const response = await fetchImplementation(HOAM_WORKBOOK_URL)
  if (!response.ok) throw new Error(`Atlanta Fed HOAM request failed with HTTP ${response.status}`)
  return response.arrayBuffer()
}
