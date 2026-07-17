import { describe, expect, it } from 'vitest'
import {
  formatHistoricalZoomPeriod,
  fullHistoricalZoomRange,
  historicalZoomRangeFromPercentages,
  isHistoricalZoomActive,
  moveHistoricalZoom,
  resizeHistoricalZoom,
  selectHistoricalZoomItems,
} from './historicalZoom'

const monthly = [
  { date: '1970-01-01', value: 1 },
  { date: '1970-02-01', value: null },
  { date: '1970-03-01', value: 3 },
  { date: '1970-04-01', value: 4 },
]

describe('historical zoom utilities', () => {
  it('starts with the complete selected preset and preserves missing observations', () => {
    const range = fullHistoricalZoomRange(monthly.length)
    expect(isHistoricalZoomActive(range, monthly.length)).toBe(false)
    expect(selectHistoricalZoomItems(monthly, range)).toEqual(monthly)
  })

  it('derives deterministic visible observations from slider percentages', () => {
    const range = historicalZoomRangeFromPercentages(34, 67, monthly.length)
    expect(selectHistoricalZoomItems(monthly, range)).toEqual(monthly.slice(1, 3))
    expect(isHistoricalZoomActive(range, monthly.length)).toBe(true)
  })

  it('moves and resizes a zoom window without leaving the preset', () => {
    const zoomed = { startIndex: 1, endIndex: 2 }
    expect(moveHistoricalZoom(zoomed, 'earlier', monthly.length)).toEqual({ startIndex: 0, endIndex: 1 })
    expect(moveHistoricalZoom(zoomed, 'later', monthly.length)).toEqual({ startIndex: 2, endIndex: 3 })
    expect(resizeHistoricalZoom(zoomed, 'out', monthly.length)).toEqual({ startIndex: 1, endIndex: 3 })
  })

  it('formats monthly and quarterly visible periods for people rather than percentages', () => {
    expect(formatHistoricalZoomPeriod(monthly, { startIndex: 0, endIndex: 2 }, 'monthly'))
      .toBe('Visible period: January 1970–March 1970')
    expect(formatHistoricalZoomPeriod(
      [{ date: '1970-01-01' }, { date: '1977-10-01' }],
      { startIndex: 0, endIndex: 1 },
      'quarterly',
    )).toBe('Visible period: 1970 Q1–1977 Q4')
  })

  it('formats annual visible periods through the shared zoom path', () => {
    expect(formatHistoricalZoomPeriod(
      [{ date: '2020-01-01' }, { date: '2025-01-01' }],
      { startIndex: 0, endIndex: 1 },
      'annual',
    )).toBe('Visible period: 2020–2025')
  })
})
