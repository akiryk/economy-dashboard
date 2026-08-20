import type { FreshnessContractId } from './freshnessTypes'

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
