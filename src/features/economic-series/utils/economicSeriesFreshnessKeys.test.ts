import { describe, expect, it } from 'vitest'
import { economicSeriesFreshnessKeys } from './economicSeriesFreshnessKeys'

describe('economicSeriesFreshnessKeys', () => {
  it('includes the atomic housing-detail datasets on the visible housing card', () => {
    expect(economicSeriesFreshnessKeys({
      slug: 'housing-starts',
      supportingSlugs: [],
    })).toEqual([
      'housing-starts',
      'housing-construction-details',
      'housing-supply-composition',
    ])
  })

  it('preserves primary, supporting, and special visible dependencies', () => {
    expect(economicSeriesFreshnessKeys({
      slug: 'headline-cpi-inflation',
      supportingSlugs: ['core-cpi-inflation'],
      variant: 'inflation-drivers',
    })).toEqual([
      'headline-cpi-inflation',
      'core-cpi-inflation',
      'inflation-contributions',
    ])
  })
})
