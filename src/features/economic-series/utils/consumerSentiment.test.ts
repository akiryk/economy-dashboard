import { describe, expect, it } from 'vitest'
import { createConsumerSentimentPlot, deriveConsumerSentimentContext } from './consumerSentiment'

describe('consumer sentiment context and line', () => {
  const observations = [
    { date: '2030-03-01', value: 80 }, { date: '2030-01-01', value: 100 },
    { date: '2030-04-01', value: 100 }, { date: '2030-05-01', value: null },
  ]
  it('sorts without mutation, uses the latest finite reading, and preserves null or absent months', () => {
    const context = deriveConsumerSentimentContext(observations)!
    expect(context.latest).toEqual({ date: '2030-04-01', value: 100 })
    expect(context.highest).toEqual({ date: '2030-01-01', value: 100 })
    expect(context.lowest).toEqual({ date: '2030-03-01', value: 80 })
    expect(context.observations[1]).toEqual({ date: '2030-02-01', value: null })
    expect(observations[0]?.date).toBe('2030-03-01')
    const plot = createConsumerSentimentPlot(context)
    expect(plot.paths).toHaveLength(2)
    expect(plot.paths[0]).not.toContain(' L')
    expect(plot.paths[1]).toContain(' L')
  })
  it.each([['highest', 120], ['lowest', 50]] as const)('updates the latest and %s on a future record', (extreme, value) => {
    const next = { date: '2030-06-01', value }
    const context = deriveConsumerSentimentContext([...observations, next])!
    expect(context.latest).toEqual(next)
    expect(context[extreme]).toEqual(next)
    expect(context.observations.at(-2)?.value).toBeNull()
  })
  it('handles a constant or single-point history without invalid chart geometry', () => {
    const context = deriveConsumerSentimentContext([{ date: '2030-01-01', value: 100 }])!
    const plot = createConsumerSentimentPlot(context)
    expect(plot.paths).toHaveLength(1)
    expect(plot.paths[0]).not.toMatch(/NaN|Infinity/)
    expect(plot.ticks.every(Number.isFinite)).toBe(true)
    expect(context.highest).toEqual(context.lowest)
  })
  it('returns no context for unavailable readings', () => {
    expect(deriveConsumerSentimentContext([])).toBeNull()
    expect(deriveConsumerSentimentContext([{ date: '2030-01-01', value: null }])).toBeNull()
  })
})
