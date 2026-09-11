import {
  visibleDatasetFreshnessRegistry,
} from '../../src/features/data-freshness/freshnessRegistry'
import { beaSavingDistributionOutputFile } from '../bea/savingRateDistribution'
import { hoamConfiguration } from '../atlantaFed/hoamWorkbook'
import {
  corporateProfitShareConfiguration,
  cpiSeriesConfiguration,
  fredSeriesConfigurations,
  householdComparisonConfiguration,
  payrollSeriesConfiguration,
  personalSavingRateConfiguration,
  productivitySeriesConfiguration,
  purchasingPowerSeriesConfiguration,
  tariffBurdenConfiguration,
  wageSeriesConfiguration,
} from '../fred/seriesConfigurations'
import type {
  RefreshExecution,
  RefreshSourceFamily,
  RefreshUnitDefinition,
} from './refreshUnit'

const dataPath = (name: string) => `src/features/economic-series/data/${name}.json`

function affectedDatasetIds(artifactPaths: readonly string[]): string[] {
  return visibleDatasetFreshnessRegistry
    .filter((dataset) => artifactPaths.includes(dataset.artifactPath))
    .map((dataset) => dataset.datasetId)
}

function unit(values: {
  id: string
  sourceFamily: RefreshSourceFamily
  sourceIds: readonly [string, ...string[]]
  artifactPaths: readonly [string, ...string[]]
  dependencyUnitIds?: readonly string[]
  execution?: RefreshExecution
}): RefreshUnitDefinition {
  return {
    ...values,
    affectedDatasetIds: affectedDatasetIds(values.artifactPaths),
    dependencyUnitIds: values.dependencyUnitIds ?? [],
    execution: values.execution ?? 'scheduled',
  }
}

const groupedFredSlugs = new Set([
  cpiSeriesConfiguration.headlineSource.slug,
  productivitySeriesConfiguration.growthSource.slug,
  'real-business-investment-growth',
  'real-business-investment-level',
])

const directFredUnits = fredSeriesConfigurations
  .filter((config) => !groupedFredSlugs.has(config.slug))
  .map((config) => unit({
    id: `fred-${config.slug}`,
    sourceFamily: 'fred',
    sourceIds: [config.providerSeriesId],
    artifactPaths: [config.outputFile],
  }))

