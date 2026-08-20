import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  createOperationalDiagnostic,
  diagnosticCategories,
  type DiagnosticCategory,
} from '../src/features/data-freshness/operationalDiagnostics'
import type { FreshnessContractId, PipelineFailureStage } from '../src/features/data-freshness/freshnessTypes'

function argument(name: string, fallback?: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = index >= 0 ? process.argv[index + 1] : fallback
  if (!value) throw new Error(`--${name} is required`)
  return value
}

const category = argument('category')
if (!diagnosticCategories.includes(category as DiagnosticCategory)) {
  throw new Error(`Unknown diagnostic category: ${category}`)
}

const outputPath = resolve(argument('output'))
const occurredAt = new Date().toISOString()
const diagnostic = createOperationalDiagnostic({
  incidentKey: argument('incident-key', 'refresh-and-deploy'),
  datasetId: argument('dataset', 'visible-economic-datasets'),
  contractIds: argument('contracts', 'BEA-Q,BEA-M,BLS-EMP,BLS-CPI')
    .split(',') as FreshnessContractId[],
  category: category as DiagnosticCategory,
  stage: argument('stage') as PipelineFailureStage,
  occurredAt,
  latestDeployedObservation: null,
  latestKnownProviderObservation: null,
  retry: argument('retry', 'not-applicable') as
    'not-applicable' | 'will-retry' | 'retries-exhausted' | 'recovered-on-retry',
  reason: argument('reason'),
  workflowUrl: argument('workflow-url'),
})

const report = { schemaVersion: 1, generatedAt: occurredAt, diagnostics: [diagnostic] }
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
process.stdout.write(`${JSON.stringify(diagnostic)}\n`)
