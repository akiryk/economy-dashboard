import { useEffect, useState } from 'react'
import type { JobGrowthBreakevenDataset } from '../models/jobGrowthBreakeven'
import { localJobGrowthBreakevenRepository } from '../repositories/jobGrowthBreakevenRepository'
import { JobGrowthBreakevenSummary } from './JobGrowthBreakevenSummary'

type State =
  | { status: 'loading' }
  | { status: 'loaded'; dataset: JobGrowthBreakevenDataset }
  | { status: 'error' }

export function JobGrowthBreakevenCard() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true
    localJobGrowthBreakevenRepository.get()
      .then((dataset) => {
        if (active) setState({ status: 'loaded', dataset })
      })
      .catch((error: unknown) => {
        console.error('Failed to load job-growth breakeven data', error)
        if (active) setState({ status: 'error' })
      })
    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="status-message" role="status">Loading job-growth comparison…</p>
  }
  if (state.status === 'error') {
    return (
      <p className="status-message status-message--error" role="alert">
        The job-growth comparison could not be loaded.
      </p>
    )
  }
  return <JobGrowthBreakevenSummary dataset={state.dataset} />
}
