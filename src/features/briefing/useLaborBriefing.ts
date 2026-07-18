import { useEffect, useState } from 'react'
import { localEconomicSeriesRepository } from '../economic-series/repositories/localEconomicSeriesRepository'
import { buildLaborBriefing, type LaborBriefingResult } from './laborBriefing'

export type LaborBriefingLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; result: LaborBriefingResult }
  | { status: 'error'; message: string }

export function useLaborBriefing(): LaborBriefingLoadState {
  const [state, setState] = useState<LaborBriefingLoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [unemployment, payrolls, primeAgeEmployment, claims] = await Promise.all([
          localEconomicSeriesRepository.getBySlug('unemployment-rate'),
          localEconomicSeriesRepository.getBySlug('payroll-growth'),
          localEconomicSeriesRepository.getBySlug('prime-age-employment-ratio').catch(() => null),
          localEconomicSeriesRepository.getBySlug('initial-unemployment-claims-four-week-average').catch(() => null),
        ])
        if (!active) return
        const evaluationPeriod = new Date().toISOString().slice(0, 10)
        setState({ status: 'loaded', result: buildLaborBriefing({ unemployment, payrolls, primeAgeEmployment, claims }, evaluationPeriod) })
      } catch (error: unknown) {
        console.error('Failed to load Labor briefing data', error)
        if (active) setState({ status: 'error', message: 'The primary Labor data could not be loaded.' })
      }
    }
    void load()
    return () => { active = false }
  }, [])

  return state
}
