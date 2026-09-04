import { describe, expect, it } from 'vitest'
import { withRefreshFailure } from './writePublicRefreshFailure'

describe('public refresh failure manifest', () => {
  it('preserves dataset notices and adds one sanitized dashboard failure', () => {
    expect(withRefreshFailure({
      schemaVersion: 1,
      generatedAt: null,
      datasets: [{
        datasetId: 'inflation-contributions',
        state: 'warning',
        message: 'Manual update pending.',
      }],
    }, '2026-09-04T17:00:00.000Z')).toEqual({
      schemaVersion: 1,
      generatedAt: '2026-09-04T17:00:00.000Z',
      datasets: [
        {
          datasetId: 'inflation-contributions',
          state: 'warning',
          message: 'Manual update pending.',
        },
        {
          datasetId: 'dashboard-refresh',
          state: 'failure',
          message: 'Data is possibly out of date.',
        },
      ],
    })
  })

  it('replaces a previous dashboard failure instead of duplicating it', () => {
    const result = withRefreshFailure({
      schemaVersion: 1,
      generatedAt: null,
      datasets: [{
        datasetId: 'dashboard-refresh',
        state: 'failure',
        message: 'Old message.',
      }],
    }, '2026-09-04T17:00:00.000Z')
    expect(result.datasets).toHaveLength(1)
    expect(result.datasets[0]?.message).toBe('Data is possibly out of date.')
  })
})
