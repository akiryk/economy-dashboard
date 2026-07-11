import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { EconomicSeries } from '../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../src/features/economic-series/models/validateEconomicSeries'

export async function writeEconomicSeriesAtomically(
  outputPath: string,
  series: EconomicSeries,
): Promise<void> {
  const validatedSeries = validateEconomicSeries(series)
  const serialized = `${JSON.stringify(validatedSeries, null, 2)}\n`
  JSON.parse(serialized)

  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${process.pid}.${Date.now()}.tmp`,
  )

  try {
    await writeFile(temporaryPath, serialized, { encoding: 'utf8', flag: 'wx' })
    await rename(temporaryPath, outputPath)
  } catch (error: unknown) {
    await unlink(temporaryPath).catch((cleanupError: unknown) => {
      if (
        !(cleanupError instanceof Error) ||
        !('code' in cleanupError) ||
        cleanupError.code !== 'ENOENT'
      ) {
        console.error('Could not remove temporary data file', cleanupError)
      }
    })
    throw error
  }
}
