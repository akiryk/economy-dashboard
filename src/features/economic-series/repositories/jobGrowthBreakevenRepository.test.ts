import { describe, expect, it } from 'vitest'
import productionData from '../data/job-growth-breakeven-comparison.json'
import { localJobGrowthBreakevenRepository } from './jobGrowthBreakevenRepository'

describe('localJobGrowthBreakevenRepository', () => {
  it('loads and runtime-validates the committed comparison dataset', async () => {
    const dataset = await localJobGrowthBreakevenRepository.get()
    expect(dataset.id).toBe('job-growth-breakeven-comparison')
    expect(dataset.observations).toEqual(productionData.observations)
  })
})