export const refreshUnitRegistry: readonly RefreshUnitDefinition[] = [
  ...directFredUnits,
  unit({
    id: 'fred-cpi',
    sourceFamily: 'fred',
    sourceIds: [
      cpiSeriesConfiguration.headlineSource.providerSeriesId,
      cpiSeriesConfiguration.headlineMomentumSource.providerSeriesId,
      cpiSeriesConfiguration.coreSource.providerSeriesId,
    ],
    artifactPaths: [
      cpiSeriesConfiguration.headlineInflationOutputFile,
      cpiSeriesConfiguration.coreInflationOutputFile,
      cpiSeriesConfiguration.headlineMomentumOutputFile,
      cpiSeriesConfiguration.coreMomentumOutputFile,
      cpiSeriesConfiguration.headlineSeasonallyAdjustedInflationOutputFile,
      cpiSeriesConfiguration.headlineNotSeasonallyAdjustedLevelOutputFile,
      cpiSeriesConfiguration.headlineSeasonallyAdjustedLevelOutputFile,
    ],
  }),
  unit({
    id: 'fred-payroll-growth',
    sourceFamily: 'fred',
    sourceIds: [payrollSeriesConfiguration.providerSeriesId],
    artifactPaths: [
      payrollSeriesConfiguration.monthlyChangeOutputFile,
      payrollSeriesConfiguration.payrollGrowthOutputFile,
    ],
  }),
  unit({
    id: 'fred-real-wage-growth',
    sourceFamily: 'fred',
    sourceIds: [
      wageSeriesConfiguration.providerSeriesId,
      cpiSeriesConfiguration.headlineMomentumSource.providerSeriesId,
    ],
    artifactPaths: [
      wageSeriesConfiguration.nominalOutputFile,
      wageSeriesConfiguration.realOutputFile,
    ],
    dependencyUnitIds: ['fred-cpi'],
  }),
  unit({
    id: 'fred-purchasing-power',
    sourceFamily: 'fred',
    sourceIds: [
      purchasingPowerSeriesConfiguration.wageSource.providerSeriesId,
      purchasingPowerSeriesConfiguration.cpiSource.providerSeriesId,
    ],
    artifactPaths: [
      purchasingPowerSeriesConfiguration.wageSource.outputFile,
      purchasingPowerSeriesConfiguration.cpiSource.outputFile,
      purchasingPowerSeriesConfiguration.levelOutputFile,
      purchasingPowerSeriesConfiguration.rollingOutputFiles[48],
      purchasingPowerSeriesConfiguration.rollingOutputFiles[120],
      purchasingPowerSeriesConfiguration.rollingOutputFiles[240],
    ],
  }),
  unit({
    id: 'fred-household-income-spending',
    sourceFamily: 'fred',
    sourceIds: [
      householdComparisonConfiguration.incomeSource.providerSeriesId,
      householdComparisonConfiguration.spendingSource.providerSeriesId,
    ],
    artifactPaths: [
      householdComparisonConfiguration.incomeOutputFile,
      householdComparisonConfiguration.spendingOutputFile,
    ],
  }),
  unit({
    id: 'fred-corporate-profit-share',
    sourceFamily: 'fred',
    sourceIds: [
      corporateProfitShareConfiguration.profitsSource.providerSeriesId,
      corporateProfitShareConfiguration.gdpSource.providerSeriesId,
    ],
    artifactPaths: [corporateProfitShareConfiguration.outputFile],
  }),
  unit({
    id: 'fred-effective-tariff-burden',
    sourceFamily: 'fred',
    sourceIds: [
      tariffBurdenConfiguration.customsSource.providerSeriesId,
      tariffBurdenConfiguration.importsSource.providerSeriesId,
    ],
    artifactPaths: [tariffBurdenConfiguration.outputFile],
  }),
  unit({
    id: 'fred-personal-saving-rate',
    sourceFamily: 'fred',
    sourceIds: [personalSavingRateConfiguration.providerSeriesId],
    artifactPaths: [personalSavingRateConfiguration.outputFile],
  }),
  unit({
    id: 'fred-productivity',
    sourceFamily: 'fred',
    sourceIds: [productivitySeriesConfiguration.levelSource.providerSeriesId],
    artifactPaths: [
      productivitySeriesConfiguration.levelOutputFile,
      productivitySeriesConfiguration.growthOutputFile,
    ],
  }),
  unit({
    id: 'fred-business-investment',
    sourceFamily: 'fred',
    sourceIds: ['PNFIC1'],
    artifactPaths: [
      dataPath('real-business-investment-growth'),
      dataPath('real-business-investment-level'),
    ],
  }),
  unit({
    id: 'atlanta-fed-home-ownership-affordability',
    sourceFamily: 'atlanta-fed',
    sourceIds: ['HOAM national workbook'],
    artifactPaths: [hoamConfiguration.outputFile],
  }),
  unit({
    id: 'bls-category-cpi',
    sourceFamily: 'bls',
    sourceIds: ['CUUR0000SAH1', 'CUUR0000SA0E', 'CUUR0000SAF1'],
    artifactPaths: [
      dataPath('shelter-cpi-inflation'),
      dataPath('energy-cpi-inflation'),
      dataPath('food-cpi-inflation'),
    ],
  }),
  unit({
    id: 'bls-table-7-inflation-contributions',
    sourceFamily: 'bls',
    sourceIds: ['News Release Table 7 workbook'],
    artifactPaths: [
      dataPath('inflation-contribution-history'),
      dataPath('inflation-contributions'),
    ],
    execution: 'scheduled-nonblocking',
  }),
  unit({
    id: 'bea-saving-rate-distribution',
    sourceFamily: 'bea',
    sourceIds: ['joint_dist_summary.xlsx'],
    artifactPaths: [beaSavingDistributionOutputFile],
  }),
  unit({
    id: 'census-hud-housing-details',
    sourceFamily: 'census-hud',
    sourceIds: ['New Residential Construction multi-series CSV'],
    artifactPaths: [
      dataPath('housing-construction-details'),
      dataPath('housing-supply-composition'),
    ],
  }),
  unit({
    id: 'federal-reserve-core-goods-pce',
    sourceFamily: 'federal-reserve',
    sourceIds: ['FEDS Note Figure 5 data'],
    artifactPaths: [dataPath('core-goods-pce-inflation')],
  }),
  unit({
    id: 'federal-reserve-job-growth-breakeven',
    sourceFamily: 'federal-reserve',
    sourceIds: ['FEDS Note Figure 2 data', 'PAYEMS'],
    artifactPaths: [
      dataPath('estimated-breakeven-employment-growth'),
      dataPath('job-growth-breakeven-comparison'),
    ],
    execution: 'manual',
  }),
  unit({
    id: 'oecd-international-comparisons',
    sourceFamily: 'oecd',
    sourceIds: ['OECD Data Explorer comparison dataflows'],
    artifactPaths: [dataPath('international-comparisons')],
    execution: 'scheduled-nonblocking',
  }),
]
