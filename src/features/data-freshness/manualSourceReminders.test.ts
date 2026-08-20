import { describe, expect, it } from 'vitest'
import { completeSourceReview, evaluateManualSourceReminders } from './manualSourceReminders'

const intervals = new Map([['FED-RESEARCH', 92]] as const)
const review = {
  contractId: 'FED-RESEARCH' as const,
  lastReviewedAt: '2026-01-01T00:00:00.000Z',
  observedVersion: 'Figure 2 version A',
  sourceUrl: 'https://example.test/official',
}

describe('manual-source reminders', () => {
  it('raises one release-keyed Table 7 reminder and clears it after ingestion', () => {
    const outstanding = evaluateManualSourceReminders({
      evaluatedAt: '2026-08-13T00:00:00.000Z', latestCpiPeriod: '2026-07-01',
      latestTable7Period: '2026-06-01', reviews: [], reviewIntervals: new Map(),
    })
    expect(outstanding).toMatchObject([{
      reminderKey: 'BLS-T7:2026-07-01', kind: 'table-7-release', expectedPeriod: '2026-07-01',
    }])
    expect(evaluateManualSourceReminders({
      evaluatedAt: '2026-08-14T00:00:00.000Z', latestCpiPeriod: '2026-07-01',
      latestTable7Period: '2026-07-01', reviews: [], reviewIntervals: new Map(),
    })).toEqual([])
  })

  it('uses the same key on repeated daily checks and a new key for the next CPI release', () => {
    const evaluate = (evaluatedAt: string, latestCpiPeriod = '2026-07-01') =>
      evaluateManualSourceReminders({
        evaluatedAt, latestCpiPeriod, latestTable7Period: '2026-06-01',
        reviews: [], reviewIntervals: new Map(),
      })[0]?.reminderKey
    expect(evaluate('2026-08-13T00:00:00.000Z')).toBe(evaluate('2026-08-14T00:00:00.000Z'))
    expect(evaluate('2026-09-12T00:00:00.000Z', '2026-08-01')).toBe('BLS-T7:2026-08-01')
  })

  it('makes quarterly review due on the interval without calling old data a failure', () => {
    expect(evaluateManualSourceReminders({
      evaluatedAt: '2026-04-03T00:00:00.000Z', latestCpiPeriod: '2026-01-01',
      latestTable7Period: '2026-01-01', reviews: [review], reviewIntervals: intervals,
    })).toMatchObject([{
      kind: 'irregular-source-review', contractId: 'FED-RESEARCH',
      nextReviewAt: '2026-04-03T00:00:00.000Z',
    }])
  })

  it('completing a review advances the next due date', () => {
    const reviews = completeSourceReview(
      [review], 'FED-RESEARCH', '2026-04-03T00:00:00.000Z', 'Figure 2 version B',
    )
    expect(evaluateManualSourceReminders({
      evaluatedAt: '2026-07-03T23:59:59.000Z', latestCpiPeriod: '2026-01-01',
      latestTable7Period: '2026-01-01', reviews, reviewIntervals: intervals,
    })).toEqual([])
    expect(evaluateManualSourceReminders({
      evaluatedAt: '2026-07-04T00:00:00.000Z', latestCpiPeriod: '2026-01-01',
      latestTable7Period: '2026-01-01', reviews, reviewIntervals: intervals,
    })).toHaveLength(1)
  })
})
