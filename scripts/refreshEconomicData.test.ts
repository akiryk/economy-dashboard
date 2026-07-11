import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { refreshEconomicData } from './refreshEconomicData'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  )
})

describe('refreshEconomicData', () => {
  it('does not overwrite an existing file when normalization fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'economy-data-'))
    temporaryDirectories.push(directory)
    const outputPath = path.join(directory, 'real-gdp-growth.json')
    const original = '{"existing":"dataset"}\n'
    await writeFile(outputPath, original, 'utf8')
    const fetchImplementation = async () =>
      new Response(
        JSON.stringify({
          observations: [{ date: '2025-01-01', value: '2.5' }],
        }),
        { status: 200 },
      )

    await expect(
      refreshEconomicData({
        apiKey: 'test-key',
        outputPath,
        retrievedAt: '2025-01-01',
        fetchImplementation,
      }),
    ).rejects.toThrow('at least 80 usable quarterly observations')

    expect(await readFile(outputPath, 'utf8')).toBe(original)
  })
})
