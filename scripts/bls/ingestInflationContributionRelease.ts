import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  parseInflationContributionWorkbook,
  writeJsonAtomically,
} from './inflationContributionRelease'

interface CliArguments {
  file: string
  period: string
  releaseDate: string
  sourceUrl: string
  output?: string
}

function parseArguments(arguments_: readonly string[]): CliArguments {
  const values = new Map<string, string>()
  for (let index = 0; index < arguments_.length; index += 2) {
    const key = arguments_[index]
    const value = arguments_[index + 1]
    if (!key?.startsWith('--') || !value || value.startsWith('--')) {
      throw new Error('Arguments must be supplied as --name value pairs')
    }
    values.set(key.slice(2), value)
  }
  const file = values.get('file')
  const period = values.get('period')
  const releaseDate = values.get('release-date')
  const sourceUrl = values.get('source-url')
  if (!file || !period || !releaseDate || !sourceUrl) {
    throw new Error(
      'Required: --file, --period, --release-date, and --source-url',
    )
  }
  return { file, period, releaseDate, sourceUrl, output: values.get('output') }
}

export async function ingestInflationContributionRelease(
  arguments_: readonly string[],
): Promise<void> {
  const options = parseArguments(arguments_)
  const contents = await readFile(options.file)
  const release = await parseInflationContributionWorkbook(contents, {
    period: options.period,
    sourceReleaseDate: options.releaseDate,
    sourceUrl: options.sourceUrl,
    sourceFile: path.basename(options.file),
  })
  if (options.output) {
    await writeJsonAtomically(options.output, release)
    return
  }
  process.stdout.write(`${JSON.stringify(release, null, 2)}\n`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  ingestInflationContributionRelease(process.argv.slice(2)).catch(
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    },
  )
}
