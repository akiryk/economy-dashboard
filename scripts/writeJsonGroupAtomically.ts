import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface JsonWrite {
  outputPath: string
  value: unknown
}

interface PreparedWrite extends JsonWrite {
  serialized: string
  temporaryPath: string
  backupPath: string
  hadExistingTarget: boolean
  replacedTarget: boolean
}

async function removeIfPresent(filePath: string): Promise<void> {
  await unlink(filePath).catch((error: unknown) => {
    if (!(error instanceof Error) || !('code' in error) ||
        error.code !== 'ENOENT') {
      throw error
    }
  })
}

export async function writeJsonGroupAtomically(
  writes: readonly JsonWrite[],
): Promise<void> {
  const timestamp = Date.now()
  const prepared: PreparedWrite[] = writes.map((write, index) => {
    const serialized = `${JSON.stringify(write.value, null, 2)}\n`
    JSON.parse(serialized)
    return {
      ...write,
      serialized,
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
    }
  })

  try {
    for (const write of prepared) {
      await writeFile(write.temporaryPath, write.serialized, {
        encoding: 'utf8',
        flag: 'wx',
      })
    }
    for (const write of prepared) {
      try {
        await rename(write.outputPath, write.backupPath)
        write.hadExistingTarget = true
      } catch (error: unknown) {
        if (!(error instanceof Error) || !('code' in error) ||
            error.code !== 'ENOENT') {
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
      .filter(({ hadExistingTarget }) => hadExistingTarget)
      .map(({ backupPath }) => removeIfPresent(backupPath)),
  )
}
