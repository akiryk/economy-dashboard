import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const dataDirectory = path.resolve(
  'src/features/economic-series/data',
)
const outputDirectory = path.resolve('dist')

async function latestDatasetDate() {
  const files = (await readdir(dataDirectory))
    .filter((file) => file.endsWith('.json'))
  const dates = await Promise.all(files.map(async (file) => {
    const contents = await readFile(path.join(dataDirectory, file), 'utf8')
    const metadata = JSON.parse(contents)
    return typeof metadata.retrievedAt === 'string'
      ? metadata.retrievedAt
      : null
  }))
  const validDates = dates.filter((date) => date !== null).sort()
  const latest = validDates.at(-1)
  if (!latest) throw new Error('No dataset retrieval date is available.')
  return latest
}

await copyFile(
  path.join(outputDirectory, 'index.html'),
  path.join(outputDirectory, '404.html'),
)
const metadata = {
  deploymentCommit: process.env.DEPLOYMENT_COMMIT ?? 'local-build',
  latestDatasetDate: await latestDatasetDate(),
}
await writeFile(
  path.join(outputDirectory, 'deployment-metadata.json'),
  `${JSON.stringify(metadata, null, 2)}\n`,
  'utf8',
)
