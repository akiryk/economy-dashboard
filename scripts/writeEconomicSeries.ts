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

interface EconomicSeriesWrite {
  outputPath: string
  series: EconomicSeries
}

interface PreparedWrite extends EconomicSeriesWrite {
  temporaryPath: string
  backupPath: string
  hadExistingTarget: boolean
  replacedTarget: boolean
}

function serializeSeries(series: EconomicSeries): string {
  const validatedSeries = validateEconomicSeries(series)
  const serialized = `${JSON.stringify(validatedSeries, null, 2)}\n`
  JSON.parse(serialized)
  return serialized
}

async function removeIfPresent(filePath: string): Promise<void> {
  await unlink(filePath).catch((error: unknown) => {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'ENOENT'
    ) {
      throw error
    }
  })
}

export async function writeEconomicSeriesGroupAtomically(
  writes: readonly EconomicSeriesWrite[],
): Promise<void> {
  const timestamp = Date.now()
  const prepared: PreparedWrite[] = writes.map((write, index) => ({
    ...write,
    temporaryPath: path.join(
      path.dirname(write.outputPath),
      `.${path.basename(write.outputPath)}.${process.pid}.${timestamp}.${index}.tmp`,
    ),
    backupPath: path.join(
      path.dirname(write.outputPath),
      `.${path.basename(write.outputPath)}.${process.pid}.${timestamp}.${index}.bak`,
    ),
    hadExistingTarget: false,
    replacedTarget: false,
  }))

  const serialized = prepared.map((write) => serializeSeries(write.series))

  try {
    for (const [index, write] of prepared.entries()) {
      await writeFile(write.temporaryPath, serialized[index]!, {
          encoding: 'utf8',
          flag: 'wx',
      })
    }

    for (const write of prepared) {
      try {
        await rename(write.outputPath, write.backupPath)
        write.hadExistingTarget = true
      } catch (error: unknown) {
        if (
          !(error instanceof Error) ||
          !('code' in error) ||
          error.code !== 'ENOENT'
        ) {
          throw error
        }
      }
      await rename(write.temporaryPath, write.outputPath)
      write.replacedTarget = true
    }

  } catch (error: unknown) {
    for (const write of [...prepared].reverse()) {
      if (write.replacedTarget) await removeIfPresent(write.outputPath)
      if (write.hadExistingTarget) {
        await rename(write.backupPath, write.outputPath)
      }
      await removeIfPresent(write.temporaryPath)
    }
    throw error
  }

  await Promise.all(
    prepared
      .filter((write) => write.hadExistingTarget)
      .map((write) =>
        removeIfPresent(write.backupPath).catch((error: unknown) => {
          console.error('Could not remove payroll data backup', error)
        }),
      ),
  )
}
