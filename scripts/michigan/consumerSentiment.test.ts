import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import { buildConsumerSentimentSeries, consumerSentimentCurrentUrl, refreshConsumerSentiment } from './consumerSentiment'

const temporary: string[] = []
afterEach(async () => { await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))) })
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const history = 'Month,YYYY,ICS_ALL\n' + Array.from({ length: 600 }, (_, index) =>
  `${months[index % 12]},${1978 + Math.floor(index / 12)},${70 + index % 10}`).join('\n')
function current(month = 'January (P)', value = '62.3'): string {
  return `,,,THE INDEX OF CONSUMER SENTIMENT\nDATE OF SURVEY,,,,INDEX OF CONSUMER SENTIMENT\nDecember,2027,,,79\n${month},2028,,,${value}\n,,,,\n`
}
describe('official Michigan sentiment ingestion', () => {
  it('combines full monthly history with the newest labeled preliminary release and source attribution', () => {
    const series = buildConsumerSentimentSeries(history, current(), '2028-02-03')
    expect(series.observations).toHaveLength(601)
    expect(series.observations.at(-1)).toEqual({ date: '2028-01-01', value: 62.3 })
    expect(series.publicationStatus).toBe('preliminary')
    expect(series.provider).toBe('University of Michigan')
    expect(series.sources?.at(-1)?.sourceUrl).toBe(consumerSentimentCurrentUrl)
  })
  it('replaces preliminary with final, accepts a new month, and prefers final history over a stale preliminary', () => {
    const final = buildConsumerSentimentSeries(history, current('January', '63.5'), '2028-02-03')
    expect(final.publicationStatus).toBe('final')
    expect(final.observations.at(-1)?.value).toBe(63.5)
    const finalHistory = history + '\nJanuary,2028,63.5'
    expect(buildConsumerSentimentSeries(finalHistory, current(), '2028-02-03').observations.at(-1)?.value).toBe(63.5)
    const next = buildConsumerSentimentSeries(finalHistory, current('February (P)', '60'), '2028-02-03')
    expect(next.observations.at(-1)).toEqual({ date: '2028-02-01', value: 60 })
    expect(next.publicationStatus).toBe('preliminary')
  })
  it.each([
    ['wrong header', 'Month,Year,Value\nJanuary,1978,70', current()],
    ['invalid number', history, current('January (P)', 'oops')],
    ['duplicate month', history + '\nDecember,2027,79', current()],
    ['wrong current table', history, current().replace('THE INDEX OF CONSUMER SENTIMENT', 'OTHER INDEX')],
    ['missing month', history.replace('January,1979,72\n', ''), current()],
    ['missing coverage', 'Month,YYYY,ICS_ALL\nJanuary,1978,70', current()],
  ])('rejects %s before publishing', (_description, historyCsv, currentCsv) => {
    expect(() => buildConsumerSentimentSeries(historyCsv, currentCsv, '2028-02-03')).toThrow()
  })
  it('preserves last-good bytes on retrieval, parsing, or release-regression failure and writes revised/new releases atomically', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'sentiment-'))
    temporary.push(directory)
    const outputPath = path.join(directory, 'data.json')
    const previous = buildConsumerSentimentSeries(history, current(), '2028-02-03')
    const saved = JSON.stringify(previous)
    await writeFile(outputPath, saved)
    for (const response of [new Response('', { status: 403 }), new Response('<html>blocked</html>')]) {
      await expect(refreshConsumerSentiment({ outputPath, retrievedAt: '2028-02-03', fetchImplementation: async () => response.clone() })).rejects.toThrow()
      expect(await readFile(outputPath, 'utf8')).toBe(saved)
    }
    await expect(refreshConsumerSentiment({ outputPath, retrievedAt: '2028-02-03', fetchImplementation: async (input) =>
      new Response(String(input) === consumerSentimentCurrentUrl ? current('January', '63.5') : history),
    })).resolves.toBeUndefined()
    const finalBytes = await readFile(outputPath, 'utf8')
    expect(validateEconomicSeries(JSON.parse(finalBytes)).publicationStatus).toBe('final')
    await expect(refreshConsumerSentiment({ outputPath, retrievedAt: '2028-02-03', fetchImplementation: async (input) =>
      new Response(String(input) === consumerSentimentCurrentUrl ? current() : history),
    })).rejects.toThrow(/regress/)
    expect(await readFile(outputPath, 'utf8')).toBe(finalBytes)
    await refreshConsumerSentiment({ outputPath, retrievedAt: '2028-02-03', fetchImplementation: async (input) =>
      new Response(String(input) === consumerSentimentCurrentUrl ? current('February (P)', '60') : history + '\nJanuary,2028,63.5'),
    })
    expect(JSON.parse(await readFile(outputPath, 'utf8')).observations.at(-1)).toEqual({ date: '2028-02-01', value: 60 })
  })
  it('validates optional publication status without changing older series', () => {
    const series = buildConsumerSentimentSeries(history, current(), '2028-02-03')
    expect(() => validateEconomicSeries({ ...series, publicationStatus: 'unknown' })).toThrow(/publication status/)
    expect(validateEconomicSeries({ ...series, publicationStatus: undefined }).publicationStatus).toBeUndefined()
  })
})
