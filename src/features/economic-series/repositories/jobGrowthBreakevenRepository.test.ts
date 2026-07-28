import { describe, expect, it } from 'vitest'
import { localJobGrowthBreakevenRepository } from './jobGrowthBreakevenRepository'

describe('localJobGrowthBreakevenRepository', () => {
  it('loads and runtime-validates the committed comparison dataset', async () => {
    const dataset = await localJobGrowthBreakevenRepository.get()
    expect(dataset.id).toBe('job-growth-breakeven-comparison')
    expect(dataset.observations.at(-1)).toMatchObject({
      status: 'unavailable',
      date: '2026-12-01',
    })
    expect(dataset.observations.find(({ date }) => date === '2026-06-01'))
      .toMatchObject({
        status: 'available',
        gapPercentagePoints: 0.6911808742970482,
      })
  })
})
