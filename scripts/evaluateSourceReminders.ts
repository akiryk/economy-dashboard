import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { freshnessContracts } from '../src/features/data-freshness/freshnessRegistry'
import {
  evaluateManualSourceReminders,
  type ManualSourceReviewState,
} from '../src/features/data-freshness/manualSourceReminders'
import type { FreshnessContractId } from '../src/features/data-freshness/freshnessTypes'

interface ReviewFile { schemaVersion: 1; sources: ManualSourceReviewState[] }

function argument(name: string, fallback?: string): string {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] ?? '' : fallback ?? ''
}

async function json(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(path), 'utf8')) as unknown
}

function latestPeriod(value: unknown, property: 'date' | 'period'): string {
  if (typeof value !== 'object' || value === null || !('observations' in value) ||
    !Array.isArray(value.observations)) throw new Error('Dataset observations are missing')
  const periods = value.observations.flatMap((observation) =>
    typeof observation === 'object' && observation !== null && property in observation &&
      typeof observation[property] === 'string' ? [observation[property]] : [])
  const latest = periods.sort().at(-1)
  if (!latest) throw new Error(`Dataset has no ${property} periods`)
  return latest
}

const reviewFile = await json('config/manual-source-reviews.json') as ReviewFile
if (reviewFile.schemaVersion !== 1 || !Array.isArray(reviewFile.sources)) {
  throw new Error('Manual source review state is malformed')
}
const intervals = new Map<FreshnessContractId, number>()
for (const review of reviewFile.sources) {
  const contract = freshnessContracts[review.contractId]?.contract
  if (!contract || contract.kind !== 'irregular') {
    throw new Error(`${review.contractId} is not an irregular freshness contract`)
  }
  intervals.set(review.contractId, contract.reviewIntervalDays)
}

const reminders = evaluateManualSourceReminders({
  evaluatedAt: argument('evaluated-at', new Date().toISOString()),
  latestCpiPeriod: latestPeriod(
    await json('src/features/economic-series/data/headline-cpi-index-not-seasonally-adjusted.json'),
    'date',
  ),
  latestTable7Period: latestPeriod(
    await json('src/features/economic-series/data/inflation-contribution-history.json'),
    'period',
  ),
  reviews: reviewFile.sources,
  reviewIntervals: intervals,
})
const output = argument('output')
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), reminders }
if (output) {
  const outputPath = resolve(output)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
}
if (process.env.GITHUB_OUTPUT) {
  const summary = reminders.map(({ reason }) => reason).join(' | ')
  await appendFile(process.env.GITHUB_OUTPUT, [
    `actionable=${reminders.length > 0}`,
    `keys=${reminders.map(({ reminderKey }) => reminderKey).join(',')}`,
    `reason=${summary}`,
    '',
  ].join('\n'))
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
