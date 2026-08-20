/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { dashboardEconomicSeriesSlugs } from '../economic-series/repositories/dashboardEconomicSeriesRepository'
import { localEconomicSeriesSlugs } from '../economic-series/repositories/localEconomicSeriesRepository'
import { internationalMetricIds } from '../international-comparison/models/internationalComparison'
import {
  freshnessContracts,
  freshnessDatasetForSeriesSlug,
  visibleDatasetFreshnessRegistry,
} from './freshnessRegistry'

const visibleSourceFiles = [
  'src/pages/DashboardPage.tsx',
  'src/pages/StatusDashboardPage.tsx',
  'src/features/status-dashboard/GrowthLaborTiles.tsx',
  'src/features/status-dashboard/MarketsCreditTiles.tsx',
  'src/features/status-dashboard/RealWageStatusTile.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n')

describe('visible dataset freshness registry', () => {
  it('maps every series slug referenced by the research and status surfaces', () => {
    const repositorySlugs = [...localEconomicSeriesSlugs, ...dashboardEconomicSeriesSlugs]
    const visibleSlugs = repositorySlugs.filter((slug) =>
      visibleSourceFiles.includes(`'${slug}'`) || visibleSourceFiles.includes(`"${slug}"`))
    expect(visibleSlugs.length).toBeGreaterThan(40)
    for (const slug of visibleSlugs) {
      expect(freshnessDatasetForSeriesSlug(slug), slug).not.toBeNull()
    }
  })

  it('maps all five international measures to the OECD snapshot contract', () => {
    expect(internationalMetricIds).toHaveLength(5)
    expect(visibleDatasetFreshnessRegistry.find(
      ({ datasetId }) => datasetId === 'international-comparisons',
    )).toMatchObject({ contractIds: ['OECD'], surfaces: ['compare'] })
  })

  it('uses unique dataset IDs, existing artifacts, and defined contracts', () => {
    const ids = visibleDatasetFreshnessRegistry.map(({ datasetId }) => datasetId)
    expect(new Set(ids).size).toBe(ids.length)
    for (const definition of visibleDatasetFreshnessRegistry) {
      expect(() => readFileSync(definition.artifactPath, 'utf8'), definition.datasetId)
        .not.toThrow()
      for (const contractId of definition.contractIds) {
        expect(freshnessContracts[contractId], definition.datasetId).toBeDefined()
      }
    }
  })
})
