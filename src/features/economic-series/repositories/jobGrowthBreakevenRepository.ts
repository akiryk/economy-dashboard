import {
  validateJobGrowthBreakevenDataset,
  type JobGrowthBreakevenDataset,
} from '../models/jobGrowthBreakeven'

export interface JobGrowthBreakevenRepository {
  get(): Promise<JobGrowthBreakevenDataset>
}

export const localJobGrowthBreakevenRepository:
JobGrowthBreakevenRepository = {
  async get() {
    const module = await import(
      '../data/job-growth-breakeven-comparison.json'
    )
    return validateJobGrowthBreakevenDataset(module.default)
  },
}
