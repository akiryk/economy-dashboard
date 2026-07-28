import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { refreshJobGrowthBreakevenData } from './refreshJobGrowthBreakevenData'

describe('refreshJobGrowthBreakevenData', () => {
  it('preserves both prior committed files when source validation fails', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'breakeven-refresh-'))
    const breakevenPath = path.join(directory, 'breakeven.json')
    const comparisonPath = path.join(directory, 'comparison.json')
    await writeFile(breakevenPath, 'previous breakeven\n')
    await writeFile(comparisonPath, 'previous comparison\n')
    const fetchImplementation = async (input: string | URL | Request) =>
      new Response(String(input).includes('federalreserve.gov')
        ? '<html>changed page</html>'
        : 'observation_date,PAYEMS\n2026-06-01,100\n')

    await expect(refreshJobGrowthBreakevenData({
      retrievedAt: '2026-07-28',
      breakevenOutputPath: breakevenPath,
      comparisonOutputPath: comparisonPath,
      fetchImplementation: fetchImplementation as typeof fetch,
    })).rejects.toThrow('missing the Figure 2 breakeven table')

    expect(await readFile(breakevenPath, 'utf8')).toBe('previous breakeven\n')
    expect(await readFile(comparisonPath, 'utf8')).toBe('previous comparison\n')
  })
})
