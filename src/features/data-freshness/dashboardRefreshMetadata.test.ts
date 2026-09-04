import { describe, expect, it } from 'vitest'
import {
  formatDashboardHeading,
  parseDashboardRefreshMetadata,
} from './dashboardRefreshMetadata'

describe('dashboard refresh metadata', () => {
  it('formats the most recent successful substantive ingestion date', () => {
    expect(formatDashboardHeading({
      schemaVersion: 1,
      lastSuccessfulDataRefreshDate: '2030-02-03',
    })).toBe('U.S. Economy, February 3, 2030')
  })

  it.each([
    null,
    {},
    { schemaVersion: 2, lastSuccessfulDataRefreshDate: '2030-02-03' },
    { schemaVersion: 1, lastSuccessfulDataRefreshDate: 'not-a-date' },
    { schemaVersion: 1, lastSuccessfulDataRefreshDate: '2030-02-30' },
  ])('uses a neutral heading for missing or malformed metadata', (metadata) => {
    expect(parseDashboardRefreshMetadata(metadata)).toBeNull()
    expect(formatDashboardHeading(metadata)).toBe('U.S. Economy')
  })
})
