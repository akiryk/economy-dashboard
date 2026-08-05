import { describe, expect, it } from 'vitest'
import { classifyCapacityUtilization, formatCapacityUtilizationAnswer, formatCapacityUtilizationComparison } from './capacityUtilizationContext'

describe('capacity utilization context', () => {
  it('uses inclusive ±0.5-point neutral boundaries', () => {
    expect(classifyCapacityUtilization(78.9)).toBe('usual')
    expect(classifyCapacityUtilization(79.9)).toBe('usual')
    expect(classifyCapacityUtilization(78.899)).toBe('below')
    expect(classifyCapacityUtilization(79.901)).toBe('above')
  })
  it('formats all three direct answers', () => {
    expect(formatCapacityUtilizationAnswer(76.1)).toContain('more spare capacity')
    expect(formatCapacityUtilizationAnswer(79.4)).toContain('usual share')
    expect(formatCapacityUtilizationAnswer(81)).toContain('less spare capacity')
  })
  it('shows the latest difference and published benchmark', () => {
    expect(formatCapacityUtilizationComparison(76.1)).toBe('76.1% in use, about 3.3 percentage points below the 1972–2025 long-run average of 79.4%.')
  })
})
