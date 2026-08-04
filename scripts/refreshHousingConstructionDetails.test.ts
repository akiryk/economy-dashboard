import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { refreshHousingConstructionDetails } from './refreshHousingConstructionDetails'

describe('refreshHousingConstructionDetails', () => {
  it('preserves the prior valid file when any source download fails', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'housing-refresh-'))
    const outputPath = path.join(directory, 'details.json')
    await writeFile(outputPath, 'previous valid housing data\n')

    await expect(refreshHousingConstructionDetails({
      outputPath,
      retrievedAt: '2026-08-04',
      fetchImplementation: async () => new Response('unavailable', { status: 503 }),
    })).rejects.toThrow(/download failed/)
    expect(await readFile(outputPath, 'utf8')).toBe('previous valid housing data\n')
  })
})
