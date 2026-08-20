import { readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  completeSourceReview,
  type ManualSourceReviewState,
} from '../src/features/data-freshness/manualSourceReminders'
import type { FreshnessContractId } from '../src/features/data-freshness/freshnessTypes'

interface ReviewFile { schemaVersion: 1; sources: ManualSourceReviewState[] }

function argument(name: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  if (!value) throw new Error(`--${name} is required`)
  return value
}

const path = resolve('config/manual-source-reviews.json')
const current = JSON.parse(await readFile(path, 'utf8')) as ReviewFile
if (current.schemaVersion !== 1 || !Array.isArray(current.sources)) {
  throw new Error('Manual source review state is malformed')
}
const updated: ReviewFile = {
  schemaVersion: 1,
  sources: completeSourceReview(
    current.sources,
    argument('source') as FreshnessContractId,
    argument('reviewed-at'),
    argument('observed-version'),
  ),
}
const temporaryPath = `${path}.tmp`
await writeFile(temporaryPath, `${JSON.stringify(updated, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
await rename(temporaryPath, path)
process.stdout.write(`Recorded official-source review for ${argument('source')}.\n`)
