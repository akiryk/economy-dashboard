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
        const [activity, momentum, unemployment, payrolls, monthlyPayrollChange, primeAgeEmployment, claims] = await Promise.all([
          localEconomicSeriesRepository.getBySlug('labor-market-activity-index'),
          localEconomicSeriesRepository.getBySlug('labor-market-momentum-index'),
          localEconomicSeriesRepository.getBySlug('unemployment-rate'),
          localEconomicSeriesRepository.getBySlug('payroll-growth'),
          localEconomicSeriesRepository.getBySlug('monthly-payroll-change').catch(() => null),
          localEconomicSeriesRepository.getBySlug('prime-age-employment-ratio').catch(() => null),
          localEconomicSeriesRepository.getBySlug('initial-unemployment-claims-four-week-average').catch(() => null),
        ])
        if (!active) return
        const evaluationPeriod = new Date().toISOString().slice(0, 10)
        setState({ status: 'loaded', result: buildLaborBriefing({ activity, momentum, unemployment, payrolls, monthlyPayrollChange, primeAgeEmployment, claims }, evaluationPeriod) })
      } catch (error: unknown) {
        console.error('Failed to load Labor briefing data', error)
        if (active) setState({ status: 'error', message: 'The primary LMCI Labor data could not be loaded.' })
      }
    }
    void load()
    return () => { active = false }
  }, [])

  return state
}
