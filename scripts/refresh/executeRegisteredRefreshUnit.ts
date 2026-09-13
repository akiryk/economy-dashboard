import {
  executeRefreshUnits,
  type RefreshUnitRunner,
} from './executeRefreshUnits'
import type { RefreshUnitResult } from './refreshUnit'
import { refreshUnitRegistry } from './refreshUnitRegistry'

export async function executeRegisteredRefreshUnit({
  unitId,
  runner,
  maximumAttempts,
}: {
  unitId: string
  runner: RefreshUnitRunner
  maximumAttempts?: number
}): Promise<RefreshUnitResult> {
  const definition = refreshUnitRegistry.find(({ id }) => id === unitId)
  if (!definition) throw new Error(`Unknown refresh unit: ${unitId}`)

  const [result] = await executeRefreshUnits({
    units: [definition],
    runners: new Map([[unitId, runner]]),
    maximumAttempts,
  })
  return result!
}

export function logRefreshUnitResult(result: RefreshUnitResult): void {
  console.log(`REFRESH_UNIT_RESULT ${JSON.stringify(result)}`)
}
