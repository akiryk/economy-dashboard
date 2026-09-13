import type { FreshnessContractId, PublicFreshnessState } from './freshnessTypes'

export interface PublicFreshnessManifest {
  schemaVersion: 1
  generatedAt: string | null
  datasets: PublicFreshnessState[]
}

export interface ManualSourceReviewState {
  contractId: FreshnessContractId
  lastReviewedAt: string
  observedVersion: string
  sourceUrl: string
}

export type ManualSourceReminder =
  | {
    reminderKey: string
    kind: 'table-7-release'
    contractId: 'BLS-T7'
    expectedPeriod: string
    reason: string
    sourceUrl: string
  }
  | {
    reminderKey: string
    kind: 'irregular-source-review'
    contractId: FreshnessContractId
    lastReviewedAt: string
    nextReviewAt: string
    observedVersion: string
    reason: string
    sourceUrl: string
  }

const manualDatasetIds = new Set([
  'inflation-contributions',
  'estimated-breakeven-employment-growth',
  'job-growth-breakeven-comparison',
  'core-goods-pce-inflation',
  'saving-rate-by-income-decile',
  'home-ownership-cost-share',
])

function reminderDatasetIds(reminder: ManualSourceReminder): readonly string[] {
  return reminder.contractId === 'BLS-T7'
    ? ['inflation-contributions']
    : reminder.contractId === 'FED-RESEARCH'
      ? ['estimated-breakeven-employment-growth', 'job-growth-breakeven-comparison', 'core-goods-pce-inflation']
      : reminder.contractId === 'BEA-IRR'
        ? ['saving-rate-by-income-decile']
        : ['home-ownership-cost-share']
}

export function withManualReminderStates(
  manifest: PublicFreshnessManifest,
  reminders: readonly ManualSourceReminder[],
  generatedAt: string,
): PublicFreshnessManifest {
  const states = new Map(manifest.datasets
    .filter((state) => !(manualDatasetIds.has(state.datasetId) && state.state === 'warning'))
    .map((state) => [state.datasetId, state]))
  for (const reminder of reminders) {
    const message = reminder.kind === 'table-7-release'
      ? 'The detailed inflation-category breakdown requires manual processing and may trail headline CPI.'
      : 'This research source is awaiting its scheduled official-source review.'
    for (const datasetId of reminderDatasetIds(reminder)) {
      if (!states.has(datasetId)) {
        states.set(datasetId, { datasetId, state: 'warning', message })
      }
    }
  }
  const datasets = [...states.values()]
    .sort((left, right) => left.datasetId.localeCompare(right.datasetId))
  const previous = [...manifest.datasets]
    .sort((left, right) => left.datasetId.localeCompare(right.datasetId))
  return {
    schemaVersion: 1,
    generatedAt: JSON.stringify(datasets) === JSON.stringify(previous)
      ? manifest.generatedAt
      : generatedAt,
    datasets,
  }
}

export interface ReminderEvaluationInput {
  evaluatedAt: string
  latestCpiPeriod: string
  latestTable7Period: string
  reviews: readonly ManualSourceReviewState[]
  reviewIntervals: ReadonlyMap<FreshnessContractId, number>
}

function addDays(isoTimestamp: string, days: number): string {
  const timestamp = Date.parse(isoTimestamp)
  if (!Number.isFinite(timestamp)) throw new Error(`Invalid review timestamp: ${isoTimestamp}`)
  return new Date(timestamp + days * 86_400_000).toISOString()
}

export function evaluateManualSourceReminders(
  input: ReminderEvaluationInput,
): ManualSourceReminder[] {
  if (!Number.isFinite(Date.parse(input.evaluatedAt))) throw new Error('Invalid reminder evaluation time')
  const reminders: ManualSourceReminder[] = []
  if (input.latestCpiPeriod > input.latestTable7Period) {
    reminders.push({
      reminderKey: `BLS-T7:${input.latestCpiPeriod}`,
      kind: 'table-7-release',
      contractId: 'BLS-T7',
      expectedPeriod: input.latestCpiPeriod,
      reason: `CPI has advanced to ${input.latestCpiPeriod}, while committed Table 7 contributions end at ${input.latestTable7Period}. Download and ingest the official workbook when available.`,
      sourceUrl: 'https://www.bls.gov/cpi/tables/supplemental-files/home.htm',
    })
  }
  for (const review of input.reviews) {
    const intervalDays = input.reviewIntervals.get(review.contractId)
    if (!intervalDays) throw new Error(`No irregular-source review interval for ${review.contractId}`)
    const nextReviewAt = addDays(review.lastReviewedAt, intervalDays)
    if (Date.parse(input.evaluatedAt) < Date.parse(nextReviewAt)) continue
    reminders.push({
      reminderKey: `${review.contractId}:${nextReviewAt}`,
      kind: 'irregular-source-review',
      contractId: review.contractId,
      lastReviewedAt: review.lastReviewedAt,
      nextReviewAt,
      observedVersion: review.observedVersion,
      reason: `${review.contractId} is due for its ${intervalDays}-day official-source review; an old observation alone is not a pipeline failure.`,
      sourceUrl: review.sourceUrl,
    })
  }
  return reminders
}

export function completeSourceReview(
  reviews: readonly ManualSourceReviewState[],
  contractId: FreshnessContractId,
  reviewedAt: string,
  observedVersion: string,
): ManualSourceReviewState[] {
  if (!Number.isFinite(Date.parse(reviewedAt))) throw new Error(`Invalid review timestamp: ${reviewedAt}`)
  if (!observedVersion.trim()) throw new Error('Observed source version is required')
  let found = false
  const updated = reviews.map((review) => {
    if (review.contractId !== contractId) return review
    found = true
    return { ...review, lastReviewedAt: reviewedAt, observedVersion: observedVersion.trim() }
  })
  if (!found) throw new Error(`Unknown manual review source: ${contractId}`)
  return updated
}
