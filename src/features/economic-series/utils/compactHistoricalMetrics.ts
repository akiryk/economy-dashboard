import type { EconomicFrequency } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
} from './economicSeries'
import {
  classifyHistoricalBandPosition,
  type HistoricalBandDefinition,
  type HistoricalBandModel,
  type HistoricalBandPosition,
} from './historicalBandContext'
import { classifyCpiAssessment, formatCpiAssessment } from './cpiData'

export interface HistoricalBandHelpText {
  heading: string
  description: string
}

export interface CompactHistoricalMetricDefinition {
  seriesLabel: string
  frequency: EconomicFrequency
  historicalBands: HistoricalBandDefinition
  showZeroLine: boolean
  showLatestMarker: boolean
  interactiveDetails?: boolean
  referenceLines?: readonly { value: number; label: string }[]
  helpText: HistoricalBandHelpText
  zeroLineMeaning: string
  positionDescriptions: Readonly<
    Record<Exclude<HistoricalBandPosition, 'unavailable'>, string>
  >
  accessibleSummarySuffix?: (model: HistoricalBandModel) => string
}

const sharedBandHelp: HistoricalBandHelpText = {
  heading: 'Recent historical comparison: past 25 years',
  description:
    'The dark band shows the middle 50% of readings during this period. The lighter bands extend the range to the middle 80%. Readings outside the shaded area fall within the highest or lowest 10% of the comparison period.',
}

const gdpPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
}

const perCapitaPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
}

const productivityPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
}

const cpiPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
}

const unemploymentPositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low compared with the past 25 years',
  betweenOuterAndInnerLow: 'low compared with the past 25 years',
  insideInnerBand: 'near its typical range of the past 25 years',
  betweenInnerAndOuterHigh: 'high compared with the past 25 years',
  aboveOuterBand: 'very high compared with the past 25 years',
}

const primeAgeEmploymentPositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low compared with the past 25 years',
  betweenOuterAndInnerLow: 'low compared with the past 25 years',
  insideInnerBand: 'near its typical range of the past 25 years',
  betweenInnerAndOuterHigh: 'high compared with the past 25 years',
  aboveOuterBand: 'very high compared with the past 25 years',
}

export const realGdpCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Real GDP growth',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 20,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 20,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  helpText: sharedBandHelp,
  zeroLineMeaning: 'Zero separates increasing from decreasing real GDP.',
  positionDescriptions: gdpPositionDescriptions,
}

export const realGdpPerCapitaCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Real GDP per capita growth',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 20,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 20,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  helpText: sharedBandHelp,
  zeroLineMeaning:
    'Zero separates increasing from decreasing real output per person.',
  positionDescriptions: perCapitaPositionDescriptions,
}

export const laborProductivityGrowthCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Productivity growth',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 20,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 20,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  helpText: {
    ...sharedBandHelp,
    description: `${sharedBandHelp.description} The line shows year-over-year growth in output per hour.`,
  },
  zeroLineMeaning:
    'Zero separates higher from lower productivity than one year earlier.',
  positionDescriptions: productivityPositionDescriptions,
}

export const headlineCpiCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'CPI inflation',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  referenceLines: [{ value: 2, label: '2% policy reference' }],
  helpText: {
    heading: 'Recent historical comparison: past 25 years',
    description:
      'The dark band shows the middle 50% of CPI readings during this period. The lighter bands extend the range to the middle 80%. Readings outside the shaded area fall within the highest or lowest 10% of the comparison period. The thin 2% line is a policy reference. The Federal Reserve’s formal 2% inflation target applies to PCE inflation, not CPI.',
  },
  zeroLineMeaning: 'Zero separates rising from falling consumer prices.',
  positionDescriptions: cpiPositionDescriptions,
  accessibleSummarySuffix: (model) =>
    `${formatCpiAssessment(classifyCpiAssessment(model.latestObservation.value))} The 2% line is a policy reference; the Federal Reserve formally targets PCE inflation.`,
}

