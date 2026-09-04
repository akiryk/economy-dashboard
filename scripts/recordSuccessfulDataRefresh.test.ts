import { describe, expect, it } from 'vitest'
import { withSuccessfulDataRefresh } from './recordSuccessfulDataRefresh'

const priorRefresh = {
  schemaVersion: 1,
  lastSuccessfulDataRefreshDate: '2029-12-31',
}

describe('successful data refresh recording', () => {
  it('advances the durable date after a substantive refresh', () => {
    expect(withSuccessfulDataRefresh(priorRefresh, '2030-01-02', {
      eventName: 'schedule',
      dataChanged: true,
    })).toEqual({
      schemaVersion: 1,
      lastSuccessfulDataRefreshDate: '2030-01-02',
    })
  })

  it.each([
    { eventName: 'push', dataChanged: true, scenario: 'code-only deployment' },
    { eventName: 'schedule', dataChanged: false, scenario: 'unchanged refresh' },
  ])('preserves the prior date for a $scenario', ({ eventName, dataChanged }) => {
    expect(withSuccessfulDataRefresh(priorRefresh, '2030-01-02', {
      eventName,
      dataChanged,
    })).toEqual(priorRefresh)
  })

  it('rejects malformed existing state and impossible refresh dates', () => {
    const options = { eventName: 'schedule', dataChanged: true }
    expect(() => withSuccessfulDataRefresh({}, '2030-01-02', options))
      .toThrow('Existing dashboard refresh metadata is malformed')
    expect(() => withSuccessfulDataRefresh(priorRefresh, '2030-02-30', options))
      .toThrow('--date must be a real calendar date')
  })
})
