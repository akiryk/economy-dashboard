import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { freshnessHealthStates, type FreshnessHealthState } from './freshnessTypes'

export interface PublicFreshnessState {
  datasetId: string
  state: FreshnessHealthState
  message: string
}

interface PublicFreshnessManifest {
  schemaVersion: 1
  generatedAt: string | null
  datasets: PublicFreshnessState[]
}

const FreshnessManifestContext = createContext<ReadonlyMap<string, PublicFreshnessState>>(new Map())
const FreshnessKeysContext = createContext<readonly string[]>([])

function parseManifest(value: unknown): PublicFreshnessManifest {
  if (typeof value !== 'object' || value === null || !('schemaVersion' in value) ||
    value.schemaVersion !== 1 || !('datasets' in value) || !Array.isArray(value.datasets)) {
    throw new Error('Public freshness manifest is malformed')
  }
  const datasets = value.datasets.map((dataset) => {
    if (typeof dataset !== 'object' || dataset === null ||
      !('datasetId' in dataset) || typeof dataset.datasetId !== 'string' ||
      !('state' in dataset) || typeof dataset.state !== 'string' ||
      !freshnessHealthStates.includes(dataset.state as FreshnessHealthState) ||
      !('message' in dataset) || typeof dataset.message !== 'string') {
      throw new Error('Public freshness dataset entry is malformed')
    }
    return dataset as PublicFreshnessState
  })
  return { schemaVersion: 1, generatedAt: null, datasets }
}

export function FreshnessProvider({ children, initialStates }: {
  children: ReactNode
  initialStates?: readonly PublicFreshnessState[]
}) {
  const [states, setStates] = useState<ReadonlyMap<string, PublicFreshnessState>>(
    new Map(initialStates?.map((state) => [state.datasetId, state]) ?? []),
  )
  useEffect(() => {
    if (initialStates) return
    let active = true
    void fetch(`${import.meta.env.BASE_URL}data-freshness.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Freshness metadata returned ${response.status}`)
        return response.json() as Promise<unknown>
      })
      .then(parseManifest)
      .then((manifest) => {
        if (active) setStates(new Map(manifest.datasets.map((state) => [state.datasetId, state])))
      })
      .catch((error: unknown) => {
        console.error('Freshness metadata could not be loaded.', error)
      })
    return () => { active = false }
  }, [initialStates])
  return <FreshnessManifestContext.Provider value={states}>{children}</FreshnessManifestContext.Provider>
}

export function FreshnessScope({ datasetKeys, children }: {
  datasetKeys: readonly string[]
  children: ReactNode
}) {
  return <FreshnessKeysContext.Provider value={datasetKeys}>{children}</FreshnessKeysContext.Provider>
}

const priority: Record<FreshnessHealthState, number> = {
  healthy: 0,
  'late-provider': 1,
  warning: 2,
  'unexpectedly-stale': 3,
  failure: 4,
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook consumes these private providers.
export function useScopedFreshness(): PublicFreshnessState | null {
  const states = useContext(FreshnessManifestContext)
  const keys = useContext(FreshnessKeysContext)
  return useMemo(() => keys.flatMap((key) => states.get(key) ?? [])
    .sort((left, right) => priority[right.state] - priority[left.state])[0] ?? null, [keys, states])
}