export const unemploymentCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Unemployment rate',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: false,
  showLatestMarker: true,
  helpText: {
    heading: 'Unemployment level and historical context',
    description:
      'The unemployment rate is the share of the labor force without a job and actively looking for work. The labor force includes employed people plus unemployed people who are available and have recently looked for work. Some people who want work are not counted if they are not actively looking. The line shows the latest five years. The dark band is the middle 50% and the lighter band is the middle 80% of monthly readings over the trailing 25 years. Lower readings occupy the lower historical bands; the bands describe frequency, not a target. A 12-month move of at least 0.3 percentage point is classified as rising or falling; smaller moves are little changed.',
  },
  zeroLineMeaning:
    'No zero line is shown because zero unemployment is not a realistic or meaningful reference.',
  positionDescriptions: unemploymentPositionDescriptions,
}

export const primeAgeEmploymentCompactDefinition:
CompactHistoricalMetricDefinition = {
  seriesLabel: 'Prime-age employment',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: false,
  showLatestMarker: true,
  interactiveDetails: true,
  helpText: {
    heading: 'Prime-age employment and historical context',
    description:
      'Prime age means ages 25–54, a range less affected by retirement and schooling than an all-age measure. The line shows the latest five years. The dark band is the middle 50% and the lighter band is the middle 80% of monthly readings over the trailing 25 years. Higher readings occupy the higher historical bands. The measure does not describe hours, pay, job quality, or why someone is not employed.',
  },
  zeroLineMeaning:
    'No zero line is shown because zero is not a meaningful reference for this metric.',
  positionDescriptions: primeAgeEmploymentPositionDescriptions,
}

const compactDefinitions: Readonly<
  Partial<Record<string, CompactHistoricalMetricDefinition>>
> = {
  'real-gdp-growth': realGdpCompactDefinition,
  'real-gdp-per-capita-growth': realGdpPerCapitaCompactDefinition,
  'labor-productivity-growth': laborProductivityGrowthCompactDefinition,
  'headline-cpi-inflation': headlineCpiCompactDefinition,
  'unemployment-rate': unemploymentCompactDefinition,
  'prime-age-employment-ratio': primeAgeEmploymentCompactDefinition,
}

export function getCompactHistoricalMetricDefinition(
  slug: string,
): CompactHistoricalMetricDefinition | null {
  return compactDefinitions[slug] ?? null
}

export function describeCompactHistoricalPosition(
  model: HistoricalBandModel,
  definition: CompactHistoricalMetricDefinition,
): string {
  const position = classifyHistoricalBandPosition(
    model.latestObservation.value,
    model,
  )
  return position === 'unavailable'
    ? 'unavailable relative to the historical bands'
    : definition.positionDescriptions[position]
}

export function createCompactHistoricalAccessibleSummary(
  model: HistoricalBandModel,
  definition: CompactHistoricalMetricDefinition,
): string {
  const first = model.recentObservations.find(({ value }) => value !== null)
  const recentPath = first?.value === null || first?.value === undefined
    ? 'No finite recent path is available.'
    : `The five-year line begins at ${formatPercentage(first.value)} in ${formatObservationPeriod(first.date, definition.frequency)} and ends at ${formatPercentage(model.latestObservation.value)}.`
  const observationUnit = definition.frequency === 'monthly' ? 'months' : 'quarters'
  const suffix = definition.accessibleSummarySuffix?.(model)
  return `${definition.seriesLabel} was ${formatPercentage(model.latestObservation.value)} in ${formatObservationPeriod(model.latestObservation.date, definition.frequency)}. The line shows the latest ${model.recentObservationCount} ${observationUnit}. ${recentPath} The trailing comparison runs from ${formatObservationPeriod(model.comparisonStart, definition.frequency)} through ${formatObservationPeriod(model.comparisonEnd, definition.frequency)}. The dark band marks the middle 50% of historical readings, and the lighter bands extend the range to the middle 80%. ${definition.zeroLineMeaning} The latest reading is ${describeCompactHistoricalPosition(model, definition)}.${suffix ? ` ${suffix}` : ''}`
}
