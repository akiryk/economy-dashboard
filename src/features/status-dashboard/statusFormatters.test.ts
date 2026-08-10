import { describe, expect, it } from 'vitest'
import {
  formatClaims,
  formatCompactThousands,
  formatDashboardPeriod,
  formatNominalGdp,
} from './statusFormatters'

describe('status dashboard formatters', () => {
  it('formats positive, negative, and unchanged payroll values explicitly', () => {
    expect(formatCompactThousands(64)).toBe('+64k')
    expect(formatCompactThousands(-23)).toBe('−23k')
    expect(formatCompactThousands(0)).toBe('0k')
  })

  it('formats claims, nominal GDP, and cadence-aware periods compactly', () => {
    expect(formatClaims(221_250)).toBe('221k')
    expect(formatNominalGdp(32_475.21)).toBe('$32.5T')
    expect(formatDashboardPeriod('2026-04-01', 'quarterly')).toBe('Q2 2026')
    expect(formatDashboardPeriod('2026-07-01', 'monthly')).toBe('Jul 2026')
    expect(formatDashboardPeriod('2026-08-01', 'weekly')).toBe('Aug 1, 2026')
  })
})
