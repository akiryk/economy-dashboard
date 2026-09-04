import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseDashboardRefreshMetadata } from '../src/features/data-freshness/dashboardRefreshMetadata'

function argument(name: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  if (!value) throw new Error(`--${name} is required`)
  return value
}

export function withSuccessfulDataRefresh(
  current: unknown,
  refreshDate: string,
  options: { eventName: string; dataChanged: boolean },
) {
  if (!parseDashboardRefreshMetadata({
    schemaVersion: 1,
    lastSuccessfulDataRefreshDate: refreshDate,
  })) {
    throw new Error('--date must be a real calendar date in YYYY-MM-DD format')
  }

  const currentMetadata = parseDashboardRefreshMetadata(current)
  if (!currentMetadata) {
    throw new Error('Existing dashboard refresh metadata is malformed')
  }

  if (options.eventName === 'push' || !options.dataChanged) {
    return currentMetadata
  }

  return {
    schemaVersion: 1 as const,
    lastSuccessfulDataRefreshDate: refreshDate,
  }
}

async function main() {
  const filePath = resolve(argument('file'))
  const refreshDate = argument('date')
  const eventName = argument('event-name')
  const dataChanged = argument('data-changed')
  if (dataChanged !== 'true' && dataChanged !== 'false') {
    throw new Error('--data-changed must be true or false')
  }
  const current = JSON.parse(await readFile(filePath, 'utf8')) as unknown
  const next = withSuccessfulDataRefresh(current, refreshDate, {
    eventName,
    dataChanged: dataChanged === 'true',
  })
  await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}
