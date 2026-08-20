import { describe, expect, it } from 'vitest'
import {
  createOperationalDiagnostic,
  classifyOperationalFailure,
  diagnosticShouldNotify,
  transitionDiagnosticIncident,
  type DiagnosticCategory,
  type OperationalDiagnostic,
} from './operationalDiagnostics'

function diagnostic(
  category: DiagnosticCategory,
  overrides: Partial<OperationalDiagnostic> = {},
): OperationalDiagnostic {
  return createOperationalDiagnostic({
    incidentKey: 'economic-data-refresh',
    datasetId: 'economic-data-refresh',
    contractIds: ['BLS-CPI'],
    category,
    stage: 'retrieval',
    occurredAt: '2026-08-20T09:17:00.000Z',
    latestDeployedObservation: '2026-07-01',
    latestKnownProviderObservation: null,
    retry: 'not-applicable',
    reason: 'Controlled test incident.',
    workflowUrl: 'https://github.example/actions/runs/1',
    ...overrides,
  })
}

describe('operational diagnostic classification', () => {
  it.each([
    ['provider-not-advanced', 'provider-delay'],
    ['authentication-or-access', 'access-authentication-failure'],
    ['endpoint-not-found', 'endpoint-provider-change'],
    ['schema-or-parse', 'schema-parsing-failure'],
    ['validation-or-derivation', 'validation-derivation-failure'],
    ['persistence', 'persistence-write-failure'],
    ['verification', 'verification-test-failure'],
    ['commit-or-push', 'commit-push-failure'],
    ['deployment', 'deployment-failure'],
    ['manual-action', 'manual-action-required'],
    ['possible-discontinuation', 'lifecycle-warning'],
    ['unknown', 'unknown-failure'],
  ] as const)('classifies %s as %s', (signal, category) => {
    expect(classifyOperationalFailure(signal)).toBe(category)
  })

  it('classifies an exhausted transient retry as a repeated failure', () => {
    expect(classifyOperationalFailure('transient-network', 'retries-exhausted'))
      .toBe('repeated-refresh-failure')
  })

  it('suppresses provider delay and a transient failure that recovers on retry', () => {
    expect(diagnosticShouldNotify(diagnostic('provider-delay'))).toBe(false)
    expect(diagnosticShouldNotify(diagnostic('transient-provider-failure', {
      retry: 'recovered-on-retry',
    }))).toBe(false)
  })

  it.each([
    ['access-authentication-failure', 'retrieval'],
    ['schema-parsing-failure', 'parsing'],
    ['validation-derivation-failure', 'validation'],
    ['verification-test-failure', 'verification'],
    ['deployment-failure', 'deployment'],
    ['repeated-refresh-failure', 'retrieval'],
  ] as const)('alerts for actionable %s diagnostics', (category, stage) => {
    expect(diagnosticShouldNotify(diagnostic(category, { stage }))).toBe(true)
  })

  it('opens once, suppresses an unchanged duplicate, and records recovery', () => {
    const current = diagnostic('schema-parsing-failure')
    expect(transitionDiagnosticIncident(null, current, current.occurredAt).kind).toBe('opened')
    expect(transitionDiagnosticIncident(current, current, current.occurredAt)).toEqual({ kind: 'none' })
    expect(transitionDiagnosticIncident(current, null, '2026-08-21T09:17:00.000Z')).toEqual({
      kind: 'recovered',
      incidentKey: 'economic-data-refresh',
      recoveredAt: '2026-08-21T09:17:00.000Z',
    })
  })

  it('updates an existing incident when its diagnosis changes', () => {
    const previous = diagnostic('unknown-failure')
    const current = diagnostic('access-authentication-failure', {
      reason: 'The required provider credential was rejected.',
    })
    expect(transitionDiagnosticIncident(previous, current, current.occurredAt).kind).toBe('updated')
  })
})
