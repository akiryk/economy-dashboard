import { describe, expect, it } from 'vitest'
import { classifyBusinessInvestmentDirection, formatBusinessInvestmentAnswer, formatBusinessInvestmentInterpretation } from './businessInvestmentContext'

describe('business investment context', () => {
  it('uses inclusive neutral boundaries', () => {
    expect(classifyBusinessInvestmentDirection(-0.2)).toBe('flat')
    expect(classifyBusinessInvestmentDirection(0.2)).toBe('flat')
    expect(classifyBusinessInvestmentDirection(-0.201)).toBe('less')
    expect(classifyBusinessInvestmentDirection(0.201)).toBe('more')
  })
  it('formats deterministic direction answers', () => {
    expect(formatBusinessInvestmentAnswer(1)).toMatch(/^Yes/)
    expect(formatBusinessInvestmentAnswer(-1)).toMatch(/^No/)
    expect(formatBusinessInvestmentAnswer(0)).toMatch(/^About the same/)
  })
  it('provides direction-specific cautious interpretations', () => {
    expect(formatBusinessInvestmentInterpretation(1)).toContain('replacement, automation')
    expect(formatBusinessInvestmentInterpretation(-1)).toContain('does not by itself prove weakening confidence')
    expect(formatBusinessInvestmentInterpretation(0)).toContain('offsetting strength and weakness')
  })
})
