import type { EconomicObservation } from '../models/economicSeries'

export type CpiAssessmentState =
  | 'prices-falling'
  | 'very-low'
  | 'near-two-percent'
  | 'somewhat-high'
  | 'high'
  | 'unavailable'

export function classifyCpiAssessment(value: number | null): CpiAssessmentState {
  if (value === null || !Number.isFinite(value)) return 'unavailable'
  if (value < 0) return 'prices-falling'
  if (value < 1) return 'very-low'
  if (value <= 2.5) return 'near-two-percent'
  if (value <= 4) return 'somewhat-high'
  return 'high'
}

export function formatCpiAssessment(state: CpiAssessmentState): string {
  switch (state) {
    case 'prices-falling':
      return 'Consumer prices are falling.'
    case 'very-low':
      return 'Consumer prices are rising very slowly.'
    case 'near-two-percent':
      return 'Consumer-price inflation is near the 2% policy reference.'
    case 'somewhat-high':
      return 'Consumer prices are rising somewhat quickly.'
    case 'high':
      return 'Consumer prices are rising quickly.'
    case 'unavailable':
      return 'Consumer-price inflation is unavailable.'
  }
}

function formatPointMagnitude(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
}

function pointUnit(value: number): string {
  return Number(Math.abs(value).toFixed(1)) === 1
    ? 'percentage point'
    : 'percentage points'
}

function isAtReferenceAtDisplayPrecision(value: number): boolean {
  return Number(Math.abs(value).toFixed(1)) === 0
}

export function formatCpiPolicyReference(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null
  const difference = value - 2
  if (isAtReferenceAtDisplayPrecision(difference)) {
    return 'CPI inflation is at the 2% policy reference.'
  }
  return `CPI inflation is ${formatPointMagnitude(difference)} ${pointUnit(difference)} ${difference > 0 ? 'above' : 'below'} the 2% policy reference.`
}

export function formatPceTargetComparison(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null
  const difference = value - 2
  if (isAtReferenceAtDisplayPrecision(difference)) {
    return 'PCE inflation is at the Federal Reserve’s 2% target.'
  }
  return `PCE inflation is ${formatPointMagnitude(difference)} ${pointUnit(difference)} ${difference > 0 ? 'above' : 'below'} the Federal Reserve’s 2% target.`
}

export interface CpiPceObservation {
  date: string
  cpi: number | null
  pce: number | null
}

export function alignCpiPceObservations(
  cpi: readonly EconomicObservation[],
  pce: readonly EconomicObservation[],
): CpiPceObservation[] {
  const cpiByDate = new Map(cpi.map(({ date, value }) => [date, value]))
  const pceByDate = new Map(pce.map(({ date, value }) => [date, value]))
  return [...new Set([...cpiByDate.keys(), ...pceByDate.keys()])]
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({
      date,
      cpi: cpiByDate.get(date) ?? null,
      pce: pceByDate.get(date) ?? null,
    }))
}
